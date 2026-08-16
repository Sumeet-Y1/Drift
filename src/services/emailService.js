const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = 'Drift <onboarding@resend.dev>';

async function sendOtpEmail(toEmail, otpCode) {
  const result = await resend.emails.send({
    from: FROM_ADDRESS,
    to: toEmail,
    subject: 'Your Drift verification code',
    html: '<p>Your verification code is:</p><h2>' + otpCode + '</h2><p>This code expires in 10 minutes.</p>',
  });

  if (result.error) {
    const err = new Error('Failed to send verification email: ' + result.error.message);
    err.statusCode = 502;
    throw err;
  }

  return result;
}

async function sendPasswordResetEmail(toEmail, resetToken) {
  const result = await resend.emails.send({
    from: FROM_ADDRESS,
    to: toEmail,
    subject: 'Reset your Drift password',
    html: '<p>Your password reset code is:</p><h2>' + resetToken + '</h2><p>This code expires in 15 minutes. If you did not request this, you can ignore this email.</p>',
  });

  if (result.error) {
    const err = new Error('Failed to send password reset email: ' + result.error.message);
    err.statusCode = 502;
    throw err;
  }

  return result;
}

module.exports = { sendOtpEmail, sendPasswordResetEmail };