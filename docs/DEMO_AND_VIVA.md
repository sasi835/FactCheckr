# Demonstration and viva

## Eight-minute demonstration

1. **Problem (45 seconds):** explain how a shared workspace prevents fragmented research and missing source context. State that people assess evidence; the app does not automatically detect truth.
2. **Interface (45 seconds):** show dashboard, responsive layout, sidebar routing, claim search and filters.
3. **Contributor workflow (2 minutes):** sign in as contributor; create a specific claim with a source URL; show rejected short fields; add evidence, edit it, add a comment; open the evidence library.
4. **Reviewer workflow (90 seconds):** sign out and enter reviewer account; find the submitted claim; assign yourself; publish an Inconclusive verdict with a rationale. Explain why no evidence prevents publication.
5. **Integrity and CRUD (1 minute):** edit evidence; show verification reopened. Delete an evidence item using the confirmation dialog. Update the claim, then delete a disposable claim.
6. **MongoDB integration (1 minute):** run the actual MongoDB mode, show the saved documents, restart the server, and confirm the claim remains. Demo mode is not evidence of database persistence.
7. **Architecture and tests (1 minute):** explain React → Express → MongoDB, run `npm test`, and show the rubric mapping.

## Viva questions

**Why this project?** Verification requires claims, context, sources, people, and reasoning. FactCheckr keeps them connected and visible.

**How is React used?** Reusable components render records and forms. Hooks manage user, form, loading, and filter state. React Router maps pages and claim IDs. A successful mutation refreshes shared data and updates the detail record.

**What is AJAX here?** Fetch performs asynchronous JSON requests without loading a new HTML page. Express responds with JSON and HTTP status codes.

**Why server validation if the browser already validates?** A caller can bypass HTML forms. Zod validates incoming fields and Mongoose validates persistence constraints.

**How does authentication differ from authorization?** JWT validation identifies the user; the server loads their current database role. Ownership and role checks decide whether they may edit, delete, assign, or publish. The registration API ignores attempts to register as a reviewer.

**Why embed evidence and comments?** The lab workload is small and each investigation is viewed as a whole. Separate collections and pagination would be appropriate for much larger discussions.

**What makes a verdict valid?** A reviewer chooses one of four labels, supplies reasoning, and links at least one evidence source. The app enforces the workflow, but source quality and truth remain human judgments.

**How are outdated verdicts handled?** Claim edits and evidence additions, edits, or deletions clear the previous verdict and rationale. Evidence changes move the claim into review; claim edits reset it to Unverified.

**What are the limitations?** Single workspace, no email verification/recovery, no full-text search index or pagination, no automated truth scoring, no independent immutable audit system. The starter sample records are illustrative. Demo data is ephemeral.

**What would you add next?** Invited workspaces, independent reviewer approval, version history, evidence attachments with safe upload handling, paginated queries, and dedicated administrator account provisioning.

## Manual acceptance checklist

- Open /claims directly and refresh; routing still works.
- Test at 390px and desktop widths; navigation, forms and tables remain usable.
- Tab through a modal; focus stays inside and Escape closes it.
- Check API 401 without a token and 403 for contributor verdict publication.
- Try an invalid source URL and an empty rationale.
- In two different browsers/sessions, use contributor and reviewer accounts; reload after the other account saves. There is no real-time push; refresh retrieves shared updates.
- In MongoDB mode, create/update/delete evidence and claims; inspect documents and test persistence after server restart.

## Assessment note

The supplied mark rows sum to 41 while the header says 40. Confirm normalization with the faculty before claiming a final marks allocation.
