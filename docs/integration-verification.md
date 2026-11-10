# Twenty integration verification

## Step 1: dashboard baseline

Inspected the existing README (including its uncommitted deletion), root
`package.json`, `.env` (values kept private), `.env.example`, `dist/config.js`,
`server.js`, and dashboard scripts before changing application files.

- `npm install`: passed; root package manifest and lockfile unchanged.
- `npm start`: passed outside the execution sandbox, listening on port 5500.
- `GET http://127.0.0.1:5500/`: HTTP 200 (login page).
- `GET http://127.0.0.1:5500/index.html`: HTTP 200 (dashboard).
- `GET /api/replacement-backend`: HTTP 200 with an empty records list and the
  expected missing-workbook-configuration error. The existing `.env` does not
  specify `REPLACEMENT_BACKEND_FILE_PATH`. No student workbook was accessed.
- The first sandboxed startup failed with `listen EPERM`; the retry with local
  server access succeeded without changing the server.

Plan: import upstream as a squashed `crm/` subtree, keep runtime/dependencies
separate, document setup/update/licensing, append Brunel context, propose custom
objects without implementing them, then repeat the dashboard checks and attempt
Twenty setup using the available tools. No remote pushes.

The subtree import uses a temporary Git worktree so the pre-existing README edit
can remain untouched during import.

## Subtree and isolation

- Imported upstream `main` at `3fa43b99f3e29ed278011b620848388ef26b3802`.
- Initial full-history fetch stopped due to low disk space. After space became
  available, `git fetch --depth=1 --no-tags` prefetched the current snapshot,
  followed by the exact requested `git subtree add --prefix=crm
  https://github.com/twentyhq/twenty.git main --squash` command.
- At import, `crm/` matched upstream tree `2ac56cf68c6bb743e79f0ca356e081d809623b68`.
  A later compatibility fix is recorded below. No nested `.git`.
- All 43,171 upstream tracked entries are vendored. Generated runtime files
  are ignored; the compatibility fix is separate from the import commit.
- Dashboard `package.json`, `package-lock.json`, `server.js`, and `dist/` remain
  identical to baseline. Root `.env` is unchanged and ignored.
- The temporary import worktree was removed before bringing the commits into
  this checkout to avoid keeping two source copies on the internal disk.
- Inspected `crm/LICENSE` and Enterprise-marked files under server billing and
  enterprise modules; documented AGPL, application exception, MIT packages,
  and commercial-file distinctions. No license files were changed.

## Native flash-drive services

The user chose native PostgreSQL 16 and Redis on the flash drive. All downloads,
source builds, installed binaries, database/cache data, and credentials for
these new services are under:

`/Volumes/USB/jarvis-cache/tmp/residence-twenty-runtime`

- Node 26.12.1: downloaded for Darwin arm64, SHA-256 verified against Node's
  official checksum file; extracted binary reports `v26.12.1`.
- Yarn: vendored version reports `4.18.1` inside `crm/`; the outer system
  launcher reports `1.22.22`. Dashboard Node remains `v20.15.0`.
- Docker attempt: `docker compose up -d` failed with `docker: command not found`.
  Both upstream infrastructure Make targets failed with Error 127 for the same
  reason. No Docker engine or login services were installed.
- Current Homebrew bottles do not support this Mac's macOS 14.1. Built verified
  PostgreSQL 16.15 and Redis 7.2.17 source archives into flash-only prefixes.
- Redis initially failed with `Failed to configure LOCALE for invalid locale
  name`; restarting with `LC_ALL=C` succeeded. `redis-cli -p 16379 ping`: `PONG`.
- PostgreSQL initially failed because exFAT cannot bind Unix sockets. Configured
  the new cluster for TCP only at `127.0.0.1:55432`; `pg_isready`: accepting
  connections. Created disposable `default` and `test` databases, then loaded
  `uuid-ossp`, `unaccent`, and `citext` successfully. `SELECT version()` reports
  PostgreSQL 16.15. The pre-existing PostgreSQL 14 cluster is not used.
- New Twenty frontend/server `.env` files are ignored. Generated credentials
  are stored locally only; values were not printed or committed. The root
  dashboard `.env` was not copied or changed. No real student data was loaded.
- New services use separate ports 55432 and 16379. Twenty ports 3000/3001 and
  these native ports were free before setup. Dashboard remains on 5500.

## Dashboard verification after import

- Repeated `npm install`: passed after macOS materialised the existing root
  `package.json`, which had temporarily become a dataless file. The intermediate
  `EJSONPARSE` error was a local file-materialisation issue; no package contents
  were rewritten. Materialisation used `fileproviderctl materialize`.
- Existing `npm start` process continues to serve login and dashboard pages.
  Both return HTTP 200 and compare byte-for-byte equal to baseline responses.
- Backend endpoint still returns HTTP 200 and the expected missing-workbook
  configuration error. A real Excel sync cannot be verified without a workbook
  path; no workbook or real rows were fabricated.
- Syntax checks for `server.js`, `dist/app.js`, and `dist/login.js`: passed.
- Git diff confirms dashboard runtime files and root manifests unchanged.
- Verification covers HTTP responses, syntax, and file preservation, not an
  interactive browser test or real staff-data workflow.

## User choices and repository hygiene

The user confirmed keeping the existing README deletion and adding only new
sections. That deletion is now intentionally committed. README/config docs
retain TODOs for all unspecified Brunel details. The CRM model is a proposal;
no custom objects, import, synchronisation, or charge automation was built.
No remote push was performed. Commits separate inspection, import, runtime
isolation, update/licensing docs, Brunel context, data-model proposal, and setup
verification work. Upstream's own squash/merge commits are retained by subtree.

## Twenty dependency installation

- `yarn install --immutable` completed successfully using Node 26.12.1 and the
  vendored Yarn 4.18.1. Upstream reported YN0060/YN0002 peer-dependency warnings
  and YN0004 notices because `enableScripts: false` disables install scripts.
  No upstream dependency versions, lockfile, or script policy were changed.
- The first direct-exFAT link was stopped because the drive's 128 KB allocation
  units made the small-file dependency tree large and slow. Cache metadata
  counted 308,705 archive file entries (2.72 GiB content), with an estimated
  39.34 GiB file allocation even before directories and duplicate placements.
- Created and mounted a new expandable 24 GB APFS dependency-image file on the
  flash drive. Reused the verified package cache and installed dependencies
  into that image. Source stays in this checkout. Generated workspace links
  resolve back to the source; no populated `.env` files were mirrored.
- The image occupies approximately 4.6 GiB at installation completion. Removed
  only this task's incomplete exFAT dependency copies after switching storage.
- `twenty-yarn`, an uncommitted machine-local helper in the flash runtime,
  supplies the Node/Yarn, temp, and Nx cache environment for this checkout.
- Before invoking the database reset, verified its URL targets only
  `127.0.0.1:55432/default` with `NODE_ENV=development` and ClickHouse unset.

## Shared generator compatibility fix

The first database-reset attempt reached `twenty-shared` generation and stayed
alive indefinitely after synchronous output writes completed. Output timestamps
were unchanged after completion, Git showed no generated-content differences,
and a one-second process sample showed idle event loops/worker threads rather
than active generation. Independent tsx, module import, and Prettier formatting
checks passed.

Added two lines to `crm/packages/twenty-shared/scripts/generateBarrels.ts`: a
comment explaining the retained toolchain workers and `process.exit(0)` after
synchronous `main()` returns. Exceptions in `main()` still fail before that
exit. Re-running the actual generator returned exit 0; Git diff showed only the
two-line fix and no generated-content changes. Committed the fix separately as
`e8f8c257` so it can be reviewed/reconciled with future subtree pulls. No
residence objects or dashboard code were changed.

## CLI selection, database setup, and service startup

The first server build reported missing `@swc/cli`/`@swc/core`. Both modules loaded
successfully in isolation, and a direct local Nest build compiled all 10,126
server files. A diagnostic preload then showed Nx's shell had selected an old
global Nest CLI: the locally installed launcher was mode 0644, so the shell
skipped it. Repaired 35 generated CLI executable modes within the APFS dependency
image; no global tools or tracked source file modes were changed. The local
`twenty-yarn` helper repeats this bounded check before running commands.

Re-ran `nx database:reset twenty-server --skip-nx-cache --output-style=static`
with the repaired local tools. All dependency/server build targets, database
initialisation/migrations, cache flush, and `workspace:seed:dev` succeeded; the
full reset returned exit 0. Only upstream synthetic demo data was seeded.
The observed initial build failure explains Nx's later flaky-task warning.

Started the documented API, worker, and frontend commands. API health endpoint
`http://localhost:3000/healthz` returns HTTP 200 with `status: ok`. The worker
has a running `dist/queue-worker/queue-worker` Node process against the isolated
services. Frontend initially failed when esbuild read the dashboard manifest as
empty again. Read-only materialisation no longer recovered it. Prepared a
125-byte recovery file, verified its Git hash against the committed manifest,
and obtained explicit user approval before restoring those exact contents.
`npm install` passed again; Git confirms no manifest or lockfile content change.

The next frontend attempt completed individual shared/UI builds, then remained
alive after remote DOM generation finished. Applied the same two-line completion
fix to
`crm/packages/twenty-front-component-renderer/scripts/remote-dom/generate-remote-dom-elements.ts`.
The actual generator returned exit 0 from its own Yarn workspace and generated
no content differences. Committed separately as `51c077d2`.

Restarted the standard `nx start twenty-front` command after this fix. Twenty's
frontend now returns HTTP 200 at `http://localhost:3001/`. API, worker,
PostgreSQL, Redis, and dashboard remain separate running services. Neither a
submodule nor a nested Git repository was introduced. No remote was pushed.

## Final verification (10 November 2026, Europe/London)

- Dashboard login and `/index.html`: HTTP 200. Dashboard runtime files,
  root manifest, and lockfile match the pre-integration committed versions.
- Twenty API `/healthz`: HTTP 200, `status: ok`.
- Twenty frontend at port 3001: HTTP 200.
- An isolated headless Chrome session rendered `/welcome`, titled
  “Sign in or Create an account”, with the seeded Apple workspace welcome and
  Continue button. No JavaScript page errors were reported. Screenshot and
  browser result are stored in the local flash runtime. The browser was closed
  afterward; no existing browser profile or real student account was used.
- The worker runs `dist/queue-worker/queue-worker`; Redis responds `PONG` and
  PostgreSQL accepts authenticated connections on its dedicated local port.
- The manifest's stale placeholder state persisted after in-place recovery.
  Within the explicit recovery approval, atomically replaced it with a fresh
  local file containing the exact committed bytes, preserving mode 0644.
  Hash `21c5b98acf0b91696c077888514e1de722dafd6c` and Git diff confirmed no
  semantic/content change. Final Git checks passed.
- `.env` files and dependency symlinks are ignored. No populated `.env` is
  tracked. No nested `crm/.git`. No remote push.

### Changed tracked files

- `crm/`: complete upstream subtree import. Only two imported source files
  subsequently changed, each with a two-line synchronous completion fix:
  `packages/twenty-shared/scripts/generateBarrels.ts` and
  `packages/twenty-front-component-renderer/scripts/remote-dom/generate-remote-dom-elements.ts`.
- `readme.md`: new Twenty setup/update/licensing and Brunel context sections;
  kept the user's confirmed deletion of the original content.
- `.gitignore`: Twenty environments, dependencies, generated outputs/storage,
  and local dependency symlinks.
- `.env.example`: dashboard-only Brunel configuration guidance; no real values.
- `docs/twenty-setup.md`: Docker/source/native setup, ports, flash image/helper,
  service lifecycle, and compatibility fixes.
- `docs/twenty.env.example`: placeholder Docker configuration.
- `docs/twenty-native.env.example`: placeholder native configuration.
- `docs/crm-plan.md`: proposed residence custom objects, responsibilities, rules,
  and data-protection questions; no residence objects implemented.
- `docs/integration-verification.md`: baseline, evidence, errors, fixes, results.

### Local runtime files outside commits

Created ignored `crm/packages/twenty-front/.env`,
`crm/packages/twenty-server/.env`, and dependency-directory symlinks. New native
binaries, data, generated credentials, helpers, dependency image/caches, logs,
and smoke-test artifacts live under the flash runtime directory. No dashboard
`.env` changes. Services are left running; setup docs explain restart/stop and
safe image detach. Internal disk space remains low, so dependencies/data stay
on flash. Real workbook sync still requires the user's workbook path; hall
names, roles, contacts, and policy URLs remain explicitly marked TODO.
