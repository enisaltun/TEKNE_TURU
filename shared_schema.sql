-- ================================================================
-- DenizBul.tr — PostgreSQL Schema v3
-- Normalize edilmiş, SSOT uyumlu, ACID garantili
-- Idempotent — Supabase Dashboard > SQL Editor > Run ile çalıştırılır
-- ================================================================

-- ── TEMIZLIK (cascade sırası önemli: FK'ya göre önce bağımlı tablolar) ──
DROP VIEW  IF EXISTS v_dashboard_ozet  CASCADE;
DROP VIEW  IF EXISTS kaptanlar_view    CASCADE;
DROP TABLE IF EXISTS yorumlar          CASCADE;
DROP TABLE IF EXISTS mesajlar          CASCADE;
DROP TABLE IF EXISTS odemeler          CASCADE;
DROP TABLE IF EXISTS rezervasyonlar    CASCADE;
DROP TABLE IF EXISTS kaptanlar         CASCADE;
DROP TABLE IF EXISTS turlar            CASCADE;
DROP TABLE IF EXISTS kullanicilar      CASCADE;
DROP TABLE IF EXISTS satici_ilanlari   CASCADE;
DROP TABLE IF EXISTS magaza_urunleri   CASCADE;
DROP FUNCTION IF EXISTS fn_set_updated_at() CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Ortak trigger: updated_at otomatik güncelle ──
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;


-- ================================================================
-- KULLANICILAR  (SSOT — her kullanıcı profili tek yerde)
-- roller: {customer}, {customer,captain}, {customer,vendor}, vb.
-- captain_data / vendor_data / shop_data: rol bazlı genişletme (JSONB)
-- ================================================================
CREATE TABLE kullanicilar (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  ad              VARCHAR(100) NOT NULL,
  soyad           VARCHAR(100),
  telefon         VARCHAR(20),
  sifre           VARCHAR(255),
  tc_kimlik       CHAR(11),
  sehir           VARCHAR(100),
  avatar_url      TEXT,
  roller          TEXT[]       NOT NULL DEFAULT ARRAY['customer'],
  durum           VARCHAR(50)  NOT NULL DEFAULT 'aktif',
  plan            VARCHAR(50)           DEFAULT 'free',
  risk_score      INTEGER               DEFAULT 0,
  captain_data    JSONB,
  vendor_data     JSONB,
  shop_data       JSONB,
  kayit_kanali    VARCHAR(50)           DEFAULT 'web',
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_kullanicilar_upd
  BEFORE UPDATE ON kullanicilar
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX idx_kul_email  ON kullanicilar(email);
CREATE INDEX idx_kul_roller ON kullanicilar USING GIN(roller);
CREATE INDEX idx_kul_durum  ON kullanicilar(durum);


-- ================================================================
-- KAPTANLAR  (kaptan profili — kullanicilar'a FK ile SSOT korunur)
-- Kaptan kaydı silinirse kullanicilar kaydı korunur (SET NULL)
-- ================================================================
CREATE TABLE kaptanlar (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  kullanici_id    UUID         REFERENCES kullanicilar(id) ON DELETE SET NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  ad              VARCHAR(100),
  soyad           VARCHAR(100),
  tekne_adi       VARCHAR(200),
  tekne_turu      VARCHAR(100) DEFAULT 'Motor Tekne',
  tekne_yil       VARCHAR(10),
  kapasite        INTEGER      DEFAULT 8,
  bolge           VARCHAR(100),
  sehir           VARCHAR(100),
  marina          VARCHAR(200),
  lisans          VARCHAR(100),
  lisans_tarih    DATE,
  kategoriler     TEXT[]       DEFAULT ARRAY[]::TEXT[],
  durum           VARCHAR(50)  NOT NULL DEFAULT 'bekliyor',
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_kaptanlar_upd
  BEFORE UPDATE ON kaptanlar
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX idx_kap_email ON kaptanlar(email);
CREATE INDEX idx_kap_durum ON kaptanlar(durum);


-- ================================================================
-- TURLAR  (kaptan_email → kaptanlar.email ile SSOT zinciri)
-- ================================================================
CREATE TABLE turlar (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  kaptan_email    VARCHAR(255) NOT NULL REFERENCES kaptanlar(email) ON UPDATE CASCADE ON DELETE RESTRICT,
  kaptan_adi      VARCHAR(200),
  tur_adi         VARCHAR(255) NOT NULL,
  aciklama        TEXT,
  kategoriler     TEXT[]       DEFAULT ARRAY[]::TEXT[],
  sure            VARCHAR(50),
  fiyat           DECIMAL(10,2) NOT NULL DEFAULT 0,
  kapasite        INTEGER       DEFAULT 8,
  tarihler        DATE[]        DEFAULT ARRAY[]::DATE[],
  saatler         TEXT[]        DEFAULT ARRAY[]::TEXT[],
  dahil           TEXT[]        DEFAULT ARRAY[]::TEXT[],
  haric           TEXT,
  kalkis_noktasi  VARCHAR(255),
  bolge           VARCHAR(100),
  tekne_adi       VARCHAR(200),
  durum           VARCHAR(50)  NOT NULL DEFAULT 'aktif',
  hero_image      TEXT,
  puan            DECIMAL(3,2)  DEFAULT 0,
  inceleme_sayisi INTEGER       DEFAULT 0,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_turlar_upd
  BEFORE UPDATE ON turlar
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX idx_tur_kaptan ON turlar(kaptan_email);
CREATE INDEX idx_tur_durum  ON turlar(durum);
CREATE INDEX idx_tur_bolge  ON turlar(bolge);
CREATE INDEX idx_tur_fiyat  ON turlar(fiyat);


-- ================================================================
-- REZERVASYONLAR
-- tur_id → turlar(id): tur silinirse FK SET NULL (orphan kaydı değil)
-- SSOT: fiyat bilgisi buradan hesaplanır, tekrarlanmaz
-- ================================================================
CREATE TABLE rezervasyonlar (
  id                VARCHAR(100) PRIMARY KEY,
  tur_id            UUID         REFERENCES turlar(id) ON DELETE SET NULL,
  tur_adi           VARCHAR(255),                       -- denormalize kopy (tur silindi ise tarihsel kayıt)
  kaptan_email      VARCHAR(255),
  kaptan_adi        VARCHAR(200),
  musteri_email     VARCHAR(255),
  musteri_adi       VARCHAR(200),
  musteri_telefon   VARCHAR(20),
  kisi_sayisi       INTEGER      NOT NULL DEFAULT 1,
  durum             VARCHAR(50)  NOT NULL DEFAULT 'bekliyor',
  toplam_tutar      DECIMAL(10,2)         DEFAULT 0,
  tur_fiyati        DECIMAL(10,2)         DEFAULT 0,
  hizmet_bedeli     DECIMAL(10,2)         DEFAULT 0,
  komisyon          DECIMAL(10,2)         DEFAULT 0,
  kaptan_net        DECIMAL(10,2)         DEFAULT 0,
  tur_tarihi        DATE,
  tur_saati         VARCHAR(10)           DEFAULT '09:00',
  musteri_notu      TEXT,
  konum             TEXT,
  odeme_yapildi     BOOLEAN               DEFAULT false,
  odeme_yontemi     VARCHAR(50),
  odeme_ref         VARCHAR(100),
  odeme_zamani      TIMESTAMPTZ,
  kart_turu         VARCHAR(50),
  kart_son4         VARCHAR(4),
  banka             VARCHAR(100),
  binis_yapildi     BOOLEAN               DEFAULT false,
  binis_zamani      TIMESTAMPTZ,
  red_nedeni        TEXT,
  kayit_kanali      VARCHAR(50)           DEFAULT 'web',
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_rez_kaptan  ON rezervasyonlar(kaptan_email);
CREATE INDEX idx_rez_musteri ON rezervasyonlar(musteri_email);
CREATE INDEX idx_rez_durum   ON rezervasyonlar(durum);
CREATE INDEX idx_rez_tarih   ON rezervasyonlar(tur_tarihi);
CREATE INDEX idx_rez_tur     ON rezervasyonlar(tur_id);


-- ================================================================
-- MESAJLAR  (rezervasyon bazlı thread modeli)
-- rezervasyon_id → rezervasyonlar(id) ile her mesaj context'li
-- ================================================================
CREATE TABLE mesajlar (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  rezervasyon_id  VARCHAR(100) REFERENCES rezervasyonlar(id) ON DELETE CASCADE,
  kaptan_email    VARCHAR(255) NOT NULL,
  musteri_email   VARCHAR(255) NOT NULL,
  musteri_adi     VARCHAR(200),
  mesaj           TEXT         NOT NULL,
  gonderen        VARCHAR(20)  NOT NULL CHECK (gonderen IN ('kaptan','musteri','admin')),
  okundu_kaptan   BOOLEAN      DEFAULT false,
  okundu_musteri  BOOLEAN      DEFAULT false,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_mes_rezervasyon ON mesajlar(rezervasyon_id);
CREATE INDEX idx_mes_kaptan      ON mesajlar(kaptan_email);
CREATE INDEX idx_mes_musteri     ON mesajlar(musteri_email);


-- ================================================================
-- ÖDEMELER  (rezervasyon_id → SSOT, tutar tekrarlanmaz)
-- ================================================================
CREATE TABLE odemeler (
  id              VARCHAR(100) PRIMARY KEY,
  rezervasyon_id  VARCHAR(100) REFERENCES rezervasyonlar(id) ON DELETE SET NULL,
  tur_id          UUID         REFERENCES turlar(id) ON DELETE SET NULL,
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
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ode_rezervasyon ON odemeler(rezervasyon_id);
CREATE INDEX idx_ode_kaptan      ON odemeler(kaptan_email);


-- ================================================================
-- YORUMLAR
-- ================================================================
CREATE TABLE yorumlar (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  rezervasyon_id  VARCHAR(100) REFERENCES rezervasyonlar(id) ON DELETE SET NULL,
  tur_id          UUID         REFERENCES turlar(id) ON DELETE SET NULL,
  musteri_email   VARCHAR(255),
  musteri_adi     VARCHAR(200),
  kaptan_email    VARCHAR(255),
  puan            INTEGER      CHECK (puan BETWEEN 1 AND 5),
  yorum           TEXT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_yor_tur     ON yorumlar(tur_id);
CREATE INDEX idx_yor_kaptan  ON yorumlar(kaptan_email);


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
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
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
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- ================================================================
-- VIEW: kaptanlar_view — HTML kodunun beklediği düzleştirilmiş format
-- kaptan_data JSONB alanlarını direkt sütun olarak sunar
-- ================================================================
CREATE VIEW kaptanlar_view AS
SELECT
  k.id,
  k.kullanici_id,
  k.email,
  k.ad,
  k.soyad,
  (k.ad || ' ' || COALESCE(k.soyad,'')) AS ad_soyad,
  k.tekne_adi,
  k.tekne_turu,
  k.tekne_yil,
  k.kapasite,
  k.bolge,
  k.sehir,
  k.marina,
  k.lisans,
  k.lisans_tarih,
  k.kategoriler,
  k.durum,
  k.created_at,
  k.updated_at,
  u.avatar_url,
  u.plan,
  u.telefon
FROM kaptanlar k
LEFT JOIN kullanicilar u ON u.id = k.kullanici_id;


-- ================================================================
-- VIEW: v_dashboard_ozet — Admin panel dashboard için tek sorgu
-- ================================================================
CREATE VIEW v_dashboard_ozet AS
SELECT
  (SELECT COUNT(*) FROM kaptanlar  WHERE durum='aktif')                           AS aktif_kaptan,
  (SELECT COUNT(*) FROM kaptanlar  WHERE durum IN ('bekliyor','onay_bekliyor'))    AS bekleyen_kaptan,
  (SELECT COUNT(*) FROM turlar     WHERE durum='aktif')                           AS aktif_tur,
  (SELECT COUNT(*) FROM turlar     WHERE durum='bekliyor')                        AS bekleyen_tur,
  (SELECT COUNT(*) FROM kullanicilar WHERE 'customer' = ANY(roller))              AS toplam_uye,
  (SELECT COUNT(*) FROM kullanicilar WHERE 'vendor'   = ANY(roller) AND durum='aktif') AS aktif_satici,
  (SELECT COUNT(*) FROM kullanicilar WHERE 'shop_vendor'=ANY(roller) AND durum='aktif') AS aktif_magaza,
  (SELECT COUNT(*) FROM rezervasyonlar)                                           AS toplam_rezervasyon,
  (SELECT COUNT(*) FROM rezervasyonlar WHERE durum='bekliyor')                    AS bekleyen_rezervasyon,
  (SELECT COALESCE(SUM(tutar),0)    FROM odemeler WHERE durum='basarili')         AS toplam_ciro,
  (SELECT COALESCE(SUM(komisyon),0) FROM odemeler WHERE durum='basarili')         AS toplam_komisyon;


-- ================================================================
-- RLS (Row Level Security)
-- Prototype: anon key ile tam erişim
-- UYARI: Production'da kullanıcı bazlı politikalar yazılmalı!
-- ================================================================
ALTER TABLE kullanicilar    ENABLE ROW LEVEL SECURITY;
ALTER TABLE kaptanlar       ENABLE ROW LEVEL SECURITY;
ALTER TABLE turlar          ENABLE ROW LEVEL SECURITY;
ALTER TABLE rezervasyonlar  ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesajlar        ENABLE ROW LEVEL SECURITY;
ALTER TABLE odemeler        ENABLE ROW LEVEL SECURITY;
ALTER TABLE yorumlar        ENABLE ROW LEVEL SECURITY;
ALTER TABLE satici_ilanlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE magaza_urunleri ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all" ON kullanicilar    FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON kaptanlar       FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON turlar          FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON rezervasyonlar  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON mesajlar        FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON odemeler        FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON yorumlar        FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON satici_ilanlari FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON magaza_urunleri FOR ALL TO anon USING (true) WITH CHECK (true);


-- ================================================================
-- SABİT TEST HESAPLARI (ON CONFLICT ile idempotent)
-- ================================================================
INSERT INTO kullanicilar (email, ad, soyad, sifre, roller, durum, kayit_kanali) VALUES
  ('1',                 'Test',     'Musteri',  '1',        ARRAY['customer'],           'aktif', 'web'),
  ('musteri@test.com',  'Test',     'Musteri',  'test1234', ARRAY['customer'],           'aktif', 'web'),
  ('kaptan@test.com',   'Test',     'Kaptan',   'test1234', ARRAY['customer','captain'], 'aktif', 'web'),
  ('admin@test.com',    'Platform', 'Admin',    'test1234', ARRAY['customer','admin'],   'aktif', 'web')
ON CONFLICT (email) DO NOTHING;

-- Demo kaptan kaydı
INSERT INTO kaptanlar (email, ad, soyad, tekne_adi, tekne_turu, kapasite, bolge, marina, lisans, durum, kategoriler)
VALUES ('ali@kaptan.com', 'Ali', 'Kaptan', 'Ali''nin Teknesi', 'Motor Tekne', 8, 'Bodrum', 'Bodrum Marina', 'TR-12345', 'aktif', ARRAY['Tekne Gezisi','Balik Avi'])
ON CONFLICT (email) DO NOTHING;

-- Test kaptan hesabını kaptanlar tablosuna da ekle
INSERT INTO kaptanlar (kullanici_id, email, ad, soyad, tekne_adi, kapasite, bolge, durum)
SELECT id, email, ad, soyad, 'Test Teknesi', 8, 'Antalya', 'aktif'
FROM kullanicilar WHERE email = 'kaptan@test.com'
ON CONFLICT (email) DO NOTHING;
