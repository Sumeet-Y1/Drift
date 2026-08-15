const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getUploadUrlController } = require('../controllers/uploadController');

router.use(authMiddleware);

router.post('/request-url', getUploadUrlController);

module.exports = router;