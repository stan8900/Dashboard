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

The dependency directories and Nx caches live inside an expandable 24 GB APFS
disk image, `twenty-dependencies.sparseimage`, on the flash drive. exFAT's 128 KB
allocation units made the small-file install unnecessarily large and slow;
the APFS image provides normal small-file allocation. The drive itself retains
its existing format. Source/workspace links inside the image resolve back to
this checkout. Update those local links if you move the checkout.

After reconnecting the drive, mount the image before installing or running
Twenty (only if it is not already mounted):

```sh
export TWENTY_RUNTIME_DIR=/Volumes/USB/jarvis-cache/tmp/residence-twenty-runtime
hdiutil attach -nobrowse -mountpoint "$TWENTY_RUNTIME_DIR/dependencies" \
  "$TWENTY_RUNTIME_DIR/twenty-dependencies.sparseimage"
```

A local helper, `$TWENTY_RUNTIME_DIR/twenty-yarn`, selects the flash Node binary,
sets these environment variables, and runs Yarn from this checkout's `crm/`.
It is machine-specific and lives outside Git. It checks that the dependency
image is mounted, materialises an offloaded dashboard manifest when possible,
and repairs executable bits on generated dependency CLI launchers. This avoids
falling back to a globally installed Nest CLI; no global tools are modified. Alternatively, from `crm/`, use
this shell environment:

```sh
export TWENTY_RUNTIME_DIR=/Volumes/USB/jarvis-cache/tmp/residence-twenty-runtime
export PATH="$TWENTY_RUNTIME_DIR/node-v26.12.1-darwin-arm64/bin:$PATH"
export YARN_ENABLE_GLOBAL_CACHE=false
export YARN_CACHE_FOLDER="$TWENTY_RUNTIME_DIR/yarn-cache"
export YARN_GLOBAL_FOLDER="$TWENTY_RUNTIME_DIR/yarn-global"
export YARN_INSTALL_STATE_PATH="$TWENTY_RUNTIME_DIR/install-state.gz"
export NX_CACHE_DIRECTORY="$TWENTY_RUNTIME_DIR/dependencies/nx-cache"
export NX_WORKSPACE_DATA_DIRECTORY="$TWENTY_RUNTIME_DIR/dependencies/nx-workspace-data"
export NX_DAEMON=false
export TMPDIR="$TWENTY_RUNTIME_DIR/dependencies/tmp"
export LC_ALL=C
node .yarn/releases/yarn-4.18.1.cjs install --immutable
```

This does not change the dashboard's Node version. Generated workspace-specific
files can still need some internal disk space. Docker, database services, and
successful dependency installation remain separate prerequisites; see the
verification record before trying to start Twenty.

### Native services on the flash drive

The user selected native PostgreSQL 16 and Redis. PostgreSQL 16.15 and Redis
7.2.17 were built from checksum-verified upstream sources because current
Homebrew bottles do not support this Mac's macOS 14.1. Build/download logs and
sources are under the runtime directory; no Homebrew services were installed.
PostgreSQL includes `uuid-ossp`, `unaccent`, and `citext`. Its build omits optional
ICU, readline, and zlib support. This is an isolated development installation.

The new PostgreSQL cluster is `pgdata/`, using role `postgres`, UTF-8 with C
locale, and a generated password for TCP connections. Its password is stored
locally in `pg-password.txt`, `pgpass`, and the ignored server `.env`; never
commit these files.
The dashboard's `.env` is untouched. Redis uses `redis-data/` and `redis.conf`.
PostgreSQL uses TCP only because the drive's exFAT filesystem cannot host
Unix sockets. Both services bind to loopback only and use dedicated ports **55432** and
**16379**, respectively. These differ from upstream's default infrastructure
ports **5432** and **6379**. No existing PostgreSQL 14 cluster is used.

With `TWENTY_RUNTIME_DIR` set as above, start the existing native services:

```sh
LC_ALL=C "$TWENTY_RUNTIME_DIR/postgresql-16/bin/pg_ctl" \
  -D "$TWENTY_RUNTIME_DIR/pgdata" -l "$TWENTY_RUNTIME_DIR/postgres.log" start
LC_ALL=C "$TWENTY_RUNTIME_DIR/redis/bin/redis-server" "$TWENTY_RUNTIME_DIR/redis.conf"
"$TWENTY_RUNTIME_DIR/postgresql-16/bin/pg_isready" -h 127.0.0.1 -p 55432
"$TWENTY_RUNTIME_DIR/redis/bin/redis-cli" -h 127.0.0.1 -p 16379 ping
```

Use the ignored frontend/server `.env` files created for this local setup. For a
new machine, fill [the native template](twenty-native.env.example) with fresh
local values rather than reusing credentials. Run the source database setup and
start commands above only after a successful dependency install. The database
reset targets only the new disposable `default` development database.

Stop Twenty's frontend, worker, and API first, then stop native services before
unplugging the drive:

```sh
LC_ALL=C "$TWENTY_RUNTIME_DIR/postgresql-16/bin/pg_ctl" \
  -D "$TWENTY_RUNTIME_DIR/pgdata" -m fast stop
LC_ALL=C "$TWENTY_RUNTIME_DIR/redis/bin/redis-cli" -h 127.0.0.1 -p 16379 shutdown
```

Do not re-run `initdb` over an existing cluster. These services are started
manually; they are not registered to run at login. See the verification record
for the actual dependency, migration, and application startup results.

After stopping all Twenty processes, detach its dependency image before ejecting
the flash drive:

```sh
hdiutil detach "$TWENTY_RUNTIME_DIR/dependencies"
```

## Local compatibility patch

`crm/packages/twenty-shared/scripts/generateBarrels.ts` explicitly exits after
its synchronous `main()` completes. On this Node 26 setup, the unmodified
script finished writing identical outputs but retained idle toolchain workers,
which prevented Nx from advancing. The two-line fix is a separate local commit,
not part of the upstream squash. Review it when pulling upstream changes;
revisit the exit if upstream makes generation asynchronous.

## Validated laptop start commands

Use the prepared native flash setup on this laptop. After mounting the image and
starting PostgreSQL/Redis as above, run each command in its own terminal:

```sh
export TWENTY_RUNTIME_DIR=/Volumes/USB/jarvis-cache/tmp/residence-twenty-runtime
"$TWENTY_RUNTIME_DIR/twenty-yarn" nx start twenty-server --output-style=static
"$TWENTY_RUNTIME_DIR/twenty-yarn" nx worker twenty-server --output-style=static
"$TWENTY_RUNTIME_DIR/twenty-yarn" nx start twenty-front --output-style=static
```

The prepared development databases have already been migrated and seeded with
upstream's synthetic demo data. Do not reset them during normal startup. Keep
using root `npm start` for the separate dashboard at port 5500.

The remote DOM generator at
`crm/packages/twenty-front-component-renderer/scripts/remote-dom/generate-remote-dom-elements.ts`
has the same two-line synchronous-completion fix as the shared barrel generator.
Both finish writing unchanged generated outputs and then exit, allowing Nx to
continue despite idle Node 26 toolchain workers.

During setup, the dashboard manifest repeatedly became an unreadable macOS
placeholder (125-byte metadata, zero bytes read). Read-only materialisation
stopped recovering it. With explicit user approval, its exact committed 125
bytes were restored using a fresh local file after in-place hydration proved
unstable; Git hash `21c5b98acf0b91696c077888514e1de722dafd6c`
confirmed no content change. No dashboard dependency or server code was changed.
