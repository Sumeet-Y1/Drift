const { verifyToken } = require('../utils/token');
const prisma = require('../config/db');
const messageService = require('../services/messageService');
const conversationService = require('../services/conversationService');
const presence = require('./presence');

function initChatSockets(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth && socket.handshake.auth.token;

    if (!token) {
      return next(new Error('No token provided'));
    }

    try {
      const decoded = verifyToken(token);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  async function broadcastPresence(userId, status) {
    const relevantUserIds = await presence.getRelevantUserIds(userId);

    for (const targetUserId of relevantUserIds) {
      io.to('user:' + targetUserId).emit('presence_update', { userId, status });
    }
  }

  io.on('connection', async (socket) => {
    const userId = socket.user.userId;
    console.log('User connected: ' + socket.user.username + ' (' + socket.id + ')');

    // Personal room — lets us target this specific user across all their tabs/devices
    socket.join('user:' + userId);

    presence.markOnline(userId, socket.id, (idleUserId) => {
      broadcastPresence(idleUserId, 'idle');
    });
    broadcastPresence(userId, 'online');

    // Let the client ask for current status of a list of users (e.g. on app load)
    socket.on('get_presence', (userIds, callback) => {
      const statuses = {};
      for (const id of userIds) {
        statuses[id] = presence.getStatus(id);
      }
      if (typeof callback === 'function') callback(statuses);
    });

    // Any inbound event counts as activity for idle tracking
    socket.use((packet, next) => {
      presence.markActivity(userId, (idleUserId) => {
        broadcastPresence(idleUserId, 'idle');
      });
      next();
    });

    // --- Server channel events ---

    socket.on('join_channel', async (channelId) => {
      try {
        const channel = await prisma.channel.findUnique({ where: { id: channelId } });

        if (!channel) {
          socket.emit('error_message', 'Channel not found');
          return;
        }

        const membership = await prisma.membership.findUnique({
          where: {
            userId_serverId: { userId, serverId: channel.serverId },
          },
        });

        if (!membership) {
          socket.emit('error_message', 'Not a member of this server');
          return;
        }

        socket.join('channel:' + channelId);
        socket.emit('joined_channel', channelId);
      } catch (err) {
        socket.emit('error_message', 'Failed to join channel');
      }
    });

    socket.on('leave_channel', (channelId) => {
      socket.leave('channel:' + channelId);
    });

    socket.on('send_message', async ({ channelId, content }) => {
      try {
        if (!content || !content.trim()) return;

        const message = await messageService.createMessage(userId, channelId, content);

        io.to('channel:' + channelId).emit('new_message', message);
      } catch (err) {
        socket.emit('error_message', err.message || 'Failed to send message');
      }
    });

    // --- Direct message / conversation events ---

    socket.on('join_conversation', async (conversationId) => {
      try {
        await conversationService.assertMember(userId, conversationId);
        socket.join('conversation:' + conversationId);
        socket.emit('joined_conversation', conversationId);
      } catch (err) {
        socket.emit('error_message', err.message || 'Failed to join conversation');
      }
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave('conversation:' + conversationId);
    });

    socket.on('send_dm', async ({ conversationId, content }) => {
      try {
        if (!content || !content.trim()) return;

        const message = await conversationService.createMessage(userId, conversationId, content);

        io.to('conversation:' + conversationId).emit('new_dm', message);
      } catch (err) {
        socket.emit('error_message', err.message || 'Failed to send message');
      }
    });

    // --- Typing indicators (ephemeral, no persistence) ---

    socket.on('typing_start', ({ roomType, roomId }) => {
      const room = (roomType === 'channel' ? 'channel:' : 'conversation:') + roomId;
      socket.to(room).emit('user_typing', { userId, username: socket.user.username, roomType, roomId });
    });

    socket.on('typing_stop', ({ roomType, roomId }) => {
      const room = (roomType === 'channel' ? 'channel:' : 'conversation:') + roomId;
      socket.to(room).emit('user_stopped_typing', { userId, roomType, roomId });
    });

    // --- Disconnect ---

    socket.on('disconnect', () => {
      console.log('User disconnected: ' + socket.user.username + ' (' + socket.id + ')');

      const result = presence.markOffline(userId, socket.id);
      if (result === 'offline') {
        broadcastPresence(userId, 'offline');
      }
    });
  });
}

module.exports = initChatSockets;