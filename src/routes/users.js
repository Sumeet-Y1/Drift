const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getProfileController, setAvatarController } = require('../controllers/userController');

router.use(authMiddleware);

router.get('/me', getProfileController);
router.post('/me/avatar', setAvatarController);

module.exports = router;