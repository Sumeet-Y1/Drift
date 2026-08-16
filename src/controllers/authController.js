const authService = require('../services/authService');
const {
  requestSignupOtpSchema,
  verifySignupOtpSchema,
  loginSchema,
  refreshSchema,
  requestPasswordResetSchema,
  confirmPasswordResetSchema,
} = require('../validators/authValidator');

async function requestSignupOtpController(req, res) {
  const parsed = requestSignupOtpSchema.parse(req.body);
  const result = await authService.requestSignupOtp(parsed.username, parsed.email, parsed.password);
  res.status(200).json(result);
}

async function verifySignupOtpController(req, res) {
  const parsed = verifySignupOtpSchema.parse(req.body);
  const result = await authService.verifySignupOtp(parsed.email, parsed.otpCode);
  res.status(201).json(result);
}

async function loginController(req, res) {
  const parsed = loginSchema.parse(req.body);
  const result = await authService.login(parsed.email, parsed.password);
  res.status(200).json(result);
}

async function refreshController(req, res) {
  const parsed = refreshSchema.parse(req.body);
  const result = await authService.refreshAccessToken(parsed.refreshToken);
  res.status(200).json(result);
}

async function logoutController(req, res) {
  const parsed = refreshSchema.parse(req.body);
  const result = await authService.logout(parsed.refreshToken);
  res.status(200).json(result);
}

async function requestPasswordResetController(req, res) {
  const parsed = requestPasswordResetSchema.parse(req.body);
  const result = await authService.requestPasswordReset(parsed.email);
  res.status(200).json(result);
}

async function confirmPasswordResetController(req, res) {
  const parsed = confirmPasswordResetSchema.parse(req.body);
  const result = await authService.confirmPasswordReset(parsed.email, parsed.otpCode, parsed.newPassword);
  res.status(200).json(result);
}

module.exports = {
  requestSignupOtpController,
  verifySignupOtpController,
  loginController,
  refreshController,
  logoutController,
  requestPasswordResetController,
  confirmPasswordResetController,
};