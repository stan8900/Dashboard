# Running Twenty alongside the dashboard

Keep the dashboard at the repository root (`npm install`, `npm start`, port
5500). Twenty has its own workspace under `crm/`; never install its packages
from the dashboard root or combine the two package manifests or lockfiles.
No integration or student-data migration is implemented.

## Import status

Imported upstream commit `3fa43b99f3e29ed278011b620848388ef26b3802` from
`main` as a squashed subtree with no nested `.git`. The initial full-history
fetch was stopped because free disk space was about 250 MB. Once space rose to
about 1.7 GB, the import succeeded using a shallow prefetch followed by the
requested command:

```sh
git fetch --depth=1 --no-tags https://github.com/twentyhq/twenty.git main
git subtree add --prefix=crm https://github.com/twentyhq/twenty.git main --squash
```

The upstream snapshot is complete; its historical ancestors were not downloaded.
The dashboard history remains intact. A subtree is suitable; no submodule was
needed. See the verification record for startup results.

## Ports

| Service | Port | Notes |
| --- | --- | --- |
| Dashboard | 5500 | Existing root server |
| Twenty Docker web + API | 3000 | Compose publishes host 3000 to container 3000 |
| Twenty source API | 3000 | `/graphql` and `/rest` |
| Twenty source frontend | 3001 | Separate development UI |
| PostgreSQL | 5432 | Internal in main Compose; published on loopback by development Make target |
| Redis | 6379 | Internal in main Compose; published on loopback by development Make target |

Optional observability targets also publish ClickHouse 8123/9000, Grafana 4000,
and OpenTelemetry 4317/4318/13133. None uses 5500. Do not run both Twenty modes
at once on their default API port.

## Docker: run a released image

Requires a running Docker engine and Compose. After importing:

```sh
cd crm/packages/twenty-docker
# Only if .env does not already exist:
cp ../../../docs/twenty.env.example .env
```

Fill every TODO locally: select a tested image `TAG`, generate a unique database
password with `openssl rand -hex 32`, and an encryption key with
`openssl rand -base64 32`. Keep `SERVER_URL=http://localhost:3000` for local use.
Compare with upstream `.env.example` after updates. Never commit `.env` or keys.
Then:

```sh
docker compose config --quiet
docker compose up -d
docker compose ps
curl -f http://localhost:3000/healthz
# Stop services while retaining data:
docker compose down
```

Open http://localhost:3000. The stock Compose file uses named `db-data` and
`server-local-data` volumes, stored by Docker outside Git; local bind-mount/export
folders are ignored too. Back up the database, files, and encryption key before
upgrades. Do not remove volumes containing data.

These images do not include edits to `crm/` source. Use development mode for
code customisation; assess upstream Dockerfile build instructions separately
when packaging custom code.

Sources: [Compose guide](https://docs.twenty.com/developers/self-host/capabilities/docker-compose),
[upstream Compose](https://github.com/twentyhq/twenty/blob/main/packages/twenty-docker/docker-compose.yml),
[development Make targets](https://github.com/twentyhq/twenty/blob/main/packages/twenty-docker/Makefile).

## Source development: run your custom code

Use `crm/.nvmrc` and `crm/package.json` as version authorities. The imported
snapshot pins Node 26.12.1 and Yarn 4.18.1; this machine currently selects Node
20.15.0. The outer Yarn launcher is 1.22.22, but `yarn --version` inside
`crm/` correctly uses the vendored Yarn 4.18.1. Use a separate shell for
Twenty so the dashboard's Node environment stays independent. Run from `crm/`:

```sh
nvm install
nvm use
# Install/enable Corepack if needed, then use the pinned Yarn version.
corepack enable
make -C packages/twenty-docker postgres-on-docker
make -C packages/twenty-docker redis-on-docker
# Only if these destination .env files do not already exist:
cp packages/twenty-front/.env.example packages/twenty-front/.env
cp packages/twenty-server/.env.example packages/twenty-server/.env
yarn install --immutable
```

Review the copied configuration against the isolated development services.
The next command destroys/reseeds its target database: use only a disposable
Twenty development database, never a university or shared database.

```sh
yarn nx database:reset twenty-server
# Run each in a separate terminal from crm/:
yarn nx start twenty-server
yarn nx worker twenty-server
yarn nx start twenty-front
```

Visit http://localhost:3001. Native PostgreSQL/Redis can replace the two Make
targets; follow the upstream guide for database creation and credentials.
Use synthetic data for development.

Source: [Twenty local setup](https://docs.twenty.com/developers/contribute/capabilities/local-setup).

## Flash-drive runtime on this laptop

At the user's request, the Node 26.12.1 binary, Yarn downloads, global state,
install state, and dependency directories are placed beneath
`/Volumes/USB/jarvis-cache/tmp/residence-twenty-runtime`. The Node archive was
checked against Node's published SHA-256 checksum. The source remains in `crm/`.
Ignored `node_modules` symlinks point to the flash drive at the CRM root
and in its 19 workspaces; these are not committed machine-specific settings.
Keep the drive mounted.

From `crm/`, use this shell environment for installing or running source mode:

```sh
export TWENTY_RUNTIME_DIR=/Volumes/USB/jarvis-cache/tmp/residence-twenty-runtime
export PATH="$TWENTY_RUNTIME_DIR/node-v26.12.1-darwin-arm64/bin:$PATH"
export YARN_ENABLE_GLOBAL_CACHE=false
export YARN_CACHE_FOLDER="$TWENTY_RUNTIME_DIR/yarn-cache"
export YARN_GLOBAL_FOLDER="$TWENTY_RUNTIME_DIR/yarn-global"
export YARN_INSTALL_STATE_PATH="$TWENTY_RUNTIME_DIR/install-state.gz"
node .yarn/releases/yarn-4.18.1.cjs install --immutable
```

This does not change the dashboard's Node version. Generated workspace-specific
files can still need some internal disk space. Docker, database services, and
successful dependency installation remain separate prerequisites; see the
verification record before trying to start Twenty.
