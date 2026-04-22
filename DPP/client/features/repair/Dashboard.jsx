import { useState } from "react";
import DashboardLayout from "../shared/DashboardLayout";
import { addRepair } from "./repair.api";

const REPAIR_TYPES = ["HARDWARE", "SOFTWARE", "COSMETIC", "OTHER"];

const emptyForm = {
  product_id: "", issue: "", repair_type: "", repair_price: "", estimated_time: "",
};

function Toast({ toast }) {
  if (!toast.text) return null;
  return <div className={`toast ${toast.type === "error" ? "toast-err" : "toast-ok"}`}>{toast.text}</div>;
}

export default function RepairDashboard() {
  const [form, setForm]     = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [toast, setToast]   = useState({ text: "", type: "" });
  const [submitted, setSubmitted] = useState([]);

  const notify = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: "", type: "" }), 3500);
  };

  const handleSubmit = async () => {
    if (!form.product_id || !form.issue || !form.repair_type) {
      notify("Fill in product ID, issue and repair type.", "error"); return;
    }
    setLoading(true);
    try {
      const res = await addRepair(form);
      notify("Repair record created!");
      setSubmitted(prev => [res.data, ...prev]);
      setForm(emptyForm);
    } catch (err) {
      notify(err.response?.data?.error || "Error adding repair", "error");
    } finally { setLoading(false); }
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <DashboardLayout title="Repair Jobs">
      <Toast toast={toast} />
      <div className="page">

        {/* Header */}
        <div className="mb-28">
          <div className="page-title">Repair Management</div>
          <div className="page-sub">Log repair records and track ongoing service jobs.</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>

          {/* Form */}
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
                <input className="inp mono" placeholder="e.g. 42"
                  value={form.product_id} onChange={e => set("product_id", e.target.value)} />
              </div>

              <div>
                <label className="lbl">Issue description *</label>
                <textarea className="inp" style={{ minHeight: 80 }}
                  placeholder="Describe the problem in detail..."
                  value={form.issue} onChange={e => set("issue", e.target.value)} />
              </div>

              <div>
                <label className="lbl">Repair type *</label>
                <select className="inp" value={form.repair_type} onChange={e => set("repair_type", e.target.value)}>
                  <option value="">Select type...</option>
                  {REPAIR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="grid-2">
                <div>
                  <label className="lbl">Price (BDT)</label>
                  <input className="inp" type="number" placeholder="e.g. 1500"
                    value={form.repair_price} onChange={e => set("repair_price", e.target.value)} />
                </div>
                <div>
                  <label className="lbl">Estimated time</label>
                  <input className="inp" placeholder="e.g. 2 days"
                    value={form.estimated_time} onChange={e => set("estimated_time", e.target.value)} />
                </div>
              </div>

              <button className="btn btn-dark" style={{ marginTop: 4 }} onClick={handleSubmit} disabled={loading}>
                {loading ? "Submitting..." : "Submit Repair Record"}
              </button>
            </div>
          </div>

          {/* Recent submissions */}
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", background: "#fafaf8" }}>
              <div className="fs-14 fw-600 text-1">Recent submissions</div>
              <div className="fs-12 text-4 mt-4">Records added in this session.</div>
            </div>

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
            ) : (
              <div>
                {submitted.map((r, i) => (
                  <div key={i} style={{ padding: "16px 20px", borderBottom: "1px solid #f0efe9" }}>
                    <div className="between mb-6">
                      <div className="fs-14 fw-600 text-1">{r.issue?.slice(0, 40)}{r.issue?.length > 40 ? "..." : ""}</div>
                      <span className="badge" style={{ color: "var(--red)", background: "var(--red-bg)", fontSize: 10 }}>
                        <span className="badge-dot" style={{ background: "var(--red)" }} />
                        IN PROGRESS
                      </span>
                    </div>
                    <div className="row gap-12">
                      <span className="fs-12 text-3">Product #{r.product_id}</span>
                      <span style={{ color: "var(--border)" }}>·</span>
                      <span className="fs-12 text-3">{r.repair_type}</span>
                      {r.repair_price && (
                        <>
                          <span style={{ color: "var(--border)" }}>·</span>
                          <span className="fs-12 text-3">{r.repair_price} BDT</span>
                        </>
                      )}
                      {r.estimated_time && (
                        <>
                          <span style={{ color: "var(--border)" }}>·</span>
                          <span className="fs-12 text-3">{r.estimated_time}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}