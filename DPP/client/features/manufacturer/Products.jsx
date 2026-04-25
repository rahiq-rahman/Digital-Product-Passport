import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "../shared/DashboardLayout";
import { getMyProducts, updateProduct, deleteProduct, sendToShowroom, getAllShowrooms } from "./manufacturer.api";
import { getPassport } from "../customer/customer.api";

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS = {
  CREATED:     { label: "Created",    color: "var(--blue)",  bg: "var(--blue-bg)",  border: "var(--blue-border)"  },
  IN_SHOWROOM: { label: "In Showroom",color: "var(--amber)", bg: "var(--amber-bg)", border: "var(--amber-border)" },
  SOLD:        { label: "Sold",       color: "var(--green)", bg: "var(--green-bg)", border: "var(--green-border)" },
  IN_REPAIR:   { label: "In Repair",  color: "var(--red)",   bg: "var(--red-bg)",   border: "var(--red-border)"   },
};

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "CREATED",     label: "Created" },
  { value: "IN_SHOWROOM", label: "In Showroom" },
  { value: "SOLD",        label: "Sold" },
  { value: "IN_REPAIR",   label: "In Repair" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.CREATED;
  return (
    <span className="badge" style={{ color: s.color, background: s.bg }}>
      <span className="badge-dot" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}

function Toast({ toast }) {
  if (!toast.text) return null;
  return (
    <div className={`toast ${toast.type === "error" ? "toast-err" : "toast-ok"}`}>
      {toast.text}
    </div>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ product, onClose, onSave }) {
  const [form, setForm] = useState({
    product_name:      product.product_name      || "",
    serial_number:     product.serial_number     || "",
    model_no:          product.model_no          || "",
    manufacturing_date:product.manufacturing_date ? product.manufacturing_date.slice(0, 10) : "",
    warranty:          product.warranty          || "",
    description:       product.description       || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.product_name || !form.serial_number || !form.model_no || !form.manufacturing_date) {
      setError("Fill in all required fields."); return;
    }
    setError(""); setLoading(true);
    try {
      const res = await updateProduct(product.product_id, form);
      onSave(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Update failed.");
    } finally { setLoading(false); }
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <div>
            <div className="modal-title">Edit Product</div>
            <div className="modal-subtitle mono fs-12">{product.serial_number}</div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {error && (
            <div style={{ fontSize: 13, color: "var(--red)", background: "var(--red-bg)", border: "1px solid var(--red-border)", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
              {error}
            </div>
          )}
          <div className="grid-2" style={{ gap: 14 }}>
            <div style={{ gridColumn: "span 2" }}>
              <label className="lbl">Product name *</label>
              <input className="inp" value={form.product_name} onChange={e => set("product_name", e.target.value)} />
            </div>
            <div>
              <label className="lbl">Serial number *</label>
              <input className="inp mono" value={form.serial_number} onChange={e => set("serial_number", e.target.value)} />
            </div>
            <div>
              <label className="lbl">Model number *</label>
              <input className="inp mono" value={form.model_no} onChange={e => set("model_no", e.target.value)} />
            </div>
            <div>
              <label className="lbl">Manufacturing date *</label>
              <input className="inp" type="date" value={form.manufacturing_date} onChange={e => set("manufacturing_date", e.target.value)} />
            </div>
            <div>
              <label className="lbl">Warranty (months)</label>
              <input className="inp" type="number" value={form.warranty} onChange={e => set("warranty", e.target.value)} />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label className="lbl">Description</label>
              <textarea className="inp" value={form.description} onChange={e => set("description", e.target.value)} />
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: 20 }}>
            <button className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button className="btn btn-dark" onClick={handleSave} disabled={loading} style={{ padding: "10px 24px" }}>
              {loading ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteModal({ product, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    try { await onConfirm(); }
    finally { setLoading(false); }
  };
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <div className="modal-head">
          <div className="modal-title">Delete Product</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div style={{ textAlign: "center", padding: "8px 0 20px" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--red-bg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="22" height="22" fill="none" stroke="var(--red)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
              </svg>
            </div>
            <div className="fs-15 fw-600 text-1 mb-8">Delete "{product.product_name}"?</div>
            <div className="fs-13 text-3" style={{ lineHeight: 1.65 }}>
              This will permanently remove the product and all associated events, repairs, and ownership records. This action cannot be undone.
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button className="btn btn-red" onClick={handleDelete} disabled={loading} style={{ padding: "10px 24px", background: "var(--red)", color: "#fff", borderColor: "var(--red)" }}>
              {loading ? "Deleting…" : "Delete Product"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Dispatch Modal ────────────────────────────────────────────────────────────
function DispatchModal({ product, showrooms, onClose, onConfirm }) {
  const [showroomId, setShowroomId] = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const selected = showrooms.find(s => String(s.user_id) === showroomId);

  const handleDispatch = async () => {
    if (!showroomId) { setError("Select a showroom."); return; }
    setError(""); setLoading(true);
    try {
      await sendToShowroom({ product_id: product.product_id, showroom_id: showroomId });
      onConfirm(selected);
    } catch (err) {
      setError(err.response?.data?.error || "Dispatch failed.");
    } finally { setLoading(false); }
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 460 }}>
        <div className="modal-head">
          <div>
            <div className="modal-title">Dispatch to Showroom</div>
            <div className="modal-subtitle">{product.product_name}</div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {error && (
            <div style={{ fontSize: 13, color: "var(--red)", background: "var(--red-bg)", border: "1px solid var(--red-border)", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
              {error}
            </div>
          )}
          <div style={{ background: "var(--bg)", borderRadius: 10, padding: "14px 16px", border: "1px solid var(--border)", marginBottom: 18 }}>
            <div className="grid-2" style={{ gap: "8px 20px" }}>
              {[["Product", product.product_name], ["Serial", product.serial_number], ["Model", product.model_no], ["Warranty", product.warranty ? `${product.warranty} mo.` : "—"]].map(([k, v]) => (
                <div key={k}>
                  <div className="fs-11 text-4 mb-4">{k}</div>
                  <div className="fs-13 fw-500 text-1">{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label className="lbl">Select showroom *</label>
            {showrooms.length === 0 ? (
              <div className="fs-13 text-4" style={{ padding: "10px 0" }}>No showrooms registered in the system.</div>
            ) : (
              <select className="inp" value={showroomId} onChange={e => setShowroomId(e.target.value)}>
                <option value="">Choose a showroom…</option>
                {showrooms.map(s => (
                  <option key={s.user_id} value={s.user_id}>
                    {s.showroom_name} — {s.location}
                  </option>
                ))}
              </select>
            )}
          </div>
          {selected && (
            <div style={{ background: "var(--amber-bg)", border: "1px solid var(--amber-border)", borderRadius: 10, padding: "12px 16px", marginBottom: 18 }}>
              <div className="fs-13 fw-600 text-1 mb-6">{selected.showroom_name}</div>
              <div className="fs-12 text-3">{selected.location}</div>
            </div>
          )}
          <div className="form-actions">
            <button className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button
              className="btn btn-amber"
              style={{ padding: "10px 24px", background: "var(--amber)", color: "#fff", borderColor: "var(--amber)" }}
              onClick={handleDispatch}
              disabled={loading || !showroomId}
            >
              {loading ? "Dispatching…" : "Dispatch"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Passport Modal ────────────────────────────────────────────────────────────
function PassportModal({ passport, onClose }) {
  const p = passport?.product;
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-head">
          <div>
            <div className="modal-title">Digital Product Passport</div>
            <div className="modal-subtitle">{p?.product_name}</div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="scroll">
            {/* Product info */}
            <div className="psec" style={{ marginBottom: 10 }}>
              <div className="sec-lbl">Product info</div>
              <div className="grid-2" style={{ gap: "10px 24px" }}>
                {[
                  ["Name",      p?.product_name,                           false],
                  ["Serial",    p?.serial_number,                          true ],
                  ["Model",     p?.model_no,                               true ],
                  ["Warranty",  p?.warranty ? `${p.warranty} mo.` : "—",  false],
                  ["Mfg. date", p?.manufacturing_date?.slice(0, 10) || "—", true],
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

            {/* Ownership */}
            <div className="psec" style={{ marginBottom: 10 }}>
              <div className="sec-lbl">Ownership history</div>
              {!passport?.ownership?.length
                ? <div className="fs-13 text-4">No ownership records yet.</div>
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
                    <span className="mono fs-12 text-4">{o.transfer_date?.slice(0, 10)}</span>
                  </div>
                ))}
            </div>

            {/* Repairs */}
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
                    </div>
                  </div>
                ))}
            </div>

            {/* Events */}
            <div className="psec">
              <div className="sec-lbl">Event timeline</div>
              {!passport?.events?.length
                ? <div className="fs-13 text-4">No events yet.</div>
                : passport.events.map((e, i) => (
                  <div key={i} className="row gap-12" style={{ padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
                    <span className="mono fs-11 text-4" style={{ minWidth: 82 }}>{e.event_date?.slice(0, 10)}</span>
                    <span className="fs-11 fw-600" style={{ color: "var(--blue)", minWidth: 116, letterSpacing: "0.03em" }}>{e.event_type}</span>
                    <span className="fs-13 text-3">{e.description}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Products() {
  const [products, setProducts]   = useState([]);
  const [showrooms, setShowrooms] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState({ text: "", type: "" });

  // Filters
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState("");
  const [sortBy, setSortBy]         = useState("newest");

  // Modals
  const [editTarget,     setEditTarget]     = useState(null);
  const [deleteTarget,   setDeleteTarget]   = useState(null);
  const [dispatchTarget, setDispatchTarget] = useState(null);
  const [passport,       setPassport]       = useState(null);
  const [passportLoading,setPassportLoading]= useState(false);

  // Load
  useEffect(() => {
    Promise.all([getMyProducts(), getAllShowrooms()])
      .then(([pRes, sRes]) => { setProducts(pRes.data); setShowrooms(sRes.data); })
      .catch(() => notify("Failed to load products.", "error"))
      .finally(() => setLoading(false));
  }, []);

  const notify = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: "", type: "" }), 3500);
  };

  // Filtered + sorted list
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
      case "newest": list.sort((a, b) => new Date(b.manufacturing_date) - new Date(a.manufacturing_date)); break;
      case "oldest": list.sort((a, b) => new Date(a.manufacturing_date) - new Date(b.manufacturing_date)); break;
      case "name":   list.sort((a, b) => a.product_name.localeCompare(b.product_name)); break;
      case "status": list.sort((a, b) => a.current_status.localeCompare(b.current_status)); break;
      default: break;
    }
    return list;
  }, [products, search, statusFilter, sortBy]);

  // Stats
  const stats = useMemo(() => ({
    total:   products.length,
    created: products.filter(p => p.current_status === "CREATED").length,
    inShow:  products.filter(p => p.current_status === "IN_SHOWROOM").length,
    sold:    products.filter(p => p.current_status === "SOLD").length,
    inRep:   products.filter(p => p.current_status === "IN_REPAIR").length,
  }), [products]);

  // Handlers
  const handleSaveEdit = (updated) => {
    setProducts(prev => prev.map(p => p.product_id === updated.product_id ? updated : p));
    setEditTarget(null);
    notify(`"${updated.product_name}" updated successfully.`);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteProduct(deleteTarget.product_id);
      setProducts(prev => prev.filter(p => p.product_id !== deleteTarget.product_id));
      notify(`"${deleteTarget.product_name}" deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      notify(err.response?.data?.error || "Delete failed.", "error");
      setDeleteTarget(null);
    }
  };

  const handleDispatchConfirm = (showroom) => {
    setProducts(prev => prev.map(p =>
      p.product_id === dispatchTarget.product_id ? { ...p, current_status: "IN_SHOWROOM" } : p
    ));
    notify(`"${dispatchTarget.product_name}" dispatched to ${showroom.showroom_name}.`);
    setDispatchTarget(null);
  };

  const handleViewPassport = async (product_id) => {
    setPassportLoading(true);
    try {
      const r = await getPassport(product_id);
      setPassport(r.data);
    } catch (err) {
      notify(err.response?.data?.error || "Could not load passport.", "error");
    } finally { setPassportLoading(false); }
  };

  return (
    <DashboardLayout title="All Products">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Toast toast={toast} />

      <div className="page">
        {/* Header */}
        <div className="mb-28">
          <div className="page-title">All Products</div>
          <div className="page-sub">View, manage, edit and dispatch all your registered products.</div>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total",      value: stats.total,   color: "var(--text-1)", pct: 100 },
            { label: "Created",    value: stats.created, color: "var(--blue)",   pct: stats.total ? (stats.created / stats.total) * 100 : 0 },
            { label: "Showroom",   value: stats.inShow,  color: "var(--amber)",  pct: stats.total ? (stats.inShow  / stats.total) * 100 : 0 },
            { label: "Sold",       value: stats.sold,    color: "var(--green)",  pct: stats.total ? (stats.sold    / stats.total) * 100 : 0 },
            { label: "In Repair",  value: stats.inRep,   color: "var(--red)",    pct: stats.total ? (stats.inRep   / stats.total) * 100 : 0 },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="fs-11 fw-600 text-4" style={{ letterSpacing: "0.07em", textTransform: "uppercase" }}>{s.label}</div>
              <div style={{ fontSize: 30, fontWeight: 700, color: s.color, marginTop: 8, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
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
                placeholder="Search by name, serial, model…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Status filter */}
            <select className="inp" style={{ width: "auto", minWidth: 150, fontSize: 13 }} value={statusFilter} onChange={e => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            {/* Sort */}
            <select className="inp" style={{ width: "auto", minWidth: 160, fontSize: 13 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name">Name A–Z</option>
              <option value="status">By status</option>
            </select>

            {/* Result count */}
            <div className="fs-12 text-4" style={{ marginLeft: "auto", whiteSpace: "nowrap" }}>
              {filtered.length} / {products.length} product{products.length !== 1 ? "s" : ""}
            </div>

            {/* Passport loading */}
            {passportLoading && (
              <div className="fs-12 text-4 row gap-8">
                <div style={{ width: 13, height: 13, border: "2px solid var(--border)", borderTop: "2px solid var(--blue)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                Loading…
              </div>
            )}
          </div>

          {/* Table body */}
          {loading ? (
            <div className="empty">
              <div style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTop: "3px solid var(--blue)", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty">
              <div className="empty-icon" style={{ background: "var(--blue-bg)" }}>
                <svg width="22" height="22" fill="none" stroke="var(--blue)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
                </svg>
              </div>
              <div className="empty-title">{search || statusFilter ? "No matching products" : "No products yet"}</div>
              <div className="empty-sub">
                {search || statusFilter ? "Try adjusting your search or filter." : "Register your first product to get started."}
              </div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="tbl" style={{ minWidth: 780 }}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Serial / Model</th>
                    <th>Mfg. Date</th>
                    <th>Warranty</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.product_id} className="tbl-row">
                      <td>
                        <div className="fs-14 fw-600 text-1">{p.product_name}</div>
                        {p.description && (
                          <div className="fs-12 text-4 mt-4" style={{ maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {p.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="mono fs-13 text-2">{p.serial_number}</div>
                        <div className="mono fs-11 text-4 mt-4">{p.model_no}</div>
                      </td>
                      <td>
                        <span className="mono fs-13 text-3">{p.manufacturing_date?.slice(0, 10) || "—"}</span>
                      </td>
                      <td>
                        <span className="fs-13 text-3">{p.warranty ? `${p.warranty} mo.` : "—"}</span>
                      </td>
                      <td><StatusBadge status={p.current_status} /></td>
                      <td>
                        <div className="acts" style={{ gap: 5 }}>
                          {/* Passport */}
                          <button
                            className="btn btn-sm btn-blue"
                            onClick={() => handleViewPassport(p.product_id)}
                            disabled={passportLoading}
                            title="View passport"
                          >
                            Passport
                          </button>

                          {/* Dispatch — only for CREATED */}
                          {p.current_status === "CREATED" && (
                            <button
                              className="btn btn-sm btn-amber"
                              onClick={() => setDispatchTarget(p)}
                              title="Dispatch to showroom"
                            >
                              Dispatch
                            </button>
                          )}

                          {/* Edit */}
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => setEditTarget(p)}
                            title="Edit product"
                          >
                            Edit
                          </button>

                          {/* Delete */}
                          <button
                            className="btn btn-sm btn-red"
                            onClick={() => setDeleteTarget(p)}
                            title="Delete product"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer count */}
          {!loading && filtered.length > 0 && (
            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", background: "#fafaf8", fontSize: 12, color: "var(--text-4)" }}>
              Showing {filtered.length} of {products.length} product{products.length !== 1 ? "s" : ""}
              {(search || statusFilter) && " · filtered"}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {editTarget && (
        <EditModal
          product={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleSaveEdit}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          product={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      {dispatchTarget && (
        <DispatchModal
          product={dispatchTarget}
          showrooms={showrooms}
          onClose={() => setDispatchTarget(null)}
          onConfirm={handleDispatchConfirm}
        />
      )}

      {passport && (
        <PassportModal
          passport={passport}
          onClose={() => setPassport(null)}
        />
      )}
    </DashboardLayout>
  );
}