/**
 * DenizBul.tr — Payment Proxy Server
 * ─────────────────────────────────────
 * Başlatmak için:
 *   cp config.example.js config.js   # API key'leri gir
 *   npm install
 *   npm run dev
 *
 * Test modu (config.js olmadan):
 *   NODE_ENV=development node index.js
 *   → Gerçek API çağrısı yapmaz, mock yanıtlar döndürür
 */

const express  = require('express');
const cors     = require('cors');

/* Config dosyası yoksa örnek değerlerle devam et */
let config;
try {
  config = require('./config');
} catch (_) {
  console.warn('[!] config.js bulunamadı — config.example.js ile devam ediliyor (TEST MODU)');
  config = require('./config.example');
}

const app = express();

/* ── MIDDLEWARE ── */
app.use(cors({ origin: config.cors?.origin || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));   // PayTR webhook form-encoded gönderir

/* ── LOGGING ── */
app.use((req, _res, next) => {
  if (config.logLevel === 'debug') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, req.body);
  }
  next();
});

/* ── ROUTES ── */
app.use('/api/payment/iyzico', require('./routes/iyzico'));
app.use('/api/payment/paytr',  require('./routes/paytr'));

/* ── HEALTH ── */
app.get('/api/health', (_req, res) => {
  res.json({
    status    : 'ok',
    env       : config.env,
    providers : {
      iyzico : { configured: config.iyzico.apiKey !== 'sandbox-BURAYA-API-KEY-GELECEK' },
      paytr  : { configured: config.paytr.merchantId !== 'BURAYA-MERCHANT-ID', testMode: config.paytr.testMode },
    },
    timestamp : new Date().toISOString(),
  });
});

/* ── 404 ── */
app.use((_req, res) => res.status(404).json({ error: 'Endpoint bulunamadı' }));

/* ── HATA YÖNETİMİ ── */
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: err.message });
});

/* ── BAŞLAT ── */
const PORT = config.port || 3001;
app.listen(PORT, () => {
  console.log(`\n🚢 DenizBul Payment Server — http://localhost:${PORT}`);
  console.log(`   Health : http://localhost:${PORT}/api/health`);
  console.log(`   iyzico : ${config.iyzico.baseUrl}`);
  console.log(`   PayTR  : test=${config.paytr.testMode}`);
  console.log(`   Env    : ${config.env}\n`);
});

module.exports = app;
