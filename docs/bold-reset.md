# Empty Bold installation

The user requested a full reset, including accounts. The isolated local CRM
database (`127.0.0.1:55432/default`) was backed up privately to the flash drive
before its schemas were reset. The separate residence dashboard and its workbook
were not reset or changed.

The reset used upstream truncation, schema initialization, instance migrations
(including slow migrations), and cache flush, with **no demo seeder**. The first
attempt failed during a configuration edit; a subsequent rebuild encountered
laptop disk exhaustion. Generated server output was moved to flash APFS storage
and the upstream initialization/migration/cache commands then completed. No
upstream migration or entity schema was changed for this reset.

After initialization, read-only SQL checks confirmed:

| Check | Result |
| --- | --- |
| `core.user` rows | 0 |
| `core.workspace` rows | 0 |
| Workspace data schemas | 0 |
| Local Bold `/healthz` | HTTP 200 |
| Residence dashboard on port 5500 | HTTP 200 |

`SIGN_IN_PREFILLED=false` is set in the private native CRM environment and its
example. New users must create their own accounts. PostgreSQL remains the source
of truth for account records, password hashes, and refresh-token records.

The backup is outside Git under
`/Volumes/USB/jarvis-cache/tmp/residence-twenty-runtime/backups/`; it is not part of
the Railway upload. Retain or remove it according to the intended retention
policy. The native database/cache remain independent of the Railway services.
