import assert from "node:assert/strict";
import mongoose from "mongoose";
import { Claim } from "../server/models.js";

// Exercise a running local MongoDB app using one temporary claim only.
const base = "http://127.0.0.1:4000";
async function call(path, method = "GET", body, token, expected = 200) {
  const response = await fetch(`${base}/api${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = response.status === 204 ? null : await response.json();
  assert.equal(response.status, expected, `${method} ${path}: ${data?.message || response.status}`);
  return data;
}
let claimId, contributor;
try {
  assert.equal((await call("/health")).mode, "mongodb");
  await call("/claims", "GET", undefined, undefined, 401);
  const credentials = { password: "FactCheck123!" };
  const reviewer = await call("/auth/login", "POST", { ...credentials, email: "reviewer@factcheckr.demo" });
  contributor = await call("/auth/login", "POST", { ...credentials, email: "contributor@factcheckr.demo" });
  const before = await call("/claims", "GET", undefined, reviewer.token);
  const users = await call("/users", "GET", undefined, reviewer.token);
  assert.ok(users.every((u) => !u.passwordHash));
  const input = {
    title: `Temporary verification check ${Date.now()}`,
    description: "Temporary integration-test claim; removed automatically after the checks.",
    category: "Science", sourceUrl: "https://example.org/test", priority: "Low",
  };
  await call("/claims", "POST", { ...input, title: "bad" }, contributor.token, 400);
  let record = await call("/claims", "POST", input, contributor.token, 201);
  claimId = record._id;
  const path = `/claims/${claimId}`;
  assert.equal(record.status, "Unverified");
  assert.ok((await call(`/claims?q=${encodeURIComponent(input.title)}`, "GET", undefined, reviewer.token)).some((c) => c._id === claimId));
  const verdict = { verdict: "Inconclusive", rationale: "This temporary source cannot establish a reliable conclusion." };
  await call(`${path}/review`, "PUT", verdict, contributor.token, 403);
  await call(`${path}/review`, "PUT", verdict, reviewer.token, 400);
  const evidence = { title: "Temporary source", url: "https://example.org/test-evidence", note: "Integration test evidence, not a factual research finding.", stance: "Context" };
  record = await call(`${path}/evidence`, "POST", evidence, contributor.token, 201);
  const evidenceId = record.evidence[0]._id;
  assert.equal(record.status, "In review");
  record = await call(`${path}/review`, "PUT", { reviewer: reviewer.user._id }, reviewer.token);
  assert.equal(record.reviewer, reviewer.user._id);
  record = await call(`${path}/review`, "PUT", verdict, reviewer.token);
  assert.equal(record.status, "Verified");
  record = await call(`${path}/social`, "PUT", { action: "like" }, contributor.token);
  assert.ok(record.likes.includes(contributor.user._id));
  assert.equal(record.verdict, verdict.verdict);
  record = await call(`${path}/social`, "PUT", { action: "save" }, contributor.token);
  assert.ok(record.savedBy.includes(contributor.user._id));
  record = await call(`${path}/comments`, "POST", { text: "Temporary integration check discussion." }, contributor.token, 201);
  assert.equal(record.comments.length, 1);
  assert.ok(process.env.MONGODB_URI, "Set MONGODB_URI in .env");
  await mongoose.connect(process.env.MONGODB_URI);
  const persisted = await Claim.findById(claimId).lean();
  assert.equal(persisted.comments.length, 1);
  assert.ok(persisted.savedBy.includes(contributor.user._id));
  await mongoose.disconnect();
  await mongoose.connect(process.env.MONGODB_URI);
  assert.ok((await Claim.findById(claimId).lean()).likes.includes(contributor.user._id));
  record = await call(`${path}/evidence/${evidenceId}`, "PUT", { ...evidence, note: "Updated temporary evidence; published verdict must reset." }, contributor.token);
  assert.equal(record.verdict, "");
  record = await call(`${path}/evidence/${evidenceId}`, "DELETE", undefined, contributor.token);
  assert.equal(record.evidence.length, 0);
  record = await call(path, "PUT", { ...input, title: `${input.title} edited` }, contributor.token);
  assert.equal(record.status, "Unverified");
  await call(path, "DELETE", undefined, contributor.token, 204);
  await call(path, "GET", undefined, reviewer.token, 404);
  claimId = undefined;
  assert.equal((await call("/claims", "GET", undefined, reviewer.token)).length, before.length);
  for (const route of ["/", "/claims", "/evidence", "/team", "/guide"]) {
    const response = await fetch(`${base}${route}`);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /id="root"/);
  }
  console.log(`Live MongoDB workflows passed; ${before.length} existing claims preserved. Temporary claim removed.`);
} finally {
  if (claimId && contributor) await call(`/claims/${claimId}`, "DELETE", undefined, contributor.token, 204);
  await mongoose.disconnect();
}
