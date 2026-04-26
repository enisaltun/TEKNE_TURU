# DenizBul.tr — Güvenlik Planı

> **Durum:** Geliştirme aşaması (mockup). Bu belge, projeyi canlı yayına almadan önce uygulanacak güvenlik önlemlerini tanımlar.
> **Son Güncelleme:** 2026-04-26

---

## 1. Mevcut Açıklar ve Risk Seviyeleri

### 🔴 KRİTİK

#### 1.1 Plaintext Şifre Depolama
- **Dosya:** `supabase-client.js` — satır 928, 104
- **Sorun:** Kullanıcı şifreleri `kullanicilar.sifre` sütununda düz metin olarak saklanıyor. Giriş işlemi `.eq('sifre', password)` ile düz metin karşılaştırması yapıyor. `_sbUserToLocal()` fonksiyonu şifreyi client'a geri döndürüyor ve `localStorage`'a yazılıyor.
- **Risk:** Veritabanı sızdırılırsa tüm kullanıcı şifreleri açığa çıkar. localStorage XSS ile okunursa şifreler ele geçirilir.
- **Çözüm:** Supabase Auth sistemine geç (`supabase.auth.signUp` / `signInWithPassword`). Şifreler hiçbir zaman uygulama katmanında saklanmaz, Supabase bcrypt ile hash'ler.

#### 1.2 Tehlikeli Fonksiyonlar `window` Scope'unda
- **Dosya:** `supabase-client.js` — satır 1073, 1102, 217
- **Sorun:** `window.clearSupabaseAll`, `window.exportToSupabase`, `window.DB` global olarak erişilebilir. Tarayıcı konsolunu açan herhangi biri bu fonksiyonları çağırabilir.
- **Risk:** `clearSupabaseAll()` komutuyla tüm veritabanı silinebilir. `exportToSupabase()` ile hassas veriler dışa aktarılabilir.
- **Çözüm:** Bu fonksiyonları `window`'dan kaldır. Admin panel içinde, oturum doğrulandıktan sonra çalışan yerel fonksiyonlara dönüştür. Admin işlemleri için sunucu tarafı doğrulama ekle.

#### 1.3 Supabase RLS (Row Level Security) Kapalı Olabilir
- **Dosya:** `supabase-client.js` — satır 21-22
- **Sorun:** Anon key (`SUPABASE_KEY`) client kodunda görünür. RLS politikaları tanımlanmamışsa, anahtarı bilen herkes Supabase REST API üzerinden tüm tabloları okuyabilir/yazabilir/silebilir.
- **Risk:** Dışarıdan doğrudan `curl` veya Postman ile tüm müşteri verilerine, rezervasyonlara, ödemelere erişilebilir.
- **Çözüm:** Her tablo için Supabase Dashboard'da RLS politikaları tanımla (bkz. Bölüm 3).

---

### 🟠 YÜKSEK

#### 1.4 Ödeme Sunucusu CORS Açık (`*`)
- **Dosya:** `payment/server/index.js` — satır 29
- **Sorun:** `cors({ origin: '*' })` ayarı her domain'den istek kabul eder.
- **Risk:** Başka bir web sitesi sizin ödeme API endpoint'lerinize istek gönderebilir (CSRF benzeri saldırılar).
- **Çözüm:** `origin` değerini production domain ile sınırla: `origin: 'https://denizbul.tr'`

#### 1.5 Brute-Force / Rate Limiting Yok
- **Dosya:** `auth.html` — login formu
- **Sorun:** Login formunda başarısız deneme sayacı yok. Sınırsız şifre denemesi yapılabilir.
- **Risk:** Otomatik araçlarla (Hydra, Burp Suite) kısa sürede şifre kırılabilir.
- **Çözüm:** Client tarafında 5 başarısız denemede 30 saniyelik bekleme. Sunucu tarafında IP bazlı rate limiting (Supabase Edge Functions ile veya payment sunucusuna `express-rate-limit` ekle).

#### 1.6 Oturum Yönetimi Zayıf
- **Sorun:** Oturum bilgisi `localStorage`'da tutuluyor. Süre sınırı yok. Çıkış yapılınca token geçersiz kılınmıyor.
- **Risk:** XSS saldırısıyla token çalınabilir. Paylaşılan bilgisayarda oturum sonsuza dek açık kalır.
- **Çözüm:** Supabase Auth'a geçince bu sorun büyük ölçüde çözülür (Supabase otomatik token yenileme ve geçersiz kılma yapar). Oturum süresini 24 saat ile sınırla.

---

### 🟡 ORTA

#### 1.7 XSS (Cross-Site Scripting) Riski
- **Sorun:** Kullanıcı tarafından girilen içerik (yorum, mesaj, tur adı, kaptan adı) `innerHTML` ile render ediliyorsa script enjeksiyonu mümkün.
- **Risk:** Saldırgan `<script>clearSupabaseAll()</script>` gibi içerik göndererek diğer kullanıcıların tarayıcısında kod çalıştırabilir.
- **Çözüm:** Kullanıcı girdilerini `textContent` ile render et. Zorunlu durumlarda DOMPurify kütüphanesi kullan.

#### 1.8 Hassas Veri localStorage'da
- **Sorun:** `db_users`, `cu_users` anahtarları altında kullanıcı şifreleri, TC kimlik numaraları, telefon numaraları localStorage'da düz metin olarak tutuluyor.
- **Risk:** Aynı tarayıcıda başka bir XSS açığı olan site bu verileri okuyabilir.
- **Çözüm:** Supabase Auth'a geçince şifreler localStorage'a hiç yazılmayacak. TC kimlik gibi hassas alanları client'ta tutma, sunucu tarafında doğrula.

#### 1.9 İçerik Güvenliği Politikası (CSP) Yok
- **Sorun:** HTML dosyalarında `Content-Security-Policy` header'ı tanımlanmamış.
- **Risk:** XSS saldırılarına ek bir kapı açık.
- **Çözüm:** Netlify `_headers` dosyasına veya `netlify.toml`'a CSP header ekle.

---

### 🔵 DÜŞÜK

#### 1.10 Hata Mesajları Bilgi Sızdırıyor
- **Dosya:** `supabase-client.js` — `_err()` fonksiyonu
- **Sorun:** `console.error` ile Supabase iç hata mesajları tarayıcı konsoluna yazılıyor.
- **Risk:** Saldırgan geliştirici araçlarını açarak tablo yapısı, sütun adları ve query hataları hakkında bilgi toplayabilir.
- **Çözüm:** Production modunda hata ayrıntılarını console'a yazmayı durdur. Kullanıcıya yalnızca genel hata mesajı göster.

#### 1.11 Ödeme Sunucusunda Güvenlik Header'ları Eksik
- **Dosya:** `payment/server/index.js`
- **Sorun:** `helmet` middleware'i kullanılmıyor.
- **Çözüm:** `npm install helmet` + `app.use(helmet())` — HSTS, X-Frame-Options, X-Content-Type-Options otomatik eklenir.

#### 1.12 `config.js` Git'e Girebilir
- **Dosya:** `payment/server/config.js` (oluşturulduğunda)
- **Sorun:** `.gitignore`'da `config.js` yoksa API key'leri repo'ya commit edilebilir.
- **Çözüm:** `.gitignore`'a `payment/server/config.js` ekle. Key'leri environment variable olarak sakla.

---

## 2. Canlıya Alma Öncesi Kontrol Listesi

Projeyi yayına almadan önce aşağıdaki maddeler tamamlanmalı:

### Kimlik Doğrulama
- [ ] Supabase Auth'a geç (`sifre` sütununu kaldır)
- [ ] `window.clearSupabaseAll` ve `window.exportToSupabase` `window`'dan kaldırıldı
- [ ] Admin paneli için ayrı rol doğrulaması (JWT claim veya Supabase rol)
- [ ] Login'e rate limiting eklendi (max 5 deneme / 15 dakika)
- [ ] Oturum süresi 24 saat ile sınırlandırıldı

### Veritabanı
- [ ] Tüm tablolarda RLS aktif edildi
- [ ] RLS politikaları test edildi (bkz. Bölüm 3)
- [ ] `db_users` / `cu_users` localStorage anahtarlarından şifre alanı kaldırıldı
- [ ] TC kimlik numarası client'a hiç dönmüyor

### Ödeme Sunucusu
- [ ] CORS `origin: '*'` → `origin: 'https://denizbul.tr'`
- [ ] `helmet` middleware eklendi
- [ ] `express-rate-limit` eklendi
- [ ] `config.js` `.gitignore`'da, API key'ler environment variable'da
- [ ] Webhook doğrulaması (PayTR hash, iyzico imza) aktif

### Frontend
- [ ] Kullanıcı girdileri `innerHTML` yerine `textContent` ile render ediliyor
- [ ] CSP header'ı Netlify `_headers`'a eklendi
- [ ] Production'da `console.error` detayları kapatıldı

### Altyapı
- [ ] HTTPS zorunlu (Netlify otomatik sağlar)
- [ ] Supabase Dashboard'da "Exposed in API" kapalı olan sütunlar kontrol edildi
- [ ] Supabase proje URL ve key'i production ortamına göre güncellendi

---

## 3. Supabase RLS Politikaları — Taslak

Canlıya almadan önce her tablo için aşağıdaki politikalar oluşturulmalı:

```sql
-- Kullanıcılar: sadece kendi kaydını görebilir
CREATE POLICY "kendi_kullanici" ON kullanicilar
  FOR ALL USING (auth.uid()::text = id::text);

-- Turlar: herkes aktif turları görebilir, kaptan kendi turunu yönetir
CREATE POLICY "aktif_turlar_herkese" ON turlar
  FOR SELECT USING (durum = 'aktif');

CREATE POLICY "kaptan_kendi_turu" ON turlar
  FOR ALL USING (auth.jwt()->>'email' = kaptan_email);

-- Admin tüm tablolara erişir (admin rolü JWT claim'den)
CREATE POLICY "admin_tam_erisim" ON turlar
  FOR ALL USING (auth.jwt()->'user_metadata'->>'role' = 'admin');

-- Rezervasyonlar: müşteri kendi rezervasyonunu, kaptan ilgili rezervasyonları görür
CREATE POLICY "musteri_kendi_rezervasyonu" ON rezervasyonlar
  FOR SELECT USING (auth.jwt()->>'email' = musteri_email);

CREATE POLICY "kaptan_ilgili_rezervasyon" ON rezervasyonlar
  FOR SELECT USING (auth.jwt()->>'email' = kaptan_email);

-- Mesajlar: yalnızca ilgili kaptan ve müşteri erişebilir
CREATE POLICY "mesaj_taraflar" ON mesajlar
  FOR ALL USING (
    auth.jwt()->>'email' = kaptan_email OR
    auth.jwt()->>'email' = musteri_email
  );

-- Ödemeler: müşteri kendi ödemelerini görür, kaptan kendi gelirlerini görür
CREATE POLICY "odeme_musteri" ON odemeler
  FOR SELECT USING (auth.jwt()->>'email' = musteri_email);

CREATE POLICY "odeme_kaptan" ON odemeler
  FOR SELECT USING (auth.jwt()->>'email' = kaptan_email);
```

---

## 4. Supabase Auth Geçiş Planı

Şu an `kullanicilar` tablosunda özel `sifre` sütunu kullanılıyor. Canlıya almadan önce:

1. **Supabase Auth'u aktif et** — Dashboard → Authentication → Settings
2. **Mevcut kullanıcıları migrate et** — Her kullanıcı için `supabase.auth.admin.createUser()` çağır (şifre sıfırlama e-postası gönder)
3. **`sifre` sütununu kaldır** — Migration script ile
4. **`DB.auth.login()` ve `DB.auth.register()` fonksiyonlarını güncelle** — Supabase Auth metodlarını kullan
5. **`_sbUserToLocal()` fonksiyonundan `password` ve `sifre` alanlarını çıkar**

### Yeni Auth Kodu (Taslak)
```js
// Giriş
const { data, error } = await supabase.auth.signInWithPassword({ email, password });

// Kayıt
const { data, error } = await supabase.auth.signUp({ email, password,
  options: { data: { ad, soyad, telefon, roller: ['customer'] } }
});

// Çıkış
await supabase.auth.signOut();

// Oturum kontrolü
const { data: { session } } = await supabase.auth.getSession();
```

---

## 5. CSP Header Taslağı (Netlify)

`_headers` dosyasına eklenecek:

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
```

---

## 6. Saldırı Türleri ve Korunma Özeti

| Saldırı Türü | Mevcut Risk | Çözüm |
|---|---|---|
| SQL Injection | Düşük (Supabase parameterized queries kullanır) | Supabase SDK koruyor |
| XSS | Yüksek (`innerHTML` kullanımı) | `textContent` + DOMPurify |
| CSRF | Orta (SPA yapısı kısmen korur) | SameSite cookie + CORS kısıtlama |
| Brute Force | Yüksek (sınır yok) | Rate limiting |
| Session Hijacking | Yüksek (localStorage + şifre orada) | Supabase Auth + httpOnly cookie |
| Data Breach (DB) | Çok Yüksek (şifreler plaintext) | Supabase Auth (bcrypt) |
| Privilege Escalation | Yüksek (RLS yok) | RLS politikaları |
| Insider Attack | Yüksek (`window.clearSupabaseAll`) | Fonksiyonları kısıtla |
| Man-in-the-Middle | Düşük (HTTPS Netlify'da var) | HTTPS + HSTS |
| DoS | Orta (rate limiting yok) | Rate limiting + Cloudflare |

---

> Bu belge, canlı yayına geçiş planlamasının bir parçasıdır. Her madde tamamlandığında kontrol listesi işaretlenmeli ve değişiklikler commit mesajında referans verilmelidir.
