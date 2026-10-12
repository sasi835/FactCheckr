import mongoose from "mongoose";
import express from "express";
import path from "node:path";
import { existsSync } from "node:fs";
import { createStore } from "./store.js";
import { createApp } from "./app.js";
const demo = process.argv.includes("--demo");
if (!demo) {
  if (
    !process.env.JWT_SECRET ||
    process.env.JWT_SECRET.length < 32 ||
    process.env.JWT_SECRET.startsWith("replace-")
  )
    throw Error("Set a random JWT_SECRET of at least 32 characters in .env");
  await mongoose.connect(
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/factcheckr",
    { serverSelectionTimeoutMS: 5000 },
  );
}
const app = createApp({
  store: await createStore(demo),
  secret:
    process.env.JWT_SECRET || "local-demo-secret-never-use-for-production",
  demo,
});
if (existsSync("dist/index.html")) {
  app.use(express.static(path.resolve("dist")));
  app.get("/{*path}", (req, res) =>
    res.sendFile(path.resolve("dist/index.html")),
  );
}
const server = app.listen(Number(process.env.PORT || 4000), "127.0.0.1", () =>
  console.log(
    `FactCheckr API: http://127.0.0.1:${process.env.PORT || 4000} (${demo ? "DEMO: in-memory, resets on restart" : "MongoDB"})`,
  ),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () =>
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    }),
  );
