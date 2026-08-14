const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  createServerController,
  joinServerController,
  listUserServersController,
  createChannelController,
  listChannelsController,
  leaveServerController,
  kickMemberController,
  deleteServerController,
} = require('../controllers/serverController');

router.use(authMiddleware);

router.post('/', createServerController);
router.get('/', listUserServersController);
router.post('/join/:inviteCode', joinServerController);
router.post('/:serverId/channels', createChannelController);
router.get('/:serverId/channels', listChannelsController);
router.delete('/:serverId/leave', leaveServerController);
router.delete('/:serverId/members/:userId', kickMemberController);
router.delete('/:serverId', deleteServerController);

module.exports = router;