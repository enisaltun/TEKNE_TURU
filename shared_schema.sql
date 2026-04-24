-- ================================================================
-- DenizBul.tr — Shared PostgreSQL Schema  (idempotent — tekrar çalıştırılabilir)
-- Supabase Dashboard > SQL Editor > New Query > Paste > Run
-- ================================================================

-- ================================================================
-- TEMİZLİK — önceki kurulumdan kalan nesneleri sil
-- ================================================================
DROP VIEW IF EXISTS v_dashboard_ozet     CASCADE;
DROP VIEW IF EXISTS v_kaptan_performans  CASCADE;
DROP TABLE IF EXISTS degerlendirmeler    CASCADE;
DROP TABLE IF EXISTS mesajlar            CASCADE;
DROP TABLE IF EXISTS odemeler            CASCADE;
DROP TABLE IF EXISTS rezervasyonlar      CASCADE;
DROP TABLE IF EXISTS kullanicilar        CASCADE;
DROP TABLE IF EXISTS turlar              CASCADE;
DROP TABLE IF EXISTS kaptanlar           CASCADE;
DROP FUNCTION IF EXISTS fn_set_updated_at()        CASCADE;
DROP FUNCTION IF EXISTS fn_update_kaptan_puan()    CASCADE;
DROP FUNCTION IF EXISTS fn_update_kullanici_stats() CASCADE;
DROP TYPE IF EXISTS kaptan_durum_t   CASCADE;
DROP TYPE IF EXISTS tur_durum_t      CASCADE;
DROP TYPE IF EXISTS rezervasyon_d_t  CASCADE;
DROP TYPE IF EXISTS odeme_durum_t    CASCADE;
DROP TYPE IF EXISTS gonderen_t       CASCADE;
DROP TYPE IF EXISTS kayit_kanali_t   CASCADE;

-- UUID desteği
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- ENUM TYPES
-- ================================================================
CREATE TYPE kaptan_durum_t   AS ENUM ('aktif', 'bekliyor', 'pasif');
CREATE TYPE tur_durum_t      AS ENUM ('aktif', 'bekliyor', 'pasif');
CREATE TYPE rezervasyon_d_t  AS ENUM ('bekliyor', 'onaylandi', 'tamamlandi', 'iptal', 'reddedildi');
CREATE TYPE odeme_durum_t    AS ENUM ('basarili', 'bekliyor', 'iade_edildi');
CREATE TYPE gonderen_t       AS ENUM ('kaptan', 'musteri');
CREATE TYPE kayit_kanali_t   AS ENUM ('web', 'mobil_app', 'sosyal_medya');

-- ================================================================
-- TABLE: kaptanlar
-- ================================================================
CREATE TABLE kaptanlar (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad              VARCHAR(100) NOT NULL,
  soyad           VARCHAR(100) NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  telefon         VARCHAR(20),
  bolge           VARCHAR(100),
  bio             TEXT,
  durum           kaptan_durum_t NOT NULL DEFAULT 'bekliyor',
  puan            DECIMAL(3,2)   DEFAULT 0 CHECK (puan BETWEEN 0 AND 5),
  tur_sayisi      INTEGER        DEFAULT 0,
  tekne_adi       VARCHAR(200),
  tekne_turu      VARCHAR(100),
  uzunluk         INTEGER,
  tekne_yil       INTEGER,
  kapasite        INTEGER        DEFAULT 8,
  lisans          VARCHAR(100),
  lisans_tarih    DATE,
  ruhsat          VARCHAR(100),
  sigorta         VARCHAR(100),
  kategoriler     JSONB          DEFAULT '[]',
  admin_not       TEXT,
  katilim_tarihi  TIMESTAMPTZ    DEFAULT NOW(),
  created_at      TIMESTAMPTZ    DEFAULT NOW(),
  updated_at      TIMESTAMPTZ    DEFAULT NOW()
);

-- ================================================================
-- TABLE: turlar
-- ================================================================
CREATE TABLE turlar (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kaptan_email    VARCHAR(255) NOT NULL REFERENCES kaptanlar(email) ON DELETE CASCADE,
  kaptan_adi      VARCHAR(200),
  tur_adi         VARCHAR(300) NOT NULL,
  aciklama        TEXT,
  kategoriler     JSONB        DEFAULT '[]',
  sure            VARCHAR(50),
  fiyat           INTEGER      NOT NULL DEFAULT 0,
  kapasite        INTEGER      DEFAULT 8,
  tarihler        JSONB        DEFAULT '[]',
  saatler         JSONB        DEFAULT '["09:00"]',
  dahil           JSONB        DEFAULT '[]',
  haric           TEXT,
  kalkis_noktasi  VARCHAR(300),
  bolge           VARCHAR(100),
  durum           tur_durum_t  NOT NULL DEFAULT 'bekliyor',
  hero_image      TEXT,
  puan            DECIMAL(3,2) DEFAULT 0,
  inceleme_sayisi INTEGER      DEFAULT 0,
  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  DEFAULT NOW()
);

-- ================================================================
-- TABLE: kullanicilar
-- ================================================================
CREATE TABLE kullanicilar (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_soyad          VARCHAR(200) NOT NULL,
  email             VARCHAR(255) UNIQUE NOT NULL,
  telefon           VARCHAR(20),
  sehir             VARCHAR(100),
  adres             TEXT,
  kayit_kanali      kayit_kanali_t DEFAULT 'web',
  sosyal_giris      VARCHAR(50),
  email_onaylandi   BOOLEAN        DEFAULT FALSE,
  bildirim_izni     BOOLEAN        DEFAULT TRUE,
  toplam_harcama    INTEGER        DEFAULT 0,
  tur_sayisi        INTEGER        DEFAULT 0,
  sifre_hash        VARCHAR(255),
  son_giris         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ    DEFAULT NOW(),
  updated_at        TIMESTAMPTZ    DEFAULT NOW()
);

-- ================================================================
-- TABLE: rezervasyonlar
-- ================================================================
CREATE TABLE rezervasyonlar (
  id              VARCHAR(30) PRIMARY KEY,
  tur_id          UUID         REFERENCES turlar(id) ON DELETE SET NULL,
  tur_adi         VARCHAR(300),
  kaptan_email    VARCHAR(255) REFERENCES kaptanlar(email) ON DELETE SET NULL,
  kaptan_adi      VARCHAR(200),
  musteri_email   VARCHAR(255) REFERENCES kullanicilar(email) ON DELETE SET NULL,
  musteri_adi     VARCHAR(200),
  musteri_telefon VARCHAR(20),
  kisi_sayisi     INTEGER NOT NULL DEFAULT 1,
  durum           rezervasyon_d_t NOT NULL DEFAULT 'bekliyor',
  toplam_tutar    INTEGER NOT NULL DEFAULT 0,
  tur_fiyati      INTEGER          DEFAULT 0,
  hizmet_bedeli   INTEGER          DEFAULT 0,
  komisyon        INTEGER          DEFAULT 0,
  kaptan_net      INTEGER          DEFAULT 0,
  tur_tarihi      VARCHAR(20),
  tur_saati       VARCHAR(10)      DEFAULT '09:00',
  musteri_notu    TEXT,
  kaptan_notu     TEXT,
  red_nedeni      TEXT,
  konum           VARCHAR(300),
  kayit_kanali    VARCHAR(20)      DEFAULT 'web',
  odeme_yapildi   BOOLEAN          DEFAULT FALSE,
  odeme_yontemi   VARCHAR(50),
  odeme_ref       VARCHAR(50),
  odeme_zamani    TIMESTAMPTZ,
  kart_turu       VARCHAR(20),
  kart_son4       VARCHAR(4),
  banka           VARCHAR(100),
  binis_yapildi   BOOLEAN          DEFAULT FALSE,
  binis_zamani    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ      DEFAULT NOW(),
  updated_at      TIMESTAMPTZ      DEFAULT NOW()
);

-- ================================================================
-- TABLE: odemeler
-- ================================================================
CREATE TABLE odemeler (
  id              VARCHAR(30) PRIMARY KEY,
  rezervasyon_id  VARCHAR(30)  REFERENCES rezervasyonlar(id) ON DELETE SET NULL,
  tur_id          UUID         REFERENCES turlar(id) ON DELETE SET NULL,
  tur_adi         VARCHAR(300),
  musteri_email   VARCHAR(255),
  musteri_adi     VARCHAR(200),
  kaptan_email    VARCHAR(255),
  tutar           INTEGER NOT NULL,
  tur_fiyati      INTEGER          DEFAULT 0,
  hizmet_bedeli   INTEGER          DEFAULT 0,
  komisyon        INTEGER          DEFAULT 0,
  kaptan_net      INTEGER          DEFAULT 0,
  yontem          VARCHAR(50),
  kart_turu       VARCHAR(20),
  kart_son4       VARCHAR(4),
  banka           VARCHAR(100),
  durum           odeme_durum_t    DEFAULT 'basarili',
  created_at      TIMESTAMPTZ      DEFAULT NOW()
);

-- ================================================================
-- TABLE: mesajlar
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
-- ================================================================
CREATE TABLE degerlendirmeler (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tur_id          UUID        REFERENCES turlar(id) ON DELETE CASCADE,
  rezervasyon_id  VARCHAR(30) REFERENCES rezervasyonlar(id) ON DELETE SET NULL,
  musteri_email   VARCHAR(255),
  musteri_adi     VARCHAR(200),
  puan            INTEGER NOT NULL CHECK (puan BETWEEN 1 AND 5),
  yorum           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- INDEXES
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
CREATE INDEX idx_deg_tur           ON degerlendirmeler(tur_id);

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
-- ================================================================
CREATE OR REPLACE FUNCTION fn_update_kaptan_puan()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE turlar
  SET puan = (SELECT ROUND(AVG(puan)::NUMERIC, 2) FROM degerlendirmeler WHERE tur_id = NEW.tur_id),
      inceleme_sayisi = (SELECT COUNT(*) FROM degerlendirmeler WHERE tur_id = NEW.tur_id)
  WHERE id = NEW.tur_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_puan_guncelle
  AFTER INSERT ON degerlendirmeler
  FOR EACH ROW EXECUTE FUNCTION fn_update_kaptan_puan();

-- ================================================================
-- KULLANICI İSTATİSTİK OTOMATİK GÜNCELLEME
-- ================================================================
CREATE OR REPLACE FUNCTION fn_update_kullanici_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.durum IN ('onaylandi', 'tamamlandi') AND NEW.odeme_yapildi = TRUE THEN
    UPDATE kullanicilar
    SET toplam_harcama = (
          SELECT COALESCE(SUM(toplam_tutar), 0)
          FROM rezervasyonlar
          WHERE musteri_email = NEW.musteri_email
            AND durum IN ('onaylandi', 'tamamlandi') AND odeme_yapildi = TRUE
        ),
        tur_sayisi = (
          SELECT COUNT(*) FROM rezervasyonlar
          WHERE musteri_email = NEW.musteri_email AND durum IN ('onaylandi', 'tamamlandi')
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
-- ROW LEVEL SECURITY — PROTOTYPE MODU (tüm anon erişim açık)
-- Üretim için Supabase Auth ile politikaları aktif edin
-- ================================================================
ALTER TABLE kaptanlar       DISABLE ROW LEVEL SECURITY;
ALTER TABLE turlar          DISABLE ROW LEVEL SECURITY;
ALTER TABLE kullanicilar    DISABLE ROW LEVEL SECURITY;
ALTER TABLE rezervasyonlar  DISABLE ROW LEVEL SECURITY;
ALTER TABLE odemeler        DISABLE ROW LEVEL SECURITY;
ALTER TABLE mesajlar        DISABLE ROW LEVEL SECURITY;
ALTER TABLE degerlendirmeler DISABLE ROW LEVEL SECURITY;

-- ================================================================
-- VIEW'LER
-- ================================================================
CREATE VIEW v_dashboard_ozet AS
SELECT
  (SELECT COUNT(*) FROM kaptanlar WHERE durum = 'aktif')         AS aktif_kaptan,
  (SELECT COUNT(*) FROM kaptanlar WHERE durum = 'bekliyor')      AS bekleyen_kaptan,
  (SELECT COUNT(*) FROM turlar WHERE durum = 'aktif')            AS aktif_tur,
  (SELECT COUNT(*) FROM turlar WHERE durum = 'bekliyor')         AS bekleyen_tur,
  (SELECT COUNT(*) FROM kullanicilar)                            AS toplam_uye,
  (SELECT COUNT(*) FROM rezervasyonlar)                          AS toplam_rezervasyon,
  (SELECT COUNT(*) FROM rezervasyonlar WHERE durum = 'bekliyor') AS bekleyen_rezervasyon,
  (SELECT COALESCE(SUM(tutar), 0)     FROM odemeler WHERE durum = 'basarili') AS toplam_ciro,
  (SELECT COALESCE(SUM(komisyon), 0)  FROM odemeler WHERE durum = 'basarili') AS toplam_komisyon;

CREATE VIEW v_kaptan_performans AS
SELECT
  k.id,
  k.ad || ' ' || k.soyad AS ad_soyad,
  k.email, k.bolge, k.durum, k.puan,
  COUNT(DISTINCT t.id)            AS tur_sayisi,
  COUNT(DISTINCT r.id)            AS rezervasyon_sayisi,
  COALESCE(SUM(r.kaptan_net), 0)  AS toplam_kazanc
FROM kaptanlar k
LEFT JOIN turlar t ON t.kaptan_email = k.email
LEFT JOIN rezervasyonlar r ON r.kaptan_email = k.email AND r.durum IN ('onaylandi', 'tamamlandi')
GROUP BY k.id, k.ad, k.soyad, k.email, k.bolge, k.durum, k.puan;
