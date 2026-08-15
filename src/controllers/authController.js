const authService = require('../services/authService');
const { signupSchema, loginSchema, refreshSchema } = require('../validators/authValidator');

async function signupController(req, res) {
  const parsed = signupSchema.parse(req.body);
  const result = await authService.signup(parsed.username, parsed.email, parsed.password);
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

module.exports = { signupController, loginController, refreshController, logoutController };