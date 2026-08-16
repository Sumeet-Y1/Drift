const express = require('express');
const router = express.Router();
const {
  requestSignupOtpController,
  verifySignupOtpController,
  loginController,
  refreshController,
  logoutController,
  requestPasswordResetController,
  confirmPasswordResetController,
} = require('../controllers/authController');

router.post('/signup/request-otp', requestSignupOtpController);
router.post('/signup/verify-otp', verifySignupOtpController);
router.post('/login', loginController);
router.post('/refresh', refreshController);
router.post('/logout', logoutController);
router.post('/password-reset/request', requestPasswordResetController);
router.post('/password-reset/confirm', confirmPasswordResetController);

module.exports = router;