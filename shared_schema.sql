-- ================================================================
-- DenizBul.tr — Shared PostgreSQL Schema
-- Supabase veya herhangi bir PostgreSQL provider ile çalışır.
-- Çalıştırma: Supabase Dashboard > SQL Editor > New Query > Paste > Run
-- ================================================================

-- UUID desteği
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- ENUM TYPES
-- ================================================================
CREATE TYPE kaptan_durum_t    AS ENUM ('aktif', 'bekliyor', 'pasif');
CREATE TYPE tur_durum_t       AS ENUM ('aktif', 'bekliyor', 'pasif');
CREATE TYPE rezervasyon_d_t   AS ENUM ('bekliyor', 'onaylandi', 'tamamlandi', 'iptal', 'reddedildi');
CREATE TYPE odeme_durum_t     AS ENUM ('basarili', 'bekliyor', 'iade_edildi');
CREATE TYPE gonderen_t        AS ENUM ('kaptan', 'musteri');
CREATE TYPE kayit_kanali_t    AS ENUM ('web', 'mobil_app', 'sosyal_medya');

-- ================================================================
-- TABLE: kaptanlar
-- Kullanan: admin-panel, captain-app, captain-panel
-- ================================================================
CREATE TABLE kaptanlar (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Kişisel bilgiler
  ad            VARCHAR(100) NOT NULL,
  soyad         VARCHAR(100) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  telefon       VARCHAR(20),
  bolge         VARCHAR(100),
  bio           TEXT,

  -- Durum & Puan
  durum         kaptan_durum_t NOT NULL DEFAULT 'bekliyor',
  puan          DECIMAL(3,2)   DEFAULT 0 CHECK (puan BETWEEN 0 AND 5),
  tur_sayisi    INTEGER        DEFAULT 0,

  -- Tekne bilgileri
  tekne_adi     VARCHAR(200),
  tekne_turu    VARCHAR(100),    -- 'Gulet', 'Motor Yat', ...
  uzunluk       INTEGER,         -- metre
  tekne_yil     INTEGER,
  kapasite      INTEGER          DEFAULT 8,

  -- Lisans & Belgeler
  lisans        VARCHAR(100),
  lisans_tarih  DATE,
  ruhsat        VARCHAR(100),
  sigorta       VARCHAR(100),

  -- Kategoriler (örn: ['Balik Avi', 'Tekne Gezisi'])
  kategoriler   JSONB            DEFAULT '[]',

  -- Admin notları
  admin_not     TEXT,

  katilim_tarihi TIMESTAMPTZ    DEFAULT NOW(),
  created_at     TIMESTAMPTZ    DEFAULT NOW(),
  updated_at     TIMESTAMPTZ    DEFAULT NOW()
);

-- ================================================================
-- TABLE: turlar
-- Kullanan: TÜM UYGULAMALAR
-- ================================================================
CREATE TABLE turlar (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Kaptan ilişkisi
  kaptan_email  VARCHAR(255) NOT NULL REFERENCES kaptanlar(email) ON DELETE CASCADE,
  kaptan_adi    VARCHAR(200),

  -- Tur bilgileri
  tur_adi       VARCHAR(300) NOT NULL,
  aciklama      TEXT,

  -- Sınıflandırma
  kategoriler   JSONB        DEFAULT '[]',  -- ['Balik Avi']
  sure          VARCHAR(50),                -- '4 saat', 'Tam Gun (8 saat)'

  -- Fiyat (TL)
  fiyat         INTEGER      NOT NULL DEFAULT 0,

  -- Kapasite
  kapasite      INTEGER      DEFAULT 8,

  -- Tarih & Saat planlaması
  tarihler      JSONB        DEFAULT '[]',  -- ['2026-05-10', '2026-05-17']
  saatler       JSONB        DEFAULT '["09:00"]',

  -- Hizmetler
  dahil         JSONB        DEFAULT '[]',  -- ['Can yelegi', 'Su', 'Snorkel']
  haric         TEXT,

  -- Konum
  kalkis_noktasi VARCHAR(300),
  bolge          VARCHAR(100),

  -- Yayın durumu
  durum         tur_durum_t  NOT NULL DEFAULT 'bekliyor',

  -- Görsel
  hero_image    TEXT,

  -- Puanlama (rezervasyonlardan hesaplanır)
  puan          DECIMAL(3,2) DEFAULT 0,
  inceleme_sayisi INTEGER    DEFAULT 0,

  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ================================================================
-- TABLE: kullanicilar  (müşteriler / web üyeleri)
-- Kullanan: admin-panel, customer-app, customer-site
-- ================================================================
CREATE TABLE kullanicilar (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  ad_soyad          VARCHAR(200) NOT NULL,
  email             VARCHAR(255) UNIQUE NOT NULL,
  telefon           VARCHAR(20),
  sehir             VARCHAR(100),
  adres             TEXT,

  -- Kayıt bilgileri
  kayit_kanali      kayit_kanali_t DEFAULT 'web',
  sosyal_giris      VARCHAR(50),   -- 'Google', 'Facebook', ...
  email_onaylandi   BOOLEAN        DEFAULT FALSE,
  bildirim_izni     BOOLEAN        DEFAULT TRUE,

  -- İstatistikler (rezervasyonlardan otomatik güncellenir)
  toplam_harcama    INTEGER        DEFAULT 0,
  tur_sayisi        INTEGER        DEFAULT 0,

  -- Gelecek auth için
  sifre_hash        VARCHAR(255),

  son_giris         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ    DEFAULT NOW(),
  updated_at        TIMESTAMPTZ    DEFAULT NOW()
);

-- ================================================================
-- TABLE: rezervasyonlar
-- Kullanan: TÜM UYGULAMALAR
-- ================================================================
CREATE TABLE rezervasyonlar (
  id              VARCHAR(20) PRIMARY KEY,  -- 'BK1710000000001'

  -- İlişkiler
  tur_id          UUID        REFERENCES turlar(id) ON DELETE SET NULL,
  tur_adi         VARCHAR(300),
  kaptan_email    VARCHAR(255) REFERENCES kaptanlar(email) ON DELETE SET NULL,
  kaptan_adi      VARCHAR(200),
  musteri_email   VARCHAR(255) REFERENCES kullanicilar(email) ON DELETE SET NULL,
  musteri_adi     VARCHAR(200),
  musteri_telefon VARCHAR(20),

  -- Rezervasyon detayları
  kisi_sayisi     INTEGER NOT NULL DEFAULT 1,
  durum           rezervasyon_d_t NOT NULL DEFAULT 'bekliyor',

  -- Fiyatlandırma
  toplam_tutar    INTEGER NOT NULL DEFAULT 0,
  tur_fiyati      INTEGER          DEFAULT 0,
  hizmet_bedeli   INTEGER          DEFAULT 0,   -- %10
  komisyon        INTEGER          DEFAULT 0,   -- %2.5
  kaptan_net      INTEGER          DEFAULT 0,

  -- Tarih & Saat
  tur_tarihi      VARCHAR(20),     -- '23.04.2026'
  tur_saati       VARCHAR(10)      DEFAULT '09:00',

  -- Notlar
  musteri_notu    TEXT,
  kaptan_notu     TEXT,
  red_nedeni      TEXT,

  -- Lokasyon
  konum           VARCHAR(300),
  kayit_kanali    VARCHAR(20)      DEFAULT 'web',

  -- Ödeme bilgileri
  odeme_yapildi   BOOLEAN          DEFAULT FALSE,
  odeme_yontemi   VARCHAR(50),     -- 'Kredi Karti', 'Banka Havalesi', ...
  odeme_ref       VARCHAR(50),
  odeme_zamani    TIMESTAMPTZ,
  kart_turu       VARCHAR(20),
  kart_son4       VARCHAR(4),
  banka           VARCHAR(100),

  -- Biniş durumu
  binis_yapildi   BOOLEAN          DEFAULT FALSE,
  binis_zamani    TIMESTAMPTZ,

  created_at      TIMESTAMPTZ      DEFAULT NOW(),
  updated_at      TIMESTAMPTZ      DEFAULT NOW()
);

-- ================================================================
-- TABLE: odemeler
-- Kullanan: admin-panel (primary), captain-app (okuma)
-- ================================================================
CREATE TABLE odemeler (
  id              VARCHAR(30) PRIMARY KEY,  -- 'PAY-123456-AB'

  rezervasyon_id  VARCHAR(20)  REFERENCES rezervasyonlar(id) ON DELETE SET NULL,
  tur_id          UUID         REFERENCES turlar(id) ON DELETE SET NULL,
  tur_adi         VARCHAR(300),

  musteri_email   VARCHAR(255),
  musteri_adi     VARCHAR(200),
  kaptan_email    VARCHAR(255),

  -- Tutarlar
  tutar           INTEGER NOT NULL,
  tur_fiyati      INTEGER          DEFAULT 0,
  hizmet_bedeli   INTEGER          DEFAULT 0,
  komisyon        INTEGER          DEFAULT 0,
  kaptan_net      INTEGER          DEFAULT 0,

  -- Ödeme detayları
  yontem          VARCHAR(50),
  kart_turu       VARCHAR(20),
  kart_son4       VARCHAR(4),
  banka           VARCHAR(100),

  durum           odeme_durum_t    DEFAULT 'basarili',

  created_at      TIMESTAMPTZ      DEFAULT NOW()
);

-- ================================================================
-- TABLE: mesajlar
-- Kullanan: admin-panel, captain-app, captain-panel
-- ================================================================
CREATE TABLE mesajlar (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  kaptan_email  VARCHAR(255) NOT NULL REFERENCES kaptanlar(email) ON DELETE CASCADE,
  musteri_email VARCHAR(255) NOT NULL,
  musteri_adi   VARCHAR(200),

  mesaj         TEXT NOT NULL,
  gonderen      gonderen_t NOT NULL,
  okundu        BOOLEAN DEFAULT FALSE,

  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- TABLE: degerlendirmeler
-- Kullanan: customer-app, admin-panel
-- ================================================================
CREATE TABLE degerlendirmeler (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  tur_id          UUID        REFERENCES turlar(id) ON DELETE CASCADE,
  rezervasyon_id  VARCHAR(20) REFERENCES rezervasyonlar(id) ON DELETE SET NULL,
  musteri_email   VARCHAR(255),
  musteri_adi     VARCHAR(200),

  puan            INTEGER NOT NULL CHECK (puan BETWEEN 1 AND 5),
  yorum           TEXT,

  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- INDEXES — sık kullanılan sorgular için
-- ================================================================
CREATE INDEX idx_turlar_kaptan     ON turlar(kaptan_email);
CREATE INDEX idx_turlar_durum      ON turlar(durum);
CREATE INDEX idx_turlar_bolge      ON turlar(bolge);
CREATE INDEX idx_rez_tur           ON rezervasyonlar(tur_id);
CREATE INDEX idx_rez_kaptan        ON rezervasyonlar(kaptan_email);
CREATE INDEX idx_rez_musteri       ON rezervasyonlar(musteri_email);
CREATE INDEX idx_rez_durum         ON rezervasyonlar(durum);
CREATE INDEX idx_rez_tarih         ON rezervasyonlar(tur_tarihi);
CREATE INDEX idx_odeme_rez         ON odemeler(rezervasyon_id);
CREATE INDEX idx_odeme_kaptan      ON odemeler(kaptan_email);
CREATE INDEX idx_msg_kaptan        ON mesajlar(kaptan_email);
CREATE INDEX idx_msg_musteri       ON mesajlar(musteri_email);
CREATE INDEX idx_msg_thread        ON mesajlar(kaptan_email, musteri_email);
CREATE INDEX idx_degerlendirme_tur ON degerlendirmeler(tur_id);

-- ================================================================
-- UPDATED_AT OTOMATİK GÜNCELLEME
-- ================================================================
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_kaptanlar_upd    BEFORE UPDATE ON kaptanlar    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_turlar_upd       BEFORE UPDATE ON turlar        FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_kullanicilar_upd BEFORE UPDATE ON kullanicilar  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_rezervasyon_upd  BEFORE UPDATE ON rezervasyonlar FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ================================================================
-- KAPTAN PUAN OTOMATİK GÜNCELLEME
-- Yeni değerlendirme eklenince kaptanın ortalama puanı güncellenir.
-- ================================================================
CREATE OR REPLACE FUNCTION fn_update_kaptan_puan()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE turlar
  SET puan = (
    SELECT ROUND(AVG(puan)::NUMERIC, 2)
    FROM degerlendirmeler
    WHERE tur_id = NEW.tur_id
  ),
  inceleme_sayisi = (
    SELECT COUNT(*) FROM degerlendirmeler WHERE tur_id = NEW.tur_id
  )
  WHERE id = NEW.tur_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_puan_guncelle
  AFTER INSERT ON degerlendirmeler
  FOR EACH ROW EXECUTE FUNCTION fn_update_kaptan_puan();

-- ================================================================
-- KULLANICI İSTATİSTİK OTOMATİK GÜNCELLEME
-- Rezervasyon onaylanınca kullanıcının toplam_harcama ve tur_sayisi güncellenir.
-- ================================================================
CREATE OR REPLACE FUNCTION fn_update_kullanici_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.durum IN ('onaylandi', 'tamamlandi') AND NEW.odeme_yapildi = TRUE THEN
    UPDATE kullanicilar
    SET
      toplam_harcama = (
        SELECT COALESCE(SUM(toplam_tutar), 0)
        FROM rezervasyonlar
        WHERE musteri_email = NEW.musteri_email
          AND durum IN ('onaylandi', 'tamamlandi')
          AND odeme_yapildi = TRUE
      ),
      tur_sayisi = (
        SELECT COUNT(*)
        FROM rezervasyonlar
        WHERE musteri_email = NEW.musteri_email
          AND durum IN ('onaylandi', 'tamamlandi')
      )
    WHERE email = NEW.musteri_email;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_kullanici_stats
  AFTER INSERT OR UPDATE OF durum ON rezervasyonlar
  FOR EACH ROW EXECUTE FUNCTION fn_update_kullanici_stats();

-- ================================================================
-- ROW LEVEL SECURITY (Supabase — Production güvenliği)
-- Geliştirme sırasında devre dışı bırakmak için:
--   ALTER TABLE turlar DISABLE ROW LEVEL SECURITY;
-- ================================================================
ALTER TABLE kaptanlar      ENABLE ROW LEVEL SECURITY;
ALTER TABLE turlar         ENABLE ROW LEVEL SECURITY;
ALTER TABLE kullanicilar   ENABLE ROW LEVEL SECURITY;
ALTER TABLE rezervasyonlar ENABLE ROW LEVEL SECURITY;
ALTER TABLE odemeler       ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesajlar       ENABLE ROW LEVEL SECURITY;
ALTER TABLE degerlendirmeler ENABLE ROW LEVEL SECURITY;

-- Service role (backend/admin) her şeyi görebilir — kısıtlama yok
-- Anon role politikaları:

-- Turlar: herkes aktif turları görebilir
CREATE POLICY "turlar_okuma_herkese_acik"
  ON turlar FOR SELECT
  USING (durum = 'aktif');

-- Turlar: service_role her şeyi yapabilir
CREATE POLICY "turlar_service_role_tam_yetki"
  ON turlar FOR ALL
  USING (auth.role() = 'service_role');

-- Rezervasyonlar: service_role tam yetki
CREATE POLICY "rezervasyonlar_service_role"
  ON rezervasyonlar FOR ALL
  USING (auth.role() = 'service_role');

-- Kaptanlar: herkese okuma (profil)
CREATE POLICY "kaptanlar_okuma_herkese_acik"
  ON kaptanlar FOR SELECT
  USING (durum = 'aktif');

CREATE POLICY "kaptanlar_service_role"
  ON kaptanlar FOR ALL
  USING (auth.role() = 'service_role');

-- Kullanicilar: service_role tam yetki
CREATE POLICY "kullanicilar_service_role"
  ON kullanicilar FOR ALL
  USING (auth.role() = 'service_role');

-- Mesajlar: service_role tam yetki
CREATE POLICY "mesajlar_service_role"
  ON mesajlar FOR ALL
  USING (auth.role() = 'service_role');

-- Ödemeler: service_role tam yetki
CREATE POLICY "odemeler_service_role"
  ON odemeler FOR ALL
  USING (auth.role() = 'service_role');

-- Değerlendirmeler: herkese okuma
CREATE POLICY "degerlendirme_okuma"
  ON degerlendirmeler FOR SELECT USING (TRUE);

CREATE POLICY "degerlendirme_service_role"
  ON degerlendirmeler FOR ALL
  USING (auth.role() = 'service_role');

-- ================================================================
-- YARDIMCI VIEW'LER
-- ================================================================

-- Admin dashboard özet
CREATE VIEW v_dashboard_ozet AS
SELECT
  (SELECT COUNT(*) FROM kaptanlar WHERE durum = 'aktif')        AS aktif_kaptan,
  (SELECT COUNT(*) FROM kaptanlar WHERE durum = 'bekliyor')     AS bekleyen_kaptan,
  (SELECT COUNT(*) FROM turlar WHERE durum = 'aktif')           AS aktif_tur,
  (SELECT COUNT(*) FROM turlar WHERE durum = 'bekliyor')        AS bekleyen_tur,
  (SELECT COUNT(*) FROM kullanicilar)                           AS toplam_uye,
  (SELECT COUNT(*) FROM rezervasyonlar)                         AS toplam_rezervasyon,
  (SELECT COUNT(*) FROM rezervasyonlar WHERE durum = 'bekliyor') AS bekleyen_rezervasyon,
  (SELECT COALESCE(SUM(tutar), 0) FROM odemeler WHERE durum = 'basarili') AS toplam_ciro,
  (SELECT COALESCE(SUM(komisyon), 0) FROM odemeler WHERE durum = 'basarili') AS toplam_komisyon;

-- Kaptan performans özeti
CREATE VIEW v_kaptan_performans AS
SELECT
  k.id,
  k.ad || ' ' || k.soyad  AS ad_soyad,
  k.email,
  k.bolge,
  k.durum,
  k.puan,
  COUNT(DISTINCT t.id)     AS tur_sayisi,
  COUNT(DISTINCT r.id)     AS rezervasyon_sayisi,
  COALESCE(SUM(r.kaptan_net), 0) AS toplam_kazanc
FROM kaptanlar k
LEFT JOIN turlar t ON t.kaptan_email = k.email
LEFT JOIN rezervasyonlar r ON r.kaptan_email = k.email AND r.durum IN ('onaylandi', 'tamamlandi')
GROUP BY k.id, k.ad, k.soyad, k.email, k.bolge, k.durum, k.puan;
