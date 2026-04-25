import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "../shared/DashboardLayout";
import { getMyProducts, getMyPassport, transferProduct } from "./customer.api";

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS = {
  SOLD:        { label: "Owned",     color: "var(--green)", bg: "var(--green-bg)" },
  CREATED:     { label: "Created",   color: "var(--blue)",  bg: "var(--blue-bg)"  },
  IN_SHOWROOM: { label: "Showroom",  color: "var(--amber)", bg: "var(--amber-bg)" },
  IN_REPAIR:   { label: "In Repair", color: "var(--red)",   bg: "var(--red-bg)"   },
};

const STATUS_OPTIONS = [
  { value: "",            label: "All statuses" },
  { value: "SOLD",        label: "Owned"        },
  { value: "IN_REPAIR",   label: "In Repair"    },
  { value: "IN_SHOWROOM", label: "In Showroom"  },
  { value: "CREATED",     label: "Created"      },
];

// ── Sub-components ────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast.text) return null;
  return (
    <div className={`toast ${toast.type === "error" ? "toast-err" : "toast-ok"}`}>
      {toast.text}
    </div>
  );
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

// ── Passport Modal ────────────────────────────────────────────────────────────
function PassportModal({ passport, onClose, onTransfer }) {
  const p = passport?.product;
  return (
    <Modal title="Digital Product Passport" subtitle={p?.product_name} onClose={onClose} wide>
      <div className="scroll">
        <div className="psec" style={{ marginBottom: 10 }}>
          <div className="sec-lbl">Product info</div>
          <div className="grid-2" style={{ gap: "10px 24px" }}>
            {[
              ["Name",      p?.product_name,                         false],
              ["Serial",    p?.serial_number,                        true ],
              ["Model",     p?.model_no,                             true ],
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

        <div className="psec" style={{ marginBottom: 10 }}>
          <div className="sec-lbl">Ownership history</div>
          {!passport?.ownership?.length
            ? <div className="fs-13 text-4">No records.</div>
            : passport.ownership.map((o, i) => (
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
            ))}
        </div>

        <div className="psec" style={{ marginBottom: 10 }}>
          <div className="sec-lbl">Repair history</div>
          {!passport?.repairs?.length
            ? <div className="fs-13 text-4">No repairs recorded.</div>
            : passport.repairs.map((r, i) => (
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

        <div className="psec" style={{ marginBottom: 10 }}>
          <div className="sec-lbl">Event timeline</div>
          {!passport?.events?.length
            ? <div className="fs-13 text-4">No events.</div>
            : (
              <div style={{ position: "relative", paddingLeft: 22 }}>
                <div style={{ position: "absolute", left: 6, top: 0, bottom: 0, width: 1, background: "var(--border)" }} />
                {passport.events.map((e, i) => (
                  <div key={i} style={{ position: "relative", padding: "10px 0", borderBottom: i < passport.events.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <div style={{ position: "absolute", left: -16, top: 14, width: 8, height: 8, borderRadius: "50%", background: "var(--blue)", border: "2px solid #fff" }} />
                    <div className="between mb-4">
                      <span className="fs-11 fw-700" style={{ color: "var(--blue)", letterSpacing: "0.04em" }}>{e.event_type}</span>
                      <span className="mono fs-11 text-4">{e.event_date?.slice(0,10)}</span>
                    </div>
                    <div className="fs-13 text-3">{e.description}</div>
                  </div>
                ))}
              </div>
            )}
        </div>

        <button
          className="btn btn-green"
          style={{ width: "100%", justifyContent: "center", padding: "11px", marginTop: 4 }}
          onClick={() => onTransfer(passport.product)}
        >
          Transfer ownership
        </button>
      </div>
    </Modal>
  );
}

// ── Transfer Modal ────────────────────────────────────────────────────────────
function TransferModal({ product, onClose, onSuccess }) {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [done, setDone]       = useState(null);

  const handleTransfer = async () => {
    if (!email.trim()) { setError("Enter the recipient's email address."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Enter a valid email address."); return; }
    setError(""); setLoading(true);
    try {
      const res = await transferProduct({ product_id: product.product_id, to_email: email });
      setDone(res.data.recipient);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || "Transfer failed.");
    } finally { setLoading(false); }
  };

  return (
    <Modal title="Transfer ownership" subtitle={product?.product_name} onClose={onClose}>
      {done ? (
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--green-bg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <svg width="24" height="24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div className="fs-16 fw-600 text-1 mb-6">Transfer complete</div>
          <div className="fs-14 text-3" style={{ lineHeight: 1.6 }}>
            <span className="fw-600 text-1">{product?.product_name}</span> has been transferred to{" "}
            <span className="fw-600 text-1">{done.name}</span>.
          </div>
          <button className="btn btn-outline" style={{ marginTop: 24, padding: "10px 24px" }} onClick={onClose}>Done</button>
        </div>
      ) : (
        <>
          <div style={{ background: "var(--bg)", borderRadius: 10, padding: "14px 16px", border: "1px solid var(--border)", marginBottom: 20 }}>
            <div className="grid-2" style={{ gap: "8px 20px" }}>
              {[["Product", product?.product_name], ["Serial", product?.serial_number], ["Model", product?.model_no], ["Warranty", product?.warranty ? `${product.warranty} mo.` : "—"]].map(([k, v]) => (
                <div key={k}>
                  <div className="fs-11 text-4 mb-4">{k}</div>
                  <div className="fs-13 fw-500 text-1">{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: "var(--amber-bg)", border: "1px solid var(--amber-border)", borderRadius: 9, padding: "11px 14px", marginBottom: 20, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <svg width="15" height="15" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div className="fs-13" style={{ color: "var(--amber)", lineHeight: 1.5 }}>
              This action is <strong>permanent</strong>. Once transferred you will no longer own this product.
            </div>
          </div>
          {error && (
            <div style={{ fontSize: 13, color: "var(--red)", background: "var(--red-bg)", border: "1px solid var(--red-border)", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
              {error}
            </div>
          )}
          <div className="mb-20">
            <label className="lbl">Recipient email address</label>
            <input
              className="inp"
              type="email"
              placeholder="recipient@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleTransfer()}
            />
          </div>
          <div className="form-actions">
            <button className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button className="btn btn-green" style={{ padding: "10px 22px", fontSize: 14 }} onClick={handleTransfer} disabled={loading}>
              {loading ? "Transferring…" : "Confirm transfer"}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CustomerDashboard() {
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState({ text: "", type: "" });
  const [passport, setPassport]   = useState(null);
  const [passportLoading, setPassportLoading] = useState(false);
  const [transferProduct_state, setTransferProduct] = useState(null);
  const [showTransfer, setShowTransfer]             = useState(false);
  const [passportOpen, setPassportOpen]             = useState(false);

  // Filters
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState("");
  const [sortBy, setSortBy]       = useState("default");

  const load = async () => {
    setLoading(true);
    try { const r = await getMyProducts(); setProducts(r.data); }
    catch { notify("Could not load your products.", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const notify = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: "", type: "" }), 3500);
  };

  // Filtered list
  const filtered = useMemo(() => {
    let list = [...products];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.product_name?.toLowerCase().includes(q) ||
        p.serial_number?.toLowerCase().includes(q) ||
        p.model_no?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }
    if (statusFilter) list = list.filter(p => p.current_status === statusFilter);
    switch (sortBy) {
      case "name":    list.sort((a, b) => a.product_name.localeCompare(b.product_name)); break;
      case "warranty_hi": list.sort((a, b) => (Number(b.warranty) || 0) - (Number(a.warranty) || 0)); break;
      case "warranty_lo": list.sort((a, b) => (Number(a.warranty) || 0) - (Number(b.warranty) || 0)); break;
      case "status":  list.sort((a, b) => a.current_status.localeCompare(b.current_status)); break;
      default: break;
    }
    return list;
  }, [products, search, statusFilter, sortBy]);

  // Stats
  const inRepair      = products.filter(p => p.current_status === "IN_REPAIR").length;
  const totalWarranty = products.reduce((acc, p) => acc + (Number(p.warranty) || 0), 0);

  const handleViewPassport = async (product_id) => {
    setPassportLoading(true);
    try {
      const r = await getMyPassport(product_id);
      setPassport(r.data);
      setPassportOpen(true);
    } catch (err) {
      notify(err.response?.data?.error || "Could not load passport.", "error");
    } finally { setPassportLoading(false); }
  };

  const handleOpenTransfer = (product) => {
    setTransferProduct(product);
    setPassportOpen(false);
    setPassport(null);
    setShowTransfer(true);
  };

  const handleTransferSuccess = () => {
    load();
    notify("Ownership transferred successfully!");
  };

  const name = localStorage.getItem("name") || "there";

  return (
    <DashboardLayout title="My Products">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Toast toast={toast} />

      <div className="page">
        {/* Header */}
        <div className="mb-28">
          <div className="page-title">Hello, {name.split(" ")[0]}</div>
          <div className="page-sub">Here are all the products registered under your account.</div>
        </div>

        {/* Stats */}
        <div className="grid-3 mb-20">
          {[
            { label: "Products owned", value: products.length,   color: "var(--green)", pct: 100 },
            { label: "In repair",      value: inRepair,           color: "var(--red)",   pct: products.length ? (inRepair / products.length) * 100 : 0 },
            { label: "Total warranty", value: `${totalWarranty} mo.`, color: "var(--blue)",  pct: 100 },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="fs-11 fw-600 text-4" style={{ letterSpacing: "0.07em", textTransform: "uppercase" }}>{s.label}</div>
              <div style={{ fontSize: 34, fontWeight: 700, color: s.color, marginTop: 8, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
              <div className="bar-bg"><div className="bar-fg" style={{ width: `${s.pct}%`, background: s.color }} /></div>
            </div>
          ))}
        </div>

        {/* Table card */}
        <div className="card" style={{ overflow: "hidden" }}>
          {/* Toolbar */}
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", background: "#fafaf8", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {/* Search */}
            <div style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 320 }}>
              <svg style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                width="13" height="13" fill="none" stroke="var(--text-4)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                className="inp"
                style={{ paddingLeft: 32, fontSize: 13 }}
                placeholder="Search name, serial, model…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Status filter */}
            <select className="inp" style={{ width: "auto", minWidth: 150, fontSize: 13 }} value={statusFilter} onChange={e => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            {/* Sort */}
            <select className="inp" style={{ width: "auto", minWidth: 170, fontSize: 13 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="default">Default order</option>
              <option value="name">Name A–Z</option>
              <option value="status">By status</option>
              <option value="warranty_hi">Warranty (high–low)</option>
              <option value="warranty_lo">Warranty (low–high)</option>
            </select>

            {/* Count + passport spinner */}
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
              <span className="fs-12 text-4" style={{ whiteSpace: "nowrap" }}>
                {filtered.length} / {products.length} product{products.length !== 1 ? "s" : ""}
                {(search || statusFilter) && " · filtered"}
              </span>
              {passportLoading && (
                <div className="fs-12 text-4 row gap-8">
                  <div style={{ width: 13, height: 13, border: "2px solid var(--border)", borderTop: "2px solid var(--green)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                  Loading…
                </div>
              )}
            </div>
          </div>

          {/* Active filter chips */}
          {(search || statusFilter) && (
            <div style={{ padding: "10px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span className="fs-11 fw-600 text-4" style={{ textTransform: "uppercase", letterSpacing: "0.07em" }}>Filters:</span>
              {search && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--blue-bg)", border: "1px solid var(--blue-border)", borderRadius: 999, padding: "3px 10px", fontSize: 12, color: "var(--blue)", fontWeight: 500 }}>
                  "{search}"
                  <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--blue)", fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
                </span>
              )}
              {statusFilter && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--green-bg)", border: "1px solid var(--green-border)", borderRadius: 999, padding: "3px 10px", fontSize: 12, color: "var(--green)", fontWeight: 500 }}>
                  {STATUS_OPTIONS.find(o => o.value === statusFilter)?.label}
                  <button onClick={() => setStatus("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--green)", fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
                </span>
              )}
              <button
                onClick={() => { setSearch(""); setStatus(""); }}
                className="fs-11"
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-4)", textDecoration: "underline" }}
              >
                Clear all
              </button>
            </div>
          )}

          {/* Body */}
          {loading ? (
            <div className="empty">
              <div style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTop: "3px solid var(--green)", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty">
              <div className="empty-icon" style={{ background: "var(--green-bg)" }}>
                <svg width="22" height="22" fill="none" stroke="var(--green)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
                </svg>
              </div>
              <div className="empty-title">{search || statusFilter ? "No matching products" : "No products yet"}</div>
              <div className="empty-sub">
                {search || statusFilter
                  ? "Try adjusting your search or filter."
                  : "Products will appear here once a showroom transfers one to you."}
              </div>
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  {["Product", "Serial / Model", "Warranty", "Status", ""].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
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
                      <div className="acts">
                        <button
                          className="btn btn-sm btn-blue"
                          onClick={() => handleViewPassport(p.product_id)}
                          disabled={passportLoading}
                        >
                          Passport
                        </button>
                        <button
                          className="btn btn-sm btn-green"
                          onClick={() => handleOpenTransfer(p)}
                        >
                          Transfer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Footer */}
          {!loading && filtered.length > 0 && (
            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", background: "#fafaf8", fontSize: 12, color: "var(--text-4)" }}>
              Showing {filtered.length} of {products.length} product{products.length !== 1 ? "s" : ""}
              {(search || statusFilter) && " · filtered"}
            </div>
          )}
        </div>
      </div>

      {/* Passport modal */}
      {passportOpen && passport && (
        <PassportModal
          passport={passport}
          onClose={() => { setPassportOpen(false); setPassport(null); }}
          onTransfer={handleOpenTransfer}
        />
      )}

      {/* Transfer modal */}
      {showTransfer && transferProduct_state && (
        <TransferModal
          product={transferProduct_state}
          onClose={() => { setShowTransfer(false); setTransferProduct(null); }}
          onSuccess={handleTransferSuccess}
        />
      )}
    </DashboardLayout>
  );
}