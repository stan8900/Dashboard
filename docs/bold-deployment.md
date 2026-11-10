# Bold welcome, accounts, and Railway

The Bold welcome screen uses the existing CRM email sign-in and account creation
flow. It keeps the monochrome design, Bold logo, workspace identity, invitations,
SSO, password reset, and two-factor authentication flows. It does not change the
separate residence dashboard's access gate or Excel integration.

## Account storage

Authentication remains in PostgreSQL: `core.user` stores the user record and
`passwordHash`, and `core.appToken` stores refresh-token records. Passwords are
hashed through the existing authentication service. Browser tokens are session
credentials, not the source of truth for account records. Keep `APP_SECRET` and
`ENCRYPTION_KEY` stable across deploys and identical on the API and worker.

There are no shared demo credentials. `SIGN_IN_PREFILLED=false` disables their
prefilling. Create your own account through the welcome screen. SMTP credentials
must be configured before relying on email invitations and password-reset
delivery; no mail provider has been invented or configured.

## Empty installation

The requested reset includes CRM users, workspaces, business records, settings,
and sessions. A private PostgreSQL backup was saved on the flash drive before
the reset. It is outside Git and is never uploaded to Railway. This backup still
contains the old installation's data; keep or dispose of it under your retention
policy.

For future resets, back up the correct isolated database, stop the CRM API and
worker, verify the database URL, and use the explicit **no-seed** configuration:

```sh
cd crm
yarn nx run twenty-server:database:reset:no-seed --output-style=static
```

The upstream default `database:reset` seeds demo accounts and records. Do not use
that default when an empty installation is required. Resetting is destructive;
do not run this against Railway or another shared database during normal updates.

## Railway topology

The dedicated **Bold** Railway project contains:

- `bold`: production backend serving the built Bold frontend; `/healthz` health
  check; port 3000 behind Railway HTTPS.
- `worker`: the same source and production image with
  `node dist/queue-worker/queue-worker`; no public domain. API startup owns
  migrations and cron registration, so both are disabled on the worker.
- `Postgres`: persistent account, workspace, and CRM data.
- `Redis`: cache and job queues.
- `uploads`: private persistent S3-compatible upload storage shared by both
  application services. The application proxies file access; the bucket is not
  public. `STORAGE_S3_FORCE_PATH_STYLE=false` supports Railway's virtual-hosted
  URLs; the upstream default stays `true` for existing installations.

Use [bold-railway.env.example](bold-railway.env.example) for the variable names.
Database/cache/bucket values use Railway references. Generate secrets privately;
do not paste populated environments into this repo. Local laptop `.env` files,
student data, and the dashboard workbook are not deployment inputs.

## Deploying reviewed local source without a Git push

```sh
python3 crm/deploy/railway/prepare-source.py /absolute/path/to/new-source-directory
python3 crm/deploy/railway/prepare-source.py /absolute/path/to/new-worker-directory --worker
railway up /absolute/path/to/new-source-directory --path-as-root \
  --project c941bc9c-855a-44e4-958f-3a2cc5b83c3c \
  --environment production --service bold --detach
railway up /absolute/path/to/new-worker-directory --path-as-root \
  --project c941bc9c-855a-44e4-958f-3a2cc5b83c3c \
  --environment production --service worker --detach
```

The destination must be new. The exporter copies tracked CRM source (stage new
reviewed files first), excludes local environments/builds/dependencies, and refuses unexpected
symlinks. It creates a production-only Dockerfile from upstream, ending at the
`twenty` stage for the web service and `twenty-server` for the worker. The worker
does not rebuild or include the frontend, avoiding an unnecessary frontend build
and its possible build timeout. It excludes the unused
all-in-one development stages, which declare Docker volumes that Railway rejects.
Configure each service explicitly before uploading. The helper previews the
non-secret settings by default; add `--apply` to set them through Railway's public
API. For the existing Bold project:

```sh
python3 crm/deploy/railway/configure-service.py web \
  --service c35487da-3189-48db-a9f5-58117078f147 \
  --environment 79609faa-41c9-4e4c-8c20-bc42573a7122 --apply
python3 crm/deploy/railway/configure-service.py worker \
  --service efeabf0f-c798-4d53-9cf5-7522bda10e11 \
  --environment 79609faa-41c9-4e4c-8c20-bc42573a7122 --apply
```

`web-settings.json` and `worker-settings.json` are inputs to that helper, not
Railway's deprecated `railway.json` format. No config-path environment variable
is needed. Railway detects the exported Dockerfile and keeps service settings
across uploads. Existing settings in other projects are not touched.

Inspect the exported source before uploading. Do not add credentials to tracked
source. Keep the exporter reviewed alongside upstream Dockerfile changes.
Poll `railway deployment list` and inspect `railway logs --build` and deployment
logs; an accepted upload does not by itself mean the app is healthy.

Railway web address: https://bold-production.up.railway.app

See the root README's AGPL/Enterprise licensing notes before wider use. Residence
data modelling remains a proposal in [crm-plan.md](crm-plan.md).
