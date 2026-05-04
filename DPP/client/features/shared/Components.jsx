// DPP/client/features/shared/components.jsx
// Reusable UI building blocks shared across Showroom, Customer, and Repair dashboards.

import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────────────────────────────────────
export function Toast({ toast }) {
  if (!toast?.text) return null;
  return (
    <div className={`toast ${toast.type === "error" ? "toast-err" : "toast-ok"}`}>
      {toast.text}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// useToast — hook for toast state + notify helper
// ─────────────────────────────────────────────────────────────────────────────
export function useToast() {
  const [toast, setToast] = useState({ text: "", type: "" });
  const notify = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: "", type: "" }), 3500);
  };
  return { toast, notify };
}

// ─────────────────────────────────────────────────────────────────────────────
// StatusBadge
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_MAP = {
  IN_SHOWROOM: { label: "In Showroom", color: "var(--amber)", bg: "var(--amber-bg)" },
  SOLD:        { label: "Sold",        color: "var(--green)", bg: "var(--green-bg)" },
  CREATED:     { label: "Created",     color: "var(--blue)",  bg: "var(--blue-bg)"  },
  IN_REPAIR:   { label: "In Repair",   color: "var(--red)",   bg: "var(--red-bg)"   },
};

export function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.CREATED;
  return (
    <span className="badge" style={{ color: s.color, background: s.bg }}>
      <span className="badge-dot" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal
// ─────────────────────────────────────────────────────────────────────────────
export function Modal({ title, subtitle, onClose, wide, children }) {
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal${wide ? " modal-lg" : ""}`}>
        <div className="modal-head">
          <div>
            <div className="modal-title">{title}</div>
            {subtitle && <div className="modal-subtitle">{subtitle}</div>}
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OTPBoxes — 6-digit input row
// ─────────────────────────────────────────────────────────────────────────────
export function OTPBoxes({
  digits,
  setDigits,
  accentColor = "var(--blue)",
  idPrefix = "otp",
  onComplete,
}) {
  const update = (i, val) => {
    const n = [...digits];
    n[i] = val;
    setDigits(n);
    if (val && i < 5) document.getElementById(`${idPrefix}-${i + 1}`)?.focus();
    if (n.every(d => d) && onComplete) onComplete(n.join(""));
  };

  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center", margin: "14px 0 18px" }}>
      {digits.map((d, i) => (
        <input
          key={i}
          id={`${idPrefix}-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          autoFocus={i === 0}
          onChange={e => update(i, e.target.value.replace(/\D/, ""))}
          onKeyDown={e => {
            if (e.key === "Backspace" && !digits[i] && i > 0)
              document.getElementById(`${idPrefix}-${i - 1}`)?.focus();
          }}
          onPaste={e => {
            const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
            if (p.length === 6) {
              const arr = p.split("");
              setDigits(arr);
              document.getElementById(`${idPrefix}-5`)?.focus();
              if (onComplete) onComplete(p);
              e.preventDefault();
            }
          }}
          style={{
            width: 48, height: 56,
            border: `1.5px solid var(--border)`,
            borderRadius: 11,
            textAlign: "center",
            fontSize: 24, fontWeight: 700,
            color: "var(--text-1)",
            fontFamily: "var(--font-mono)",
            background: d ? "#fff" : "#fafaf8",
            outline: "none",
            transition: "border-color 0.14s, box-shadow 0.14s, background 0.14s",
          }}
          onFocus={e => {
            e.target.style.borderColor = accentColor;
            e.target.style.boxShadow = `0 0 0 3px ${accentColor}22`;
          }}
          onBlur={e => {
            e.target.style.borderColor = d ? accentColor : "var(--border)";
            e.target.style.boxShadow = "none";
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OTPResend — countdown + resend button
// ─────────────────────────────────────────────────────────────────────────────
export function OTPResend({ onResend, loading, accentColor = "var(--blue)" }) {
  const [cooldown, setCooldown] = useState(30);

  const startCooldown = () => {
    setCooldown(30);
    const t = setInterval(() =>
      setCooldown(c => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000
    );
    return t;
  };

  // Start the initial 30s cooldown when the OTP step first renders
  useEffect(() => {
    const t = startCooldown();
    return () => clearInterval(t);
  }, []);

  const handleResend = async () => {
    await onResend();
    startCooldown();
  };

  return (
    <div style={{ textAlign: "center", marginBottom: 20, fontSize: 13, color: "var(--text-4)" }}>
      <button
        onClick={handleResend}
        disabled={cooldown > 0 || loading}
        style={{
          background: "none", border: "none", cursor: cooldown > 0 ? "default" : "pointer",
          color: cooldown > 0 ? "var(--text-4)" : accentColor,
          fontSize: 13, fontWeight: 500, fontFamily: "var(--font-sans)",
          padding: 0,
        }}
      >
        {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ErrorBox — inline error display
// ─────────────────────────────────────────────────────────────────────────────
export function ErrorBox({ error }) {
  if (!error) return null;
  return (
    <div style={{
      fontSize: 13, color: "var(--red)", background: "var(--red-bg)",
      border: "1px solid var(--red-border)", borderRadius: 8,
      padding: "10px 14px", marginBottom: 16,
    }}>
      {error}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EmailPill — masked email display
// ─────────────────────────────────────────────────────────────────────────────
export function EmailPill({ email, accentColor = "var(--blue)", accentBg, accentBorder }) {
  const mask = e => {
    if (!e) return "";
    const [l, d] = e.split("@");
    return `${l.slice(0, 2)}***@${d}`;
  };
  return (
    <div style={{
      background: accentBg || "var(--blue-bg)",
      border: `1px solid ${accentBorder || "var(--blue-border)"}`,
      borderRadius: 8, padding: "8px 14px", marginBottom: 4,
      fontSize: 13, color: accentColor,
      fontFamily: "var(--font-mono)", textAlign: "center",
    }}>
      {mask(email)}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ProductInfoCard — compact product info grid
// ─────────────────────────────────────────────────────────────────────────────
export function ProductInfoCard({ product, style }) {
  if (!product) return null;
  const rows = [
    ["Product", product.product_name],
    ["Serial",  product.serial_number],
    ["Model",   product.model_no],
    ["Warranty", product.warranty ? `${product.warranty} mo.` : "—"],
  ];
  return (
    <div style={{
      background: "var(--bg)", borderRadius: 10, padding: "14px 16px",
      border: "1px solid var(--border)", marginBottom: 20, ...style,
    }}>
      <div className="grid-2" style={{ gap: "8px 20px" }}>
        {rows.map(([k, v]) => (
          <div key={k}>
            <div className="fs-11 text-4 mb-4">{k}</div>
            <div className="fs-13 fw-500 text-1">{v || "—"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StatCard
// ─────────────────────────────────────────────────────────────────────────────
export function StatCard({ label, value, color, pct = 100 }) {
  return (
    <div className="stat-card">
      <div className="fs-11 fw-600 text-4" style={{ letterSpacing: "0.07em", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{
        fontSize: 34, fontWeight: 700, color, marginTop: 8,
        lineHeight: 1, fontVariantNumeric: "tabular-nums",
      }}>
        {value}
      </div>
      <div className="bar-bg">
        <div className="bar-fg" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FilterToolbar — search + select dropdowns + result count
// ─────────────────────────────────────────────────────────────────────────────
export function FilterToolbar({
  search, onSearch,
  filters = [],           // [{ value, onChange, options: [{value,label}], minWidth }]
  resultCount, totalCount,
  label = "items",
  extra = null,           // any extra right-side node
}) {
  return (
    <div style={{
      padding: "14px 20px",
      borderBottom: "1px solid var(--border)",
      background: "#fafaf8",
      display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
    }}>
      {/* Search */}
      <div style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 320 }}>
        <svg style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
          width="13" height="13" fill="none" stroke="var(--text-4)" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          className="inp"
          style={{ paddingLeft: 32, fontSize: 13 }}
          placeholder="Search…"
          value={search}
          onChange={e => onSearch(e.target.value)}
        />
      </div>

      {/* Dynamic select filters */}
      {filters.map((f, i) => (
        <select
          key={i}
          className="inp"
          style={{ width: "auto", minWidth: f.minWidth || 150, fontSize: 13 }}
          value={f.value}
          onChange={e => f.onChange(e.target.value)}
        >
          {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ))}

      {/* Count + extra */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
        <span className="fs-12 text-4" style={{ whiteSpace: "nowrap" }}>
          {resultCount} / {totalCount} {label}
        </span>
        {extra}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ActiveFilterChips — dismissible filter chips row
// ─────────────────────────────────────────────────────────────────────────────
export function ActiveFilterChips({ chips = [], onClearAll }) {
  const visible = chips.filter(c => c.value);
  if (!visible.length) return null;

  const chipColors = {
    blue:   { bg: "var(--blue-bg)",   border: "var(--blue-border)",   color: "var(--blue)"   },
    amber:  { bg: "var(--amber-bg)",  border: "var(--amber-border)",  color: "var(--amber)"  },
    green:  { bg: "var(--green-bg)",  border: "var(--green-border)",  color: "var(--green)"  },
    red:    { bg: "var(--red-bg)",    border: "var(--red-border)",    color: "var(--red)"    },
    purple: { bg: "var(--purple-bg)", border: "var(--purple-border)", color: "var(--purple)" },
  };

  return (
    <div style={{
      padding: "10px 20px",
      borderBottom: "1px solid var(--border)",
      display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
    }}>
      <span className="fs-11 fw-600 text-4" style={{ textTransform: "uppercase", letterSpacing: "0.07em" }}>
        Filters:
      </span>
      {visible.map((chip, i) => {
        const c = chipColors[chip.color || "blue"];
        return (
          <span key={i} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: c.bg, border: `1px solid ${c.border}`,
            borderRadius: 999, padding: "3px 10px",
            fontSize: 12, color: c.color, fontWeight: 500,
          }}>
            {chip.label}
            <button onClick={chip.onRemove} style={{
              background: "none", border: "none", cursor: "pointer",
              color: c.color, fontSize: 14, lineHeight: 1, padding: 0,
            }}>×</button>
          </span>
        );
      })}
      <button onClick={onClearAll} style={{
        background: "none", border: "none", cursor: "pointer",
        color: "var(--text-4)", fontSize: 11, textDecoration: "underline",
      }}>
        Clear all
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SuccessScreen — generic success state for modal step "done"
// ─────────────────────────────────────────────────────────────────────────────
export function SuccessScreen({ title, body, onClose, color = "var(--green)", bg = "var(--green-bg)" }) {
  return (
    <div style={{ textAlign: "center", padding: "8px 0" }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14, background: bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 16px",
      }}>
        <svg width="24" height="24" fill="none" stroke={color} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
      <div className="fs-16 fw-600 text-1 mb-8">{title}</div>
      <div className="fs-14 text-3" style={{ lineHeight: 1.6 }}>{body}</div>
      <button className="btn btn-outline" style={{ marginTop: 24, padding: "10px 28px" }} onClick={onClose}>
        Done
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// AI hooks used inside PassportModal
// ─────────────────────────────────────────────────────────────────────────────
const GRADE_META = {
  Excellent: { color: "var(--green)",  bg: "var(--green-bg)",  border: "var(--green-border)",  icon: "★" },
  Good:      { color: "var(--blue)",   bg: "var(--blue-bg)",   border: "var(--blue-border)",   icon: "✓" },
  Fair:      { color: "var(--amber)",  bg: "var(--amber-bg)",  border: "var(--amber-border)",  icon: "~" },
  Caution:   { color: "var(--red)",    bg: "var(--red-bg)",    border: "var(--red-border)",    icon: "!" },
  Poor:      { color: "var(--purple)", bg: "var(--purple-bg)", border: "var(--purple-border)", icon: "✗" },
};
const BREAKDOWN_LABELS = {
  lifecycle_integrity:       "Lifecycle",
  ownership_pattern:         "Ownership",
  repair_history:            "Repairs",
  warranty_validity:         "Warranty",
  registration_completeness: "Registration",
};

function usePassportAI(productId) {
  const [aiData,    setAiData]    = useState(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [aiError,   setAiError]   = useState(false);
  const fetched = useRef(false);

  useEffect(() => {
    if (!productId || fetched.current) return;
    fetched.current = true;
    fetch(`http://localhost:5000/api/ai/analyze/${productId}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => setAiData(d))
      .catch(() => setAiError(true))
      .finally(() => setAiLoading(false));
  }, [productId]);

  return { aiData, aiLoading, aiError };
}

// AI Summary strip
function AISummaryStrip({ aiData, aiLoading, aiError }) {
  const [displayed, setDisplayed] = useState("");
  const [typing,    setTyping]    = useState(false);
  const text = aiData?.summary || "";

  useEffect(() => {
    if (!text) return;
    setDisplayed(""); setTyping(true);
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(iv); setTyping(false); }
    }, 16);
    return () => clearInterval(iv);
  }, [text]);

  return (
    <div style={{
      background: "linear-gradient(135deg,#111827 0%,#1e3a5f 100%)",
      borderRadius: 10, padding: "14px 16px", marginBottom: 10, position: "relative", overflow: "hidden",
    }}>
      {/* subtle glow */}
      <div style={{ position:"absolute", top:-30, right:-30, width:120, height:120, borderRadius:"50%", background:"rgba(37,99,235,0.15)", pointerEvents:"none" }} />
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.18)", borderRadius:999, padding:"3px 9px", fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.9)", letterSpacing:"0.06em" }}>
          <span style={{ width:5, height:5, borderRadius:"50%", background:aiLoading?"#fbbf24":"#34d399", display:"inline-block", animation: aiLoading ? "none" : "pp-pulse 2s infinite" }} />
          AI SUMMARY
        </span>
        <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>Powered by DeepSeek</span>
      </div>
      {aiLoading ? (
        <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"rgba(255,255,255,0.4)" }}>
          <div style={{ width:14, height:14, border:"2px solid rgba(255,255,255,0.2)", borderTop:"2px solid rgba(255,255,255,0.6)", borderRadius:"50%", animation:"_spin 0.7s linear infinite" }} />
          Generating summary…
        </div>
      ) : aiError ? (
        <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)", fontStyle:"italic" }}>Summary unavailable.</div>
      ) : (
        <div style={{ fontSize:13, color:"rgba(255,255,255,0.92)", lineHeight:1.65, fontStyle:"italic" }}>
          "{displayed}{typing && <span style={{ display:"inline-block", width:1, height:"1em", background:"#fff", marginLeft:2, verticalAlign:"text-bottom", animation:"_blink 0.8s step-end infinite" }} />}"
        </div>
      )}
      <style>{`@keyframes pp-pulse{0%,100%{opacity:1}50%{opacity:0.4}} @keyframes _blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
    </div>
  );
}

// Authenticity score strip
function AIScoreStrip({ aiData, aiLoading, aiError }) {
  const [animate, setAnimate] = useState(false);
  const data = aiData?.score;

  useEffect(() => {
    if (data) setTimeout(() => setAnimate(true), 80);
  }, [data]);

  if (aiLoading) {
    return (
      <div className="psec" style={{ marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
          <div className="sec-lbl" style={{ margin:0 }}>Authenticity Score</div>
          <div style={{ width:14, height:14, border:"2px solid var(--border)", borderTop:"2px solid var(--blue)", borderRadius:"50%", animation:"_spin 0.7s linear infinite" }} />
        </div>
        {[90,70,80,60,85].map((w,i) => (
          <div key={i} style={{ marginBottom:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <div style={{ width:w, height:10, background:"var(--bg)", borderRadius:4, animation:"_shimmer 1.5s infinite" }} />
              <div style={{ width:32, height:10, background:"var(--bg)", borderRadius:4, animation:"_shimmer 1.5s infinite" }} />
            </div>
            <div style={{ height:5, background:"var(--bg)", borderRadius:3, animation:"_shimmer 1.5s infinite" }} />
          </div>
        ))}
        <style>{`@keyframes _shimmer{0%{opacity:0.5}50%{opacity:1}100%{opacity:0.5}}`}</style>
      </div>
    );
  }

  if (aiError || !data) return null;

  const gm     = GRADE_META[data.grade] || GRADE_META.Fair;
  const radius = 22;
  const circ   = 2 * Math.PI * radius;
  const dash   = (data.total / 100) * circ;
  const flags  = (data.flags || []).filter(Boolean);

  return (
    <div className="psec" style={{ marginBottom:10 }}>
      <div className="sec-lbl" style={{ marginBottom:10 }}>Authenticity Score</div>

      {/* Score row */}
      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:14, padding:"12px 14px", background:"var(--bg)", borderRadius:9, border:"1px solid var(--border)" }}>
        {/* Ring */}
        <div style={{ position:"relative", width:56, height:56, flexShrink:0 }}>
          <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform:"rotate(-90deg)" }}>
            <circle cx="28" cy="28" r={radius} fill="none" stroke="var(--border)" strokeWidth="5" />
            <circle cx="28" cy="28" r={radius} fill="none" stroke={gm.color} strokeWidth="5" strokeLinecap="round"
              strokeDasharray={`${animate ? dash : 0} ${circ}`}
              style={{ transition:"stroke-dasharray 1.3s cubic-bezier(0.4,0,0.2,1)" }}
            />
          </svg>
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:14, fontWeight:700, color:"var(--text-1)", lineHeight:1 }}>{data.total}</span>
            <span style={{ fontSize:8, color:"var(--text-4)", fontWeight:600 }}>/100</span>
          </div>
        </div>
        {/* Grade + verdict */}
        <div style={{ flex:1 }}>
          <span style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 10px", borderRadius:999, background:gm.bg, border:`1px solid ${gm.border}`, color:gm.color, fontSize:11, fontWeight:700, marginBottom:6 }}>
            {gm.icon} {data.grade}
          </span>
          <div className="fs-12 text-3" style={{ lineHeight:1.5 }}>{data.verdict}</div>
        </div>
      </div>

      {/* Breakdown bars */}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {Object.entries(data.breakdown).map(([key, val]) => {
          const pct = (val.score / val.max) * 100;
          const bc  = pct >= 80 ? "var(--green)" : pct >= 55 ? "var(--blue)" : pct >= 35 ? "var(--amber)" : "var(--red)";
          return (
            <div key={key}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                <span className="fs-11 fw-600 text-2">{BREAKDOWN_LABELS[key] || key}</span>
                <span className="fs-11 text-4 mono">{val.score}/{val.max}</span>
              </div>
              <div style={{ height:5, background:"var(--bg)", borderRadius:3, overflow:"hidden", border:"1px solid var(--border)" }}>
                <div style={{ height:"100%", width: animate ? `${pct}%` : "0%", background:bc, borderRadius:3, transition:"width 1.2s cubic-bezier(0.4,0,0.2,1)" }} />
              </div>
              <div className="fs-11 text-4" style={{ marginTop:2 }}>{val.note}</div>
            </div>
          );
        })}
      </div>

      {/* Flags */}
      {flags.length > 0 && (
        <div style={{ marginTop:10, display:"flex", flexDirection:"column", gap:5 }}>
          {flags.map((flag, i) => (
            <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:7, background:"var(--red-bg)", border:"1px solid var(--red-border)", borderRadius:7, padding:"7px 10px", fontSize:11, color:"var(--red)", lineHeight:1.4 }}>
              <svg width="12" height="12" fill="none" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ flexShrink:0, marginTop:1 }}>
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

// PassportModal — shared full passport view with AI features
// ─────────────────────────────────────────────────────────────────────────────
export function PassportModal({ passport, onClose, footerAction = null }) {
  const p = passport?.product;
  const { aiData, aiLoading, aiError } = usePassportAI(p?.product_id);

  return (
    <Modal title="Digital Product Passport" subtitle={p?.product_name} onClose={onClose} wide>
      <div className="scroll">
        {/* Product info */}
        <div className="psec" style={{ marginBottom: 10 }}>
          <div className="sec-lbl">Product info</div>
          <div className="grid-2" style={{ gap: "10px 24px" }}>
            {[
              ["Name",      p?.product_name,                            false],
              ["Serial",    p?.serial_number,                           true ],
              ["Model",     p?.model_no,                                true ],
              ["Warranty",  p?.warranty ? `${p.warranty} mo.` : "—",   false],
              ["Mfg. date", p?.manufacturing_date?.slice(0, 10) || "—", true ],
            ].map(([k, v, mono]) => (
              <div key={k}>
                <div className="fs-11 text-4 mb-4">{k}</div>
                <div className={`fs-13 fw-500 text-1${mono ? " mono" : ""}`}>{v || "—"}</div>
              </div>
            ))}
            <div>
              <div className="fs-11 text-4 mb-4">Status</div>
              <StatusBadge status={p?.current_status} />
            </div>
          </div>
          {p?.description && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
              <div className="fs-13 text-3" style={{ lineHeight: 1.65 }}>{p.description}</div>
            </div>
          )}
        </div>

        {/* ── AI Summary ── */}
        <AISummaryStrip aiData={aiData} aiLoading={aiLoading} aiError={aiError} />

        {/* ── Authenticity Score ── */}
        <AIScoreStrip aiData={aiData} aiLoading={aiLoading} aiError={aiError} />

        {/* Ownership */}
        <div className="psec" style={{ marginBottom: 10 }}>
          <div className="sec-lbl">Ownership history</div>
          {!passport?.ownership?.length ? (
            <div className="fs-13 text-4">No ownership records yet.</div>
          ) : passport.ownership.map((o, i) => (
            <div key={i} className="prow">
              <div className="row gap-10">
                <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--green-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="12" height="12" fill="none" stroke="var(--green)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <span className="fs-13 fw-500 text-1">{o.name}</span>
              </div>
              <span className="mono fs-12 text-4">{o.transfer_date?.slice(0, 10)}</span>
            </div>
          ))}
        </div>

        {/* Repairs */}
        <div className="psec" style={{ marginBottom: 10 }}>
          <div className="sec-lbl">Repair history</div>
          {!passport?.repairs?.length ? (
            <div className="fs-13 text-4">No repairs recorded.</div>
          ) : passport.repairs.map((r, i) => (
            <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <div className="between mb-6">
                <span className="fs-13 fw-500 text-1">{r.issue}</span>
                <span className="badge fs-10" style={{ color: "var(--red)", background: "var(--red-bg)" }}>{r.repair_type}</span>
              </div>
              <div className="row gap-10 fs-12 text-3">
                <span>{r.repairshop_name}</span>
                {r.repair_price && <><span style={{ color: "var(--border-2)" }}>·</span><span>{r.repair_price} BDT</span></>}
                {r.estimated_time && <><span style={{ color: "var(--border-2)" }}>·</span><span>{r.estimated_time}</span></>}
              </div>
            </div>
          ))}
        </div>

        {/* Events */}
        <div className="psec" style={{ marginBottom: footerAction ? 10 : 0 }}>
          <div className="sec-lbl">Event timeline</div>
          {!passport?.events?.length ? (
            <div className="fs-13 text-4">No events yet.</div>
          ) : (
            <div style={{ position: "relative", paddingLeft: 22 }}>
              <div style={{ position: "absolute", left: 6, top: 0, bottom: 0, width: 1, background: "var(--border)" }} />
              {passport.events.map((e, i) => (
                <div key={i} style={{ position: "relative", padding: "10px 0", borderBottom: i < passport.events.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div style={{ position: "absolute", left: -16, top: 14, width: 8, height: 8, borderRadius: "50%", background: "var(--blue)", border: "2px solid #fff" }} />
                  <div className="between mb-4">
                    <span className="fs-11 fw-700" style={{ color: "var(--blue)", letterSpacing: "0.04em" }}>{e.event_type}</span>
                    <span className="mono fs-11 text-4">{e.event_date?.slice(0, 10)}</span>
                  </div>
                  <div className="fs-13 text-3">{e.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {footerAction}
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EmptyState
// ─────────────────────────────────────────────────────────────────────────────
export function EmptyState({ icon, iconColor = "var(--blue)", iconBg = "var(--blue-bg)", title, subtitle }) {
  return (
    <div className="empty">
      <div className="empty-icon" style={{ background: iconBg }}>
        {icon || (
          <svg width="22" height="22" fill="none" stroke={iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
          </svg>
        )}
      </div>
      <div className="empty-title">{title}</div>
      {subtitle && <div className="empty-sub">{subtitle}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Spinner
// ─────────────────────────────────────────────────────────────────────────────
export function Spinner({ size = 32, color = "var(--blue)", style = {} }) {
  return (
    <>
      <style>{`@keyframes _spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{
        width: size, height: size,
        border: `${Math.max(2, size / 12)}px solid var(--border)`,
        borderTop: `${Math.max(2, size / 12)}px solid ${color}`,
        borderRadius: "50%",
        animation: "_spin 0.7s linear infinite",
        ...style,
      }} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TableFooter
// ─────────────────────────────────────────────────────────────────────────────
export function TableFooter({ shown, total, label = "products", filtered = false }) {
  if (!shown) return null;
  return (
    <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", background: "#fafaf8", fontSize: 12, color: "var(--text-4)" }}>
      Showing {shown} of {total} {label}{filtered ? " · filtered" : ""}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WarningBox — amber warning panel
// ─────────────────────────────────────────────────────────────────────────────
export function WarningBox({ children }) {
  return (
    <div style={{
      background: "var(--amber-bg)", border: "1px solid var(--amber-border)",
      borderRadius: 9, padding: "11px 14px", marginBottom: 20,
      display: "flex", gap: 10, alignItems: "flex-start",
    }}>
      <svg width="15" height="15" fill="none" stroke="var(--amber)" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"
        style={{ flexShrink: 0, marginTop: 1 }}>
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <div className="fs-13" style={{ color: "var(--amber)", lineHeight: 1.5 }}>{children}</div>
    </div>
  );
}