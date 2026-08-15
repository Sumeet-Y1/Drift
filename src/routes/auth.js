const express = require('express');
const router = express.Router();
const {
  signupController,
  loginController,
  refreshController,
  logoutController,
} = require('../controllers/authController');

router.post('/signup', signupController);
router.post('/login', loginController);
router.post('/refresh', refreshController);
router.post('/logout', logoutController);

module.exports = router;