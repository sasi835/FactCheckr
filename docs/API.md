# REST API

Base URL: `http://127.0.0.1:4000/api`. JSON request/response bodies. All endpoints except health, login, and registration require `Authorization: Bearer <token>`.

| Method | Path                             | Purpose                                                 |
| ------ | -------------------------------- | ------------------------------------------------------- |
| GET    | /health                          | Runtime storage mode                                    |
| POST   | /auth/register                   | Create contributor: name, email, password               |
| POST   | /auth/login                      | Sign in: email, password; returns token and public user |
| GET    | /auth/me                         | Current user                                            |
| GET    | /users                           | Public collaborator list                                |
| GET    | /claims                          | List; optional q, status, category query filters        |
| POST   | /claims                          | Create claim                                            |
| GET    | /claims/:id                      | Read complete claim                                     |
| PUT    | /claims/:id                      | Replace editable claim fields; author/reviewer only     |
| DELETE | /claims/:id                      | Delete claim; author/reviewer only                      |
| POST   | /claims/:id/evidence             | Add evidence; resets verdict                            |
| PUT    | /claims/:id/evidence/:evidenceId | Edit evidence; evidence author/reviewer only            |
| DELETE | /claims/:id/evidence/:evidenceId | Delete evidence; evidence author/reviewer only          |
| POST   | /claims/:id/comments             | Add discussion comment                                  |
| PUT    | /claims/:id/social               | Toggle current user's like or saved bookmark             |
| PUT    | /claims/:id/review               | Assign reviewer or publish verdict; reviewer only       |

Claim input:

Social input: `{ "action": "like" }` or `{ "action": "save" }`. Returns the updated claim. Likes and saved bookmarks persist per account; these actions do not change verification status or verdicts.

```json
{
  "title": "A specific statement that can be investigated",
  "description": "Original context and background of at least 20 characters.",
  "category": "Science",
  "sourceUrl": "https://example.org/source",
  "priority": "High"
}
```

Evidence input:

```json
{
  "title": "Primary research source",
  "url": "https://example.org/research",
  "note": "Relevant findings and their limitations.",
  "stance": "Context"
}
```

Review input (assignment or verdict):

```json
{ "reviewer": "reviewer-user-object-id" }
```

```json
{
  "verdict": "Inconclusive",
  "rationale": "The current evidence does not resolve the statement with sufficient confidence."
}
```

Categories: Science, Technology, Health, Environment, Politics, Other. Priorities: Low, Medium, High. Stances: Supports, Contradicts, Context. Verdicts: True, False, Misleading, Inconclusive. Verdicts require at least one evidence item and rationale of at least 20 characters.

Errors: `{ "message": "Explanation" }`; 400 invalid input, 401 unauthenticated/expired token, 403 forbidden role/ownership, 404 missing resource, 409 duplicate email or concurrent modification, 413 excessive payload, 429 rate limit, 500 unexpected server failure. Successful creation returns 201; deletion of a claim returns 204.
