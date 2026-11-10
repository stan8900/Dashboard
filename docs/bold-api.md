# Bold API for JARVIS

Bold already includes authenticated REST and GraphQL APIs. This integration uses
the existing API-token, role, workspace-isolation, record-permission, rate-limit
and access-log infrastructure; it does not add a second authentication system.

## Create the JARVIS token

1. Open **Settings → Members → Roles** and create a role named `JARVIS`.
2. Allow the role to be assigned to API keys/tokens.
3. Grant only the object operations JARVIS needs. A sensible starting point is:
   - Notes: read and update.
   - Tasks: read and update.
   - People: read.
   - Companies: read.
   - Calendar events: read only. Calendar events are synchronized system
     records in this version of Bold and are not UI-creatable.
4. Leave settings, roles, billing, user management, deletion and unrelated
   objects disabled.
5. Open **Settings → Developers → API → API Tokens**, choose **Create API
   token**, and apply the **JARVIS preset**.
6. Select the `JARVIS` role, review the 90-day expiration, and save.
7. Copy the token immediately. Bold shows the token secret only in the current
   browser session and does not store a recoverable token value.

The preset fills in the name and expiration only. It deliberately does not
choose an administrator role or silently grant permissions.

## Authentication

Send the token in the standard bearer header over HTTPS:

```http
Authorization: Bearer <BOLD_API_TOKEN>
```

The production base URL is:

```text
https://bold-production.up.railway.app
```

Do not put a token in a URL, source-control file, browser bundle or log. Store
it in JARVIS's secret store or an environment variable such as
`BOLD_API_TOKEN`.

## Verified REST routes

Bold exposes workspace objects through `/rest/<plural-object-name>`. The
following routes are backed by standard objects in this repository:

| Object          | Collection route       | Supported use                                                                 |
| --------------- | ---------------------- | ----------------------------------------------------------------------------- |
| Notes           | `/rest/notes`          | list, create, retrieve, update                                                |
| Tasks           | `/rest/tasks`          | list, create, retrieve, update                                                |
| People          | `/rest/people`         | search, retrieve, create/update if the role allows it                         |
| Companies       | `/rest/companies`      | search, retrieve, create/update if the role allows it                         |
| Calendar events | `/rest/calendarEvents` | retrieve synchronized events; creation depends on the connected calendar flow |

Common operations are:

```text
GET    /rest/tasks?limit=20
GET    /rest/tasks/<record-id>
POST   /rest/tasks
PATCH  /rest/tasks/<record-id>
```

The same pattern applies to notes, people and companies. The token's role is
checked on the server for every object and operation. An omitted UI button does
not grant API access.

### Minimal connection check

```python
import os
import requests

BASE_URL = "https://bold-production.up.railway.app"
TOKEN = os.environ["BOLD_API_TOKEN"]

response = requests.get(
    f"{BASE_URL}/rest/tasks?limit=20",
    headers={"Authorization": f"Bearer {TOKEN}"},
    timeout=15,
)

response.raise_for_status()
print(response.json())
```

### Create and complete a task

```python
created = requests.post(
    f"{BASE_URL}/rest/tasks",
    headers={"Authorization": f"Bearer {TOKEN}"},
    json={
        "title": "Follow up with David",
        "dueAt": "2026-11-11T18:00:00.000Z",
        "status": "TODO",
    },
    timeout=15,
)
created.raise_for_status()
task = created.json()["data"]["createTask"]

completed = requests.patch(
    f"{BASE_URL}/rest/tasks/{task['id']}",
    headers={"Authorization": f"Bearer {TOKEN}"},
    json={"status": "DONE"},
    timeout=15,
)
completed.raise_for_status()
```

Task status values are workspace metadata. Confirm the active values in Bold's
REST playground before hard-coding them in JARVIS.

### Filtering and pagination

Collection routes accept `limit`, `starting_after`, `ending_before`, `fields`,
`filter` and `order_by`. For example:

```text
GET /rest/tasks?filter=status[eq]:TODO&order_by=dueAt[AscNullsLast]&limit=20
```

List responses contain `data`, `pageInfo` and `totalCount`. Follow the returned
cursor rather than constructing cursors in JARVIS.

## Permission mapping

Bold represents integration permissions as a custom role rather than storing
string scopes on the token. The following names are useful when documenting a
JARVIS role:

| Requested scope   | Bold permission                                                           |
| ----------------- | ------------------------------------------------------------------------- |
| `notes:read`      | Notes → read records                                                      |
| `notes:write`     | Notes → update records; enable create through the object permission model |
| `tasks:read`      | Tasks → read records                                                      |
| `tasks:write`     | Tasks → update records; enable create through the object permission model |
| `calendar:read`   | Calendar events → read records                                            |
| `contacts:read`   | People → read records                                                     |
| `contacts:write`  | People → update records                                                   |
| `companies:read`  | Companies → read records                                                  |
| `companies:write` | Companies → update records                                                |

This role can also apply field-level and record-level restrictions. Keep
destructive record permissions disabled unless a routine explicitly requires
them.

## Scheduling metadata

Tasks natively expose `title`, `bodyV2`, `dueAt` and `status`. Bold does not
natively expose `timezone`, `externalSource` or `externalReferenceId` on tasks.
Add those as custom task fields before JARVIS sends them, or keep a private
JARVIS mapping from its reminder ID to the returned Bold task ID.

Saving `dueAt` does not by itself make JARVIS deliver a reminder. JARVIS remains
responsible for reminder execution.

## Rotation and revocation

The token detail page supports rotation and immediate revocation. Rotation
creates a new token and revokes the old token, so update JARVIS with the new
secret during the rotation flow. There is currently no automatic overlap
window. For a controlled overlap, create a second token with the same restricted
role, update and verify JARVIS, then revoke the old token.

Revocation and expiration are checked during authentication, so a revoked or
expired token stops working immediately.

## Audit and rate limits

When `API_ACCESS_LOG_ENABLED=true`, Bold writes structured access lines that
include the API-token identifier, workspace, HTTP method, route, status,
duration and request ID. Authorization headers and CRM record contents are not
included. Railway retains these lines according to the project's log settings.

API limits are enforced through Bold's existing usage-limit system and can be
scoped to an individual API token. A rejected REST request returns HTTP `429`
with `Retry-After` and rate-limit headers. JARVIS should use bounded exponential
backoff and must not retry authorization failures.

Typical errors are:

| Status      | Meaning                                           |
| ----------- | ------------------------------------------------- |
| `400`       | Invalid input, filter or cursor                   |
| `401`/`403` | Missing, invalid, expired or revoked token        |
| `404`       | Record not found or unavailable in this workspace |
| `429`       | Rate limit reached; respect `Retry-After`         |

Never create production tokens in automated tests. Tests should use temporary
workspaces and revoke their fixtures during cleanup.
