const googleAuthService = require('../services/googleAuthService');
const { z } = require('zod');

const googleLoginSchema = z.object({
  idToken: z.string().min(1),
});

async function googleLoginController(req, res) {
  const parsed = googleLoginSchema.parse(req.body);
  const result = await googleAuthService.loginWithGoogle(parsed.idToken);
  res.status(200).json(result);
}

module.exports = { googleLoginController };