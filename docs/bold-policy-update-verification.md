# Personal-use branding and legal-entry update

The owner confirmed that Bold is for personal use and supplied six original
policy drafts. They are preserved separately in
`docs/legal/bold-policy-drafts.md`, version 0.1, **INTERNAL DRAFT, NOT FOR
PUBLICATION**. No proposed retention period, contact, legal identity, jurisdiction
clause, consent mechanism, or security commitment from those drafts is configured
or published by this change.

The public privacy and terms URLs contain only an unpublished-policy notice.
Auth links no longer direct users to vendor policies or assert acceptance of
those policies. Legal settings no longer generate a vendor-signed DPA. Community
promotions and cloud-specific privacy/certification assertions are replaced by
Bold resources. Emails use Bold copy, logo, footer, and default sender name.
New authenticator labels use Bold; existing secrets are unchanged. Remaining
product and MCP labels use Bold, while billing-provider references use neutral
wording. Required source licence, copyright, third-party author credits, and
technical package identifiers remain accurate.

## Local checks

- Frontend TypeScript check: passed.
- Email-template TypeScript check: passed.
- MCP setup tests: all 10 passed, including generated client payload names.
- Oxfmt: 53 changed/new source files formatted.
- Phone-sized browser check: both legal notices returned HTTP 200, fit a
  390-pixel viewport, and contained no internal draft or vendor policy text.
- Software notices retained upstream AGPL credit separately.
- Reviewed deployment exports exclude the internal root legal-draft file.
- Dashboard restarted unchanged and returned HTTP 200 on port 5500.

No database reset, account deletion, secret rotation, access restriction,
retention/deletion job, SMTP setup, external data import, or Git push was performed.

## Runtime and deployment notes

The flash dependency image was remounted after a USB remount interrupted local
checks. Generated dependency build outputs were moved to that APFS image. The
previously approved dashboard manifest bytes were restored atomically to resolve
the recurring macOS placeholder issue; its committed contents are unchanged. A
stale empty Git index lock with no open owner was removed. These recovery actions
did not discard source edits or data.
Git history reads also stalled on the macOS dataless `.git/shallow` file. Its
original single import boundary, `3fa43b99f3e29ed278011b620848388ef26b3802`, was
validated against the stored commit and restored on a fresh inode, with the old
placeholder retained as a Git-internal backup. No commits or branch history were
rewritten.

The web export reuses the previous complete source snapshot with the reviewed
tracked CRM changes overlaid. The worker export selects the production
server-only target and excludes frontend packages, preventing an unnecessary
frontend build. New source must be staged before the tracked-only exporter runs.

An earlier worker attempt (`eab9e4af-ed83-414b-a854-d95f841612b8`) subsequently
failed with a build deadline/exit 137 and retained the prior running deployment.
The earlier verification report's running-service check did not establish that
this particular attempt had completed. This update checks the exact new
deployment IDs, separately from the service's older active deployment.

Current update targets:

- Web image build: `1bc4d087-65de-4500-8f1a-6641c65a7479`.
- Web image-only redeploy: `83be0759-1fe0-4588-b3c7-d9aa2e4822ae`.
- Worker: `072df897-579c-4946-b1cc-329d36924c04`.

The web listener used `NODE_PORT=3000`, but Railway's health-check `PORT` was
unset. Explicitly setting `PORT=3000` and redeploying the already-built image
resolved the startup routing check without another source build. Both ports are
now recorded in the placeholder environment and setup documentation.

## Final live browser result

At https://bold-production.up.railway.app, an isolated browser verified:

- The welcome title uses Bold and the auth footer links directly to
  `/legal/privacy.html` and `/legal/terms.html`.
- The welcome footer has no `twenty.com` links.
- Both public legal URLs return HTTP 200 with only the unpublished-policy notice.
- Both notices fit a 390-pixel viewport and contain no internal draft text,
  Uzbekistan-law draft, TODO register, retention proposal, or vendor policy.
- Requesting `/docs/legal/bold-policy-drafts.md` does not expose the internal file.
- No browser page errors occurred; no account or business record was created.

The new worker completed successfully and its exact deployment logs confirm
BullMQ processing cron jobs. Required upstream licence and attribution notices
remain separately accessible; their presence is intentional.

Final Railway state: web `83be0759-1fe0-4588-b3c7-d9aa2e4822ae` and worker
`072df897-579c-4946-b1cc-329d36924c04` both report **SUCCESS** and are the active
images with one running replica each. PostgreSQL and Redis also remain running.
