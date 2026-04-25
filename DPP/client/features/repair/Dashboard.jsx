import { useState, useMemo } from "react";
import DashboardLayout from "../shared/DashboardLayout";
import { addRepair } from "./repair.api";

// ── Constants ─────────────────────────────────────────────────────────────────
const REPAIR_TYPES = ["HARDWARE", "SOFTWARE", "COSMETIC", "OTHER"];

const TYPE_COLORS = {
  HARDWARE: { color: "var(--blue)",   bg: "var(--blue-bg)"   },
  SOFTWARE: { color: "var(--purple)", bg: "var(--purple-bg)" },
  COSMETIC: { color: "var(--amber)",  bg: "var(--amber-bg)"  },
  OTHER:    { color: "var(--text-3)", bg: "var(--bg)"        },
};

const emptyForm = {
  product_id: "", issue: "", repair_type: "", repair_price: "", estimated_time: "",
};

// ── Sub-components ────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast.text) return null;
  return (
    <div className={`toast ${toast.type === "error" ? "toast-err" : "toast-ok"}`}>
      {toast.text}
    </div>
  );
}

function RepairTypeBadge({ type }) {
  const c = TYPE_COLORS[type] || TYPE_COLORS.OTHER;
  return (
    <span className="badge fs-10" style={{ color: c.color, background: c.bg }}>
      <span className="badge-dot" style={{ background: c.color }} />
      {type}
    </span>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RepairDashboard() {
  const [form, setForm]         = useState(emptyForm);
  const [loading, setLoading]   = useState(false);
  const [toast, setToast]       = useState({ text: "", type: "" });
  const [submitted, setSubmitted] = useState([]);

  // Filters for submitted list
  const [search, setSearch]         = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortBy, setSortBy]         = useState("newest");

  const notify = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: "", type: "" }), 3500);
  };

  const handleSubmit = async () => {
    if (!form.product_id || !form.issue || !form.repair_type) {
      notify("Fill in product ID, issue and repair type.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await addRepair(form);
      notify("Repair record created!");
      setSubmitted(prev => [{ ...res.data, _submittedAt: new Date().toISOString() }, ...prev]);
      setForm(emptyForm);
    } catch (err) {
      notify(err.response?.data?.error || "Error adding repair.", "error");
    } finally { setLoading(false); }
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // Filtered submitted list
  const filteredSubmitted = useMemo(() => {
    let list = [...submitted];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.issue?.toLowerCase().includes(q) ||
        String(r.product_id).includes(q) ||
        r.repair_type?.toLowerCase().includes(q)
      );
    }
    if (typeFilter) list = list.filter(r => r.repair_type === typeFilter);
    switch (sortBy) {
      case "oldest":  list.reverse(); break;
      case "price_hi":list.sort((a, b) => (Number(b.repair_price) || 0) - (Number(a.repair_price) || 0)); break;
      case "price_lo":list.sort((a, b) => (Number(a.repair_price) || 0) - (Number(b.repair_price) || 0)); break;
      default: break; // newest = insertion order (already newest-first)
    }
    return list;
  }, [submitted, search, typeFilter, sortBy]);

  // Stats for submitted
  const stats = useMemo(() => ({
    total:    submitted.length,
    hardware: submitted.filter(r => r.repair_type === "HARDWARE").length,
    software: submitted.filter(r => r.repair_type === "SOFTWARE").length,
    cosmetic: submitted.filter(r => r.repair_type === "COSMETIC").length,
    other:    submitted.filter(r => r.repair_type === "OTHER").length,
  }), [submitted]);

  return (
    <DashboardLayout title="Repair Jobs">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Toast toast={toast} />

      <div className="page">
        {/* Header */}
        <div className="mb-28">
          <div className="page-title">Repair Management</div>
          <div className="page-sub">Log repair records and track ongoing service jobs.</div>
        </div>

        {/* Session stats — only show once there are submissions */}
        {submitted.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Total",    value: stats.total,    color: "var(--text-1)", pct: 100 },
              { label: "Hardware", value: stats.hardware, color: "var(--blue)",   pct: stats.total ? (stats.hardware/stats.total)*100 : 0 },
              { label: "Software", value: stats.software, color: "var(--purple)", pct: stats.total ? (stats.software/stats.total)*100 : 0 },
              { label: "Cosmetic", value: stats.cosmetic, color: "var(--amber)",  pct: stats.total ? (stats.cosmetic/stats.total)*100 : 0 },
              { label: "Other",    value: stats.other,    color: "var(--text-3)", pct: stats.total ? (stats.other/stats.total)*100 : 0 },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="fs-11 fw-600 text-4" style={{ letterSpacing: "0.07em", textTransform: "uppercase" }}>{s.label}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: s.color, marginTop: 8, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
                <div className="bar-bg"><div className="bar-fg" style={{ width: `${s.pct}%`, background: s.color }} /></div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>

          {/* ── Form ── */}
          <div className="card card-p">
            <div className="between mb-20">
              <div>
                <div className="fs-14 fw-600 text-1">New repair record</div>
                <div className="fs-12 text-4 mt-4">Fields marked * are required.</div>
              </div>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--red-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" fill="none" stroke="var(--red)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
                </svg>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label className="lbl">Product ID *</label>
                <input
                  className="inp mono"
                  placeholder="e.g. 42"
                  value={form.product_id}
                  onChange={e => set("product_id", e.target.value)}
                />
              </div>

              <div>
                <label className="lbl">Issue description *</label>
                <textarea
                  className="inp"
                  style={{ minHeight: 80 }}
                  placeholder="Describe the problem in detail…"
                  value={form.issue}
                  onChange={e => set("issue", e.target.value)}
                />
              </div>

              <div>
                <label className="lbl">Repair type *</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {REPAIR_TYPES.map(t => {
                    const c = TYPE_COLORS[t];
                    const selected = form.repair_type === t;
                    return (
                      <button
                        key={t}
                        onClick={() => set("repair_type", t)}
                        style={{
                          padding: "9px 14px",
                          borderRadius: 9,
                          border: `1.5px solid ${selected ? c.color : "var(--border)"}`,
                          background: selected ? c.bg : "#fafaf8",
                          color: selected ? c.color : "var(--text-3)",
                          fontFamily: "var(--font-sans)",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.14s",
                          letterSpacing: "0.04em",
                        }}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <label className="lbl">Price (BDT)</label>
                  <input
                    className="inp"
                    type="number"
                    placeholder="e.g. 1500"
                    value={form.repair_price}
                    onChange={e => set("repair_price", e.target.value)}
                  />
                </div>
                <div>
                  <label className="lbl">Estimated time</label>
                  <input
                    className="inp"
                    placeholder="e.g. 2 days"
                    value={form.estimated_time}
                    onChange={e => set("estimated_time", e.target.value)}
                  />
                </div>
              </div>

              <div className="form-actions" style={{ marginTop: 4 }}>
                <button className="btn btn-outline" onClick={() => setForm(emptyForm)}>Clear</button>
                <button className="btn btn-dark" style={{ padding: "10px 24px" }} onClick={handleSubmit} disabled={loading}>
                  {loading ? "Submitting…" : "Submit Repair Record"}
                </button>
              </div>
            </div>
          </div>

          {/* ── Submitted list ── */}
          <div className="card" style={{ overflow: "hidden" }}>
            {/* Toolbar */}
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", background: "#fafaf8" }}>
              <div className="between mb-10">
                <div className="fs-14 fw-600 text-1">Session records</div>
                <span className="fs-12 text-4">{filteredSubmitted.length} / {submitted.length}</span>
              </div>

              {submitted.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {/* Search */}
                  <div style={{ position: "relative" }}>
                    <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                      width="12" height="12" fill="none" stroke="var(--text-4)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input
                      className="inp"
                      style={{ paddingLeft: 30, fontSize: 12 }}
                      placeholder="Search issue, product ID…"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>

                  {/* Type + Sort row */}
                  <div style={{ display: "flex", gap: 8 }}>
                    <select
                      className="inp"
                      style={{ flex: 1, fontSize: 12 }}
                      value={typeFilter}
                      onChange={e => setTypeFilter(e.target.value)}
                    >
                      <option value="">All types</option>
                      {REPAIR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select
                      className="inp"
                      style={{ flex: 1, fontSize: 12 }}
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value)}
                    >
                      <option value="newest">Newest first</option>
                      <option value="oldest">Oldest first</option>
                      <option value="price_hi">Price (high–low)</option>
                      <option value="price_lo">Price (low–high)</option>
                    </select>
                  </div>

                  {/* Active filter chips */}
                  {(search || typeFilter) && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      {search && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "var(--blue-bg)", border: "1px solid var(--blue-border)", borderRadius: 999, padding: "2px 8px", fontSize: 11, color: "var(--blue)", fontWeight: 500 }}>
                          "{search}"
                          <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--blue)", fontSize: 13, lineHeight: 1, padding: 0 }}>×</button>
                        </span>
                      )}
                      {typeFilter && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: TYPE_COLORS[typeFilter]?.bg, border: `1px solid ${TYPE_COLORS[typeFilter]?.color}33`, borderRadius: 999, padding: "2px 8px", fontSize: 11, color: TYPE_COLORS[typeFilter]?.color, fontWeight: 500 }}>
                          {typeFilter}
                          <button onClick={() => setTypeFilter("")} style={{ background: "none", border: "none", cursor: "pointer", color: TYPE_COLORS[typeFilter]?.color, fontSize: 13, lineHeight: 1, padding: 0 }}>×</button>
                        </span>
                      )}
                      <button onClick={() => { setSearch(""); setTypeFilter(""); }} className="fs-11" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-4)", textDecoration: "underline" }}>
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Records */}
            {submitted.length === 0 ? (
              <div className="empty">
                <div className="empty-icon" style={{ background: "var(--red-bg)" }}>
                  <svg width="22" height="22" fill="none" stroke="var(--red)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                  </svg>
                </div>
                <div className="empty-title">No records yet</div>
                <div className="empty-sub">Submitted repairs will appear here.</div>
              </div>
            ) : filteredSubmitted.length === 0 ? (
              <div className="empty" style={{ padding: "40px" }}>
                <div className="empty-title">No matching records</div>
                <div className="empty-sub">Try adjusting your search or filter.</div>
              </div>
            ) : (
              <div style={{ maxHeight: 520, overflowY: "auto" }}>
                {filteredSubmitted.map((r, i) => {
                  const c = TYPE_COLORS[r.repair_type] || TYPE_COLORS.OTHER;
                  return (
                    <div
                      key={i}
                      style={{
                        padding: "14px 18px",
                        borderBottom: "1px solid #f0efe9",
                        borderLeft: `3px solid ${c.color}`,
                      }}
                    >
                      <div className="between mb-6">
                        <div className="fs-14 fw-600 text-1" style={{ flex: 1, marginRight: 10 }}>
                          {r.issue?.slice(0, 48)}{r.issue?.length > 48 ? "…" : ""}
                        </div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                          <RepairTypeBadge type={r.repair_type} />
                          <span className="badge" style={{ color: "var(--red)", background: "var(--red-bg)", fontSize: 10 }}>
                            <span className="badge-dot" style={{ background: "var(--red)" }} />
                            IN PROGRESS
                          </span>
                        </div>
                      </div>
                      <div className="row gap-10 fs-12 text-3" style={{ flexWrap: "wrap" }}>
                        <span>Product <span className="mono fw-500">#{r.product_id}</span></span>
                        {r.repair_price && (
                          <>
                            <span style={{ color: "var(--border-2)" }}>·</span>
                            <span className="fw-500">{r.repair_price} BDT</span>
                          </>
                        )}
                        {r.estimated_time && (
                          <>
                            <span style={{ color: "var(--border-2)" }}>·</span>
                            <span>{r.estimated_time}</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer */}
            {filteredSubmitted.length > 0 && (
              <div style={{ padding: "10px 18px", borderTop: "1px solid var(--border)", background: "#fafaf8", fontSize: 12, color: "var(--text-4)" }}>
                {filteredSubmitted.length} of {submitted.length} record{submitted.length !== 1 ? "s" : ""}
                {(search || typeFilter) && " · filtered"}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}