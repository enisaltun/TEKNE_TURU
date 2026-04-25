/**
 * tur-basliklari-config.js
 * ─────────────────────────
 * Kaptan wizard'ında görünecek tur başlıkları ve açıklamaları.
 *
 * DÜZENLEME KILAVUZU
 * ──────────────────
 * • Yeni başlık eklemek  → ilgili kategorinin dizisine { baslik:"...", aciklama:"..." } satırı ekle
 * • Başlık silmek        → o satırı sil
 * • Açıklama değiştirmek → aciklama kısmını düzenle
 * • Yeni kategori ekle   → yeni bir anahtar bloku ekle (captain-app.html'deki kategori adıyla eşleşmeli)
 *
 * Kural: "tur" kelimesi başlık veya açıklamada kullanılmaz.
 */

const TUR_BASLIKLARI = {

  "Balik Avi": [
    {
      baslik: "İstavrit Avı",
      aciklama: "Mis gibi sabah deniz havasında, teknenin kıçında oltanızı sallarken etrafınız İstavritlerle dolacak. Kolay yakalanır, şakır şakır pişirilir — balık avına ilk adım için ideal bir seçim."
    },
    {
      baslik: "Çinekop Avı",
      aciklama: "Çinekop mevsiminde denizin rengi değişir, heyecan zirveye çıkar. Kıyı şeridinde yavaş dreg ya da minnow takımıyla vuruşları hissedecek, günü lüfer ailesinin en canlı ferdiyle tamamlayacaksınız."
    },
    {
      baslik: "Kalamar Avı",
      aciklama: "Alacakaranlık ve gece saatlerinde kalamarlar yüzeye çıkar; egele takımıyla her çekiş bir sürpriz. Hem avlanma tekniği hem deniz manzarası açısından benzersiz bir deneyim."
    },
    {
      baslik: "Karışık Av",
      aciklama: "Ne çıkarsa kâr! Kuyruğumuzda oltanın ucunda farklı türler bekliyor. İstavritten izmarite, kolyozdan istavroza kadar mevsimsel sürprizlerle dolu bir gün."
    },
    {
      baslik: "Mercan Avı",
      aciklama: "Derin kovuklarda, kayalıkların gölgesinde saklanan mercanları bulmak hem sabır hem beceri ister. Bu güzel balığı iplik olta ve küçük yem kombinasyonuyla yakaladığınızda manzara unutulmaz olacak."
    },
    {
      baslik: "İspari Avı",
      aciklama: "İspari, Ege ve Akdeniz kıyılarının gözbebeği — zarif görünüşü ve lezzetli etiyle sofralarımızın yıldızı. Küçük kaya diplerinde kuşluk vakti onları bulmak, gerçek bir balıkçı ritüeli."
    },
    {
      baslik: "Sardalya Avı",
      aciklama: "Sardalya sürülerini bulmak sanattır; bulduktan sonrası şölen. Olta yerine ağ ya da minnow takımıyla kalabalık ağıza geldiğinde tekne dolar, herkes güler."
    },
    {
      baslik: "Palamut Avı",
      aciklama: "Sonbaharın müjdecisi palamut, Boğaz'dan Ege'ye göç ederken olta başında bekleyenleri ödüllendirir. Hızlı yem takımı, sert vuruş, adrenalin dolu kavga — palamutun ritmi başka."
    },
    {
      baslik: "Lüfer Avı",
      aciklama: "Lüfer; deniz ve sonbahar demektir. Sürü halinde avcı olan bu balık, yüzeyin hemen altında avını kıstırdığında etraf köpük içinde kalır. O kavgaya ortak olmak için fırsat az, heyecan büyük."
    },
    {
      baslik: "Lagos Avı",
      aciklama: "Lagos — Akdeniz'in en güçlü dip balığı. Yakaladığınızda olta direğini eğer, eliniz karıncalanır. Derin sular, kalın misina, güçlü irade: Lagos avı bir güç sınavı."
    },
    {
      baslik: "Sinarit Avı",
      aciklama: "İri ve güçlü yapısıyla sinarit, kaptan tecrübesini ve oltacı sabrını sınar. Derin sularda gezerek avlanan bu tür için hem teknik bilgi hem zamanlama şarttır."
    },
    {
      baslik: "Kolyoz Avı",
      aciklama: "Makrel ailesinin hızlı koşucusu kolyoz, açık sularda takım avının favorisi. Sürü bulunduğunda olta başında bekleme süresi kısalır, elde tutma heyecanı büyür."
    },
    {
      baslik: "Çupra Avı",
      aciklama: "Çupra balığı hem zekâsı hem lezzetiyle öne çıkan, avlanması keyifli bir tür. Kayalık dipte sabırla beklemek ve doğru anda hamle yapmak başarının sırrı."
    },
    {
      baslik: "Orfoz Avı",
      aciklama: "Orfoz, sığınak kıyılarda avlanan sert ve gözü pek bir balık. Kayalık, derin ve az bozulmuş sularda yaşar — bulduğunuzda kapışmanın tadı başkadır."
    },
    {
      baslik: "Uzun Olta Avı",
      aciklama: "Tekneden çok sayıda olta sarkıtmak, farklı derinlik katmanlarını taramak... Uzun olta yöntemiyle birden fazla türü aynı anda avlama şansı sunan verimli ve eğlenceli bir teknik."
    },
    {
      baslik: "Çapari Avı",
      aciklama: "Çapari takımı, sürü halinde gezen küçük balıklarda mucizeler yaratır. Otuzdan fazla iğnesiyle tek bir çekişte tekneyi doldurmak mümkün — en dinamik balıkçılık deneyimi."
    },
    {
      baslik: "Kaşık Avı",
      aciklama: "Kaşık yemi, parlak yüzeyiyle yırtıcı balıkları kendine çeker. Lüfer, palamut, kolyoz... Her çekişte ne geleceğini bilmemek, kaşık avının büyüsü."
    }
  ],

  "Tekne Gezisi": [
    {
      baslik: "Mis Gibi Deniz Havası",
      aciklama: "Sadece denize çıkmak, ufka bakmak, tuzlu rüzgârı derin derin içine çekmek... Bazen bir amaca gerek yok. Tekne yavaşça sallanırken zihniniz boşalır, bedeniniz dinlenir."
    },
    {
      baslik: "Koy Koy Mavi Yolculuk",
      aciklama: "Bir koydan diğerine süzülürken her durakta farklı bir manzara, farklı bir sessizlik. Sakin sularda demir atıp dinlenmek, yüzmek ya da sadece seyretmek — günü siz belirlersiniz."
    },
    {
      baslik: "Masmavi Keşif",
      aciklama: "Haritada yer almayan girintileri, gizli koyları, herkese kapalı kıyı köşelerini bulmak için. Tekne sizin keşif aracınız, rotayı merak çizecek."
    },
    {
      baslik: "Körfez Rotası",
      aciklama: "Sabah erken körfeze vurur, akşam güneşi sönerken geri dönersiniz. Aradaki saatler size ait — yüzün, oturun, sohbet edin; deniz zamanı fark yaratır."
    },
    {
      baslik: "Adalar Arası Macera",
      aciklama: "Adadan adaya uzanan bir güzergâh, her durakta farklı bir atmosfer. Küçük iskele kahveleri, kıyıya yanaşan tekneler ve her adanın kendine özgü hikâyesi sizi bekliyor."
    },
    {
      baslik: "Lagun Saatleri",
      aciklama: "Lagünlerin sakin yüzeyinde sürüklenmek başka dünya. Rüzgârsız, derin ve turkuaz sularda tekne sanki havada asılı kalıyor — bu saatleri bir kez yaşayanlar tekrar ister."
    },
    {
      baslik: "Kıyı Keşfi",
      aciklama: "Kara yolunun asla ulaşamadığı kıyıları keşfetmek için denizden yaklaşmak şart. Falezlerin dibindeki mağaralar, kara taşların arasındaki geçitler — yalnızca denizden erişilecek yerler."
    }
  ],

  "Yuzme": [
    {
      baslik: "Yüzmeye Gidelim",
      aciklama: "Sabah hazır, deniz temiz, koy sakin. Merdivenden inin, suya dalmadan önce bir derin nefes alın — güne bu kadar güzel başlamanın başka yolu yok."
    },
    {
      baslik: "Kristal Sularda Serinlik",
      aciklama: "Sığ, berrak, dip taşları sayılır cinsten bir koy. Gözlük takın, maske takın ya da sadece yüzün — su bu kadar şeffaf olunca yüzmek bir zevke dönüşür."
    },
    {
      baslik: "Koylarda Özgür",
      aciklama: "Kalabalıktan uzak, plajsız, yalnızca sizin teknenizin demir attığı bir koy. Suyun içi de dışı da sizin — gün boyunca yüzün, dalın, güneşin altında kuruyun."
    },
    {
      baslik: "Yelken Altında Serinlik",
      aciklama: "Seyir halindeyken bile yüzmek mümkün — tekne yavaşlar, deniz çağırır. Serin sulara atlayıp güneşin altında kurumak, en sade tatil felsefesi."
    }
  ],

  "Ozel Etkinlik": [
    {
      baslik: "Özel Gün",
      aciklama: "Doğum günü, yıl dönümü ya da sadece 'bugün seninle kutlamak istedim' demek için. Denizin ortasında özel bir an yaratmak istiyorsanız, tekne en iyi sahne."
    },
    {
      baslik: "Denizde Sürpriz",
      aciklama: "Sürpriz planlamak istiyorsunuz ama nerede yapacağınızı bilmiyorsunuz. Deniz, tüm sürprizlerin en güzel arka planı. Biz tekneyi hazırlarız, siz anı yaratırsınız."
    },
    {
      baslik: "Küçük Buluşma",
      aciklama: "Yakın arkadaşlar, sessiz bir koy, güzel bir öğle — büyük organizasyona gerek yok, asıl olan birliktelik. Küçük grupta geçirilen bu saatler çok değerli."
    },
    {
      baslik: "Romantik Deniz Günü",
      aciklama: "Sadece ikiniz, sakin bir koy, belki bir güneş batımı. Sözler zaman zaman yetersiz kalır; bu saatler hiç kalır mı bilinmez."
    },
    {
      baslik: "Denizde Özel Kiralama",
      aciklama: "Bir etkinlik için teknenin tamamını kiralamak istiyorsunuz. Davetlilerinizi, programınızı ve ihtiyaçlarınızı söyleyin; gerisini biz ayarlayalım."
    }
  ],

  "Kurumsal": [
    {
      baslik: "Kurumsal Buluşma",
      aciklama: "Ofis dışında buluşmak, farklı konuşturuyor. Denizin ortasında bir toplantı ya da gayri resmi buluşma, ekip dinamiğini beklenmedik şekilde canlandırır."
    },
    {
      baslik: "Takım Ruhu Denizde",
      aciklama: "Birlikte bir tekneye binmek, demir atmak, belki balık tutmak — basit eylemler güçlü bağlar kurar. Ekip aktivitesi için deniz, en etkili ortamlardan biri."
    },
    {
      baslik: "İş Dünyası Buluşması",
      aciklama: "Müşteri ağırlama ya da iş ortağıyla samimi bir zaman geçirmek için. Deniz, resmi ortamların yarattığı mesafeyi eritir; anlaşmalar bazen en güzel sahilde olur."
    },
    {
      baslik: "Denizde Şirket Günü",
      aciklama: "Şirket günü için farklı bir seçenek: deniz. Tekne kiralayın, ekibinizi toplayın — hem eğlenceli hem hatırda kalıcı bir etkinlik için doğru adres."
    }
  ],

  "Gun Batimi": [
    {
      baslik: "Gün Batımı Seyri",
      aciklama: "Güneşin ufukla buluştuğu o birkaç dakika — renk katmanları değişirken gökyüzü turuncu, pembe, mor... Bu gösteriye en iyi koltuk teknede."
    },
    {
      baslik: "Altın Saat Denizde",
      aciklama: "Fotoğrafçılar 'altın saat' der; ışığın en yumuşak, en sıcak olduğu o kısa aralık. Denizin üzerindeyken o ışık hem size hem suya vurur — sahne muhteşemdir."
    },
    {
      baslik: "Alaca Karanlıkta Seyir",
      aciklama: "Güneş battıktan sonra gökyüzü hâlâ aydınlık, ama artık yıldızlar belirmeye başlamış. Bu geçiş anını denizde yakalamak, farklı bir derinlik hissi verir."
    },
    {
      baslik: "Akşamüstü Dinginliği",
      aciklama: "Öğleden sonra 4'te çıkıp akşamın ilk karanlığında dönmek. Gün bitmiş, yorgunluk henüz çökmemiş — bu saatlerde deniz en sakin, en güzel halinde."
    }
  ]

};
