import { useState } from "react";
import { registerUser, verifyRegisterOTP } from "./auth.api";
import { saveAuth } from "./useAuth";
import { Link, useNavigate } from "react-router-dom";
import "../../src/styles/dashboard.css";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
  .auth-shell {
    min-height: 100vh; background: #f5f4f0;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Instrument Sans', sans-serif; padding: 24px;
  }
  .auth-card {
    background: #ffffff; border: 1px solid #ebe9e2; border-radius: 20px;
    padding: 40px; width: 100%; max-width: 460px;
    box-shadow: 0 4px 32px rgba(0,0,0,0.06);
  }
  .auth-logo {
    width: 42px; height: 42px; background: #111827;
    border-radius: 11px; display: flex; align-items: center;
    justify-content: center; margin-bottom: 28px;
  }
  .auth-title { font-size: 22px; font-weight: 700; color: #111827; letter-spacing: -0.02em; margin-bottom: 6px; }
  .auth-sub   { font-size: 14px; color: #6b7280; margin-bottom: 28px; line-height: 1.5; }
  .auth-err   { font-size: 13px; color: #dc2626; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; }

  .role-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 4px; }
  .role-btn {
    padding: 12px 16px; border-radius: 10px; border: 1.5px solid #e5e3dc;
    background: #fafaf8; cursor: pointer; transition: all 0.14s;
    font-family: 'Instrument Sans', sans-serif; text-align: left;
  }
  .role-btn:hover { border-color: #9ca3af; background: #f5f4f0; }
  .role-btn.selected { border-color: #2563eb; background: #eff6ff; }
  .role-btn-name { font-size: 13px; font-weight: 600; color: #111827; display: block; }
  .role-btn-sub  { font-size: 11px; color: #6b7280; margin-top: 2px; display: block; }

  .otp-inputs { display: flex; gap: 10px; justify-content: center; margin-bottom: 8px; }
  .otp-digit {
    width: 52px; height: 60px; border: 1.5px solid #e5e3dc; border-radius: 12px;
    text-align: center; font-size: 24px; font-weight: 700; color: #111827;
    font-family: 'DM Mono', monospace; background: #fafaf8; outline: none;
    transition: border-color 0.14s, box-shadow 0.14s;
  }
  .otp-digit:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); background: #fff; }

  .email-highlight {
    background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;
    padding: 10px 14px; font-size: 13px; color: #1d4ed8;
    font-weight: 500; margin-bottom: 24px; text-align: center;
    font-family: 'DM Mono', monospace;
  }
  .resend-row { text-align: center; margin-top: 12px; font-size: 13px; color: #6b7280; }
  .resend-btn { color: #2563eb; background: none; border: none; cursor: pointer; font-size: 13px; font-weight: 500; font-family: 'Instrument Sans', sans-serif; padding: 0; }
  .resend-btn:disabled { color: #9ca3af; cursor: not-allowed; }

  .step-indicator { display: flex; align-items: center; gap: 8px; margin-bottom: 28px; }
  .step-dot  { width: 8px; height: 8px; border-radius: 50%; transition: background 0.2s; }
  .step-line { flex: 1; height: 1px; background: #e5e3dc; }
`;

const ROLES = [
  { value: "CUSTOMER",     label: "Customer",     sub: "Own and track products" },
  { value: "MANUFACTURER", label: "Manufacturer", sub: "Create and dispatch products" },
  { value: "SHOWROOM",     label: "Showroom",     sub: "Sell products to customers" },
  { value: "REPAIR",       label: "Repair Shop",  sub: "Service and repair products" },
];

export default function Register() {
  const [step, setStep]   = useState("details"); // details | otp
  const [form, setForm]   = useState({ name: "", phone: "", email: "", password: "", role: "CUSTOMER" });
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleRegister = async () => {
    setError("");
    if (!form.name || !form.phone || !form.email || !form.password) {
      setError("Please fill in all fields."); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Enter a valid email address."); return;
    }
    setLoading(true);
    try {
      await registerUser(form);
      setStep("otp");
      startResendCooldown();
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    } finally { setLoading(false); }
  };

  const handleOTPVerify = async () => {
    const otp = otpDigits.join("");
    if (otp.length < 6) { setError("Enter the full 6-digit code."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await verifyRegisterOTP({ email: form.email, otp });
      saveAuth(res.data);
      const routes = { MANUFACTURER: "/manufacturer", SHOWROOM: "/showroom", REPAIR: "/repair", CUSTOMER: "/customer" };
      navigate(routes[res.data.user.role] || "/login");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid or expired OTP");
    } finally { setLoading(false); }
  };

  const handleOTPInput = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otpDigits];
    next[index] = value;
    setOtpDigits(next);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOTPKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleOTPPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtpDigits(pasted.split(""));
      document.getElementById("otp-5")?.focus();
      e.preventDefault();
    }
  };

  const startResendCooldown = () => {
    setResendCooldown(30);
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    setError("");
    setLoading(true);
    try {
      await registerUser(form);
      setOtpDigits(["", "", "", "", "", ""]);
      startResendCooldown();
    } catch (err) {
      setError("Could not resend OTP");
    } finally { setLoading(false); }
  };

  const maskEmail = (e) => {
    if (!e) return "";
    const [local, domain] = e.split("@");
    return `${local.slice(0, 2)}***@${domain}`;
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

          {/* Step indicator */}
          <div className="step-indicator">
            <div className="step-dot" style={{ background: "#111827" }} />
            <div className="step-line" />
            <div className="step-dot" style={{ background: step === "otp" ? "#111827" : "#e5e3dc" }} />
          </div>

          {/* ── Step 1: Details ── */}
          {step === "details" && (
            <>
              <div className="auth-title">Create account</div>
              <div className="auth-sub">Join the DPP system. We'll verify your email with a one-time code.</div>

              {error && <div className="auth-err">{error}</div>}

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="grid-2">
                  <div>
                    <label className="lbl">Full name</label>
                    <input className="inp" placeholder="Ahmed Rahman"
                      value={form.name} onChange={e => set("name", e.target.value)} />
                  </div>
                  <div>
                    <label className="lbl">Phone number</label>
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
                    value={form.password} onChange={e => set("password", e.target.value)} />
                </div>

                <div>
                  <label className="lbl">Account type</label>
                  <div className="role-grid">
                    {ROLES.map(r => (
                      <button
                        key={r.value}
                        className={`role-btn${form.role === r.value ? " selected" : ""}`}
                        onClick={() => set("role", r.value)}
                      >
                        <span className="role-btn-name">{r.label}</span>
                        <span className="role-btn-sub">{r.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button className="btn btn-dark" style={{ width: "100%", marginTop: 4, justifyContent: "center" }}
                  onClick={handleRegister} disabled={loading}>
                  {loading ? "Creating account..." : "Create account"}
                </button>
              </div>

              <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#6b7280" }}>
                Already have an account?{" "}
                <Link to="/" style={{ color: "#2563eb", fontWeight: 500, textDecoration: "none" }}>
                  Sign in
                </Link>
              </p>
            </>
          )}

          {/* ── Step 2: OTP ── */}
          {step === "otp" && (
            <>
              <div className="auth-title">Verify your email</div>
              <div className="auth-sub">We sent a 6-digit code to</div>
              <div className="email-highlight">{maskEmail(form.email)}</div>

              {error && <div className="auth-err">{error}</div>}

              <div className="otp-inputs" onPaste={handleOTPPaste}>
                {otpDigits.map((d, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    className="otp-digit"
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => handleOTPInput(i, e.target.value)}
                    onKeyDown={e => handleOTPKeyDown(i, e)}
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              <div className="resend-row">
                <button className="resend-btn" onClick={handleResend}
                  disabled={resendCooldown > 0 || loading}>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                </button>
              </div>

              <button className="btn btn-dark" style={{ width: "100%", marginTop: 20, justifyContent: "center" }}
                onClick={handleOTPVerify} disabled={loading || otpDigits.join("").length < 6}>
                {loading ? "Verifying..." : "Verify & Continue"}
              </button>

              <button onClick={() => { setStep("details"); setError(""); setOtpDigits(["","","","","",""]); }}
                style={{ width: "100%", marginTop: 10, background: "none", border: "none", color: "#6b7280", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                ← Back
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}