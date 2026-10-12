# Validation record

Validated on 12 October 2026 (Asia/Calcutta) using Node.js 24.13.0.

- `npm test`: **13 passed, 0 failed**. Covers sign in, registration, privilege escalation prevention, authorization, input validation, claim CRUD, evidence CRUD, comments, assignment, evidence-gated verdicts, verdict resets, schema validation, stale-write rejection, and account-specific likes/bookmarks without verdict changes.
- `npm run build`: **passed**, React production bundle generated in `dist/`.
- Dependency installation audit: **0 reported vulnerabilities** at installation time.
- Browser check: sign in as reviewer, create an illustrative claim, add evidence, publish an Inconclusive verdict, and confirm updated dashboard counts.
- Visual inspection: mobile default viewport and 1440px desktop layout.
- Source and documentation formatted with Prettier.

**Live MongoDB verification (12 October 2026):** `npm run test:live` passed against the running MongoDB app. It verified sign-in, authorization, validation, claim CRUD, evidence CRUD, comments, reviewer assignment, evidence-gated verdicts, verdict reset, likes, and bookmarks. A separate database connection confirmed persisted writes after disconnecting and reconnecting. Temporary test records were removed and all 56 existing claims preserved. Server-restart persistence was not separately exercised.

**Browser checks:** category filters, search and empty states, claim submission, evidence submission, discussion posting, and navigation were checked. Likes and bookmarks survived page reload. Desktop and 390px mobile layouts were inspected, with no page overflow or browser console errors.

`preview.jpg` captures the temporary demo after the browser workflow test. That test record is not part of the initial seed. Demo state resets on server restart.

`social-preview.jpg` captures the new Instagram-inspired home feed connected to MongoDB.
