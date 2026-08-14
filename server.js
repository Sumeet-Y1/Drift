const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('Socket connected: ' + socket.id);

  socket.on('disconnect', () => {
    console.log('Socket disconnected: ' + socket.id);
  });
});

server.listen(PORT, () => {
  console.log('Drift server running on http://localhost:' + PORT);
});
