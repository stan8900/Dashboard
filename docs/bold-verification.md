# Bold reset, welcome, and deployment verification

Published web app: https://bold-production.up.railway.app

## Verified behavior

- Local reset: zero PostgreSQL users, workspaces, workspace data schemas, and
  refresh-token records after the final no-seed reset. Isolated Redis was cleared;
  generated local files and the original database backup are private on flash.
- Authentication: disposable local signup stored a password hash and token in
  PostgreSQL. After workspace creation, a fresh browser signed in and resumed at
  `/create/profile`. All test accounts and data were then removed.
- Welcome: Bold logo, title, copy, favicon, manifest, and three brand assets
  rendered successfully. The live Railway page returned HTTP 200 with no browser
  page errors, fit a 390-pixel mobile viewport, and opened an empty email field.
- Dashboard: HTTP 200 at `http://127.0.0.1:5500`. Its package manifest, server,
  `dist/config.js`, and page assets have no changes from before this task.
- Local Bold API: HTTP 200 from `/healthz`; native API and worker restarted after
  the final reset. Frontend remains at port 3001.
- Production web: Railway reports a successful deployment; HTTPS `/` and
  `/healthz` returned HTTP 200. The cloud PostgreSQL instance is new and was
  initialized without demo seeding. No cloud accounts were created during tests;
  cloud account counts were not queried directly.
- Upload storage: private Railway bucket passed a temporary write/read/delete
  check using virtual-hosted S3 URLs. The temporary object was removed.
- Frontend TypeScript check passed (`tsgo --noEmit`); all 13 existing storage
  factory tests passed; changed sources passed Oxfmt. Native server and production
  web Docker builds completed successfully. Deployment Python and settings JSON
  passed syntax checks; `git diff --check` passed.

Railway reports **SUCCESS**, with one running replica each, for `bold`, `worker`,
`Postgres`, and `Redis`. The final worker deployment is
`eab9e4af-ed83-414b-a854-d95f841612b8`; it uses
`node dist/queue-worker/queue-worker`, disables its migrations/cron registration,
and has no web healthcheck. The web deployment is
`e3e949aa-f55f-4212-80a4-6c4330f558f5`.

## Setup corrections and limits

Railway initially rejected a Docker volume declaration in an unused upstream
development stage. The source exporter now keeps only production stages. It also
retains SDK source directories named `build` while excluding package output
directories. Railway rejected the deprecated config-file selector; explicit
service settings are now applied through its supported public API. No dashboard
restructure, Git push, credential import, or student-data import was performed.
Railway also reported dropping some initialization logs at its 500-logs/second
limit during an earlier startup; final service status checks passed.

SMTP is not configured. Choose a mail provider and sender before relying on email
invitations or password-reset delivery. New accounts use the app's normal signup
and workspace creation flow; there is no default shared password. Residence
custom objects remain a proposal, not an implemented feature.

## Files changed in this task

- `readme.md`
- `docs/twenty-native.env.example`
- `docs/twenty-setup.md`
- `docs/bold-reset.md`
- `docs/bold-deployment.md`
- `docs/bold-railway.env.example`
- `docs/bold-verification.md`
- `crm/packages/twenty-front/src/pages/auth/SignInUp.tsx`
- `crm/packages/twenty-front/src/modules/auth/sign-in-up/components/SignInUpStandardContent.tsx`
- `crm/packages/twenty-front/src/modules/branding/components/BoldWelcome.tsx`
- `crm/packages/twenty-server/src/engine/core-modules/file-storage/file-storage-driver.factory.ts`
- `crm/packages/twenty-server/src/engine/core-modules/twenty-config/config-variables.ts`
- `crm/deploy/railway/prepare-source.py`
- `crm/deploy/railway/configure-service.py`
- `crm/deploy/railway/web-settings.json`
- `crm/deploy/railway/worker-settings.json`

Untracked private runtime changes: native credential prefilling disabled, server
build output relocated to flash APFS, isolated database/cache reset, private
backups and test logs/screenshots, and Railway service configuration. These are
excluded from Git and deployment source uploads.
