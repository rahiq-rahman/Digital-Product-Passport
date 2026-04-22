// In-memory OTP store — maps email -> { otp, expiresAt }
// For production use Redis instead
const store = new Map();

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
};

const saveOTP = (email, otp) => {
  store.set(email.toLowerCase(), {
    otp,
    expiresAt: Date.now() + OTP_TTL_MS,
  });
};

const verifyOTP = (email, otp) => {
  const entry = store.get(email.toLowerCase());
  if (!entry) return { valid: false, reason: 'No OTP found for this email' };
  if (Date.now() > entry.expiresAt) {
    store.delete(email.toLowerCase());
    return { valid: false, reason: 'OTP has expired' };
  }
  if (entry.otp !== otp) {
    return { valid: false, reason: 'Incorrect OTP' };
  }
  store.delete(email.toLowerCase()); // one-time use
  return { valid: true };
};

module.exports = { generateOTP, saveOTP, verifyOTP };