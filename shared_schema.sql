-- ================================================================
-- DenizBul.tr — Shared PostgreSQL Schema v2
-- Birlesik kullanici modeli (roller TEXT[], captain/vendor/shop JSONB)
-- Idempotent — Supabase Dashboard > SQL Editor > Run
-- ================================================================

-- TEMİZLİK
DROP VIEW  IF EXISTS v_dashboard_ozet     CASCADE;
DROP TABLE IF EXISTS yorumlar             CASCADE;
DROP TABLE IF EXISTS satici_ilanlari      CASCADE;
DROP TABLE IF EXISTS magaza_urunleri      CASCADE;
DROP TABLE IF EXISTS degerlendirmeler     CASCADE;
DROP TABLE IF EXISTS mesajlar             CASCADE;
DROP TABLE IF EXISTS odemeler             CASCADE;
DROP TABLE IF EXISTS rezervasyonlar       CASCADE;
DROP TABLE IF EXISTS turlar               CASCADE;
DROP TABLE IF EXISTS kullanicilar         CASCADE;
DROP TABLE IF EXISTS kaptanlar            CASCADE;
DROP FUNCTION IF EXISTS fn_set_updated_at()  CASCADE;
DROP TYPE IF EXISTS kaptan_durum_t   CASCADE;
DROP TYPE IF EXISTS tur_durum_t      CASCADE;
DROP TYPE IF EXISTS rezervasyon_d_t  CASCADE;
DROP TYPE IF EXISTS odeme_durum_t    CASCADE;
DROP TYPE IF EXISTS gonderen_t       CASCADE;
DROP TYPE IF EXISTS kayit_kanali_t   CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- KULLANICILAR  (birlesik model)
-- roller ornegi: {customer}, {customer,captain}, {customer,vendor}
-- captain_data / vendor_data / shop_data: rol bazli JSONB
-- ================================================================
CREATE TABLE kullanicilar (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  ad            VARCHAR(100) NOT NULL,
  soyad         VARCHAR(100),
  telefon       VARCHAR(20),
  sifre         VARCHAR(255),
  tc_kimlik     CHAR(11),
  sehir         VARCHAR(100),
  avatar_url    TEXT,
  roller        TEXT[]      NOT NULL DEFAULT ARRAY['customer'],
  durum         VARCHAR(50) NOT NULL DEFAULT 'aktif',
  plan          VARCHAR(50)          DEFAULT 'free',
  risk_score    INTEGER              DEFAULT 0,
  captain_data  JSONB,
  vendor_data   JSONB,
  shop_data     JSONB,
  kayit_kanali  VARCHAR(50)          DEFAULT 'web',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_kullanicilar_upd
  BEFORE UPDATE ON kullanicilar
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ================================================================
-- TURLAR
-- ================================================================
CREATE TABLE turlar (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  kaptan_email    VARCHAR(255) NOT NULL,
  kaptan_adi      VARCHAR(200),
  tur_adi         VARCHAR(255) NOT NULL,
  aciklama        TEXT,
  kategoriler     TEXT[]               DEFAULT ARRAY[]::TEXT[],
  sure            VARCHAR(50),
  fiyat           DECIMAL(10,2) NOT NULL DEFAULT 0,
  kapasite        INTEGER              DEFAULT 8,
  tarihler        DATE[]               DEFAULT ARRAY[]::DATE[],
  saatler         TEXT[]               DEFAULT ARRAY[]::TEXT[],
  dahil           TEXT[]               DEFAULT ARRAY[]::TEXT[],
  haric           TEXT,
  kalkis_noktasi  VARCHAR(255),
  bolge           VARCHAR(100),
  tekne_adi       VARCHAR(200),
  durum           VARCHAR(50)  NOT NULL DEFAULT 'aktif',
  hero_image      TEXT,
  puan            DECIMAL(3,2)         DEFAULT 0,
  inceleme_sayisi INTEGER              DEFAULT 0,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_turlar_upd
  BEFORE UPDATE ON turlar
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ================================================================
-- REZERVASYONLAR
-- ================================================================
CREATE TABLE rezervasyonlar (
  id                VARCHAR(100) PRIMARY KEY,
  tur_id            UUID         REFERENCES turlar(id) ON DELETE SET NULL,
  tur_adi           VARCHAR(255),
  kaptan_email      VARCHAR(255),
  kaptan_adi        VARCHAR(200),
  musteri_email     VARCHAR(255),
  musteri_adi       VARCHAR(200),
  musteri_telefon   VARCHAR(20),
  kisi_sayisi       INTEGER      NOT NULL DEFAULT 1,
  durum             VARCHAR(50)  NOT NULL DEFAULT 'bekliyor',
  toplam_tutar      DECIMAL(10,2)        DEFAULT 0,
  tur_fiyati        DECIMAL(10,2)        DEFAULT 0,
  hizmet_bedeli     DECIMAL(10,2)        DEFAULT 0,
  komisyon          DECIMAL(10,2)        DEFAULT 0,
  kaptan_net        DECIMAL(10,2)        DEFAULT 0,
  tur_tarihi        DATE,
  tur_saati         VARCHAR(10)          DEFAULT '09:00',
  musteri_notu      TEXT,
  konum             TEXT,
  odeme_yapildi     BOOLEAN              DEFAULT false,
  odeme_yontemi     VARCHAR(50),
  odeme_ref         VARCHAR(100),
  odeme_zamani      TIMESTAMPTZ,
  kart_turu         VARCHAR(50),
  kart_son4         VARCHAR(4),
  banka             VARCHAR(100),
  binis_yapildi     BOOLEAN              DEFAULT false,
  binis_zamani      TIMESTAMPTZ,
  red_nedeni        TEXT,
  kayit_kanali      VARCHAR(50)          DEFAULT 'web',
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ================================================================
-- MESAJLAR
-- ================================================================
CREATE TABLE mesajlar (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  kaptan_email  VARCHAR(255) NOT NULL,
  musteri_email VARCHAR(255) NOT NULL,
  musteri_adi   VARCHAR(200),
  mesaj         TEXT        NOT NULL,
  gonderen      VARCHAR(20) NOT NULL CHECK (gonderen IN ('kaptan','musteri','admin')),
  okundu        BOOLEAN              DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- ÖDEMELER
-- ================================================================
CREATE TABLE odemeler (
  id              VARCHAR(100) PRIMARY KEY,
  rezervasyon_id  VARCHAR(100),
  tur_id          UUID,
  tur_adi         VARCHAR(255),
  musteri_email   VARCHAR(255),
  musteri_adi     VARCHAR(200),
  kaptan_email    VARCHAR(255),
  tutar           DECIMAL(10,2),
  tur_fiyati      DECIMAL(10,2),
  hizmet_bedeli   DECIMAL(10,2),
  komisyon        DECIMAL(10,2),
  kaptan_net      DECIMAL(10,2),
  yontem          VARCHAR(50),
  kart_turu       VARCHAR(50),
  kart_son4       VARCHAR(4),
  banka           VARCHAR(100),
  durum           VARCHAR(50)  DEFAULT 'basarili',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- YORUMLAR
-- ================================================================
CREATE TABLE yorumlar (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  rezervasyon_id  VARCHAR(100),
  tur_id          UUID,
  musteri_email   VARCHAR(255),
  musteri_adi     VARCHAR(200),
  kaptan_email    VARCHAR(255),
  puan            INTEGER     CHECK (puan BETWEEN 1 AND 5),
  yorum           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- SATICI İLANLARI
-- ================================================================
CREATE TABLE satici_ilanlari (
  id            VARCHAR(100) PRIMARY KEY,
  satici_email  VARCHAR(255),
  satici_adi    VARCHAR(200),
  sahil         VARCHAR(100),
  urun          VARCHAR(255),
  fiyat         DECIMAL(10,2),
  stok          INTEGER      DEFAULT 0,
  durum         VARCHAR(50)  DEFAULT 'aktif',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- MAĞAZA ÜRÜNLERİ
-- ================================================================
CREATE TABLE magaza_urunleri (
  id            VARCHAR(100) PRIMARY KEY,
  magaza_email  VARCHAR(255),
  magaza_adi    VARCHAR(200),
  urun          VARCHAR(255),
  fiyat         DECIMAL(10,2),
  stok          INTEGER      DEFAULT 0,
  durum         VARCHAR(50)  DEFAULT 'aktif',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- DASHBOARD VIEW
-- ================================================================
CREATE VIEW v_dashboard_ozet AS
SELECT
  (SELECT COUNT(*) FROM kullanicilar WHERE 'captain'     = ANY(roller) AND durum='aktif')        AS aktif_kaptan,
  (SELECT COUNT(*) FROM kullanicilar WHERE 'captain'     = ANY(roller) AND durum='onay_bekliyor') AS bekleyen_kaptan,
  (SELECT COUNT(*) FROM turlar       WHERE durum='aktif')                                         AS aktif_tur,
  (SELECT COUNT(*) FROM turlar       WHERE durum='bekliyor')                                      AS bekleyen_tur,
  (SELECT COUNT(*) FROM kullanicilar WHERE 'customer'    = ANY(roller))                           AS toplam_uye,
  (SELECT COUNT(*) FROM kullanicilar WHERE 'vendor'      = ANY(roller) AND durum='aktif')         AS aktif_satici,
  (SELECT COUNT(*) FROM kullanicilar WHERE 'shop_vendor' = ANY(roller) AND durum='aktif')         AS aktif_magaza,
  (SELECT COUNT(*) FROM rezervasyonlar)                                                           AS toplam_rezervasyon,
  (SELECT COUNT(*) FROM rezervasyonlar WHERE durum='bekliyor')                                    AS bekleyen_rezervasyon,
  (SELECT COALESCE(SUM(tutar),0)    FROM odemeler WHERE durum='basarili')                         AS toplam_ciro,
  (SELECT COALESCE(SUM(komisyon),0) FROM odemeler WHERE durum='basarili')                         AS toplam_komisyon;

-- ================================================================
-- RLS — Prototype: anon key ile tam erisim
-- UYARI: Production'da kullanici bazli politikalar yazilmali!
-- ================================================================
ALTER TABLE kullanicilar    ENABLE ROW LEVEL SECURITY;
ALTER TABLE turlar           ENABLE ROW LEVEL SECURITY;
ALTER TABLE rezervasyonlar   ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesajlar         ENABLE ROW LEVEL SECURITY;
ALTER TABLE odemeler         ENABLE ROW LEVEL SECURITY;
ALTER TABLE yorumlar         ENABLE ROW LEVEL SECURITY;
ALTER TABLE satici_ilanlari  ENABLE ROW LEVEL SECURITY;
ALTER TABLE magaza_urunleri  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all" ON kullanicilar    FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON turlar           FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON rezervasyonlar   FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON mesajlar         FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON odemeler         FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON yorumlar         FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON satici_ilanlari  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON magaza_urunleri  FOR ALL TO anon USING (true) WITH CHECK (true);

-- ================================================================
-- SABİT TEST HESAPLARI
-- Simülasyon sonrasi arkadaslar bu hesaplari kullanir
-- ================================================================
INSERT INTO kullanicilar (email, ad, soyad, sifre, roller, durum, kayit_kanali) VALUES
  ('musteri@test.com',  'Test',     'Musteri', 'test1234', ARRAY['customer'],           'aktif', 'web'),
  ('kaptan@test.com',   'Test',     'Kaptan',  'test1234', ARRAY['customer','captain'], 'aktif', 'web'),
  ('satici@test.com',   'Test',     'Satici',  'test1234', ARRAY['customer','vendor'],  'aktif', 'web'),
  ('admin@test.com',    'Platform', 'Admin',   'test1234', ARRAY['customer','admin'],   'aktif', 'web')
ON CONFLICT (email) DO NOTHING;
