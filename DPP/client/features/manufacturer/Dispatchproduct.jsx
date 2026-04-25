import { useEffect, useState, useRef } from "react";
import DashboardLayout from "../shared/DashboardLayout";
import { sendToShowroom, getAllShowrooms, getMyProducts } from "./manufacturer.api";

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseCSV(text, products, showrooms) {
  const lines = text.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return { rows: [], error: "CSV must have a header row and at least one data row." };

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const required = ["product_id", "showroom_id"];
  const missing = required.filter((h) => !headers.includes(h));
  if (missing.length) return { rows: [], error: `Missing required columns: ${missing.join(", ")}` };

  const productIds = new Set(products.map((p) => String(p.product_id)));
  const showroomIds = new Set(showrooms.map((s) => String(s.user_id)));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = vals[idx] || ""; });

    const pid = obj.product_id;
    const sid = obj.showroom_id;
    const product  = products.find((p) => String(p.product_id) === pid);
    const showroom = showrooms.find((s) => String(s.user_id) === sid);

    obj._productName  = product?.product_name  || `Unknown (${pid})`;
    obj._showroomName = showroom?.showroom_name || `Unknown (${sid})`;
    obj._validProduct  = productIds.has(pid);
    obj._validShowroom = showroomIds.has(sid);

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
        { id: "single", label: "Single Dispatch" },
        { id: "bulk",   label: "Bulk Dispatch" },
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

// ── Single Dispatch Form ──────────────────────────────────────────────────────
function SingleDispatchForm({ products, showrooms, onSuccess }) {
  const [productId, setProductId]   = useState("");
  const [showroomId, setShowroomId] = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  const availableProducts = products.filter((p) => p.current_status === "CREATED");
  const selectedProduct   = products.find((p) => String(p.product_id) === productId);
  const selectedShowroom  = showrooms.find((s) => String(s.user_id) === showroomId);

  const handleSubmit = async () => {
    if (!productId || !showroomId) { setError("Select a product and a showroom."); return; }
    setError(""); setLoading(true);
    try {
      await sendToShowroom({ product_id: productId, showroom_id: showroomId });
      onSuccess(selectedProduct, selectedShowroom, "single");
      setProductId(""); setShowroomId("");
    } catch (err) {
      setError(err.response?.data?.error || "Dispatch failed.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: "24px" }}>
      {error && (
        <div style={{ fontSize: 13, color: "var(--red)", background: "var(--red-bg)", border: "1px solid var(--red-border)", borderRadius: 8, padding: "10px 14px", marginBottom: 18 }}>
          {error}
        </div>
      )}

      {availableProducts.length === 0 ? (
        <div className="empty" style={{ padding: "40px 0" }}>
          <div className="empty-title">No dispatchable products</div>
          <div className="empty-sub">Only products with "CREATED" status can be dispatched.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Product selector */}
          <div>
            <label className="lbl">Select product *</label>
            <select className="inp" value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">Choose a product…</option>
              {availableProducts.map((p) => (
                <option key={p.product_id} value={p.product_id}>
                  {p.product_name} — {p.serial_number}
                </option>
              ))}
            </select>
          </div>

          {/* Selected product info card */}
          {selectedProduct && (
            <div style={{ background: "var(--blue-bg)", border: "1px solid var(--blue-border)", borderRadius: 10, padding: "14px 16px" }}>
              <div className="grid-2" style={{ gap: "8px 20px" }}>
                {[
                  ["Product", selectedProduct.product_name],
                  ["Serial",  selectedProduct.serial_number],
                  ["Model",   selectedProduct.model_no],
                  ["Warranty", selectedProduct.warranty ? `${selectedProduct.warranty} mo.` : "—"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div className="fs-11 text-4 mb-4">{k}</div>
                    <div className="fs-13 fw-500 text-1">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Showroom selector */}
          <div>
            <label className="lbl">Select showroom *</label>
            {showrooms.length === 0 ? (
              <div className="fs-13 text-4" style={{ padding: "10px 0" }}>No showrooms available.</div>
            ) : (
              <select className="inp" value={showroomId} onChange={(e) => setShowroomId(e.target.value)}>
                <option value="">Choose a showroom…</option>
                {showrooms.map((s) => (
                  <option key={s.user_id} value={s.user_id}>
                    {s.showroom_name} — {s.location}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Selected showroom info card */}
          {selectedShowroom && (
            <div style={{ background: "var(--amber-bg)", border: "1px solid var(--amber-border)", borderRadius: 10, padding: "14px 16px" }}>
              <div className="grid-2" style={{ gap: "8px 20px" }}>
                {[
                  ["Showroom", selectedShowroom.showroom_name],
                  ["Location", selectedShowroom.location],
                  ["Owner",    selectedShowroom.name],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div className="fs-11 text-4 mb-4">{k}</div>
                    <div className="fs-13 fw-500 text-1">{v || "—"}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-actions" style={{ marginTop: 4 }}>
            <button className="btn btn-outline" onClick={() => { setProductId(""); setShowroomId(""); setError(""); }}>
              Clear
            </button>
            <button
              className="btn btn-amber"
              style={{ padding: "10px 28px", background: "var(--amber)", color: "#fff", borderColor: "var(--amber)" }}
              onClick={handleSubmit}
              disabled={loading || !productId || !showroomId}
            >
              {loading ? "Dispatching…" : "Dispatch to Showroom"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Bulk Dispatch Form ────────────────────────────────────────────────────────
function BulkDispatchForm({ products, showrooms, onSuccess }) {
  const [rows, setRows]         = useState([]);
  const [parseError, setParseError] = useState("");
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name); setParseError(""); setResults([]);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const { rows: parsed, error } = parseCSV(ev.target.result, products, showrooms);
      if (error) { setParseError(error); setRows([]); }
      else setRows(parsed);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) {
      setFileName(file.name); setParseError(""); setResults([]);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const { rows: parsed, error } = parseCSV(ev.target.result, products, showrooms);
        if (error) { setParseError(error); setRows([]); }
        else setRows(parsed);
      };
      reader.readAsText(file);
    }
  };

  const downloadTemplate = () => {
    const header = "product_id,showroom_id";
    const example = products[0] && showrooms[0]
      ? `${products[0].product_id},${showrooms[0].user_id}`
      : "42,7";
    const blob = new Blob([header + "\n" + example], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "dispatch_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkSubmit = async () => {
    if (!rows.length) return;
    setLoading(true); setResults([]);
    const res = [];
    for (const row of rows) {
      try {
        await sendToShowroom({ product_id: row.product_id, showroom_id: row.showroom_id });
        res.push({ row, status: "ok" });
      } catch (err) {
        res.push({ row, status: "error", error: err.response?.data?.error || "Failed" });
      }
    }
    setResults(res); setLoading(false);
    const count = res.filter((r) => r.status === "ok").length;
    if (count > 0) onSuccess(null, null, "bulk", count);
  };

  const successCount = results.filter((r) => r.status === "ok").length;
  const errorCount   = results.filter((r) => r.status === "error").length;
  const invalidRows  = rows.filter((r) => !r._validProduct || !r._validShowroom);

  return (
    <div style={{ padding: "24px" }}>
      {/* Template download */}
      <div style={{ background: "var(--amber-bg)", border: "1px solid var(--amber-border)", borderRadius: 10, padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div className="fs-13 fw-600 text-1">CSV Template</div>
          <div className="fs-12 text-4 mt-4">Two columns required: <span className="mono">product_id</span> and <span className="mono">showroom_id</span>.</div>
        </div>
        <button className="btn btn-amber btn-sm" onClick={downloadTemplate} style={{ flexShrink: 0, padding: "7px 14px", fontSize: 12 }}>
          ↓ Template
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current.click()}
        style={{ border: "2px dashed var(--border-2)", borderRadius: 12, padding: "36px 24px", textAlign: "center", cursor: "pointer", background: "#fafaf8", transition: "border-color 0.15s, background 0.15s", marginBottom: 18 }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--amber)"; e.currentTarget.style.background = "var(--amber-bg)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-2)"; e.currentTarget.style.background = "#fafaf8"; }}
      >
        <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleFile} />
        <svg width="32" height="32" fill="none" stroke="var(--text-4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ margin: "0 auto 10px", display: "block" }}>
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
        </svg>
        {fileName ? (
          <div>
            <div className="fs-14 fw-600 text-1">{fileName}</div>
            <div className="fs-12 text-4 mt-4">{rows.length} dispatch{rows.length !== 1 ? "es" : ""} parsed</div>
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

      {/* Validation warnings */}
      {invalidRows.length > 0 && !results.length && (
        <div style={{ fontSize: 13, color: "var(--amber)", background: "var(--amber-bg)", border: "1px solid var(--amber-border)", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
          ⚠ {invalidRows.length} row{invalidRows.length !== 1 ? "s" : ""} reference unknown product or showroom IDs and will likely fail.
        </div>
      )}

      {/* Preview table */}
      {rows.length > 0 && !results.length && (
        <div style={{ marginBottom: 18 }}>
          <div className="fs-12 fw-600 text-4 mb-8" style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Preview — {rows.length} dispatch{rows.length !== 1 ? "es" : ""}
          </div>
          <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th>Showroom</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 8).map((r, i) => (
                  <tr key={i} className="tbl-row">
                    <td><span className="mono fs-12 text-4">{i + 1}</span></td>
                    <td>
                      <div className="fs-13 fw-500 text-1">{r._productName}</div>
                      <div className="mono fs-11 text-4">ID: {r.product_id}</div>
                    </td>
                    <td>
                      <div className="fs-13 fw-500 text-1">{r._showroomName}</div>
                      <div className="mono fs-11 text-4">ID: {r.showroom_id}</div>
                    </td>
                    <td>
                      {r._validProduct && r._validShowroom ? (
                        <span className="badge" style={{ color: "var(--green)", background: "var(--green-bg)", fontSize: 10 }}>
                          <span className="badge-dot" style={{ background: "var(--green)" }} />Ready
                        </span>
                      ) : (
                        <span className="badge" style={{ color: "var(--red)", background: "var(--red-bg)", fontSize: 10 }}>
                          <span className="badge-dot" style={{ background: "var(--red)" }} />Invalid ID
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                <span className="badge-dot" style={{ background: "var(--green)" }} />{successCount} dispatched
              </span>
            )}
            {errorCount > 0 && (
              <span className="badge" style={{ color: "var(--red)", background: "var(--red-bg)" }}>
                <span className="badge-dot" style={{ background: "var(--red)" }} />{errorCount} failed
              </span>
            )}
          </div>
          <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", maxHeight: 280, overflowY: "auto" }}>
            {results.map((r, i) => (
              <div
                key={i}
                style={{ padding: "11px 16px", borderBottom: i < results.length - 1 ? "1px solid #f0efe9" : "none", display: "flex", alignItems: "center", gap: 12, background: r.status === "error" ? "var(--red-bg)" : "#fff" }}
              >
                <span style={{ fontSize: 14 }}>{r.status === "ok" ? "✓" : "✗"}</span>
                <span className="fs-13 text-1 fw-500" style={{ flex: 1 }}>{r.row._productName}</span>
                <span className="fs-12 text-4">→ {r.row._showroomName}</span>
                {r.status === "error" && <span className="fs-12" style={{ color: "var(--red)" }}>{r.error}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="form-actions" style={{ marginTop: 4 }}>
        <button className="btn btn-outline" onClick={() => { setRows([]); setResults([]); setParseError(""); setFileName(""); if (fileRef.current) fileRef.current.value = ""; }}>
          Clear
        </button>
        <button
          className="btn btn-amber"
          style={{ padding: "10px 28px", background: "var(--amber)", color: "#fff", borderColor: "var(--amber)" }}
          onClick={handleBulkSubmit}
          disabled={!rows.length || loading}
        >
          {loading ? `Dispatching ${rows.length}…` : `Dispatch ${rows.length} Product${rows.length !== 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DispatchProduct() {
  const [tab, setTab]           = useState("single");
  const [products, setProducts] = useState([]);
  const [showrooms, setShowrooms] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [toast, setToast]       = useState({ text: "", type: "" });
  const [recentDispatches, setRecentDispatches] = useState([]);

  useEffect(() => {
    Promise.all([getMyProducts(), getAllShowrooms()])
      .then(([pRes, sRes]) => {
        setProducts(pRes.data);
        setShowrooms(sRes.data);
      })
      .catch(() => notify("Failed to load data.", "error"))
      .finally(() => setDataLoading(false));
  }, []);

  const notify = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: "", type: "" }), 3500);
  };

  const handleSuccess = (product, showroom, mode, count) => {
    if (mode === "single" && product && showroom) {
      notify(`"${product.product_name}" dispatched to ${showroom.showroom_name}!`);
      setRecentDispatches((prev) => [{ product, showroom, at: new Date().toISOString() }, ...prev].slice(0, 5));
      // Refresh product list so dispatched product disappears from selector
      getMyProducts().then((r) => setProducts(r.data)).catch(() => {});
    } else if (mode === "bulk") {
      notify(`${count} product${count !== 1 ? "s" : ""} dispatched successfully!`);
      getMyProducts().then((r) => setProducts(r.data)).catch(() => {});
    }
  };

  const availableCount = products.filter((p) => p.current_status === "CREATED").length;

  return (
    <DashboardLayout title="Dispatch Products">
      <Toast toast={toast} />
      <div className="page">
        <div className="mb-28">
          <div className="page-title">Dispatch Products</div>
          <div className="page-sub">Send a single product or batch dispatch multiple products to showrooms.</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
          {/* Left: form card */}
          <div className="card" style={{ overflow: "hidden" }}>
            <TabBar tab={tab} setTab={setTab} />
            {dataLoading ? (
              <div className="empty">
                <div style={{ width: 28, height: 28, border: "3px solid var(--border)", borderTop: "3px solid var(--amber)", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : tab === "single" ? (
              <SingleDispatchForm products={products} showrooms={showrooms} onSuccess={handleSuccess} />
            ) : (
              <BulkDispatchForm products={products} showrooms={showrooms} onSuccess={handleSuccess} />
            )}
          </div>

          {/* Right: stats + recent */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Stats */}
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="stat-card">
                <div className="fs-11 fw-600 text-4" style={{ letterSpacing: "0.07em", textTransform: "uppercase" }}>Ready</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "var(--amber)", marginTop: 8, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{availableCount}</div>
                <div className="bar-bg"><div className="bar-fg" style={{ width: "100%", background: "var(--amber)" }} /></div>
              </div>
              <div className="stat-card">
                <div className="fs-11 fw-600 text-4" style={{ letterSpacing: "0.07em", textTransform: "uppercase" }}>Showrooms</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "var(--blue)", marginTop: 8, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{showrooms.length}</div>
                <div className="bar-bg"><div className="bar-fg" style={{ width: "100%", background: "var(--blue)" }} /></div>
              </div>
            </div>

            {/* Showroom list */}
            {showrooms.length > 0 && (
              <div className="card" style={{ overflow: "hidden" }}>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", background: "#fafaf8" }}>
                  <div className="fs-13 fw-600 text-1">Available showrooms</div>
                </div>
                {showrooms.map((s, i) => (
                  <div key={s.user_id} style={{ padding: "11px 18px", borderBottom: i < showrooms.length - 1 ? "1px solid #f0efe9" : "none" }}>
                    <div className="fs-13 fw-500 text-1">{s.showroom_name}</div>
                    <div className="row gap-8 mt-4">
                      <span className="fs-11 text-4">{s.location}</span>
                      <span style={{ color: "var(--border-2)" }}>·</span>
                      <span className="mono fs-11 text-4">ID: {s.user_id}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Recent dispatches */}
            {recentDispatches.length > 0 && (
              <div className="card" style={{ overflow: "hidden" }}>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", background: "#fafaf8" }}>
                  <div className="fs-13 fw-600 text-1">Recent dispatches</div>
                </div>
                {recentDispatches.map((d, i) => (
                  <div key={i} style={{ padding: "12px 18px", borderBottom: i < recentDispatches.length - 1 ? "1px solid #f0efe9" : "none" }}>
                    <div className="fs-13 fw-600 text-1">{d.product.product_name}</div>
                    <div className="fs-12 text-4 mt-4">→ {d.showroom.showroom_name}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Bulk tips */}
            {tab === "bulk" && (
              <div className="card card-p">
                <div className="fs-12 fw-600 text-4 mb-10" style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}>CSV Tips</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    ["product_id", "Find IDs in your Products list."],
                    ["showroom_id", "Visible in the showroom list on this page."],
                  ].map(([k, v]) => (
                    <div key={k} style={{ borderLeft: "2px solid var(--border)", paddingLeft: 12 }}>
                      <div className="mono fs-11" style={{ color: "var(--amber)", fontWeight: 600 }}>{k}</div>
                      <div className="fs-12 text-4 mt-4">{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}