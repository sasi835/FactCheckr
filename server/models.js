import mongoose from "mongoose";
const { Schema } = mongoose;
const author = {
  id: { type: String, required: true },
  name: { type: String, required: true },
};
const evidenceSchema = new Schema({
  title: { type: String, required: true, maxlength: 180 },
  url: {
    type: String,
    required: true,
    validate: (v) => /^https?:\/\//.test(v),
  },
  note: { type: String, maxlength: 2000 },
  stance: {
    type: String,
    enum: ["Supports", "Contradicts", "Context"],
    required: true,
  },
  author,
  createdAt: { type: Date, default: Date.now },
});
const commentSchema = new Schema({
  text: { type: String, required: true, maxlength: 2000 },
  author,
  createdAt: { type: Date, default: Date.now },
});
const activitySchema = new Schema({
  text: String,
  author,
  createdAt: { type: Date, default: Date.now },
});
const claimSchema = new Schema(
  {
    title: { type: String, required: true, minlength: 10, maxlength: 180 },
    description: {
      type: String,
      required: true,
      minlength: 20,
      maxlength: 4000,
    },
    category: {
      type: String,
      enum: [
        "Science",
        "Technology",
        "Health",
        "Environment",
        "Politics",
        "Other",
      ],
      required: true,
    },
    sourceUrl: {
      type: String,
      required: true,
      validate: (v) => /^https?:\/\//.test(v),
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Unverified", "In review", "Verified"],
      default: "Unverified",
    },
    verdict: {
      type: String,
      enum: ["", "True", "False", "Misleading", "Inconclusive"],
      default: "",
    },
    rationale: { type: String, maxlength: 4000, default: "" },
    author,
    reviewer: { type: String, default: "" },
    likes: { type: [String], default: [] },
    savedBy: { type: [String], default: [] },
    evidence: [evidenceSchema],
    comments: [commentSchema],
    activity: [activitySchema],
  },
  { timestamps: true, optimisticConcurrency: true },
);
const userSchema = new Schema(
  {
    name: { type: String, required: true, maxlength: 60 },
    email: { type: String, unique: true, required: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["contributor", "reviewer"],
      default: "contributor",
    },
  },
  { timestamps: true },
);
export const Claim = mongoose.model("Claim", claimSchema);
export const User = mongoose.model("User", userSchema);
