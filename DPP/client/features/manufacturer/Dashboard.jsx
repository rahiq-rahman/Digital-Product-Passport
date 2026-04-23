import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../shared/DashboardLayout";
import { getMyProducts } from "./manufacturer.api";

export default function ManufacturerDashboard() {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getMyProducts().then(r => setProducts(r.data)).catch(() => {});
  }, []);

  const total  = products.length;
  const created = products.filter(p => p.current_status === "CREATED").length;
  const inShow  = products.filter(p => p.current_status === "IN_SHOWROOM").length;
  const sold    = products.filter(p => p.current_status === "SOLD").length;
  const inRep   = products.filter(p => p.current_status === "IN_REPAIR").length;

  const name = localStorage.getItem("name") || "";

  const actions = [
    { label: "Register a product",  sub: "Add a single product",           to: "/manufacturer/register",      color: "var(--blue)",  bg: "var(--blue-bg)"  },
    { label: "Bulk register",       sub: "Upload many products at once",    to: "/manufacturer/bulk",           color: "var(--purple)", bg: "var(--purple-bg)"},
    { label: "Dispatch product",    sub: "Send a product to a showroom",    to: "/manufacturer/dispatch",       color: "var(--amber)", bg: "var(--amber-bg)" },
    { label: "Bulk dispatch",       sub: "Dispatch multiple products",      to: "/manufacturer/bulk-dispatch",  color: "var(--green)", bg: "var(--green-bg)" },
  ];

  return (
    <DashboardLayout title="Overview">
      <div className="page">
        <div className="mb-28">
          <div className="page-title">Good day, {name.split(" ")[0]}</div>
          <div className="page-sub">Here's an overview of your product catalogue.</div>
        </div>

        {/* Stats */}
        <div className="grid-4 mb-24" style={{ gridTemplateColumns: "repeat(5,1fr)" }}>
          {[
            { label: "Total",      value: total,   color: "var(--text-1)", pct: 100 },
            { label: "Created",    value: created, color: "var(--blue)",   pct: total ? (created/total)*100 : 0 },
            { label: "Showroom",   value: inShow,  color: "var(--amber)",  pct: total ? (inShow/total)*100 : 0 },
            { label: "Sold",       value: sold,    color: "var(--green)",  pct: total ? (sold/total)*100 : 0 },
            { label: "In Repair",  value: inRep,   color: "var(--red)",    pct: total ? (inRep/total)*100 : 0 },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="fs-11 fw-600 text-4" style={{ letterSpacing: "0.07em", textTransform: "uppercase" }}>{s.label}</div>
              <div style={{ fontSize: 34, fontWeight: 700, color: s.color, marginTop: 8, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
              <div className="bar-bg"><div className="bar-fg" style={{ width: `${s.pct}%`, background: s.color }} /></div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="mb-8">
          <div className="fs-11 fw-600 text-4 mb-12" style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}>Quick actions</div>
          <div className="grid-2" style={{ gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
            {actions.map(a => (
              <button key={a.to} onClick={() => navigate(a.to)} style={{
                background: "#fff", border: "1px solid var(--border)", borderRadius: 14,
                padding: "20px", textAlign: "left", cursor: "pointer",
                transition: "box-shadow 0.15s, transform 0.15s", fontFamily: "inherit",
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = ""; e.currentTarget.style.transform = ""; }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 9, background: a.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <svg width="16" height="16" fill="none" stroke={a.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                  </svg>
                </div>
                <div className="fs-13 fw-600 text-1 mb-4">{a.label}</div>
                <div className="fs-12 text-4">{a.sub}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}