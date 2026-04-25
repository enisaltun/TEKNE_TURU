/**
 * DenizBul.tr — Payment Gateway Abstraction Layer
 * ────────────────────────────────────────────────
 * Providers : 'mock' | 'iyzico' | 'paytr'
 * Test mode : provider='mock' → hiç sunucu gerekmez
 * Prod mode : provider='iyzico' veya 'paytr' → /api/payment/* proxy gerekir
 *
 * Global    : window.PaymentGateway, window.PaymentTxLog
 */
;(function (global) {
  'use strict';

  /* ─────────────────────────────────────────────────────────────
   * VARSAYILAN YAPILANDIRMA
   * ───────────────────────────────────────────────────────────── */
  const DEFAULTS = {
    provider    : 'mock',           // 'mock' | 'iyzico' | 'paytr'
    serverUrl   : '/api',           // Backend proxy base URL
    currency    : 'TRY',
    locale      : 'tr',
    testMode    : true,
    mockDelay   : 1600,             // ms — simüle gecikme
    logTx       : true,             // localStorage'a işlem kaydı tut
    on3DRedirect: null,             // fn(url) — gerçek 3D yönlendirme
  };

  /* ─────────────────────────────────────────────────────────────
   * İŞLEM KAYIT DEFTERİ  (localStorage)
   * ───────────────────────────────────────────────────────────── */
  const TxLog = {
    KEY: 'denizbul_payment_txlog',

    push(tx) {
      const list = this.all();
      list.unshift({ ...tx, _loggedAt: new Date().toISOString() });
      try { localStorage.setItem(this.KEY, JSON.stringify(list.slice(0, 300))); } catch (_) {}
    },

    all() {
      try { return JSON.parse(localStorage.getItem(this.KEY) || '[]'); } catch { return []; }
    },

    find(txId) {
      return this.all().find(t => t.transactionId === txId) || null;
    },

    clear() { localStorage.removeItem(this.KEY); },

    stats() {
      const all = this.all();
      return {
        total    : all.length,
        success  : all.filter(t => t.success).length,
        failed   : all.filter(t => !t.success && t.step !== 'refund').length,
        refunded : all.filter(t => t.step === 'refund' && t.success).length,
        totalTL  : all.filter(t => t.success && !t.step).reduce((s, t) => s + (t.order?.amount || 0), 0),
      };
    },
  };

  /* ─────────────────────────────────────────────────────────────
   * ÖDEME SONUÇ NESNESİ
   * ───────────────────────────────────────────────────────────── */
  class PaymentResult {
    constructor({ success, transactionId, errorCode, errorMessage, status, rawResponse, order }) {
      this.success       = !!success;
      this.transactionId = transactionId || null;
      this.errorCode     = errorCode     || null;
      this.errorMessage  = errorMessage  || null;
      this.status        = status        || (success ? 'success' : 'failed');
      this.rawResponse   = rawResponse   || {};
      this.order         = order         || null;
      this.timestamp     = new Date().toISOString();
    }
  }

  /* ─────────────────────────────────────────────────────────────
   * SİPARİŞ DOĞRULAMA
   * ───────────────────────────────────────────────────────────── */
  function validateOrder(order) {
    const errs = [];
    if (!order?.amount || order.amount <= 0)   errs.push('amount > 0 gerekli');
    if (!order?.referenceId)                   errs.push('referenceId (booking ID) gerekli');
    if (!order?.customer?.name)                errs.push('customer.name gerekli');
    if (errs.length) throw new Error('[PaymentGateway] Geçersiz sipariş: ' + errs.join(' | '));
  }

  /* ─────────────────────────────────────────────────────────────
   * TEST KARTLARI
   *   Mock adapter'da kart numarasına göre senaryo belirlenir.
   *   Gerçek iyzico / PayTR sandbox kartları da buradadır.
   * ───────────────────────────────────────────────────────────── */
  const TEST_CARDS = [
    /* ── MOCK / GENEL ── */
    {
      provider : 'all',
      number   : '4111 1111 1111 1111',
      exp      : '12/30',
      cvv      : '123',
      name     : 'TEST KART BASARILI',
      scenario : 'success',
      label    : 'Başarılı Ödeme',
      color    : 'green',
    },
    {
      provider : 'all',
      number   : '4000 0000 0000 3220',
      exp      : '12/30',
      cvv      : '123',
      name     : 'TEST KART 3D',
      scenario : '3d',
      label    : '3D Secure Gerekli (OTP: herhangi 6 rakam)',
      color    : 'blue',
    },
    {
      provider : 'all',
      number   : '4000 0000 0000 0002',
      exp      : '12/30',
      cvv      : '123',
      name     : 'TEST KART RED',
      scenario : 'declined',
      label    : 'Kart Reddedildi',
      color    : 'red',
    },
    {
      provider : 'all',
      number   : '4000 0000 0000 9995',
      exp      : '12/30',
      cvv      : '123',
      name     : 'TEST KART BAKIYE',
      scenario : 'insufficient',
      label    : 'Yetersiz Bakiye',
      color    : 'orange',
    },
    {
      provider : 'all',
      number   : '4000 0000 0000 0069',
      exp      : '01/20',
      cvv      : '123',
      name     : 'TEST KART SURESI',
      scenario : 'expired',
      label    : 'Süresi Dolmuş Kart',
      color    : 'gray',
    },
    /* ── İYZİCO SANDBOX ── */
    {
      provider : 'iyzico',
      number   : '5890 0400 0000 0016',
      exp      : '12/30',
      cvv      : '123',
      name     : 'IYZICO TEST',
      scenario : 'success',
      label    : 'iyzico Sandbox — Başarılı',
      color    : 'green',
    },
    {
      provider : 'iyzico',
      number   : '5890 0400 0000 0024',
      exp      : '12/30',
      cvv      : '123',
      name     : 'IYZICO TEST 3D',
      scenario : '3d',
      label    : 'iyzico Sandbox — 3D Secure (OTP: 123456)',
      color    : 'blue',
    },
    {
      provider : 'iyzico',
      number   : '5890 0400 0000 0057',
      exp      : '12/30',
      cvv      : '123',
      name     : 'IYZICO TEST RED',
      scenario : 'declined',
      label    : 'iyzico Sandbox — Reddedildi',
      color    : 'red',
    },
    /* ── PAYTR SANDBOX ── */
    {
      provider : 'paytr',
      number   : '4355 0840 0040 8251',
      exp      : '12/30',
      cvv      : '000',
      name     : 'PAYTR TEST',
      scenario : 'success',
      label    : 'PayTR Sandbox — Başarılı',
      color    : 'green',
    },
    {
      provider : 'paytr',
      number   : '4355 0840 0040 8269',
      exp      : '12/30',
      cvv      : '000',
      name     : 'PAYTR TEST FAIL',
      scenario : 'declined',
      label    : 'PayTR Sandbox — Başarısız',
      color    : 'red',
    },
  ];

  /* Kart numarasına göre mock senaryo bul */
  const SCENARIO_MAP = {
    '4111111111111111' : { success: true,  needs3D: false },
    '4000000000003220' : { success: true,  needs3D: true  },
    '4000000000000002' : { success: false, needs3D: false, errorCode: 'CARD_DECLINED',      errorMessage: 'Kart reddedildi — bankanızla iletişime geçin' },
    '4000000000009995' : { success: false, needs3D: false, errorCode: 'INSUFFICIENT_FUNDS', errorMessage: 'Yetersiz bakiye' },
    '4000000000000069' : { success: false, needs3D: false, errorCode: 'EXPIRED_CARD',       errorMessage: 'Kart son kullanma tarihi geçmiş' },
    '5890040000000016' : { success: true,  needs3D: false },
    '5890040000000024' : { success: true,  needs3D: true  },
    '5890040000000057' : { success: false, needs3D: false, errorCode: 'CARD_DECLINED',      errorMessage: 'iyzico: Kart reddedildi' },
    '4355084000408251' : { success: true,  needs3D: false },
    '4355084000408269' : { success: false, needs3D: false, errorCode: 'PAYMENT_FAILED',     errorMessage: 'PayTR: Ödeme başarısız' },
  };

  function _getScenario(rawNumber) {
    const clean = (rawNumber || '').replace(/\s+/g, '');
    return SCENARIO_MAP[clean] || { success: true, needs3D: false }; // bilinmeyen kart → başarılı (test kolaylığı)
  }

  /* ─────────────────────────────────────────────────────────────
   * YARDIMCI FONKSİYONLAR
   * ───────────────────────────────────────────────────────────── */
  const _sleep    = ms => new Promise(r => setTimeout(r, ms));
  const _txId     = pfx => (pfx || 'TX') + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  const _maskCard = n => { const c = (n || '').replace(/\s/g, ''); return c.slice(0, 4) + ' **** **** ' + c.slice(-4); };

  async function _post(url, body) {
    const r = await fetch(url, {
      method  : 'POST',
      headers : { 'Content-Type': 'application/json' },
      body    : JSON.stringify(body),
    });
    const text = await r.text();
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${text}`);
    try { return JSON.parse(text); } catch { return { raw: text }; }
  }

  /* Luhn algoritması */
  function luhnCheck(num) {
    const digits = (num || '').replace(/\D/g, '').split('').map(Number).reverse();
    const sum = digits.reduce((acc, d, i) => {
      if (i % 2 !== 0) { d *= 2; if (d > 9) d -= 9; }
      return acc + d;
    }, 0);
    return sum % 10 === 0;
  }

  /* ─────────────────────────────────────────────────────────────
   * MOCK ADAPTER — sunucu gerektirmez, tam simülasyon
   * ───────────────────────────────────────────────────────────── */
  class MockAdapter {
    constructor(cfg) { this.cfg = cfg; }

    async pay(order, card) {
      validateOrder(order);
      await _sleep(this.cfg.mockDelay);

      const scenario = _getScenario(card?.number);
      const txId     = _txId('MOCK');

      if (scenario.needs3D) {
        return {
          needs3D       : true,
          transactionId : txId,
          otpChallenge  : 'OTP-' + Date.now(),
          maskedCard    : _maskCard(card?.number),
        };
      }

      const result = new PaymentResult({
        success       : scenario.success,
        transactionId : txId,
        errorCode     : scenario.errorCode     || null,
        errorMessage  : scenario.errorMessage  || null,
        status        : scenario.success ? 'success' : 'failed',
        rawResponse   : { provider: 'mock', maskedCard: _maskCard(card?.number) },
        order,
      });

      if (this.cfg.logTx) TxLog.push({ ...result, step: 'pay', provider: 'mock' });
      return result;
    }

    async verify3D(transactionId, otp) {
      await _sleep(800);
      const success = (otp || '').length === 6 && otp !== '000000';
      const result  = new PaymentResult({
        success,
        transactionId,
        errorCode    : success ? null : '3D_OTP_FAILED',
        errorMessage : success ? null : 'OTP doğrulama başarısız — lütfen tekrar deneyin',
        status       : success ? 'success' : 'failed',
        rawResponse  : { provider: 'mock', step: '3d_verify', otp: '***' },
      });
      if (this.cfg.logTx) TxLog.push({ ...result, step: '3d_verify', provider: 'mock' });
      return result;
    }

    async refund(transactionId, amount, reason) {
      await _sleep(1000);
      const result = new PaymentResult({
        success       : true,
        transactionId : _txId('REF'),
        status        : 'refunded',
        rawResponse   : { provider: 'mock', originalTxId: transactionId, amount, reason },
      });
      if (this.cfg.logTx) TxLog.push({ ...result, step: 'refund', provider: 'mock' });
      return result;
    }

    async cancel(transactionId) {
      await _sleep(500);
      return new PaymentResult({ success: true, transactionId, status: 'cancelled', rawResponse: { provider: 'mock' } });
    }
  }

  /* ─────────────────────────────────────────────────────────────
   * İYZİCO ADAPTER — sunucu proxy gerekir (/api/payment/iyzico/*)
   *
   * Sunucu endpoint'leri:
   *   POST /api/payment/iyzico/initiate   → { checkoutFormContent | redirectUrl, paymentId }
   *   POST /api/payment/iyzico/callback   → { status, paymentId, conversationId }
   *   POST /api/payment/iyzico/refund     → { status, refundId }
   *   POST /api/payment/iyzico/cancel     → { status }
   * ───────────────────────────────────────────────────────────── */
  class IyzicoAdapter {
    constructor(cfg) {
      this.cfg = cfg;
      this.base = cfg.serverUrl + '/payment/iyzico';
    }

    async pay(order, card) {
      validateOrder(order);
      /* Sunucuya ilet → sunucu iyzico imzasını üretir, API'yi çağırır */
      const resp = await _post(this.base + '/initiate', {
        order,
        card: card ? {
          cardHolderName : card.name,
          cardNumber     : (card.number || '').replace(/\s/g, ''),
          expireMonth    : (card.exp || '').split('/')[0],
          expireYear     : '20' + (card.exp || '').split('/')[1],
          cvc            : card.cvv,
        } : null,
      });

      if (resp.status === '3DS_REDIRECT') {
        return { needs3D: true, transactionId: resp.paymentId, redirectUrl: resp.redirectUrl };
      }

      const result = new PaymentResult({
        success       : resp.status === 'success',
        transactionId : resp.paymentId,
        errorCode     : resp.errorCode     || null,
        errorMessage  : resp.errorMessage  || null,
        status        : resp.status,
        rawResponse   : resp,
        order,
      });
      if (this.cfg.logTx) TxLog.push({ ...result, step: 'pay', provider: 'iyzico' });
      return result;
    }

    async verify3D(paymentId, conversationId) {
      const resp = await _post(this.base + '/callback', { paymentId, conversationId });
      const result = new PaymentResult({
        success       : resp.status === 'success',
        transactionId : resp.paymentId,
        errorCode     : resp.errorCode || null,
        errorMessage  : resp.errorMessage || null,
        status        : resp.status,
        rawResponse   : resp,
      });
      if (this.cfg.logTx) TxLog.push({ ...result, step: '3d_verify', provider: 'iyzico' });
      return result;
    }

    async refund(transactionId, amount, reason) {
      const resp   = await _post(this.base + '/refund', { transactionId, amount, reason });
      const result = new PaymentResult({
        success       : resp.status === 'success',
        transactionId : resp.refundId || transactionId,
        status        : 'refunded',
        rawResponse   : resp,
      });
      if (this.cfg.logTx) TxLog.push({ ...result, step: 'refund', provider: 'iyzico' });
      return result;
    }

    async cancel(transactionId) {
      const resp   = await _post(this.base + '/cancel', { transactionId });
      const result = new PaymentResult({
        success       : resp.status === 'success',
        transactionId : transactionId,
        status        : 'cancelled',
        rawResponse   : resp,
      });
      if (this.cfg.logTx) TxLog.push({ ...result, step: 'cancel', provider: 'iyzico' });
      return result;
    }
  }

  /* ─────────────────────────────────────────────────────────────
   * PAYTR ADAPTER — sunucu proxy gerekir (/api/payment/paytr/*)
   *
   * PayTR iframe akışı:
   *   1. Sunucu merchant token üretir → client iFrame'i embed eder
   *   2. PayTR ödeme sonucunu webhook ile sunucuya bildirir
   *   3. Sunucu localStorage/DB'yi günceller
   *
   * Sunucu endpoint'leri:
   *   POST /api/payment/paytr/initiate   → { token }
   *   POST /api/payment/paytr/status     → { status, merchantOid }
   *   POST /api/payment/paytr/refund     → { status, refundId }
   *   POST /api/payment/paytr/webhook    ← PayTR sunucusu bu URL'ye POST atar (public URL gerekir)
   * ───────────────────────────────────────────────────────────── */
  class PayTRAdapter {
    constructor(cfg) {
      this.cfg  = cfg;
      this.base = cfg.serverUrl + '/payment/paytr';
    }

    async pay(order) {
      validateOrder(order);
      const resp = await _post(this.base + '/initiate', { order });
      if (!resp.token) throw new Error('[PayTR] Merchant token alınamadı');
      /* PayTR iframe embed için token döndürülür — UI iFrame'i gösterir */
      return {
        needsIframe   : true,
        iframeToken   : resp.token,
        transactionId : order.referenceId,
        iframeUrl     : `https://www.paytr.com/odeme/guvenli/${resp.token}`,
      };
    }

    async pollStatus(merchantOid) {
      const resp = await _post(this.base + '/status', { merchantOid });
      return new PaymentResult({
        success       : resp.status === 'success',
        transactionId : merchantOid,
        status        : resp.status,
        rawResponse   : resp,
      });
    }

    async refund(transactionId, amount, reason) {
      const resp   = await _post(this.base + '/refund', { merchantOid: transactionId, amount, reason });
      const result = new PaymentResult({
        success       : resp.status === 'success',
        transactionId : resp.refundId || transactionId,
        status        : 'refunded',
        rawResponse   : resp,
      });
      if (this.cfg.logTx) TxLog.push({ ...result, step: 'refund', provider: 'paytr' });
      return result;
    }

    async cancel(transactionId) {
      return this.refund(transactionId, 0, 'cancel');
    }
  }

  /* ─────────────────────────────────────────────────────────────
   * GATEWAY FACTORY
   * ───────────────────────────────────────────────────────────── */
  const ADAPTERS = { mock: MockAdapter, iyzico: IyzicoAdapter, paytr: PayTRAdapter };

  const PaymentGateway = {
    /**
     * Gateway instance oluştur.
     * @param {object} userConfig — DEFAULTS'ı override eder
     * @returns {MockAdapter|IyzicoAdapter|PayTRAdapter}
     */
    create(userConfig = {}) {
      const cfg     = { ...DEFAULTS, ...userConfig };
      const Adapter = ADAPTERS[cfg.provider];
      if (!Adapter) throw new Error('[PaymentGateway] Bilinmeyen provider: ' + cfg.provider);
      const gw = new Adapter(cfg);
      gw._config = cfg;
      return gw;
    },

    /* Yardımcı araçlar — doğrudan erişilebilir */
    TxLog,
    TEST_CARDS,
    luhnCheck,
    validateOrder,
    PaymentResult,
  };

  /* Global export */
  global.PaymentGateway = PaymentGateway;
  global.PaymentTxLog   = TxLog;

})(window);
