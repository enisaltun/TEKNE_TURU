# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**DenizBul.tr** — Türkiye'nin tekne turu marketplace'i. Bu proje, backend veya build araçları gerektirmeyen, tamamen bağımsız HTML prototip dosyalarından oluşan bir UI mockup koleksiyonudur. Her dosya browser'da doğrudan açılabilir.

## Dosyalar ve Roller

| Dosya | Hedef Kitle | Görünüm |
|---|---|---|
| `customer-site.html` | Müşteri | Responsive web sitesi (masaüstü + mobil) |
| `customer-app.html` | Müşteri | Mobil uygulama (max-width: 430px) |
| `captain-app.html` | Kaptan | Mobil uygulama (max-width: 430px) |
| `admin-panel.html` | Platform yöneticisi | Desktop dashboard (sidebar layout) |

## Çalıştırma

Build adımı yoktur. Herhangi bir HTML dosyasını browser'da aç:

```bash
# Windows'ta doğrudan açmak için
start customer-app.html
start captain-app.html
start admin-panel.html
```

Veya VS Code Live Server extension ile çalıştırılabilir.

## Mimari

### Hash-tabanlı SPA Router (tüm dosyalarda aynı pattern)

Her dosya aşağıdaki pattern'i uygular:

```js
function navigateTo(p) { window.location.hash = '#' + p }

function handleRoute() {
  const page = location.hash.slice(1) || 'defaultPage';
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  document.getElementById('page-' + page)?.classList.add('active');
  // nav linklerini güncelle: data-nav="page" attr'u ile eşleştirir
}

window.addEventListener('hashchange', handleRoute);
window.addEventListener('load', () => { handleRoute(); renderAll(); });
```

**Sayfa ID formatı:** `id="page-{hash}"` — örn. `#search` → `id="page-search"`  
**Nav link formatı:** `data-nav="{hash}"` attr'u ile aktif stil belirlenir.

### CSS Mimarisi

Tüm dosyalar aynı teknoloji yığınını kullanır:
- **Tailwind CSS** — CDN üzerinden, `tailwind.config` ile özel renkler tanımlanmış
- **Font Awesome 6.5.1** — CDN üzerinden
- **Google Fonts Inter** — `@import` ile
- **Custom CSS** — `<style>` bloğunda, Tailwind extend'leri ile çakışmayan component sınıfları

Özel Tailwind renk token'ları (tüm dosyalarda tutarlı):
```
primary: #0369a1     primaryDark: #075985    primaryLight: #e0f2fe
accent:  #f59e0b     accentDark:  #d97706
danger:  #ef4444     success:     #10b981     surface: #f8fafc
```

### Mobil-first Layout Farklılıkları

- **Mobil app dosyaları** (`customer-app.html`, `captain-app.html`):  
  `body { max-width: 430px; margin: 0 auto }` + `padding-bottom: 72-80px` (bottom nav alanı için)  
  Simüle edilmiş status bar (`clock`, sinyal/wifi/batarya ikonları)  
  `env(safe-area-inset-bottom)` ile iOS safe area desteği

- **Web sitesi** (`customer-site.html`):  
  `max-w-7xl` container, desktop navbar + mobile bottom nav, `@media(max-width:768px)` ile geçiş

- **Admin panel** (`admin-panel.html`):  
  `display:flex` body, fixed sidebar (240px), `margin-left:240px` main content

### Yaygın UI Component Sınıfları

```
.card          — beyaz kart, border-radius, shadow
.badge         — küçük etiket (durum, kategori)
.toggle        — CSS-only açma/kapama switch
.pill          — seçilebilir filtre etiketi
.bottom-sheet  — modal benzeri slide-up panel
.sheet-overlay — bottom-sheet arka plan overlay
.tab-btn       — tab grubu butonu (.active ile seçili)
.calendar-day  — takvim hücresi (.booked, .closed, .selected, .today)
.msg-bubble    — mesaj balonu (.msg-in, .msg-out)
```

### State Yönetimi

Backend bağlantısı yoktur. State, JavaScript değişkenleri ve DOM manipülasyonu ile yönetilir. `renderAll()` / `renderApp()` gibi fonksiyonlar başlangıçta tüm dinamik içeriği render eder.

## Güvenlik Kuralı — Dahili Araç Gizliliği (KESİN KURAL)

Bu kurallar ihlal edilemez; her yeni özellik veya sayfa eklenirken kontrol edilmeli:

- **Müşteri/kullanıcı yüzlü hiçbir sayfada** (`customer-app.html`, `customer-site.html`, `auth.html`) admin paneline, kaptan uygulamasına veya başka dahili araçlara link, buton veya görsel ipucu **bulunmamalıdır.** Bu bağlantılar ticari sırdır.
- **Kaptan uygulamasında** (`captain-app.html`) admin paneline veya diğer dahili araçlara link bulunmamalıdır.
- **Test araçları** ("Veriyi Temizle", seed data, debug butonları vb.) kullanıcı arayüzünde **görünmemelidir.**
- **Geliştirici erişimi** yalnızca `index.html` şifre kapısı üzerinden sağlanır. Uygulama içinde gizli gesture, tap sayacı veya benzeri mekanizmalar **kullanılmamalıdır.**
- **`index.html`** (prototip hub'ı) şifre kapısıyla korunur. Erişim kodu: `denizdev25`. Bu kod kaynak kodda `btoa()` ile obfüske edilmiştir; düz metin olarak bırakılmamalıdır.
- Yeni bir panel veya dahili araç eklendiğinde: kullanıcı yüzlü sayfalarda bu araca **hiçbir referans** verilmemelidir.

## Gizlilik Kuralı — Kaptan Veri İzolasyonu (KESİN KURAL)

Kaptanlar birbirinin verilerini hiçbir koşulda göremez:

- **Kaptan uygulamasında** (`captain-app.html`) yalnızca o oturumu açmış kaptana ait turlar, rezervasyonlar, kazançlar ve mesajlar görüntülenir.
- **Hiçbir kaptan** başka bir kaptanın: tur listesini, rezervasyon detaylarını, kazanç/gelir bilgilerini, müşteri iletişimlerini veya ceza/uyarı geçmişini **göremez, listeleyemez, filtreleyemez.**
- **Arkadaş Kaptan sistemi** dahil: bir kaptan arkadaşının yalnızca adını, tekne adını, konumunu ve müsaitlik durumunu (tur var/yok) görebilir. Kazanç, rezervasyon sayısı veya müşteri bilgileri **kesinlikle paylaşılmaz.**
- **Acil Transfer akışında** yeni kaptana yalnızca şu bilgiler iletilir: grup büyüklüğü, kalkış noktası, saat ve tur rotası. Müşterinin kişisel bilgileri (ad, telefon, e-posta) transfer kabul edildikten sonra iletilir.
- Bu kural her yeni özellik, bildirim veya dashboard eklenirken **kod yazılmadan önce** kontrol edilmelidir.

## Geliştirme Kuralları

- Her dosya **bağımsızdır** — paylaşılan CSS, JS veya component dosyası yoktur. Bir dosyada yapılan değişiklik diğerlerini etkilemez.
- Yeni sayfa eklenirken: HTML section'ı `id="page-{isim}"` ile ekle + `class="page"` + bottom nav'a `data-nav="{isim}"` link ekle.
- Tailwind class'ları CDN JIT modunda çalışır; config'de `safelist` gerekmez.
- Türkçe karakter içeren metinler doküman genelinde ASCII karşılıklarıyla yazılmış (örn. "Musteri" yerine "Müşteri" değil) — bu kasıtlı bir tercihtir, encoding sorunlarını önler.
