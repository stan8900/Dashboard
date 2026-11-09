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
