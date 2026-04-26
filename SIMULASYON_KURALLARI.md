# DenizBul.tr — Simülasyon Kuralları

> **Kaynak:** 2026 Türkiye deniz turizmi piyasası araştırması (sahibinden.com, viator.com, airbnb.com/experiences, teknekiralik.com, gezimanya.com)  
> **Amaç:** Simülasyon ve seed sistemlerinin gerçek dünya verilerinden kopuk değerler üretmesini önlemek.  
> **Son Güncelleme:** 2026-04-26

---

## 1. Tur Türüne Göre Fiyat Aralıkları (Kişi Başı, TL, 2026)

| Tur Türü | Min | Max | Tipik | Not |
|---|---|---|---|---|
| Balık Avı | 1.000 | 2.500 | 1.500 | Günlük, sabah + akşam seansı dahil; tüm ekipman dahil |
| Tekne Gezisi | 800 | 1.800 | 1.200 | Yarım/tam gün; piknik dahil olabilir |
| Yüzme Turu | 700 | 1.500 | 1.000 | Birden fazla koy; snorkel ekipmanı dahil |
| Günbatımı Turu | 500 | 1.000 | 700 | 2–3 saat; kokteyller veya atıştırmalık dahil |
| Dalış Turu | 1.500 | 2.500 | 2.000 | PADI rehber + ekipman + 2 dalış noktası dahil |
| Snorkeling | 700 | 1.400 | 900 | Ekipman dahil; orta zorluk |
| Mavi Tur | 5.000 | 15.000 | 8.000 | Kişi başı/gün; tam pansiyon + gulet kabin; 5–7 gün |
| Özel Etkinlik | 2.000 | 8.000 | 4.000 | Doğum günü / nişan / aile etkinliği; teknemi kiralıyorsun |
| Kurumsal | 3.000 | 10.000 | 6.000 | Şirket etkinliği / takım toplantısı; özel catering |

**Kurallar:**
- Simüle edilen fiyatlar hiçbir zaman bu aralıkların dışında olmamalıdır.
- `Math.round(rand(min, max) / 50) * 50` — fiyat 50'nin katı olarak yuvarlanmalıdır.
- Mavi Tur için `sure` alanı `"5 gün"` – `"7 gün"` arasında olmalıdır.

---

## 2. Tekne Türüne Göre Kapasite Aralıkları

| Tekne Türü | Min | Max | Tipik |
|---|---|---|---|
| Balıkçı Teknesi (motor/fiber) | 4 | 12 | 8 |
| Motor Yat | 6 | 20 | 12 |
| Yelkenli | 4 | 12 | 8 |
| Katamaran | 8 | 24 | 14 |
| Gulet (ahşap, klasik) | 8 | 30 | 16 |
| RIB / Şişme Bot | 4 | 10 | 6 |
| Sürat Teknesi | 4 | 8 | 6 |

**Kurallar:**
- `Balık Avı` turu için kapasite **maksimum 14** olmalıdır.
- `Mavi Tur` için kapasite **8–20** arasında olmalıdır (gulet ölçeği).
- `Günbatımı Turu` için kapasite **6–20** arasında olabilir.
- `Kurumsal` için kapasite **10–40** olabilir (özel charter).
- `Dalış Turu` için kapasite **4–12** arasında olmalıdır (güvenlik).

---

## 3. Tur Türüne Göre Süre Aralıkları

| Tur Türü | Tipik Süre |
|---|---|
| Balık Avı | "4 saat" veya "6 saat" |
| Tekne Gezisi | "3 saat", "4 saat", "6 saat", "Tam gün" |
| Yüzme Turu | "3 saat", "4 saat" |
| Günbatımı Turu | "2 saat", "3 saat" |
| Dalış Turu | "4 saat", "6 saat" |
| Snorkeling | "3 saat", "4 saat" |
| Mavi Tur | "5 gün", "6 gün", "7 gün" |
| Özel Etkinlik | "3 saat", "4 saat", "Tam gün" |
| Kurumsal | "4 saat", "6 saat", "Tam gün" |

---

## 4. Gerçek Tur İsimleri (Şablonlar)

Tur isimleri `"[Lokasyon] [Tur Türü]"` formatında oluşturulmalıdır:

```js
const GERCEK_TUR_ISIMLERI = {
  'Balik Avi':       ['Fethiye Sabah Balık Avı', 'Bodrum Derin Su Balık Avı', 'Marmaris Kıyı Balıkçılığı', 'Antalya Defne Koyu Balık Avı', 'Kaş Orkinos Avı', 'Kuşadası Sabah Balıkçılık Turu', 'Çeşme Günlük Balık Avı'],
  'Tekne Gezisi':    ['Fethiye 12 Ada Turu', 'Bodrum Karaada Turu', 'Marmaris Masmavi Koyu', 'Göcek 5 Ada Turu', 'Antalya Düden Şelalesi Koyu', 'Kemer Beyin Koyu Turu', 'Alanya Korsan Mağarası'],
  'Yuzme Turu':      ['Fethiye Kelebekler Vadisi Yüzme', 'Bodrum Bardakçı Koyu Yüzme', 'Marmaris Turunc Koyu', 'Göcek Tersane Adası Yüzme', 'Antalya Suluada Yüzme Turu'],
  'Gunbatimi Turu':  ['Bodrum Günbatımı Kokteyl Turu', 'Fethiye Günbatımı Manzara', 'Marmaris Yat Limanı Günbatımı', 'Çeşme Günbatımı Turu', 'Antalya Sahil Günbatımı'],
  'Dalis Turu':      ['Kaş PADI Dalış Turu', 'Bodrum Batık Gemi Dalışı', 'Marmaris Dalış Merkezi', 'Antalya Güvercin Adası Dalış', 'Fethiye İneada Dalış'],
  'Snorkeling':      ['Fethiye Ölüdeniz Snorkel', 'Bodrum Snorkel & Yüzme', 'Marmaris Cennet Koyu Snorkel', 'Antalya Konyaaltı Snorkel Turu', 'Kaş Kristal Sular Snorkel'],
  'Mavi Tur':        ['Fethiye–Göcek Mavi Tur', 'Bodrum–Marmaris Mavi Tur', 'Göcek–Antalya Gulet Turu', 'Marmaris–Fethiye Haftalık Mavi Tur', 'Antalya–Kaş Klasik Gulet'],
  'Ozel Etkinlik':   ['Bodrum Doğum Günü Teknesi', 'Fethiye Nişan Turu', 'Marmaris Aile Özel Tur', 'Antalya Evlilik Yıldönümü', 'İzmir Sunset Özel Parti'],
  'Kurumsal':        ['Bodrum Kurumsal Teambuilding', 'İzmir Şirket Etkinlik Teknesi', 'Antalya Konferans Sonrası Tur', 'Marmaris Ödül Gezisi', 'Fethiye Kurumsal VIP Tur']
};
```

---

## 5. Lokasyonlar (Öncelik Sırası)

Türkiye'nin en popüler tekne turu destinasyonları:

```js
const LOKASYONLAR = [
  'Bodrum', 'Marmaris', 'Fethiye', 'Göcek', 'Antalya',
  'Kemer', 'Kaş', 'Kalkan', 'Kuşadası', 'Çeşme',
  'İzmir', 'Alanya', 'Side', 'Finike', 'Datça'
];
```

Dağılım: Bodrum (15%), Marmaris (15%), Fethiye (15%), Antalya (12%), Göcek (10%), Kemer (8%), diğerleri eşit.

---

## 6. Kaptan İsimleri

```js
const KAPTAN_ADLAR = ['Mehmet', 'Ahmet', 'Ali', 'Mustafa', 'İbrahim', 'Emre', 'Murat', 'Hasan', 'Hüseyin', 'Osman', 'Yusuf', 'Ömer'];
const KAPTAN_SOYADLAR = ['Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Yıldız', 'Öztürk', 'Arslan', 'Doğan', 'Aydın', 'Özdemir', 'Aslan'];
const KAPTAN_DOMAIN = ['gmail.com', 'hotmail.com', 'yahoo.com.tr'];
// Email formatı: adi.soyadi@domain — örn: mehmet.yilmaz@gmail.com
```

---

## 7. Müşteri İsimleri

```js
const MUSTERI_ADLAR_ERKEK   = ['Kemal', 'Berk', 'Can', 'Deniz', 'Ege', 'Taha', 'Burak', 'Sercan'];
const MUSTERI_ADLAR_KADIN   = ['Ayşe', 'Fatma', 'Zeynep', 'Elif', 'Selin', 'Merve', 'Büşra', 'Deniz', 'Esra', 'Gül'];
const MUSTERI_SOYADLAR      = ['Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Yıldız', 'Öztürk', 'Arslan', 'Koç', 'Kurt'];
// Email formatı: ilk harf + soyad + 2 haneli sayı@domain — örn: ayilmaz82@gmail.com
```

---

## 8. Sezon Kuralları

```js
const SEZON = {
  pik:   { aylar: [6, 7, 8],       fiyatCarpani: 1.25, dolulukOrani: 0.90 },
  omuz:  { aylar: [4, 5, 9, 10],   fiyatCarpani: 1.00, dolulukOrani: 0.65 },
  kapat: { aylar: [11, 12, 1, 2, 3], fiyatCarpani: 0.70, dolulukOrani: 0.20 }
};
```

- Turlar **Kasım–Mart arası** oluşturulmamalıdır (sezon dışı, aktivite yok).
- Mavi Tur, Nisan öncesi ve Ekim sonrası planlanmamalıdır.
- Tarihler `tarihler[]` içinde **Nisan–Ekim** döneminde olmalıdır.

---

## 9. Tur Açıklaması Şablonları

```js
const ACIKLAMA_SABLONLARI = {
  'Balik Avi':       'Rehber kaptan eşliğinde %LOKASYON% açıklarında %SURE% balık avı turu. Tüm olta ekipmanı ve yem dahildir. Taze balıkları kendiniz pişirebilir ya da kaptan mutfağında pişirtilebilirsiniz.',
  'Tekne Gezisi':    '%LOKASYON% çevresindeki muhteşem koylara %SURE% tur. Öğle yemeği, meşrubat ve şnorkel ekipmanı dahildir. Maksimum %KAPASITE% kişilik özel grup.',
  'Yuzme Turu':      '%LOKASYON%\'un kristal berraklığındaki koylarında yüzme molalarıyla %SURE% tur. Şnorkel ekipmanı ve öğle sandviç dahil.',
  'Gunbatimi Turu':  '%LOKASYON% Körfezi\'nde muhteşem günbatımı manzarası eşliğinde %SURE% tekne turu. Hafif atıştırmalık ve içecek ikramı dahil.',
  'Dalis Turu':      'PADI sertifikalı rehber eşliğinde %LOKASYON%\'da 2 farklı dalış noktasına %SURE% tüplü dalış. Tüm ekipman dahil, 10+ sertifika gereklidir.',
  'Snorkeling':      '%LOKASYON%\'da şeffaf sularda şnorkeling keyfi. Ekipman dahil, yüzme bilen herkes katılabilir. %SURE% aktivite.',
  'Mavi Tur':        '%LOKASYON% hattında %SURE% gulet yolculuğu. Tam pansiyon, özel kabin, günde 3–4 koy durağı. Eşsiz bir Ege/Akdeniz deneyimi.',
  'Ozel Etkinlik':   'Doğum günü, nişan veya özel kutlamalarınız için %LOKASYON%\'da teknemi kiralıyorum. %SURE% süre, dekorasyon ve ikram tercihe göre düzenlenebilir.',
  'Kurumsal':        'Şirket etkinlikleri ve team building için %LOKASYON%\'da özel tekne turu. Catering ve aktivite programı talebe göre hazırlanabilir. %SURE%.'
};
```

---

## 10. Booking Dağılımı

Simülasyonda rezervasyon üretirken:
- Aktif turların **%60–80**'i en az 1 rezervasyona sahip olmalıdır.
- Rezervasyon `durum` dağılımı: `onaylandi` %50, `bekliyor` %25, `tamamlandi` %15, `iptal` %10.
- `odemeYapildi:true` olan rezervasyonların `db_payments`'te **her zaman** eşleşen kayıt olmalıdır.
- `guests` değeri: `Math.max(1, Math.round(tur.kapasite * 0.15))` ile `Math.min(tur.kapasite, tur.kapasite * 0.5)` arasında.

---

## 11. Kategori → Kapasite/Fiyat Eşleşmesi (Özet Referans)

```js
const TUR_PROFIL = {
  'Balik Avi':      { minFiyat: 1000, maxFiyat: 2500, minKap: 4,  maxKap: 12, sureler: ['4 saat','6 saat'] },
  'Tekne Gezisi':   { minFiyat:  800, maxFiyat: 1800, minKap: 6,  maxKap: 20, sureler: ['3 saat','4 saat','6 saat','Tam gün'] },
  'Yuzme Turu':     { minFiyat:  700, maxFiyat: 1500, minKap: 6,  maxKap: 18, sureler: ['3 saat','4 saat'] },
  'Gunbatimi Turu': { minFiyat:  500, maxFiyat: 1000, minKap: 6,  maxKap: 20, sureler: ['2 saat','3 saat'] },
  'Dalis Turu':     { minFiyat: 1500, maxFiyat: 2500, minKap: 4,  maxKap: 12, sureler: ['4 saat','6 saat'] },
  'Snorkeling':     { minFiyat:  700, maxFiyat: 1400, minKap: 6,  maxKap: 16, sureler: ['3 saat','4 saat'] },
  'Mavi Tur':       { minFiyat: 5000, maxFiyat:15000, minKap: 8,  maxKap: 20, sureler: ['5 gün','6 gün','7 gün'] },
  'Ozel Etkinlik':  { minFiyat: 2000, maxFiyat: 8000, minKap: 6,  maxKap: 24, sureler: ['3 saat','4 saat','Tam gün'] },
  'Kurumsal':       { minFiyat: 3000, maxFiyat:10000, minKap: 10, maxKap: 40, sureler: ['4 saat','6 saat','Tam gün'] }
};
```

---

## 12. Simülasyon Kalite Kontrol Listesi

Simülasyon çalıştırmadan önce aşağıdaki kontroller yapılmalıdır:

- [ ] Üretilen her tur fiyatı `TUR_PROFIL[kategori]` aralığında mı?
- [ ] Üretilen her tur kapasitesi `TUR_PROFIL[kategori]` aralığında mı?
- [ ] Tüm tur tarihleri Nisan–Ekim döneminde mi?
- [ ] Ulusal yas tarihleri tur tarihlerinden çıkarıldı mı?
- [ ] `odemeYapildi:true` her booking için `db_payments`'te kayıt var mı?
- [ ] `tarih` alanı DD.MM.YYYY formatında mı?
- [ ] `tarihISO` alanı YYYY-MM-DD formatında mı?
- [ ] `guests >= 1` mı?
- [ ] `tourId` geçerli aktif bir tura işaret ediyor mu?

---

*Bu dosya, `PANELLER/admin-panel.html` ve `PANELLER/seed-data.html` simülasyon motorları tarafından referans alınmaktadır.*
