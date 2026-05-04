import { useState } from "react";
import { registerUser, verifyRegisterOTP } from "./auth.api";
import { saveAuth } from "./useAuth";
import { Link, useNavigate } from "react-router-dom";
import { AppLogo } from "../shared/Logo";

const CATEGORIES = ["Electronics", "Furniture", "Textile", "Footwear"];

const ROLES = [
  { value: "CUSTOMER",     label: "Customer",     sub: "Track owned products",          icon: "👤" },
  { value: "MANUFACTURER", label: "Manufacturer", sub: "Create & dispatch products",    icon: "🏭" },
  { value: "SHOWROOM",     label: "Showroom",     sub: "Sell products to customers",    icon: "🏪" },
  { value: "REPAIR",       label: "Repair Shop",  sub: "Service & repair products",     icon: "🔧" },
];

const ROUTES = { MANUFACTURER: "/manufacturer", SHOWROOM: "/showroom", REPAIR: "/repair", CUSTOMER: "/customer" };

const ROLE_FIELDS = {
  MANUFACTURER: [
    { key: "company_name",  label: "Company name",  placeholder: "e.g. Apex Electronics Ltd." },
    { key: "factory_name",  label: "Factory name",  placeholder: "e.g. Apex Factory, Gazipur" },
    { key: "license_no",    label: "License number", placeholder: "e.g. BIDA-2024-001" },
  ],
  SHOWROOM: [
    { key: "showroom_name", label: "Showroom name", placeholder: "e.g. City Electronics" },
    { key: "location",      label: "Location",      placeholder: "e.g. Bashundhara City, Dhaka" },
    { key: "trade_license", label: "Trade license", placeholder: "e.g. TL-2024-5678" },
  ],
  REPAIR: [
    { key: "shop_name",     label: "Shop name",     placeholder: "e.g. Quick Fix Electronics" },
    { key: "location",      label: "Location",      placeholder: "e.g. Elephant Road, Dhaka" },
    { key: "certificate_no",label: "Certificate no.",placeholder: "e.g. CERT-2024-9999" },
  ],
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .auth-shell {
    min-height: 100vh; background: #f5f4f0;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Instrument Sans', sans-serif; padding: 32px 24px;
  }
  .auth-card {
    background: #fff; border: 1px solid #ebe9e2; border-radius: 20px;
    padding: 40px; width: 100%; max-width: 520px;
    box-shadow: 0 4px 32px rgba(0,0,0,0.06);
    animation: cardIn 0.22s cubic-bezier(.34,1.4,.64,1);
  }
  @keyframes cardIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .auth-logo {
    width: 42px; height: 42px; background: #111827; border-radius: 11px;
    display: flex; align-items: center; justify-content: center; margin-bottom: 24px;
  }
  .auth-title { font-size: 22px; font-weight: 700; color: #111827; letter-spacing: -0.02em; margin-bottom: 6px; }
  .auth-sub   { font-size: 14px; color: #6b7280; margin-bottom: 24px; line-height: 1.5; }
  .err-box {
    font-size: 13px; color: #dc2626; background: #fef2f2;
    border: 1px solid #fecaca; border-radius: 8px;
    padding: 10px 14px; margin-bottom: 16px;
  }

  .lbl {
    font-size: 11px; font-weight: 600; color: #6b7280;
    letter-spacing: 0.07em; text-transform: uppercase;
    display: block; margin-bottom: 7px;
  }
  .inp {
    width: 100%; padding: 11px 14px; border: 1px solid #e5e3dc; border-radius: 10px;
    background: #fafaf8; color: #111827; font-size: 14px; outline: none;
    transition: border-color 0.14s, box-shadow 0.14s;
    font-family: 'Instrument Sans', sans-serif;
  }
  .inp::placeholder { color: #9ca3af; }
  .inp:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); background: #fff; }

  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  /* Role selector */
  .role-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .role-btn {
    padding: 14px; border-radius: 10px; border: 1.5px solid #e5e3dc;
    background: #fafaf8; cursor: pointer; transition: all 0.14s;
    font-family: 'Instrument Sans', sans-serif; text-align: left;
    display: flex; flex-direction: column; gap: 4px;
  }
  .role-btn:hover { border-color: #9ca3af; background: #f5f4f0; }
  .role-btn.sel { border-color: #2563eb; background: #eff6ff; }
  .role-icon { font-size: 20px; margin-bottom: 4px; }
  .role-name { font-size: 13px; font-weight: 600; color: #111827; }
  .role-sub  { font-size: 11px; color: #6b7280; }

  /* Category selector */
  .cat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .cat-btn {
    padding: 10px 14px; border-radius: 9px; border: 1.5px solid #e5e3dc;
    background: #fafaf8; cursor: pointer; transition: all 0.14s;
    font-family: 'Instrument Sans', sans-serif; font-size: 13px;
    font-weight: 500; color: #374151; text-align: center;
  }
  .cat-btn:hover { border-color: #9ca3af; background: #f5f4f0; }
  .cat-btn.sel { border-color: #2563eb; background: #eff6ff; color: #2563eb; font-weight: 600; }

  /* Buttons */
  .btn-dark {
    width: 100%; padding: 11px; border-radius: 10px; border: none;
    background: #111827; color: #fff; font-size: 14px; font-weight: 600;
    cursor: pointer; transition: all 0.14s; font-family: 'Instrument Sans', sans-serif;
  }
  .btn-dark:hover:not(:disabled) { background: #1f2937; }
  .btn-dark:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-ghost {
    width: 100%; padding: 10px; border-radius: 10px;
    border: 1px solid #e5e3dc; background: transparent;
    color: #6b7280; font-size: 13px; cursor: pointer;
    font-family: 'Instrument Sans', sans-serif; margin-top: 8px; transition: all 0.14s;
  }
  .btn-ghost:hover { background: #f5f4f0; border-color: #9ca3af; }

  /* Step progress */
  .progress { display: flex; align-items: center; gap: 0; margin-bottom: 28px; }
  .prog-step {
    display: flex; align-items: center; gap: 8px; flex: 1;
  }
  .prog-dot {
    width: 28px; height: 28px; border-radius: 50%; border: 2px solid #e5e3dc;
    background: #fff; display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: #9ca3af; flex-shrink: 0;
    transition: all 0.2s;
  }
  .prog-dot.done { background: #111827; border-color: #111827; color: #fff; }
  .prog-dot.active { background: #fff; border-color: #2563eb; color: #2563eb; }
  .prog-line { flex: 1; height: 1px; background: #e5e3dc; margin: 0 4px; }
  .prog-line.done { background: #111827; }

  /* OTP */
  .otp-wrap { display: flex; gap: 10px; justify-content: center; margin-bottom: 8px; }
  .otp-box {
    width: 52px; height: 60px; border: 1.5px solid #e5e3dc; border-radius: 12px;
    text-align: center; font-size: 26px; font-weight: 700; color: #111827;
    font-family: 'DM Mono', monospace; background: #fafaf8; outline: none;
    transition: border-color 0.14s, box-shadow 0.14s;
  }
  .otp-box:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); background: #fff; }
  .email-pill {
    background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;
    padding: 10px 14px; font-size: 13px; color: #1d4ed8; font-weight: 500;
    margin-bottom: 24px; text-align: center; font-family: 'DM Mono', monospace;
  }
  .resend-row { text-align: center; margin-top: 10px; font-size: 13px; color: #6b7280; }
  .resend-btn {
    color: #2563eb; background: none; border: none; cursor: pointer;
    font-size: 13px; font-weight: 500; font-family: 'Instrument Sans', sans-serif; padding: 0;
  }
  .resend-btn:disabled { color: #9ca3af; cursor: not-allowed; }

  .divider { border: none; border-top: 1px solid #ebe9e2; margin: 20px 0; }
  .link { color: #2563eb; font-weight: 500; text-decoration: none; }
  .link:hover { text-decoration: underline; }
  .footer-txt { text-align: center; margin-top: 20px; font-size: 13px; color: #6b7280; }

  .section-title {
    font-size: 11px; font-weight: 600; color: #9ca3af;
    letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 12px;
  }
  .info-box {
    background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 9px;
    padding: 11px 14px; font-size: 13px; color: #059669; margin-bottom: 16px;
    line-height: 1.5;
  }
`;

const mask = (e) => {
  if (!e) return "";
  const [local, domain] = e.split("@");
  return `${local.slice(0, 2)}***@${domain}`;
};

const STEPS = {
  CUSTOMER:     ["role", "account", "otp"],
  MANUFACTURER: ["role", "account", "details", "otp"],
  SHOWROOM:     ["role", "account", "details", "otp"],
  REPAIR:       ["role", "account", "details", "otp"],
};

export default function Register() {
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState({
    name: "", phone: "", email: "", password: "", role: "CUSTOMER", category: "", roleDetails: {},
  });
  const [otpDigits, setOtpDigits] = useState(["","","","","",""]);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();

  const steps = STEPS[form.role] || STEPS.CUSTOMER;
  const currentStep = steps[stepIndex];
  const totalSteps  = steps.length;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setDetail = (k, v) => setForm(f => ({ ...f, roleDetails: { ...f.roleDetails, [k]: v } }));

  const startCooldown = () => {
    setCooldown(30);
    const t = setInterval(() => setCooldown(c => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
  };

  const next = () => { setError(""); setStepIndex(i => i + 1); };
  const back = () => { setError(""); setStepIndex(i => i - 1); };

  // ── Validate each step ──
  const validateStep = () => {
    if (currentStep === "role") {
      if (!form.role) { setError("Select an account type."); return false; }
      if (form.role !== "CUSTOMER" && !form.category) { setError("Select a category."); return false; }
    }
    if (currentStep === "account") {
      if (!form.name.trim()) { setError("Enter your full name."); return false; }
      if (!form.email.trim()) { setError("Enter your email address."); return false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError("Enter a valid email address."); return false; }
      if (!form.password || form.password.length < 6) { setError("Password must be at least 6 characters."); return false; }
    }
    if (currentStep === "details") {
      const fields = ROLE_FIELDS[form.role] || [];
      for (const f of fields) {
        if (!form.roleDetails[f.key]?.trim()) { setError(`${f.label} is required.`); return false; }
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (currentStep === "details") {
      handleSubmit();
    } else {
      next();
    }
  };

  // ── Submit to server ──
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await registerUser(form);
      const data = res.data;
      if (data.requireOTP) {
        next();
        startCooldown();
      } else {
        saveAuth(data);
        navigate(ROUTES[data.user.role] || "/");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    } finally { setLoading(false); }
  };

  // For CUSTOMER role, account step directly submits
  const handleAccountNext = () => {
    if (!validateStep()) return;
    if (form.role === "CUSTOMER") {
      handleSubmit();
    } else {
      next();
    }
  };

  // ── OTP handlers ──
  const handleVerify = async () => {
    const otp = otpDigits.join("");
    if (otp.length < 6) { setError("Enter the full 6-digit code."); return; }
    setError(""); setLoading(true);
    try {
      const res = await verifyRegisterOTP({ email: form.email, otp });
      saveAuth(res.data);
      navigate(ROUTES[res.data.user.role] || "/");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid or expired code");
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await registerUser(form);
      setOtpDigits(["","","","","",""]);
      startCooldown();
    } catch { setError("Could not resend code"); }
    finally { setLoading(false); }
  };

  const handleDigit = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otpDigits]; next[i] = val; setOtpDigits(next);
    if (val && i < 5) document.getElementById(`rd-${i+1}`)?.focus();
  };
  const handleKey = (i, e) => {
    if (e.key === "Backspace" && !otpDigits[i] && i > 0) document.getElementById(`rd-${i-1}`)?.focus();
  };
  const handlePaste = (e) => {
    const p = e.clipboardData.getData("text").replace(/\D/g,"").slice(0,6);
    if (p.length === 6) { setOtpDigits(p.split("")); document.getElementById("rd-5")?.focus(); e.preventDefault(); }
  };

  // ── Progress bar ──
  const ProgressBar = () => {
    const labels = { role: "Role", account: "Account", details: "Details", otp: "Verify" };
    return (
      <div className="progress">
        {steps.map((s, i) => (
          <div key={s} className="prog-step">
            <div className={`prog-dot ${i < stepIndex ? "done" : i === stepIndex ? "active" : ""}`}>
              {i < stepIndex ? "✓" : i + 1}
            </div>
            {i < steps.length - 1 && <div className={`prog-line${i < stepIndex ? " done" : ""}`} />}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <style>{css}</style>
      <div className="auth-shell">
        <div className="auth-card">


          <ProgressBar />

          {error && <div className="err-box">{error}</div>}

          {/* ── Step: Role & Category ── */}
          {currentStep === "role" && (
            <>
              <div className="auth-title">Create account</div>
              <div className="auth-sub">Select your account type to get started.</div>

              <div className="section-title">Account type</div>
              <div className="role-grid" style={{ marginBottom: 20 }}>
                {ROLES.map(r => (
                  <button key={r.value} className={`role-btn${form.role === r.value ? " sel" : ""}`}
                    onClick={() => set("role", r.value)}>
                    <span className="role-icon">{r.icon}</span>
                    <span className="role-name">{r.label}</span>
                    <span className="role-sub">{r.sub}</span>
                  </button>
                ))}
              </div>

              {form.role !== "CUSTOMER" && (
                <>
                  <div className="divider" />
                  <div className="section-title" style={{ marginTop: 16 }}>Category</div>
                  <div className="cat-grid" style={{ marginBottom: 20 }}>
                    {CATEGORIES.map(c => (
                      <button key={c} className={`cat-btn${form.category === c ? " sel" : ""}`}
                        onClick={() => set("category", c)}>
                        {c}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <button className="btn-dark" onClick={handleNext}>Continue</button>
              <p className="footer-txt">Already have an account? <Link to="/" className="link">Sign in</Link></p>
            </>
          )}

          {/* ── Step: Account info ── */}
          {currentStep === "account" && (
            <>
              <div className="auth-title">Your details</div>
              <div className="auth-sub">Set up your personal account credentials.</div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="grid-2">
                  <div>
                    <label className="lbl">Full name *</label>
                    <input className="inp" placeholder="Ahmed Rahman"
                      value={form.name} onChange={e => set("name", e.target.value)} />
                  </div>
                  <div>
                    <label className="lbl">Phone (optional)</label>
                    <input className="inp" placeholder="01XXXXXXXXX"
                      value={form.phone} onChange={e => set("phone", e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="lbl">Email address *</label>
                  <input className="inp" type="email" placeholder="you@example.com"
                    value={form.email} onChange={e => set("email", e.target.value)} />
                </div>
                <div>
                  <label className="lbl">Password *</label>
                  <input className="inp" type="password" placeholder="At least 6 characters"
                    value={form.password} onChange={e => set("password", e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAccountNext()} />
                </div>
                <button className="btn-dark" style={{ marginTop: 4 }}
                  onClick={handleAccountNext} disabled={loading}>
                  {loading ? "Please wait..." : "Continue"}
                </button>
              </div>
              <button className="btn-ghost" onClick={back}>← Back</button>
            </>
          )}

          {/* ── Step: Role-specific details ── */}
          {currentStep === "details" && (
            <>
              <div className="auth-title">
                {form.role === "MANUFACTURER" && "Company details"}
                {form.role === "SHOWROOM"     && "Showroom details"}
                {form.role === "REPAIR"       && "Shop details"}
              </div>
              <div className="auth-sub">Tell us about your business.</div>

              {form.category && (
                <div className="info-box">
                  Category: <strong>{form.category}</strong> — you will only see showrooms and products in this category.
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {(ROLE_FIELDS[form.role] || []).map(f => (
                  <div key={f.key}>
                    <label className="lbl">{f.label} *</label>
                    <input className="inp" placeholder={f.placeholder}
                      value={form.roleDetails[f.key] || ""}
                      onChange={e => setDetail(f.key, e.target.value)} />
                  </div>
                ))}
                <button className="btn-dark" style={{ marginTop: 4 }}
                  onClick={handleNext} disabled={loading}>
                  {loading ? "Creating account..." : "Create account"}
                </button>
              </div>
              <button className="btn-ghost" onClick={back}>← Back</button>
            </>
          )}

          {/* ── Step: OTP ── */}
          {currentStep === "otp" && (
            <>
              <div className="auth-title">Verify your email</div>
              <div className="auth-sub">Enter the 6-digit code we sent to</div>
              <div className="email-pill">{mask(form.email)}</div>

              <div className="otp-wrap" onPaste={handlePaste}>
                {otpDigits.map((d, i) => (
                  <input key={i} id={`rd-${i}`} className="otp-box"
                    type="text" inputMode="numeric" maxLength={1}
                    value={d} onChange={e => handleDigit(i, e.target.value)}
                    onKeyDown={e => handleKey(i, e)} autoFocus={i === 0} />
                ))}
              </div>

              <div className="resend-row">
                <button className="resend-btn" onClick={handleResend} disabled={cooldown > 0 || loading}>
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
              </div>

              <button className="btn-dark" style={{ marginTop: 20 }}
                onClick={handleVerify} disabled={loading || otpDigits.join("").length < 6}>
                {loading ? "Verifying..." : "Verify & Continue"}
              </button>
            </>
          )}

        </div>
      </div>
    </>
  );
}