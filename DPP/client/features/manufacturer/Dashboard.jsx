import { useEffect, useState } from "react";
import DashboardLayout from "../shared/DashboardLayout";
import {
  addProduct, getMyProducts, sendToShowroom,
  updateProduct, deleteProduct, getAllShowrooms
} from "./manufacturer.api";
import { getPassport } from "../customer/customer.api";

const emptyForm = {
  serial_number: "", model_no: "", product_name: "",
  manufacturing_date: "", warranty: "", description: "",
};

const STATUS_META = {
  CREATED:     { label: "Created",   color: "#2563eb", bg: "#eff6ff" },
  IN_SHOWROOM: { label: "Showroom",  color: "#d97706", bg: "#fffbeb" },
  SOLD:        { label: "Sold",      color: "#059669", bg: "#ecfdf5" },
  IN_REPAIR:   { label: "In Repair", color: "#dc2626", bg: "#fef2f2" },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');

  .mfr * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Instrument Sans', sans-serif; }
  .mfr { padding: 32px 36px; min-height: 100%; background: #f5f4f0; }

  .stat-card {
    background: #ffffff; border: 1px solid #ebe9e2; border-radius: 14px;
    padding: 22px 24px; transition: box-shadow 0.18s, transform 0.18s; cursor: default;
  }
  .stat-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.07); transform: translateY(-1px); }

  .tab-btn {
    padding: 9px 20px; border-radius: 8px; border: none;
    font-size: 13px; font-weight: 600; cursor: pointer;
    transition: all 0.14s; font-family: 'Instrument Sans', sans-serif;
    letter-spacing: 0.01em;
  }
  .tab-on  { background: #111827; color: #ffffff; }
  .tab-off { background: transparent; color: #6b7280; }
  .tab-off:hover { background: #ebe9e2; color: #111827; }

  .inp {
    width: 100%; padding: 10px 13px; border: 1px solid #e5e3dc; border-radius: 9px;
    background: #fafaf8; color: #111827; font-size: 14px; outline: none;
    transition: border-color 0.14s, box-shadow 0.14s; font-family: 'Instrument Sans', sans-serif;
  }
  .inp::placeholder { color: #9ca3af; }
  .inp:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); background: #fff; }
  .inp option { background: #fff; color: #111827; }

  .btn-primary {
    padding: 10px 22px; border-radius: 9px; border: none;
    background: #111827; color: #fff; font-weight: 600; font-size: 14px;
    cursor: pointer; transition: all 0.14s; font-family: 'Instrument Sans', sans-serif;
    white-space: nowrap;
  }
  .btn-primary:hover { background: #1f2937; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-outline {
    padding: 9px 18px; border-radius: 9px; border: 1px solid #e5e3dc;
    background: #fff; color: #374151; font-weight: 500; font-size: 13px;
    cursor: pointer; transition: all 0.14s; font-family: 'Instrument Sans', sans-serif;
  }
  .btn-outline:hover { border-color: #9ca3af; background: #fafaf8; }

  .btn-xs-blue {
    padding: 5px 12px; border-radius: 6px; font-size: 11px; font-weight: 600;
    border: 1px solid #bfdbfe; background: #eff6ff; color: #2563eb;
    cursor: pointer; transition: all 0.12s; font-family: 'Instrument Sans', sans-serif;
  }
  .btn-xs-blue:hover { background: #dbeafe; border-color: #93c5fd; }

  .btn-xs-amber {
    padding: 5px 12px; border-radius: 6px; font-size: 11px; font-weight: 600;
    border: 1px solid #fde68a; background: #fffbeb; color: #d97706;
    cursor: pointer; transition: all 0.12s; font-family: 'Instrument Sans', sans-serif;
  }
  .btn-xs-amber:hover { background: #fef3c7; border-color: #fbbf24; }

  .btn-xs-red {
    padding: 5px 12px; border-radius: 6px; font-size: 11px; font-weight: 600;
    border: 1px solid #fecaca; background: #fef2f2; color: #dc2626;
    cursor: pointer; transition: all 0.12s; font-family: 'Instrument Sans', sans-serif;
  }
  .btn-xs-red:hover { background: #fee2e2; border-color: #f87171; }

  .btn-danger-lg {
    padding: 10px 22px; border-radius: 9px; border: 1px solid #fecaca;
    background: #fef2f2; color: #dc2626; font-weight: 600; font-size: 14px;
    cursor: pointer; font-family: 'Instrument Sans', sans-serif; transition: all 0.14s;
  }
  .btn-danger-lg:hover { background: #fee2e2; border-color: #f87171; }

  .prod-row { border-bottom: 1px solid #f0efe9; transition: background 0.12s; }
  .prod-row:last-child { border-bottom: none; }
  .prod-row:hover { background: #fafaf8; }
  .acts { opacity: 0; transition: opacity 0.14s; display: flex; gap: 6px; }
  .prod-row:hover .acts { opacity: 1; }

  .overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.35);
    backdrop-filter: blur(4px); display: flex; align-items: center;
    justify-content: center; z-index: 1000;
  }
  .modal {
    background: #fff; border: 1px solid #ebe9e2; border-radius: 18px;
    width: 100%; max-width: 560px; overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,0.12);
    animation: mIn 0.2s cubic-bezier(.34,1.4,.64,1);
  }
  @keyframes mIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }

  .toast {
    position: fixed; top: 22px; right: 22px; z-index: 2000;
    padding: 13px 18px; border-radius: 10px; font-size: 13px; font-weight: 500;
    font-family: 'Instrument Sans', sans-serif;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    animation: tIn 0.2s ease;
  }
  @keyframes tIn { from { opacity:0; transform:translateX(14px); } to { opacity:1; transform:translateX(0); } }

  .lbl { font-size: 11px; font-weight: 600; color: #6b7280; letter-spacing: 0.07em; text-transform: uppercase; display: block; margin-bottom: 7px; }
  .sec-lbl { font-size: 10px; font-weight: 600; color: #9ca3af; letter-spacing: 0.09em; text-transform: uppercase; margin-bottom: 12px; }
  .mono { font-family: 'DM Mono', monospace !important; }

  .bar-bg { background: #f0efe9; border-radius: 3px; height: 3px; overflow: hidden; margin-top: 14px; }
  .bar-fg { height: 100%; border-radius: 3px; transition: width 0.9s cubic-bezier(.4,0,.2,1); }

  .psec { background: #fafaf8; border-radius: 10px; padding: 16px; border: 1px solid #ebe9e2; margin-bottom: 10px; }
  .psec:last-child { margin-bottom: 0; }
  .scroll { max-height: 56vh; overflow-y: auto; padding-right: 2px; }
  .scroll::-webkit-scrollbar { width: 4px; }
  .scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 2px; }

  .card { background: #ffffff; border: 1px solid #ebe9e2; border-radius: 14px; }
`;

function Modal({ title, subtitle, onClose, children }) {
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #ebe9e2", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>{title}</p>
            {subtitle && <p style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid #ebe9e2", background: "#f5f4f0", cursor: "pointer", color: "#6b7280", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        <div style={{ padding: "24px" }}>{children}</div>
      </div>
    </div>
  );
}

function PForm({ form, setForm, onSubmit, onCancel, label, loading }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[
          { lbl: "Product name *",    key: "product_name",       ph: "e.g. Samsung Galaxy S24",  mono: false },
          { lbl: "Serial number *",   key: "serial_number",      ph: "e.g. SG24-001",             mono: true  },
          { lbl: "Model number *",    key: "model_no",           ph: "e.g. SM-S921",              mono: true  },
          { lbl: "Warranty (months)", key: "warranty",           ph: "e.g. 24", type: "number",  mono: false },
        ].map(f => (
          <div key={f.key}>
            <label className="lbl">{f.lbl}</label>
            <input className={`inp${f.mono ? " mono" : ""}`} placeholder={f.ph} type={f.type || "text"}
              value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
          </div>
        ))}
        <div style={{ gridColumn: "span 2" }}>
          <label className="lbl">Manufacturing date</label>
          <input className="inp" type="date" value={form.manufacturing_date}
            onChange={e => setForm({ ...form, manufacturing_date: e.target.value })} />
        </div>
        <div style={{ gridColumn: "span 2" }}>
          <label className="lbl">Description</label>
          <textarea className="inp" style={{ resize: "vertical", minHeight: 88 }}
            placeholder="Specifications, features, notes..."
            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
        {onCancel && <button className="btn-outline" onClick={onCancel}>Cancel</button>}
        <button className="btn-primary" onClick={onSubmit} disabled={loading}>{loading ? "Saving..." : label}</button>
      </div>
    </div>
  );
}

function PassportModal({ passport, onClose }) {
  const p  = passport?.product;
  const sm = STATUS_META[p?.current_status] || STATUS_META.CREATED;
  return (
    <Modal title="Digital Product Passport" subtitle={p?.product_name} onClose={onClose}>
      <div className="scroll">
        <div className="psec">
          <p className="sec-lbl">Product info</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px" }}>
            {[["Name", p?.product_name, false], ["Serial", p?.serial_number, true], ["Model", p?.model_no, true], ["Warranty", p?.warranty ? `${p.warranty} mo.` : "—", false], ["Mfg. date", p?.manufacturing_date?.slice(0, 10) || "—", true]].map(([k, v, m]) => (
              <div key={k}>
                <span style={{ fontSize: 11, color: "#9ca3af", display: "block", marginBottom: 3 }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#111827", fontFamily: m ? "'DM Mono',monospace" : "inherit" }}>{v || "—"}</span>
              </div>
            ))}
            <div>
              <span style={{ fontSize: 11, color: "#9ca3af", display: "block", marginBottom: 3 }}>Status</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: sm.color, background: sm.bg, padding: "3px 10px", borderRadius: 999 }}>{sm.label}</span>
            </div>
          </div>
          {p?.description && <p style={{ fontSize: 13, color: "#6b7280", marginTop: 14, paddingTop: 14, borderTop: "1px solid #ebe9e2", lineHeight: 1.65 }}>{p.description}</p>}
        </div>

        {[
          { title: "Ownership history", rows: passport?.ownership, empty: "No ownership records yet.", render: (o, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #ebe9e2" }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{o.name}</span>
              <span className="mono" style={{ fontSize: 12, color: "#9ca3af" }}>{o.transfer_date?.slice(0, 10)}</span>
            </div>
          )},
          { title: "Repair history", rows: passport?.repairs, empty: "No repairs recorded.", render: (r, i) => (
            <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid #ebe9e2" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{r.issue}</span>
                <span className="mono" style={{ fontSize: 12, color: "#9ca3af" }}>{r.created_at?.slice(0, 10)}</span>
              </div>
              <span style={{ fontSize: 12, color: "#6b7280", marginTop: 3, display: "block" }}>{r.repairshop_name} · {r.repair_type} · {r.repair_price} BDT</span>
            </div>
          )},
          { title: "Event timeline", rows: passport?.events, empty: "No events yet.", render: (e, i) => (
            <div key={i} style={{ display: "flex", gap: 12, padding: "7px 0", borderBottom: "1px solid #ebe9e2" }}>
              <span className="mono" style={{ fontSize: 11, color: "#9ca3af", minWidth: 82 }}>{e.event_date?.slice(0, 10)}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", minWidth: 116, letterSpacing: "0.03em" }}>{e.event_type}</span>
              <span style={{ fontSize: 13, color: "#6b7280" }}>{e.description}</span>
            </div>
          )},
        ].map(sec => (
          <div key={sec.title} className="psec">
            <p className="sec-lbl">{sec.title}</p>
            {!sec.rows?.length
              ? <p style={{ fontSize: 13, color: "#9ca3af" }}>{sec.empty}</p>
              : sec.rows.map(sec.render)}
          </div>
        ))}
      </div>
    </Modal>
  );
}

export default function ManufacturerDashboard() {
  const [products, setProducts]   = useState([]);
  const [showrooms, setShowrooms] = useState([]);
  const [tab, setTab]             = useState("products");
  const [form, setForm]           = useState(emptyForm);
  const [loading, setLoading]     = useState(false);
  const [toast, setToast]         = useState({ text: "", type: "" });
  const [selProd, setSelProd]     = useState("");
  const [selShow, setSelShow]     = useState("");
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm]   = useState(emptyForm);
  const [delModal, setDelModal]   = useState(null);
  const [passport, setPassport]   = useState(null);

  const load = async () => {
    try { const r = await getMyProducts(); setProducts(r.data); } catch {}
  };

  useEffect(() => {
    load();
    getAllShowrooms().then(r => setShowrooms(r.data)).catch(() => {});
  }, []);

  const notify = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: "", type: "" }), 3500);
  };

  const handleAdd = async () => {
    if (!form.product_name || !form.serial_number || !form.model_no) {
      notify("Fill in name, serial number and model number.", "error"); return;
    }
    setLoading(true);
    try { await addProduct(form); setForm(emptyForm); notify("Product registered!"); load(); setTab("products"); }
    catch (err) { notify(err.response?.data?.error || "Error creating product", "error"); }
    finally { setLoading(false); }
  };

  const handleEdit = async () => {
    setLoading(true);
    try { await updateProduct(editModal.product_id, editForm); notify("Product updated!"); setEditModal(null); load(); }
    catch (err) { notify(err.response?.data?.error || "Error updating", "error"); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    setLoading(true);
    try { await deleteProduct(delModal.product_id); notify("Product deleted."); setDelModal(null); load(); }
    catch (err) { notify(err.response?.data?.error || "Error deleting", "error"); }
    finally { setLoading(false); }
  };

  const handleSend = async () => {
    if (!selProd || !selShow) { notify("Select a product and a showroom.", "error"); return; }
    try { await sendToShowroom({ product_id: selProd, showroom_id: selShow }); notify("Dispatched to showroom!"); setSelProd(""); setSelShow(""); load(); }
    catch (err) { notify(err.response?.data?.error || "Error dispatching", "error"); }
  };

  const handlePassport = async (pid) => {
    try { const r = await getPassport(pid); setPassport(r.data); }
    catch (err) { notify(err.response?.data?.error || "Could not load passport", "error"); }
  };

  const total   = products.length;
  const inShow  = products.filter(p => p.current_status === "IN_SHOWROOM").length;
  const sold    = products.filter(p => p.current_status === "SOLD").length;
  const inRep   = products.filter(p => p.current_status === "IN_REPAIR").length;

  return (
    <DashboardLayout title="Overview">
      <style>{css}</style>
      <div className="mfr">

        {toast.text && (
          <div className="toast" style={{
            background: toast.type === "error" ? "#fef2f2" : "#f0fdf4",
            border: `1px solid ${toast.type === "error" ? "#fecaca" : "#bbf7d0"}`,
            color: toast.type === "error" ? "#dc2626" : "#059669",
          }}>{toast.text}</div>
        )}

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 24, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>
            Product Management
          </p>
          <p style={{ fontSize: 14, color: "#6b7280", marginTop: 5 }}>
            Register, track and dispatch products through the supply chain.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
          {[
            { lbl: "Total products", val: total,  color: "#2563eb", pct: 100 },
            { lbl: "In showroom",    val: inShow, color: "#d97706", pct: total ? (inShow/total)*100 : 0 },
            { lbl: "Sold",           val: sold,   color: "#059669", pct: total ? (sold/total)*100 : 0 },
            { lbl: "In repair",      val: inRep,  color: "#dc2626", pct: total ? (inRep/total)*100 : 0 },
          ].map(s => (
            <div key={s.lbl} className="stat-card">
              <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.07em", textTransform: "uppercase" }}>{s.lbl}</p>
              <p style={{ fontSize: 36, fontWeight: 700, color: s.color, marginTop: 8, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{s.val}</p>
              <div className="bar-bg"><div className="bar-fg" style={{ width: `${s.pct}%`, background: s.color }} /></div>
            </div>
          ))}
        </div>

        {/* Dispatch panel */}
        <div className="card" style={{ padding: "20px 24px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>Dispatch to showroom</p>
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Only products with status "Created" are available.</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <select className="inp" style={{ flex: 1 }} value={selProd} onChange={e => setSelProd(e.target.value)}>
              <option value="">Select product...</option>
              {products.filter(p => p.current_status === "CREATED").map(p => (
                <option key={p.product_id} value={p.product_id}>{p.product_name} — {p.serial_number}</option>
              ))}
            </select>
            <select className="inp" style={{ flex: 1 }} value={selShow} onChange={e => setSelShow(e.target.value)}>
              <option value="">Select showroom...</option>
              {showrooms.map(s => (
                <option key={s.user_id} value={s.user_id}>{s.showroom_name} — {s.location}</option>
              ))}
            </select>
            <button className="btn-primary" onClick={handleSend}>Dispatch</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ display: "flex", gap: 6, padding: "14px 16px", borderBottom: "1px solid #ebe9e2", background: "#fafaf8" }}>
            <button className={`tab-btn ${tab === "products" ? "tab-on" : "tab-off"}`} onClick={() => setTab("products")}>
              All Products ({total})
            </button>
            <button className={`tab-btn ${tab === "add" ? "tab-on" : "tab-off"}`} onClick={() => setTab("add")}>
              + Register Product
            </button>
          </div>

          {tab === "add" && (
            <div style={{ padding: 26 }}>
              <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20, lineHeight: 1.6 }}>
                Register a new product into the Digital Product Passport system. Fields marked * are required.
              </p>
              <PForm form={form} setForm={setForm} onSubmit={handleAdd} label="Register Product" loading={loading} />
            </div>
          )}

          {tab === "products" && (
            products.length === 0 ? (
              <div style={{ padding: 60, textAlign: "center" }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                  <svg width="22" height="22" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
                  </svg>
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>No products yet</p>
                <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 5 }}>Register your first product to get started.</p>
                <button className="btn-primary" style={{ marginTop: 18 }} onClick={() => setTab("add")}>Register Product</button>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#fafaf8" }}>
                    {["Product", "Serial / Model", "Warranty", "Mfg. Date", "Status", ""].map(h => (
                      <th key={h} style={{ padding: "11px 20px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => {
                    const sm = STATUS_META[p.current_status] || STATUS_META.CREATED;
                    return (
                      <tr key={p.product_id} className="prod-row">
                        <td style={{ padding: "15px 20px" }}>
                          <p style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{p.product_name}</p>
                          {p.description && <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 3, maxWidth: 210, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.description}</p>}
                        </td>
                        <td style={{ padding: "15px 20px" }}>
                          <p className="mono" style={{ fontSize: 13, color: "#374151" }}>{p.serial_number}</p>
                          <p className="mono" style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{p.model_no}</p>
                        </td>
                        <td style={{ padding: "15px 20px" }}>
                          <span style={{ fontSize: 13, color: "#6b7280" }}>{p.warranty ? `${p.warranty} mo.` : "—"}</span>
                        </td>
                        <td style={{ padding: "15px 20px" }}>
                          <span className="mono" style={{ fontSize: 12, color: "#9ca3af" }}>{p.manufacturing_date?.slice(0, 10) || "—"}</span>
                        </td>
                        <td style={{ padding: "15px 20px" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 11px", borderRadius: 999, background: sm.bg, color: sm.color, display: "inline-flex", alignItems: "center", gap: 6, letterSpacing: "0.03em" }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: sm.color }} />
                            {sm.label}
                          </span>
                        </td>
                        <td style={{ padding: "15px 20px" }}>
                          <div className="acts">
                            <button className="btn-xs-blue" onClick={() => handlePassport(p.product_id)}>Passport</button>
                            <button className="btn-xs-amber" onClick={() => { setEditModal(p); setEditForm({ serial_number: p.serial_number, model_no: p.model_no, product_name: p.product_name, manufacturing_date: p.manufacturing_date?.slice(0,10)||"", warranty: p.warranty||"", description: p.description||"" }); }}>Edit</button>
                            <button className="btn-xs-red" onClick={() => setDelModal(p)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>

      {editModal && (
        <Modal title="Edit Product" subtitle={editModal.product_name} onClose={() => setEditModal(null)}>
          <PForm form={editForm} setForm={setEditForm} onSubmit={handleEdit} onCancel={() => setEditModal(null)} label="Save Changes" loading={loading} />
        </Modal>
      )}

      {delModal && (
        <Modal title="Delete product?" onClose={() => setDelModal(null)}>
          <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7, marginBottom: 24 }}>
            You are about to permanently delete{" "}
            <span style={{ color: "#111827", fontWeight: 600 }}>{delModal.product_name}</span>.
            This action cannot be undone.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button className="btn-outline" onClick={() => setDelModal(null)}>Cancel</button>
            <button className="btn-danger-lg" onClick={handleDelete} disabled={loading}>
              {loading ? "Deleting..." : "Delete permanently"}
            </button>
          </div>
        </Modal>
      )}

      {passport && <PassportModal passport={passport} onClose={() => setPassport(null)} />}
    </DashboardLayout>
  );
}