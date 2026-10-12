# FactCheckr

**A Collaborative Claim Verification and Evidence Management Platform**

Full stack coursework project for **19MAM57 – Full Stack Web Development Lab**, Five Year Integrated M.Sc AI & ML, CAT-II (2026).

## Problem definition

Claims circulating online are often shared without their original context. Teams need a common place to record a precise claim, gather sources, discuss conflicting evidence, and publish a traceable conclusion. FactCheckr manages this human verification process. It does not use an automated truth detector.

**Objectives:** centralize claims and evidence; support collaborative discussion; assign reviewers; maintain a visible activity trail; publish reasoned verdicts; provide searchable records. **Scope:** a single research workspace with contributor and reviewer roles. **Innovation:** evidence changes automatically reopen verification, preventing an outdated verdict from appearing current. **Feasibility:** a React interface, Express API, and MongoDB with embedded evidence and discussion provide a manageable lab implementation.

The home feed provides category circles, claim cards, likes, saved bookmarks, inline discussions, search, and an under-review filter. Likes and bookmarks persist per account in MongoDB; popularity does not alter verification verdicts.

## Quick start

Prerequisite: Node.js 22.12+ (tested with Node.js 24).

```powershell
npm install
npm run dev
```

Open **http://127.0.0.1:5173**. Select **Enter as reviewer** or **Explore as contributor** on the login screen. Demo mode uses the real API with an in-memory adapter. It is explicitly labelled and **all demo changes disappear when the server restarts**. Demo mode does not satisfy proof of MongoDB connectivity; use the steps below for your database demonstration.

## Run with MongoDB

1. Start a local MongoDB server or create a MongoDB Atlas database.
2. Copy `.env.example` to `.env` and set `MONGODB_URI`. Set `JWT_SECRET` to a random value of at least 32 characters; the placeholder is rejected.
3. Run `npm run seed` once against an empty database to create the illustrative records and two accounts. Seeding refuses to overwrite existing data.
4. Run `npm run dev:mongo` and open http://127.0.0.1:5173.
5. Sign in using one of the seeded accounts below. The sidebar and `/api/health` identify MongoDB mode. Create a claim, restart the server, and confirm it remains saved.

| Account     | Email                       | Password      |
| ----------- | --------------------------- | ------------- |
| Reviewer    | reviewer@factcheckr.demo    | FactCheck123! |
| Contributor | contributor@factcheckr.demo | FactCheck123! |

Seed claims and evidence are illustrative teaching data, not completed research. Evaluate source pages before relying on the sample verdict. New registrations always have the contributor role. To provision a reviewer, an administrator updates `users.role` to `reviewer` in MongoDB. Change seed passwords before exposing the application. The server is bound to loopback for this lab project.

## Build and validation

```powershell
npm test
npm run test:live
npm run build
npm start
```

`npm start` requires MongoDB and a valid `.env`; after a build, Express serves the React application and API together on http://127.0.0.1:4000. For a built demo, run `npm run server:demo`. Font styling uses Google Fonts with system font fallbacks; core app functionality needs no external font service.

`npm run test:live` requires the running MongoDB app, the default seeded accounts, and `MONGODB_URI` in `.env`. It exercises real database workflows with one temporary claim, removes it afterward, and preserves existing records. The regular `npm test` suite uses the in-memory adapter.

## Features

- JWT sign in, password hashing, registration, role checks, request size limits and rate limiting.
- Dashboard metrics and recent activity derived from actual records.
- Claim create/read/update/delete, keyword search, category and status filtering.
- Evidence create/read/update/delete with HTTP(S) source validation and stance labels.
- Shared discussion, reviewer assignment, evidence-gated verdict publication, and activity history.
- React routing: overview, claims, claim details, evidence library, collaborators, guide, and not-found view.
- Responsive semantic HTML, labelled form controls, keyboard-focus indicators, dialog focus trapping, accessible feedback, loading and empty states.

## Architecture and data design

```text
React components + React Router
        | fetch / JSON / bearer token
Express REST routes + Zod validation + authorization middleware
        | repository adapter
MongoDB (Mongoose schemas) OR explicitly selected in-memory demo
```

`users`: name, unique email, passwordHash, role, timestamps.

`claims`: statement, description, category, sourceUrl, priority, author snapshot, assigned reviewer ID, status, verdict, rationale, timestamps; embedded evidence, comments, and activity.

Each evidence item has a title, URL, notes, stance, contributor snapshot, and timestamp. Embedded data fits the bounded coursework workload and allows each claim to be retrieved as one document. User snapshots retain the name associated with an action. Production-scale discussions would use separate paginated collections; the current implementation retrieves the whole workspace and is intended for a small team. Activity is an application history, not a tamper-proof compliance log. JWTs live in session storage and expire after eight hours; production hardening could use secure cookies, account recovery, verified email, and dedicated admin tools.

See [API reference](docs/API.md), [rubric mapping](docs/RUBRIC.md), and [demo & viva guide](docs/DEMO_AND_VIVA.md).

## Source layout

```text
src/main.jsx        Reusable UI components, routed pages, forms
src/api.js          Fetch/JSON API client
src/styles.css      Responsive visual system
server/app.js       REST routes, input validation, authentication, authorization
server/models.js    MongoDB schemas and embedded document validation
server/store.js     MongoDB and demo repository adapters
server/index.js     Database connection, HTTP server, built app hosting
server/data.js      Illustrative seed data
server/seed.js      Non-destructive MongoDB seed command
tests/api.test.js   API workflows, authorization, validation, schema checks
```

Implementation references: [Express routing](https://expressjs.com/en/guide/routing/), [Mongoose validation](https://mongoosejs.com/docs/validation).
