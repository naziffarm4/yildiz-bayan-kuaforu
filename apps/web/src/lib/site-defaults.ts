import type {
  SalonInfo,
  PageTexts,
  BookingRules,
  SpecialDay,
} from "@yildiz/types";

export const SALON_INFO: SalonInfo = {
  ad: "YILDIZ BAYAN KUAFÖRÜ",
  slogan: "Zarif Dokunuşlar, Kusursuz Güzellik",
  adres: "Bağdat Caddesi No: 284/A, Kadıköy / İstanbul",
  telefon: "+90 216 555 00 00",
  whatsapp: "+90 532 999 10 20",
  eposta: "randevu@yildizkuafor.com",
  googleHaritaUrl: "https://maps.google.com/?cid=8333635848754942930",
  instagram: "@yildizbayankuaforu",
  tiktok: "@yildizkuafor",
  facebook: "yildizbayankuaforu",
  calismaSaatleri: {
    haftaIci: "09:00 - 20:00",
    cumartesi: "09:00 - 20:30",
    pazar: "10:00 - 18:00 (Özel Randevulu)",
  },
  varsayilanTamponSureDakika: 15,
};

export const DEFAULT_PAGE_TEXTS: PageTexts = {
  hero: {
    badge: "Kadıköy & Bağdat Caddesi Butik Salon",
    altRozet: "Randevulu Özel Hizmet",
    title: "Zarafet ve Ustalığın",
    titleHighlight: "Kişiselleştirilmiş",
    titleEnd: "Buluşması",
    description:
      "YILDIZ BAYAN KUAFÖRÜ’nde her dokunuş saç dokunuza ve tarzınıza özel tasarlanır. Kusursuz balyaj, tasarım kesim, haute couture gelin saçları ve spa bakımlarıyla sıra beklemeden, huzur dolu lüks bir atmosferde güzelliğinizi taçlandırın.",
    lookbookBadge: "Sonbahar / Kış Koleksiyonu",
    lookbookTitle: "Lüks Saç Mimarisi & Renk Ustalığı",
    butonRandevu: "Online Randevu Oluştur",
    butonGaleri: "Koleksiyonu Keşfet →",
  },
  heroMedia: {
    gorselUrl:
      "https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=1000&q=85",
    rozet: "Haute Coiffure 2026",
    baslik: "Zarif Dalgalar & Sıcak Bal Yansımaları",
    altBaslik: "Yıldız Bayan Kuaförü Özel Koleksiyonu",
  },
  heroFeatures: [
    {
      baslik: "01. Tampon Süreli Seans",
      aciklama: "Her işlem arası 15 dk temizlik ve hazırlık tampon süresi.",
    },
    {
      baslik: "02. Kişisel Stilist",
      aciklama: "Yalnızca alanında uzman kuaförlerle birebir ilgi.",
    },
    {
      baslik: "03. 30 Dk Koruma",
      aciklama: "Talebiniz adınıza 30 dakika boyunca güvenle bloke edilir.",
    },
  ],
  artist: {
    ustRozet: "Kişiye Özel Butik VIP Hizmet",
    anaBaslik: "Usta Ellerden Kusursuz Dokunuş",
    altBaslik:
      "Kalabalık salonların telaşından uzak; sadece size, saçınıza ve zevkinize adanmış özel bir zaman dilimi.",
    etiket: "Haute Coiffure Sanatçısı",
    adSoyad: "Yıldız Bayan Kuaförü",
    unvan: "Master Stilist • Renk & Kesim Tasarımcısı",
    gorselUrl:
      "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=800&q=80",
    gorselRozet: "👑 Kurucu & Master Stilist",
    alintiSoz:
      "YILDIZ BAYAN KUAFÖRÜ’nde her misafirimiz uzman tasarım ekibimiz tarafından, kişiye özel ayrılan zaman diliminde, aceleye getirilmeden ve en yüksek kalitede ağırlanır.",
    biyografi:
      "15 yılı aşkın tecrübe, uluslararası eğitimler ve yüz analitiğine dayalı saç tasarımı. Her seans öncesinde yapılan detaylı saç analizimiz ile ten alt tonunuza en uygun balyaj formülü hazırlanır.",
    vipOzellikler: [
      {
        baslik: "💎 Tek Misafir İlkesi",
        aciklama: "Aynı anda birden fazla müşteriyle bölünmeden tek odak.",
      },
      {
        baslik: "⏱️ Özel Tampon Süre",
        aciklama: "İşlem sonrası hijyen ve sonraki seansa hazırlık.",
      },
      {
        baslik: "🌿 Organik Pigmentler",
        aciklama: "Olaplex ve amonyaksız koruyucu saç formülleri.",
      },
    ],
    butonMetni: "Randevu Oluştur →",
  },
  servicesSection: {
    rozet: "Özel Hizmet Kataloğu",
    baslik: "Ustalıkla Sunulan Hizmetlerimiz",
    aciklama:
      "Tüm işlemlerimizde en kaliteli ürünler ve güncel saç tasarım teknikleri uygulanmaktadır. İstediğiniz hizmeti seçerek tek tıkla online randevunuza ekleyebilirsiniz.",
  },
  reviewsSection: {
    rozet: "Misafir Deneyimleri",
    baslik: "Değerli Misafirlerimizin Yorumları",
    aciklama:
      "Salonumuzda ağırladığımız misafirlerimizin samimi değerlendirmeleri ve Google puanlarımız.",
    googleRating: 4.9,
    googleReviewCount: 14,
    googlePlaceId: "ChIJR_wdvgizzBQR0tN_pKYFp3M",
    googleMapsUrl: "https://maps.google.com/?cid=8333635848754942930",
    googleWriteReviewUrl:
      "https://search.google.com/local/writereview?placeid=ChIJR_wdvgizzBQR0tN_pKYFp3M",
    lastGoogleSyncAt: "2026-10-25T08:30:00.000Z",
  },
  trackerSection: {
    rozet: "Randevu Takip & Sorgulama",
    baslik: "Randevunuzun Durumunu Öğrenin",
    aciklama:
      "Telefon numaranızı girerek onay durumunu, atanan uzmanınızı ve randevu detaylarınızı görüntüleyin.",
    butonMetni: "Sorgula",
  },
  homeCTA: {
    rozet: "Zaman Sizin İçin Akıyor",
    baslik: "Kendinize Hak Ettiğiniz Zarafeti Armağan Edin",
    aciklama:
      "Randevu oluşturduğunuzda seçtiğiniz saat dilimi 30 dakika boyunca adınıza rezerve edilir ve salonumuzda bekleme olmadan, konforlu bir atmosferde ağırlanırsınız.",
    butonMetni: "Hemen Randevu Al",
  },
  about: {
    quote: "Güzellik, aceleye getirilmeyecek kadar kutsal bir sanattır.",
    founder: "Yıldız Bayan Kuaförü — Kurucu & Master Stilist",
    storyTitle:
      "Standart Kuaför Kalıplarının Ötesinde, Sadece Size Ayrılmış Bir Zaman Dilimi",
    storyText:
      "YILDIZ BAYAN KUAFÖRÜ, İstanbul'un kalbi Bağdat Caddesi'nde, kalabalık ve gürültülü salon alışkanlıklarını geride bırakmak amacıyla kuruldu. Amacımız fabrikasyon kesim ve boyalar değil; yüz hatlarınızı, ten alt tonunuzu ve yaşam tarzınızı kusursuzca yansıtan haute couture saç tasarımları üretmektir.",
    manifestoTitle: "Kuruluş & Felsefe",
  },
  contact: {
    welcomeTitle: "Salonumuzda Sizi Ağırlamaktan Mutluluk Duyarız",
    welcomeSubtitle:
      "Bağdat Caddesi'ndeki butik salonumuza kolayca ulaşabilir veya tek tıkla doğrudan randevu oluşturabilirsiniz.",
    transitNote:
      "Göztepe Parkı ve Caddebostan sahiline 5 dakika yürüme mesafesinde. Özel vale ve otopark hizmetimiz mevcuttur.",
  },
};

export const DEFAULT_BOOKING_RULES: BookingRules = {
  tamponSureDakika: 15,
  blokajSuresiDakika: 30,
  sadakatPuaniAktif: true,
  eFaturaAktif: true,
};

export const DEFAULT_SPECIAL_DAYS: SpecialDay[] = [
  {
    id: "f9010000-0000-4000-8000-000000000001",
    tarih: "2026-10-29",
    aciklama: "Cumhuriyet Bayramı Resmi Tatili",
    kapali: true,
  },
  {
    id: "f9010000-0000-4000-8000-000000000002",
    tarih: "2026-12-31",
    aciklama: "Yılbaşı Özel Seansları",
    kapali: false,
    ozelSaatler: "09:00 - 17:00",
  },
];
