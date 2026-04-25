import { useState, useRef } from "react";
import DashboardLayout from "../shared/DashboardLayout";
import { addProduct } from "./manufacturer.api";

// ── Helpers ──────────────────────────────────────────────────────────────────
const emptyForm = {
  product_name: "",
  serial_number: "",
  model_no: "",
  manufacturing_date: "",
  warranty: "",
  description: "",
};

const CSV_HEADERS = ["product_name", "serial_number", "model_no", "manufacturing_date", "warranty", "description"];

function parseCSV(text) {
  const lines = text.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return { rows: [], error: "CSV must have a header row and at least one data row." };

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const missing = CSV_HEADERS.filter((h) => h !== "description" && !headers.includes(h));
  if (missing.length) return { rows: [], error: `Missing required columns: ${missing.join(", ")}` };

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = vals[idx] || ""; });
    rows.push(obj);
  }
  return { rows, error: null };
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast.text) return null;
  return (
    <div className={`toast ${toast.type === "error" ? "toast-err" : "toast-ok"}`}>
      {toast.text}
    </div>
  );
}

function TabBar({ tab, setTab }) {
  return (
    <div className="tabs">
      {[
        { id: "single", label: "Single Product" },
        { id: "bulk",   label: "Bulk Register" },
      ].map((t) => (
        <button
          key={t.id}
          className={`tab-btn ${tab === t.id ? "tab-on" : "tab-off"}`}
          onClick={() => setTab(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Single Register Form ──────────────────────────────────────────────────────
function SingleRegisterForm({ onSuccess }) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.product_name || !form.serial_number || !form.model_no || !form.manufacturing_date) {
      setError("Fill in all required fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await addProduct(form);
      onSuccess(res.data, "single");
      setForm(emptyForm);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to register product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      {error && (
        <div
          style={{
            fontSize: 13,
            color: "var(--red)",
            background: "var(--red-bg)",
            border: "1px solid var(--red-border)",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 18,
          }}
        >
          {error}
        </div>
      )}

      <div className="grid-2" style={{ gap: 16 }}>
        <div style={{ gridColumn: "span 2" }}>
          <label className="lbl">Product name *</label>
          <input
            className="inp"
            placeholder="e.g. Samsung Galaxy S24"
            value={form.product_name}
            onChange={(e) => set("product_name", e.target.value)}
          />
        </div>

        <div>
          <label className="lbl">Serial number *</label>
          <input
            className="inp mono"
            placeholder="e.g. SN-2024-001"
            value={form.serial_number}
            onChange={(e) => set("serial_number", e.target.value)}
          />
        </div>

        <div>
          <label className="lbl">Model number *</label>
          <input
            className="inp mono"
            placeholder="e.g. SM-S921B"
            value={form.model_no}
            onChange={(e) => set("model_no", e.target.value)}
          />
        </div>

        <div>
          <label className="lbl">Manufacturing date *</label>
          <input
            className="inp"
            type="date"
            value={form.manufacturing_date}
            onChange={(e) => set("manufacturing_date", e.target.value)}
          />
        </div>

        <div>
          <label className="lbl">Warranty (months)</label>
          <input
            className="inp"
            type="number"
            placeholder="e.g. 12"
            value={form.warranty}
            onChange={(e) => set("warranty", e.target.value)}
          />
        </div>

        <div style={{ gridColumn: "span 2" }}>
          <label className="lbl">Description</label>
          <textarea
            className="inp"
            placeholder="Optional product description..."
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>
      </div>

      <div className="form-actions" style={{ marginTop: 20 }}>
        <button
          className="btn btn-outline"
          onClick={() => { setForm(emptyForm); setError(""); }}
        >
          Clear
        </button>
        <button
          className="btn btn-dark"
          onClick={handleSubmit}
          disabled={loading}
          style={{ padding: "10px 28px" }}
        >
          {loading ? "Registering..." : "Register Product"}
        </button>
      </div>
    </div>
  );
}

// ── Bulk Register Form ────────────────────────────────────────────────────────
function BulkRegisterForm({ onSuccess }) {
  const [rows, setRows] = useState([]);
  const [parseError, setParseError] = useState("");
  const [results, setResults] = useState([]); // { row, status, error }
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setParseError("");
    setResults([]);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const { rows: parsed, error } = parseCSV(ev.target.result);
      if (error) { setParseError(error); setRows([]); }
      else setRows(parsed);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) {
      setFileName(file.name);
      setParseError("");
      setResults([]);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const { rows: parsed, error } = parseCSV(ev.target.result);
        if (error) { setParseError(error); setRows([]); }
        else setRows(parsed);
      };
      reader.readAsText(file);
    }
  };

  const downloadTemplate = () => {
    const header = CSV_HEADERS.join(",");
    const example = "Samsung Galaxy S24,SN-2024-001,SM-S921B,2024-01-15,12,Optional description";
    const blob = new Blob([header + "\n" + example], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "products_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkSubmit = async () => {
    if (!rows.length) return;
    setLoading(true);
    setResults([]);
    const res = [];
    for (const row of rows) {
      try {
        const data = await addProduct(row);
        res.push({ row, status: "ok", product: data.data });
      } catch (err) {
        res.push({ row, status: "error", error: err.response?.data?.error || "Failed" });
      }
    }
    setResults(res);
    setLoading(false);
    const successCount = res.filter((r) => r.status === "ok").length;
    if (successCount > 0) onSuccess(null, "bulk", successCount);
  };

  const successCount = results.filter((r) => r.status === "ok").length;
  const errorCount   = results.filter((r) => r.status === "error").length;

  return (
    <div style={{ padding: "24px" }}>
      {/* Template download */}
      <div
        style={{
          background: "var(--blue-bg)",
          border: "1px solid var(--blue-border)",
          borderRadius: 10,
          padding: "14px 18px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <div className="fs-13 fw-600 text-1">CSV Template</div>
          <div className="fs-12 text-4 mt-4">
            Download the template with required columns, fill it in, then upload.
          </div>
        </div>
        <button className="btn btn-blue btn-sm" onClick={downloadTemplate} style={{ flexShrink: 0, padding: "7px 14px", fontSize: 12 }}>
          ↓ Template
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current.click()}
        style={{
          border: "2px dashed var(--border-2)",
          borderRadius: 12,
          padding: "36px 24px",
          textAlign: "center",
          cursor: "pointer",
          background: "#fafaf8",
          transition: "border-color 0.15s, background 0.15s",
          marginBottom: 18,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--blue)"; e.currentTarget.style.background = "var(--blue-bg)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-2)"; e.currentTarget.style.background = "#fafaf8"; }}
      >
        <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleFile} />
        <svg width="32" height="32" fill="none" stroke="var(--text-4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ margin: "0 auto 10px", display: "block" }}>
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
        </svg>
        {fileName ? (
          <div>
            <div className="fs-14 fw-600 text-1">{fileName}</div>
            <div className="fs-12 text-4 mt-4">{rows.length} product{rows.length !== 1 ? "s" : ""} parsed</div>
          </div>
        ) : (
          <div>
            <div className="fs-14 fw-600 text-2">Drop CSV here or click to browse</div>
            <div className="fs-12 text-4 mt-4">Only .csv files supported</div>
          </div>
        )}
      </div>

      {parseError && (
        <div style={{ fontSize: 13, color: "var(--red)", background: "var(--red-bg)", border: "1px solid var(--red-border)", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
          {parseError}
        </div>
      )}

      {/* Preview table */}
      {rows.length > 0 && !results.length && (
        <div style={{ marginBottom: 18 }}>
          <div className="fs-12 fw-600 text-4 mb-8" style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Preview — {rows.length} product{rows.length !== 1 ? "s" : ""}
          </div>
          <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table className="tbl" style={{ minWidth: 560 }}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Serial</th>
                    <th>Model</th>
                    <th>Mfg. Date</th>
                    <th>Warranty</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 8).map((r, i) => (
                    <tr key={i} className="tbl-row">
                      <td><span className="mono fs-12 text-4">{i + 1}</span></td>
                      <td><span className="fs-13 fw-500 text-1">{r.product_name}</span></td>
                      <td><span className="mono fs-12 text-2">{r.serial_number}</span></td>
                      <td><span className="mono fs-12 text-2">{r.model_no}</span></td>
                      <td><span className="fs-12 text-3">{r.manufacturing_date}</span></td>
                      <td><span className="fs-12 text-3">{r.warranty ? `${r.warranty} mo.` : "—"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 8 && (
              <div style={{ padding: "10px 20px", background: "#fafaf8", borderTop: "1px solid var(--border)", fontSize: 12, color: "var(--text-4)" }}>
                … and {rows.length - 8} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            {successCount > 0 && (
              <span className="badge" style={{ color: "var(--green)", background: "var(--green-bg)" }}>
                <span className="badge-dot" style={{ background: "var(--green)" }} />
                {successCount} registered
              </span>
            )}
            {errorCount > 0 && (
              <span className="badge" style={{ color: "var(--red)", background: "var(--red-bg)" }}>
                <span className="badge-dot" style={{ background: "var(--red)" }} />
                {errorCount} failed
              </span>
            )}
          </div>
          <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", maxHeight: 280, overflowY: "auto" }}>
            {results.map((r, i) => (
              <div
                key={i}
                style={{
                  padding: "11px 16px",
                  borderBottom: i < results.length - 1 ? "1px solid #f0efe9" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: r.status === "error" ? "var(--red-bg)" : "#fff",
                }}
              >
                <span style={{ fontSize: 14 }}>{r.status === "ok" ? "✓" : "✗"}</span>
                <span className="fs-13 text-1 fw-500" style={{ flex: 1 }}>{r.row.product_name}</span>
                <span className="mono fs-11 text-4">{r.row.serial_number}</span>
                {r.status === "error" && <span className="fs-12" style={{ color: "var(--red)" }}>{r.error}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="form-actions" style={{ marginTop: 4 }}>
        <button
          className="btn btn-outline"
          onClick={() => { setRows([]); setResults([]); setParseError(""); setFileName(""); if (fileRef.current) fileRef.current.value = ""; }}
        >
          Clear
        </button>
        <button
          className="btn btn-dark"
          onClick={handleBulkSubmit}
          disabled={!rows.length || loading}
          style={{ padding: "10px 28px" }}
        >
          {loading ? `Registering ${rows.length}…` : `Register ${rows.length} Product${rows.length !== 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RegisterProduct() {
  const [tab, setTab] = useState("single");
  const [toast, setToast] = useState({ text: "", type: "" });
  const [recentProducts, setRecentProducts] = useState([]);

  const notify = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: "", type: "" }), 3500);
  };

  const handleSuccess = (product, mode, count) => {
    if (mode === "single" && product) {
      notify(`"${product.product_name}" registered successfully!`);
      setRecentProducts((prev) => [product, ...prev].slice(0, 5));
    } else if (mode === "bulk") {
      notify(`${count} product${count !== 1 ? "s" : ""} registered successfully!`);
    }
  };

  return (
    <DashboardLayout title="Register Products">
      <Toast toast={toast} />
      <div className="page">
        <div className="mb-28">
          <div className="page-title">Register Products</div>
          <div className="page-sub">Add a single product or upload a CSV to register in bulk.</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>
          {/* Left: form card */}
          <div className="card" style={{ overflow: "hidden" }}>
            <TabBar tab={tab} setTab={setTab} />
            {tab === "single" ? (
              <SingleRegisterForm onSuccess={handleSuccess} />
            ) : (
              <BulkRegisterForm onSuccess={handleSuccess} />
            )}
          </div>

          {/* Right: recent + tips */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Tips */}
            <div className="card card-p">
              <div className="fs-12 fw-600 text-4 mb-12" style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {tab === "single" ? "Tips" : "CSV Format"}
              </div>
              {tab === "single" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    ["Serial number", "Must be unique across all products."],
                    ["Model number", "Internal model code used for identification."],
                    ["Warranty", "Enter months (e.g. 12 for 1 year)."],
                  ].map(([k, v]) => (
                    <div key={k} style={{ borderLeft: "2px solid var(--border)", paddingLeft: 12 }}>
                      <div className="fs-12 fw-600 text-2">{k}</div>
                      <div className="fs-12 text-4 mt-4">{v}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {CSV_HEADERS.map((h) => (
                    <div key={h} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="mono fs-11" style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 5, padding: "2px 7px", color: "var(--blue)" }}>
                        {h}
                      </span>
                      {!["description"].includes(h) && (
                        <span className="fs-11" style={{ color: "var(--red)" }}>required</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent registrations */}
            {recentProducts.length > 0 && (
              <div className="card" style={{ overflow: "hidden" }}>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", background: "#fafaf8" }}>
                  <div className="fs-13 fw-600 text-1">Recent registrations</div>
                </div>
                {recentProducts.map((p, i) => (
                  <div
                    key={i}
                    style={{ padding: "12px 18px", borderBottom: i < recentProducts.length - 1 ? "1px solid #f0efe9" : "none" }}
                  >
                    <div className="fs-13 fw-600 text-1">{p.product_name}</div>
                    <div className="row gap-8 mt-4">
                      <span className="mono fs-11 text-4">{p.serial_number}</span>
                      <span style={{ color: "var(--border-2)" }}>·</span>
                      <span className="mono fs-11 text-4">{p.model_no}</span>
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