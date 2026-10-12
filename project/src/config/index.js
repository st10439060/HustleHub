const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hustlehub',

  jwtSecret: process.env.JWT_SECRET || 'dev-only-fallback-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2h',

  httpsCert: process.env.HTTPS_CERT || 'certs/server.cert',
  httpsKey: process.env.HTTPS_KEY || 'certs/server.key',

  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,

  logLevel: process.env.LOG_LEVEL || 'info',
};

module.exports = config;
