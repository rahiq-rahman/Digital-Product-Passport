import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "../shared/DashboardLayout";
import { getMyProducts, getMyPassport } from "./customer.api";
import { initiateTransfer, confirmTransfer } from "../shared/otp.api";
import {
  Toast, useToast, StatusBadge, Modal, OTPBoxes, OTPResend,
  ErrorBox, EmailPill, ProductInfoCard, StatCard, FilterToolbar,
  ActiveFilterChips, SuccessScreen, PassportModal, EmptyState,
  Spinner, TableFooter, WarningBox,
} from "../shared/Components";

const STATUS_OPTIONS = [
  { value: "",            label: "All statuses" },
  { value: "SOLD",        label: "Owned"         },
  { value: "IN_REPAIR",   label: "In Repair"     },
  { value: "IN_SHOWROOM", label: "In Showroom"   },
  { value: "CREATED",     label: "Created"       },
];
const SORT_OPTIONS = [
  { value: "default",     label: "Default order"     },
  { value: "name",        label: "Name A–Z"           },
  { value: "status",      label: "By status"          },
  { value: "warranty_hi", label: "Warranty high–low"  },
  { value: "warranty_lo", label: "Warranty low–high"  },
];

// ── TransferModal — email → OTP → done ───────────────────────────────────────
function TransferModal({ product, onClose, onSuccess }) {
  const [step, setStep]           = useState("email");
  const [email, setEmail]         = useState("");
  const [otpDigits, setOtpDigits] = useState(["","","","","",""]);
  const [pending, setPending]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  const handleInitiate = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid recipient email address."); return;
    }
    setError(""); setLoading(true);
    try {
      const res = await initiateTransfer({ product_id: product.product_id, to_email: email });
      setPending(res.data); setStep("otp");
    } catch (err) { setError(err.response?.data?.error || "Failed to send OTP."); }
    finally { setLoading(false); }
  };

  const handleConfirm = async () => {
    const otp = otpDigits.join("");
    if (otp.length < 6) { setError("Enter the full 6-digit code."); return; }
    setError(""); setLoading(true);
    try {
      await confirmTransfer({ product_id: product.product_id, recipient_id: pending.recipient_id, otp });
      setStep("done"); onSuccess(pending);
    } catch (err) { setError(err.response?.data?.error || "Invalid or expired OTP."); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    const res = await initiateTransfer({ product_id: product.product_id, to_email: email });
    setPending(res.data); setOtpDigits(["","","","","",""]);
  };

  return (
    <Modal title="Transfer Ownership" subtitle={product.product_name} onClose={onClose}>
      <ProductInfoCard product={product} />
      <ErrorBox error={error} />

      {step === "email" && (
        <>
          <WarningBox>
            This action is <strong>permanent</strong>. Once transferred you will no longer own this product.
            The recipient will receive an OTP to confirm acceptance.
          </WarningBox>
          <div className="mb-20">
            <label className="lbl">Recipient email address</label>
            <input className="inp" type="email" placeholder="recipient@example.com"
              value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleInitiate()} />
          </div>
          <div className="form-actions">
            <button className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button className="btn btn-green" style={{ padding:"10px 24px" }}
              onClick={handleInitiate} disabled={loading}>
              {loading ? "Sending OTP…" : "Send OTP →"}
            </button>
          </div>
        </>
      )}

      {step === "otp" && (
        <>
          <div className="fs-13 text-3 mb-4" style={{ lineHeight:1.6 }}>
            OTP sent to the recipient — <strong style={{ color:"var(--text-1)" }}>{pending?.recipient_name}</strong>.
            They must share it with you to confirm the transfer.
          </div>
          <EmailPill email={pending?.recipient_email} accentColor="var(--green)" accentBg="var(--green-bg)" accentBorder="var(--green-border)" />
          <OTPBoxes digits={otpDigits} setDigits={setOtpDigits} accentColor="var(--green)" idPrefix="xfr-otp" />
          <OTPResend onResend={handleResend} loading={loading} accentColor="var(--green)" />
          <div className="form-actions">
            <button className="btn btn-outline" onClick={() => { setStep("email"); setOtpDigits(["","","","","",""]); setError(""); }}>← Back</button>
            <button className="btn btn-green" style={{ padding:"10px 24px" }} onClick={handleConfirm}
              disabled={loading || otpDigits.join("").length < 6}>
              {loading ? "Confirming…" : "Confirm Transfer ✓"}
            </button>
          </div>
        </>
      )}

      {step === "done" && (
        <SuccessScreen
          title="Transfer complete!"
          body={<><strong>{product.product_name}</strong> has been successfully transferred to <strong>{pending?.recipient_name}</strong>.</>}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CustomerDashboard() {
  const [products, setProducts]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [passport, setPassport]               = useState(null);
  const [passportLoading, setPassportLoading] = useState(false);
  const [passportOpen, setPassportOpen]       = useState(false);
  const [transferTarget, setTransferTarget]   = useState(null);
  const [search, setSearch]                   = useState("");
  const [statusFilter, setStatus]             = useState("");
  const [sortBy, setSortBy]                   = useState("default");
  const { toast, notify }                     = useToast();

  const load = async () => {
    setLoading(true);
    try { const r = await getMyProducts(); setProducts(r.data); }
    catch { notify("Could not load your products.", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = [...products];
    if (search) { const q = search.toLowerCase(); list = list.filter(p => p.product_name?.toLowerCase().includes(q) || p.serial_number?.toLowerCase().includes(q) || p.model_no?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)); }
    if (statusFilter) list = list.filter(p => p.current_status === statusFilter);
    if (sortBy === "name")        list.sort((a,b) => a.product_name.localeCompare(b.product_name));
    if (sortBy === "status")      list.sort((a,b) => a.current_status.localeCompare(b.current_status));
    if (sortBy === "warranty_hi") list.sort((a,b) => (Number(b.warranty)||0) - (Number(a.warranty)||0));
    if (sortBy === "warranty_lo") list.sort((a,b) => (Number(a.warranty)||0) - (Number(b.warranty)||0));
    return list;
  }, [products, search, statusFilter, sortBy]);

  const inRepair      = products.filter(p => p.current_status === "IN_REPAIR").length;
  const totalWarranty = products.reduce((acc,p) => acc + (Number(p.warranty)||0), 0);
  const isFiltered    = !!(search || statusFilter);
  const name          = localStorage.getItem("name") || "there";

  const handleViewPassport = async product_id => {
    setPassportLoading(true);
    try { const r = await getMyPassport(product_id); setPassport(r.data); setPassportOpen(true); }
    catch (err) { notify(err.response?.data?.error || "Could not load passport.", "error"); }
    finally { setPassportLoading(false); }
  };

  const handleOpenTransfer = product => {
    setPassportOpen(false); setPassport(null);
    setTransferTarget(product);
  };

  const handleTransferSuccess = (pending) => {
    notify(`"${transferTarget.product_name}" transferred to ${pending.recipient_name}!`);
    setTransferTarget(null);
    load();
  };

  return (
    <DashboardLayout title="My Products">
      <Toast toast={toast} />
      <div className="page">
        <div className="mb-28">
          <div className="page-title">Hello, {name.split(" ")[0]}</div>
          <div className="page-sub">All products registered under your account.</div>
        </div>

        <div className="grid-3 mb-20">
          <StatCard label="Products owned" value={products.length}    color="var(--green)" pct={100} />
          <StatCard label="In repair"       value={inRepair}           color="var(--red)"   pct={products.length ? (inRepair/products.length)*100 : 0} />
          <StatCard label="Total warranty"  value={`${totalWarranty} mo.`} color="var(--blue)"  pct={100} />
        </div>

        <div className="card" style={{ overflow:"hidden" }}>
          <FilterToolbar
            search={search} onSearch={setSearch}
            filters={[
              { value:statusFilter, onChange:setStatus, options:STATUS_OPTIONS, minWidth:150 },
              { value:sortBy,       onChange:setSortBy, options:SORT_OPTIONS,   minWidth:180 },
            ]}
            resultCount={filtered.length} totalCount={products.length} label="products"
            extra={passportLoading && <Spinner size={14} color="var(--green)" />}
          />
          <ActiveFilterChips
            chips={[
              { value:search,       label:`"${search}"`, color:"blue",  onRemove:()=>setSearch("") },
              { value:statusFilter, label:STATUS_OPTIONS.find(o=>o.value===statusFilter)?.label||"", color:"green", onRemove:()=>setStatus("") },
            ]}
            onClearAll={() => { setSearch(""); setStatus(""); }}
          />

          {loading ? (
            <div className="empty"><Spinner size={32} color="var(--green)" style={{ margin:"0 auto" }} /></div>
          ) : filtered.length === 0 ? (
            <EmptyState
              iconColor="var(--green)" iconBg="var(--green-bg)"
              icon={<svg width="22" height="22" fill="none" stroke="var(--green)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>}
              title={isFiltered ? "No matching products" : "No products yet"}
              subtitle={isFiltered ? "Try adjusting your search or filter." : "Products appear here once a showroom transfers one to you."}
            />
          ) : (
            <table className="tbl">
              <thead><tr>{["Product","Serial / Model","Warranty","Status",""].map(h=><th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.product_id} className="tbl-row">
                    <td>
                      <div className="fs-14 fw-600 text-1">{p.product_name}</div>
                      {p.description && <div className="fs-12 text-4 mt-4" style={{ maxWidth:220,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.description}</div>}
                    </td>
                    <td><div className="mono fs-13 text-2">{p.serial_number}</div><div className="mono fs-11 text-4 mt-4">{p.model_no}</div></td>
                    <td><span className="fs-13 text-3">{p.warranty ? `${p.warranty} mo.` : "—"}</span></td>
                    <td><StatusBadge status={p.current_status} /></td>
                    <td>
                      <div className="acts">
                        <button className="btn btn-sm btn-blue" onClick={()=>handleViewPassport(p.product_id)} disabled={passportLoading}>Passport</button>
                        <button className="btn btn-sm btn-green" onClick={()=>handleOpenTransfer(p)}>Transfer</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <TableFooter shown={filtered.length} total={products.length} label="products" filtered={isFiltered} />
        </div>
      </div>

      {passportOpen && passport && (
        <PassportModal
          passport={passport}
          onClose={() => { setPassportOpen(false); setPassport(null); }}
          footerAction={
            <button className="btn btn-green" style={{ width:"100%",justifyContent:"center",padding:"11px",marginTop:4 }}
              onClick={() => handleOpenTransfer(passport.product)}>
              Transfer ownership
            </button>
          }
        />
      )}

      {transferTarget && (
        <TransferModal
          product={transferTarget}
          onClose={() => setTransferTarget(null)}
          onSuccess={handleTransferSuccess}
        />
      )}
    </DashboardLayout>
  );
}