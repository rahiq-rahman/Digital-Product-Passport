import { useEffect, useState } from "react";
import DashboardLayout from "../shared/DashboardLayout";
import { getInventory, transferOwnership } from "./showroom.api";

const STATUS = {
  IN_SHOWROOM: { label: "In Showroom", color: "var(--amber)", bg: "var(--amber-bg)" },
  SOLD:        { label: "Sold",        color: "var(--green)", bg: "var(--green-bg)" },
  CREATED:     { label: "Created",     color: "var(--blue)",  bg: "var(--blue-bg)"  },
};

function Toast({ toast }) {
  if (!toast.text) return null;
  return <div className={`toast ${toast.type === "error" ? "toast-err" : "toast-ok"}`}>{toast.text}</div>;
}

function Modal({ title, subtitle, onClose, children }) {
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
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

function StatCard({ label, value, color, pct }) {
  return (
    <div className="stat-card">
      <div className="fs-11 fw-600 text-4" style={{ letterSpacing: "0.07em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 36, fontWeight: 700, color, marginTop: 8, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div className="bar-bg"><div className="bar-fg" style={{ width: `${pct}%`, background: color }} /></div>
    </div>
  );
}

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.IN_SHOWROOM;
  return (
    <span className="badge" style={{ color: s.color, background: s.bg }}>
      <span className="badge-dot" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}

export default function ShowroomDashboard() {
  const [inventory, setInventory]   = useState([]);
  const [loading, setLoading]       = useState(false);
  const [toast, setToast]           = useState({ text: "", type: "" });
  const [sellModal, setSellModal]   = useState(null);
  const [customerId, setCustomerId] = useState("");

  const load = async () => {
    try { const r = await getInventory(); setInventory(r.data); } catch {}
  };

  useEffect(() => { load(); }, []);

  const notify = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: "", type: "" }), 3500);
  };

  const handleTransfer = async () => {
    if (!customerId.trim()) { notify("Enter a customer user ID.", "error"); return; }
    setLoading(true);
    try {
      await transferOwnership({ product_id: sellModal.product_id, customer_id: customerId });
      notify(`${sellModal.product_name} sold to customer!`);
      setSellModal(null);
      setCustomerId("");
      load();
    } catch (err) {
      notify(err.response?.data?.error || "Transfer failed", "error");
    } finally { setLoading(false); }
  };

  const total = inventory.length;
  const sold  = inventory.filter(p => p.current_status === "SOLD").length;
  const avail = inventory.filter(p => p.current_status === "IN_SHOWROOM").length;

  return (
    <DashboardLayout title="Inventory">
      <Toast toast={toast} />
      <div className="page">

        {/* Header */}
        <div className="mb-28">
          <div className="page-title">Showroom Inventory</div>
          <div className="page-sub">Manage stock and transfer ownership to customers.</div>
        </div>

        {/* Stats */}
        <div className="grid-3 mb-20">
          <StatCard label="Total stock"  value={total} color="var(--amber)" pct={100} />
          <StatCard label="Available"    value={avail} color="var(--blue)"  pct={total ? (avail/total)*100 : 0} />
          <StatCard label="Sold"         value={sold}  color="var(--green)" pct={total ? (sold/total)*100 : 0} />
        </div>

        {/* Product table */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", background: "#fafaf8" }}>
            <div className="fs-14 fw-600 text-1">Products in showroom</div>
            <div className="fs-12 text-4 mt-4">Hover a row to sell the product to a customer.</div>
          </div>

          {inventory.length === 0 ? (
            <div className="empty">
              <div className="empty-icon" style={{ background: "var(--amber-bg)" }}>
                <svg width="22" height="22" fill="none" stroke="var(--amber)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <div className="empty-title">No products in inventory</div>
              <div className="empty-sub">Products will appear here once a manufacturer dispatches them.</div>
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  {["Product", "Serial / Model", "Warranty", "Status", ""].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {inventory.map(p => (
                  <tr key={p.product_id} className="tbl-row">
                    <td>
                      <div className="fs-14 fw-600 text-1">{p.product_name}</div>
                      {p.description && (
                        <div className="fs-12 text-4 mt-4" style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="mono fs-13 text-2">{p.serial_number}</div>
                      <div className="mono fs-11 text-4 mt-4">{p.model_no}</div>
                    </td>
                    <td>
                      <span className="fs-13 text-3">{p.warranty ? `${p.warranty} mo.` : "—"}</span>
                    </td>
                    <td><StatusBadge status={p.current_status} /></td>
                    <td>
                      {p.current_status === "IN_SHOWROOM" && (
                        <div className="acts">
                          <button className="btn btn-sm btn-green" onClick={() => setSellModal(p)}>
                            Sell to Customer
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Sell modal */}
      {sellModal && (
        <Modal title="Sell product" subtitle={sellModal.product_name} onClose={() => { setSellModal(null); setCustomerId(""); }}>
          <div className="fs-14 text-3 mb-20" style={{ lineHeight: 1.65 }}>
            Transfer ownership of{" "}
            <span className="fw-600 text-1">{sellModal.product_name}</span>{" "}
            to a customer. Enter their user ID below.
          </div>

          {/* Product summary */}
          <div style={{ background: "var(--bg)", borderRadius: 10, padding: "14px 16px", border: "1px solid var(--border)", marginBottom: 20 }}>
            <div className="grid-2" style={{ gap: "8px 20px" }}>
              {[["Product", sellModal.product_name], ["Serial", sellModal.serial_number], ["Model", sellModal.model_no], ["Warranty", sellModal.warranty ? `${sellModal.warranty} mo.` : "—"]].map(([k, v]) => (
                <div key={k}>
                  <div className="fs-11 text-4 mb-4">{k}</div>
                  <div className="fs-13 fw-500 text-1">{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-20">
            <label className="lbl">Customer user ID</label>
            <input className="inp" placeholder="Enter customer ID..."
              value={customerId} onChange={e => setCustomerId(e.target.value)} />
          </div>

          <div className="form-actions">
            <button className="btn btn-outline" onClick={() => { setSellModal(null); setCustomerId(""); }}>Cancel</button>
            <button className="btn btn-green" style={{ padding: "10px 22px", fontSize: 14 }}
              onClick={handleTransfer} disabled={loading}>
              {loading ? "Transferring..." : "Confirm Sale"}
            </button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}