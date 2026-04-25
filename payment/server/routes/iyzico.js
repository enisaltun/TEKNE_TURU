/**
 * İyzico Route Handler
 * ─────────────────────
 * POST /api/payment/iyzico/initiate   — Ödeme başlat (checkout form veya 3D yönlendirme)
 * POST /api/payment/iyzico/callback   — 3D Secure callback (iyzico'dan gelen)
 * POST /api/payment/iyzico/refund     — İade
 * POST /api/payment/iyzico/cancel     — İptal (ödeme geri alma)
 *
 * iyzico API Belgeleri: https://dev.iyzipay.com
 * iyzipay Node SDK   : https://github.com/iyzico/iyzipay-node
 */

const express = require('express');
const router  = express.Router();

let config;
try { config = require('../config'); } catch { config = require('../config.example'); }

/* İyzico SDK başlat — API key'ler ayarlandığında gerçek bağlantı kurulur */
let Iyzipay;
let iyzipay;
try {
  Iyzipay  = require('iyzipay');
  iyzipay  = new Iyzipay({
    apiKey    : config.iyzico.apiKey,
    secretKey : config.iyzico.secretKey,
    uri       : config.iyzico.baseUrl,
  });
} catch (e) {
  console.warn('[iyzico] iyzipay paketi yüklü değil — npm install çalıştırın:', e.message);
}

const IS_SANDBOX = config.iyzico.baseUrl.includes('sandbox');

/* ── HELPER: İyzico conversation ID üret ── */
const convId = () => 'DB-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);

/* ── HELPER: IP al ── */
const getIp = req => (req.headers['x-forwarded-for'] || req.connection.remoteAddress || '127.0.0.1').split(',')[0].trim();

/* ─────────────────────────────────────────────────────────────
 * POST /initiate — Ödemeyi başlat
 *   Body: { order, card }
 *   order: { referenceId, amount, currency, customer: { name, email, phone, address } }
 *   card:  { cardHolderName, cardNumber, expireMonth, expireYear, cvc }
 *
 *   3D için: { status: '3DS_REDIRECT', paymentId, redirectUrl }
 *   Direkt:  { status: 'success'|'failure', paymentId, errorCode, errorMessage }
 * ───────────────────────────────────────────────────────────── */
router.post('/initiate', async (req, res) => {
  const { order, card } = req.body;
  if (!order?.referenceId || !order?.amount) {
    return res.status(400).json({ error: 'order.referenceId ve order.amount zorunlu' });
  }

  /* Sandbox/Test modunda mock yanıt döndür */
  if (IS_SANDBOX && !iyzipay) {
    return res.json(_mockIyzicoInitiate(order, card));
  }

  try {
    const request = _buildIyzicoRequest(order, card, req);

    /* 3D Secure akışı tercih edilebilir — production'da önerilir */
    const use3D = req.query.mode === '3d' || config.iyzico.force3D;

    if (use3D) {
      iyzipay.threedsInitialize.create(request, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.status === 'success') {
          return res.json({
            status      : '3DS_REDIRECT',
            paymentId   : result.paymentId,
            redirectUrl : null,   /* iyzico checkout form HTML'ini embed et */
            htmlContent : result.threeDSHtmlContent,
          });
        }
        return res.json({ status: 'failure', errorCode: result.errorCode, errorMessage: result.errorMessage });
      });
    } else {
      iyzipay.payment.create(request, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
          status        : result.status,
          paymentId     : result.paymentId,
          errorCode     : result.errorCode     || null,
          errorMessage  : result.errorMessage  || null,
          conversationId: result.conversationId,
        });
      });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ─────────────────────────────────────────────────────────────
 * POST /callback — 3D Secure callback
 *   iyzico POST atar → sunucu işler → client'a sonuç döndürür
 *   Body: { paymentId, conversationData, conversationId }
 * ───────────────────────────────────────────────────────────── */
router.post('/callback', async (req, res) => {
  const { paymentId, conversationData, conversationId } = req.body;
  if (!paymentId) return res.status(400).json({ error: 'paymentId zorunlu' });

  if (!iyzipay) {
    return res.json({ status: 'success', paymentId, conversationId });   // mock
  }

  try {
    iyzipay.threedsPayment.create({ paymentId, conversationData, conversationId }, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        status        : result.status,
        paymentId     : result.paymentId,
        errorCode     : result.errorCode     || null,
        errorMessage  : result.errorMessage  || null,
        conversationId: result.conversationId,
      });
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ─────────────────────────────────────────────────────────────
 * POST /refund
 *   Body: { transactionId, amount, reason }
 * ───────────────────────────────────────────────────────────── */
router.post('/refund', async (req, res) => {
  const { transactionId, amount, reason } = req.body;
  if (!transactionId || amount === undefined) {
    return res.status(400).json({ error: 'transactionId ve amount zorunlu' });
  }

  if (!iyzipay) {
    return res.json({ status: 'success', refundId: 'REF-MOCK-' + Date.now() });
  }

  try {
    iyzipay.refund.create({
      paymentTransactionId : transactionId,
      price                : String(amount),
      currency             : config.iyzico.currency || 'TRY',
      conversationId       : convId(),
      description          : reason || 'DenizBul iade',
    }, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ status: result.status, refundId: result.paymentTransactionId, errorCode: result.errorCode || null });
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ─────────────────────────────────────────────────────────────
 * POST /cancel — Ödeme iptali (iade öncesi aşamada)
 *   Body: { transactionId }
 * ───────────────────────────────────────────────────────────── */
router.post('/cancel', async (req, res) => {
  const { transactionId } = req.body;
  if (!transactionId) return res.status(400).json({ error: 'transactionId zorunlu' });

  if (!iyzipay) {
    return res.json({ status: 'success' });
  }

  try {
    iyzipay.cancel.create({
      paymentId      : transactionId,
      conversationId : convId(),
    }, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ status: result.status, errorCode: result.errorCode || null });
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ── PRIVATE: iyzico istek nesnesi oluştur ── */
function _buildIyzicoRequest(order, card, req) {
  const cid = convId();
  const customer = order.customer || {};
  const priceTL  = String((order.amount || 0) / 100);   // kuruş → TL string

  return {
    locale            : config.iyzico.locale || 'tr',
    conversationId    : cid,
    price             : priceTL,
    paidPrice         : priceTL,
    currency          : config.iyzico.currency || 'TRY',
    installment       : '1',
    basketId          : order.referenceId,
    paymentChannel    : 'WEB',
    paymentGroup      : 'PRODUCT',
    paymentCard       : card ? {
      cardHolderName  : card.cardHolderName || card.name,
      cardNumber      : (card.cardNumber || card.number || '').replace(/\s/g, ''),
      expireMonth     : card.expireMonth || (card.exp || '').split('/')[0],
      expireYear      : card.expireYear  || ('20' + ((card.exp || '').split('/')[1] || '')),
      cvc             : card.cvc || card.cvv,
      registerCard    : '0',
    } : undefined,
    buyer             : {
      id              : customer.id       || 'GUEST-' + Date.now(),
      name            : customer.name?.split(' ')[0]  || 'Ad',
      surname         : customer.name?.split(' ').slice(1).join(' ') || 'Soyad',
      gsmNumber       : customer.phone    || '+905000000000',
      email           : customer.email    || 'musteri@denizbul.tr',
      identityNumber  : customer.tcNo     || '11111111110',
      registrationAddress: customer.address || 'Türkiye',
      ip              : getIp(req),
      city            : customer.city     || 'Istanbul',
      country         : 'Turkey',
    },
    shippingAddress   : {
      contactName     : customer.name    || 'Musteri',
      city            : customer.city    || 'Istanbul',
      country         : 'Turkey',
      address         : customer.address || 'Türkiye',
    },
    billingAddress    : {
      contactName     : customer.name    || 'Musteri',
      city            : customer.city    || 'Istanbul',
      country         : 'Turkey',
      address         : customer.address || 'Türkiye',
    },
    basketItems       : [{
      id              : order.referenceId,
      name            : order.tourName   || 'Tekne Turu',
      category1       : 'Turizm',
      category2       : 'Tekne Turu',
      itemType        : 'VIRTUAL',
      price           : priceTL,
    }],
    callbackUrl       : (config.baseUrl || 'http://localhost:3001') + '/api/payment/iyzico/callback',
  };
}

/* ── PRIVATE: SDK yüklü değilken mock yanıt ── */
function _mockIyzicoInitiate(order, card) {
  const cardNo = (card?.cardNumber || card?.number || '').replace(/\s/g, '');
  const DECLINED = ['5890040000000057'];
  if (DECLINED.includes(cardNo)) {
    return { status: 'failure', errorCode: 'CARD_DECLINED', errorMessage: 'iyzico: Kart reddedildi (mock)', paymentId: null };
  }
  return {
    status        : 'success',
    paymentId     : 'IYZICO-MOCK-' + Date.now(),
    conversationId: 'DB-' + Date.now(),
    _mock         : true,
  };
}

module.exports = router;
