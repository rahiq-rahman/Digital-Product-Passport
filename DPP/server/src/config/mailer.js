const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTPEmail = async (to, otp) => {
  await transporter.sendMail({
    from: `"DPP System" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your DPP System verification code',
    html: `
      <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 32px; background: #ffffff; border: 1px solid #e8e5de; border-radius: 16px;">
        <div style="margin-bottom: 32px;">
          <div style="width: 40px; height: 40px; background: #111827; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <span style="color: white; font-size: 18px;">⬡</span>
          </div>
          <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 8px;">Verification code</h1>
          <p style="font-size: 14px; color: #6b7280; margin: 0;">Use the code below to verify your identity. It expires in <strong>10 minutes</strong>.</p>
        </div>
        <div style="background: #f5f4f0; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px;">
          <span style="font-family: 'Courier New', monospace; font-size: 38px; font-weight: 700; letter-spacing: 12px; color: #111827;">${otp}</span>
        </div>
        <p style="font-size: 13px; color: #9ca3af; margin: 0;">If you didn't request this code, you can safely ignore this email. Do not share this code with anyone.</p>
      </div>
    `,
  });
};

module.exports = { sendOTPEmail };