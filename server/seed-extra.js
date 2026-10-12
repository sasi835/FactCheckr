import mongoose from "mongoose";
import { Claim, User } from "./models.js";

// Illustrative investigation prompts, not researched findings or real news.
// Stable source URLs make reruns safe without changing existing records.
const groups = {
  Science: [
    "Sound travels faster through water than through air",
    "Lightning never strikes the same location twice",
    "Seasons are caused by changes in Earth's distance from the Sun",
    "The Moon produces its own visible light",
    "A heavier object always falls faster than a lighter object",
    "Water boils at the same temperature at every altitude",
    "A year on every planet is the same length as a year on Earth",
    "All metals are attracted strongly to an ordinary magnet",
    "The North Star is the brightest star in the night sky",
  ],
  Technology: [
    "Deleting a file always removes every recoverable copy immediately",
    "HTTPS guarantees that a website's content is trustworthy",
    "A strong password makes two-factor authentication unnecessary",
    "Every QR code is safe to scan because it is only an image",
    "A larger megapixel count always produces a better photograph",
    "Public Wi-Fi networks always encrypt every user's traffic",
    "Artificial intelligence answers are always based on verified sources",
    "Open-source software cannot contain security vulnerabilities",
    "Cloud storage keeps uploaded files entirely on the user's device",
  ],
  Health: [
    "An online wellness tip applies equally to every age group",
    "A product described as natural cannot have unwanted effects",
    "A testimonial is enough to prove a health product works",
    "Every health claim in a sponsored post is independently reviewed",
    "The number of likes on a health video establishes its accuracy",
    "A health article remains current regardless of publication date",
    "One person's experience establishes the same outcome for everyone",
    "A professional-looking label proves a wellness product was tested",
  ],
  Environment: [
    "Every item with a recycling symbol is accepted by local recyclers",
    "Electric vehicles have no environmental impact at any stage",
    "Planting any tree species is equally suitable for every location",
    "All biodegradable packaging decomposes quickly in a landfill",
    "A single rainy week proves that a long-term drought has ended",
    "Switching off a device leaves no standby electricity consumption",
    "Paper packaging always has a smaller footprint than other packaging",
    "A photograph of clear water proves the water is pollution-free",
  ],
  Politics: [
    "A cropped speech clip contains the speaker's complete argument",
    "An opinion poll's percentages describe every registered voter",
    "A policy announcement takes legal effect as soon as it is posted",
    "A budget allocation means the entire amount has already been spent",
    "A screenshot of an official notice proves the notice is authentic",
    "A quoted statistic can be compared across years without definitions",
    "A viral election infographic includes every relevant data source",
    "A headline accurately captures all conditions in a policy proposal",
  ],
  Other: [
    "Every online review comes from a verified purchaser",
    "A discount percentage always uses the product's usual selling price",
    "A forwarded scholarship notice is valid without an official source",
    "A job advertisement is genuine if it contains a company logo",
    "A social media giveaway is authentic if many accounts share it",
    "An old event photograph proves that the event happened today",
    "A campus timetable screenshot reflects the latest published schedule",
    "A high follower count proves that an account's statements are reliable",
  ],
};

await mongoose.connect(
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/factcheckr",
  { serverSelectionTimeoutMS: 5000 },
);
try {
  const contributor = await User.findOne({ role: "contributor" });
  if (!contributor) throw new Error("A contributor account is needed first.");
  const author = { id: String(contributor._id), name: contributor.name };
  let index = 0;
  let inserted = 0;
  let skipped = 0;
  for (const [category, titles] of Object.entries(groups)) {
    for (const title of titles) {
      index += 1;
      const sourceUrl = `https://example.org/factcheckr-demo/claim-${String(index).padStart(2, "0")}`;
      if (await Claim.exists({ sourceUrl })) {
        skipped += 1;
        continue;
      }
      const claim = new Claim({
        title,
        description:
          `Demonstration claim ${index} for the ${category} category. ` +
          "This is an illustrative investigation prompt with a placeholder source URL, not a verified finding or a real reported event. " +
          "Locate primary sources, check the original context and date, gather independent evidence, and explain any limitations before publishing a verdict.",
        category,
        sourceUrl,
        priority: ["Low", "Medium", "High"][(index - 1) % 3],
        status: "Unverified",
        verdict: "",
        rationale: "",
        author,
        reviewer: "",
        evidence: [],
        comments: [],
        activity: [
          {
            text: "Added an illustrative demonstration claim for investigation",
            author,
            createdAt: new Date(),
          },
        ],
      });
      await claim.save();
      inserted += 1;
    }
  }
  console.log(
    JSON.stringify({
      requestedSampleClaims: index,
      inserted,
      skipped,
      totalClaims: await Claim.countDocuments(),
      categories: await Claim.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    }),
  );
} finally {
  await mongoose.disconnect();
}
