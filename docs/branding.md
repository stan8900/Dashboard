# Bold display branding

Bold is the local CRM display brand. It uses the existing monochrome palette,
spacing, typography, and component layout. The new B monogram replaces the
product's default logo and app icons; uploaded workspace logos remain their
workspace's identity.

The display name and primary asset path live in
`crm/packages/twenty-front/src/modules/branding/constants/Branding.ts`.
SVG and 192/512-pixel PNG app icons live in
`crm/packages/twenty-front/public/images/branding/`.

Product-facing titles, onboarding/import copy, AI labels, system activity
author, and MCP display name use Bold. `brandProductText` applies the display
name after translation, preserving upstream message IDs and language catalogs.
Its first replacement preserves later upstream attribution in app descriptions.
Browser metadata, favicon defaults, and the installable web-app manifest use Bold.

Technical package names, imports, API/configuration keys, connector identifiers,
upstream update commands, license headers, and existing data remain unchanged.
Twenty company/legal/billing, marketplace-review, and official-service references
still identify their actual upstream provider; no Bold terms, contacts, or
privacy policy have been invented. The upstream license notices and README
licensing guidance remain applicable.

No dashboard files or backend database records are changed by this rebrand.

Verification: an isolated Chrome session rendered the welcome screen with title
`Sign in or Create an account | Bold`, Bold social metadata, the Bold SVG
favicon, and a Bold web-app manifest. All three brand assets returned HTTP 200;
no JavaScript page errors were reported. The separate dashboard returned HTTP
200 and its runtime files/manifests have no content changes. Existing translation
catalogs were preserved. Changed frontend sources passed Oxfmt formatting.
