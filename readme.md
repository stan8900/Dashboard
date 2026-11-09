Residence Operations Dashboard
==============================

A single-page dashboard for residence forms and backend checks.

Run `npm install`, then `npm start`, and open `http://127.0.0.1:5500`.

Current workflows:

- Replacement keys: record issued and returned dates, then flag anything not returned within 7 days.
- Lockouts: record each time security or residence staff let a student into their room, then flag second and later lockouts as a £15 charge.
- Shortcuts: configure real form/backend links in `dist/config.js`.
- Login page: default access gate; saved staff initials persist until a refresh is requested.

Backend Excel sync:

- Set `REPLACEMENT_BACKEND_FILE_PATH` in `.env` to the synced workbook path on the laptop.
- Set `BACKEND_INITIALS=SJ` or the initials to filter by.
- The local server reads the latest file whenever the dashboard loads or refreshes.
![alt text](image.png)

## Twenty CRM alongside this dashboard

Twenty lives in `crm/` as a squashed Git subtree from
https://github.com/twentyhq/twenty.git (`main`), with no nested Git repository.
The dashboard's `package.json`, lockfile, dependencies, server, and `dist/`
remain separate. Continue running the dashboard from this directory:

```sh
npm install
npm start
```

Open http://127.0.0.1:5500. For Twenty, see
[setup, prerequisites, ports, and commands](docs/twenty-setup.md) and the
[actual verification results](docs/integration-verification.md).
Docker serves Twenty at port **3000**; source development uses **3000** for its
API and **3001** for its frontend. PostgreSQL **5432** and Redis **6379** are
internal in the main Compose stack and published locally by development targets.
None clashes with dashboard port **5500**. Keep root `.env` for the dashboard;
Twenty uses its own ignored environment files. A placeholder-only Docker
configuration is in [docs/twenty.env.example](docs/twenty.env.example).

The upstream Docker image runs a release, not your local source edits. Use the
source setup to customise Twenty code. No CRM data model or sync is built yet;
[docs/crm-plan.md](docs/crm-plan.md) proposes a future model.

### Updating Twenty

From the repository root, commit or otherwise safely set aside local changes
first. Back up Twenty's database, files, and encryption keys, then run:

```sh
git subtree pull --prefix=crm https://github.com/twentyhq/twenty.git main --squash
```

Resolve conflicts within `crm/`, review upstream migrations, environment changes,
Node/Yarn requirements, and licensing, and test both apps before using an update.
Customisations in `crm/` should be separate local commits for easier review.
Keep using subtree commands for future imports; do not clone into `crm/`.
A subtree pull updates source only; upgrading a Docker deployment also requires
choosing compatible image tags/configuration and following upstream migrations.
No remote push is needed for these local operations.

### Twenty licensing and intended use

Twenty is primarily **AGPL-3.0**; consult [crm/LICENSE](crm/LICENSE) for the
binding terms. Its current license also describes an application exception,
MIT-licensed packages, and separately licensed Enterprise code. Files marked
`/* @license Enterprise */` are commercial, including files under server billing
and enterprise modules; do not assume a directory's entire contents use one
license. Inspect file headers and package-level licenses before customising.

Treat this installation as **internal use only unless proper legal advice is
obtained** about wider deployment, distribution, or licensing. Internal use does
not automatically remove AGPL network-source obligations or grant Enterprise
rights. Obtain advice on those obligations before offering a modified service to
staff or other users. Vendoring Twenty does not by itself declare the existing
dashboard AGPL-licensed.
