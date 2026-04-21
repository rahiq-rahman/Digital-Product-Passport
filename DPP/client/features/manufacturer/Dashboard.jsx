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
  CREATED:     { label: "Created",   color: "#60a5fa", bg: "rgba(96,165,250,0.12)"  },
  IN_SHOWROOM: { label: "Showroom",  color: "#fbbf24", bg: "rgba(251,191,36,0.12)"  },
  SOLD:        { label: "Sold",      color: "#34d399", bg: "rgba(52,211,153,0.12)"  },
  IN_REPAIR:   { label: "In Repair", color: "#f87171", bg: "rgba(248,113,113,0.12)" },
};

const G = {
  bg:       "#0f1117",
  surface:  "#161b27",
  card:     "#1c2333",
  border:   "#2a3347",
  accent:   "#3b7eff",
  accentHi: "#6fa3ff",
  text:     "#e8edf5",
  muted:    "#8892a4",
  danger:   "#f87171",
  success:  "#34d399",
  warn:     "#fbbf24",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
  .mfr * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'DM Sans', sans-serif; }
  .mfr { background: ${G.bg}; min-height: 100vh; padding: 32px; color: ${G.text}; }
  .stat-card { background: ${G.card}; border: 1px solid ${G.border}; border-radius: 16px; padding: 24px 28px;
    transition: border-color 0.2s, transform 0.2s; cursor: default; position: relative; overflow: hidden; }
  .stat-card::before { content:''; position:absolute; inset:0; opacity:0; transition:opacity 0.2s;
    background: linear-gradient(135deg, rgba(59,126,255,0.07) 0%, transparent 60%); pointer-events:none; }
  .stat-card:hover { border-color: ${G.accent}; transform: translateY(-2px); }
  .stat-card:hover::before { opacity:1; }
  .tab-btn { padding: 10px 22px; border-radius: 10px; border: none; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all 0.15s; letter-spacing: 0.02em; font-family: 'DM Sans', sans-serif; }
  .tab-active { background: ${G.accent}; color: #fff; }
  .tab-inactive { background: transparent; color: ${G.muted}; }
  .tab-inactive:hover { color: ${G.text}; background: ${G.border}; }
  .inp { width: 100%; padding: 11px 14px; border: 1px solid ${G.border}; border-radius: 10px;
    background: ${G.surface}; color: ${G.text}; font-size: 14px; outline: none;
    transition: border-color 0.15s, box-shadow 0.15s; font-family: 'DM Sans', sans-serif; }
  .inp::placeholder { color: ${G.muted}; }
  .inp:focus { border-color: ${G.accent}; box-shadow: 0 0 0 3px rgba(59,126,255,0.15); }
  .inp option { background: ${G.card}; color: ${G.text}; }
  .btn-p { padding: 11px 24px; border-radius: 10px; border: none; background: ${G.accent};
    color: #fff; font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.15s;
    font-family: 'DM Sans', sans-serif; white-space: nowrap; }
  .btn-p:hover { background: ${G.accentHi}; transform: translateY(-1px); }
  .btn-p:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  .btn-g { padding: 7px 14px; border-radius: 8px; border: 1px solid ${G.border};
    background: transparent; color: ${G.muted}; font-size: 12px; font-weight: 500;
    cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif; }
  .btn-g:hover { color: ${G.text}; border-color: ${G.muted}; }
  .btn-g-lg { padding: 10px 20px; font-size: 14px; }
  .btn-d { padding: 7px 14px; border-radius: 8px; border: 1px solid rgba(248,113,113,0.3);
    background: rgba(248,113,113,0.08); color: ${G.danger}; font-size: 12px; font-weight: 500;
    cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif; }
  .btn-d:hover { background: rgba(248,113,113,0.18); border-color: ${G.danger}; }
  .btn-d-lg { padding: 10px 24px; font-size: 14px; font-weight: 600; }
  .btn-a { padding: 7px 14px; border-radius: 8px; border: 1px solid rgba(59,126,255,0.3);
    background: rgba(59,126,255,0.08); color: ${G.accentHi}; font-size: 12px; font-weight: 500;
    cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif; }
  .btn-a:hover { background: rgba(59,126,255,0.18); border-color: ${G.accent}; }
  .btn-w { padding: 7px 14px; border-radius: 8px; border: 1px solid rgba(251,191,36,0.3);
    background: rgba(251,191,36,0.08); color: ${G.warn}; font-size: 12px; font-weight: 500;
    cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif; }
  .btn-w:hover { background: rgba(251,191,36,0.18); border-color: ${G.warn}; }
  .prod-row { border-bottom: 1px solid ${G.border}; transition: background 0.15s; }
  .prod-row:last-child { border-bottom: none; }
  .prod-row:hover { background: rgba(255,255,255,0.025); }
  .acts { opacity: 0; transition: opacity 0.15s; display: flex; gap: 8px; }
  .prod-row:hover .acts { opacity: 1; }
  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center; z-index: 1000; }
  .modal { background: ${G.card}; border: 1px solid ${G.border}; border-radius: 20px;
    width: 100%; max-width: 580px; overflow: hidden;
    animation: mIn 0.22s cubic-bezier(.34,1.4,.64,1); }
  @keyframes mIn { from { opacity:0; transform:scale(0.94) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
  .toast { position: fixed; top: 24px; right: 24px; z-index: 2000; padding: 14px 20px;
    border-radius: 12px; font-size: 14px; font-weight: 500; font-family: 'DM Sans', sans-serif;
    animation: tIn 0.2s ease; box-shadow: 0 8px 32px rgba(0,0,0,0.5); }
  @keyframes tIn { from { opacity:0; transform:translateX(16px); } to { opacity:1; transform:translateX(0); } }
  .lbl { font-size: 11px; font-weight: 600; color: ${G.muted}; letter-spacing: 0.08em;
    text-transform: uppercase; display: block; margin-bottom: 8px; }
  .sec-title { font-size: 11px; font-weight: 600; color: ${G.muted}; letter-spacing: 0.08em;
    text-transform: uppercase; margin-bottom: 14px; }
  .mono { font-family: 'DM Mono', monospace !important; }
  .bar-bg { background: ${G.surface}; border-radius: 4px; height: 4px; overflow: hidden; margin-top: 14px; }
  .bar-fg { height: 100%; border-radius: 4px; transition: width 0.9s cubic-bezier(.4,0,.2,1); }
  .scroll { max-height: 58vh; overflow-y: auto; padding-right: 2px; }
  .scroll::-webkit-scrollbar { width: 4px; }
  .scroll::-webkit-scrollbar-thumb { background: ${G.border}; border-radius: 2px; }
  .psec { background: ${G.surface}; border-radius: 12px; padding: 18px; border: 1px solid ${G.border}; margin-bottom: 12px; }
  .psec:last-child { margin-bottom: 0; }
`;

function Modal({ title, subtitle, onClose, children }) {
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ padding: "22px 28px", borderBottom: `1px solid ${G.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: 16, color: G.text }}>{title}</p>
            {subtitle && <p style={{ fontSize: 12, color: G.muted, marginTop: 3 }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${G.border}`, background: G.surface, cursor: "pointer", color: G.muted, fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        <div style={{ padding: "24px 28px" }}>{children}</div>
      </div>
    </div>
  );
}

function PForm({ form, setForm, onSubmit, onCancel, label, loading }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[
          { lbl: "Product name *",   key: "product_name",      ph: "e.g. Samsung Galaxy S24", mono: false },
          { lbl: "Serial number *",  key: "serial_number",     ph: "e.g. SG24-001",           mono: true  },
          { lbl: "Model number *",   key: "model_no",          ph: "e.g. SM-S921",            mono: true  },
          { lbl: "Warranty (months)",key: "warranty",          ph: "e.g. 24", type: "number", mono: false },
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
        {onCancel && <button className="btn-g btn-g-lg" onClick={onCancel}>Cancel</button>}
        <button className="btn-p" onClick={onSubmit} disabled={loading}>{loading ? "Saving..." : label}</button>
      </div>
    </div>
  );
}

function PassportModal({ passport, onClose }) {
  const p = passport?.product;
  const sm = STATUS_META[p?.current_status] || STATUS_META.CREATED;
  const fields = [["Name", p?.product_name, false], ["Serial", p?.serial_number, true], ["Model", p?.model_no, true], ["Warranty", p?.warranty ? `${p.warranty} mo.` : "—", false], ["Mfg. date", p?.manufacturing_date?.slice(0, 10) || "—", true]];
  return (
    <Modal title="Digital Product Passport" subtitle={p?.product_name} onClose={onClose}>
      <div className="scroll">
        <div className="psec">
          <p className="sec-title">Product info</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px" }}>
            {fields.map(([k, v, m]) => (
              <div key={k}>
                <span style={{ fontSize: 11, color: G.muted, display: "block", marginBottom: 3 }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: G.text, fontFamily: m ? "'DM Mono',monospace" : "inherit" }}>{v || "—"}</span>
              </div>
            ))}
            <div>
              <span style={{ fontSize: 11, color: G.muted, display: "block", marginBottom: 3 }}>Status</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: sm.color, background: sm.bg, padding: "3px 10px", borderRadius: 999 }}>{sm.label}</span>
            </div>
          </div>
          {p?.description && <p style={{ fontSize: 13, color: G.muted, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${G.border}`, lineHeight: 1.6 }}>{p.description}</p>}
        </div>

        {[
          { title: "Ownership history", rows: passport?.ownership, render: (o, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${G.border}` }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: G.text }}>{o.name}</span>
              <span className="mono" style={{ fontSize: 12, color: G.muted }}>{o.transfer_date?.slice(0, 10)}</span>
            </div>
          )},
          { title: "Repair history", rows: passport?.repairs, render: (r, i) => (
            <div key={i} style={{ padding: "8px 0", borderBottom: `1px solid ${G.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: G.text }}>{r.issue}</span>
                <span className="mono" style={{ fontSize: 12, color: G.muted }}>{r.created_at?.slice(0, 10)}</span>
              </div>
              <span style={{ fontSize: 12, color: G.muted, marginTop: 3, display: "block" }}>{r.repairshop_name} · {r.repair_type} · {r.repair_price} BDT</span>
            </div>
          )},
          { title: "Event timeline", rows: passport?.events, render: (e, i) => (
            <div key={i} style={{ display: "flex", gap: 12, padding: "7px 0", borderBottom: `1px solid ${G.border}` }}>
              <span className="mono" style={{ fontSize: 11, color: G.muted, minWidth: 86 }}>{e.event_date?.slice(0, 10)}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: G.accent, minWidth: 120, letterSpacing: "0.03em" }}>{e.event_type}</span>
              <span style={{ fontSize: 13, color: G.muted }}>{e.description}</span>
            </div>
          )},
        ].map(sec => (
          <div key={sec.title} className="psec">
            <p className="sec-title">{sec.title}</p>
            {!sec.rows?.length
              ? <p style={{ fontSize: 13, color: G.muted }}>No records yet.</p>
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

  const total    = products.length;
  const inShow   = products.filter(p => p.current_status === "IN_SHOWROOM").length;
  const sold     = products.filter(p => p.current_status === "SOLD").length;
  const inRepair = products.filter(p => p.current_status === "IN_REPAIR").length;

  return (
    <DashboardLayout title="Dashboard">
      <style>{css}</style>
      <div className="mfr">

        {toast.text && (
          <div className="toast" style={{
            background: toast.type === "error" ? "rgba(248,113,113,0.15)" : "rgba(52,211,153,0.15)",
            border: `1px solid ${toast.type === "error" ? G.danger : G.success}`,
            color: toast.type === "error" ? G.danger : G.success,
          }}>{toast.text}</div>
        )}

        {/* Page header */}
        <div style={{ marginBottom: 30 }}>
          <p style={{ fontSize: 28, fontWeight: 700, color: G.text, letterSpacing: "-0.03em" }}>
            Manufacturer Console
          </p>
          <p style={{ fontSize: 14, color: G.muted, marginTop: 5 }}>
            Full lifecycle visibility — from factory floor to end customer.
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
          {[
            { lbl: "Total products", val: total,   color: G.accentHi, pct: 100 },
            { lbl: "In showroom",    val: inShow,  color: G.warn,     pct: total ? (inShow/total)*100 : 0 },
            { lbl: "Sold",          val: sold,    color: G.success,  pct: total ? (sold/total)*100 : 0 },
            { lbl: "In repair",     val: inRepair,color: G.danger,   pct: total ? (inRepair/total)*100 : 0 },
          ].map(s => (
            <div key={s.lbl} className="stat-card">
              <p style={{ fontSize: 11, fontWeight: 600, color: G.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>{s.lbl}</p>
              <p style={{ fontSize: 40, fontWeight: 700, color: s.color, marginTop: 10, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{s.val}</p>
              <div className="bar-bg"><div className="bar-fg" style={{ width: `${s.pct}%`, background: s.color }} /></div>
            </div>
          ))}
        </div>

        {/* Dispatch panel */}
        <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 16, padding: "22px 28px", marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(59,126,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="17" height="17" fill="none" stroke={G.accentHi} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: G.text }}>Dispatch to showroom</p>
              <p style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>Only "Created" products are available for dispatch.</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
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
            <button className="btn-p" onClick={handleSend}>Dispatch</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 16, overflow: "hidden" }}>
          <div style={{ display: "flex", gap: 6, padding: "14px 18px", borderBottom: `1px solid ${G.border}`, background: G.surface }}>
            <button className={`tab-btn ${tab === "products" ? "tab-active" : "tab-inactive"}`} onClick={() => setTab("products")}>
              All Products ({total})
            </button>
            <button className={`tab-btn ${tab === "add" ? "tab-active" : "tab-inactive"}`} onClick={() => setTab("add")}>
              + Register Product
            </button>
          </div>

          {tab === "add" && (
            <div style={{ padding: 28 }}>
              <p style={{ fontSize: 13, color: G.muted, marginBottom: 22, lineHeight: 1.6 }}>
                Register a new product into the Digital Product Passport system. All fields marked * are required.
              </p>
              <PForm form={form} setForm={setForm} onSubmit={handleAdd} label="Register Product" loading={loading} />
            </div>
          )}

          {tab === "products" && (
            products.length === 0 ? (
              <div style={{ padding: 64, textAlign: "center" }}>
                <p style={{ fontSize: 32, marginBottom: 14 }}>📦</p>
                <p style={{ fontSize: 15, fontWeight: 600, color: G.muted }}>No products yet</p>
                <p style={{ fontSize: 13, color: G.muted, marginTop: 6, opacity: 0.7 }}>Register your first product to get started.</p>
                <button className="btn-p" style={{ marginTop: 20 }} onClick={() => setTab("add")}>Register Product</button>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: G.surface }}>
                    {["Product", "Serial / Model", "Warranty", "Mfg. Date", "Status", ""].map(h => (
                      <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 11, fontWeight: 600, color: G.muted, textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => {
                    const sm = STATUS_META[p.current_status] || STATUS_META.CREATED;
                    return (
                      <tr key={p.product_id} className="prod-row">
                        <td style={{ padding: "16px 20px" }}>
                          <p style={{ fontWeight: 600, fontSize: 14, color: G.text }}>{p.product_name}</p>
                          {p.description && <p style={{ fontSize: 12, color: G.muted, marginTop: 3, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.description}</p>}
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <p className="mono" style={{ fontSize: 13, color: G.text }}>{p.serial_number}</p>
                          <p className="mono" style={{ fontSize: 11, color: G.muted, marginTop: 2 }}>{p.model_no}</p>
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <span style={{ fontSize: 13, color: G.muted }}>{p.warranty ? `${p.warranty} mo.` : "—"}</span>
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <span className="mono" style={{ fontSize: 12, color: G.muted }}>{p.manufacturing_date?.slice(0, 10) || "—"}</span>
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 999, background: sm.bg, color: sm.color, display: "inline-flex", alignItems: "center", gap: 6, letterSpacing: "0.04em" }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: sm.color }} />
                            {sm.label}
                          </span>
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <div className="acts">
                            <button className="btn-a" onClick={() => handlePassport(p.product_id)}>Passport</button>
                            <button className="btn-w" onClick={() => { setEditModal(p); setEditForm({ serial_number: p.serial_number, model_no: p.model_no, product_name: p.product_name, manufacturing_date: p.manufacturing_date?.slice(0,10)||"", warranty: p.warranty||"", description: p.description||"" }); }}>Edit</button>
                            <button className="btn-d" onClick={() => setDelModal(p)}>Delete</button>
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
          <p style={{ fontSize: 14, color: G.muted, lineHeight: 1.7, marginBottom: 24 }}>
            You are about to permanently delete{" "}
            <span style={{ color: G.text, fontWeight: 600 }}>{delModal.product_name}</span>.
            This action cannot be undone and will remove all associated records.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button className="btn-g btn-g-lg" onClick={() => setDelModal(null)}>Cancel</button>
            <button className="btn-d btn-d-lg" onClick={handleDelete} disabled={loading}>
              {loading ? "Deleting..." : "Delete permanently"}
            </button>
          </div>
        </Modal>
      )}

      {passport && <PassportModal passport={passport} onClose={() => setPassport(null)} />}
    </DashboardLayout>
  );
}