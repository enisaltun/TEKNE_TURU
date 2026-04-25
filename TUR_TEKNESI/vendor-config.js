/**
 * vendor-config.js
 * ─────────────────────────────────────────────────────────────────
 * Seyyar Satici Sistemi — Merkezi Konfigurasyon
 *
 * DUZENLEME KILAVUZU
 * ──────────────────
 * • Fiyat degistirmek   → ilgili alani bul, sayiyi degistir
 * • Paket eklemek       → packages dizisine yeni bir { } blogu ekle
 * • Rozet esigi degist. → badges dizisinde ilgili satiri bul, minReviews / minRating guncelle
 * • Yorum kategorisi    → reviewCategories dizisine { id:"...", label:"..." } ekle/cikart
 * • Sahil eklemek       → beaches dizisine { id:"...", label:"..." } satiri ekle
 * • Stok esigi degist.  → stockStatuses icinde threshold degerini guncelle
 *
 * KURAL: id degerleri kucuk harf, tire veya alt cizgi kullanir — bosluk olmaz.
 *        label degerleri ekranda gosterilen Turkce metindir.
 *
 * Kullanim: her HTML dosyasinda kendi <script> blogundan ONCE yuklenir:
 *   <script src="vendor-config.js"></script>
 * ─────────────────────────────────────────────────────────────────
 */

const VENDOR_CONFIG = {

  /* ═══════════════════════════════════════════════════════════════
     1. CANLI SATIS SAATLERİ
     Saat 0-23 arasi tam sayi. start dahil, end dahil.
     Bu aralik disinda "Canli Sat" butonu deaktif olur.
  ═══════════════════════════════════════════════════════════════ */
  liveHours: {
    start: 5,    // 05:00 — en erken acilis saati
    end:   23,   // 23:00 — en gec kapanis saati
  },


  /* ═══════════════════════════════════════════════════════════════
     2. İLAN ÜCRETLERİ (TL)
  ═══════════════════════════════════════════════════════════════ */
  listing: {
    baseFee:       20,   // standart tek ilan ucreti (TL)
    featuredExtra: 15,   // "One Cikan Ilan" ek ucreti (TL) — baseFee'ye eklenir
  },


  /* ═══════════════════════════════════════════════════════════════
     3. PAKET FİYATLARI
     Her paket: kac ilan hakki verdigi, toplam fiyati ve indirim yuzdesi.
     pricePerUnit otomatik hesaplama icin referans — elle guncelle.
     discount: gosteriminlik yuzde — hesaplamada kullanilmaz.
  ═══════════════════════════════════════════════════════════════ */
  packages: [
    {
      id:           'single',
      label:        'Tekli',
      count:        1,
      price:        20,    // TL
      pricePerUnit: 20,    // TL/ilan
      discount:     0,     // %
    },
    {
      id:           'pack10',
      label:        "10'lu Paket",
      count:        10,
      price:        170,   // TL
      pricePerUnit: 17,    // TL/ilan
      discount:     15,    // %
    },
    {
      id:           'pack25',
      label:        "25'li Paket",
      count:        25,
      price:        375,   // TL
      pricePerUnit: 15,    // TL/ilan
      discount:     25,    // %
    },
    {
      id:           'pack50',
      label:        "50'li Paket",
      count:        50,
      price:        650,   // TL
      pricePerUnit: 13,    // TL/ilan
      discount:     35,    // %
    },
  ],


  /* ═══════════════════════════════════════════════════════════════
     4. ROZET SEVİYELERİ
     Siralama onemlidir — dusukten yuksege dogru.
     discountPct: bu rozetteki satici icin ilan ucreti indirimi (%)
     Hesaplama: efektifFiyat = baseFee * (1 - discountPct / 100)
     color: uygulama genelinde rozet rengi (hex)
     icon:  rozet yaninda gosterilen karakter
  ═══════════════════════════════════════════════════════════════ */
  badges: [
    {
      id:          'new',
      label:       'Yeni Satici',
      minReviews:  0,
      minRating:   0.0,
      discountPct: 0,
      color:       '#94a3b8',   // gri
      icon:        '',
    },
    {
      id:          'trusted',
      label:       'Guvenilir Satici',
      minReviews:  5,
      minRating:   4.0,
      discountPct: 10,          // 20 TL → 18 TL/ilan
      color:       '#3b82f6',   // mavi
      icon:        '✓',
    },
    {
      id:          'super',
      label:       'Super Satici',
      minReviews:  20,
      minRating:   4.5,
      discountPct: 20,          // 20 TL → 16 TL/ilan
      color:       '#f59e0b',   // altin
      icon:        '★',
    },
    {
      id:          'elite',
      label:       'Elit Satici',
      minReviews:  50,
      minRating:   4.8,
      discountPct: 35,          // 20 TL → 13 TL/ilan
      color:       '#8b5cf6',   // elmas/mor
      icon:        '♦',
    },
  ],


  /* ═══════════════════════════════════════════════════════════════
     5. YORUM KATEGORİLERİ
     Musteri yorum yaparken bu kategorilerin her birine 1-5 yildiz verir.
     Genel puan bu kategorilerin ortalamasindan hesaplanir.
  ═══════════════════════════════════════════════════════════════ */
  reviewCategories: [
    { id: 'product_quality',   label: 'Urun Kalitesi'     },
    { id: 'price_performance', label: 'Fiyat / Performans' },
    { id: 'location_accuracy', label: 'Konum Dogrulugu'   },
    { id: 'vendor_attitude',   label: 'Satici Tutumu'     },
  ],


  /* ═══════════════════════════════════════════════════════════════
     6. STOK DURUMLARI
     threshold: bu miktar ve altinda otomatik bu duruma gec.
     null → elle secilir, otomatik gecis yoktur.
     Siralama: en iyiden en kotu duruma dogru.
  ═══════════════════════════════════════════════════════════════ */
  stockStatuses: [
    { id: 'plenty',   label: 'Bol Stok',   color: '#10b981', threshold: null },
    { id: 'low',      label: 'Azaliyor',   color: '#f59e0b', threshold: 10   },
    { id: 'few5',     label: 'Son 5 Adet', color: '#f97316', threshold: 5    },
    { id: 'critical', label: 'Son 2 Adet', color: '#ef4444', threshold: 2    },
    { id: 'sold_out', label: 'Tukendi',    color: '#94a3b8', threshold: 0    },
  ],


  /* ═══════════════════════════════════════════════════════════════
     7. PAZARLAMA ETİKETLERİ
     Satici ilana bu etiketleri ekleyerek musteri dikkatini cekebilir.
     Bir ilana birden fazla etiket eklenebilir.
  ═══════════════════════════════════════════════════════════════ */
  marketingTags: [
    { id: 'last2',    label: 'Son 2 Adet',     icon: '⚡' },
    { id: 'ending',   label: 'Tukenmek Uzere', icon: '🔥' },
    { id: 'discount', label: 'Indirimli',       icon: '💸' },
    { id: 'fresh',    label: 'Taze Yem',        icon: '🐛' },
    { id: 'new_item', label: 'Yeni Geldi',      icon: '✨' },
  ],


  /* ═══════════════════════════════════════════════════════════════
     8. ÜRÜN KATEGORİLERİ
     icon: Font Awesome 6 sinif adi (fas fa-...)
  ═══════════════════════════════════════════════════════════════ */
  productCategories: [
    { id: 'rod',       label: 'Olta Takimlari', icon: 'fas fa-water'    },
    { id: 'bait',      label: 'Yemler',         icon: 'fas fa-bug'      },
    { id: 'accessory', label: 'Aksesuar',        icon: 'fas fa-toolbox'  },
    { id: 'package',   label: 'Hazir Paketler', icon: 'fas fa-box-open' },
  ],


  /* ═══════════════════════════════════════════════════════════════
     9. KONUM DOĞRULAMA
     requiredAccuracyM : GPS doğruluğu bu metrenin altında olmali (daha kucuk = daha hassas).
     lockDuration      : 'daily' — satici ayni gun konumunu degistiremez.
     GPS alınamadığında veya dogruluk yetersizse ilan acilmaz.
  ═══════════════════════════════════════════════════════════════ */
  locationVerification: {
    requiredAccuracyM: 150,   // metre — GPS dogrulugu esigi
    lockDuration:      'daily', // 'daily' → gece yarisi sifirlanir
  },


  /* ═══════════════════════════════════════════════════════════════
     12. GUVEN SKORU EŞİKLERİ
     Musteri "Saticiyi bulamadim" butonu ile sikayet bildirebilir.
     warnAt    → bu kadar bildirimdе admin'e uyari gider
     suspendAt → bu kadar bildirimde satici otomatik gecici askiya alinir
  ═══════════════════════════════════════════════════════════════ */
  trustScore: {
    warnAt:    3,   // bildirim sayisi
    suspendAt: 5,   // bildirim sayisi
  },


  /* ═══════════════════════════════════════════════════════════════
     11. SAHİL / KONUM LİSTESİ
     lat / lng : sahilin merkez koordinati (Google Maps'ten alinabilir)
     radiusM   : bu metre yaricap icinde GPS eslesmesi kabul edilir
     Yeni sahil eklemek icin liste sonuna obje ekle.
     id: benzersiz, kucuk harf, tire kullan (bosluk yok)
  ═══════════════════════════════════════════════════════════════ */
  beaches: [
    { id: 'konyaalti',        label: 'Konyaalti Sahili',       lat: 36.8562, lng: 30.6272, radiusM: 600  },
    { id: 'lara',             label: 'Lara Plaji',             lat: 36.8358, lng: 30.7897, radiusM: 500  },
    { id: 'ataturk_iskelesi', label: 'Ataturk Parki Iskelesi', lat: 36.8867, lng: 30.7056, radiusM: 300  },
    { id: 'olympos',          label: 'Olympos Koyu',           lat: 36.3968, lng: 30.4710, radiusM: 400  },
    { id: 'phaselis',         label: 'Phaselis Koyu',          lat: 36.5246, lng: 30.5523, radiusM: 400  },
    { id: 'tekirova',         label: 'Tekirova Sahili',        lat: 36.5000, lng: 30.5344, radiusM: 400  },
    { id: 'beldibi',          label: 'Beldibi Plaji',          lat: 36.7247, lng: 30.5569, radiusM: 400  },
    { id: 'goynuk',           label: 'Goynuk Koyu',            lat: 36.7511, lng: 30.5300, radiusM: 350  },
    { id: 'kemer_merkez',     label: 'Kemer Merkez Iskelesi',  lat: 36.5997, lng: 30.5592, radiusM: 300  },
    { id: 'cirali',           label: 'Cirali Sahili',          lat: 36.4180, lng: 30.4780, radiusM: 450  },
  ],

};
