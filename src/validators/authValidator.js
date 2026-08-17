const { z } = require('zod');
const disposableDomains = require('disposable-email-domains');

const disposableDomainSet = new Set(disposableDomains);

function isDisposableEmail(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? disposableDomainSet.has(domain) : false;
}

const requestSignupOtpSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email().refine((email) => !isDisposableEmail(email), {
    message: 'Disposable email addresses are not allowed',
  }),
  password: z.string().min(6),
});

const verifySignupOtpSchema = z.object({
  email: z.string().email(),
  otpCode: z.string().length(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const requestPasswordResetSchema = z.object({
  email: z.string().email(),
});

const confirmPasswordResetSchema = z.object({
  email: z.string().email(),
  otpCode: z.string().length(6),
  newPassword: z.string().min(6),
});

module.exports = {
  requestSignupOtpSchema,
  verifySignupOtpSchema,
  loginSchema,
  refreshSchema,
  requestPasswordResetSchema,
  confirmPasswordResetSchema,
};