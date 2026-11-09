# Proposed Brunel residence model in Twenty

Proposal only: no custom objects, automation, imports, API connections, or
changes to the dashboard have been built. Validate custom-field, relationship,
permissions, and automation support against the chosen Twenty version before
implementation.

## Custom objects and relationships

| Object | Proposed fields | Relationships |
| --- | --- | --- |
| Student | Internal ID; unique student number; name only if needed; active status; optional approved university email | Many replacement keys and lockouts; current room optional |
| Hall | Internal ID; approved hall name/code; optional complex | Many rooms |
| Room | Internal ID; hall; flat identifier if applicable; room number; active status | Belongs to one hall; referenced by events |
| Replacement Key | Internal ID; source system + stable source record ID; student; room at issue; issued date; returned date (nullable); item/key-set reference; issuing/receiving staff identifiers and initials | Belongs to student and room |
| Lockout | Internal ID; source system + stable source record ID; student; room at event; event date/time; staff identifier and initials; staff role; sequence number; proposed charge in GBP; review status | Belongs to student and room |

Use the student number as text to preserve leading zeros; never use names as
unique keys. Scope room uniqueness to hall + flat + room. Keep historical event
room links when a student moves. If occupancy history is required, propose a
separate Occupancy object with student, room, start date, and end date.
Hall/residence names and role values remain TODO; do not treat existing demo
lists as a confirmed Brunel inventory. Staff initials are display/filter values,
not reliable authenticated identities.

## Business rules to preserve

- Replacement keys: due date = issued date + 7 days. Flag an unreturned item
  once the seven-day window has elapsed. Returned items are no longer currently
  overdue; retain dates for any historical late-return reporting. Confirm the
  exact boundary, timezone, and date-only handling with staff before implementing
  CRM rules; compare against existing dashboard behavior without changing it.
- Lockouts: sequence events per student chronologically. First event has a £0
  proposed charge; every second and subsequent event has a £15 proposed charge
  (GBP 1,500 pence). Recalculate affected sequence/charge values on backdated
  inserts, edits, or deletion; break equal-time ties with a stable record ID.
  Keep a reviewed charge decision separate from a computed suggestion. Do not
  automatically collect money or overwrite already approved charges.
- TODO: confirm the lockout counting period, any reset between academic years,
  exceptions/waivers, tie handling, and who approves charges. Do not invent a
  reset period. The existing dashboard counts the records it currently holds.
- TODO: confirm policy links, retention periods, approved hall list, staff roles,
  escalation contacts, and which system owns each field.

A time-dependent overdue flag needs a daily scheduled evaluation or a query/view
that evaluates today's date; an issued-date formula alone does not guarantee a
stored status updates. Model cross-record lockout counts using a validated
workflow/service if Twenty cannot express them directly. Handle concurrent events
and idempotent imports before treating a count as authoritative.

## Dashboard and CRM responsibilities

Keep current form/backend shortcuts in `dist/config.js`, the login gate and
saved initials, existing replacement/lockout entry and flags, browser-held
records, and Excel backend reads in the dashboard. Its server continues to read
the local synced workbook and filter by `BACKEND_INITIALS`. No change to forms,
workbook paths, local storage, or staff behavior is proposed for this phase.

Twenty could later hold central student/room reference records, related key and
lockout histories, staff-authorised shared views, reminders, and charge-review
queues. Decide ownership and reconcile duplicates before any migration. A later
integration should use authenticated server-side API access, stable source IDs,
auditable changes, retries, and explicit conflict handling. Do not put CRM API
tokens in `dist/config.js`, browser storage, or Git. Keep Twenty operationally
separate until staff accept a tested migration and rollback plan.

## Student data protection (UK GDPR)

Student IDs, room assignments, key issues, and lockout histories are personal
data. The following are design questions for Brunel's data protection team, not
a finding that this proposed system is compliant:

- Confirm the controller, purpose, lawful basis, and notices; collect only the
  fields needed for residence operations. Avoid copying full workbook rows or
  adding sensitive free-text notes.
- Agree access by role and hall, least privilege, authenticated staff identity,
  audit trails, and access review. Test permissions in the selected Twenty
  edition; the dashboard's initials gate is not a substitute for CRM access
  controls or network restrictions.
- Set retention/deletion rules covering records, exports, browser storage,
  backups, and logs; plan correction and subject-access requests.
- Assess hosting location, processors/contracts, international transfers,
  encryption, backup restoration, credential storage, and incident procedures.
  Ask whether a DPIA is needed before importing real student data.
- Use synthetic records for development. Require staff review of charge flags
  and a correction/appeal process before adverse action.

Reference for discussion: [ICO UK GDPR principles](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/).
