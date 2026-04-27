import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "../shared/DashboardLayout";
import { getInventory } from "./showroom.api";
import { getPassport } from "../customer/customer.api";
import { initiateSale, confirmSale } from "../shared/otp.api";
import {
  Toast, useToast, StatusBadge, Modal, OTPBoxes, OTPResend,
  ErrorBox, EmailPill, ProductInfoCard, StatCard, FilterToolbar,
  ActiveFilterChips, SuccessScreen, PassportModal, EmptyState,
  Spinner, TableFooter,
} from "../shared/Components";

const STATUS_OPTIONS = [
  { value: "",            label: "All statuses"  },
  { value: "IN_SHOWROOM", label: "In Showroom"   },
  { value: "SOLD",        label: "Sold"           },
  { value: "CREATED",     label: "Created"        },
  { value: "IN_REPAIR",   label: "In Repair"      },
];
const SORT_OPTIONS = [
  { value: "default",  label: "Default order"    },
  { value: "name",     label: "Name A–Z"          },
  { value: "status",   label: "By status"         },
  { value: "warranty", label: "Warranty high–low" },
];

function SellModal({ product, onClose, onSuccess }) {
  const [step, setStep]           = useState("email");
  const [email, setEmail]         = useState("");
  const [otpDigits, setOtpDigits] = useState(["","","","","",""]);
  const [pending, setPending]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  const handleInitiate = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid customer email address."); return;
    }
    setError(""); setLoading(true);
    try {
      const res = await initiateSale({ product_id: product.product_id, customer_email: email });
      setPending(res.data); setStep("otp");
    } catch (err) { setError(err.response?.data?.error || "Failed to send OTP."); }
    finally { setLoading(false); }
  };

  const handleConfirm = async () => {
    const otp = otpDigits.join("");
    if (otp.length < 6) { setError("Enter the full 6-digit code."); return; }
    setError(""); setLoading(true);
    try {
      await confirmSale({ product_id: product.product_id, customer_id: pending.customer_id, otp });
      setStep("done"); onSuccess(product, pending);
    } catch (err) { setError(err.response?.data?.error || "Invalid or expired OTP."); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    const res = await initiateSale({ product_id: product.product_id, customer_email: email });
    setPending(res.data); setOtpDigits(["","","","","",""]);
  };

  return (
    <Modal title="Sell Product" subtitle={product.product_name} onClose={onClose}>
      <ProductInfoCard product={product} />
      <ErrorBox error={error} />
      {step === "email" && (
        <>
          <div className="fs-13 text-3 mb-16" style={{ lineHeight: 1.65 }}>
            Enter the customer's email. They will receive a 6-digit OTP to confirm the purchase.
          </div>
          <div className="mb-20">
            <label className="lbl">Customer email address</label>
            <input className="inp" type="email" placeholder="customer@example.com"
              value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleInitiate()} />
          </div>
          <div className="form-actions">
            <button className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button className="btn btn-amber" style={{ padding:"10px 24px",background:"var(--amber)",color:"#fff",borderColor:"var(--amber)" }}
              onClick={handleInitiate} disabled={loading}>
              {loading ? "Sending OTP…" : "Send OTP →"}
            </button>
          </div>
        </>
      )}
      {step === "otp" && (
        <>
          <div className="fs-13 text-3 mb-4" style={{ lineHeight: 1.6 }}>
            OTP sent to <strong style={{ color:"var(--text-1)" }}>{pending?.customer_name}</strong>
          </div>
          <EmailPill email={pending?.customer_email} accentColor="var(--amber)" accentBg="var(--amber-bg)" accentBorder="var(--amber-border)" />
          <OTPBoxes digits={otpDigits} setDigits={setOtpDigits} accentColor="var(--amber)" idPrefix="sell-otp" />
          <OTPResend onResend={handleResend} loading={loading} accentColor="var(--amber)" />
          <div className="form-actions">
            <button className="btn btn-outline" onClick={() => { setStep("email"); setOtpDigits(["","","","","",""]); setError(""); }}>← Back</button>
            <button className="btn btn-green" style={{ padding:"10px 24px" }} onClick={handleConfirm}
              disabled={loading || otpDigits.join("").length < 6}>
              {loading ? "Confirming…" : "Confirm Sale ✓"}
            </button>
          </div>
        </>
      )}
      {step === "done" && (
        <SuccessScreen title="Sale confirmed!"
          body={<><strong>{product.product_name}</strong> has been transferred to <strong>{pending?.customer_name}</strong>.</>}
          onClose={onClose} />
      )}
    </Modal>
  );
}

export default function ShowroomDashboard() {
  const [inventory, setInventory]             = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [sellModal, setSellModal]             = useState(null);
  const [passport, setPassport]               = useState(null);
  const [passportLoading, setPassportLoading] = useState(false);
  const [search, setSearch]                   = useState("");
  const [statusFilter, setStatus]             = useState("");
  const [sortBy, setSortBy]                   = useState("default");
  const { toast, notify }                     = useToast();

  const load = () =>
    getInventory()
      .then(r => setInventory(r.data))
      .catch(() => notify("Failed to load inventory.", "error"))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const eff = p => p.inventory_status || p.current_status;
    let list = [...inventory];
    if (search) { const q = search.toLowerCase(); list = list.filter(p => p.product_name?.toLowerCase().includes(q) || p.serial_number?.toLowerCase().includes(q) || p.model_no?.toLowerCase().includes(q)); }
    if (statusFilter) list = list.filter(p => eff(p) === statusFilter);
    if (sortBy === "name")    list.sort((a,b) => a.product_name.localeCompare(b.product_name));
    if (sortBy === "status")  list.sort((a,b) => eff(a).localeCompare(eff(b)));
    if (sortBy === "warranty") list.sort((a,b) => (Number(b.warranty)||0) - (Number(a.warranty)||0));
    return list;
  }, [inventory, search, statusFilter, sortBy]);

  const total = inventory.length;
  const sold  = inventory.filter(p => (p.inventory_status || p.current_status) === "SOLD").length;
  const avail = inventory.filter(p => (p.inventory_status || p.current_status) === "IN_SHOWROOM").length;
  const isFiltered = !!(search || statusFilter);

  const handleSaleSuccess = (product, pending) => {
    notify(`"${product.product_name}" sold to ${pending.customer_name}!`);
    setInventory(prev => prev.map(p => p.product_id === product.product_id ? { ...p, inventory_status:"SOLD", current_status:"SOLD" } : p));
    setSellModal(null);
  };

  const handlePassport = async product_id => {
    setPassportLoading(true);
    try { const r = await getPassport(product_id); setPassport(r.data); }
    catch (err) { notify(err.response?.data?.error || "Could not load passport.", "error"); }
    finally { setPassportLoading(false); }
  };

  return (
    <DashboardLayout title="Inventory">
      <Toast toast={toast} />
      <div className="page">
        <div className="mb-28">
          <div className="page-title">Showroom Inventory</div>
          <div className="page-sub">Sell products to customers with OTP-verified ownership transfer.</div>
        </div>
        <div className="grid-3 mb-20">
          <StatCard label="Total stock" value={total} color="var(--amber)" pct={100} />
          <StatCard label="Available"   value={avail} color="var(--blue)"  pct={total ? (avail/total)*100 : 0} />
          <StatCard label="Sold"        value={sold}  color="var(--green)" pct={total ? (sold/total)*100  : 0} />
        </div>
        <div className="card" style={{ overflow:"hidden" }}>
          <FilterToolbar
            search={search} onSearch={setSearch}
            filters={[
              { value:statusFilter, onChange:setStatus, options:STATUS_OPTIONS, minWidth:150 },
              { value:sortBy,       onChange:setSortBy, options:SORT_OPTIONS,   minWidth:160 },
            ]}
            resultCount={filtered.length} totalCount={inventory.length} label="items"
            extra={passportLoading && <Spinner size={14} color="var(--amber)" />}
          />
          <ActiveFilterChips
            chips={[
              { value:search,       label:`"${search}"`,  color:"blue",  onRemove:()=>setSearch("")  },
              { value:statusFilter, label:STATUS_OPTIONS.find(o=>o.value===statusFilter)?.label||"", color:"amber", onRemove:()=>setStatus("") },
            ]}
            onClearAll={() => { setSearch(""); setStatus(""); }}
          />
          {loading ? (
            <div className="empty"><Spinner size={32} color="var(--amber)" style={{ margin:"0 auto" }} /></div>
          ) : filtered.length === 0 ? (
            <EmptyState
              iconColor="var(--amber)" iconBg="var(--amber-bg)"
              icon={<svg width="22" height="22" fill="none" stroke="var(--amber)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
              title={isFiltered ? "No matching products" : "No products in inventory"}
              subtitle={isFiltered ? "Try adjusting your search or filter." : "Products appear here once a manufacturer dispatches them."}
            />
          ) : (
            <table className="tbl">
              <thead><tr>{["Product","Serial / Model","Warranty","Status",""].map(h=><th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map(p => {
                  const st = p.inventory_status || p.current_status;
                  return (
                    <tr key={p.product_id} className="tbl-row">
                      <td>
                        <div className="fs-14 fw-600 text-1">{p.product_name}</div>
                        {p.description && <div className="fs-12 text-4 mt-4" style={{ maxWidth:220,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.description}</div>}
                      </td>
                      <td><div className="mono fs-13 text-2">{p.serial_number}</div><div className="mono fs-11 text-4 mt-4">{p.model_no}</div></td>
                      <td><span className="fs-13 text-3">{p.warranty ? `${p.warranty} mo.` : "—"}</span></td>
                      <td><StatusBadge status={st} /></td>
                      <td>
                        <div className="acts">
                          <button className="btn btn-sm btn-blue" onClick={()=>handlePassport(p.product_id)} disabled={passportLoading}>Passport</button>
                          {st === "IN_SHOWROOM" && <button className="btn btn-sm btn-green" onClick={()=>setSellModal(p)}>Sell</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <TableFooter shown={filtered.length} total={inventory.length} label="products" filtered={isFiltered} />
        </div>
      </div>
      {sellModal && <SellModal product={sellModal} onClose={()=>setSellModal(null)} onSuccess={handleSaleSuccess} />}
      {passport  && <PassportModal passport={passport} onClose={()=>setPassport(null)} />}
    </DashboardLayout>
  );
}