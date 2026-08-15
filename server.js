const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const initChatSockets = require('./src/sockets/chat');
const { setSocketIO } = require('./src/routes/webhooks');

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

initChatSockets(io);
setSocketIO(io);

server.listen(PORT, () => {
  console.log('Drift server running on http://localhost:' + PORT);
});