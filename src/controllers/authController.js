const authService = require('../services/authService');
const { signupSchema, loginSchema } = require('../validators/authValidator');

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

module.exports = { signupController, loginController };
