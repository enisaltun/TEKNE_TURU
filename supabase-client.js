/**
 * DenizBul.tr — Supabase Shared Client
 *
 * KURULUM:
 *   1. Supabase projenizi oluşturun: https://supabase.com
 *   2. shared_schema.sql dosyasını SQL Editor'de çalıştırın
 *   3. Aşağıdaki SUPABASE_URL ve SUPABASE_KEY değerlerini girin
 *   4. Her HTML dosyasına şu iki satırı <head>'e ekleyin:
 *        <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *        <script src="supabase-client.js"></script>
 *   5. Mevcut localStorage çağrılarını DB.* fonksiyonlarıyla değiştirin
 *
 * GELIŞTIRME MODU:
 *   DB_MODE = 'local'  → localStorage kullanır (mevcut davranış)
 *   DB_MODE = 'remote' → Supabase kullanır
 */

// ================================================================
// YAPILANDIRMA — Supabase projenizden alın
// ================================================================
const SUPABASE_URL  = 'https://vkmvcedjjgtpldojzwue.supabase.co';
const SUPABASE_KEY  = 'sb_publishable_vHp_1Yd6hRsf9tVepG_luQ_DO9ICf64';
const DB_MODE       = 'remote';  // 'local' | 'remote'

// ================================================================
// CLIENT BAŞLATMA
// ================================================================
let _sb = null;
if (DB_MODE === 'remote' && typeof supabase !== 'undefined') {
  _sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// ================================================================
// YARDIMCI FONKSİYONLAR
// ================================================================
function _ls(key, fallback = []) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function _lsSet(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}
function _err(ctx, e) {
  console.error(`[DB:${ctx}]`, e?.message || e);
  return null;
}
// Benzersiz ID üreticileri
function _bkId()  { return 'BK' + Date.now(); }
function _payId() { return 'PAY-' + Math.floor(Math.random()*900000+100000) + '-' + String.fromCharCode(65+Math.random()*26|0) + String.fromCharCode(65+Math.random()*26|0); }
function _uuid()  {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}
window._uuid = _uuid;

// DB kaptanlar satırını localStorage uyumlu nesneye çevirir
function _denormalizeKaptan(k) {
  return {
    ...k,
    // camelCase alias'lar (eski HTML uyumluluğu)
    ad_soyad:       (k.ad || '') + ' ' + (k.soyad || ''),
    name:           (k.ad || '') + ' ' + (k.soyad || ''),
    tekne:          k.tekne_adi,
    tekneAdi:       k.tekne_adi,
    tekneTuru:      k.tekne_turu,
    tekneYil:       k.tekne_yil,
    katilimTarihi:  k.katilim_tarihi,
    createdAt:      k.created_at,
    aktif:          k.durum === 'aktif',
    status:         k.durum,
  };
}

// DB kullanicilar satırını localStorage uyumlu nesneye çevirir (eski schema)
function _denormalizeKullanici(u) {
  return {
    ...u,
    name:           u.ad_soyad,
    phone:          u.telefon,
    city:           u.sehir,
    emailOnaylandi: u.email_onaylandi,
    bildirimIzni:   u.bildirim_izni,
    toplamHarcama:  u.toplam_harcama,
    turSayisi:      u.tur_sayisi,
    sonGiris:       u.son_giris,
    kayitKanali:    u.kayit_kanali,
    createdAt:      u.created_at,
  };
}

// YENİ SCHEMA: Supabase kullanicilar satırı → db_users localStorage formatı
function _sbUserToLocal(u) {
  return {
    id:           u.id,
    email:        u.email,
    ad:           u.ad,
    soyad:        u.soyad,
    name:         (u.ad || '') + ' ' + (u.soyad || ''),
    ad_soyad:     (u.ad || '') + ' ' + (u.soyad || ''),
    telefon:      u.telefon,
    phone:        u.telefon,
    password:     u.sifre,
    sifre:        u.sifre,
    tcKimlik:     u.tc_kimlik,
    sehir:        u.sehir,
    city:         u.sehir,
    avatarUrl:    u.avatar_url,
    roles:        u.roller || ['customer'],
    roller:       u.roller || ['customer'],
    durum:        u.durum  || 'aktif',
    plan:         u.plan   || 'free',
    riskScore:    u.risk_score || 0,
    captainData:  u.captain_data,
    vendorData:   u.vendor_data,
    shopData:     u.shop_data,
    kayitKanali:  u.kayit_kanali,
    createdAt:    u.created_at,
    updatedAt:    u.updated_at,
  };
}

// DB rezervasyonlar satırını localStorage uyumlu nesneye çevirir
function _denormalizeRez(r) {
  return {
    ...r,
    // camelCase alias'lar
    tourId:        r.tur_id,
    tourTitle:     r.tur_adi,
    captainEmail:  r.kaptan_email,
    captainName:   r.kaptan_adi,
    customerEmail: r.musteri_email,
    customerName:  r.musteri_adi,
    musteri:       r.musteri_adi,
    customerPhone: r.musteri_telefon,
    guests:        r.kisi_sayisi,
    kisi:          r.kisi_sayisi,
    amount:        r.toplam_tutar,
    price:         r.toplam_tutar,
    turFiyat:      r.tur_fiyati,
    hizmetBedeli:  r.hizmet_bedeli,
    kaptanNet:     r.kaptan_net,
    tarih:         r.tur_tarihi,
    saat:          r.tur_saati,
    note:          r.musteri_notu,
    redNedeni:     r.red_nedeni,
    loc:           r.konum,
    odemeYapildi:  r.odeme_yapildi,
    odemeYontemi:  r.odeme_yontemi,
    odemeRef:      r.odeme_ref,
    odemeZamani:   r.odeme_zamani,
    kartTuru:      r.kart_turu,
    kartSon4:      r.kart_son4,
    binisYapildi:  r.binis_yapildi,
    binisZamani:   r.binis_zamani,
    kayitKanali:   r.kayit_kanali,
    createdAt:     r.created_at,
  };
}

// localStorage tur nesnelerini DB formatına normalize eder
function _normalizeTur(t) {
  const idStr = String(t.id || '');
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idStr);
  return {
    ...(isUuid ? { id: t.id } : {}),  // UUID değilse Supabase kendi atar
    kaptan_email:    t.captainEmail || t.kaptan_email,
    kaptan_adi:      t.captainName  || t.kaptan_adi,
    tur_adi:         t.title || t.ad || t.tur_adi,
    aciklama:        t.aciklama || '',
    kategoriler:     t.kategoriler || [],
    sure:            t.sure || '—',
    fiyat:           t.price || t.fiyat || 0,
    kapasite:        t.kapasite || 8,
    tarihler:        t.tarihler || [],
    saatler:         t.saatler  || ['09:00'],
    dahil:           t.includes || t.dahil || [],
    haric:           t.haric || '',
    kalkis_noktasi:  t.kalkis || t.kalkis_noktasi,
    bolge:           t.konum  || t.bolge,
    durum:           t.durum  || (t.aktif ? 'aktif' : t.status) || 'bekliyor',
    hero_image:      t.heroImage || t.hero_image,
    puan:            t.puan || 0,
    inceleme_sayisi: t.inceleme || t.inceleme_sayisi || 0,
    created_at:      t.createdAt || t.created_at || new Date().toISOString(),
  };
}

// DB formatını localStorage formatına dönüştürür (geriye uyumluluk)
function _denormalizeTur(t) {
  return {
    ...t,
    title:        t.tur_adi,
    ad:           t.tur_adi,
    captainEmail: t.kaptan_email,
    captainName:  t.kaptan_adi,
    price:        t.fiyat,
    fiyat:        t.fiyat,
    kalkis:       t.kalkis_noktasi,
    konum:        t.bolge,
    includes:     t.dahil,
    aktif:        t.durum === 'aktif',
    status:       t.durum,
    heroImage:    t.hero_image,
    inceleme:     t.inceleme_sayisi,
    createdAt:    t.created_at,
  };
}

// ================================================================
// DB — ANA NESNE
// Tüm HTML dosyaları window.DB üzerinden erişir.
// ================================================================
window.DB = {

  // ──────────────────────────────────────────────────────────────
  // KAPTANLAR
  // Kullanan: admin-panel (tümü), captain-app (getByEmail, update),
  //           captain-panel (getByEmail, create, update)
  // ──────────────────────────────────────────────────────────────
  kaptanlar: {

    // Tüm kaptanları getir — admin-panel: renderCaptains()
    async list() {
      if (DB_MODE === 'remote') {
        const { data, error } = await _sb.from('kaptanlar').select('*').order('created_at', { ascending: false });
        if (error) return _err('kaptanlar.list', error);
        return data.map(_denormalizeKaptan);
      }
      return _ls('db_captains', []);
    },

    // Email ile tek kaptan getir — captain-app/panel: profil yükleme
    async getByEmail(email) {
      if (DB_MODE === 'remote') {
        const { data, error } = await _sb.from('kaptanlar').select('*').eq('email', email).single();
        if (error) return _err('kaptanlar.getByEmail', error);
        return _denormalizeKaptan(data);
      }
      return _ls('db_captains', []).find(c => c.email === email) || null;
    },

    // Yeni kaptan oluştur — captain-panel: kayıt formu
    async create(data) {
      if (DB_MODE === 'remote') {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(String(data.id || ''));
        const { id: _dropId, ...rest } = data;
        const payload = isUuid ? data : rest; // integer id'yi düşür, Supabase UUID atar
        const { data: row, error } = await _sb.from('kaptanlar').insert(payload).select().single();
        if (error) return _err('kaptanlar.create', error);
        return row;
      }
      const list = _ls('db_captains', []);
      const kaptan = { id: Date.now(), ...data, created_at: new Date().toISOString() };
      list.unshift(kaptan);
      _lsSet('db_captains', list);
      return kaptan;
    },

    // Kaptan güncelle — admin-panel: onay/düzenleme, captain-app: profil güncelleme
    async update(id, data) {
      if (DB_MODE === 'remote') {
        const { data: row, error } = await _sb.from('kaptanlar').update(data).eq('id', id).select().single();
        if (error) return _err('kaptanlar.update', error);
        return row;
      }
      const list = _ls('db_captains', []);
      const idx = list.findIndex(c => c.id == id);
      if (idx === -1) return null;
      list[idx] = { ...list[idx], ...data };
      _lsSet('db_captains', list);
      return list[idx];
    },

    // Durumu güncelle — admin-panel: onayla/reddet/pasife al
    async updateDurum(id, durum) {
      return DB.kaptanlar.update(id, { durum, status: durum, aktif: durum === 'aktif' });
    },

    // Kaptan sil — admin-panel
    async delete(id) {
      if (DB_MODE === 'remote') {
        const { error } = await _sb.from('kaptanlar').delete().eq('id', id);
        if (error) return _err('kaptanlar.delete', error);
        return true;
      }
      const list = _ls('db_captains', []).filter(c => c.id != id);
      _lsSet('db_captains', list);
      return true;
    },
  },

  // ──────────────────────────────────────────────────────────────
  // TURLAR
  // Kullanan: TÜM UYGULAMALAR
  // ──────────────────────────────────────────────────────────────
  turlar: {

    // Aktif turları getir — customer-app/site: tur listesi, arama
    async listAktif(filters = {}) {
      if (DB_MODE === 'remote') {
        let q = _sb.from('turlar').select('*').eq('durum', 'aktif');
        if (filters.bolge)    q = q.eq('bolge', filters.bolge);
        if (filters.kategori) q = q.contains('kategoriler', [filters.kategori]);
        if (filters.maxFiyat) q = q.lte('fiyat', filters.maxFiyat);
        const { data, error } = await q.order('puan', { ascending: false });
        if (error) return _err('turlar.listAktif', error);
        return data.map(_denormalizeTur);
      }
      let list = _ls('db_tours', []).filter(t =>
        t.durum === 'aktif' || t.status === 'aktif' || t.aktif === true
      );
      if (filters.bolge)    list = list.filter(t => (t.konum || t.bolge) === filters.bolge);
      if (filters.kategori) list = list.filter(t => (t.kategoriler || []).includes(filters.kategori));
      if (filters.maxFiyat) list = list.filter(t => (t.price || t.fiyat || 0) <= filters.maxFiyat);
      return list;
    },

    // Tüm turlar — admin-panel
    async list() {
      if (DB_MODE === 'remote') {
        const { data, error } = await _sb.from('turlar').select('*').order('created_at', { ascending: false });
        if (error) return _err('turlar.list', error);
        return data.map(_denormalizeTur);
      }
      return _ls('db_tours', []);
    },

    // Kaptana ait turlar — captain-app/panel: "Turlarım"
    async listByKaptan(email) {
      if (DB_MODE === 'remote') {
        const { data, error } = await _sb.from('turlar').select('*').eq('kaptan_email', email).order('created_at', { ascending: false });
        if (error) return _err('turlar.listByKaptan', error);
        return data.map(_denormalizeTur);
      }
      return _ls('db_tours', []).filter(t =>
        (t.captainEmail || t.kaptan_email) === email
      );
    },

    // ID ile tek tur — detay sayfası, rezervasyon
    async getById(id) {
      if (DB_MODE === 'remote') {
        const { data, error } = await _sb.from('turlar').select('*').eq('id', id).single();
        if (error) return _err('turlar.getById', error);
        return _denormalizeTur(data);
      }
      return _ls('db_tours', []).find(t => t.id == id) || null;
    },

    // Yeni tur oluştur — captain-app: publishTour()
    async create(data) {
      const normalized = _normalizeTur(data);
      if (DB_MODE === 'remote') {
        const { data: row, error } = await _sb.from('turlar').insert(normalized).select().single();
        if (error) return _err('turlar.create', error);
        return _denormalizeTur(row);
      }
      const list = _ls('db_tours', []);
      const tur = { id: Date.now(), ...data, createdAt: new Date().toISOString() };
      list.unshift(tur);
      _lsSet('db_tours', list);
      return tur;
    },

    // Tur güncelle — captain-app: düzenleme, admin-panel: onay
    async update(id, data) {
      if (DB_MODE === 'remote') {
        const { data: row, error } = await _sb.from('turlar').update(_normalizeTur(data)).eq('id', id).select().single();
        if (error) return _err('turlar.update', error);
        return _denormalizeTur(row);
      }
      const list = _ls('db_tours', []);
      const idx = list.findIndex(t => t.id == id);
      if (idx === -1) return null;
      list[idx] = { ...list[idx], ...data };
      _lsSet('db_tours', list);
      return list[idx];
    },

    // Durumu güncelle — admin-panel: quickApproveTour/quickRejectTour
    async updateDurum(id, durum) {
      return DB.turlar.update(id, { durum, status: durum, aktif: durum === 'aktif' });
    },

    // Tur sil — captain-app/admin-panel
    async delete(id) {
      if (DB_MODE === 'remote') {
        const { error } = await _sb.from('turlar').delete().eq('id', id);
        if (error) return _err('turlar.delete', error);
        return true;
      }
      _lsSet('db_tours', _ls('db_tours', []).filter(t => t.id != id));
      return true;
    },
  },

  // ──────────────────────────────────────────────────────────────
  // KULLANICILAR (Müşteriler)
  // Kullanan: admin-panel (tümü), customer-app (getByEmail, create, update),
  //           customer-site (create, getByEmail)
  // ──────────────────────────────────────────────────────────────
  kullanicilar: {

    // Tüm kullanıcılar — admin-panel: üye listesi
    async list() {
      if (DB_MODE === 'remote') {
        const { data, error } = await _sb.from('kullanicilar').select('*').order('created_at', { ascending: false });
        if (error) return _err('kullanicilar.list', error);
        return data.map(_denormalizeKullanici);
      }
      return _ls('cu_users', []);
    },

    // Email ile kullanıcı getir — customer-app/site: giriş
    async getByEmail(email) {
      if (DB_MODE === 'remote') {
        const { data, error } = await _sb.from('kullanicilar').select('*').eq('email', email).single();
        if (error) return null;
        return _denormalizeKullanici(data);
      }
      return _ls('cu_users', []).find(u => u.email === email) || null;
    },

    // Yeni kullanıcı — customer-app/site: kayıt ol
    async create(data) {
      if (DB_MODE === 'remote') {
        const { data: row, error } = await _sb.from('kullanicilar').insert({
          ad_soyad:        data.name || data.ad_soyad,
          email:           data.email,
          telefon:         data.phone || data.telefon,
          sehir:           data.sehir,
          kayit_kanali:    data.kayitKanali || 'web',
          email_onaylandi: false,
          bildirim_izni:   true,
        }).select().single();
        if (error) return _err('kullanicilar.create', error);
        return row;
      }
      const list = _ls('cu_users', []);
      if (list.find(u => u.email === data.email)) return null; // duplicate
      const user = {
        id:            Date.now(),
        name:          data.name || data.ad_soyad,
        email:         data.email,
        phone:         data.phone || data.telefon || '',
        sehir:         data.sehir || '',
        kayitKanali:   data.kayitKanali || 'web',
        emailOnaylandi: false,
        bildirimIzni:  true,
        toplamHarcama: 0,
        turSayisi:     0,
        createdAt:     new Date().toISOString(),
        sonGiris:      new Date().toISOString(),
      };
      list.push(user);
      _lsSet('cu_users', list);
      return user;
    },

    // Kullanıcı güncelle — profil düzenleme, son giriş güncelleme
    async update(id, data) {
      if (DB_MODE === 'remote') {
        const { data: row, error } = await _sb.from('kullanicilar').update(data).eq('id', id).select().single();
        if (error) return _err('kullanicilar.update', error);
        return row;
      }
      const list = _ls('cu_users', []);
      const idx = list.findIndex(u => u.id == id);
      if (idx === -1) return null;
      list[idx] = { ...list[idx], ...data };
      _lsSet('cu_users', list);
      return list[idx];
    },

    // Kullanıcı sil — admin-panel
    async delete(id) {
      if (DB_MODE === 'remote') {
        const { error } = await _sb.from('kullanicilar').delete().eq('id', id);
        if (error) return _err('kullanicilar.delete', error);
        return true;
      }
      _lsSet('cu_users', _ls('cu_users', []).filter(u => u.id != id));
      return true;
    },
  },

  // ──────────────────────────────────────────────────────────────
  // REZERVASYONLAR
  // Kullanan: TÜM UYGULAMALAR
  // ──────────────────────────────────────────────────────────────
  rezervasyonlar: {

    // Tüm rezervasyonlar — admin-panel
    async list(filters = {}) {
      if (DB_MODE === 'remote') {
        let q = _sb.from('rezervasyonlar').select('*');
        if (filters.durum)  q = q.eq('durum', filters.durum);
        if (filters.tarih)  q = q.eq('tur_tarihi', filters.tarih);
        const { data, error } = await q.order('created_at', { ascending: false });
        if (error) return _err('rezervasyonlar.list', error);
        return data.map(_denormalizeRez);
      }
      let list = _ls('db_bookings', []);
      if (filters.durum) list = list.filter(b => b.durum === filters.durum);
      return list;
    },

    // Kaptana ait rezervasyonlar — captain-app/panel
    async listByKaptan(email) {
      if (DB_MODE === 'remote') {
        const { data, error } = await _sb.from('rezervasyonlar')
          .select('*').eq('kaptan_email', email)
          .order('created_at', { ascending: false });
        if (error) return _err('rezervasyonlar.listByKaptan', error);
        return data.map(_denormalizeRez);
      }
      return _ls('db_bookings', []).filter(b =>
        b.captainEmail === email || b.kaptan_email === email
      );
    },

    // Müşteriye ait rezervasyonlar — customer-app/site
    async listByMusteri(email) {
      if (DB_MODE === 'remote') {
        const { data, error } = await _sb.from('rezervasyonlar')
          .select('*').eq('musteri_email', email)
          .order('created_at', { ascending: false });
        if (error) return _err('rezervasyonlar.listByMusteri', error);
        return data.map(_denormalizeRez);
      }
      return _ls('db_bookings', []).filter(b =>
        b.customerEmail === email || b.musteri_email === email
      );
    },

    // Yeni rezervasyon — customer-app/site: satın al
    async create(data) {
      const id = data.id || _bkId();
      // HTML tarafı zaten hesaplayıp gönderiyorsa onu kullan
      const hizmetBedeli = data.hizmetBedeli || data.hizmet_bedeli || Math.round((data.turFiyat || data.fiyat || 0) * 0.10);
      const amount       = data.amount || data.toplam_tutar || ((data.turFiyat || data.fiyat || 0) + hizmetBedeli) * (data.guests || data.kisiSayisi || 1);
      const komisyon     = data.komisyon || Math.round(amount * 0.025);

      if (DB_MODE === 'remote') {
        const { data: row, error } = await _sb.from('rezervasyonlar').insert({
          id,
          tur_id:          data.tourId || data.tur_id,
          tur_adi:         data.tourTitle || data.tur_adi,
          kaptan_email:    data.captainEmail || data.kaptan_email,
          kaptan_adi:      data.captainName  || data.kaptan_adi,
          musteri_email:   data.customerEmail || data.musteri_email,
          musteri_adi:     data.customerName  || data.musteri_adi,
          musteri_telefon: data.customerPhone || data.musteri_telefon,
          kisi_sayisi:     data.guests || data.kisiSayisi || 1,
          durum:           'bekliyor',
          toplam_tutar:    amount,
          tur_fiyati:      data.turFiyat || data.fiyat || 0,
          hizmet_bedeli:   hizmetBedeli,
          komisyon,
          kaptan_net:      Math.round(amount * 0.9 - komisyon),
          tur_tarihi:      data.tarih || data.tur_tarihi,
          tur_saati:       data.saat  || data.tur_saati || '09:00',
          musteri_notu:    data.note  || data.musteri_notu || '',
          konum:           data.loc   || data.konum || '',
          kayit_kanali:    data.kayitKanali || 'web',
        }).select().single();
        if (error) return _err('rezervasyonlar.create', error);
        return row;
      }

      const booking = {
        id,
        tourId:         data.tourId,
        tourTitle:      data.tourTitle,
        captainEmail:   data.captainEmail,
        captainName:    data.captainName,
        customerEmail:  data.customerEmail,
        customerName:   data.customerName,
        customerPhone:  data.customerPhone || '',
        guests:         data.guests || 1,
        durum:          'bekliyor',
        amount,
        turFiyat:       data.turFiyat || 0,
        hizmetBedeli,
        komisyon,
        kaptanNet:      Math.round(amount * 0.9 - komisyon),
        tarih:          data.tarih,
        saat:           data.saat || '09:00',
        note:           data.note || '',
        loc:            data.loc  || '',
        odemeYapildi:   false,
        kayitKanali:    data.kayitKanali || 'web',
        createdAt:      new Date().toISOString(),
      };
      const list = _ls('db_bookings', []);
      list.unshift(booking);
      _lsSet('db_bookings', list);
      return booking;
    },

    // Durum güncelle — captain-app: kabul/red, admin-panel: onay
    async updateDurum(id, durum, not = '') {
      const update = { durum };
      if (not) update.red_nedeni = not;
      if (durum === 'tamamlandi') update.binis_yapildi = true;

      if (DB_MODE === 'remote') {
        const { data, error } = await _sb.from('rezervasyonlar').update(update).eq('id', id).select().single();
        if (error) return _err('rezervasyonlar.updateDurum', error);
        return data;
      }
      const list = _ls('db_bookings', []);
      const idx = list.findIndex(b => b.id === id);
      if (idx === -1) return null;
      list[idx] = { ...list[idx], durum, ...(not ? { redNedeni: not } : {}) };
      _lsSet('db_bookings', list);
      return list[idx];
    },

    // Ödeme bilgisi ekle — customer-app: ödeme adımı
    async setOdeme(id, odemeData) {
      const update = {
        odeme_yapildi:  true,
        odeme_yontemi:  odemeData.yontem,
        odeme_ref:      odemeData.ref || _payId(),
        odeme_zamani:   new Date().toISOString(),
        kart_turu:      odemeData.kartTuru || null,
        kart_son4:      odemeData.kartSon4 || null,
        banka:          odemeData.banka    || null,
      };
      if (DB_MODE === 'remote') {
        const { data, error } = await _sb.from('rezervasyonlar').update(update).eq('id', id).select().single();
        if (error) return _err('rezervasyonlar.setOdeme', error);
        return data;
      }
      const list = _ls('db_bookings', []);
      const idx = list.findIndex(b => b.id === id);
      if (idx === -1) return null;
      list[idx] = {
        ...list[idx],
        odemeYapildi:  true,
        odemeYontemi:  odemeData.yontem,
        odemeRef:      odemeData.ref || _payId(),
        odemeZamani:   new Date().toISOString(),
        kartTuru:      odemeData.kartTuru || null,
        kartSon4:      odemeData.kartSon4 || null,
        banka:         odemeData.banka    || null,
      };
      _lsSet('db_bookings', list);
      return list[idx];
    },

    // Genel alan güncelle — admin-panel: adminReply, adminNote vb.
    async update(id, fields) {
      if (DB_MODE === 'remote') {
        const { data, error } = await _sb.from('rezervasyonlar').update(fields).eq('id', id).select().single();
        if (error) return _err('rezervasyonlar.update', error);
        return data;
      }
      const list = _ls('db_bookings', []);
      const idx = list.findIndex(b => String(b.id) === String(id));
      if (idx === -1) return null;
      list[idx] = { ...list[idx], ...fields };
      _lsSet('db_bookings', list);
      return list[idx];
    },

    // Rezervasyon sil — admin-panel
    async delete(id) {
      if (DB_MODE === 'remote') {
        const { error } = await _sb.from('rezervasyonlar').delete().eq('id', id);
        if (error) return _err('rezervasyonlar.delete', error);
        return true;
      }
      _lsSet('db_bookings', _ls('db_bookings', []).filter(b => b.id !== id));
      return true;
    },
  },

  // ──────────────────────────────────────────────────────────────
  // ÖDEMELER
  // Kullanan: admin-panel (tümü), captain-app (listByKaptan)
  // ──────────────────────────────────────────────────────────────
  odemeler: {

    // Tüm ödemeler — admin-panel: mali raporlar
    async list(filters = {}) {
      if (DB_MODE === 'remote') {
        let q = _sb.from('odemeler').select('*');
        if (filters.durum) q = q.eq('durum', filters.durum);
        const { data, error } = await q.order('created_at', { ascending: false });
        if (error) return _err('odemeler.list', error);
        return data;
      }
      return _ls('db_payments', []);
    },

    // Kaptana ait ödemeler — captain-app: gelir takibi
    async listByKaptan(email) {
      if (DB_MODE === 'remote') {
        const { data, error } = await _sb.from('odemeler').select('*').eq('kaptan_email', email);
        if (error) return _err('odemeler.listByKaptan', error);
        return data;
      }
      return _ls('db_payments', []).filter(p => p.captainEmail === email || p.kaptan_email === email);
    },

    // Yeni ödeme kaydı — rezervasyon onaylanınca otomatik çağrılır
    async create(rezervasyon) {
      const id = _payId();
      if (DB_MODE === 'remote') {
        const { data, error } = await _sb.from('odemeler').insert({
          id,
          rezervasyon_id: rezervasyon.id,
          tur_id:         rezervasyon.tur_id || rezervasyon.tourId,
          tur_adi:        rezervasyon.tur_adi || rezervasyon.tourTitle,
          musteri_email:  rezervasyon.musteri_email || rezervasyon.customerEmail,
          musteri_adi:    rezervasyon.musteri_adi   || rezervasyon.customerName,
          kaptan_email:   rezervasyon.kaptan_email  || rezervasyon.captainEmail,
          tutar:          rezervasyon.toplam_tutar  || rezervasyon.amount,
          tur_fiyati:     rezervasyon.tur_fiyati    || rezervasyon.turFiyat,
          hizmet_bedeli:  rezervasyon.hizmet_bedeli || rezervasyon.hizmetBedeli,
          komisyon:       rezervasyon.komisyon,
          kaptan_net:     rezervasyon.kaptan_net    || rezervasyon.kaptanNet,
          yontem:         rezervasyon.odeme_yontemi || rezervasyon.odemeYontemi,
          kart_turu:      rezervasyon.kart_turu     || rezervasyon.kartTuru,
          kart_son4:      rezervasyon.kart_son4     || rezervasyon.kartSon4,
          banka:          rezervasyon.banka,
          durum:          'basarili',
        }).select().single();
        if (error) return _err('odemeler.create', error);
        return data;
      }
      const payment = {
        id,
        bookingId:      rezervasyon.id,
        tourId:         rezervasyon.tourId,
        tourTitle:      rezervasyon.tourTitle,
        customerEmail:  rezervasyon.customerEmail,
        customerName:   rezervasyon.customerName,
        captainEmail:   rezervasyon.captainEmail,
        tutar:          rezervasyon.amount,
        turFiyat:       rezervasyon.turFiyat,
        hizmetBedeli:   rezervasyon.hizmetBedeli,
        komisyon:       rezervasyon.komisyon,
        kaptanNet:      rezervasyon.kaptanNet,
        yontem:         rezervasyon.odemeYontemi,
        kartTuru:       rezervasyon.kartTuru,
        kartSon4:       rezervasyon.kartSon4,
        banka:          rezervasyon.banka,
        durum:          'basarili',
        tarih:          new Date().toISOString(),
        createdAt:      new Date().toISOString(),
      };
      const list = _ls('db_payments', []);
      list.unshift(payment);
      _lsSet('db_payments', list);
      return payment;
    },

    // İade işlemi — admin-panel
    async iade(id) {
      if (DB_MODE === 'remote') {
        const { data, error } = await _sb.from('odemeler').update({ durum: 'iade_edildi' }).eq('id', id).select().single();
        if (error) return _err('odemeler.iade', error);
        return data;
      }
      const list = _ls('db_payments', []);
      const idx = list.findIndex(p => p.id === id);
      if (idx !== -1) { list[idx].durum = 'iade_edildi'; _lsSet('db_payments', list); }
      return list[idx] || null;
    },
  },

  // ──────────────────────────────────────────────────────────────
  // MESAJLAR
  // Kullanan: admin-panel, captain-app, captain-panel
  // ──────────────────────────────────────────────────────────────
  mesajlar: {

    // Tüm mesajlar — admin-panel
    async list() {
      if (DB_MODE === 'remote') {
        const { data, error } = await _sb.from('mesajlar').select('*').order('created_at', { ascending: true });
        if (error) return _err('mesajlar.list', error);
        return data;
      }
      return _ls('db_messages', []);
    },

    // İki kişi arasındaki konuşma — captain-app/panel: chat ekranı
    async listThread(kaptanEmail, musteriEmail) {
      if (DB_MODE === 'remote') {
        const { data, error } = await _sb.from('mesajlar').select('*')
          .eq('kaptan_email', kaptanEmail).eq('musteri_email', musteriEmail)
          .order('created_at', { ascending: true });
        if (error) return _err('mesajlar.listThread', error);
        return data;
      }
      return _ls('db_messages', []).filter(m =>
        m.kaptanEmail === kaptanEmail && m.musteriEmail === musteriEmail
      );
    },

    // Kaptanın tüm konuşmaları (son mesaj özeti) — captain-app: mesajlar listesi
    async listByKaptan(email) {
      if (DB_MODE === 'remote') {
        const { data, error } = await _sb.from('mesajlar').select('*')
          .eq('kaptan_email', email).order('created_at', { ascending: false });
        if (error) return _err('mesajlar.listByKaptan', error);
        return data;
      }
      return _ls('db_messages', []).filter(m => m.kaptanEmail === email);
    },

    // Mesaj gönder — captain-app/panel ve customer için
    async send({ kaptanEmail, musteriEmail, musteriAdi, mesaj, gonderen }) {
      if (DB_MODE === 'remote') {
        const { data, error } = await _sb.from('mesajlar').insert({
          kaptan_email:  kaptanEmail,
          musteri_email: musteriEmail,
          musteri_adi:   musteriAdi,
          mesaj,
          gonderen,
          okundu: false,
        }).select().single();
        if (error) return _err('mesajlar.send', error);
        return data;
      }
      const msg = {
        id:           'msg-' + Date.now(),
        kaptanEmail,
        musteriEmail,
        musteriAdi,
        mesaj,
        gonderen,
        okundu:       false,
        zaman:        new Date().toISOString(),
      };
      const list = _ls('db_messages', []);
      list.push(msg);
      _lsSet('db_messages', list);
      // captain-panel uyumluluğu için cp_messages'a da yaz
      if (gonderen === 'kaptan') {
        const cpMsgs = _ls('cp_messages', []);
        cpMsgs.push(msg);
        _lsSet('cp_messages', cpMsgs);
      }
      return msg;
    },

    // Okundu işaretle — captain-app: mesaj açılınca
    async markRead(kaptanEmail, musteriEmail) {
      if (DB_MODE === 'remote') {
        await _sb.from('mesajlar').update({ okundu: true })
          .eq('kaptan_email', kaptanEmail).eq('musteri_email', musteriEmail).eq('gonderen', 'musteri');
        return true;
      }
      const list = _ls('db_messages', []);
      list.forEach(m => {
        if (m.kaptanEmail === kaptanEmail && m.musteriEmail === musteriEmail && m.gonderen === 'musteri')
          m.okundu = true;
      });
      _lsSet('db_messages', list);
      return true;
    },

    // Gerçek zamanlı mesaj dinleme — Supabase Realtime (sadece remote modda çalışır)
    subscribe(kaptanEmail, onMessage) {
      if (DB_MODE !== 'remote' || !_sb) return () => {};
      const channel = _sb.channel(`mesajlar:${kaptanEmail}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'mesajlar',
          filter: `kaptan_email=eq.${kaptanEmail}`,
        }, payload => onMessage(payload.new))
        .subscribe();
      return () => _sb.removeChannel(channel); // unsubscribe fonksiyonu döner
    },
  },

  // ──────────────────────────────────────────────────────────────
  // DEĞERLENDİRMELER
  // Kullanan: customer-app, admin-panel
  // ──────────────────────────────────────────────────────────────
  degerlendirmeler: {

    async listByTur(turId) {
      if (DB_MODE === 'remote') {
        const { data, error } = await _sb.from('degerlendirmeler').select('*').eq('tur_id', turId).order('created_at', { ascending: false });
        if (error) return _err('degerlendirmeler.listByTur', error);
        return data;
      }
      return _ls('db_reviews', []).filter(r => r.tourId == turId || r.tur_id == turId);
    },

    async create({ turId, rezervasyonId, musteriEmail, musteriAdi, puan, yorum }) {
      if (DB_MODE === 'remote') {
        const { data, error } = await _sb.from('degerlendirmeler').insert({
          tur_id: turId, rezervasyon_id: rezervasyonId,
          musteri_email: musteriEmail, musteri_adi: musteriAdi,
          puan, yorum,
        }).select().single();
        if (error) return _err('degerlendirmeler.create', error);
        return data;
      }
      const review = { id: Date.now(), tourId: turId, rezervasyonId, musteriEmail, musteriAdi, puan, yorum, createdAt: new Date().toISOString() };
      const list = _ls('db_reviews', []);
      list.unshift(review);
      _lsSet('db_reviews', list);
      return review;
    },
  },

  // ──────────────────────────────────────────────────────────────
  // AUTH — Login / Register (Supabase kullanicilar tablosu)
  // ──────────────────────────────────────────────────────────────
  auth: {

    // Email + sifre ile giris — customer-app/captain-app: doLogin()
    async login(email, password) {
      const em = (email || '').trim().toLowerCase();
      if (DB_MODE === 'remote') {
        const { data, error } = await _sb
          .from('kullanicilar').select('*')
          .eq('email', em).eq('sifre', password).single();
        if (error || !data) return null;
        return _sbUserToLocal(data);
      }
      const users = _ls('db_users', []);
      return users.find(u => u.email === em && u.password === password) || null;
    },

    // Yeni kullanici olustur — customer-app: doRegister()
    async register(userData) {
      const em = (userData.email || '').trim().toLowerCase();
      if (DB_MODE === 'remote') {
        const { data, error } = await _sb.from('kullanicilar').insert({
          email:        em,
          ad:           userData.ad   || (userData.name || '').split(' ')[0] || em,
          soyad:        userData.soyad|| (userData.name || '').split(' ').slice(1).join(' ') || '',
          telefon:      userData.telefon || userData.phone || '',
          sifre:        userData.password || userData.sifre || '',
          tc_kimlik:    userData.tcKimlik || null,
          roller:       userData.roles || ['customer'],
          durum:        userData.durum || 'aktif',
          captain_data: userData.captainData || null,
          vendor_data:  userData.vendorData  || null,
          shop_data:    userData.shopData    || null,
          kayit_kanali: userData.kayitKanali || 'web',
        }).select().single();
        if (error) return _err('auth.register', error);
        return _sbUserToLocal(data);
      }
      const list = _ls('db_users', []);
      if (list.find(u => u.email === em)) return null;
      const user = { id: Date.now(), ...userData, email: em, createdAt: new Date().toISOString() };
      list.push(user);
      _lsSet('db_users', list);
      return user;
    },
  },

  // ──────────────────────────────────────────────────────────────
  // YARDIMCI: Dashboard istatistikleri — admin-panel
  // ──────────────────────────────────────────────────────────────
  dashboard: {
    async getOzet() {
      if (DB_MODE === 'remote') {
        const { data, error } = await _sb.from('v_dashboard_ozet').select('*').single();
        if (error) return _err('dashboard.getOzet', error);
        return data;
      }
      const kaptanlar    = _ls('db_captains', []);
      const turlar       = _ls('db_tours', []);
      const rezervasyonlar = _ls('db_bookings', []);
      const odemeler     = _ls('db_payments', []);
      return {
        aktif_kaptan:        kaptanlar.filter(c => c.durum === 'aktif').length,
        bekleyen_kaptan:     kaptanlar.filter(c => c.durum === 'bekliyor').length,
        aktif_tur:           turlar.filter(t => t.durum === 'aktif' || t.aktif).length,
        bekleyen_tur:        turlar.filter(t => t.durum === 'bekliyor').length,
        toplam_uye:          _ls('cu_users', []).length,
        toplam_rezervasyon:  rezervasyonlar.length,
        bekleyen_rezervasyon: rezervasyonlar.filter(b => b.durum === 'bekliyor').length,
        toplam_ciro:         odemeler.reduce((s, p) => s + (p.tutar || 0), 0),
        toplam_komisyon:     odemeler.reduce((s, p) => s + (p.komisyon || 0), 0),
      };
    },
  },
};

// ================================================================
// _sbSync — Supabase'den çek, localStorage'a yaz
// Her HTML dosyasının load handler'ı başında çağrılır.
// Mevcut render fonksiyonları localStorage'ı okumaya devam eder.
// ================================================================
window._sbSync = async function() {
  if (DB_MODE !== 'remote' || !_sb) return;
  try {
    const [kuls, turs, rezs, odes, yorumlar, saticiIlanlar, magazaUrunler] = await Promise.all([
      _sb.from('kullanicilar').select('*').order('created_at', { ascending: false }),
      _sb.from('turlar').select('*').order('created_at', { ascending: false }),
      _sb.from('rezervasyonlar').select('*').order('created_at', { ascending: false }),
      _sb.from('odemeler').select('*').order('created_at', { ascending: false }),
      _sb.from('yorumlar').select('*').order('created_at', { ascending: false }),
      _sb.from('satici_ilanlari').select('*').order('created_at', { ascending: false }),
      _sb.from('magaza_urunleri').select('*').order('created_at', { ascending: false }),
    ]);

    // Kullanicilari hem db_users hem cu_users'a yaz
    if (!kuls.error && kuls.data && kuls.data.length) {
      const normalized = kuls.data.map(_sbUserToLocal);
      _lsSet('db_users', normalized);
      _lsSet('cu_users', normalized);
      // Geriye uyumluluk: kaptan profillerini db_captains'e de yaz
      const captains = normalized
        .filter(u => (u.roles || []).includes('captain'))
        .map(u => ({ ...u, captainProfile: u.captainData, status: u.durum, aktif: u.durum === 'aktif' }));
      if (captains.length) _lsSet('db_captains', captains);
    }

    if (!turs.error && turs.data && turs.data.length) {
      const tours = turs.data
        .filter(t => { const f = +(t.fiyat || 0); return f <= 500000; })
        .map(t => ({ ..._denormalizeTur(t), perPerson: Math.round((t.fiyat || 0) / (t.kapasite || 8)) }));
      _lsSet('db_tours', tours);
      _lsSet('cp_tours', tours);
    }

    if (!rezs.error && rezs.data && rezs.data.length) {
      const existingBks = _ls('db_bookings', []);
      const localMap = new Map(existingBks.map(b => [String(b.id), b]));
      _lsSet('db_bookings', rezs.data.map(r => {
        const local = localMap.get(String(r.id)) || {};
        const d = _denormalizeRez(r);
        if (local.adminReply)   d.adminReply   = local.adminReply;
        if (local.adminReplyAt) d.adminReplyAt = local.adminReplyAt;
        if (local.adminNote)    d.adminNote    = local.adminNote;
        return d;
      }));
    }

    if (!odes.error && odes.data && odes.data.length) _lsSet('db_payments', odes.data);
    if (!yorumlar.error && yorumlar.data && yorumlar.data.length) _lsSet('db_reviews', yorumlar.data);
    if (!saticiIlanlar.error && saticiIlanlar.data && saticiIlanlar.data.length) _lsSet('db_vendor_listings', saticiIlanlar.data);
    if (!magazaUrunler.error && magazaUrunler.data && magazaUrunler.data.length) _lsSet('db_shop_listings', magazaUrunler.data);

    console.log('[SB] sync tamamlandi — kullanicilar:', kuls.data?.length,
      'turlar:', turs.data?.length, 'rezervasyonlar:', rezs.data?.length,
      'yorumlar:', yorumlar.data?.length);
  } catch(e) {
    console.warn('[SB] sync hatasi', e);
  }
};

// ================================================================
// exportToSupabase — localStorage simülasyon verisini Supabase'e aktar
// Admin panelden çağrılır: await exportToSupabase({ onProgress })
// ================================================================
window.exportToSupabase = async function(opts = {}) {
  if (DB_MODE !== 'remote' || !_sb) throw new Error('DB_MODE remote olmali');
  const setP  = opts.onProgress || (() => {});
  const CHUNK = 50;
  const chunkArr = (arr, n) => { const r=[]; for(let i=0;i<arr.length;i+=n) r.push(arr.slice(i,i+n)); return r; };
  const safeFlt  = v => (isFinite(+v) && +v >= 0 && +v <= 999999) ? +v : 0;
  const safeDate = v => { try { const d=new Date(v); return isNaN(d)?null:d.toISOString().slice(0,10); } catch{return null;} };
  const safeTS   = v => { try { const d=new Date(v); return isNaN(d)?null:d.toISOString(); } catch{return null;} };

  // 1. Tabloları temizle (simülasyon verisi baştan yazılsın)
  setP(3, 'Eski simülasyon verisi temizleniyor…');
  await Promise.all([
    _sb.from('rezervasyonlar').delete().neq('id','__none__'),
    _sb.from('yorumlar').delete().neq('id',_uuid()),
    _sb.from('satici_ilanlari').delete().neq('id','__none__'),
    _sb.from('magaza_urunleri').delete().neq('id','__none__'),
  ]);
  await _sb.from('turlar').delete().neq('id',_uuid());
  // Kullanicilari silmiyoruz, upsert yapiyoruz (test hesaplari korunur)

  // 2. Kullanicilar
  setP(10, 'Kullanıcılar yükleniyor…');
  const lsUsers = _ls('db_users', []);
  const usersPayload = lsUsers.map(u => ({
    email:        (u.email || '').toLowerCase(),
    ad:           u.ad   || (u.name || '').split(' ')[0] || 'Kullanici',
    soyad:        u.soyad|| (u.name || '').split(' ').slice(1).join(' ') || '',
    telefon:      u.telefon || u.phone || '',
    sifre:        u.password || u.sifre || 'demo1234',
    tc_kimlik:    u.tcKimlik || null,
    sehir:        u.sehir || u.city || '',
    roller:       u.roles  || u.roller || ['customer'],
    durum:        u.durum  || u.status || 'aktif',
    plan:         u.plan   || 'free',
    risk_score:   u.riskScore || u.risk_score || 0,
    captain_data: u.captainData || u.captain_data || null,
    vendor_data:  u.vendorData  || u.vendor_data  || null,
    shop_data:    u.shopData    || u.shop_data     || null,
    kayit_kanali: u.kayitKanali || u.kayit_kanali  || 'web',
    created_at:   safeTS(u.createdAt || u.created_at) || new Date().toISOString(),
  })).filter(u => u.email && u.email.includes('@'));
  for (const ch of chunkArr(usersPayload, CHUNK)) {
    const { error } = await _sb.from('kullanicilar').upsert(ch, { onConflict: 'email' });
    if (error) console.warn('[Export] kullanicilar:', error.message);
  }

  // 3. Turlar
  setP(28, 'Turlar yükleniyor…');
  const lsTours = _ls('db_tours', []);
  const toursPayload = lsTours.map(t => {
    const n = _normalizeTur(t);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(String(n.id || ''));
    if (!isUuid) delete n.id;
    // Tarihler dizisini DATE[] formatına cevir
    if (Array.isArray(n.tarihler)) {
      n.tarihler = n.tarihler.map(d => safeDate(d)).filter(Boolean);
    }
    return n;
  }).filter(t => t.kaptan_email && t.tur_adi);
  const tourIdMap = new Map(); // localStorage integer id → Supabase UUID
  for (const ch of chunkArr(toursPayload, CHUNK)) {
    const { data, error } = await _sb.from('turlar').insert(ch).select('id,kaptan_email,tur_adi');
    if (error) { console.warn('[Export] turlar:', error.message); continue; }
    (data || []).forEach((row, i) => {
      const orig = ch[i];
      if (orig) tourIdMap.set(orig.tur_adi + '|' + orig.kaptan_email, row.id);
    });
  }

  // 4. Rezervasyonlar
  setP(48, 'Rezervasyonlar yükleniyor…');
  const lsBks = _ls('db_bookings', []);
  const bkPayload = lsBks.map(b => ({
    id:             String(b.id),
    tur_id:         tourIdMap.get((b.tourTitle || b.tur_adi || '') + '|' + (b.captainEmail || b.kaptan_email || '')) || null,
    tur_adi:        b.tourTitle || b.tur_adi || '',
    kaptan_email:   b.captainEmail  || b.kaptan_email  || '',
    kaptan_adi:     b.captainName   || b.kaptan_adi    || '',
    musteri_email:  b.customerEmail || b.musteri_email || '',
    musteri_adi:    b.customerName  || b.musteri_adi   || '',
    musteri_telefon:b.customerPhone || b.musteri_telefon|| '',
    kisi_sayisi:    +(b.guests || b.kisi_sayisi || 1),
    durum:          b.durum || 'onaylandi',
    toplam_tutar:   safeFlt(b.price || b.toplam_tutar),
    tur_fiyati:     safeFlt(b.fiyat || b.tur_fiyati),
    tur_tarihi:     safeDate(b.tarihISO || b.tur_tarihi),
    tur_saati:      b.saat || b.tur_saati || '09:00',
    odeme_yapildi:  b.odemeYapildi || false,
    odeme_ref:      b.odemeRef || b.odeme_ref || null,
    binis_yapildi:  b.binisYapildi || false,
    kayit_kanali:   b.kayitKanali || b.kayit_kanali || 'web',
    created_at:     safeTS(b.createdAt || b.created_at) || new Date().toISOString(),
  })).filter(b => b.id && b.kaptan_email);
  for (const ch of chunkArr(bkPayload, CHUNK)) {
    const { error } = await _sb.from('rezervasyonlar').insert(ch);
    if (error) console.warn('[Export] rezervasyonlar:', error.message);
  }

  // 5. Yorumlar
  setP(65, 'Yorumlar yükleniyor…');
  const lsReviews = _ls('db_reviews', []).slice(0, 1000);
  const revPayload = lsReviews.map(r => ({
    rezervasyon_id: r.bookingId  || r.rezervasyon_id || null,
    musteri_email:  r.customerEmail || r.musteri_email || '',
    musteri_adi:    r.customerName  || r.musteri_adi   || '',
    kaptan_email:   r.captainEmail  || r.kaptan_email  || '',
    puan:           Math.min(5, Math.max(1, +(r.puan || 4))),
    yorum:          r.yorum || '',
    created_at:     safeTS(r.createdAt || r.created_at) || new Date().toISOString(),
  })).filter(r => r.musteri_email);
  for (const ch of chunkArr(revPayload, CHUNK)) {
    const { error } = await _sb.from('yorumlar').insert(ch);
    if (error) console.warn('[Export] yorumlar:', error.message);
  }

  // 6. Satici ilanlari
  setP(78, 'Satıcı ilanları yükleniyor…');
  const lsVend = _ls('db_vendor_listings', []);
  for (const ch of chunkArr(lsVend, CHUNK)) {
    const payload = ch.map(v => ({
      id:           String(v.id),
      satici_email: v.vendorEmail || '',
      satici_adi:   v.vendorName  || '',
      sahil:        v.sahil || '',
      urun:         v.urun  || '',
      fiyat:        safeFlt(v.fiyat),
      stok:         +(v.stok || 0),
      durum:        v.durum || 'aktif',
      created_at:   safeTS(v.createdAt) || new Date().toISOString(),
    }));
    const { error } = await _sb.from('satici_ilanlari').insert(payload);
    if (error) console.warn('[Export] satici_ilanlari:', error.message);
  }

  // 7. Magaza urunleri
  setP(88, 'Mağaza ürünleri yükleniyor…');
  const lsShop = _ls('db_shop_listings', []);
  for (const ch of chunkArr(lsShop, CHUNK)) {
    const payload = ch.map(s => ({
      id:           String(s.id),
      magaza_email: s.shopEmail  || '',
      magaza_adi:   s.magazaAdi  || '',
      urun:         s.urun  || '',
      fiyat:        safeFlt(s.fiyat),
      stok:         +(s.stok || 0),
      durum:        s.durum || 'aktif',
      created_at:   safeTS(s.createdAt) || new Date().toISOString(),
    }));
    const { error } = await _sb.from('magaza_urunleri').insert(payload);
    if (error) console.warn('[Export] magaza_urunleri:', error.message);
  }

  // 8. Geri sync (Supabase UUID'leri localStorage'a yaz)
  setP(96, 'Veriler senkronize ediliyor…');
  await window._sbSync();
  setP(100, 'Tamamlandı ✓');
};

// ================================================================
// KULLANIM ÖRNEKLERİ
// ================================================================
/*

--- ADMIN PANEL ---

// Tüm kaptanları getir
const kaptanlar = await DB.kaptanlar.list();

// Kaptanı onayla
await DB.kaptanlar.updateDurum(kaptanId, 'aktif');

// Tüm rezervasyonları getir
const rezervasyonlar = await DB.rezervasyonlar.list();

// Dashboard özetini getir
const ozet = await DB.dashboard.getOzet();

--- CAPTAIN APP ---

// Kaptanın turlarını getir
const turlar = await DB.turlar.listByKaptan('mehmet.yilmaz@kaptan.com');

// Yeni tur oluştur (publishTour içinde)
const tur = await DB.turlar.create({ title, fiyat, tarihler, ... });

// Rezervasyonu kabul et
await DB.rezervasyonlar.updateDurum('BK1234', 'onaylandi');

// Mesaj gönder
await DB.mesajlar.send({ kaptanEmail, musteriEmail, mesaj, gonderen: 'kaptan' });

// Gerçek zamanlı mesaj dinle (sadece Supabase modunda)
const unsubscribe = DB.mesajlar.subscribe(email, (msg) => { renderMsg(msg); });

--- CUSTOMER APP ---

// Aktif turları getir
const turlar = await DB.turlar.listAktif({ bolge: 'Bodrum' });

// Yeni üye kaydı
const user = await DB.kullanicilar.create({ name, email, phone });

// Rezervasyon oluştur
const booking = await DB.rezervasyonlar.create({
  tourId, tourTitle, captainEmail, customerEmail,
  guests, tarih, saat, turFiyat
});

// Rezervasyonumu getir
const rezervasyonlarim = await DB.rezervasyonlar.listByMusteri(email);

--- CUSTOMER SITE ---

// Tur ara
const turlar = await DB.turlar.listAktif({ bolge: 'Fethiye', maxFiyat: 2000 });

// Kayıt ol
await DB.kullanicilar.create({ name, email, phone });

*/
