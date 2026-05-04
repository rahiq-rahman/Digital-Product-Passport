// DPP/client/features/public/PublicPassport.jsx
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { AppLogo } from "../shared/Logo";

const API_BASE = "http://localhost:5000/api";

// ── Config ────────────────────────────────────────────────────────────────────
const STATUS_META = {
  CREATED:     { label: "Created",     color: "#2563eb", bg: "#eff6ff" },
  IN_SHOWROOM: { label: "In Showroom", color: "#d97706", bg: "#fffbeb" },
  SOLD:        { label: "Owned",       color: "#059669", bg: "#ecfdf5" },
  IN_REPAIR:   { label: "In Repair",   color: "#dc2626", bg: "#fef2f2" },
};
const TYPE_COLOR = {
  HARDWARE: "#2563eb", SOFTWARE: "#7c3aed", COSMETIC: "#d97706", OTHER: "#6b7280",
};
const GRADE_META = {
  Excellent: { color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", icon: "★", bar: "#059669" },
  Good:      { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", icon: "✓", bar: "#2563eb" },
  Fair:      { color: "#d97706", bg: "#fffbeb", border: "#fde68a", icon: "~", bar: "#d97706" },
  Caution:   { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", icon: "!", bar: "#dc2626" },
  Poor:      { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", icon: "✗", bar: "#7c3aed" },
};
const BREAKDOWN_LABELS = {
  lifecycle_integrity:       "Lifecycle",
  ownership_pattern:         "Ownership",
  repair_history:            "Repairs",
  warranty_validity:         "Warranty",
  registration_completeness: "Registration",
};

const EVENT_LABELS = {
  CREATED:            "Created",
  ASSIGNED_TO_USER:   "Assigned to User",
  SOLD_TO_CUSTOMER:   "Sold to Customer",
  MOVED_TO_SHOWROOM:  "Moved to Showroom",
  RETURNED_TO_MANUFACTURER: "Returned to Manufacturer",
  REPAIRED:           "Repaired",
  RECEIVED:           "Received",
  DISPATCHED:         "Dispatched",
  REGISTERED:         "Registered",
};

function formatEventType(type) {
  if (!type) return "Unknown event";
  if (EVENT_LABELS[type]) return EVENT_LABELS[type];
  return type
    .toLowerCase()
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #f5f4f0; font-family: 'Instrument Sans', sans-serif; min-height: 100vh; }

  .pp-shell { min-height: 100vh; background: #f5f4f0; padding: 24px 16px 56px; }
  .pp-wrap  { max-width: 640px; margin: 0 auto; }

  /* Header */
  .pp-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
  .pp-logo   { display:flex; align-items:center; gap:10px; }
  .pp-logo-mark { width:36px; height:36px; background:#111827; border-radius:9px; display:flex; align-items:center; justify-content:center; }
  .pp-logo-name { font-size:14px; font-weight:700; color:#111827; }
  .pp-logo-sub  { font-size:11px; color:#9ca3af; margin-top:1px; }
  .pp-login-btn { padding:8px 16px; border-radius:8px; border:1px solid #e5e3dc; background:#fff; color:#374151; font-size:13px; font-weight:600; cursor:pointer; font-family:'Instrument Sans',sans-serif; transition:all 0.14s; text-decoration:none; display:inline-flex; align-items:center; gap:6px; }
  .pp-login-btn:hover { border-color:#9ca3af; background:#f9fafb; }

  /* Verified banner */
  .pp-verified { background:#ecfdf5; border:1px solid #a7f3d0; border-radius:10px; padding:10px 16px; margin-bottom:14px; display:flex; align-items:center; gap:10px; font-size:13px; color:#059669; font-weight:500; }

  /* Hero card */
  .pp-hero { background:#fff; border:1px solid #ebe9e2; border-radius:16px; padding:24px; margin-bottom:14px; box-shadow:0 2px 12px rgba(0,0,0,0.05); }
  .pp-hero-top { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:18px; }
  .pp-product-name { font-size:22px; font-weight:700; color:#111827; letter-spacing:-0.02em; line-height:1.25; }
  .pp-status-badge { display:inline-flex; align-items:center; gap:6px; font-size:11px; font-weight:700; padding:4px 11px; border-radius:999px; white-space:nowrap; flex-shrink:0; letter-spacing:0.03em; }
  .pp-status-dot { width:5px; height:5px; border-radius:50%; }
  .pp-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px 20px; }
  .pp-field-label { font-size:11px; color:#9ca3af; font-weight:600; text-transform:uppercase; letter-spacing:0.07em; margin-bottom:4px; }
  .pp-field-value { font-size:13px; font-weight:600; color:#111827; }
  .pp-field-value.mono { font-family:'DM Mono',monospace; }
  .pp-desc { margin-top:16px; padding-top:16px; border-top:1px solid #ebe9e2; font-size:13px; color:#6b7280; line-height:1.65; }

  /* ── AI Summary card ── */
  .pp-ai-summary {
    background: linear-gradient(135deg, #111827 0%, #1e3a5f 100%);
    border-radius: 16px; padding: 22px 24px; margin-bottom: 14px;
    position: relative; overflow: hidden;
  }
  .pp-ai-summary::before {
    content: '';
    position: absolute; top: -40px; right: -40px;
    width: 160px; height: 160px; border-radius: 50%;
    background: rgba(37,99,235,0.15);
    pointer-events: none;
  }
  .pp-ai-header { display:flex; align-items:center; gap:10px; margin-bottom:14px; }
  .pp-ai-badge {
    display:inline-flex; align-items:center; gap:6px;
    background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.18);
    border-radius:999px; padding:4px 10px; font-size:11px; font-weight:600;
    color:rgba(255,255,255,0.9); letter-spacing:0.06em;
  }
  .pp-ai-badge-dot { width:6px; height:6px; border-radius:50%; background:#34d399; animation:pp-pulse 2s infinite; }
  @keyframes pp-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  .pp-ai-title { font-size:13px; font-weight:600; color:rgba(255,255,255,0.6); }
  .pp-ai-text {
    font-size:15px; color:#fff; line-height:1.7; font-weight:400;
    font-style:italic; position:relative; z-index:1;
  }
  .pp-ai-loading {
    display:flex; align-items:center; gap:10px;
    font-size:13px; color:rgba(255,255,255,0.5);
  }
  .pp-ai-error { font-size:13px; color:rgba(255,255,255,0.5); font-style:italic; }

  /* Typing cursor animation */
  .pp-cursor { display:inline-block; width:2px; height:1em; background:#fff; margin-left:2px; vertical-align:text-bottom; animation:pp-blink 0.8s step-end infinite; }
  @keyframes pp-blink { 0%,100%{opacity:1} 50%{opacity:0} }

  /* ── Authenticity Score card ── */
  .pp-score-card {
    background:#fff; border:1px solid #ebe9e2; border-radius:16px;
    overflow:hidden; margin-bottom:14px;
    box-shadow:0 2px 12px rgba(0,0,0,0.05);
  }
  .pp-score-head {
    padding:18px 22px 16px; border-bottom:1px solid #f0efe9;
    display:flex; align-items:center; justify-content:space-between;
  }
  .pp-score-label { font-size:12px; font-weight:700; color:#6b7280; text-transform:uppercase; letter-spacing:0.09em; }

  /* Big score display */
  .pp-score-hero {
    padding:22px 24px; display:flex; align-items:center; gap:20px;
    border-bottom:1px solid #f0efe9;
  }
  .pp-score-ring {
    position:relative; flex-shrink:0;
    width:80px; height:80px;
  }
  .pp-score-ring svg { transform:rotate(-90deg); }
  .pp-score-num {
    position:absolute; inset:0; display:flex; flex-direction:column;
    align-items:center; justify-content:center;
    font-size:22px; font-weight:700; color:#111827; line-height:1;
  }
  .pp-score-pct { font-size:10px; font-weight:600; color:#9ca3af; margin-top:1px; }
  .pp-score-info { flex:1; }
  .pp-grade-chip {
    display:inline-flex; align-items:center; gap:7px;
    padding:6px 14px; border-radius:999px; margin-bottom:10px;
    font-size:13px; font-weight:700; letter-spacing:0.03em;
  }
  .pp-verdict { font-size:13px; color:#374151; line-height:1.6; }

  /* Breakdown bars */
  .pp-breakdown { padding:18px 24px; }
  .pp-breakdown-title { font-size:11px; font-weight:700; color:#9ca3af; text-transform:uppercase; letter-spacing:0.09em; margin-bottom:14px; }
  .pp-breakdown-row { margin-bottom:14px; }
  .pp-breakdown-row:last-child { margin-bottom:0; }
  .pp-breakdown-meta { display:flex; align-items:center; justify-content:space-between; margin-bottom:5px; }
  .pp-breakdown-name { font-size:12px; font-weight:600; color:#374151; }
  .pp-breakdown-pts  { font-size:11px; font-weight:600; color:#9ca3af; font-family:'DM Mono',monospace; }
  .pp-breakdown-bar-bg { height:6px; background:#f0efe9; border-radius:3px; overflow:hidden; }
  .pp-breakdown-bar-fg { height:100%; border-radius:3px; transition:width 1.2s cubic-bezier(0.4,0,0.2,1); }
  .pp-breakdown-note { font-size:11px; color:#9ca3af; margin-top:4px; line-height:1.4; }

  /* Flags */
  .pp-flags { padding:0 24px 18px; display:flex; flex-direction:column; gap:6px; }
  .pp-flag {
    display:flex; align-items:flex-start; gap:8px;
    background:#fef2f2; border:1px solid #fecaca; border-radius:8px;
    padding:9px 12px; font-size:12px; color:#dc2626; line-height:1.45;
  }

  /* Score loading skeleton */
  .pp-score-skeleton { padding:22px 24px; }
  .pp-skel { background:#f0efe9; border-radius:6px; animation:pp-shimmer 1.5s infinite; }
  @keyframes pp-shimmer { 0%{opacity:0.6} 50%{opacity:1} 100%{opacity:0.6} }

  /* Section cards */
  .pp-section { background:#fff; border:1px solid #ebe9e2; border-radius:14px; overflow:hidden; margin-bottom:14px; box-shadow:0 1px 6px rgba(0,0,0,0.04); }
  .pp-section-head { padding:14px 18px 12px; border-bottom:1px solid #f0efe9; background:#fafaf8; display:flex; align-items:center; gap:8px; }
  .pp-section-title { font-size:12px; font-weight:700; color:#6b7280; text-transform:uppercase; letter-spacing:0.08em; }
  .pp-section-count { font-size:11px; font-weight:600; padding:2px 7px; border-radius:999px; background:#f0efe9; color:#9ca3af; }

  /* Ownership */
  .pp-owner-row { display:flex; align-items:center; justify-content:space-between; padding:12px 18px; border-bottom:1px solid #f0efe9; }
  .pp-owner-row:last-child { border-bottom:none; }
  .pp-owner-avatar { width:30px; height:30px; border-radius:8px; background:#ecfdf5; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .pp-owner-name { font-size:13px; font-weight:600; color:#111827; }
  .pp-owner-date { font-size:12px; color:#9ca3af; font-family:'DM Mono',monospace; }

  /* Repairs */
  .pp-repair-row { padding:14px 18px; border-bottom:1px solid #f0efe9; }
  .pp-repair-row:last-child { border-bottom:none; }
  .pp-repair-top { display:flex; align-items:flex-start; justify-content:space-between; gap:8px; margin-bottom:6px; }
  .pp-repair-issue { font-size:13px; font-weight:600; color:#111827; line-height:1.4; }
  .pp-repair-type { display:inline-flex; align-items:center; gap:5px; font-size:10px; font-weight:700; padding:3px 9px; border-radius:999px; white-space:nowrap; flex-shrink:0; }
  .pp-repair-meta { font-size:12px; color:#6b7280; display:flex; align-items:center; gap:8px; flex-wrap:wrap; }

  /* Timeline */
  .pp-timeline { padding:14px 18px; position:relative; }
  .pp-timeline-line { position:absolute; left:27px; top:14px; bottom:14px; width:1px; background:#e5e3dc; }
  .pp-event-row { display:flex; align-items:flex-start; gap:12px; padding:8px 0; position:relative; }
  .pp-event-dot { width:10px; height:10px; border-radius:50%; background:#2563eb; border:2px solid #fff; box-shadow:0 0 0 1px #bfdbfe; flex-shrink:0; margin-top:3px; }
  .pp-event-type { font-size:11px; font-weight:700; color:#2563eb; letter-spacing:0.04em; }
  .pp-event-desc { font-size:13px; color:#6b7280; margin-top:2px; line-height:1.45; }
  .pp-event-date { font-size:11px; color:#9ca3af; font-family:'DM Mono',monospace; white-space:nowrap; flex-shrink:0; margin-top:3px; }

  /* Empty / utils */
  .pp-empty { padding:28px 18px; text-align:center; color:#9ca3af; font-size:13px; }
  .pp-loading { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; color:#6b7280; font-size:14px; }
  .pp-error   { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; text-align:center; padding:24px; }
  .pp-error-icon { width:56px; height:56px; border-radius:14px; background:#fef2f2; display:flex; align-items:center; justify-content:center; margin-bottom:4px; }
  .pp-error-title { font-size:18px; font-weight:700; color:#111827; }
  .pp-error-sub   { font-size:14px; color:#6b7280; line-height:1.55; max-width:320px; }

  /* CTA */
  .pp-cta { background:#111827; border-radius:14px; padding:20px 24px; display:flex; align-items:center; justify-content:space-between; gap:16px; margin-top:6px; }
  .pp-cta-text { font-size:14px; font-weight:600; color:#fff; }
  .pp-cta-sub  { font-size:12px; color:#9ca3af; margin-top:3px; }
  .pp-cta-btn  { padding:10px 20px; border-radius:9px; background:#fff; color:#111827; font-size:13px; font-weight:700; border:none; cursor:pointer; font-family:'Instrument Sans',sans-serif; white-space:nowrap; transition:all 0.14s; flex-shrink:0; text-decoration:none; display:inline-block; }
  .pp-cta-btn:hover { background:#f0efe9; }

  @keyframes pp-spin { to{transform:rotate(360deg)} }
  @media(max-width:480px) {
    .pp-grid { grid-template-columns:1fr; }
    .pp-score-hero { flex-direction:column; align-items:flex-start; }
    .pp-cta { flex-direction:column; align-items:flex-start; }
  }
`;

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner({ color = "#111827", size = 32 }) {
  return (
    <div style={{ width: size, height: size, border: `${size > 20 ? 3 : 2}px solid #e5e3dc`, borderTop: `${size > 20 ? 3 : 2}px solid ${color}`, borderRadius: "50%", animation: "pp-spin 0.7s linear infinite" }} />
  );
}

// ── AI Summary section ────────────────────────────────────────────────────────
function AISummary({ text, loading, error }) {
  const [displayed, setDisplayed] = useState("");
  const [typing, setTyping]   = useState(false);

  // Typewriter effect whenever text arrives
  useEffect(() => {
    if (!text) return;
    setDisplayed("");
    setTyping(true);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(interval); setTyping(false); }
    }, 18);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <div className="pp-ai-summary">
      <div className="pp-ai-header">
        <div className="pp-ai-badge">
          <span className="pp-ai-badge-dot" />
          AI ANALYSIS
        </div>
        <div className="pp-ai-title">Passport Summary</div>
      </div>
      {loading ? (
        <div className="pp-ai-loading">
          <Spinner color="rgba(255,255,255,0.5)" size={18} />
          <span>Generating summary…</span>
        </div>
      ) : error ? (
        <div className="pp-ai-error">Summary unavailable at this time.</div>
      ) : (
        <div className="pp-ai-text">
          "{displayed}{typing && <span className="pp-cursor" />}"
        </div>
      )}
    </div>
  );
}

// ── Authenticity Score section ────────────────────────────────────────────────
function AuthenticityScore({ data, loading, error }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (data) setTimeout(() => setAnimate(true), 100);
  }, [data]);

  if (loading) {
    return (
      <div className="pp-score-card">
        <div className="pp-score-head">
          <span className="pp-score-label">Authenticity Score</span>
        </div>
        <div className="pp-score-skeleton">
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
            <div className="pp-skel" style={{ width: 80, height: 80, borderRadius: "50%" }} />
            <div style={{ flex: 1 }}>
              <div className="pp-skel" style={{ height: 28, borderRadius: 8, marginBottom: 10 }} />
              <div className="pp-skel" style={{ height: 14, borderRadius: 6 }} />
            </div>
          </div>
          {[100, 80, 90, 70, 85].map((w, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <div className="pp-skel" style={{ width: `${w}px`, height: 12, borderRadius: 4 }} />
                <div className="pp-skel" style={{ width: 40, height: 12, borderRadius: 4 }} />
              </div>
              <div className="pp-skel" style={{ height: 6, borderRadius: 3 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="pp-score-card">
        <div className="pp-score-head">
          <span className="pp-score-label">Authenticity Score</span>
        </div>
        <div className="pp-empty">Score unavailable at this time.</div>
      </div>
    );
  }

  const gm     = GRADE_META[data.grade] || GRADE_META.Fair;
  const radius = 30;
  const circ   = 2 * Math.PI * radius;
  const dash   = (data.total / 100) * circ;
  const flags  = (data.flags || []).filter(Boolean);

  return (
    <div className="pp-score-card">
      <div className="pp-score-head">
        <span className="pp-score-label">Authenticity Score</span>
        <span style={{ fontSize: 11, color: "#9ca3af", fontFamily: "'DM Mono', monospace" }}>Powered by Claude AI</span>
      </div>

      {/* Big score */}
      <div className="pp-score-hero">
        <div className="pp-score-ring">
          <svg width="80" height="80" viewBox="0 0 80 80">
            {/* Track */}
            <circle cx="40" cy="40" r={radius} fill="none" stroke="#f0efe9" strokeWidth="7" />
            {/* Progress */}
            <circle
              cx="40" cy="40" r={radius}
              fill="none"
              stroke={gm.bar}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={`${animate ? dash : 0} ${circ}`}
              style={{ transition: "stroke-dasharray 1.4s cubic-bezier(0.4,0,0.2,1)" }}
            />
          </svg>
          <div className="pp-score-num">
            {data.total}
            <span className="pp-score-pct">/100</span>
          </div>
        </div>

        <div className="pp-score-info">
          <div className="pp-grade-chip" style={{ color: gm.color, background: gm.bg, border: `1px solid ${gm.border}` }}>
            <span style={{ fontSize: 15 }}>{gm.icon}</span>
            {data.grade}
          </div>
          <div className="pp-verdict">{data.verdict}</div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="pp-breakdown">
        <div className="pp-breakdown-title">Score breakdown</div>
        {Object.entries(data.breakdown).map(([key, val]) => {
          const pct = (val.score / val.max) * 100;
          const barColor = pct >= 80 ? "#059669" : pct >= 55 ? "#2563eb" : pct >= 35 ? "#d97706" : "#dc2626";
          return (
            <div key={key} className="pp-breakdown-row">
              <div className="pp-breakdown-meta">
                <span className="pp-breakdown-name">{BREAKDOWN_LABELS[key] || key}</span>
                <span className="pp-breakdown-pts">{val.score}/{val.max}</span>
              </div>
              <div className="pp-breakdown-bar-bg">
                <div
                  className="pp-breakdown-bar-fg"
                  style={{ width: animate ? `${pct}%` : "0%", background: barColor }}
                />
              </div>
              <div className="pp-breakdown-note">{val.note}</div>
            </div>
          );
        })}
      </div>

      {/* Flags */}
      {flags.length > 0 && (
        <div className="pp-flags">
          {flags.map((flag, i) => (
            <div key={i} className="pp-flag">
              <svg width="14" height="14" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              {flag}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PublicPassport() {
  const { product_id } = useParams();
  const navigate        = useNavigate();
  const [passport, setPassport] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  const [aiData, setAiData]       = useState(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [aiError, setAiError]     = useState(false);

  useEffect(() => {
    if (!product_id) { setError("No product ID provided."); setLoading(false); return; }
    axios.get(`${API_BASE}/public/passport/${product_id}`)
      .then(r => setPassport(r.data))
      .catch(err => setError(err.response?.data?.error || "Product not found."))
      .finally(() => setLoading(false));
  }, [product_id]);

  // Single AI call — runs once passport is confirmed to exist
  useEffect(() => {
    if (!passport) return;
    setAiLoading(true);
    axios.get(`${API_BASE}/ai/analyze/${product_id}`)
      .then(r => setAiData(r.data))
      .catch(() => setAiError(true))
      .finally(() => setAiLoading(false));
  }, [passport]);

  const fmt = d => d
    ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  const Header = () => (
    <div className="pp-header">
      <AppLogo size={32} />
      <a href="/" className="pp-login-btn">
        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/>
        </svg>
        Sign in
      </a>
    </div>
  );

  if (loading) {
    return (
      <>
        <style>{css}</style>
        <div className="pp-loading"><Spinner /><span>Loading passport…</span></div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <style>{css}</style>
        <div className="pp-error">
          <div className="pp-error-icon">
            <svg width="26" height="26" fill="none" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div className="pp-error-title">Product not found</div>
          <div className="pp-error-sub">{error}</div>
          <button className="pp-login-btn" onClick={() => navigate("/")}>← Back to home</button>
        </div>
      </>
    );
  }

  const p  = passport.product;
  const sm = STATUS_META[p?.current_status] || STATUS_META.CREATED;

  return (
    <>
      <style>{css}</style>
      <div className="pp-shell">
        <div className="pp-wrap">
          <Header />

          {/* Verified banner */}
          <div className="pp-verified">
            <svg width="16" height="16" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            Verified product — registered on the DPP System
          </div>

          {/* Product hero */}
          <div className="pp-hero">
            <div className="pp-hero-top">
              <div className="pp-product-name">{p.product_name}</div>
              <span className="pp-status-badge" style={{ color: sm.color, background: sm.bg }}>
                <span className="pp-status-dot" style={{ background: sm.color }} />
                {sm.label}
              </span>
            </div>
            <div className="pp-grid">
              <div><div className="pp-field-label">Serial number</div><div className="pp-field-value mono">{p.serial_number || "—"}</div></div>
              <div><div className="pp-field-label">Model</div><div className="pp-field-value mono">{p.model_no || "—"}</div></div>
              <div><div className="pp-field-label">Manufacturing date</div><div className="pp-field-value">{fmt(p.manufacturing_date)}</div></div>
              <div><div className="pp-field-label">Warranty</div><div className="pp-field-value">{p.warranty ? `${p.warranty} months` : "—"}</div></div>
            </div>
            {p.description && <div className="pp-desc">{p.description}</div>}
          </div>

          {/* ── AI Summary ── */}
          <AISummary text={aiData?.summary} loading={aiLoading} error={aiError} />

          {/* ── Authenticity Score ── */}
          <AuthenticityScore data={aiData?.score} loading={aiLoading} error={aiError} />

          {/* Ownership history */}
          <div className="pp-section">
            <div className="pp-section-head">
              <svg width="13" height="13" fill="none" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
              <span className="pp-section-title">Ownership history</span>
              <span className="pp-section-count">{passport.ownership?.length || 0}</span>
            </div>
            {!passport.ownership?.length ? (
              <div className="pp-empty">No ownership records yet</div>
            ) : passport.ownership.map((o, i) => (
              <div key={i} className="pp-owner-row">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="pp-owner-avatar">
                    <svg width="13" height="13" fill="none" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <span className="pp-owner-name">{o.name}</span>
                </div>
                <span className="pp-owner-date">{fmt(o.transfer_date)}</span>
              </div>
            ))}
          </div>

          {/* Repair history */}
          <div className="pp-section">
            <div className="pp-section-head">
              <svg width="13" height="13" fill="none" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
              <span className="pp-section-title">Repair history</span>
              <span className="pp-section-count">{passport.repairs?.length || 0}</span>
            </div>
            {!passport.repairs?.length ? (
              <div className="pp-empty">No repairs recorded</div>
            ) : passport.repairs.map((r, i) => {
              const tc  = TYPE_COLOR[r.repair_type] || TYPE_COLOR.OTHER;
              const rsm = { IN_PROGRESS: { label: "In Progress", color: "#d97706" }, COMPLETED: { label: "Completed", color: "#059669" }, CANCELLED: { label: "Cancelled", color: "#9ca3af" } }[r.repair_status] || { label: r.repair_status, color: "#9ca3af" };
              return (
                <div key={i} className="pp-repair-row">
                  <div className="pp-repair-top">
                    <div className="pp-repair-issue">{r.issue}</div>
                    <span className="pp-repair-type" style={{ color: tc, background: `${tc}18` }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: tc, display: "inline-block" }} />
                      {r.repair_type}
                    </span>
                  </div>
                  <div className="pp-repair-meta">
                    <span>{r.repairshop_name}</span>
                    {r.repair_price && <><span style={{ color: "#d1d5db" }}>·</span><span>{r.repair_price} BDT</span></>}
                    {r.estimated_time && <><span style={{ color: "#d1d5db" }}>·</span><span>{r.estimated_time}</span></>}
                    <><span style={{ color: "#d1d5db" }}>·</span><span style={{ color: rsm.color, fontWeight: 600 }}>{rsm.label}</span></>
                    {r.repair_date && <><span style={{ color: "#d1d5db" }}>·</span><span>{fmt(r.repair_date)}</span></>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Event timeline */}
          <div className="pp-section">
            <div className="pp-section-head">
              <svg width="13" height="13" fill="none" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              <span className="pp-section-title">Event timeline</span>
              <span className="pp-section-count">{passport.events?.length || 0}</span>
            </div>
            {!passport.events?.length ? (
              <div className="pp-empty">No events recorded</div>
            ) : (
              <div className="pp-timeline">
                <div className="pp-timeline-line" />
                {passport.events.map((e, i) => (
                  <div key={i} className="pp-event-row">
                    <div style={{ paddingLeft: 4, display: "flex", alignItems: "flex-start", gap: 10, flex: 1 }}>
                      <div className="pp-event-dot" />
                      <div style={{ flex: 1 }}>
                        <div className="pp-event-type">{formatEventType(e.event_type)}</div>
                        <div className="pp-event-desc">{e.description}</div>
                      </div>
                    </div>
                    <div className="pp-event-date">{fmt(e.event_date)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="pp-cta">
            <div>
              <div className="pp-cta-text">Track your own products</div>
              <div className="pp-cta-sub">Sign up free to manage ownership, repairs and history.</div>
            </div>
            <a href="/register" className="pp-cta-btn">Get started →</a>
          </div>
        </div>
      </div>
    </>
  );
}