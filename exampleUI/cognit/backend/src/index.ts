import express from 'express';
import { config } from './config/environment.js';
import { corsMiddleware } from './middleware/cors.js';
import healthRouter from './routes/health.js';
import agentsRouter from './routes/agents.js';
import chatRouter from './routes/chat.js';

const app = express();

// Middleware
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/health', healthRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/chat', chatRouter);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: err.message || 'Internal server error',
    ...(config.nodeEnv === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 Cognit Backend Server');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🤖 Agents list: http://localhost:${PORT}/api/agents`);
  console.log(`💬 Chat endpoint: http://localhost:${PORT}/api/chat/message`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`API Key configured: ${config.geminiApiKey !== 'PLACEHOLDER_API_KEY' ? '✅ Yes' : '⚠️  No (using placeholder)'}`);
  console.log('');
});
