const express = require('express');
const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const config = require('./config');
const { connectDB } = require('./config/database');
const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const protectedRoutes = require('./routes/protectedRoutes');
const marketplaceRoutes = require('./routes/marketplaceRoutes');

function createApp() {
  const app = express();

  // ── Security middleware ──
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
          fontSrc: ["'self'"],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );
  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || true,
      credentials: true,
    })
  );

  // ── Rate limiting ──
  const isTest = config.nodeEnv === 'test';
  const limiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests. Please try again later.' },
  });
  app.use('/api/', isTest ? (_req, _res, next) => next() : limiter);

  // ── Stricter rate limiting on authentication endpoints ──
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many authentication attempts. Please try again later.' },
  });

  // ── Body parsing ──
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // ── Compression ──
  app.use(compression());

  // ── HTTP logging (morgan → winston) ──
  app.use(
    morgan('combined', {
      stream: { write: (msg) => logger.info(msg.trim()) },
    })
  );

  // ── Routes ──
  app.get('/', (_req, res) => {
    res.json({
      success: true,
      message: 'HustleHub+ API',
      version: '1.0.0',
      docs: '/api/auth/health',
    });
  });

  app.use('/api/auth', isTest ? (_req, _res, next) => next() : authLimiter, authRoutes);
  app.use('/api/protected', protectedRoutes);
  app.use('/api', marketplaceRoutes);

  // ── 404 + Error handlers ──
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

async function startServer() {
  await connectDB();

  const app = createApp();

  // ── HTTPS ──
  const certPath = path.resolve(process.cwd(), config.httpsCert);
  const keyPath = path.resolve(process.cwd(), config.httpsKey);

  let server;

  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    const sslOptions = {
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath),
    };
    server = https.createServer(sslOptions, app);
    logger.info(`HTTPS server starting on port ${config.port}`);
  } else {
    logger.warn('SSL certificate not found. Starting HTTP server for development. Run "npm run certs" to generate one.');
    server = http.createServer(app);
    logger.info(`HTTP server starting on port ${config.port}`);
  }

  server.listen(config.port, () => {
    const protocol = server instanceof https.Server ? 'https' : 'http';
    logger.info(`HustleHub+ running at ${protocol}://localhost:${config.port}`);
  });

  return server;
}

module.exports = { createApp, startServer };
