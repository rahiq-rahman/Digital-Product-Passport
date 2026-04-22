import { useState } from "react";
import DashboardLayout from "../shared/DashboardLayout";
import { getPassport } from "./customer.api";

const STATUS = {
  CREATED:     { label: "Created",   color: "var(--blue)",  bg: "var(--blue-bg)"  },
  IN_SHOWROOM: { label: "Showroom",  color: "var(--amber)", bg: "var(--amber-bg)" },
  SOLD:        { label: "Sold",      color: "var(--green)", bg: "var(--green-bg)" },
  IN_REPAIR:   { label: "In Repair", color: "var(--red)",   bg: "var(--red-bg)"   },
};

function Toast({ toast }) {
  if (!toast.text) return null;
  return <div className={`toast ${toast.type === "error" ? "toast-err" : "toast-ok"}`}>{toast.text}</div>;
}

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.SOLD;
  return (
    <span className="badge" style={{ color: s.color, background: s.bg }}>
      <span className="badge-dot" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}

function Section({ title, children }) {
  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", background: "#fafaf8" }}>
        <div className="fs-13 fw-600 text-1">{title}</div>
      </div>
      <div style={{ padding: "0 20px" }}>{children}</div>
    </div>
  );
}

function EmptyRow({ text }) {
  return <div className="fs-13 text-4" style={{ padding: "16px 0" }}>{text}</div>;
}

export default function CustomerDashboard() {
  const [passport, setPassport] = useState(null);
  const [productId, setProductId] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ text: "", type: "" });

  const notify = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: "", type: "" }), 3500);
  };

  const fetchPassport = async () => {
    if (!productId.trim()) { notify("Enter a product ID.", "error"); return; }
    setLoading(true);
    try {
      const res = await getPassport(productId.trim());
      setPassport(res.data);
    } catch (err) {
      notify(err.response?.data?.error || "Could not load passport", "error");
      setPassport(null);
    } finally { setLoading(false); }
  };

  const p = passport?.product;

  return (
    <DashboardLayout title="My Passport">
      <Toast toast={toast} />
      <div className="page">

        {/* Header */}
        <div className="mb-28">
          <div className="page-title">Digital Product Passport</div>
          <div className="page-sub">View the full history of any product you own.</div>
        </div>

        {/* Search bar */}
        <div className="panel mb-24 row gap-12">
          <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--green-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="16" height="16" fill="none" stroke="var(--green)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <input
            className="inp" style={{ flex: 1 }}
            placeholder="Enter product ID..."
            value={productId}
            onChange={e => setProductId(e.target.value)}
            onKeyDown={e => e.key === "Enter" && fetchPassport()}
          />
          <button className="btn btn-dark" onClick={fetchPassport} disabled={loading}>
            {loading ? "Loading..." : "View Passport"}
          </button>
        </div>

        {/* Passport content */}
        {passport && p && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Product summary card */}
            <div className="card card-p">
              <div className="between mb-20">
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.01em" }}>
                    {p.product_name}
                  </div>
                  <div className="fs-13 text-4 mt-4 mono">{p.serial_number}</div>
                </div>
                <StatusBadge status={p.current_status} />
              </div>

              <div className="grid-4" style={{ gap: "12px 20px" }}>
                {[
                  ["Model",        p.model_no,                          true ],
                  ["Warranty",     p.warranty ? `${p.warranty} mo.` : "—", false],
                  ["Manufactured", p.manufacturing_date?.slice(0, 10) || "—", true ],
                  ["Product ID",   `#${p.product_id}`,                  true ],
                ].map(([k, v, m]) => (
                  <div key={k}>
                    <div className="fs-11 text-4 mb-4" style={{ letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 600 }}>{k}</div>
                    <div className={`fs-13 fw-500 text-1${m ? " mono" : ""}`}>{v}</div>
                  </div>
                ))}
              </div>

              {p.description && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                  <div className="fs-11 fw-600 text-4 mb-6" style={{ letterSpacing: "0.07em", textTransform: "uppercase" }}>Description</div>
                  <div className="fs-13 text-3" style={{ lineHeight: 1.65 }}>{p.description}</div>
                </div>
              )}
            </div>

            {/* Ownership history */}
            <Section title="Ownership history">
              {!passport.ownership?.length ? (
                <EmptyRow text="No ownership records." />
              ) : passport.ownership.map((o, i) => (
                <div key={i} className="prow">
                  <div className="row gap-10">
                    <div style={{ width: 30, height: 30, borderRadius: 7, background: "var(--green-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="13" height="13" fill="none" stroke="var(--green)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                    <span className="fs-13 fw-500 text-1">{o.name}</span>
                  </div>
                  <span className="mono fs-12 text-4">{o.transfer_date?.slice(0, 10)}</span>
                </div>
              ))}
            </Section>

            {/* Repair history */}
            <Section title="Repair history">
              {!passport.repairs?.length ? (
                <EmptyRow text="No repairs recorded." />
              ) : passport.repairs.map((r, i) => (
                <div key={i} style={{ padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
                  <div className="between mb-6">
                    <span className="fs-14 fw-600 text-1">{r.issue}</span>
                    <span className="mono fs-12 text-4">{r.repair_date?.slice(0, 10) || "—"}</span>
                  </div>
                  <div className="row gap-10">
                    <span className="fs-12 text-3">{r.repairshop_name}</span>
                    <span style={{ color: "var(--border-2)" }}>·</span>
                    <span className="badge" style={{ color: "var(--red)", background: "var(--red-bg)", fontSize: 10, padding: "2px 8px" }}>{r.repair_type}</span>
                    {r.repair_price && (
                      <>
                        <span style={{ color: "var(--border-2)" }}>·</span>
                        <span className="fs-12 fw-500 text-2">{r.repair_price} BDT</span>
                      </>
                    )}
                    {r.estimated_time && (
                      <>
                        <span style={{ color: "var(--border-2)" }}>·</span>
                        <span className="fs-12 text-3">{r.estimated_time}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </Section>

            {/* Event timeline */}
            <Section title="Event timeline">
              {!passport.events?.length ? (
                <EmptyRow text="No events recorded." />
              ) : (
                <div style={{ position: "relative", paddingLeft: 24 }}>
                  <div style={{ position: "absolute", left: 7, top: 0, bottom: 0, width: 1, background: "var(--border)" }} />
                  {passport.events.map((e, i) => (
                    <div key={i} style={{ position: "relative", padding: "14px 0", borderBottom: i < passport.events.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <div style={{ position: "absolute", left: -17, top: 18, width: 9, height: 9, borderRadius: "50%", background: "var(--blue)", border: "2px solid white", boxShadow: "0 0 0 1px var(--blue-border)" }} />
                      <div className="between mb-4">
                        <span className="fs-11 fw-700" style={{ color: "var(--blue)", letterSpacing: "0.04em" }}>{e.event_type}</span>
                        <span className="mono fs-11 text-4">{e.event_date?.slice(0, 10)}</span>
                      </div>
                      <div className="fs-13 text-3">{e.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </Section>

          </div>
        )}

        {/* Empty state before search */}
        {!passport && (
          <div className="empty" style={{ padding: "80px 0" }}>
            <div className="empty-icon" style={{ background: "var(--green-bg)" }}>
              <svg width="24" height="24" fill="none" stroke="var(--green)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div className="empty-title">Enter a product ID to view its passport</div>
            <div className="empty-sub">The passport shows the full lifecycle — manufacturing, ownership, and repair history.</div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}