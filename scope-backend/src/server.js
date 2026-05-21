require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { scheduleWeeklyDigest, runWeeklyDigest } = require('./utils/weeklyDigest');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

connectDB();

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: ALLOWED_ORIGIN, credentials: true } });

app.set('io', io);

// 1. CORS configuration (must be first to enable CORS on rate-limit responses)
app.use(cors({ origin: ALLOWED_ORIGIN, credentials: true }));

// 2. Security Headers via Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 3. Rate Limiting (Strict for auth, standard for general API)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts from this IP, please try again after 15 minutes' }
});

app.use('/api/auth/', authLimiter);
app.use('/api/', generalLimiter);

// 4. Other Standard Middlewares
app.use(cookieParser());
app.use(morgan('dev'));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/grades', require('./routes/grades'));
app.use('/api/homework', require('./routes/homework'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/bulk-import', require('./routes/bulkImport'));
app.use('/api/ai', require('./routes/ai'));
if (process.env.NODE_ENV === 'development') {
  app.use('/api/dev', require('./routes/dev'));
}

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'SCOPE Backend' }));

// Manual trigger for admin (protected — only callable with valid JWT in production)
app.post('/api/admin/send-weekly-digest', async (req, res) => {
  res.json({ message: 'Weekly digest job started. Check server logs for progress.' });
  runWeeklyDigest(); // runs async in background
});

// Socket.IO for real-time chat
io.on('connection', (socket) => {
  socket.on('joinRoom', (roomId) => socket.join(roomId));
  socket.on('leaveRoom', (roomId) => socket.leave(roomId));
  socket.on('disconnect', () => {});
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`SCOPE Backend running on port ${PORT}`);
  scheduleWeeklyDigest();
});
