import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  ShieldCheck,
  LayoutDashboard,
  Files,
  BookOpen,
  Users,
  Search,
  Plus,
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  CircleHelp,
  MessageSquare,
  ExternalLink,
  Trash2,
  Pencil,
  X,
  LogOut,
  FileText,
  SlidersHorizontal,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";
import { api } from "./api";
import Feed from "./Feed";
import "./styles.css";
import "./feed.css";
const categories = [
  "Science",
  "Technology",
  "Health",
  "Environment",
  "Politics",
  "Other",
];
const blankClaim = {
  title: "",
  description: "",
  category: "Science",
  sourceUrl: "",
  priority: "Medium",
};
const blankEvidence = { title: "", url: "", note: "", stance: "Context" };
const date = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
function Badge({ value }) {
  return (
    <span className={`badge ${value.toLowerCase().replaceAll(" ", "-")}`}>
      {value === "Verified" ? (
        <Check size={12} />
      ) : value === "In review" ? (
        <Clock3 size={12} />
      ) : null}
      {value}
    </span>
  );
}
function Avatar({ name, small = false }) {
  return (
    <span className={`avatar ${small ? "small" : ""}`}>
      {name
        ?.split(" ")
        .map((x) => x[0])
        .slice(0, 2)
        .join("") || "?"}
    </span>
  );
}
function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function Empty({ title, children }) {
  return (
    <div className="empty">
      <Files size={30} />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
function Modal({ title, onClose, children }) {
  useEffect(() => {
    const old = document.activeElement;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const elements = [
          ...document.querySelectorAll(
            ".modal button,.modal input,.modal textarea,.modal select,.modal a",
          ),
        ].filter((x) => !x.disabled);
        const first = elements[0],
          last = elements.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    document
      .querySelector(".modal input,.modal textarea,.modal button")
      ?.focus();
    return () => {
      document.removeEventListener("keydown", handler);
      old?.focus();
    };
  }, []);
  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <header>
          <h2 id="modal-title">{title}</h2>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
function ClaimForm({ initial = blankClaim, onSave, onClose }) {
  const [data, setData] = useState({ ...initial });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setData({ ...data, [k]: v });
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          await onSave(data);
        } catch (e) {
          setError(e.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="form-intro">
        Make the claim specific and link to where you encountered it. Your team
        will assess the evidence.
      </p>
      <Field label="Claim statement">
        <input
          required
          minLength={10}
          maxLength={180}
          value={data.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="What statement needs to be checked?"
        />
      </Field>
      <Field label="Context & description">
        <textarea
          required
          minLength={20}
          maxLength={4000}
          rows={4}
          value={data.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Who made the claim, where, and why does it matter?"
        />
      </Field>
      <Field label="Original source URL">
        <input
          type="url"
          required
          value={data.sourceUrl}
          onChange={(e) => set("sourceUrl", e.target.value)}
          placeholder="https://..."
        />
      </Field>
      <div className="form-row">
        <Field label="Category">
          <select
            value={data.category}
            onChange={(e) => set("category", e.target.value)}
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Priority">
          <select
            value={data.priority}
            onChange={(e) => set("priority", e.target.value)}
          >
            {["Low", "Medium", "High"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <footer className="modal-footer">
        <button type="button" className="button secondary" onClick={onClose}>
          Cancel
        </button>
        <button className="button" disabled={busy}>
          {busy ? "Saving…" : initial._id ? "Save changes" : "Submit claim"}
          <ArrowRight size={16} />
        </button>
      </footer>
    </form>
  );
}
function Auth({ onLogin, mode }) {
  const [register, setRegister] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(data) {
    setBusy(true);
    setError("");
    try {
      const r = await api(`/auth/${register ? "register" : "login"}`, {
        method: "POST",
        body: data,
      });
      sessionStorage.setItem("factcheckr-token", r.token);
      onLogin(r.user);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-layout">
      <section className="auth-brand">
        <div className="brand">
          <ShieldCheck size={32} /> FactCheckr
          <span className="brand-dot">.</span>
        </div>
        <div>
          <span className="eyebrow">A SHARED PURSUIT OF THE TRUTH</span>
          <h1>
            Good questions.
            <br />
            Better evidence.
          </h1>
          <p>
            A collaborative workspace to investigate claims, connect the
            evidence, and reach informed conclusions.
          </p>
          <div className="auth-points">
            <span>
              <CheckCircle2 size={18} /> Trace every source
            </span>
            <span>
              <Users size={18} /> Review together
            </span>
            <span>
              <ShieldCheck size={18} /> Publish with confidence
            </span>
          </div>
        </div>
        <small>FULL STACK WEB DEVELOPMENT LAB · M.Sc AI & ML</small>
      </section>
      <section className="auth-form">
        <span className="eyebrow">YOUR VERIFICATION WORKSPACE</span>
        <h2>{register ? "Join the investigation." : "Welcome back."}</h2>
        <p>
          {register
            ? "Create a contributor account to start collaborating."
            : "Sign in and pick up where the evidence left off."}
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(Object.fromEntries(new FormData(e.target)));
          }}
        >
          {register && (
            <Field label="Full name">
              <input
                name="name"
                required
                minLength={2}
                maxLength={60}
                autoComplete="name"
              />
            </Field>
          )}
          <Field label="Email address">
            <input name="email" type="email" required autoComplete="email" />
          </Field>
          <Field label="Password">
            <input
              name="password"
              type="password"
              required
              minLength={register ? 8 : 1}
              maxLength={100}
              autoComplete={register ? "new-password" : "current-password"}
            />
          </Field>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="button full" disabled={busy}>
            {busy ? "Please wait…" : register ? "Create account" : "Sign in"}
            <ArrowRight size={17} />
          </button>
        </form>
        <p className="auth-switch">
          {register ? "Already have an account?" : "New to FactCheckr?"}{" "}
          <button
            className="text-button"
            onClick={() => {
              setRegister(!register);
              setError("");
            }}
          >
            {register ? "Sign in" : "Create an account"}
          </button>
        </p>
        {mode === "demo" && !register && (
          <div className="demo-box">
            <span className="eyebrow">EXPLORE THE DEMO</span>
            <p>Illustrative data · Changes reset when the server restarts.</p>
            <button
              className="button secondary full"
              disabled={busy}
              onClick={() =>
                submit({
                  email: "reviewer@factcheckr.demo",
                  password: "FactCheck123!",
                })
              }
            >
              Enter as reviewer <ArrowUpRight size={16} />
            </button>
            <button
              className="text-button"
              disabled={busy}
              onClick={() =>
                submit({
                  email: "contributor@factcheckr.demo",
                  password: "FactCheck123!",
                })
              }
            >
              Explore as contributor
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
function App() {
  const [user, setUser] = useState(null),
    [ready, setReady] = useState(false),
    [mode, setMode] = useState(""),
    [claims, setClaims] = useState([]),
    [users, setUsers] = useState([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false),
    [newClaim, setNewClaim] = useState(false),
    [toast, setToast] = useState("");
  const navigate = useNavigate();
  async function refresh() {
    setLoading(true);
    try {
      const [c, u] = await Promise.all([api("/claims"), api("/users")]);
      setClaims(c);
      setUsers(u);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    api("/health")
      .then((h) => setMode(h.mode))
      .catch(() =>
        setError("Cannot reach the API. Start the backend and refresh."),
      );
    if (sessionStorage.getItem("factcheckr-token"))
      api("/auth/me")
        .then(setUser)
        .catch(() => sessionStorage.removeItem("factcheckr-token"))
        .finally(() => setReady(true));
    else setReady(true);
  }, []);
  useEffect(() => {
    if (user) refresh();
  }, [user]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  function notify(message) {
    setToast(message);
  }
  if (!ready)
    return (
      <div className="loading">
        <LoaderCircle className="spin" />
        Loading workspace…
      </div>
    );
  if (!user)
    return (
      <>
        {error && (
          <div className="connection-error" role="alert">
            {error}
          </div>
        )}
        <Auth onLogin={setUser} mode={mode} />
      </>
    );
  const shared = {
    claims,
    users,
    user,
    refresh,
    notify,
    openNew: () => setNewClaim(true),
    loading,
  };
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <Link to="/" className="brand">
          <ShieldCheck size={27} />
          FactCheckr<span className="brand-dot">.</span>
        </Link>
        <div className="workspace">
          <span className="workspace-icon">F</span>
          <div>
            Research workspace<small>Collaborative verification</small>
          </div>
          <span className="workspace-check">
            <Check size={13} />
          </span>
        </div>
        <span className="nav-label">WORKSPACE</span>
        <nav>
          <NavLink end to="/">
            <LayoutDashboard size={18} />
            Home feed
          </NavLink>
          <NavLink to="/claims">
            <Files size={18} />
            All claims<span className="nav-count">{claims.length}</span>
          </NavLink>
          <NavLink to="/evidence">
            <BookOpen size={18} />
            Evidence library
          </NavLink>
          <NavLink to="/team">
            <Users size={18} />
            Collaborators
          </NavLink>
        </nav>
        <div className="sidebar-guide">
          <span className="guide-icon">
            <ShieldCheck size={22} />
          </span>
          <h4>Let evidence lead.</h4>
          <p>A strong conclusion starts with a source you can trust.</p>
          <Link to="/guide">
            Verification guide <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className="sidebar-bottom">
          <span className={`connection-dot ${mode === "demo" ? "demo" : ""}`} />
          {mode === "demo" ? "Demo workspace" : "MongoDB connected"}
          <small>
            {mode === "demo" ? "Data resets on restart" : "Persistent storage"}
          </small>
        </div>
        <div className="profile">
          <Avatar name={user.name} />
          <div>
            {user.name}
            <small>{user.role}</small>
          </div>
          <button
            className="icon-button"
            title="Sign out"
            aria-label="Sign out"
            onClick={() => {
              sessionStorage.removeItem("factcheckr-token");
              setUser(null);
              setClaims([]);
              navigate("/");
            }}
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <span>
            Workspace <span className="crumb-slash">/</span>{" "}
            <strong>FactCheckr</strong>
          </span>
          <div>
            <span className="team-pill">
              <span className="connection-dot" />
              Team workspace
            </span>
            <Avatar small name={user.name} />
          </div>
        </header>
        <main className="content">
          {error && (
            <div className="error" role="alert">
              {error}{" "}
              <button className="text-button" onClick={refresh}>
                Try again
              </button>
            </div>
          )}
          <Routes>
            <Route path="/" element={<Feed {...shared} />} />
            <Route path="/claims" element={<Claims {...shared} />} />
            <Route path="/claims/:id" element={<ClaimDetail {...shared} />} />
            <Route path="/evidence" element={<EvidenceLibrary {...shared} />} />
            <Route path="/team" element={<Team {...shared} />} />
            <Route path="/guide" element={<Guide />} />
            <Route
              path="*"
              element={
                <Empty title="Page not found">
                  <Link to="/">Return to overview</Link>
                </Empty>
              }
            />
          </Routes>
          <footer className="page-footer">
            FactCheckr <span>Evidence before opinion.</span>
            <small>Made for collaborative inquiry</small>
          </footer>
        </main>
      </div>
      {newClaim && (
        <Modal title="Submit a new claim" onClose={() => setNewClaim(false)}>
          <ClaimForm
            onClose={() => setNewClaim(false)}
            onSave={async (data) => {
              const c = await api("/claims", { method: "POST", body: data });
              setNewClaim(false);
              await refresh();
              notify("Claim submitted. Let the investigation begin.");
              navigate(`/claims/${c._id}`);
            }}
          />
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={19} />
          {toast}
        </div>
      )}
    </div>
  );
}
function PageHeading({ eyebrow, title, description, children }) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}
function ClaimTable({ claims, users }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>CLAIM</th>
            <th>STATUS</th>
            <th>EVIDENCE</th>
            <th>ASSIGNED TO</th>
            <th>UPDATED</th>
            <th>
              <span className="sr-only">Open</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {claims.map((c) => (
            <tr key={c._id}>
              <td>
                <Link className="claim-title" to={`/claims/${c._id}`}>
                  {c.title}
                </Link>
                <span className="claim-meta">
                  {c.category}
                  <span>·</span>
                  <span
                    className={`priority-dot ${c.priority.toLowerCase()}`}
                  />
                  {c.priority} priority
                </span>
              </td>
              <td>
                <Badge value={c.status} />
              </td>
              <td>
                <span className="evidence-count">
                  <BookOpen size={15} />
                  {c.evidence.length}{" "}
                  {c.evidence.length === 1 ? "source" : "sources"}
                </span>
              </td>
              <td>
                {c.reviewer ? (
                  <span className="assignee">
                    <Avatar
                      small
                      name={users.find((u) => u._id === c.reviewer)?.name}
                    />
                    {users.find((u) => u._id === c.reviewer)?.name ||
                      "Reviewer"}
                  </span>
                ) : (
                  <span className="muted">Unassigned</span>
                )}
              </td>
              <td className="muted date-cell">{date(c.updatedAt)}</td>
              <td>
                <Link
                  className="icon-button"
                  aria-label={`Open claim: ${c.title}`}
                  to={`/claims/${c._id}`}
                >
                  <ArrowUpRight size={17} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!claims.length && (
        <Empty title="No claims found">
          Try a different filter or submit your first claim.
        </Empty>
      )}
    </div>
  );
}
function Overview({ claims, users, user, openNew, loading }) {
  const totalEvidence = claims.reduce((n, c) => n + c.evidence.length, 0),
    verified = claims.filter((c) => c.status === "Verified").length,
    review = claims.filter((c) => c.status === "In review").length;
  const stats = [
    ["Total claims", claims.length, "Across your workspace", Files],
    ["Under review", review, "Investigations in progress", Clock3],
    ["Verified claims", verified, "Evidence-backed conclusions", ShieldCheck],
    ["Evidence collected", totalEvidence, "Sources linked to claims", BookOpen],
  ];
  const activity = claims
    .flatMap((c) => c.activity.map((a) => ({ ...a, claim: c })))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4);
  return (
    <>
      <PageHeading
        eyebrow="THE BIG PICTURE"
        title={`Hello, ${user.name.split(" ")[0]}.`}
        description="Here’s where your team stands in the pursuit of the truth."
      >
        <button className="button" onClick={openNew}>
          <Plus size={18} />
          Submit a claim
        </button>
      </PageHeading>
      <section className="hero-banner">
        <div>
          <span className="hero-label">
            <span /> EVERY CLAIM DESERVES A CLOSER LOOK
          </span>
          <h2>
            Less noise.
            <br />
            <em>More clarity.</em>
          </h2>
          <p>
            Bring claims into focus. Gather reliable evidence.
            <br />
            Build conclusions, together.
          </p>
          <Link to="/claims">
            Explore your investigations <ArrowRight size={17} />
          </Link>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="art-grid" />
          <div className="floating-note note-one">
            <span className="mini-icon">
              <BookOpen size={17} />
            </span>
            <div>
              Source identified<small>Evidence worth exploring</small>
            </div>
            <CheckCircle2 size={16} />
          </div>
          <div className="shield-orb">
            <ShieldCheck size={72} strokeWidth={1.1} />
          </div>
          <div className="floating-note note-two">
            <span className="mini-icon">
              <Check size={17} />
            </span>
            <div>
              Clarity through collaboration<small>One claim at a time</small>
            </div>
          </div>
          <span className="art-cross cross-one">+</span>
          <span className="art-cross cross-two">+</span>
        </div>
      </section>
      <section className="stats-grid" aria-label="Workspace statistics">
        {stats.map(([label, value, caption, Icon], i) => (
          <article className="stat" key={label}>
            <div>
              <span>{label}</span>
              <Icon size={19} />
            </div>
            <strong>{loading ? "—" : value.toString().padStart(2, "0")}</strong>
            <small>
              <span className={`stat-dot dot-${i}`} />
              {caption}
            </small>
          </article>
        ))}
      </section>
      <section className="panel recent-panel">
        <div className="panel-heading">
          <div>
            <h2>
              Recent claims <span>{claims.length}</span>
            </h2>
            <p>A closer look at what your team is investigating.</p>
          </div>
          <Link className="subtle-link" to="/claims">
            View all claims
            <ArrowRight size={15} />
          </Link>
        </div>
        <ClaimTable claims={claims.slice(0, 5)} users={users} />
      </section>
      <div className="bottom-grid">
        <section className="panel activity-panel">
          <div className="panel-heading">
            <h2>Workspace activity</h2>
            <span className="live-label">
              <span />
              Latest updates
            </span>
          </div>
          {activity.length ? (
            activity.map((a) => (
              <div className="activity-row" key={a._id}>
                <Avatar small name={a.author.name} />
                <div>
                  <p>
                    <strong>{a.author.name}</strong> · {a.text.toLowerCase()}
                  </p>
                  <Link to={`/claims/${a.claim._id}`}>{a.claim.title}</Link>
                  <small>{date(a.createdAt)}</small>
                </div>
              </div>
            ))
          ) : (
            <Empty title="A fresh start">
              Activity will appear as your team collaborates.
            </Empty>
          )}
        </section>
        <section className="principles">
          <span className="eyebrow">THE FACTCHECKR APPROACH</span>
          <h2>
            Trust is built.
            <br />
            Source by source.
          </h2>
          <p>
            Check the origin. Seek independent corroboration. Make your
            reasoning visible.
          </p>
          <Link to="/guide">
            A guide to better verification <ArrowUpRight size={16} />
          </Link>
          <div className="principle-bottom">
            <ShieldCheck size={28} />
            <span>
              Human judgment.
              <br />
              Transparent evidence.
            </span>
          </div>
        </section>
      </div>
    </>
  );
}
function Claims({ claims, users, openNew, loading }) {
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState("All claims"),
    [category, setCategory] = useState("All categories");
  const filtered = claims.filter(
    (c) =>
      (status === "All claims" || c.status === status) &&
      (category === "All categories" || category === c.category) &&
      `${c.title} ${c.description}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="INVESTIGATION BOARD"
        title="Every claim. A clearer picture."
        description="Find, investigate, and verify the statements that matter."
      >
        <button className="button" onClick={openNew}>
          <Plus size={18} />
          Submit a claim
        </button>
      </PageHeading>
      <section className="panel">
        <div className="tabs">
          {["All claims", "Unverified", "In review", "Verified"].map((s) => (
            <button
              className={s === status ? "active" : ""}
              key={s}
              onClick={() => setStatus(s)}
            >
              {s}
              <span>
                {
                  claims.filter((c) => s === "All claims" || c.status === s)
                    .length
                }
              </span>
            </button>
          ))}
        </div>
        <div className="filters">
          <label className="search-box">
            <Search size={18} />
            <input
              aria-label="Search claims"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search claims or keywords…"
            />
          </label>
          <label className="select-filter">
            <SlidersHorizontal size={16} />
            <select
              aria-label="Filter category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {["All categories", ...categories].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <span className="muted results">
            {loading ? "Loading…" : `${filtered.length} claims`}
          </span>
        </div>
        <ClaimTable claims={filtered} users={users} />
      </section>
    </>
  );
}
function EvidenceForm({ initial = blankEvidence, onSave, onClose }) {
  const [data, setData] = useState({ ...initial }),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const set = (k, v) => setData({ ...data, [k]: v });
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await onSave(data);
        } catch (e) {
          setError(e.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="form-intro">
        Record what this source actually establishes. Evidence changes will
        reopen verification.
      </p>
      <Field label="Source title">
        <input
          value={data.title}
          required
          minLength={3}
          maxLength={180}
          onChange={(e) => set("title", e.target.value)}
        />
      </Field>
      <Field label="Source URL">
        <input
          type="url"
          required
          value={data.url}
          onChange={(e) => set("url", e.target.value)}
        />
      </Field>
      <Field label="Relationship to the claim">
        <select
          value={data.stance}
          onChange={(e) => set("stance", e.target.value)}
        >
          {["Supports", "Contradicts", "Context"].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </Field>
      <Field label="Evidence notes">
        <textarea
          rows={4}
          required
          minLength={10}
          maxLength={2000}
          value={data.note}
          onChange={(e) => set("note", e.target.value)}
          placeholder="Summarize the relevant finding and any limitations."
        />
      </Field>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <footer className="modal-footer">
        <button type="button" className="button secondary" onClick={onClose}>
          Cancel
        </button>
        <button className="button" disabled={busy}>
          {busy ? "Saving…" : "Save evidence"}
        </button>
      </footer>
    </form>
  );
}
function ClaimDetail({ user, users, refresh, notify }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [claim, setClaim] = useState(null),
    [error, setError] = useState(""),
    [modal, setModal] = useState(null),
    [tab, setTab] = useState("Evidence"),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    setClaim(null);
    setError("");
    api(`/claims/${id}`)
      .then(setClaim)
      .catch((e) => setError(e.message));
  }, [id]);
  async function change(suffix, method, body) {
    const c = await api(`/claims/${id}${suffix}`, { method, body });
    if (c) setClaim(c);
    await refresh();
    notify("Workspace updated.");
    return c;
  }
  const canEdit =
    claim && (user.role === "reviewer" || claim.author.id === user._id);
  if (!claim)
    return error ? (
      <Empty title="Unable to open claim">
        {error}
        <br />
        <Link to="/claims">Back to claims</Link>
      </Empty>
    ) : (
      <div className="loading">
        <LoaderCircle className="spin" />
        Opening investigation…
      </div>
    );
  return (
    <>
      <Link className="back-link" to="/claims">
        <ArrowLeft size={16} />
        All claims
      </Link>
      <div className="detail-heading">
        <div className="detail-tags">
          <span className="eyebrow">{claim.category} / INVESTIGATION</span>
          <Badge value={claim.status} />
          {claim.verdict && <Badge value={claim.verdict} />}
        </div>
        <h1>{claim.title}</h1>
        <div className="detail-meta">
          <Avatar small name={claim.author.name} />
          <span>Submitted by {claim.author.name}</span>
          <span>· {date(claim.createdAt)}</span>
          <span className={`priority-dot ${claim.priority.toLowerCase()}`} />
          {claim.priority} priority
        </div>
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="detail-grid">
        <div>
          <section className="panel context-panel">
            <h2>Claim context</h2>
            <p>{claim.description}</p>
            <a
              className="source-link"
              href={claim.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              View original source
              <ExternalLink size={15} />
            </a>
            {canEdit && (
              <div className="context-actions">
                <button
                  className="text-button"
                  onClick={() => setModal({ type: "claim" })}
                >
                  <Pencil size={14} />
                  Edit claim
                </button>
                <button
                  className="text-button danger"
                  onClick={() => setModal({ type: "delete-claim" })}
                >
                  <Trash2 size={14} />
                  Delete claim
                </button>
              </div>
            )}
          </section>
          <section className="panel detail-panel">
            <div className="tabs">
              {["Evidence", "Discussion", "Activity"].map((t) => (
                <button
                  key={t}
                  className={tab === t ? "active" : ""}
                  onClick={() => setTab(t)}
                >
                  {t}
                  <span>
                    {t === "Evidence"
                      ? claim.evidence.length
                      : t === "Discussion"
                        ? claim.comments.length
                        : claim.activity.length}
                  </span>
                </button>
              ))}
            </div>
            {tab === "Evidence" && (
              <div className="panel-body">
                <div className="section-toolbar">
                  <p>Sources that help make sense of the claim.</p>
                  <button
                    className="button small-button"
                    onClick={() => setModal({ type: "evidence" })}
                  >
                    <Plus size={15} />
                    Add evidence
                  </button>
                </div>
                {claim.evidence.length ? (
                  claim.evidence.map((e) => (
                    <article className="evidence-card" key={e._id}>
                      <div className="evidence-card-top">
                        <span className="source-symbol">
                          <FileText size={20} />
                        </span>
                        <Badge value={e.stance} />
                      </div>
                      <a href={e.url} target="_blank" rel="noreferrer">
                        {e.title}
                        <ExternalLink size={15} />
                      </a>
                      <small className="url-text">
                        {new URL(e.url).hostname}
                      </small>
                      <p>{e.note}</p>
                      <footer>
                        <span>
                          <Avatar small name={e.author.name} />
                          {e.author.name} · {date(e.createdAt)}
                        </span>
                        {(e.author.id === user._id ||
                          user.role === "reviewer") && (
                          <div>
                            <button
                              className="icon-button"
                              aria-label={`Edit evidence ${e.title}`}
                              onClick={() =>
                                setModal({ type: "evidence", data: e })
                              }
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              className="icon-button danger"
                              aria-label={`Delete evidence ${e.title}`}
                              onClick={() =>
                                setModal({ type: "delete-evidence", data: e })
                              }
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )}
                      </footer>
                    </article>
                  ))
                ) : (
                  <Empty title="The evidence starts here">
                    Add a reliable source to begin investigating this claim.
                  </Empty>
                )}
              </div>
            )}
            {tab === "Discussion" && (
              <div className="panel-body">
                {claim.comments.map((c) => (
                  <article className="comment" key={c._id}>
                    <Avatar name={c.author.name} />
                    <div>
                      <strong>
                        {c.author.name}
                        <small>{date(c.createdAt)}</small>
                      </strong>
                      <p>{c.text}</p>
                    </div>
                  </article>
                ))}
                {!claim.comments.length && (
                  <Empty title="Open the conversation">
                    Compare interpretations and point out gaps in the evidence.
                  </Empty>
                )}
                <form
                  className="comment-form"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    setBusy(true);
                    setError("");
                    try {
                      await change("/comments", "POST", {
                        text: new FormData(form).get("text"),
                      });
                      form.reset();
                    } catch (e) {
                      setError(e.message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <Field label="Add to the discussion">
                    <textarea
                      name="text"
                      required
                      minLength={2}
                      maxLength={2000}
                      rows={3}
                      placeholder="Share a question, finding, or alternative interpretation…"
                    />
                  </Field>
                  <button className="button" disabled={busy}>
                    <MessageSquare size={16} />
                    {busy ? "Posting…" : "Post comment"}
                  </button>
                </form>
              </div>
            )}
            {tab === "Activity" && (
              <div className="panel-body">
                {[...claim.activity].reverse().map((a) => (
                  <div className="activity-row" key={a._id}>
                    <Avatar small name={a.author.name} />
                    <div>
                      <p>
                        <strong>{a.author.name}</strong> · {a.text}
                      </p>
                      <small>
                        {new Date(a.createdAt).toLocaleString("en-IN")}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
        <aside className="review-column">
          <section className="panel review-panel">
            <span className="eyebrow">VERIFICATION</span>
            <h2>
              {claim.verdict
                ? "The team’s conclusion"
                : "A conclusion in progress"}
            </h2>
            {claim.verdict ? (
              <>
                <Badge value={claim.verdict} />
                <p>{claim.rationale}</p>
              </>
            ) : (
              <p>
                A verdict needs supporting evidence and a clear explanation from
                a reviewer.
              </p>
            )}
            <div className="review-facts">
              <span>
                Reviewer
                <strong>
                  {users.find((u) => u._id === claim.reviewer)?.name ||
                    "Not assigned"}
                </strong>
              </span>
              <span>
                Evidence sources<strong>{claim.evidence.length}</strong>
              </span>
              <span>
                Last updated<strong>{date(claim.updatedAt)}</strong>
              </span>
            </div>
            {user.role === "reviewer" && (
              <>
                <button
                  className="button full"
                  onClick={() => setModal({ type: "verdict" })}
                >
                  <ShieldCheck size={17} />
                  {claim.verdict ? "Revise verdict" : "Publish a verdict"}
                </button>
                <button
                  className="button secondary full"
                  onClick={() => setModal({ type: "assign" })}
                >
                  <Users size={16} />
                  Assign reviewer
                </button>
              </>
            )}
          </section>
          <div className="review-note">
            <CircleHelp size={20} />
            <p>
              <strong>A verdict is a reasoned assessment.</strong> Source links
              and explanations keep the process open to scrutiny. FactCheckr
              does not automatically determine truth.
            </p>
          </div>
        </aside>
      </div>
      {modal && (
        <Modal
          title={
            {
              claim: "Edit claim",
              evidence: modal.data ? "Edit evidence" : "Add evidence",
              verdict: "Publish a verdict",
              assign: "Assign a reviewer",
              "delete-claim": "Delete this claim?",
              "delete-evidence": "Remove this evidence?",
            }[modal.type]
          }
          onClose={() => setModal(null)}
        >
          {modal.type === "claim" && (
            <ClaimForm
              initial={claim}
              onClose={() => setModal(null)}
              onSave={async (d) => {
                await change("", "PUT", d);
                setModal(null);
              }}
            />
          )}
          {modal.type === "evidence" && (
            <EvidenceForm
              initial={modal.data || blankEvidence}
              onClose={() => setModal(null)}
              onSave={async (d) => {
                await change(
                  `/evidence${modal.data ? `/${modal.data._id}` : ""}`,
                  modal.data ? "PUT" : "POST",
                  d,
                );
                setModal(null);
              }}
            />
          )}
          {["verdict", "assign"].includes(modal.type) && (
            <ReviewForm
              type={modal.type}
              claim={claim}
              users={users}
              onClose={() => setModal(null)}
              onSave={async (d) => {
                await change("/review", "PUT", d);
                setModal(null);
              }}
            />
          )}
          {modal.type.startsWith("delete") && (
            <DeleteForm
              title={modal.data?.title || claim.title}
              onClose={() => setModal(null)}
              onDelete={async () => {
                await change(
                  modal.data ? `/evidence/${modal.data._id}` : "",
                  "DELETE",
                );
                setModal(null);
                if (!modal.data) navigate("/claims");
              }}
            />
          )}
        </Modal>
      )}
    </>
  );
}
function DeleteForm({ title, onClose, onDelete }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <>
      <p className="form-intro">
        “{title}” will be permanently removed. This cannot be undone.
      </p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <footer className="modal-footer">
        <button className="button secondary" onClick={onClose}>
          Cancel
        </button>
        <button
          className="button danger-button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onDelete();
            } catch (e) {
              setError(e.message);
              setBusy(false);
            }
          }}
        >
          {busy ? "Removing…" : "Delete"}
        </button>
      </footer>
    </>
  );
}
function ReviewForm({ type, claim, users, onClose, onSave }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await onSave(Object.fromEntries(new FormData(e.target)));
        } catch (e) {
          setError(e.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="form-intro">
        {type === "assign"
          ? "Assign a reviewer to take ownership of the investigation. This reopens verification."
          : "Make your reasoning explicit. At least one evidence source is required."}
      </p>
      {type === "assign" ? (
        <Field label="Reviewer">
          <select name="reviewer" defaultValue={claim.reviewer} required>
            <option value="" disabled>
              Select a reviewer
            </option>
            {users
              .filter((u) => u.role === "reviewer")
              .map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
          </select>
        </Field>
      ) : (
        <>
          <Field label="Verdict">
            <select
              name="verdict"
              defaultValue={claim.verdict || "Inconclusive"}
            >
              {["True", "False", "Misleading", "Inconclusive"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="Reasoning & limitations">
            <textarea
              name="rationale"
              required
              minLength={20}
              maxLength={4000}
              defaultValue={claim.rationale}
              rows={5}
              placeholder="Explain how the evidence supports this conclusion…"
            />
          </Field>
        </>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <footer className="modal-footer">
        <button type="button" className="button secondary" onClick={onClose}>
          Cancel
        </button>
        <button className="button" disabled={busy}>
          {busy
            ? "Saving…"
            : type === "assign"
              ? "Assign reviewer"
              : "Publish verdict"}
        </button>
      </footer>
    </form>
  );
}
function EvidenceLibrary({ claims }) {
  const [search, setSearch] = useState("");
  const evidence = claims
    .flatMap((c) => c.evidence.map((e) => ({ ...e, claim: c })))
    .filter((e) =>
      `${e.title} ${e.note}`.toLowerCase().includes(search.toLowerCase()),
    );
  return (
    <>
      <PageHeading
        eyebrow="THE SOURCE OF CLARITY"
        title="Evidence library"
        description="A shared collection of sources, with their context intact."
      />
      <label className="search-box library-search">
        <Search size={18} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Find a source or finding…"
          aria-label="Search evidence"
        />
      </label>
      <div className="library-grid">
        {evidence.map((e) => (
          <article className="panel library-card" key={e._id}>
            <div>
              <BookOpen size={22} />
              <Badge value={e.stance} />
            </div>
            <a
              className="library-title"
              href={e.url}
              target="_blank"
              rel="noreferrer"
            >
              {e.title}
              <ExternalLink size={15} />
            </a>
            <small className="muted">{new URL(e.url).hostname}</small>
            <p>{e.note}</p>
            <Link className="linked-claim" to={`/claims/${e.claim._id}`}>
              <span>LINKED CLAIM</span>
              {e.claim.title}
              <ArrowUpRight size={16} />
            </Link>
          </article>
        ))}
      </div>
      {!evidence.length && (
        <Empty title="No evidence found">
          Sources added to claims will appear here.
        </Empty>
      )}
    </>
  );
}
function Team({ users, claims }) {
  return (
    <>
      <PageHeading
        eyebrow="BETTER, TOGETHER"
        title="Your collaborators"
        description="Different perspectives. A shared standard of evidence."
      />
      <div className="team-grid">
        {users.map((u) => (
          <article className="panel team-card" key={u._id}>
            <Avatar name={u.name} />
            <h2>{u.name}</h2>
            <p>{u.email}</p>
            <Badge value={u.role} />
            <div>
              <span>
                Claims submitted
                <strong>
                  {claims.filter((c) => c.author.id === u._id).length}
                </strong>
              </span>
              <span>
                Assigned reviews
                <strong>
                  {claims.filter((c) => c.reviewer === u._id).length}
                </strong>
              </span>
            </div>
          </article>
        ))}
      </div>
      <p className="help-text">
        New accounts join as contributors. Reviewer roles are provisioned by the
        database administrator.
      </p>
    </>
  );
}
function Guide() {
  return (
    <>
      <PageHeading
        eyebrow="A LITTLE METHOD GOES A LONG WAY"
        title="Let evidence lead."
        description="A practical guide to transparent, collaborative verification."
      />
      <div className="guide-grid">
        {[
          [
            "01",
            "Define the claim",
            "Capture one testable statement. Record its original source, date, context, and scope. Avoid combining several claims into one investigation.",
          ],
          [
            "02",
            "Check the source",
            "Prefer original documents, primary research, and direct records. Inspect authorship, publication dates, methods, and conflicts of interest. A credible publisher can still be misquoted.",
          ],
          [
            "03",
            "Seek corroboration",
            "Find independent sources. Explain whether each supports, contradicts, or adds context. Several copies of the same article are not independent evidence.",
          ],
          [
            "04",
            "Review together",
            "Use discussion to challenge interpretations and identify missing context. Reviewers should examine the source itself, rather than rely only on a contributor’s summary.",
          ],
          [
            "05",
            "State a careful verdict",
            "True: supported as stated. False: contradicted. Misleading: contains truth but omits material context. Inconclusive: the available evidence cannot settle the question.",
          ],
          [
            "06",
            "Keep the trail visible",
            "Publish your rationale and limitations. New evidence or claim edits reopen verification. Sample records are teaching examples and must be evaluated before real use.",
          ],
        ].map(([n, t, p]) => (
          <article className="panel guide-card" key={n}>
            <span>{n}</span>
            <h2>{t}</h2>
            <p>{p}</p>
          </article>
        ))}
      </div>
    </>
  );
}
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
