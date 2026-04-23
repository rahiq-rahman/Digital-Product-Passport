import { useEffect, useState } from "react";
import DashboardLayout from "../shared/DashboardLayout";
import { getInventory, transferOwnership } from "./showroom.api";
import { getPassport } from "../customer/customer.api";

const STATUS = {
  IN_SHOWROOM: { label: "In Showroom", color: "var(--amber)", bg: "var(--amber-bg)" },
  SOLD:        { label: "Sold",        color: "var(--green)", bg: "var(--green-bg)" },
  CREATED:     { label: "Created",     color: "var(--blue)",  bg: "var(--blue-bg)"  },
  IN_REPAIR:   { label: "In Repair",   color: "var(--red)",   bg: "var(--red-bg)"   },
};

function Toast({ toast }) {
  if (!toast.text) return null;
  return <div className={`toast ${toast.type === "error" ? "toast-err" : "toast-ok"}`}>{toast.text}</div>;
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

function Modal({ title, subtitle, onClose, wide, children }) {
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

function PassportModal({ passport, onClose }) {
  const p  = passport?.product;
  const sm = STATUS[p?.current_status] || STATUS.IN_SHOWROOM;
  return (
    <Modal title="Digital Product Passport" subtitle={p?.product_name} onClose={onClose} wide>
      <div className="scroll">
        <div className="psec" style={{ marginBottom: 10 }}>
          <div className="sec-lbl">Product info</div>
          <div className="grid-2" style={{ gap: "10px 24px" }}>
            {[
              ["Name",      p?.product_name,                          false],
              ["Serial",    p?.serial_number,                         true ],
              ["Model",     p?.model_no,                              true ],
              ["Warranty",  p?.warranty ? `${p.warranty} mo.` : "—", false],
              ["Mfg. date", p?.manufacturing_date?.slice(0,10) || "—", true],
            ].map(([k, v, m]) => (
              <div key={k}>
                <div className="fs-11 text-4 mb-4">{k}</div>
                <div className={`fs-13 fw-500 text-1${m ? " mono" : ""}`}>{v || "—"}</div>
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

        {[
          { title: "Ownership history", rows: passport?.ownership, empty: "No ownership records yet.",
            render: (o, i) => (
              <div key={i} className="prow">
                <div className="row gap-10">
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--green-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="12" height="12" fill="none" stroke="var(--green)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <span className="fs-13 fw-500 text-1">{o.name}</span>
                </div>
                <span className="mono fs-12 text-4">{o.transfer_date?.slice(0,10)}</span>
              </div>
            )},
          { title: "Repair history", rows: passport?.repairs, empty: "No repairs recorded.",
            render: (r, i) => (
              <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <div className="between mb-6">
                  <span className="fs-13 fw-500 text-1">{r.issue}</span>
                  <span className="badge fs-10" style={{ color: "var(--red)", background: "var(--red-bg)" }}>{r.repair_type}</span>
                </div>
                <div className="row gap-10 fs-12 text-3">
                  <span>{r.repairshop_name}</span>
                  {r.repair_price && <><span style={{ color: "var(--border-2)" }}>·</span><span>{r.repair_price} BDT</span></>}
                </div>
              </div>
            )},
          { title: "Event timeline", rows: passport?.events, empty: "No events yet.",
            render: (e, i) => (
              <div key={i} className="row gap-12" style={{ padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
                <span className="mono fs-11 text-4" style={{ minWidth: 82 }}>{e.event_date?.slice(0,10)}</span>
                <span className="fs-11 fw-600" style={{ color: "var(--blue)", minWidth: 116, letterSpacing: "0.03em" }}>{e.event_type}</span>
                <span className="fs-13 text-3">{e.description}</span>
              </div>
            )},
        ].map(sec => (
          <div key={sec.title} className="psec" style={{ marginBottom: 10 }}>
            <div className="sec-lbl">{sec.title}</div>
            {!sec.rows?.length
              ? <div className="fs-13 text-4">{sec.empty}</div>
              : sec.rows.map(sec.render)}
          </div>
        ))}
      </div>
    </Modal>
  );
}

export default function ShowroomDashboard() {
  const [inventory, setInventory]   = useState([]);
  const [loading, setLoading]       = useState(false);
  const [toast, setToast]           = useState({ text: "", type: "" });
  const [sellModal, setSellModal]   = useState(null);
  const [customerId, setCustomerId] = useState("");
  const [passport, setPassport]     = useState(null);
  const [passportLoading, setPassportLoading] = useState(false);

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

  const handlePassport = async (product_id) => {
    setPassportLoading(true);
    try {
      const r = await getPassport(product_id);
      setPassport(r.data);
    } catch (err) {
      notify(err.response?.data?.error || "Could not load passport", "error");
    } finally { setPassportLoading(false); }
  };

  const total = inventory.length;
  const sold  = inventory.filter(p => (p.inventory_status || p.current_status) === "SOLD").length;
  const avail = inventory.filter(p => (p.inventory_status || p.current_status) === "IN_SHOWROOM").length;

  return (
    <DashboardLayout title="Inventory">
      <Toast toast={toast} />
      <div className="page">

        <div className="mb-28">
          <div className="page-title">Showroom Inventory</div>
          <div className="page-sub">Manage stock and transfer ownership to customers.</div>
        </div>

        <div className="grid-3 mb-20">
          {[
            { label: "Total stock", value: total, color: "var(--amber)", pct: 100 },
            { label: "Available",   value: avail, color: "var(--blue)",  pct: total ? (avail/total)*100 : 0 },
            { label: "Sold",        value: sold,  color: "var(--green)", pct: total ? (sold/total)*100 : 0 },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="fs-11 fw-600 text-4" style={{ letterSpacing: "0.07em", textTransform: "uppercase" }}>{s.label}</div>
              <div style={{ fontSize: 36, fontWeight: 700, color: s.color, marginTop: 8, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
              <div className="bar-bg"><div className="bar-fg" style={{ width: `${s.pct}%`, background: s.color }} /></div>
            </div>
          ))}
        </div>

        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", background: "#fafaf8", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div className="fs-14 fw-600 text-1">Products in showroom</div>
              <div className="fs-12 text-4 mt-4">Hover a row to view passport or sell a product.</div>
            </div>
            {passportLoading && (
              <div className="fs-12 text-4 row gap-8">
                <div style={{ width: 14, height: 14, border: "2px solid var(--border)", borderTop: "2px solid var(--amber)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                Loading...
              </div>
            )}
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

          {inventory.length === 0 ? (
            <div className="empty">
              <div className="empty-icon" style={{ background: "var(--amber-bg)" }}>
                <svg width="22" height="22" fill="none" stroke="var(--amber)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <div className="empty-title">No products in inventory</div>
              <div className="empty-sub">Products appear here once a manufacturer dispatches them.</div>
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  {["Product", "Serial / Model", "Warranty", "Status", ""].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {inventory.map(p => {
                  const inventoryStatus = p.inventory_status || p.current_status;
                  return (
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
                      <td><StatusBadge status={inventoryStatus} /></td>
                      <td>
                        <div className="acts">
                          <button className="btn btn-sm btn-blue"
                            onClick={() => handlePassport(p.product_id)}
                            disabled={passportLoading}>
                            Passport
                          </button>
                          {inventoryStatus === "IN_SHOWROOM" && (
                            <button className="btn btn-sm btn-green" onClick={() => setSellModal(p)}>
                              Sell
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {passport && (
        <PassportModal passport={passport} onClose={() => setPassport(null)} />
      )}
    </DashboardLayout>
  );
}