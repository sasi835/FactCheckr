import mongoose from "mongoose";
import { User, Claim } from "./models.js";
import { sampleData } from "./data.js";
await mongoose.connect(
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/factcheckr",
);
// Refuse to overwrite existing coursework or user data.
if ((await User.countDocuments()) || (await Claim.countDocuments())) {
  console.log("Seed skipped: database already contains data.");
} else {
  const data = await sampleData();
  await User.insertMany(data.users);
  await Claim.insertMany(data.claims);
  console.log(
    "Inserted 2 demo accounts and 6 illustrative claims. Change demo passwords before exposing the app.",
  );
}
await mongoose.disconnect();
