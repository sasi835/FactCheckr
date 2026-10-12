import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { id } from "./data.js";
const url = z
  .url()
  .refine(
    (v) => ["http:", "https:"].includes(new URL(v).protocol),
    "Use an HTTP or HTTPS URL",
  );
const text = (min, max) => z.string().trim().min(min).max(max);
const claimInput = z.object({
  title: text(10, 180),
  description: text(20, 4000),
  category: z.enum([
    "Science",
    "Technology",
    "Health",
    "Environment",
    "Politics",
    "Other",
  ]),
  sourceUrl: url,
  priority: z.enum(["Low", "Medium", "High"]),
});
const evidenceInput = z.object({
  title: text(3, 180),
  url,
  note: text(10, 2000),
  stance: z.enum(["Supports", "Contradicts", "Context"]),
});
const fail = (status, message) => Object.assign(new Error(message), { status });
const publicUser = ({ passwordHash, ...u }) => u;
export function createApp({ store, secret, demo = false }) {
  const app = express();
  app.use(helmet());
  app.use(express.json({ limit: "100kb" }));
  app.use(
    "/api",
    rateLimit({
      windowMs: 60000,
      limit: 300,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
  );
  const authLimit = rateLimit({ windowMs: 900000, limit: 30 });
  const tokenFor = (u) =>
    jwt.sign({ sub: String(u._id) }, secret, { expiresIn: "8h" });
  const who = (u) => ({ id: String(u._id), name: u.name });
  const event = (c, user, message) => {
    c.updatedAt = new Date().toISOString();
    c.activity.push({
      _id: id(),
      text: message,
      author: who(user),
      createdAt: c.updatedAt,
    });
  };
  app.get("/api/health", (req, res) =>
    res.json({ ok: true, mode: demo ? "demo" : "mongodb" }),
  );
  app.post("/api/auth/register", authLimit, async (req, res) => {
    const data = z
      .object({
        name: text(2, 60),
        email: z.email().transform((v) => v.toLowerCase()),
        password: text(8, 100),
      })
      .parse(req.body);
    if (await store.users.find(data.email))
      throw fail(409, "An account with this email already exists");
    const u = await store.users.create({
      _id: id(),
      name: data.name,
      email: data.email,
      role: "contributor",
      passwordHash: await bcrypt.hash(data.password, 12),
    });
    res.status(201).json({
      token: tokenFor(u),
      user: publicUser(u.toObject ? u.toObject() : u),
    });
  });
  app.post("/api/auth/login", authLimit, async (req, res) => {
    const data = z
      .object({
        email: z.email().transform((v) => v.toLowerCase()),
        password: z.string().max(100),
      })
      .parse(req.body);
    const u = await store.users.find(data.email);
    if (!u || !(await bcrypt.compare(data.password, u.passwordHash)))
      throw fail(401, "Email or password is incorrect");
    res.json({ token: tokenFor(u), user: publicUser(u) });
  });
  app.use("/api", async (req, res, next) => {
    try {
      const token = req.headers.authorization?.replace(/^Bearer /, "");
      const payload = jwt.verify(token || "", secret);
      req.user = await store.users.get(payload.sub);
      if (!req.user) throw Error();
    } catch {
      throw fail(401, "Please sign in to continue");
    }
    next();
  });
  app.get("/api/auth/me", (req, res) => res.json(publicUser(req.user)));
  app.get("/api/users", async (req, res) => res.json(await store.users.list()));
  app.get("/api/claims", async (req, res) => {
    let claims = await store.claims.list();
    const q = String(req.query.q || "").toLowerCase();
    claims = claims.filter(
      (c) =>
        (!q || `${c.title} ${c.description}`.toLowerCase().includes(q)) &&
        (!req.query.status || c.status === req.query.status) &&
        (!req.query.category || c.category === req.query.category),
    );
    res.json(claims);
  });
  app.post("/api/claims", async (req, res) => {
    const data = claimInput.parse(req.body),
      now = new Date().toISOString();
    const c = {
      ...data,
      _id: id(),
      author: who(req.user),
      reviewer: "",
      status: "Unverified",
      verdict: "",
      rationale: "",
      evidence: [],
      comments: [],
      activity: [],
      createdAt: now,
      updatedAt: now,
    };
    event(c, req.user, "Submitted this claim");
    res.status(201).json(await store.claims.create(c));
  });
  app.use("/api/claims/:claimId", async (req, res, next) => {
    if (!/^[a-f0-9]{24}$/i.test(req.params.claimId))
      throw fail(400, "Invalid claim ID");
    req.claim = await store.claims.get(req.params.claimId);
    if (!req.claim) throw fail(404, "Claim not found");
    next();
  });
  const canEdit = (req) => {
    if (
      String(req.claim.author.id) !== String(req.user._id) &&
      req.user.role !== "reviewer"
    )
      throw fail(403, "Only the author or a reviewer can change this claim");
  };
  app.get("/api/claims/:claimId", (req, res) => res.json(req.claim));
  app.put("/api/claims/:claimId/social", async (req, res) => {
    const { action } = z
      .object({ action: z.enum(["like", "save"]) })
      .parse(req.body);
    const key = action === "like" ? "likes" : "savedBy";
    const userId = String(req.user._id);
    const values = req.claim[key] || [];
    req.claim[key] = values.includes(userId)
      ? values.filter((value) => value !== userId)
      : [...values, userId];
    res.json(await store.claims.save(req.claim));
  });
  app.put("/api/claims/:claimId", async (req, res) => {
    canEdit(req);
    Object.assign(req.claim, claimInput.parse(req.body), {
      status: "Unverified",
      verdict: "",
      rationale: "",
    });
    event(req.claim, req.user, "Edited claim; verification reset");
    res.json(await store.claims.save(req.claim));
  });
  app.delete("/api/claims/:claimId", async (req, res) => {
    canEdit(req);
    await store.claims.delete(req.claim._id);
    res.status(204).end();
  });
  app.post("/api/claims/:claimId/evidence", async (req, res) => {
    const e = {
      ...evidenceInput.parse(req.body),
      _id: id(),
      author: who(req.user),
      createdAt: new Date().toISOString(),
    };
    req.claim.evidence.push(e);
    req.claim.status = "In review";
    req.claim.verdict = "";
    req.claim.rationale = "";
    event(req.claim, req.user, "Added evidence; review required");
    res.status(201).json(await store.claims.save(req.claim));
  });
  const editEvidence = (req) => {
    const e = req.claim.evidence.find(
      (e) => String(e._id) === req.params.evidenceId,
    );
    if (!e) throw fail(404, "Evidence not found");
    if (
      String(e.author.id) !== String(req.user._id) &&
      req.user.role !== "reviewer"
    )
      throw fail(403, "Only the evidence author or a reviewer can change it");
    return e;
  };
  app.put("/api/claims/:claimId/evidence/:evidenceId", async (req, res) => {
    Object.assign(editEvidence(req), evidenceInput.parse(req.body));
    Object.assign(req.claim, {
      status: "In review",
      verdict: "",
      rationale: "",
    });
    event(req.claim, req.user, "Updated evidence; review required");
    res.json(await store.claims.save(req.claim));
  });
  app.delete("/api/claims/:claimId/evidence/:evidenceId", async (req, res) => {
    editEvidence(req);
    req.claim.evidence = req.claim.evidence.filter(
      (e) => String(e._id) !== req.params.evidenceId,
    );
    Object.assign(req.claim, {
      status: "In review",
      verdict: "",
      rationale: "",
    });
    event(req.claim, req.user, "Removed evidence; review required");
    res.json(await store.claims.save(req.claim));
  });
  app.post("/api/claims/:claimId/comments", async (req, res) => {
    const data = z.object({ text: text(2, 2000) }).parse(req.body);
    req.claim.comments.push({
      ...data,
      _id: id(),
      author: who(req.user),
      createdAt: new Date().toISOString(),
    });
    event(req.claim, req.user, "Joined the discussion");
    res.status(201).json(await store.claims.save(req.claim));
  });
  app.put("/api/claims/:claimId/review", async (req, res) => {
    if (req.user.role !== "reviewer")
      throw fail(403, "Only reviewers can assign and publish verdicts");
    const data = z
      .object({
        reviewer: z.string().optional(),
        verdict: z
          .enum(["True", "False", "Misleading", "Inconclusive"])
          .optional(),
        rationale: text(20, 4000).optional(),
      })
      .parse(req.body);
    if (!data.reviewer && !data.verdict)
      throw fail(400, "Choose a reviewer or verdict");
    if (data.reviewer) {
      const u = await store.users.get(data.reviewer);
      if (!u || u.role !== "reviewer")
        throw fail(400, "Choose a valid reviewer");
      req.claim.reviewer = data.reviewer;
      req.claim.status = "In review";
      req.claim.verdict = "";
      req.claim.rationale = "";
    }
    if (data.verdict) {
      if (!req.claim.evidence.length)
        throw fail(400, "Add evidence before publishing a verdict");
      if (!data.rationale)
        throw fail(400, "Explain the verdict in at least 20 characters");
      Object.assign(req.claim, {
        verdict: data.verdict,
        rationale: data.rationale,
        status: "Verified",
        reviewer: String(req.user._id),
      });
    }
    event(
      req.claim,
      req.user,
      data.verdict
        ? `Published verdict: ${data.verdict}`
        : "Assigned a reviewer",
    );
    res.json(await store.claims.save(req.claim));
  });
  app.use("/api", (req, res) =>
    res.status(404).json({ message: "API route not found" }),
  );
  app.use((err, req, res, next) => {
    if (err instanceof z.ZodError)
      return res.status(400).json({
        message: err.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      });
    if (err.code === 11000)
      return res
        .status(409)
        .json({ message: "This email is already registered" });
    if (err.name === "ValidationError" || err.name === "CastError")
      return res
        .status(400)
        .json({ message: "Invalid data: check the submitted fields" });
    if (err.name === "VersionError")
      return res
        .status(409)
        .json({ message: "This claim changed. Refresh and try again." });
    const status = err.status || 500;
    if (status === 500) console.error(err);
    res.status(status).json({
      message: status === 500 ? "An unexpected error occurred" : err.message,
    });
  });
  return app;
}
