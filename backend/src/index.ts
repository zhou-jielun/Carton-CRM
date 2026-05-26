import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import campaignRoutes from './routes/campaign';
import aiRoutes from './routes/ai';
import acquisitionRoutes from './routes/acquisition';
import customerRoutes from './routes/customers';
import taskRoutes from './routes/tasks';
import analyticsRoutes from './routes/analytics';
import reminderRoutes from './routes/reminders';
import aiLeadsRoutes from './routes/aiLeads';
import path from 'path';

const app = express();

// Security
app.use(helmet());
app.use(cors({ origin: config.cors.origin, credentials: true }));

// Rate limiting
app.use(rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { success: false, message: 'Too many requests, please try again later' },
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Carton CRM API is running', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/acquisition', acquisitionRoutes);
app.use('/api/ai-leads', aiLeadsRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error handler
app.use(errorHandler);

// Serve frontend static files in production (must be after API routes)
if (config.nodeEnv === 'production') {
  const frontendPath = process.env.FRONTEND_DIST_PATH || path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Start server
app.listen(config.port, () => {
  console.log(`[Carton CRM] Backend running on port ${config.port}`);
  // Notify parent process (Electron) that server is ready
  if (process.send) {
    process.send('server-ready');
  }
});

export default app;
