import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Send,
  Search,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  Globe2,
  Cpu,
  Leaf,
  FlaskConical,
  Activity,
  Landmark,
  RefreshCw,
  X,
} from "lucide-react";
import { api } from "./api";

const topics = [
  {
    name: "Science",
    icon: FlaskConical,
    color: "#d5c9fc",
    tagline: "Question the obvious.",
  },
  {
    name: "Technology",
    icon: Cpu,
    color: "#c7e6ff",
    tagline: "Beyond the algorithm.",
  },
  {
    name: "Health",
    icon: Activity,
    color: "#ffd1d9",
    tagline: "A closer look at wellbeing.",
  },
  {
    name: "Environment",
    icon: Leaf,
    color: "#d5ebbd",
    tagline: "Our planet. The full picture.",
  },
  {
    name: "Politics",
    icon: Landmark,
    color: "#ffdfac",
    tagline: "Context changes everything.",
  },
  {
    name: "Other",
    icon: Globe2,
    color: "#f8dcff",
    tagline: "Curiosity belongs here.",
  },
];
function Face({ name, ring = false }) {
  return (
    <span className={`feed-face ${ring ? "with-ring" : ""}`}>
      <span>
        {name
          ?.split(" ")
          .map((s) => s[0])
          .slice(0, 2)
          .join("") || "FC"}
      </span>
    </span>
  );
}
function ClaimPost({ claim, user, refresh, notify }) {
  const [post, setPost] = useState(claim),
    [commentsOpen, setCommentsOpen] = useState(false),
    [expanded, setExpanded] = useState(false),
    [pending, setPending] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    setPost(claim);
  }, [claim]);
  const topic = topics.find((t) => t.name === post.category) || topics[5];
  const Icon = topic.icon;
  const liked = (post.likes || []).includes(user._id),
    saved = (post.savedBy || []).includes(user._id);
  async function toggle(action) {
    setPending(true);
    setError("");
    try {
      const result = await api(`/claims/${post._id}/social`, {
        method: "PUT",
        body: { action },
      });
      setPost(result);
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setPending(false);
    }
  }
  return (
    <article className="claim-post">
      <header className="post-header">
        <Face name={post.author.name} ring />
        <div>
          <Link to="/team">
            {post.author.name}
          </Link>
          <span>
            {post.category} ·{" "}
            {new Date(post.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>
        <Link
          className="post-open"
          aria-label={`Open investigation: ${post.title}`}
          to={`/claims/${post._id}`}
        >
          <ArrowUpRight size={20} />
        </Link>
      </header>
      <Link
        className={`post-visual topic-${post.category.toLowerCase()}`}
        style={{ "--topic-color": topic.color }}
        to={`/claims/${post._id}`}
      >
        <div className="visual-top">
          <span>
            <Icon size={16} />
            {post.category.toUpperCase()}
          </span>
          <span>CLAIM / {post._id.slice(-4).toUpperCase()}</span>
        </div>
        <div className="visual-orbit orbit-a" />
        <div className="visual-orbit orbit-b" />
        <Icon className="visual-symbol" size={140} strokeWidth={0.8} />
        <div className="visual-statement">
          <span>LET’S FACT CHECK THIS</span>
          <h2>{post.title}</h2>
        </div>
        <div className="visual-bottom">
          <span>
            FactCheckr<span className="visual-dot">✳</span>
          </span>
          <span>
            Swipe past the noise <ArrowUpRight size={15} />
          </span>
        </div>
      </Link>
      <div className="post-body">
        <div className="post-actions">
          <button
            className={liked ? "is-liked" : ""}
            disabled={pending}
            aria-pressed={liked}
            aria-label={liked ? "Unlike claim" : "Like claim"}
            onClick={() => toggle("like")}
          >
            <Heart size={25} fill={liked ? "currentColor" : "none"} />
          </button>
          <button
            aria-expanded={commentsOpen}
            aria-label="Open comments"
            onClick={() => setCommentsOpen(!commentsOpen)}
          >
            <MessageCircle size={25} />
          </button>
          <button
            aria-label="Copy claim link"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(
                  `${window.location.origin}/claims/${post._id}`,
                );
                notify("Claim link copied.");
              } catch {
                notify("Open the investigation and copy its address to share.");
              }
            }}
          >
            <Send size={24} />
          </button>
          <button
            className={saved ? "is-saved" : ""}
            disabled={pending}
            aria-pressed={saved}
            aria-label={saved ? "Unsave claim" : "Save claim"}
            onClick={() => toggle("save")}
          >
            <Bookmark size={25} fill={saved ? "currentColor" : "none"} />
          </button>
        </div>
        <div className="post-signals">
          <strong>
            {(post.likes || []).length}{" "}
            {(post.likes || []).length === 1 ? "like" : "likes"}
          </strong>
          <span
            className={`feed-status status-${post.status.replaceAll(" ", "-").toLowerCase()}`}
          >
            <span />
            {post.verdict || post.status}
          </span>
        </div>
        <p className="post-caption">
          <strong>{post.author.name}</strong>{" "}
          {expanded ? post.description : post.description.slice(0, 150)}
          {post.description.length > 150 && !expanded && "…"}{" "}
          {post.description.length > 150 && (
            <button onClick={() => setExpanded(!expanded)}>
              {expanded ? "less" : "more"}
            </button>
          )}
        </p>
        <div className="post-evidence">
          <ShieldCheck size={15} />
          <span>
            {post.evidence.length} evidence{" "}
            {post.evidence.length === 1 ? "source" : "sources"}
          </span>
          <Link to={`/claims/${post._id}`}>
            {post.evidence.length ? "Explore the evidence" : "Help investigate"}
            <ArrowUpRight size={13} />
          </Link>
        </div>
        <button
          className="view-comments"
          onClick={() => setCommentsOpen(!commentsOpen)}
        >
          {post.comments.length
            ? `View ${post.comments.length} ${post.comments.length === 1 ? "comment" : "comments"}`
            : "Be the first to start a conversation"}
        </button>
        {commentsOpen && (
          <section className="inline-discussion" aria-label="Claim discussion">
            {post.comments.slice(-4).map((c) => (
              <p key={c._id}>
                <strong>{c.author.name}</strong> {c.text}
              </p>
            ))}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                setPending(true);
                setError("");
                try {
                  setPost(
                    await api(`/claims/${post._id}/comments`, {
                      method: "POST",
                      body: { text: new FormData(form).get("text") },
                    }),
                  );
                  form.reset();
                  await refresh();
                } catch (e) {
                  setError(e.message);
                } finally {
                  setPending(false);
                }
              }}
            >
              <input
                name="text"
                aria-label="Add a comment"
                placeholder="Add a thoughtful comment…"
                required
                minLength={2}
                maxLength={2000}
              />
              <button disabled={pending}>Post</button>
            </form>
          </section>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </div>
    </article>
  );
}
export default function Feed({
  claims,
  users,
  user,
  refresh,
  notify,
  openNew,
  loading,
}) {
  const [category, setCategory] = useState("All"),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("For you"),
    [limit, setLimit] = useState(8);
  const filtered = claims.filter(
    (c) =>
      (category === "All" || c.category === category) &&
      `${c.title} ${c.description}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter !== "Saved" || (c.savedBy || []).includes(user._id)) &&
      (filter !== "Under review" || c.status === "In review"),
  );
  function chooseCategory(value) {
    setCategory(value);
    setLimit(8);
  }
  return (
    <div className="social-layout">
      <section className="social-main">
        <div className="feed-heading">
          <div>
            <span className="feed-eyebrow">YOUR DAILY DOSE OF CLARITY</span>
            <h1>
              The conversation starts here<span>✳</span>
            </h1>
            <p>Interesting claims. Different perspectives. Better evidence.</p>
          </div>
          <button
            className="new-post-button"
            onClick={openNew}
            aria-label="Create a claim"
          >
            <Plus size={22} />
          </button>
        </div>
        <div className="story-strip" aria-label="Explore categories">
          <button
            className={`story ${category === "All" ? "selected" : ""}`}
            onClick={() => chooseCategory("All")}
          >
            <span className="story-ring">
              <span className="story-icon all-story">
                <Sparkles size={27} />
              </span>
            </span>
            <span>For you</span>
          </button>
          {topics.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.name}
                className={`story ${category === t.name ? "selected" : ""}`}
                onClick={() => chooseCategory(t.name)}
              >
                <span className="story-ring">
                  <span className="story-icon" style={{ background: t.color }}>
                    <Icon size={27} />
                  </span>
                </span>
                <span>{t.name}</span>
              </button>
            );
          })}
        </div>
        <div className="feed-toolbar">
          <div className="feed-tabs">
            {["For you", "Under review", "Saved"].map((f) => (
              <button
                key={f}
                className={filter === f ? "selected" : ""}
                onClick={() => {
                  setFilter(f);
                  setLimit(8);
                }}
              >
                {f}
                {f === "Saved" && <Bookmark size={13} />}
              </button>
            ))}
          </div>
          <button
            className="refresh-feed"
            onClick={refresh}
            disabled={loading}
            aria-label="Refresh feed"
          >
            <RefreshCw size={17} className={loading ? "spin" : ""} />
          </button>
        </div>
        <label className="feed-search">
          <Search size={17} />
          <input
            placeholder="Find a claim, spark your curiosity…"
            aria-label="Search feed"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(8);
            }}
          />
          {query && (
            <button aria-label="Clear search" onClick={() => setQuery("")}>
              <X size={15} />
            </button>
          )}
        </label>
        {category !== "All" && (
          <div className="topic-filter">
            Exploring {category}
            <button onClick={() => chooseCategory("All")}>
              Show all <X size={12} />
            </button>
          </div>
        )}
        <div className="posts-list">
          {filtered.slice(0, limit).map((c) => (
            <ClaimPost
              key={c._id}
              claim={c}
              user={user}
              refresh={refresh}
              notify={notify}
            />
          ))}
          {!filtered.length && (
            <div className="feed-empty">
              <Bookmark size={35} />
              <h2>
                {filter === "Saved"
                  ? "Your collection starts here"
                  : "No claims here yet"}
              </h2>
              <p>
                {filter === "Saved"
                  ? "Tap the bookmark on a claim to keep it for later."
                  : "Try another category or search, or start a new investigation."}
              </p>
            </div>
          )}
        </div>
        {filtered.length > limit && (
          <button className="load-posts" onClick={() => setLimit(limit + 8)}>
            Discover more claims <span>{filtered.length - limit} more</span>
          </button>
        )}
        <p className="feed-end">
          You’re building a more informed feed. One source at a time.
        </p>
      </section>
      <aside className="social-rail">
        <div className="rail-profile">
          <Face name={user.name} />
          <div>
            <strong>{user.name}</strong>
            <span>{user.role} · Your workspace</span>
          </div>
          <Link to="/team">Profile</Link>
        </div>
        <section className="rail-intro">
          <span className="rail-icon">
            <Sparkles size={22} />
          </span>
          <span className="feed-eyebrow">CURIOUS MINDS WELCOME</span>
          <h2>
            A feed worth
            <br />
            thinking about.
          </h2>
          <p>
            Don’t just scroll. Ask a question, check a source, add your
            perspective.
          </p>
          <button onClick={openNew}>
            Share a claim <Plus size={17} />
          </button>
        </section>
        <div className="rail-section-heading">
          <h3>Your community</h3>
          <Link to="/team">See all</Link>
        </div>
        {users.slice(0, 4).map((u) => (
          <div className="community-person" key={u._id}>
            <Face name={u.name} />
            <div>
              <strong>{u.name}</strong>
              <span>{u.role}</span>
            </div>
            <Link to="/team">View</Link>
          </div>
        ))}
        <section className="rail-progress">
          <div>
            <span>Workspace pulse</span>
            <span className="pulse-dot" />
          </div>
          <div>
            <strong>{claims.length}</strong>
            <span>claims to explore</span>
          </div>
          <div>
            <strong>
              {claims.filter((c) => c.status === "Verified").length}
            </strong>
            <span>completed reviews</span>
          </div>
          <Link to="/claims">
            Open investigation board <ArrowUpRight size={14} />
          </Link>
        </section>
        <p className="rail-note">
          <ShieldCheck size={15} /> Likes reflect interest, not accuracy.
          Verdicts come from evidence and human review.
        </p>
        <div className="rail-links">
          <Link to="/guide">Verification guide</Link>
          <span>·</span>
          <Link to="/evidence">Sources</Link>
          <span>·</span>
          <Link to="/team">Community</Link>
        </div>
        <small className="rail-copyright">© 2026 FACTCHECKR</small>
      </aside>
    </div>
  );
}
