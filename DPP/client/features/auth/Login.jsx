import { useState } from "react";
import { loginUser, verifyLoginOTP } from "./auth.api";
import { saveAuth } from "./useAuth";
import { useNavigate, Link } from "react-router-dom";
import "../../src/styles/dashboard.css";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');

  .auth-shell {
    min-height: 100vh;
    background: #f5f4f0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Instrument Sans', sans-serif;
    padding: 24px;
  }
  .auth-card {
    background: #ffffff;
    border: 1px solid #ebe9e2;
    border-radius: 20px;
    padding: 40px;
    width: 100%;
    max-width: 420px;
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

  .otp-inputs { display: flex; gap: 10px; justify-content: center; margin-bottom: 8px; }
  .otp-digit {
    width: 52px; height: 60px; border: 1.5px solid #e5e3dc; border-radius: 12px;
    text-align: center; font-size: 24px; font-weight: 700; color: #111827;
    font-family: 'DM Mono', monospace; background: #fafaf8; outline: none;
    transition: border-color 0.14s, box-shadow 0.14s;
  }
  .otp-digit:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); background: #fff; }

  .resend-row { text-align: center; margin-top: 12px; font-size: 13px; color: #6b7280; }
  .resend-btn { color: #2563eb; background: none; border: none; cursor: pointer; font-size: 13px; font-weight: 500; font-family: 'Instrument Sans', sans-serif; padding: 0; }
  .resend-btn:disabled { color: #9ca3af; cursor: not-allowed; }

  .email-highlight {
    background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;
    padding: 10px 14px; font-size: 13px; color: #1d4ed8;
    font-weight: 500; margin-bottom: 24px; text-align: center;
    font-family: 'DM Mono', monospace;
  }

  .step-indicator { display: flex; align-items: center; gap: 8px; margin-bottom: 28px; }
  .step-dot { width: 8px; height: 8px; border-radius: 50%; transition: background 0.2s; }
  .step-line { flex: 1; height: 1px; background: #e5e3dc; }
`;

const ROLE_LABELS = {
  MANUFACTURER: "Manufacturer",
  SHOWROOM:     "Showroom",
  REPAIR:       "Repair Shop",
  CUSTOMER:     "Customer",
};

export default function Login() {
  const [step, setStep]       = useState("credentials"); // credentials | otp
  const [phone, setPhone]     = useState("");
  const [password, setPassword] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [email, setEmail]     = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();

  const handleCredentials = async () => {
    setError("");
    if (!phone || !password) { setError("Enter your phone and password."); return; }
    setLoading(true);
    try {
      const res = await loginUser({ phone, password });
      setEmail(res.data.email);
      setStep("otp");
      startResendCooldown();
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally { setLoading(false); }
  };

  const handleOTPVerify = async () => {
    const otp = otpDigits.join("");
    if (otp.length < 6) { setError("Enter the full 6-digit code."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await verifyLoginOTP({ email, otp });
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
      await loginUser({ phone, password });
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

          {/* ── Step 1: Credentials ── */}
          {step === "credentials" && (
            <>
              <div className="auth-title">Welcome back</div>
              <div className="auth-sub">Sign in to your DPP account. We'll send a verification code to your email.</div>

              {error && <div className="auth-err">{error}</div>}

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label className="lbl">Phone number</label>
                  <input className="inp" placeholder="01XXXXXXXXX"
                    value={phone} onChange={e => setPhone(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCredentials()} />
                </div>
                <div>
                  <label className="lbl">Password</label>
                  <input className="inp" type="password" placeholder="Your password"
                    value={password} onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCredentials()} />
                </div>
                <button className="btn btn-dark" style={{ width: "100%", marginTop: 4, justifyContent: "center" }}
                  onClick={handleCredentials} disabled={loading}>
                  {loading ? "Checking..." : "Continue"}
                </button>
              </div>

              <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#6b7280" }}>
                No account?{" "}
                <Link to="/register" style={{ color: "#2563eb", fontWeight: 500, textDecoration: "none" }}>
                  Register
                </Link>
              </p>
            </>
          )}

          {/* ── Step 2: OTP ── */}
          {step === "otp" && (
            <>
              <div className="auth-title">Check your email</div>
              <div className="auth-sub">We sent a 6-digit verification code to</div>
              <div className="email-highlight">{maskEmail(email)}</div>

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
                {loading ? "Verifying..." : "Verify & Sign In"}
              </button>

              <button onClick={() => { setStep("credentials"); setError(""); setOtpDigits(["","","","","",""]); }}
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