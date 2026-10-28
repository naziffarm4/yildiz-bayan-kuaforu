"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageLoader } from "@/components/PageLoader";
import { useAuth } from "@/lib/auth-context";
import { useAppStore } from "@/stores/app-store";
import { Badge, Button } from "@yildiz/ui";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";

export default function GalleryPage() {
  const { user } = useAuth();

  const gallery = useAppStore((s) => s.gallery);
  const commentsByItem = useAppStore((s) => s.commentsByItem);
  const likedIds = useAppStore((s) => s.likedGalleryIds);
  const isRefreshing = useAppStore((s) => s.isRefreshing);
  const pageTexts = useAppStore((s) => s.pageTexts);

  const fetchComments = useAppStore((s) => s.fetchGalleryComments);
  const toggleLike = useAppStore((s) => s.toggleGalleryLike);
  const addComment = useAppStore((s) => s.addGalleryComment);

  const [activeCategory, setActiveCategory] = useState<string>("Tümü");
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);

  // Yorum Form State
  const [commentName, setCommentName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentFeedback, setCommentFeedback] = useState<string | null>(null);

  const selectedPhoto = selectedPhotoId
    ? gallery.find((i) => i.id === selectedPhotoId) ?? null
    : null;

  const currentComments = (selectedPhotoId ? commentsByItem[selectedPhotoId] : undefined) || [];

  // Modal Açıldığında Yorumları ve İsim Ön Doldurmasını Yönet
  useEffect(() => {
    if (selectedPhotoId) {
      fetchComments(selectedPhotoId);
      if (user) {
        setCommentName(`${user.ad} ${user.soyad}`.trim());
      }
      setCommentText("");
      setCommentFeedback(null);
    }
  }, [selectedPhotoId, fetchComments, user]);

  // Beğeni Butonu Aksiyonu
  const handleToggleLike = (itemId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    toggleLike(itemId);
  };

  // Yeni Yorum Gönder
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPhotoId || !commentText.trim()) return;

    const author = commentName.trim() || (user ? `${user.ad} ${user.soyad}`.trim() : "Misafir");
    const content = commentText.trim();
    setIsSubmittingComment(true);
    setCommentFeedback(null);

    const success = await addComment(selectedPhotoId, author, content);
    setIsSubmittingComment(false);

    if (success) {
      setCommentText("");
      setCommentFeedback("Yorumunuz paylaşıldı. Teşekkür ederiz! ✨");
      setTimeout(() => setCommentFeedback(null), 4000);
    } else {
      setCommentFeedback("Yorum iletilirken bir hata oluştu.");
    }
  };

  const galleryTexts = pageTexts.gallery;
  const badgeText = galleryTexts?.rozet || "Lookbook & İlham Koleksiyonu";
  const titleText = galleryTexts?.baslik || "Sanatın Saçtaki İmzası";
  const descText =
    galleryTexts?.aciklama ||
    "Yıldız Bayan Kuaförü salonumuzda hayata geçirilen en seçkin saç tasarımları, doğal balyaj yansımaları ve haute couture gelin stilleri.";

  // Canlı galeriden dinamik kategori listesi
  const dynamicCategories = Array.from(
    new Set(gallery.map((item) => item.kategori).filter(Boolean)),
  );
  const categories = ["Tümü", ...dynamicCategories];

  const filteredGallery =
    activeCategory === "Tümü"
      ? gallery
      : gallery.filter((item) => item.kategori === activeCategory);

  if (isRefreshing && gallery.length === 0) {
    return <PageLoader variant="modal" message="Galeri yükleniyor..." />;
  }

  return (
    <div className="min-h-screen flex flex-col max-w-full overflow-x-clip bg-bg-primary text-text-primary pb-16 md:pb-0">
      <Navbar />

      <main className="flex-1">
        {/* Editorial Üst Başlık (CMS Destekli) */}
        <section className="py-16 sm:py-20 bg-gradient-to-b from-bg-secondary to-bg-primary border-b border-border-main text-center px-4">
          <div className="max-w-4xl mx-auto space-y-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary block">
              {badgeText}
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-dark">
              {titleText}
            </h1>
            <p className="text-sm sm:text-base text-text-secondary max-w-2xl mx-auto leading-relaxed">
              {descText}
            </p>
          </div>
        </section>

        {/* Kategori Filtreleri */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-wrap items-center justify-center gap-2.5 pb-8 border-b border-border-main/80">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                    isActive
                      ? "bg-primary text-white shadow-sm"
                      : "bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-border-main"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Editorial Galeri Izgarası */}
          {filteredGallery.length === 0 ? (
            <div className="py-20 text-center text-text-secondary space-y-2">
              <span className="text-4xl block">✨</span>
              <p className="font-serif text-lg font-bold text-text-primary">
                Bu kategoride henüz çalışma bulunmuyor.
              </p>
              <p className="text-xs text-text-secondary">
                Lütfen diğer kategorilerdeki saç tasarımlarımızı inceleyiniz.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pt-10">
              {filteredGallery.map((item) => {
                const isLiked = likedIds.includes(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedPhotoId(item.id)}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border-main bg-bg-secondary shadow-xs hover:shadow-xl hover:border-primary hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                  >
                    {/* Görsel / Video Önizlemesi - Progressive Lazy Loading */}
                    <div className="relative h-96 w-full overflow-hidden bg-bg-primary">
                      <Image
                        src={item.kapakUrl || item.gorselUrl}
                        alt={item.baslik}
                        fill
                        loading="lazy"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition-all duration-700 group-hover:scale-105"
                      />

                      {/* Video Rozeti */}
                      {item.medyaTuru === "video" && (
                        <div className="absolute top-3.5 right-3.5 z-10">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-black/75 text-primary border border-primary/40 shadow-xs backdrop-blur-xs">
                            <span>▶</span>
                            <span>Video</span>
                          </span>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6 text-white">
                        <span className="text-xs font-semibold text-primary tracking-wider uppercase mb-1">
                          {item.kategori}
                        </span>
                        <span className="font-serif text-lg font-bold">
                          {item.baslik}
                        </span>
                        {item.medyaTuru === "video" && (
                          <span className="text-xs text-primary mt-1 flex items-center gap-1 font-semibold">
                            <span>▶ Videoyu Oynat</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Kart Alt Bilgisi: Başlık, Stilist, Beğeni & Yorum Aksiyonları */}
                    <div className="p-5 bg-bg-primary border-t border-border-main/60">
                      <div className="flex items-center justify-between text-xs text-text-secondary mb-2">
                        <Badge variant="gray">{item.kategori}</Badge>
                        <div className="flex items-center gap-3">
                          {/* İnteraktif Kalp Butonu */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleLike(item.id, e)}
                            className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full transition-all ${
                              isLiked
                                ? "text-red-600 bg-red-50 border border-red-200"
                                : "text-text-secondary hover:text-red-500 bg-bg-secondary border border-border-main/60"
                            }`}
                            title={isLiked ? "Beğenmekten Vazgeç" : "Bu Tasarımı Beğen"}
                          >
                            <span>{isLiked ? "❤️" : "🤍"}</span>
                            <span>{item.begeniSayisi}</span>
                          </button>

                          {/* Yorum Sayacı */}
                          <span className="flex items-center gap-1 text-xs text-text-secondary">
                            <span>💬</span>
                            <span>{item.yorumSayisi ?? 0}</span>
                          </span>
                        </div>
                      </div>

                      <h3 className="font-serif text-base font-bold text-dark group-hover:text-primary transition-colors truncate">
                        {item.baslik}
                      </h3>
                      <p className="text-xs text-text-secondary mt-1">
                        Stilist: <strong className="text-text-primary">{item.stilist || "Yıldız Bayan Kuaförü"}</strong>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Randevu Yönlendirme Bannerı */}
          <div className="mt-20 p-8 sm:p-12 rounded-2xl bg-gradient-to-r from-bg-secondary via-bg-primary to-bg-secondary border border-border-main text-center space-y-4">
            <span className="text-[11px] uppercase font-bold tracking-[0.25em] text-primary block">
              Kişiye Özel Tasarım
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-dark">
              Beğendiğiniz Tasarımı Saçlarınızda Yaşatın
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary max-w-xl mx-auto leading-relaxed">
              Uzman stilistlerimizle yüz şeklinize ve saç yapınıza en uygun renk ve kesim modelini birlikte belirleyelim.
            </p>
            <div className="pt-2">
              <Link href="/randevu">
                <Button variant="primary" size="lg" className="px-8 shadow-sm bg-primary hover:bg-primary-hover text-white border-0">
                  Şimdi Randevu Al
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* LIGHTBOX MODAL */}
      {selectedPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
          onClick={() => setSelectedPhotoId(null)}
        >
          <div
            className="relative max-w-5xl w-full bg-bg-primary rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sol Medya Alanı */}
            <div className="relative md:w-3/5 h-72 md:h-auto min-h-[360px] bg-black flex items-center justify-center overflow-hidden">
              {selectedPhoto.medyaTuru === "video" ? (
                <video
                  src={selectedPhoto.gorselUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  poster={selectedPhoto.kapakUrl}
                  className="max-h-[85vh] w-full rounded-xl object-contain bg-black"
                />
              ) : (
                <Image
                  src={selectedPhoto.gorselUrl}
                  alt={selectedPhoto.baslik}
                  fill
                  className="object-cover"
                  priority
                />
              )}
            </div>

            {/* Sağ Bilgi & Yorum Paneli */}
            <div className="p-5 sm:p-7 md:w-2/5 flex flex-col justify-between overflow-y-auto space-y-5 bg-bg-primary">
              <div>
                {/* Üst Kategori & Kapat Butonu */}
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="gold">{selectedPhoto.kategori}</Badge>
                  <button
                    type="button"
                    onClick={() => setSelectedPhotoId(null)}
                    className="p-1.5 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-secondary text-lg font-bold"
                  >
                    ✕
                  </button>
                </div>

                {/* Başlık ve Açıklama */}
                <h3 className="font-serif text-2xl font-bold text-dark leading-snug">
                  {selectedPhoto.baslik}
                </h3>

                {selectedPhoto.aciklama && (
                  <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                    {selectedPhoto.aciklama}
                  </p>
                )}

                {/* Stilist & Lokasyon Bilgi Satırı */}
                <div className="mt-4 pt-3 border-t border-border-main/80 flex items-center justify-between text-xs text-text-secondary">
                  <span>
                    Stilist: <strong className="text-text-primary">{selectedPhoto.stilist || "Yıldız Bayan Kuaförü"}</strong>
                  </span>
                  <span>Bağdat Caddesi</span>
                </div>

                {/* İnteraktif Beğeni Çubuğu */}
                <div className="mt-4 p-3 rounded-xl bg-bg-secondary border border-border-main flex items-center justify-between">
                  <span className="text-xs text-text-secondary font-medium">
                    Bu çalışmayı beğendiniz mi?
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleLike(selectedPhoto.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-2xs ${
                      likedIds.includes(selectedPhoto.id)
                        ? "bg-red-50 text-red-600 border border-red-200"
                        : "bg-bg-primary text-text-primary border border-border-main hover:border-red-200"
                    }`}
                  >
                    <span>{likedIds.includes(selectedPhoto.id) ? "❤️" : "🤍"}</span>
                    <span>{likedIds.includes(selectedPhoto.id) ? "Beğendiniz" : "Beğen"}</span>
                    <span className="text-[11px] opacity-75">({selectedPhoto.begeniSayisi})</span>
                  </button>
                </div>

                {/* Yorumlar Bölümü */}
                <div className="mt-6 pt-4 border-t border-border-main space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif text-sm font-bold text-dark flex items-center gap-1.5">
                      <span>💬 Misafir Yorumları</span>
                      <span className="text-xs text-text-secondary font-normal font-sans">
                        ({currentComments.length})
                      </span>
                    </h4>
                  </div>

                  {/* Yorumlar Listesi */}
                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                    {currentComments.length === 0 ? (
                      <div className="text-center py-4 px-3 rounded-xl bg-bg-secondary text-xs text-text-secondary italic">
                        Henüz yorum yapılmamış. İlk değerlendirmeyi siz bırakın!
                      </div>
                    ) : (
                      currentComments.map((c) => (
                        <div
                          key={c.id}
                          className="p-3 rounded-xl bg-bg-secondary border border-border-main/70 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between font-semibold text-text-primary">
                            <span className="font-serif">{c.musteri_adi}</span>
                            <span className="text-[10px] text-text-secondary font-normal font-sans">
                              {new Date(c.olusturulma_tarihi).toLocaleDateString("tr-TR", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          </div>
                          <p className="text-text-secondary leading-relaxed">{c.yorum}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Yorum Yazma Formu */}
                  <form onSubmit={handleCommentSubmit} className="pt-2 space-y-2">
                    <input
                      type="text"
                      value={commentName}
                      onChange={(e) => setCommentName(e.target.value)}
                      placeholder="Adınız Soyadınız"
                      className="w-full px-3 py-1.5 rounded-lg border border-border-main bg-bg-secondary text-xs text-text-primary outline-none focus:ring-1 focus:ring-primary"
                    />
                    <textarea
                      rows={2}
                      required
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Bu saç tasarımı hakkında düşünceleriniz..."
                      className="w-full px-3 py-1.5 rounded-lg border border-border-main bg-bg-secondary text-xs text-text-primary outline-none focus:ring-1 focus:ring-primary resize-none"
                    />

                    {commentFeedback && (
                      <div className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 animate-fadeIn">
                        {commentFeedback}
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={isSubmittingComment || !commentText.trim()}
                        className="text-xs font-semibold px-3 py-1"
                      >
                        {isSubmittingComment ? "Gönderiliyor..." : "Yorum Paylaş →"}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Alt Randevu Butonu */}
              <div className="pt-4 border-t border-border">
                <Link href="/randevu" className="block w-full">
                  <Button variant="primary" size="md" className="w-full text-xs font-bold">
                    Bu Tasarım İçin Randevu Al
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
