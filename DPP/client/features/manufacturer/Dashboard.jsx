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

const STATUS = {
  CREATED:     { label: "Created",   color: "var(--blue)",  bg: "var(--blue-bg)",   dot: "var(--blue)"  },
  IN_SHOWROOM: { label: "Showroom",  color: "var(--amber)", bg: "var(--amber-bg)",  dot: "var(--amber)" },
  SOLD:        { label: "Sold",      color: "var(--green)", bg: "var(--green-bg)",  dot: "var(--green)" },
  IN_REPAIR:   { label: "In Repair", color: "var(--red)",   bg: "var(--red-bg)",    dot: "var(--red)"   },
};

function Toast({ toast }) {
  if (!toast.text) return null;
  return <div className={`toast ${toast.type === "error" ? "toast-err" : "toast-ok"}`}>{toast.text}</div>;
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
  const s = STATUS[status] || STATUS.CREATED;
  return (
    <span className="badge" style={{ color: s.color, background: s.bg }}>
      <span className="badge-dot" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
}

function ProductForm({ form, setForm, onSubmit, onCancel, label, loading }) {
  const fields = [
    { lbl: "Product name *",    key: "product_name",       ph: "e.g. Samsung Galaxy S24",  mono: false },
    { lbl: "Serial number *",   key: "serial_number",      ph: "e.g. SG24-001",             mono: true  },
    { lbl: "Model number *",    key: "model_no",           ph: "e.g. SM-S921",              mono: true  },
    { lbl: "Warranty (months)", key: "warranty",           ph: "e.g. 24", type: "number",  mono: false },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="grid-2">
        {fields.map(f => (
          <div key={f.key}>
            <label className="lbl">{f.lbl}</label>
            <input className={`inp${f.mono ? " mono" : ""}`} placeholder={f.ph} type={f.type || "text"}
              value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
          </div>
        ))}
        <div className="col-2">
          <label className="lbl">Manufacturing date</label>
          <input className="inp" type="date" value={form.manufacturing_date}
            onChange={e => setForm({ ...form, manufacturing_date: e.target.value })} />
        </div>
        <div className="col-2">
          <label className="lbl">Description</label>
          <textarea className="inp" placeholder="Specifications, features, notes..."
            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>
      </div>
      <div className="form-actions">
        {onCancel && <button className="btn btn-outline" onClick={onCancel}>Cancel</button>}
        <button className="btn btn-dark" onClick={onSubmit} disabled={loading}>
          {loading ? "Saving..." : label}
        </button>
      </div>
    </div>
  );
}

function PassportModal({ passport, onClose }) {
  const p  = passport?.product;
  const sm = STATUS[p?.current_status] || STATUS.CREATED;
  return (
    <Modal title="Digital Product Passport" subtitle={p?.product_name} onClose={onClose} wide>
      <div className="scroll">
        <div className="psec mb-10">
          <div className="sec-lbl">Product info</div>
          <div className="grid-2" style={{ gap: "10px 24px" }}>
            {[["Name", p?.product_name, false], ["Serial", p?.serial_number, true],
              ["Model", p?.model_no, true], ["Warranty", p?.warranty ? `${p.warranty} mo.` : "—", false],
              ["Mfg. date", p?.manufacturing_date?.slice(0, 10) || "—", true]
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
                <span className="fs-13 fw-500 text-1">{o.name}</span>
                <span className="mono fs-12 text-4">{o.transfer_date?.slice(0, 10)}</span>
              </div>
            )},
          { title: "Repair history", rows: passport?.repairs, empty: "No repairs recorded.",
            render: (r, i) => (
              <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <div className="between mb-4">
                  <span className="fs-13 fw-500 text-1">{r.issue}</span>
                  <span className="mono fs-12 text-4">{r.repair_date?.slice(0, 10) || "—"}</span>
                </div>
                <span className="fs-12 text-3">{r.repairshop_name} · {r.repair_type} · {r.repair_price} BDT</span>
              </div>
            )},
          { title: "Event timeline", rows: passport?.events, empty: "No events yet.",
            render: (e, i) => (
              <div key={i} className="row gap-12" style={{ padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
                <span className="mono fs-11 text-4" style={{ minWidth: 82 }}>{e.event_date?.slice(0, 10)}</span>
                <span className="fs-11 fw-600" style={{ color: "var(--blue)", minWidth: 116, letterSpacing: "0.03em" }}>{e.event_type}</span>
                <span className="fs-13 text-3">{e.description}</span>
              </div>
            )},
        ].map(sec => (
          <div key={sec.title} className="psec">
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
    try { await sendToShowroom({ product_id: selProd, showroom_id: selShow }); notify("Dispatched!"); setSelProd(""); setSelShow(""); load(); }
    catch (err) { notify(err.response?.data?.error || "Error dispatching", "error"); }
  };

  const handlePassport = async (pid) => {
    try { const r = await getPassport(pid); setPassport(r.data); }
    catch (err) { notify(err.response?.data?.error || "Could not load passport", "error"); }
  };

  const total  = products.length;
  const inShow = products.filter(p => p.current_status === "IN_SHOWROOM").length;
  const sold   = products.filter(p => p.current_status === "SOLD").length;
  const inRep  = products.filter(p => p.current_status === "IN_REPAIR").length;

  return (
    <DashboardLayout title="Overview">
      <Toast toast={toast} />
      <div className="page">

        {/* Header */}
        <div className="mb-28">
          <div className="page-title">Product Management</div>
          <div className="page-sub">Register, track and dispatch products through the supply chain.</div>
        </div>

        {/* Stats */}
        <div className="grid-4 mb-20">
          <StatCard label="Total products" value={total}  color="var(--blue)"  pct={100} />
          <StatCard label="In showroom"    value={inShow} color="var(--amber)" pct={total ? (inShow/total)*100 : 0} />
          <StatCard label="Sold"           value={sold}   color="var(--green)" pct={total ? (sold/total)*100 : 0} />
          <StatCard label="In repair"      value={inRep}  color="var(--red)"   pct={total ? (inRep/total)*100 : 0} />
        </div>

        {/* Dispatch panel */}
        <div className="panel mb-20">
          <div className="row gap-12 mb-16">
            <div className="panel-icon" style={{ background: "var(--blue-bg)" }}>
              <svg width="16" height="16" fill="none" stroke="var(--blue)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
            <div>
              <div className="fs-14 fw-600 text-1">Dispatch to showroom</div>
              <div className="fs-12 text-4 mt-4">Only products with status "Created" are available.</div>
            </div>
          </div>
          <div className="row gap-10">
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
            <button className="btn btn-dark" onClick={handleSend}>Dispatch</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="tabs">
            <button className={`tab-btn ${tab === "products" ? "tab-on" : "tab-off"}`} onClick={() => setTab("products")}>
              All Products ({total})
            </button>
            <button className={`tab-btn ${tab === "add" ? "tab-on" : "tab-off"}`} onClick={() => setTab("add")}>
              + Register Product
            </button>
          </div>

          {tab === "add" && (
            <div style={{ padding: 26 }}>
              <div className="fs-13 text-3 mb-20" style={{ lineHeight: 1.6 }}>
                Register a new product into the Digital Product Passport system. Fields marked * are required.
              </div>
              <ProductForm form={form} setForm={setForm} onSubmit={handleAdd} label="Register Product" loading={loading} />
            </div>
          )}

          {tab === "products" && (
            products.length === 0 ? (
              <div className="empty">
                <div className="empty-icon" style={{ background: "var(--blue-bg)" }}>
                  <svg width="22" height="22" fill="none" stroke="var(--blue)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
                  </svg>
                </div>
                <div className="empty-title">No products yet</div>
                <div className="empty-sub">Register your first product to get started.</div>
                <button className="btn btn-dark mt-18" onClick={() => setTab("add")}>Register Product</button>
              </div>
            ) : (
              <table className="tbl">
                <thead>
                  <tr>
                    {["Product", "Serial / Model", "Warranty", "Mfg. Date", "Status", ""].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.product_id} className="tbl-row">
                      <td>
                        <div className="fs-14 fw-600 text-1">{p.product_name}</div>
                        {p.description && (
                          <div className="fs-12 text-4 mt-4" style={{ maxWidth: 210, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {p.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="mono fs-13 text-2">{p.serial_number}</div>
                        <div className="mono fs-11 text-4 mt-4">{p.model_no}</div>
                      </td>
                      <td><span className="fs-13 text-3">{p.warranty ? `${p.warranty} mo.` : "—"}</span></td>
                      <td><span className="mono fs-12 text-4">{p.manufacturing_date?.slice(0, 10) || "—"}</span></td>
                      <td><StatusBadge status={p.current_status} /></td>
                      <td>
                        <div className="acts">
                          <button className="btn btn-sm btn-blue" onClick={() => handlePassport(p.product_id)}>Passport</button>
                          <button className="btn btn-sm btn-amber" onClick={() => {
                            setEditModal(p);
                            setEditForm({ serial_number: p.serial_number, model_no: p.model_no, product_name: p.product_name, manufacturing_date: p.manufacturing_date?.slice(0,10)||"", warranty: p.warranty||"", description: p.description||"" });
                          }}>Edit</button>
                          <button className="btn btn-sm btn-red" onClick={() => setDelModal(p)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>

      {/* Edit modal */}
      {editModal && (
        <Modal title="Edit Product" subtitle={editModal.product_name} onClose={() => setEditModal(null)}>
          <ProductForm form={editForm} setForm={setEditForm} onSubmit={handleEdit} onCancel={() => setEditModal(null)} label="Save Changes" loading={loading} />
        </Modal>
      )}

      {/* Delete modal */}
      {delModal && (
        <Modal title="Delete product?" onClose={() => setDelModal(null)}>
          <div className="fs-14 text-3 mb-24" style={{ lineHeight: 1.7 }}>
            You are about to permanently delete{" "}
            <span className="fw-600 text-1">{delModal.product_name}</span>.
            This action cannot be undone.
          </div>
          <div className="form-actions">
            <button className="btn btn-outline" onClick={() => setDelModal(null)}>Cancel</button>
            <button className="btn btn-red" style={{ padding: "10px 22px", fontSize: 14 }} onClick={handleDelete} disabled={loading}>
              {loading ? "Deleting..." : "Delete permanently"}
            </button>
          </div>
        </Modal>
      )}

      {passport && <PassportModal passport={passport} onClose={() => setPassport(null)} />}
    </DashboardLayout>
  );
}