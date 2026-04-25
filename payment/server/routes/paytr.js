/**
 * PayTR Route Handler
 * ────────────────────
 * POST /api/payment/paytr/initiate   — iFrame token üret
 * POST /api/payment/paytr/status     — Ödeme durumu sorgula
 * POST /api/payment/paytr/refund     — İade
 * POST /api/payment/paytr/webhook    — PayTR sunucusu buraya bildirim atar (public URL gerekir)
 *
 * PayTR iFrame Belgeleri: https://dev.paytr.com/iframe
 * Test paneli          : https://www.paytr.com/magaza/ayarlar
 *
 * ÖNEMLİ: webhook endpoint'i ngrok veya benzeri ile public URL'ye çıkarılmalıdır.
 *   Örnek: ngrok http 3001
 *   Sonra: PayTR panelinde Bildirim URL = https://xxxx.ngrok-free.app/api/payment/paytr/webhook
 */

const express = require('express');
const crypto  = require('crypto');
const router  = express.Router();

let config;
try { config = require('../config'); } catch { config = require('../config.example'); }

const MC = config.paytr;

/* ─────────────────────────────────────────────────────────────
 * POST /initiate — PayTR merchant token oluştur
 *   Body: { order }
 *   order: { referenceId, amount, customer: { name, email, phone } }
 *   Yanıt: { token }  — client bu token ile iFrame URL'si oluşturur:
 *     https://www.paytr.com/odeme/guvenli/{token}
 * ───────────────────────────────────────────────────────────── */
router.post('/initiate', async (req, res) => {
  const { order } = req.body;
  if (!order?.referenceId || !order?.amount) {
    return res.status(400).json({ error: 'order.referenceId ve order.amount zorunlu' });
  }

  /* Test modunda mock token döndür */
  if (MC.testMode && _isMockConfig()) {
    return res.json({ token: 'PAYTR-MOCK-TOKEN-' + Date.now(), _mock: true });
  }

  try {
    const token = await _generatePaytrToken(order, req);
    res.json({ token });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ─────────────────────────────────────────────────────────────
 * POST /status — Ödeme durumu sorgula
 *   Body: { merchantOid }
 *   Yanıt: { status: 'success'|'failed'|'pending', merchantOid }
 * ───────────────────────────────────────────────────────────── */
router.post('/status', async (req, res) => {
  const { merchantOid } = req.body;
  if (!merchantOid) return res.status(400).json({ error: 'merchantOid zorunlu' });

  if (_isMockConfig()) {
    return res.json({ status: 'success', merchantOid, _mock: true });
  }

  try {
    const result = await _queryPaytrStatus(merchantOid);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ─────────────────────────────────────────────────────────────
 * POST /refund
 *   Body: { merchantOid, amount, reason }
 *   amount = 0 → tam iade
 * ───────────────────────────────────────────────────────────── */
router.post('/refund', async (req, res) => {
  const { merchantOid, amount } = req.body;
  if (!merchantOid) return res.status(400).json({ error: 'merchantOid zorunlu' });

  if (_isMockConfig()) {
    return res.json({ status: 'success', refundId: 'PAYTR-REF-' + Date.now(), _mock: true });
  }

  try {
    const result = await _requestPaytrRefund(merchantOid, amount);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ─────────────────────────────────────────────────────────────
 * POST /webhook — PayTR ödeme bildirimi  ← PayTR bu endpoint'e POST atar
 *
 * PayTR bildirim parametreleri (form-encoded):
 *   merchant_oid, status, total_amount, hash, failed_reason_code, failed_reason_msg
 *
 * Yanıt: mutlaka  "OK"  plain text döndürülmeli — aksi hâlde PayTR tekrar gönderir
 * ───────────────────────────────────────────────────────────── */
router.post('/webhook', (req, res) => {
  const { merchant_oid, status, total_amount, hash: incomingHash, failed_reason_code, failed_reason_msg } = req.body;

  /* 1. Hash doğrula */
  if (!_verifyPaytrHash(merchant_oid, status, total_amount, incomingHash)) {
    console.error('[PayTR Webhook] Hash doğrulama başarısız:', { merchant_oid, status });
    return res.send('INVALID_HASH');   // PayTR tekrar göndermez → log için farklı yanıt
  }

  /* 2. Ödeme durumunu işle */
  if (status === 'success') {
    console.log(`[PayTR Webhook] Ödeme başarılı: ${merchant_oid} — ${total_amount} kr`);
    /* BURAYA: DB'de booking.durum güncelle, fatura kes, bildirim gönder */
    _onPaymentSuccess(merchant_oid, total_amount);
  } else {
    const reason = `${failed_reason_code}: ${failed_reason_msg}`;
    console.warn(`[PayTR Webhook] Ödeme başarısız: ${merchant_oid} — ${reason}`);
    /* BURAYA: booking.durum = 'iptal', müşteriye bildirim */
    _onPaymentFailed(merchant_oid, reason);
  }

  /* 3. PayTR'ye OK yanıtı ver */
  res.send('OK');
});

/* ── PRIVATE: HMAC-SHA256 imza üret (token için) ── */
function _generatePaytrToken(order, req) {
  return new Promise((resolve, reject) => {
    const ip         = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || '127.0.0.1').split(',')[0].trim();
    const merchantOid = order.referenceId;
    const email       = order.customer?.email || 'musteri@denizbul.tr';
    const amount      = String(order.amount);       // kuruş cinsinden
    const currency    = 'TL';
    const testMode    = MC.testMode ? '1' : '0';
    const noInstall   = '1';                        // taksit yok
    const lang        = 'tr';
    const debugOn     = MC.debugOn ? '1' : '0';
    const timeout     = '30';                       // dakika

    /* Sepet verisi JSON → Base64 */
    const basketItems = JSON.stringify([[order.tourName || 'Tekne Turu', String(amount), 1]]);
    const userBasket  = Buffer.from(basketItems).toString('base64');

    /* HMAC-SHA256 imza */
    const hashStr = [
      MC.merchantId, ip, merchantOid, email, amount,
      currency, noInstall, testMode, noInstall,
      MC.merchantSalt,
    ].join('');
    const token = crypto.createHmac('sha256', MC.merchantKey).update(hashStr).digest('base64');

    /* PayTR API isteği */
    const params = new URLSearchParams({
      merchant_id          : MC.merchantId,
      user_ip              : ip,
      merchant_oid         : merchantOid,
      email,
      payment_amount       : amount,
      paytr_token          : token,
      user_basket          : userBasket,
      debug_on             : debugOn,
      no_installment       : noInstall,
      max_installment      : '0',
      user_name            : order.customer?.name    || 'Misafir',
      user_phone           : order.customer?.phone   || '05000000000',
      merchant_ok_url      : (config.baseUrl || 'http://localhost:3001') + '/odeme/basarili',
      merchant_fail_url    : (config.baseUrl || 'http://localhost:3001') + '/odeme/basarisiz',
      timeout_limit        : timeout,
      currency,
      lang,
      test_mode            : testMode,
    });

    fetch('https://www.paytr.com/odeme/api/get-token', {
      method  : 'POST',
      headers : { 'Content-Type': 'application/x-www-form-urlencoded' },
      body    : params.toString(),
    })
      .then(r => r.json())
      .then(data => {
        if (data.status === 'success') resolve(data.token);
        else reject(new Error('PayTR token hatası: ' + (data.reason || JSON.stringify(data))));
      })
      .catch(reject);
  });
}

/* ── PRIVATE: Webhook hash doğrulama ── */
function _verifyPaytrHash(merchantOid, status, totalAmount, incomingHash) {
  const hashStr  = merchantOid + MC.merchantSalt + status + totalAmount;
  const expected = crypto.createHmac('sha256', MC.merchantKey).update(hashStr).digest('base64');
  return expected === incomingHash;
}

/* ── PRIVATE: Ödeme durumu sorgulama ── */
async function _queryPaytrStatus(merchantOid) {
  const hashStr = merchantOid + MC.merchantSalt;
  const token   = crypto.createHmac('sha256', MC.merchantKey).update(hashStr).digest('base64');
  const params  = new URLSearchParams({ merchant_id: MC.merchantId, merchant_oid: merchantOid, paytr_token: token });
  const r       = await fetch('https://www.paytr.com/odeme/api/get-token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() });
  return r.json();
}

/* ── PRIVATE: PayTR iade API ── */
async function _requestPaytrRefund(merchantOid, amount) {
  const returnAmount = String(amount || 0);
  const hashStr      = MC.merchantId + merchantOid + returnAmount + MC.merchantSalt;
  const token        = crypto.createHmac('sha256', MC.merchantKey).update(hashStr).digest('base64');
  const params       = new URLSearchParams({ merchant_id: MC.merchantId, merchant_oid: merchantOid, return_amount: returnAmount, paytr_token: token });
  const r            = await fetch('https://www.paytr.com/odeme/iade', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() });
  return r.json();
}

/* ── PRIVATE: Ödeme başarı/hata handler'ları (bağlanacak) ── */
function _onPaymentSuccess(merchantOid, totalAmount) {
  /* TODO: booking.durum = 'onaylandi', odemeYapildi = true */
  /* TODO: Supabase veya localStorage sync */
  console.log('[PayTR] SUCCESS handler —', merchantOid, totalAmount);
}

function _onPaymentFailed(merchantOid, reason) {
  /* TODO: booking.durum = 'iptal' */
  console.log('[PayTR] FAILED handler —', merchantOid, reason);
}

/* ── PRIVATE: Config gerçek mi? ── */
function _isMockConfig() {
  return MC.merchantId === 'BURAYA-MERCHANT-ID' || !MC.merchantId;
}

module.exports = router;
