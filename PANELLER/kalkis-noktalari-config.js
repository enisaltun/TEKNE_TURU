/**
 * kalkis-noktalari-config.js
 * ───────────────────────────
 * Kaptan wizard Step 2 — Kalkış Noktası seçimi bu dosyadan okunur.
 *
 * Yeni nokta eklemek  → ilgili şehir ve bölge dizisine string ekleyin.
 * Yeni bölge eklemek  → ilgili şehir nesnesine yeni key-dizi çifti ekleyin.
 * Yeni şehir eklemek  → KALKIS_NOKTALARI nesnesine yeni key-nesne çifti ekleyin.
 *
 * Format:
 *   const KALKIS_NOKTALARI = {
 *     "Şehir Adı": {
 *       "Bölge Adı": ["Nokta 1", "Nokta 2", ...],
 *       ...
 *     },
 *     ...
 *   };
 */

const KALKIS_NOKTALARI = {
  "Istanbul": {
    "Anadolu Yakası": [
      "Poyrazköy",
      "Anadolu Kavağı",
      "Beykoz Merkez",
      "Çubuklu",
      "Anadolu Hisarı",
      "Kurbağalıdere",
      "Kuleli",
      "Salacak",
      "Küçükyalı",
      "Kartal",
      "Pendik",
      "Tuzla",
      "Büyükada",
      "Şile",
      "Ağva"
    ],
    "Avrupa Yakası": [
      "Rumeli Feneri",
      "Garipçe Köyü",
      "Rumeli Kavağı",
      "Sarıyer Merkez",
      "Kireçburnu",
      "Arnavutköy",
      "Cibali",
      "Yenikapı",
      "Kumkapı",
      "Zeytinburnu",
      "Bakırköy",
      "Yeşilköy",
      "Avcılar",
      "Gürpınar",
      "Büyükçekmece",
      "Silivri Merkez",
      "Karaburun"
    ]
  },
  "Antalya": {
    "Merkez": [
      "Kaleiçi Marina",
      "Konyaaltı İskelesi"
    ],
    "Kemer": [
      "Kemer Marina"
    ],
    "Kaş": [
      "Kaş Marina"
    ],
    "Side": [
      "Side İskelesi"
    ],
    "Alanya": [
      "Alanya Marina"
    ]
  },
  "Muğla": {
    "Marmaris": [
      "Marmaris Marina",
      "Netsel Marina"
    ],
    "Bodrum": [
      "Milta Marina",
      "Yalıkavak Marina",
      "Turgutreis İskelesi"
    ],
    "Fethiye": [
      "Fethiye Marina",
      "Göcek Marina"
    ]
  },
  "Izmir": {
    "Merkez": [
      "Kordon İskelesi",
      "Alsancak Marina"
    ],
    "Çeşme": [
      "Çeşme Marina",
      "Alaçatı İskelesi"
    ]
  }
};
