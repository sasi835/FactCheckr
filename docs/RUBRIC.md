# Assessment rubric mapping

The supplied criteria total **41 marks** (5 + 5 + 5 + 6 + 6 + 6 + 5 + 3), although the paper states **40 marks**. Preserve the supplied category values and ask the faculty which item is normalized. No score is guaranteed; use the evidence below during assessment.

| Criterion            | Supplied marks | Project evidence                                                                                         | Demonstration                                                             |
| -------------------- | -------------: | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Problem definition   |              5 | README problem, objectives, scope, feasibility and evidence-triggered re-review                          | Explain misinformation workflow and why old verdicts reset                |
| HTML & CSS           |              5 | Semantic header/nav/main/section/table/form; reusable CSS; mobile media queries                          | Show desktop and narrow layouts; navigate with keyboard                   |
| JavaScript & AJAX    |              5 | Event handlers, controlled fields, state-based rendering, async Fetch JSON, client/server validation     | Search/filter, submit invalid input, add a source without reload          |
| ReactJS              |              6 | Badge, Avatar, Field, Modal, forms and tables; BrowserRouter; hooks and shared state                     | Navigate routes and demonstrate immediate record updates                  |
| Node.js              |              6 | Express HTTP server, REST verbs, JWT/role middleware, rate limits, centralized errors                    | Show 400/401/403/404 handling and authenticated API request               |
| MongoDB & CRUD       |              6 | Mongoose users/claims, embedded schemas, unique email, required/enum validation; claim and evidence CRUD | **Use MongoDB mode**, inspect records and prove persistence after restart |
| Integration          |              5 | React → Fetch JSON → Express → repository → MongoDB; shared records across accounts                      | Submit as contributor, review as reviewer, reload as contributor          |
| Documentation & viva |              3 | README, API docs, this mapping, demonstration guide, workflow tests                                      | Follow the viva guide and explain design choices                          |

The automated suite validates end-to-end API logic through the demo adapter and validates Mongoose schemas without a database. Actual MongoDB connectivity and persistence require a running database and the manual demonstration above.
