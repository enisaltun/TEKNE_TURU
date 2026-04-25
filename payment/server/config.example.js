/**
 * DenizBul.tr — Payment Server Configuration Template
 * ──────────────────────────────────────────────────────
 * Bu dosyayı  config.js  olarak kopyalayın ve gerçek değerleri girin.
 * config.js asla git'e commit edilmemelidir (.gitignore'a ekleyin).
 *
 * cp config.example.js config.js
 */

module.exports = {

  /* ── SUNUCU ── */
  port     : process.env.PORT || 3001,
  baseUrl  : process.env.BASE_URL || 'http://localhost:3001',   // Webhook URL'si için — production'da public domain olmalı
  env      : process.env.NODE_ENV || 'development',             // 'development' | 'production'

  /* ── İYZİCO ──────────────────────────────────────────────────
   * Sandbox : https://sandbox-api.iyzipay.com
   * Canlı   : https://api.iyzipay.com
   *
   * Sandbox hesabı: https://sandbox-merchant.iyzipay.com
   * Panel > Ayarlar > API & Entegrasyon anahtarları
   * ─────────────────────────────────────────────────────────── */
  iyzico: {
    apiKey    : process.env.IYZICO_API_KEY    || 'sandbox-BURAYA-API-KEY-GELECEK',
    secretKey : process.env.IYZICO_SECRET_KEY || 'sandbox-BURAYA-SECRET-KEY-GELECEK',
    baseUrl   : process.env.IYZICO_BASE_URL   || 'https://sandbox-api.iyzipay.com',
    locale    : 'tr',
    currency  : 'TRY',
  },

  /* ── PAYTR ───────────────────────────────────────────────────
   * Test paneli: https://www.paytr.com/magaza/ayarlar
   * İframe entegrasyon belgeleri: https://dev.paytr.com/iframe
   *
   * Webhook URL (public olmalı, test için ngrok kullanın):
   *   https://DOMAIN.com/api/payment/paytr/webhook
   * ─────────────────────────────────────────────────────────── */
  paytr: {
    merchantId  : process.env.PAYTR_MERCHANT_ID   || 'BURAYA-MERCHANT-ID',
    merchantKey : process.env.PAYTR_MERCHANT_KEY  || 'BURAYA-MERCHANT-KEY',
    merchantSalt: process.env.PAYTR_MERCHANT_SALT || 'BURAYA-MERCHANT-SALT',
    testMode    : process.env.PAYTR_TEST_MODE !== 'false',   // false → canlı mod
    debugOn     : process.env.NODE_ENV !== 'production',
    /* Webhook endpoint — PayTR panelinden de bu URL girilmeli */
    webhookPath : '/api/payment/paytr/webhook',
  },

  /* ── GÜVENLIK ── */
  cors: {
    origin: process.env.CORS_ORIGIN || '*',   // production'da kısıtlayın
  },

  /* ── LOG ── */
  logLevel: process.env.LOG_LEVEL || 'info',   // 'debug' | 'info' | 'warn' | 'error'
};
