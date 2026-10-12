import { test, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../server/app.js";
import { createStore } from "../server/store.js";
import { Claim } from "../server/models.js";
let app, reviewer, contributor, claimId, evidenceId;
const claim = {
  title: "This is a testable community claim",
  description:
    "A sufficiently detailed description to explain this claim and its original context.",
  category: "Science",
  sourceUrl: "https://example.org/claim",
  priority: "High",
};
const evidence = {
  title: "Independent test source",
  url: "https://example.org/evidence",
  note: "This source provides context and limitations relevant to the claim.",
  stance: "Context",
};
const auth = (token) => ({ Authorization: `Bearer ${token}` });
before(async () => {
  app = createApp({
    store: await createStore(true),
    secret: "a-test-secret-that-is-long-and-private",
    demo: true,
  });
});
test("health identifies demo and unauthenticated requests are blocked", async () => {
  assert.equal((await request(app).get("/api/health")).body.mode, "demo");
  await request(app).get("/api/claims").expect(401);
});
test("sign in as contributor and reviewer; reject incorrect credentials", async () => {
  reviewer = (
    await request(app)
      .post("/api/auth/login")
      .send({ email: "reviewer@factcheckr.demo", password: "FactCheck123!" })
      .expect(200)
  ).body.token;
  contributor = (
    await request(app)
      .post("/api/auth/login")
      .send({ email: "contributor@factcheckr.demo", password: "FactCheck123!" })
      .expect(200)
  ).body.token;
  await request(app)
    .post("/api/auth/login")
    .send({ email: "reviewer@factcheckr.demo", password: "bad" })
    .expect(401);
});
test("registration cannot elevate roles or expose password hashes", async () => {
  const r = await request(app)
    .post("/api/auth/register")
    .send({
      name: "New Member",
      email: "new@example.org",
      password: "StrongPassword123!",
      role: "reviewer",
    })
    .expect(201);
  assert.equal(r.body.user.role, "contributor");
  assert.equal(r.body.user.passwordHash, undefined);
  await request(app)
    .post("/api/auth/register")
    .send({
      name: "Duplicate",
      email: "new@example.org",
      password: "StrongPassword123!",
    })
    .expect(409);
  const users = await request(app)
    .get("/api/users")
    .set(auth(reviewer))
    .expect(200);
  assert.ok(users.body.every((u) => !u.passwordHash));
});
test("claim input validation rejects short text and unsafe source URLs", async () => {
  await request(app)
    .post("/api/claims")
    .set(auth(contributor))
    .send({ ...claim, title: "Short" })
    .expect(400);
  await request(app)
    .post("/api/claims")
    .set(auth(contributor))
    .send({ ...claim, sourceUrl: "javascript:alert(1)" })
    .expect(400);
});
test("create, search and read a claim", async () => {
  const r = await request(app)
    .post("/api/claims")
    .set(auth(contributor))
    .send(claim)
    .expect(201);
  claimId = r.body._id;
  assert.equal(r.body.status, "Unverified");
  assert.equal(r.body.activity.length, 1);
  await request(app)
    .get(`/api/claims/${claimId}`)
    .set(auth(reviewer))
    .expect(200);
  const results = await request(app)
    .get("/api/claims?q=testable&category=Science")
    .set(auth(reviewer));
  assert.ok(results.body.some((c) => c._id === claimId));
  await request(app)
    .get("/api/claims/not-an-id")
    .set(auth(reviewer))
    .expect(400);
});
test("contributors cannot publish verdicts; reviewers need evidence", async () => {
  await request(app)
    .put(`/api/claims/${claimId}/review`)
    .set(auth(contributor))
    .send({
      verdict: "True",
      rationale: "This is a detailed justification for the conclusion.",
    })
    .expect(403);
  await request(app)
    .put(`/api/claims/${claimId}/review`)
    .set(auth(reviewer))
    .send({
      verdict: "True",
      rationale: "This is a detailed justification for the conclusion.",
    })
    .expect(400);
});
test("evidence CRUD and verdict reset preserve review integrity", async () => {
  const r = await request(app)
    .post(`/api/claims/${claimId}/evidence`)
    .set(auth(contributor))
    .send(evidence)
    .expect(201);
  evidenceId = r.body.evidence[0]._id;
  assert.equal(r.body.status, "In review");
  const v = await request(app)
    .put(`/api/claims/${claimId}/review`)
    .set(auth(reviewer))
    .send({
      verdict: "Inconclusive",
      rationale:
        "The available source does not establish the claim beyond doubt.",
    })
    .expect(200);
  assert.equal(v.body.status, "Verified");
  const edit = await request(app)
    .put(`/api/claims/${claimId}/evidence/${evidenceId}`)
    .set(auth(contributor))
    .send({
      ...evidence,
      note: "Revised notes show new limitations of this independent source.",
    })
    .expect(200);
  assert.equal(edit.body.verdict, "");
  assert.equal(edit.body.status, "In review");
  const deleted = await request(app)
    .delete(`/api/claims/${claimId}/evidence/${evidenceId}`)
    .set(auth(contributor))
    .expect(200);
  assert.equal(deleted.body.evidence.length, 0);
});
test("comments and reviewer assignment update the shared record", async () => {
  const c = await request(app)
    .post(`/api/claims/${claimId}/comments`)
    .set(auth(contributor))
    .send({ text: "Can we locate another independent source?" })
    .expect(201);
  assert.equal(c.body.comments.length, 1);
  const me = (await request(app).get("/api/auth/me").set(auth(reviewer))).body;
  const assigned = await request(app)
    .put(`/api/claims/${claimId}/review`)
    .set(auth(reviewer))
    .send({ reviewer: me._id })
    .expect(200);
  assert.equal(assigned.body.reviewer, me._id);
});
test("another contributor cannot edit someone else’s claim", async () => {
  const r = await request(app)
    .post("/api/auth/login")
    .send({ email: "new@example.org", password: "StrongPassword123!" });
  await request(app)
    .put(`/api/claims/${claimId}`)
    .set(auth(r.body.token))
    .send(claim)
    .expect(403);
  await request(app)
    .delete(`/api/claims/${claimId}`)
    .set(auth(r.body.token))
    .expect(403);
});
test("claim update, delete and not-found handling", async () => {
  const r = await request(app)
    .put(`/api/claims/${claimId}`)
    .set(auth(contributor))
    .send({ ...claim, title: "Updated community claim for verification" })
    .expect(200);
  assert.equal(r.body.title, "Updated community claim for verification");
  assert.equal(r.body.status, "Unverified");
  await request(app)
    .delete(`/api/claims/${claimId}`)
    .set(auth(contributor))
    .expect(204);
  await request(app)
    .get(`/api/claims/${claimId}`)
    .set(auth(contributor))
    .expect(404);
});
test("MongoDB schema validates invalid claim and embedded evidence before persistence", async () => {
  const invalid = new Claim({
    ...claim,
    title: "bad",
    author: { id: "abc", name: "Test" },
    evidence: [
      { ...evidence, stance: "Unknown", author: { id: "abc", name: "Test" } },
    ],
  });
  await assert.rejects(invalid.validate(), { name: "ValidationError" });
  const valid = new Claim({
    ...claim,
    author: { id: "abc", name: "Test" },
    evidence: [{ ...evidence, author: { id: "abc", name: "Test" } }],
  });
  await valid.validate();
});
test("social reactions toggle per account without changing verification", async () => {
  const record = (await request(app).get("/api/claims").set(auth(reviewer)))
    .body[0];
  const me = (await request(app).get("/api/auth/me").set(auth(reviewer))).body;
  const path = `/api/claims/${record._id}/social`;
  await request(app).put(path).send({ action: "like" }).expect(401);
  await request(app)
    .put(path)
    .set(auth(reviewer))
    .send({ action: "unknown" })
    .expect(400);
  const liked = (
    await request(app)
      .put(path)
      .set(auth(reviewer))
      .send({ action: "like" })
      .expect(200)
  ).body;
  assert.deepEqual(liked.likes, [me._id]);
  assert.equal(liked.status, record.status);
  assert.equal(liked.verdict, record.verdict);
  const saved = (
    await request(app)
      .put(path)
      .set(auth(reviewer))
      .send({ action: "save" })
      .expect(200)
  ).body;
  assert.deepEqual(saved.savedBy, [me._id]);
  const unliked = (
    await request(app)
      .put(path)
      .set(auth(reviewer))
      .send({ action: "like" })
      .expect(200)
  ).body;
  assert.deepEqual(unliked.likes, []);
  const unsaved = (
    await request(app)
      .put(path)
      .set(auth(reviewer))
      .send({ action: "save" })
      .expect(200)
  ).body;
  assert.deepEqual(unsaved.savedBy, []);
});

test("repository rejects stale simultaneous edits rather than dropping evidence", async () => {
  const store = await createStore(true);
  const c = (await store.claims.list())[0];
  const a = await store.claims.get(c._id),
    b = await store.claims.get(c._id);
  a.description = "First collaborator writes a different context.";
  await store.claims.save(a);
  b.description = "Second collaborator has a stale record.";
  await assert.rejects(store.claims.save(b), { status: 409 });
  assert.equal((await store.claims.get(c._id)).description, a.description);
});
