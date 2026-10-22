const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { config } = require('./identity/runtime');
module.exports = function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.proxyHops);
  app.use(cors({
    origin: config.clientOrigin, credentials: true,
    allowedHeaders: ['Content-Type', 'X-RVDL-CSRF'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  }));
  app.use(cookieParser());
  // This route must consume the original bytes before the shared JSON parser.
  // The payment controller verifies them before dispatching any event.
  app.post('/api/v1/payment/webhooks', express.raw({ type: 'application/json', limit: '16kb', inflate: false }));
  app.use(express.json({ limit: '16kb' }));
  app.use(express.urlencoded({ extended: false, limit: '16kb' }));
  app.use(express.static(require('path').join(__dirname, 'public')));
  app.use('/api/v1', require('./routes/v1'));
  app.use((_req, res) => res.status(404).json({ error: { message: 'Not found' } }));
  app.use(require('./handlers/error'));
  return app;
};
