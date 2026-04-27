import { useState, useMemo, useEffect } from "react";
import DashboardLayout from "../shared/DashboardLayout";
import { initiateRepair, confirmRepair } from "../shared/otp.api";
import {
  Toast, useToast, Modal, OTPBoxes, OTPResend,
  ErrorBox, EmailPill, ProductInfoCard, StatCard,
  FilterToolbar, ActiveFilterChips, SuccessScreen,
  EmptyState, Spinner, TableFooter,
} from "../shared/components";

// ── Constants ─────────────────────────────────────────────────────────────────
const REPAIR_TYPES = ["HARDWARE", "SOFTWARE", "COSMETIC", "OTHER"];

const TYPE_META = {
  HARDWARE: { color: "var(--blue)",   bg: "var(--blue-bg)",   border: "var(--blue-border)"   },
  SOFTWARE: { color: "var(--purple)", bg: "var(--purple-bg)", border: "var(--purple-border)" },
  COSMETIC: { color: "var(--amber)",  bg: "var(--amber-bg)",  border: "var(--amber-border)"  },
  OTHER:    { color: "var(--text-3)", bg: "var(--bg)",        border: "var(--border)"        },
};

const SORT_OPTIONS = [
  { value: "newest",   label: "Newest first"   },
  { value: "oldest",   label: "Oldest first"   },
  { value: "price_hi", label: "Price high–low" },
  { value: "price_lo", label: "Price low–high" },
];

const TYPE_FILTER_OPTIONS = [
  { value: "", label: "All types" },
  ...REPAIR_TYPES.map(t => ({ value: t, label: t })),
];

const emptyForm = {
  product_id: "", issue: "", repair_type: "", repair_price: "", estimated_time: "",
};

// ── RepairTypePicker ─────────────────────────────────────────────────────────
function RepairTypePicker({ value, onChange }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {REPAIR_TYPES.map(t => {
        const m = TYPE_META[t];
        const selected = value === t;
        return (
          <button key={t} onClick={() => onChange(t)} style={{
            padding: "9px 14px", borderRadius: 9, cursor: "pointer",
            border: `1.5px solid ${selected ? m.color : "var(--border)"}`,
            background: selected ? m.bg : "#fafaf8",
            color: selected ? m.color : "var(--text-3)",
            fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600,
            transition: "all 0.14s", letterSpacing: "0.04em",
          }}>
            {t}
          </button>
        );
      })}
    </div>
  );
}

// ── RepairTypeBadge ──────────────────────────────────────────────────────────
function RepairTypeBadge({ type }) {
  const m = TYPE_META[type] || TYPE_META.OTHER;
  return (
    <span className="badge fs-10" style={{ color: m.color, background: m.bg }}>
      <span className="badge-dot" style={{ background: m.color }} />
      {type}
    </span>
  );
}

// ── RepairModal — productId → OTP send → OTP confirm → done ──────────────────
function RepairModal({ formData, onClose, onSuccess }) {
  const [step, setStep]           = useState("confirm"); // confirm | otp | done
  const [otpDigits, setOtpDigits] = useState(["","","","","",""]);
  const [ownerInfo, setOwnerInfo] = useState(null);   // { owner_name, owner_email, product }
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  // Auto-initiate when modal opens
  useEffect(() => {
    initiateRepair({ product_id: formData.product_id })
      .then(res => setOwnerInfo(res.data))
      .catch(err => setError(err.response?.data?.error || "Failed to find product or send OTP."));
  }, []);

  const handleConfirmOTP = async () => {
    const otp = otpDigits.join("");
    if (otp.length < 6) { setError("Enter the full 6-digit code."); return; }
    setError(""); setLoading(true);
    try {
      const res = await confirmRepair({ ...formData, otp });
      setStep("done");
      // Merge DB record with form data + product info so session list has everything
      onSuccess({
        ...res.data,
        product_id:     formData.product_id,
        issue:          formData.issue,
        repair_type:    formData.repair_type,
        repair_price:   formData.repair_price   || res.data.repair_price,
        estimated_time: formData.estimated_time || res.data.estimated_time,
        product_name:   ownerInfo?.product?.product_name   || null,
        serial_number:  ownerInfo?.product?.serial_number  || null,
      });
    } catch (err) {
      setError(err.response?.data?.error || "Invalid or expired OTP.");
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    const res = await initiateRepair({ product_id: formData.product_id });
    setOwnerInfo(res.data);
    setOtpDigits(["","","","","",""]);
  };

  const productPreview = ownerInfo?.product;

  return (
    <Modal title="Owner OTP Confirmation" subtitle={`Product #${formData.product_id}`} onClose={onClose}>
      <ErrorBox error={error} />

      {step === "confirm" && (
        <>
          {/* Repair summary */}
          <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
            <div className="fs-11 fw-600 text-4 mb-10" style={{ letterSpacing: "0.07em", textTransform: "uppercase" }}>Repair details</div>
            <div className="grid-2" style={{ gap: "8px 20px" }}>
              {productPreview && <>
                <div><div className="fs-11 text-4 mb-4">Product</div><div className="fs-13 fw-500 text-1">{productPreview.product_name}</div></div>
                <div><div className="fs-11 text-4 mb-4">Serial</div><div className="fs-13 fw-500 text-1 mono">{productPreview.serial_number}</div></div>
              </>}
              <div><div className="fs-11 text-4 mb-4">Type</div><RepairTypeBadge type={formData.repair_type} /></div>
              {formData.repair_price && <div><div className="fs-11 text-4 mb-4">Price</div><div className="fs-13 fw-500 text-1">{formData.repair_price} BDT</div></div>}
              {formData.estimated_time && <div><div className="fs-11 text-4 mb-4">Est. time</div><div className="fs-13 fw-500 text-1">{formData.estimated_time}</div></div>}
            </div>
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
              <div className="fs-11 text-4 mb-4">Issue</div>
              <div className="fs-13 text-2" style={{ lineHeight: 1.55 }}>{formData.issue}</div>
            </div>
          </div>

          {!ownerInfo ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", color: "var(--text-4)", fontSize: 13 }}>
              <Spinner size={16} color="var(--red)" />
              Finding product owner and sending OTP…
            </div>
          ) : (
            <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-border)", borderRadius: 9, padding: "12px 14px", marginBottom: 16, fontSize: 13, color: "var(--red)", lineHeight: 1.55 }}>
              OTP sent to the product owner — <strong>{ownerInfo.owner_name}</strong>. Ask them for the code to proceed.
            </div>
          )}

          <div className="form-actions">
            <button className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button className="btn btn-dark" style={{ padding: "10px 24px" }}
              onClick={() => setStep("otp")}
              disabled={!ownerInfo}>
              Enter OTP →
            </button>
          </div>
        </>
      )}

      {step === "otp" && (
        <>
          <div className="fs-13 text-3 mb-4" style={{ lineHeight: 1.6 }}>
            Enter the OTP provided by the product owner —{" "}
            <strong style={{ color: "var(--text-1)" }}>{ownerInfo?.owner_name}</strong>
          </div>
          <EmailPill
            email={ownerInfo?.owner_email}
            accentColor="var(--red)"
            accentBg="var(--red-bg)"
            accentBorder="var(--red-border)"
          />
          <OTPBoxes
            digits={otpDigits} setDigits={setOtpDigits}
            accentColor="var(--red)" idPrefix="rep-otp"
          />
          <OTPResend onResend={handleResend} loading={loading} accentColor="var(--red)" />
          <div className="form-actions">
            <button className="btn btn-outline" onClick={() => { setStep("confirm"); setOtpDigits(["","","","","",""]); setError(""); }}>← Back</button>
            <button className="btn btn-dark" style={{ padding: "10px 24px" }}
              onClick={handleConfirmOTP}
              disabled={loading || otpDigits.join("").length < 6}>
              {loading ? "Submitting…" : "Submit Repair ✓"}
            </button>
          </div>
        </>
      )}

      {step === "done" && (
        <SuccessScreen
          title="Repair record created!"
          body={<>Repair for <strong>Product #{formData.product_id}</strong> has been logged and is now <strong>IN PROGRESS</strong>.</>}
          onClose={onClose}
          color="var(--red)"
          bg="var(--red-bg)"
        />
      )}
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RepairDashboard() {
  const [form, setForm]             = useState(emptyForm);
  const [pendingForm, setPendingForm] = useState(null); // triggers modal
  const [submitted, setSubmitted]   = useState([]);
  const [search, setSearch]         = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortBy, setSortBy]         = useState("newest");
  const { toast, notify }           = useToast();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmitForm = () => {
    if (!form.product_id.trim() || !form.issue.trim() || !form.repair_type) {
      notify("Fill in product ID, issue and repair type.", "error"); return;
    }
    setPendingForm({ ...form });
  };

  const handleRepairSuccess = (record) => {
    notify("Repair record created!");
    setSubmitted(prev => [{ ...record, _ts: new Date().toISOString() }, ...prev]);
    setForm(emptyForm);
    // Don't close modal here — let the "done" step show, user clicks Done to close
  };

  const handleRepairModalClose = () => {
    setPendingForm(null);
  };

  // Filtered submitted list
  const filteredSubmitted = useMemo(() => {
    let list = [...submitted];
    if (search) { const q = search.toLowerCase(); list = list.filter(r => r.issue?.toLowerCase().includes(q) || String(r.product_id).includes(q) || r.repair_type?.toLowerCase().includes(q) || r.product_name?.toLowerCase().includes(q) || r.serial_number?.toLowerCase().includes(q)); }
    if (typeFilter) list = list.filter(r => r.repair_type === typeFilter);
    if (sortBy === "oldest")   list = [...list].reverse();
    if (sortBy === "price_hi") list.sort((a,b) => (Number(b.repair_price)||0) - (Number(a.repair_price)||0));
    if (sortBy === "price_lo") list.sort((a,b) => (Number(a.repair_price)||0) - (Number(b.repair_price)||0));
    return list;
  }, [submitted, search, typeFilter, sortBy]);

  const stats = useMemo(() => ({
    total:    submitted.length,
    hardware: submitted.filter(r => r.repair_type === "HARDWARE").length,
    software: submitted.filter(r => r.repair_type === "SOFTWARE").length,
    cosmetic: submitted.filter(r => r.repair_type === "COSMETIC").length,
    other:    submitted.filter(r => r.repair_type === "OTHER").length,
  }), [submitted]);

  const isFiltered = !!(search || typeFilter);

  return (
    <DashboardLayout title="Repair Jobs">
      <Toast toast={toast} />
      <div className="page">
        <div className="mb-28">
          <div className="page-title">Repair Management</div>
          <div className="page-sub">Log repairs with OTP confirmation from the product owner.</div>
        </div>

        {/* Session stats — only after first submission */}
        {submitted.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
            <StatCard label="Total"    value={stats.total}    color="var(--text-1)" pct={100} />
            <StatCard label="Hardware" value={stats.hardware} color="var(--blue)"   pct={stats.total ? (stats.hardware/stats.total)*100 : 0} />
            <StatCard label="Software" value={stats.software} color="var(--purple)" pct={stats.total ? (stats.software/stats.total)*100 : 0} />
            <StatCard label="Cosmetic" value={stats.cosmetic} color="var(--amber)"  pct={stats.total ? (stats.cosmetic/stats.total)*100 : 0} />
            <StatCard label="Other"    value={stats.other}    color="var(--text-3)" pct={stats.total ? (stats.other/stats.total)*100 : 0} />
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>

          {/* ── Form card ── */}
          <div className="card card-p">
            <div className="between mb-20">
              <div>
                <div className="fs-14 fw-600 text-1">New repair record</div>
                <div className="fs-12 text-4 mt-4">Fields marked * are required.</div>
              </div>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--red-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" fill="none" stroke="var(--red)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
                </svg>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label className="lbl">Product ID *</label>
                <input className="inp mono" placeholder="e.g. 42"
                  value={form.product_id} onChange={e => set("product_id", e.target.value)} />
                <div className="fs-11 text-4 mt-4">An OTP will be sent to the product owner to confirm this repair.</div>
              </div>

              <div>
                <label className="lbl">Issue description *</label>
                <textarea className="inp" style={{ minHeight: 80 }}
                  placeholder="Describe the problem in detail…"
                  value={form.issue} onChange={e => set("issue", e.target.value)} />
              </div>

              <div>
                <label className="lbl">Repair type *</label>
                <RepairTypePicker value={form.repair_type} onChange={v => set("repair_type", v)} />
              </div>

              <div className="grid-2">
                <div>
                  <label className="lbl">Price (BDT)</label>
                  <input className="inp" type="number" placeholder="e.g. 1500"
                    value={form.repair_price} onChange={e => set("repair_price", e.target.value)} />
                </div>
                <div>
                  <label className="lbl">Estimated time</label>
                  <input className="inp" placeholder="e.g. 2 days"
                    value={form.estimated_time} onChange={e => set("estimated_time", e.target.value)} />
                </div>
              </div>

              <div className="form-actions" style={{ marginTop: 4 }}>
                <button className="btn btn-outline" onClick={() => setForm(emptyForm)}>Clear</button>
                <button className="btn btn-dark" style={{ padding: "10px 24px" }} onClick={handleSubmitForm}>
                  Request Owner OTP →
                </button>
              </div>
            </div>
          </div>

          {/* ── Session records card ── */}
          <div className="card" style={{ overflow: "hidden" }}>
            {/* Toolbar */}
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", background: "#fafaf8" }}>
              <div className="between mb-10">
                <div className="fs-14 fw-600 text-1">Session records</div>
                <span className="fs-12 text-4">{filteredSubmitted.length} / {submitted.length}</span>
              </div>

              {submitted.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {/* Search */}
                  <div style={{ position: "relative" }}>
                    <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                      width="12" height="12" fill="none" stroke="var(--text-4)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input className="inp" style={{ paddingLeft: 30, fontSize: 12 }}
                      placeholder="Search issue, product ID…"
                      value={search} onChange={e => setSearch(e.target.value)} />
                  </div>

                  {/* Type + Sort */}
                  <div style={{ display: "flex", gap: 8 }}>
                    <select className="inp" style={{ flex: 1, fontSize: 12 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                      {TYPE_FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <select className="inp" style={{ flex: 1, fontSize: 12 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                      {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>

                  {/* Active chips */}
                  {(search || typeFilter) && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      {search && (
                        <span style={{ display:"inline-flex",alignItems:"center",gap:5,background:"var(--blue-bg)",border:"1px solid var(--blue-border)",borderRadius:999,padding:"2px 8px",fontSize:11,color:"var(--blue)",fontWeight:500 }}>
                          "{search}" <button onClick={()=>setSearch("")} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--blue)",fontSize:13,lineHeight:1,padding:0 }}>×</button>
                        </span>
                      )}
                      {typeFilter && (() => { const m = TYPE_META[typeFilter]; return (
                        <span style={{ display:"inline-flex",alignItems:"center",gap:5,background:m.bg,border:`1px solid ${m.border}`,borderRadius:999,padding:"2px 8px",fontSize:11,color:m.color,fontWeight:500 }}>
                          {typeFilter} <button onClick={()=>setTypeFilter("")} style={{ background:"none",border:"none",cursor:"pointer",color:m.color,fontSize:13,lineHeight:1,padding:0 }}>×</button>
                        </span>
                      );})()}
                      <button onClick={()=>{setSearch("");setTypeFilter("");}} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text-4)",fontSize:11,textDecoration:"underline" }}>Clear</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Records list */}
            {submitted.length === 0 ? (
              <EmptyState
                iconColor="var(--red)" iconBg="var(--red-bg)"
                icon={<svg width="22" height="22" fill="none" stroke="var(--red)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>}
                title="No records yet"
                subtitle="Submitted repairs will appear here."
              />
            ) : filteredSubmitted.length === 0 ? (
              <EmptyState
                iconColor="var(--text-4)" iconBg="var(--bg)"
                title="No matching records"
                subtitle="Try adjusting your search or filter."
              />
            ) : (
              <div style={{ maxHeight: 520, overflowY: "auto" }}>
                {filteredSubmitted.map((r, i) => {
                  const m = TYPE_META[r.repair_type] || TYPE_META.OTHER;
                  return (
                    <div key={i} style={{ padding: "14px 18px", borderBottom: "1px solid #f0efe9", borderLeft: `3px solid ${m.color}` }}>
                      <div className="between mb-6">
                        <div style={{ flex:1, marginRight:10 }}>
                          <div className="fs-14 fw-600 text-1">
                            {r.issue?.slice(0, 52)}{r.issue?.length > 52 ? "…" : ""}
                          </div>
                          {r.product_name && (
                            <div className="fs-12 text-4 mt-4">{r.product_name}</div>
                          )}
                        </div>
                        <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
                          <RepairTypeBadge type={r.repair_type} />
                          <span className="badge" style={{ color:"var(--red)", background:"var(--red-bg)", fontSize:10 }}>
                            <span className="badge-dot" style={{ background:"var(--red)" }} />IN PROGRESS
                          </span>
                        </div>
                      </div>
                      <div className="row gap-10 fs-12 text-3" style={{ flexWrap:"wrap" }}>
                        <span>
                          Product{" "}
                          <span className="mono fw-500">#{r.product_id}</span>
                          {r.serial_number && (
                            <span className="mono text-4"> · {r.serial_number}</span>
                          )}
                        </span>
                        {(r.repair_price && Number(r.repair_price) > 0) && (
                          <><span style={{ color:"var(--border-2)" }}>·</span><span className="fw-500">{r.repair_price} BDT</span></>
                        )}
                        {r.estimated_time && (
                          <><span style={{ color:"var(--border-2)" }}>·</span><span>{r.estimated_time}</span></>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <TableFooter shown={filteredSubmitted.length} total={submitted.length} label="records" filtered={isFiltered} />
          </div>
        </div>
      </div>

      {pendingForm && (
        <RepairModal
          formData={pendingForm}
          onClose={handleRepairModalClose}
          onSuccess={handleRepairSuccess}
        />
      )}
    </DashboardLayout>
  );
}