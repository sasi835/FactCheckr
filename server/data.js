import mongoose from "mongoose";
import bcrypt from "bcryptjs";
export const id = () => new mongoose.Types.ObjectId().toString();
export async function sampleData() {
  const reviewer = {
    _id: id(),
    name: "Alex Morgan",
    email: "reviewer@factcheckr.demo",
    role: "reviewer",
    passwordHash: await bcrypt.hash("FactCheck123!", 10),
  };
  const contributor = {
    _id: id(),
    name: "Sam Taylor",
    email: "contributor@factcheckr.demo",
    role: "contributor",
    passwordHash: await bcrypt.hash("FactCheck123!", 10),
  };
  const author = { id: contributor._id, name: contributor.name };
  const samples = [
    [
      "The Great Wall of China is visible from the Moon",
      "A recurring social media post claims that the Great Wall is the only human-made structure visible to the unaided eye from the Moon.",
      "Science",
      "High",
      "Verified",
      "False",
      "NASA explains that the wall is not visible from the Moon with the unaided eye.",
      "https://www.nasa.gov/",
      "NASA: observations of Earth from space",
      "Contradicts",
    ],
    [
      "Incognito mode makes browsing completely anonymous",
      "A widely shared infographic suggests that private browsing hides all activity from internet providers, employers, and visited websites.",
      "Technology",
      "High",
      "In review",
      "",
      "",
      "https://support.google.com/chrome/answer/95464",
      "Chrome Help: how private browsing works",
      "Contradicts",
    ],
    [
      "Solar panels cannot generate electricity on cloudy days",
      "A community discussion argues that solar panels stop producing power whenever clouds cover the Sun. Review the difference between reduced output and no output.",
      "Environment",
      "Medium",
      "In review",
      "",
      "",
      "https://www.energy.gov/eere/solar",
      "US Department of Energy: solar energy resources",
      "Context",
    ],
    [
      "Humans use only ten percent of their brains",
      "A popular motivational video repeats the claim that most of the human brain is unused. Find primary research and reliable neuroscience sources.",
      "Health",
      "Medium",
      "Unverified",
      "",
      "",
      "https://www.brainfacts.org/",
      "",
      "Context",
    ],
    [
      "A viral photograph shows snow in the Sahara for the first time",
      "The caption attached to a circulating photograph says this is the first recorded snowfall in the Sahara. The location and date need independent confirmation.",
      "Environment",
      "Low",
      "Unverified",
      "",
      "",
      "https://earthobservatory.nasa.gov/",
      "",
      "Context",
    ],
    [
      "All online images are free to reuse with attribution",
      "A student forum post claims that adding a credit line permits unrestricted reuse of any image found online. Investigate copyright and licensing requirements.",
      "Other",
      "Medium",
      "Unverified",
      "",
      "",
      "https://creativecommons.org/share-your-work/",
      "",
      "Context",
    ],
  ];
  const claims = samples.map((s, i) => {
    const createdAt = new Date(Date.now() - (i + 1) * 86400000).toISOString();
    return {
      _id: id(),
      title: s[0],
      description: s[1],
      category: s[2],
      priority: s[3],
      status: s[4],
      verdict: s[5],
      rationale: s[6],
      sourceUrl: s[7],
      author,
      reviewer: s[4] === "Unverified" ? "" : reviewer._id,
      evidence: s[8]
        ? [
            {
              _id: id(),
              title: s[8],
              url: s[7],
              note: "Illustrative seed evidence. Open and evaluate the source before using this record in a real verification.",
              stance: s[9],
              author,
              createdAt,
            },
          ]
        : [],
      comments: [],
      activity: [
        { _id: id(), text: "Submitted this claim", author, createdAt },
      ],
      createdAt,
      updatedAt: createdAt,
    };
  });
  return { users: [reviewer, contributor], claims };
}
