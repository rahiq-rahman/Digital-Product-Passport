import { useEffect, useState } from "react";
import DashboardLayout from "../shared/DashboardLayout";
import { addProduct, getMyProducts, sendToShowroom, updateProduct, deleteProduct } from "./manufacturer.api";
import { getPassport } from "../customer/customer.api";
import { getAllShowrooms } from "../showroom/showroom.api";

const emptyForm = {
  serial_number: "",
  model_no: "",
  product_name: "",
  manufacturing_date: "",
  warranty: "",
  description: "",
};

const STATUS_COLORS = {
  CREATED: { bg: "#e0f2fe", text: "#0369a1", dot: "#0284c7" },
  IN_SHOWROOM: { bg: "#fef9c3", text: "#854d0e", dot: "#ca8a04" },
  SOLD: { bg: "#dcfce7", text: "#166534", dot: "#16a34a" },
  IN_REPAIR: { bg: "#fce7f3", text: "#9d174d", dot: "#db2777" },
};

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #f1f5f9",
      borderRadius: 16,
      padding: "20px 24px",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      transition: "transform 0.18s, box-shadow 0.18s",
      cursor: "default",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.09)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; }}
    >
      <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontSize: 32, fontWeight: 700, color: accent || "#1e293b", lineHeight: 1 }}>{value}</span>
      {sub && <span style={{ fontSize: 12, color: "#64748b" }}>{sub}</span>}
    </div>
  );
}

function MiniBarChart({ products }) {
  const statuses = ["CREATED", "IN_SHOWROOM", "SOLD", "IN_REPAIR"];
  const counts = statuses.map(s => products.filter(p => p.current_status === s).length);
  const max = Math.max(...counts, 1);
  const colors = ["#3b82f6", "#f59e0b", "#22c55e", "#ec4899"];
  const labels = ["Created", "Showroom", "Sold", "In Repair"];

  return (
    <div style={{ background: "#fff", border: "1px solid #f1f5f9", borderRadius: 16, padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", marginBottom: 16 }}>Product status breakdown</p>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 80 }}>
        {counts.map((count, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: colors[i] }}>{count}</span>
            <div style={{
              width: "100%", background: "#f1f5f9", borderRadius: 6, height: 60, display: "flex", alignItems: "flex-end", overflow: "hidden"
            }}>
              <div style={{
                width: "100%",
                height: `${(count / max) * 100}%`,
                background: colors[i],
                borderRadius: 6,
                transition: "height 0.6s cubic-bezier(.4,0,.2,1)",
                minHeight: count > 0 ? 4 : 0,
              }} />
            </div>
            <span style={{ fontSize: 10, color: "#94a3b8", textAlign: "center" }}>{labels[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      backdropFilter: "blur(2px)",
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#fff", borderRadius: 20, width: "100%", maxWidth: 560,
        boxShadow: "0 24px 60px rgba(0,0,0,0.18)", overflow: "hidden",
        animation: "slideUp 0.22s cubic-bezier(.4,0,.2,1)",
      }}>
        <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }`}</style>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #f1f5f9" }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#1e293b" }}>{title}</span>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, border: "1px solid #e2e8f0",
            background: "#f8fafc", cursor: "pointer", fontSize: 18, color: "#64748b",
            display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1,
          }}>×</button>
        </div>
        <div style={{ padding: "24px" }}>{children}</div>
      </div>
    </div>
  );
}

function PassportModal({ passport, onClose }) {
  const p = passport?.product;
  return (
    <Modal title="Digital Product Passport" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, maxHeight: "60vh", overflowY: "auto" }}>
        <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Product info</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
            {[
              ["Name", p?.product_name],
              ["Serial", p?.serial_number],
              ["Model", p?.model_no],
              ["Warranty", p?.warranty ? `${p.warranty} months` : "—"],
              ["Manufactured", p?.manufacturing_date?.slice(0, 10)],
              ["Status", p?.current_status],
            ].map(([label, val]) => (
              <div key={label}>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>{label}</span>
                <p style={{ fontSize: 13, fontWeight: 500, color: "#1e293b", marginTop: 2 }}>{val || "—"}</p>
              </div>
            ))}
          </div>
          {p?.description && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>Description</span>
              <p style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>{p.description}</p>
            </div>
          )}
        </div>

        <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Ownership history</p>
          {passport?.ownership?.length === 0
            ? <p style={{ fontSize: 13, color: "#94a3b8" }}>No ownership records yet.</p>
            : passport?.ownership?.map((o, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#1e293b" }}>{o.name}</span>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>{o.transfer_date?.slice(0, 10)}</span>
              </div>
            ))}
        </div>

        <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Repair history</p>
          {passport?.repairs?.length === 0
            ? <p style={{ fontSize: 13, color: "#94a3b8" }}>No repairs recorded.</p>
            : passport?.repairs?.map((r, i) => (
              <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#1e293b" }}>{r.issue}</span>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>{r.created_at?.slice(0, 10)}</span>
                </div>
                <span style={{ fontSize: 12, color: "#64748b" }}>{r.repairshop_name} · {r.repair_type} · {r.repair_price} BDT</span>
              </div>
            ))}
        </div>

        <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Event timeline</p>
          {passport?.events?.length === 0
            ? <p style={{ fontSize: 13, color: "#94a3b8" }}>No events yet.</p>
            : passport?.events?.map((e, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "6px 0", borderBottom: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: 11, color: "#94a3b8", minWidth: 80 }}>{e.event_date?.slice(0, 10)}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#3b82f6" }}>{e.event_type}</span>
                <span style={{ fontSize: 12, color: "#475569" }}>{e.description}</span>
              </div>
            ))}
        </div>
      </div>
    </Modal>
  );
}

function ProductForm({ form, setForm, onSubmit, onCancel, submitLabel, loading }) {
  const inputStyle = {
    width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0",
    borderRadius: 10, fontSize: 14, color: "#1e293b", background: "#f8fafc",
    outline: "none", transition: "border 0.15s, box-shadow 0.15s",
    boxSizing: "border-box",
  };

  const handleFocus = e => {
    e.target.style.border = "1.5px solid #3b82f6";
    e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)";
    e.target.style.background = "#fff";
  };
  const handleBlur = e => {
    e.target.style.border = "1px solid #e2e8f0";
    e.target.style.boxShadow = "none";
    e.target.style.background = "#f8fafc";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: "#64748b", display: "block", marginBottom: 6 }}>Product name *</label>
          <input style={inputStyle} placeholder="e.g. Samsung Galaxy S24"
            value={form.product_name} onFocus={handleFocus} onBlur={handleBlur}
            onChange={e => setForm({ ...form, product_name: e.target.value })} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: "#64748b", display: "block", marginBottom: 6 }}>Serial number *</label>
          <input style={inputStyle} placeholder="e.g. SG24-001"
            value={form.serial_number} onFocus={handleFocus} onBlur={handleBlur}
            onChange={e => setForm({ ...form, serial_number: e.target.value })} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: "#64748b", display: "block", marginBottom: 6 }}>Model number *</label>
          <input style={inputStyle} placeholder="e.g. SM-S921"
            value={form.model_no} onFocus={handleFocus} onBlur={handleBlur}
            onChange={e => setForm({ ...form, model_no: e.target.value })} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: "#64748b", display: "block", marginBottom: 6 }}>Warranty (months)</label>
          <input style={inputStyle} type="number" placeholder="e.g. 24"
            value={form.warranty} onFocus={handleFocus} onBlur={handleBlur}
            onChange={e => setForm({ ...form, warranty: e.target.value })} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: "#64748b", display: "block", marginBottom: 6 }}>Manufacturing date</label>
          <input style={inputStyle} type="date"
            value={form.manufacturing_date} onFocus={handleFocus} onBlur={handleBlur}
            onChange={e => setForm({ ...form, manufacturing_date: e.target.value })} />
        </div>
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 500, color: "#64748b", display: "block", marginBottom: 6 }}>Description</label>
        <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 80, fontFamily: "inherit" }}
          placeholder="Product description, specs, features..."
          value={form.description} onFocus={handleFocus} onBlur={handleBlur}
          onChange={e => setForm({ ...form, description: e.target.value })} />
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
        {onCancel && (
          <button onClick={onCancel} style={{
            padding: "10px 20px", borderRadius: 10, border: "1px solid #e2e8f0",
            background: "#f8fafc", color: "#64748b", fontWeight: 500, cursor: "pointer", fontSize: 14,
          }}>Cancel</button>
        )}
        <button onClick={onSubmit} disabled={loading} style={{
          padding: "10px 24px", borderRadius: 10, border: "none",
          background: loading ? "#93c5fd" : "#3b82f6", color: "#fff",
          fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontSize: 14,
          transition: "background 0.15s, transform 0.1s",
        }}
          onMouseEnter={e => !loading && (e.target.style.background = "#2563eb")}
          onMouseLeave={e => !loading && (e.target.style.background = "#3b82f6")}
        >
          {loading ? "Saving..." : submitLabel}
        </button>
      </div>
    </div>
  );
}

export default function ManufacturerDashboard() {

  const [showrooms, setShowrooms] = useState([]);
  const [selectedShowroom, setSelectedShowroom] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");

  const [products, setProducts] = useState([]);
  const [tab, setTab] = useState("products");
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showroomId, setShowroomId] = useState("");
  const [assignProductId, setAssignProductId] = useState("");

  const [editModal, setEditModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [passportModal, setPassportModal] = useState(null);
  const [passportData, setPassportData] = useState(null);

  const [editForm, setEditForm] = useState(emptyForm);

  useEffect(() => {
    loadProducts();
    getAllShowrooms().then(res => setShowrooms(res.data)).catch(() => {});
  }, []);

  const loadProducts = async () => {
    try {
      const res = await getMyProducts();
      setProducts(res.data);
    } catch { }
  };


  const notify = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3500);
  };

  const handleAdd = async () => {
    if (!form.product_name || !form.serial_number || !form.model_no) {
      notify("Please fill in name, serial number and model number.", "error");
      return;
    }
    setLoading(true);
    try {
      await addProduct(form);
      setForm(emptyForm);
      notify("Product created successfully!");
      loadProducts();
      setTab("products");
    } catch (err) {
      notify(err.response?.data?.error || "Error creating product", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    setLoading(true);
    try {
      await updateProduct(editModal.product_id, editForm);
      notify("Product updated successfully!");
      setEditModal(null);
      loadProducts();
    } catch (err) {
      notify(err.response?.data?.error || "Error updating product", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteProduct(deleteModal.product_id);
      notify("Product deleted.");
      setDeleteModal(null);
      loadProducts();
    } catch (err) {
      notify(err.response?.data?.error || "Error deleting product", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleViewPassport = async (product_id) => {
    try {
      const res = await getPassport(product_id);
      setPassportData(res.data);
      setPassportModal(true);
    } catch (err) {
      notify(err.response?.data?.error || "Could not load passport", "error");
    }
  };

const handleSendToShowroom = async () => {
  if (!selectedProductId || !selectedShowroom) {
    notify("Please select both a product and a showroom.", "error");
    return;
  }
  try {
    await sendToShowroom({
      product_id: selectedProductId,
      showroom_id: selectedShowroom,
    });
    notify("Product sent to showroom!");
    setSelectedProductId("");
    setSelectedShowroom("");
    loadProducts();
  } catch (err) {
    notify(err.response?.data?.error || "Error sending to showroom", "error");
  }
};

  const totalProducts = products.length;
  const soldProducts = products.filter(p => p.current_status === "SOLD").length;
  const inShowroom = products.filter(p => p.current_status === "IN_SHOWROOM").length;
  const inRepair = products.filter(p => p.current_status === "IN_REPAIR").length;

  const tabStyle = (active) => ({
    padding: "10px 22px", borderRadius: 10, fontWeight: 600, fontSize: 14,
    cursor: "pointer", border: "none", transition: "all 0.15s",
    background: active ? "#3b82f6" : "transparent",
    color: active ? "#fff" : "#64748b",
  });

  return (
    <DashboardLayout title="Manufacturer Dashboard">
      <style>{`
        .product-row { transition: background 0.15s, box-shadow 0.15s; }
        .product-row:hover { background: #f8fafc !important; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .action-btn { opacity: 0; transition: opacity 0.15s; }
        .product-row:hover .action-btn { opacity: 1; }
      `}</style>

      {/* Toast notification */}
      {message.text && (
        <div style={{
          position: "fixed", top: 24, right: 24, zIndex: 2000,
          background: message.type === "error" ? "#fef2f2" : "#f0fdf4",
          border: `1px solid ${message.type === "error" ? "#fecaca" : "#bbf7d0"}`,
          color: message.type === "error" ? "#dc2626" : "#16a34a",
          padding: "12px 20px", borderRadius: 12, fontSize: 14, fontWeight: 500,
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
          animation: "slideUp 0.2s ease",
        }}>
          {message.text}
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard label="Total products" value={totalProducts} sub="All time" accent="#1e293b" />
        <StatCard label="In showroom" value={inShowroom} sub="Available for sale" accent="#d97706" />
        <StatCard label="Sold" value={soldProducts} sub="Transferred to customers" accent="#16a34a" />
        <StatCard label="In repair" value={inRepair} sub="Currently being repaired" accent="#db2777" />
      </div>

      {/* Chart */}
      <div style={{ marginBottom: 24 }}>
        <MiniBarChart products={products} />
      </div>

      {/* Send to showroom */}
      <div style={{
  background: "#fff", border: "1px solid #f1f5f9", borderRadius: 16,
  padding: "20px 24px", marginBottom: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
}}>
  <p style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", marginBottom: 14 }}>
    Send product to showroom
  </p>
  <div style={{ display: "flex", gap: 12 }}>

    {/* Product dropdown */}
    <select
      style={{
        flex: 1, padding: "10px 14px", border: "1px solid #e2e8f0",
        borderRadius: 10, fontSize: 14, color: selectedProductId ? "#1e293b" : "#94a3b8",
        background: "#f8fafc", outline: "none", cursor: "pointer",
      }}
      value={selectedProductId}
      onChange={e => setSelectedProductId(e.target.value)}
    >
      <option value="">Select a product...</option>
      {products
        .filter(p => p.current_status === "CREATED")
        .map(p => (
          <option key={p.product_id} value={p.product_id}>
            {p.product_name} — {p.serial_number}
          </option>
        ))}
    </select>

    {/* Showroom dropdown */}
    <select
      style={{
        flex: 1, padding: "10px 14px", border: "1px solid #e2e8f0",
        borderRadius: 10, fontSize: 14, color: selectedShowroom ? "#1e293b" : "#94a3b8",
        background: "#f8fafc", outline: "none", cursor: "pointer",
      }}
      value={selectedShowroom}
      onChange={e => setSelectedShowroom(e.target.value)}
    >
      <option value="">Select a showroom...</option>
      {showrooms.map(s => (
        <option key={s.user_id} value={s.user_id}>
          {s.showroom_name} — {s.location}
        </option>
      ))}
    </select>

    <button
      onClick={handleSendToShowroom}
      style={{
        padding: "10px 24px", borderRadius: 10, border: "none",
        background: "#f59e0b", color: "#fff", fontWeight: 600,
        cursor: "pointer", fontSize: 14, transition: "background 0.15s",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={e => e.target.style.background = "#d97706"}
      onMouseLeave={e => e.target.style.background = "#f59e0b"}
    >
      Send
    </button>
  </div>
</div>

      {/* Tabs */}
      <div style={{ background: "#fff", border: "1px solid #f1f5f9", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 8, padding: "16px 20px", borderBottom: "1px solid #f1f5f9", background: "#fafafa" }}>
          <button style={tabStyle(tab === "products")} onClick={() => setTab("products")}>
            My Products ({totalProducts})
          </button>
          <button style={tabStyle(tab === "add")} onClick={() => setTab("add")}>
            + Add Product
          </button>
        </div>

        {/* Add Product Tab */}
        {tab === "add" && (
          <div style={{ padding: 24 }}>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>Fill in the details below to register a new product in the system.</p>
            <ProductForm
              form={form}
              setForm={setForm}
              onSubmit={handleAdd}
              submitLabel="Create Product"
              loading={loading}
            />
          </div>
        )}

        {/* Products Tab */}
        {tab === "products" && (
          <div>
            {products.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center", color: "#94a3b8" }}>
                <p style={{ fontSize: 15, fontWeight: 500 }}>No products yet</p>
                <p style={{ fontSize: 13, marginTop: 4 }}>Click "Add Product" to register your first product.</p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Product", "Serial / Model", "Warranty", "Status", "Actions"].map(h => (
                      <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const sc = STATUS_COLORS[p.current_status] || STATUS_COLORS.CREATED;
                    return (
                      <tr key={p.product_id} className="product-row" style={{ borderTop: "1px solid #f1f5f9", background: "#fff" }}>
                        <td style={{ padding: "14px 20px" }}>
                          <p style={{ fontWeight: 600, fontSize: 14, color: "#1e293b" }}>{p.product_name}</p>
                          {p.description && <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.description}</p>}
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <p style={{ fontSize: 13, color: "#475569" }}>{p.serial_number}</p>
                          <p style={{ fontSize: 12, color: "#94a3b8" }}>{p.model_no}</p>
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <span style={{ fontSize: 13, color: "#475569" }}>{p.warranty ? `${p.warranty} mo.` : "—"}</span>
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 999,
                            background: sc.bg, color: sc.text, display: "inline-flex", alignItems: "center", gap: 5,
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc.dot, display: "inline-block" }} />
                            {p.current_status?.replace("_", " ")}
                          </span>
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button className="action-btn" onClick={() => handleViewPassport(p.product_id)} style={{
                              padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0",
                              background: "#f8fafc", color: "#3b82f6", fontSize: 12, fontWeight: 600, cursor: "pointer",
                            }}>Passport</button>
                            <button className="action-btn" onClick={() => { setEditModal(p); setEditForm({ serial_number: p.serial_number, model_no: p.model_no, product_name: p.product_name, manufacturing_date: p.manufacturing_date?.slice(0, 10) || "", warranty: p.warranty || "", description: p.description || "" }); }} style={{
                              padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0",
                              background: "#f8fafc", color: "#f59e0b", fontSize: 12, fontWeight: 600, cursor: "pointer",
                            }}>Edit</button>
                            <button className="action-btn" onClick={() => setDeleteModal(p)} style={{
                              padding: "6px 12px", borderRadius: 8, border: "1px solid #fee2e2",
                              background: "#fef2f2", color: "#dc2626", fontSize: 12, fontWeight: 600, cursor: "pointer",
                            }}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModal && (
        <Modal title={`Edit — ${editModal.product_name}`} onClose={() => setEditModal(null)}>
          <ProductForm
            form={editForm}
            setForm={setEditForm}
            onSubmit={handleEdit}
            onCancel={() => setEditModal(null)}
            submitLabel="Save Changes"
            loading={loading}
          />
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {deleteModal && (
        <Modal title="Delete product?" onClose={() => setDeleteModal(null)}>
          <p style={{ fontSize: 14, color: "#475569", marginBottom: 20 }}>
            Are you sure you want to delete <strong>{deleteModal.product_name}</strong>? This action cannot be undone.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setDeleteModal(null)} style={{
              padding: "10px 20px", borderRadius: 10, border: "1px solid #e2e8f0",
              background: "#f8fafc", color: "#64748b", fontWeight: 500, cursor: "pointer", fontSize: 14,
            }}>Cancel</button>
            <button onClick={handleDelete} disabled={loading} style={{
              padding: "10px 24px", borderRadius: 10, border: "none",
              background: "#dc2626", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14,
            }}>Delete</button>
          </div>
        </Modal>
      )}

      {/* Passport Modal */}
      {passportModal && passportData && (
        <PassportModal passport={passportData} onClose={() => { setPassportModal(false); setPassportData(null); }} />
      )}
    </DashboardLayout>
  );
}