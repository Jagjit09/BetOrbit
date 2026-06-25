import { Server } from 'socket.io';

export let io = null;

export const setupSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Allow all origins for the demo
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    // console.log(`Client connected: ${socket.id}`);

    // Join a market room for channel updates
    socket.on('joinMarket', (marketId) => {
      socket.join(marketId);
      // console.log(`Socket ${socket.id} joined market ${marketId}`);
    });

    // Leave a market room
    socket.on('leaveMarket', (marketId) => {
      socket.leave(marketId);
      // console.log(`Socket ${socket.id} left market ${marketId}`);
    });

    socket.on('disconnect', () => {
      // console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};
