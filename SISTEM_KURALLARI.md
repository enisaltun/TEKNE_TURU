# DenizBul.tr — Sistem Kuralları ve Mantık Kılavuzu

Bu dosya platform bileşenlerinin çalışma mantığını, veri kontratlarını ve iş kurallarını tanımlar.
Yeni geliştirme yapılırken bu kurallara uyulması zorunludur.

---

## 1. Veri Kontratları

### Tour (db_tours)
Zorunlu alanlar ve geçerlilik koşulları:
| Alan | Tip | Kural |
|---|---|---|
| id | number | Benzersiz, pozitif tam sayı |
| ad | string | Min 3 karakter, şüpheli içerik (asdf/test/...) olamaz |
| fiyat | number | 1 ≤ fiyat ≤ 500.000 TL |
| price | number | Her zaman fiyat ile eşit olmalı (fiyat === price) |
| kapasite | number | 1 ≤ kapasite ≤ 500 |
| sure | string | Boş olamaz, "0" olamaz |
| tarihler | string[] | Min 1 tarih, ISO format (YYYY-MM-DD) |
| kategoriler | string[] | Sadece geçerli kategorilerden oluşmalı |
| aciklama | string | Boş veya whitespace-only olamaz |
| captainEmail | string | Geçerli email, aktif kaptan olmalı |
| durum | string | Sadece: aktif / bekliyor / iptal / reddedildi |

Geçerli kategoriler: Balik Avi, Tekne Gezisi, Yuzme Turu, Gunbatimi Turu, Mavi Tur, Dalis Turu, Snorkeling, Ozel Etkinlik, Kurumsal

### Booking (db_bookings)
| Alan | Tip | Kural |
|---|---|---|
| id | string | Benzersiz |
| tourId | string/number | Geçerli bir tur kaydına işaret etmeli |
| tarihISO | string | ISO format, tur tarihler[] içinde olmalı |
| tarih | string | DD.MM.YYYY format, tarihISO ile tutarlı olmalı |
| guests | number | 1 ≤ guests ≤ tur.kapasite |
| durum | string | Sadece: bekliyor / onaylandi / tamamlandi / iptal / reddedildi |
| odemeYapildi | boolean | true ise odemeRef zorunlu |
| odemeRef | string | db_payments'te eşleşen kayıt olmalı |
| captainEmail | string | tur.captainEmail ile eşit olmalı |

### Payment (db_payments)
| Alan | Tip | Kural |
|---|---|---|
| id/ref | string | Booking.odemeRef ile eşleşmeli |
| tutar | number | booking.price ile eşit olmalı |
| komisyon | number | tutar * 0.025 (platform payı) |
| kaptanNet | number | tutar * 0.875 (kaptanın net alacağı) |
| durum | string | odendi / iade / bekliyor |

**Finansal Invariant**: komisyon + kaptanNet + (tutar * 0.10) = tutar (platform 2.5%, kaptan 87.5%, rezerv 10%)

### Captain (db_captains)
| Alan | Kural |
|---|---|
| durum | aktif / bekliyor / askida / reddedildi |
| belgeler | verified=true ise sisteme girişe izin verilir |

---

## 2. Durum Makineleri

### Tur Durum Makinesi
```
bekliyor → aktif          (admin onaylar)
bekliyor → reddedildi     (admin reddeder VEYA 48h+ bekleyince otomatik)
aktif    → iptal          (admin veya kaptan iptal eder)
aktif    → bekliyor       YASAK — geriye dönemez
reddedildi → aktif        YASAK — reddedilmiş tur tekrar aktif edilemez
iptal    → herhangi biri  YASAK — iptal geri alınamaz
```

**Kural**: Tur iptal veya reddedildiğinde, o tura ait TÜM aktif rezervasyonlar otomatik iptal edilmelidir (cascade zorunlu).

### Rezervasyon Durum Makinesi
```
bekliyor → onaylandi      (kaptan onaylar)
bekliyor → reddedildi     (kaptan reddeder)
bekliyor → iptal          (müşteri iptal eder VEYA tur kapanırsa)
onaylandi → tamamlandi    (tur tarihi geçince VEYA biniş yapılınca)
onaylandi → iptal         (kaptan/müşteri/platform iptal eder)
tamamlandi → herhangi biri YASAK — tamamlandı geri alınamaz
reddedildi → herhangi biri YASAK
iptal → herhangi biri     YASAK
```

**Kural**: Geçmiş tarihteki aktif rezervasyonlar otomatik tamamlanmalı (bekliyor → iptal, onaylandi → tamamlandi).

---

## 3. Cascade Kuralları

1. **Tur iptal/reddedildi** → Tüm aktif (bekliyor + onaylandi) rezervasyonlar iptal
2. **Rezervasyon iptal** → Müşteriye bildirim gönder (cu_notifs)
3. **Rezervasyon iptal** → Kaptana bildirim gönder (ca_notifications)
4. **Hava/mücbir iptal** → refundStatus otomatik 'approved' olur
5. **Tur tarihinden reservasyon tarihi çıkarıldığında** → o tarihli aktif rezervasyonlar iptal

---

## 4. Fiyatlandırma Kuralları

- `fiyat` = Kişi başı fiyat (TL)
- `price` alanı her zaman `fiyat` ile AYNI olmalı (alias)
- Toplam rezervasyon tutarı: `fiyat × guests`
- Minimum fiyat: 1 TL (0, negatif, 0.01 geçersiz)
- Maksimum fiyat: 500.000 TL
- Komisyon hesabı: `tutar × 0.025`
- Kaptan net: `tutar × 0.875`
- İade tutarı rezervasyon tutarını aşamaz (+%1 tolerans)

---

## 5. Ödeme Kuralları

- Her `odemeYapildi:true` + `odemeRef` olan rezervasyonun `db_payments`'te eşleşen kaydı OLMALI
- Ödeme kaydı olmayan ama `odemeYapildi:true` olan rezervasyon → integrity pass synthetic kayıt oluşturur
- `odemeYapildi:true` ama `odemeRef` yoksa → `odemeYapildi=false` yapılır (B12)
- `tamamlandi` durumdaki `odemeYapildi:false` rezervasyon → `completed_unpaid` hatası

---

## 6. Tarih Kuralları

- Tarih formatı: `tarihISO` = "YYYY-MM-DD", `tarih` = "DD.MM.YYYY"
- Her iki format her zaman SENKRON olmalı
- Format dönüşümü için `isoToTr()` ve `trToISO()` fonksiyonları kullanılmalı, `toLocaleDateString()` KULLANILMAMALI (locale bağımlı)
- Rezervasyon tarihi tur `tarihler[]` içinde olmak zorunda
- Ulusal yas günlerinde tur tarihi olamaz (`db_mourning`)
- Geçmiş tarihli aktif rezervasyon olamaz

---

## 7. Kapasite Kuralları

- `(toplam aktif rezervasyon kişisi) ≤ tur.kapasite` (her tarih için ayrı ayrı)
- Aşım durumunda: en yeni aktif rezervasyonlar iptal edilir (overcap trim)
- `guests ≤ 0` olan aktif rezervasyon iptal edilir

---

## 8. Bildirim Kuralları

| Tetikleyici | Giden | Anahtar |
|---|---|---|
| Yeni rezervasyon | Kaptana | ca_notifications |
| Rezervasyon onaylandı | Müşteriye | cu_notifs |
| Rezervasyon reddedildi | Müşteriye | cu_notifs |
| Rezervasyon iptal (tur kapandı) | Müşteriye | cu_notifs |
| Yeni rezervasyon onayı bekliyor | Admin | admin_notifs |

Bildirim format standardı:
```js
{ id, title, body, type: 'success'|'danger'|'info'|'warning', read: false, ts: ISO_string, bookingId? }
```
- `cu_notifs` → customer-app okur
- `ca_notifications` → captain-app okur
- `admin_notifs` → admin-panel okur
- Eski `cu_notifications` anahtarı GEÇERSİZ — kullanılmaz

---

## 9. Integrity Pass Davranışı

`runIntegrityPass(opts)` — her zaman güvenli çalıştırılabilir, idempotent.

### Non-aggressive (her çağrıda çalışır):
- Duplicate booking ID → ID suffix ekle
- Tarih formatı uyumsuzluğu → yeniden türet
- Captian email uyumsuzluğu → tur'dan düzelt
- Geçmiş tarihli aktif rezervasyon → otomatik tamamla/iptal
- binisYapildi=true + onaylandi → tamamlandi
- binisYapildi=true + iptal/reddedildi → binisYapildi=false
- odemeYapildi=true + odemeRef yok → odemeYapildi=false
- Unknown customer email → db_users'a upsert
- Admin onay timeout (48h+) → reddedildi
- Dangling payment ref → synthetic payment oluştur

### Aggressive (opts.aggressive=true, admin Fix butonunda):
- Kapasite sıfır/negatif → 8
- Orphan booking (tur yok) → iptal
- Iptal/reddedildi tur + aktif booking → cascade iptal
- Geçersiz guests (≤0) → iptal
- Overcapacity → en yeni bookingleri trim et
- No-show kaydı → binisYapildi=true işaretle
- Hava/mücbir iptali iade yok → refundStatus='approved'
- Fiyat < 1 TL → 500; fiyat > 500.000 → 500.000
- fiyat ↔ price senkronizasyonu
- Kapasite/süre bozuk → 8/4 saat
- Geçersiz kategori → Tekne Gezisi
- Boş/whitespace aciklama → placeholder
- Boş/şüpheli ad → iptal
- Boş tarihler → booking tarihlerinden backfill, yoksa +7/+14/+21 gün
- Ulusal yas tarihlerini tur tarihlerinden kaldır

---

## 10. Simülasyon Kuralları

Simülasyon veri üretirken şu kurallara uymalı:
1. Her `odemeYapildi:true` booking için `db_payments`'te eşleşen kayıt OLMALI
2. Tur `tarihler[]` oluşturulurken ulusal yas tarihleri filtrelenmeli
3. Kaptan/müşteri email'leri düşük harfle yazılmalı
4. Tour `fiyat` = kişi başı fiyat, `price = fiyat` (alias)
5. Booking `price = tur.fiyat × guests`

---

## 11. Yasak Operasyonlar

- `cu_notifications` yazma (dead key — `cu_notifs` kullanılmalı)
- `toLocaleDateString()` ile tarih karşılaştırma (locale bağımlı — `isoToTr()` kullanılmalı)
- Fiyat alanı olarak `0`, `-x`, `0.01` gibi değerler (min 1 TL)
- `iptal` veya `reddedildi` turda aktif rezervasyon bırakma
- Tur durum geçişleri kuralları dışında (state machine'e uyulmalı)
- Ödeme kaydı olmadan `odemeYapildi:true` yazma
- `tarih` alanına ISO format (YYYY-MM-DD) yazmak — `tarih` her zaman DD.MM.YYYY formatında olmalı
- `guests ≤ 0` olan rezervasyon oluşturmak
- `tourId: null` olan rezervasyon oluşturmak
- Geçersiz email (format dışı veya boş) ile rezervasyon oluşturmak

---

## 12. Write-Time Validation Kuralları

`createBookingCanonical()` çağrılmadan önce aşağıdaki koşullar sağlanmalıdır:

| Alan | Kural | Hata Mesajı |
|---|---|---|
| `tourId` | Mevcut bir tura referans etmeli, null olamaz | tourId zorunludur |
| `guests` | `>= 1` tamsayı | guests en az 1 olmalıdır |
| `tarihISO` veya `tarih` | En az biri mevcut olmalı | Rezervasyon tarihi zorunludur |
| `customerEmail` | RFC-uyumlu email formatı | Geçerli müşteri e-postası zorunludur |
| `tarih` format | `DD.MM.YYYY` — asla `YYYY-MM-DD` değil | normalizeBookingDates() otomatik düzeltir |

`createBookingCanonical()` bu kural ihlallerini `{ok:false, errors:[...]}` ile reddeder ve hiçbir veri yazmaz.

---

## 13. Veri Oluşturma (Simülasyon / Seed) Kuralları

Simülasyon veya seed sistemleri veri üretirken:

1. `tarihISO` — her zaman `YYYY-MM-DD` formatında olmalı
2. `tarih` — her zaman `DD.MM.YYYY` formatında olmalı (asla ISO formatında `tarih` yazılmamalı)
3. `guests` — her zaman `>= 1` pozitif tamsayı olmalı
4. `tourId` — her zaman mevcut bir turdaki ID'yi göstermeli (null kabul edilmez)
5. `customerEmail` — geçerli email formatında olmalı (minimum `x@y.z`)
6. `tourId` → tur `durum:'aktif'` değilse booking oluşturulmamalı
7. Kapasite kontrolü: `toplam_aktif_guests ≤ tur.kapasite` aşılmamalı

Bu kural ihlalleri `runHealthScan()` tarafından tespit edilir. Her kategori için `shFixCategory(cat)` ile tek-tıkla onarım uygulanabilir.

---

## 14. Otomatik Onarım Hiyerarşisi

Sağlık taraması sonuçlarına göre onarım önceliği:

| Öncelik | Kategori | Yöntem | Geri Alınabilir |
|---|---|---|---|
| 1 | `missing_tarihISO` | tarihISO Backfill (safe) | Evet |
| 1 | `tarihISO_mismatch` | Tarih Senkronize (safe) | Evet |
| 1 | `captain_mismatch` | Kaptan Düzelt (safe) | Evet |
| 2 | `unknown_customer` | Kullanıcı Upsert (safe) | Evet |
| 2 | `past_date_active` | Otomatik Geçiş (safe) | Evet |
| 3 | `booking_on_cancelled_tour` | Cascade İptal (aggressive) | Hayır |
| 3 | `orphan_booking` | Yetim → İptal (aggressive) | Hayır |
| 3 | `invalid_guests` | Geçersiz → İptal (aggressive) | Hayır |
| 4 | `overcapacity` | Kapasite Trim (aggressive) | Hayır |

---

*Son güncelleme: 2026-04-26 | Kural sayısı: 14 bölüm*
