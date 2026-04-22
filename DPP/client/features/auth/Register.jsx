import { useState } from "react";
import { registerUser, verifyRegisterOTP } from "./auth.api";
import { saveAuth } from "./useAuth";
import { Link, useNavigate } from "react-router-dom";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');

  .auth-shell {
    min-height: 100vh; background: #f5f4f0;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Instrument Sans', sans-serif; padding: 24px;
  }
  .auth-card {
    background: #fff; border: 1px solid #ebe9e2; border-radius: 20px;
    padding: 40px; width: 100%; max-width: 460px;
    box-shadow: 0 4px 32px rgba(0,0,0,0.06);
    animation: cardIn 0.22s cubic-bezier(.34,1.4,.64,1);
  }
  @keyframes cardIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .auth-logo {
    width: 42px; height: 42px; background: #111827; border-radius: 11px;
    display: flex; align-items: center; justify-content: center; margin-bottom: 28px;
  }
  .auth-title { font-size: 22px; font-weight: 700; color: #111827; letter-spacing: -0.02em; margin-bottom: 6px; }
  .auth-sub   { font-size: 14px; color: #6b7280; margin-bottom: 28px; line-height: 1.5; }
  .auth-err   {
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
    font-family: 'Instrument Sans', sans-serif; box-sizing: border-box;
  }
  .inp::placeholder { color: #9ca3af; }
  .inp:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); background: #fff; }

  .role-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .role-btn {
    padding: 12px 14px; border-radius: 10px; border: 1.5px solid #e5e3dc;
    background: #fafaf8; cursor: pointer; transition: all 0.14s;
    font-family: 'Instrument Sans', sans-serif; text-align: left;
  }
  .role-btn:hover { border-color: #9ca3af; background: #f5f4f0; }
  .role-btn.sel { border-color: #2563eb; background: #eff6ff; }
  .role-name { font-size: 13px; font-weight: 600; color: #111827; display: block; }
  .role-sub  { font-size: 11px; color: #6b7280; margin-top: 2px; display: block; }

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

  .steps { display: flex; align-items: center; gap: 8px; margin-bottom: 28px; }
  .step-dot  { width: 8px; height: 8px; border-radius: 50%; transition: background 0.2s; }
  .step-line { flex: 1; height: 1px; background: #e5e3dc; }

  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .link { color: #2563eb; font-weight: 500; text-decoration: none; }
  .link:hover { text-decoration: underline; }
  .footer-txt { text-align: center; margin-top: 20px; font-size: 13px; color: #6b7280; }
`;

const ROLES = [
  { value: "CUSTOMER",     label: "Customer",     sub: "Track owned products" },
  { value: "MANUFACTURER", label: "Manufacturer", sub: "Create & dispatch products" },
  { value: "SHOWROOM",     label: "Showroom",     sub: "Sell products to customers" },
  { value: "REPAIR",       label: "Repair Shop",  sub: "Service & repair products" },
];

const ROUTES = { MANUFACTURER: "/manufacturer", SHOWROOM: "/showroom", REPAIR: "/repair", CUSTOMER: "/customer" };

const mask = (e) => {
  if (!e) return "";
  const [local, domain] = e.split("@");
  return `${local.slice(0, 2)}***@${domain}`;
};

export default function Register() {
  const [step, setStep] = useState("details");
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "", role: "CUSTOMER" });
  const [otpDigits, setOtpDigits] = useState(["","","","","",""]);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const startCooldown = () => {
    setCooldown(30);
    const t = setInterval(() => setCooldown(c => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
  };

  const handleRegister = async () => {
    setError("");
    if (!form.name || !form.email || !form.password) { setError("Name, email and password are required."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError("Enter a valid email address."); return; }
    setLoading(true);
    try {
      const res = await registerUser(form);
      const data = res.data;
      if (data.requireOTP) {
        setStep("otp");
        startCooldown();
      } else {
        // Dev mode — registered and logged in immediately
        saveAuth(data);
        navigate(ROUTES[data.user.role] || "/");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    } finally { setLoading(false); }
  };

  const handleVerify = async () => {
    const otp = otpDigits.join("");
    if (otp.length < 6) { setError("Enter the full 6-digit code."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await verifyRegisterOTP({ email: form.email, otp });
      saveAuth(res.data);
      navigate(ROUTES[res.data.user.role] || "/");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid or expired code");
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setError("");
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
    if (e.key === "Backspace" && !otpDigits[i] && i > 0)
      document.getElementById(`rd-${i-1}`)?.focus();
    if (e.key === "Enter" && step === "details") handleRegister();
  };

  const handlePaste = (e) => {
    const p = e.clipboardData.getData("text").replace(/\D/g,"").slice(0,6);
    if (p.length === 6) { setOtpDigits(p.split("")); document.getElementById("rd-5")?.focus(); e.preventDefault(); }
  };

  return (
    <>
      <style>{css}</style>
      <div className="auth-shell">
        <div className="auth-card">

          <div className="auth-logo">
            <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>

          {step === "otp" && (
            <div className="steps">
              <div className="step-dot" style={{ background: "#111827" }} />
              <div className="step-line" />
              <div className="step-dot" style={{ background: "#111827" }} />
            </div>
          )}

          {/* ── Details step ── */}
          {step === "details" && (
            <>
              <div className="auth-title">Create account</div>
              <div className="auth-sub">Join the DPP system to track products across the supply chain.</div>

              {error && <div className="auth-err">{error}</div>}

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="grid-2">
                  <div>
                    <label className="lbl">Full name</label>
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
                  <label className="lbl">Email address</label>
                  <input className="inp" type="email" placeholder="you@example.com"
                    value={form.email} onChange={e => set("email", e.target.value)} />
                </div>

                <div>
                  <label className="lbl">Password</label>
                  <input className="inp" type="password" placeholder="Create a strong password"
                    value={form.password} onChange={e => set("password", e.target.value)}
                    onKeyDown={e => handleKey(0, e)} />
                </div>

                <div>
                  <label className="lbl">Account type</label>
                  <div className="role-grid">
                    {ROLES.map(r => (
                      <button key={r.value}
                        className={`role-btn${form.role === r.value ? " sel" : ""}`}
                        onClick={() => set("role", r.value)}>
                        <span className="role-name">{r.label}</span>
                        <span className="role-sub">{r.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button className="btn-dark" onClick={handleRegister} disabled={loading} style={{ marginTop: 4 }}>
                  {loading ? "Creating account..." : "Create account"}
                </button>
              </div>

              <p className="footer-txt">
                Already have an account? <Link to="/" className="link">Sign in</Link>
              </p>
            </>
          )}

          {/* ── OTP step ── */}
          {step === "otp" && (
            <>
              <div className="auth-title">Verify your email</div>
              <div className="auth-sub">Enter the 6-digit code we sent to</div>
              <div className="email-pill">{mask(form.email)}</div>

              {error && <div className="auth-err">{error}</div>}

              <div className="otp-wrap" onPaste={handlePaste}>
                {otpDigits.map((d, i) => (
                  <input key={i} id={`rd-${i}`} className="otp-box"
                    type="text" inputMode="numeric" maxLength={1}
                    value={d}
                    onChange={e => handleDigit(i, e.target.value)}
                    onKeyDown={e => handleKey(i, e)}
                    autoFocus={i === 0} />
                ))}
              </div>

              <div className="resend-row">
                <button className="resend-btn" onClick={handleResend}
                  disabled={cooldown > 0 || loading}>
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
              </div>

              <button className="btn-dark" style={{ marginTop: 20 }}
                onClick={handleVerify}
                disabled={loading || otpDigits.join("").length < 6}>
                {loading ? "Verifying..." : "Verify & Continue"}
              </button>
              <button className="btn-ghost"
                onClick={() => { setStep("details"); setError(""); setOtpDigits(["","","","","",""]); }}>
                ← Back
              </button>
            </>
          )}

        </div>
      </div>
    </>
  );
}