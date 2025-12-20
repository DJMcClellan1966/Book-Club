const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bookclub', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Import routes
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const reviewRoutes = require('./routes/reviews');
const forumRoutes = require('./routes/forums');
const spaceRoutes = require('./routes/spaces');
const userRoutes = require('./routes/users');
const paymentRoutes = require('./routes/payments');
const affiliateRoutes = require('./routes/affiliates');
const aiChatRoutes = require('./routes/aichats');
const aiRoutes = require('./routes/ai');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/forums', forumRoutes);
app.use('/api/spaces', spaceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/affiliates', affiliateRoutes);
app.use('/api/aichats', aiChatRoutes);
app.use('/api/ai', aiRoutes);

// Socket.io for real-time features
const activeUsers = new Map();
const videoRooms = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // User joins with authentication
  socket.on('user-connected', (userId) => {
    activeUsers.set(socket.id, userId);
    socket.userId = userId;
    io.emit('active-users', Array.from(activeUsers.values()));
  });

  // Join a chat room/space
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-joined', socket.userId);
  });

  // Text messaging
  socket.on('send-message', (data) => {
    io.to(data.roomId).emit('receive-message', {
      userId: socket.userId,
      message: data.message,
      timestamp: new Date()
    });
  });

  // Video chat signaling
  socket.on('join-video-room', (roomId) => {
    if (!videoRooms.has(roomId)) {
      videoRooms.set(roomId, new Set());
    }
    videoRooms.get(roomId).add(socket.id);
    
    const otherUsers = Array.from(videoRooms.get(roomId))
      .filter(id => id !== socket.id);
    
    socket.emit('all-users', otherUsers);
    socket.to(roomId).emit('user-joined-video', socket.id);
  });

  socket.on('sending-signal', (payload) => {
    io.to(payload.userToSignal).emit('user-joined-signal', {
      signal: payload.signal,
      callerID: payload.callerID
    });
  });

  socket.on('returning-signal', (payload) => {
    io.to(payload.callerID).emit('receiving-returned-signal', {
      signal: payload.signal,
      id: socket.id
    });
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    activeUsers.delete(socket.id);
    io.emit('active-users', Array.from(activeUsers.values()));
    
    // Remove from video rooms
    videoRooms.forEach((users, roomId) => {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        socket.to(roomId).emit('user-left-video', socket.id);
      }
    });
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Book Club API is running' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io };
