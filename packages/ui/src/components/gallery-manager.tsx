import React, { useState } from "react";
import type { GalleryItem } from "@yildiz/types";
import { Button } from "./button";
import { Badge } from "./badge";
import { Card } from "./card";

export interface GalleryManagerProps {
  gallery: GalleryItem[];
  onAddPhoto: (photo: Omit<GalleryItem, "id" | "begeniSayisi">) => void;
  onDeletePhoto: (id: string) => void;
  onUpdatePhoto?: (id: string, updates: Partial<GalleryItem>) => Promise<void> | void;
}

const CATEGORIES = [
  "Tümü",
  "Saç Tasarım",
  "Renklendirme & Balyaj",
  "Gelin & Topuz",
  "Nail Art & Spa",
];

const DEFAULT_FORM_CATEGORIES = [
  "Saç Tasarım",
  "Renklendirme & Balyaj",
  "Gelin & Topuz",
  "Nail Art & Spa",
];

export const GalleryManager: React.FC<GalleryManagerProps> = ({
  gallery,
  onAddPhoto,
  onDeletePhoto,
  onUpdatePhoto,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>("Tümü");
  const [isAdding, setIsAdding] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Renklendirme & Balyaj");
  const [imageUrl, setImageUrl] = useState("");
  const [stylist, setStylist] = useState("Yıldız Bayan Kuaförü");
  const [description, setDescription] = useState("");
  const [medyaTuru, setMedyaTuru] = useState<"image" | "video">("image");
  const [kapakUrl, setKapakUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Düzenleme (Update) Modalı State
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("Renklendirme & Balyaj");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editStylist, setEditStylist] = useState("Yıldız Bayan Kuaförü");
  const [editDescription, setEditDescription] = useState("");
  const [editMedyaTuru, setEditMedyaTuru] = useState<"image" | "video">("image");
  const [editKapakUrl, setEditKapakUrl] = useState("");
  const [editSira, setEditSira] = useState<number>(0);
  const [isEditUploading, setIsEditUploading] = useState(false);
  const [editUploadError, setEditUploadError] = useState<string | null>(null);

  const openEditModal = (item: GalleryItem) => {
    setEditingItem(item);
    setEditTitle(item.baslik);
    setEditCategory(item.kategori);
    setEditImageUrl(item.gorselUrl);
    setEditStylist(item.stilist || "Yıldız Bayan Kuaförü");
    setEditDescription(item.aciklama || "");
    setEditMedyaTuru(item.medyaTuru || "image");
    setEditKapakUrl(item.kapakUrl || "");
    setEditSira(item.sira ?? 0);
    setEditUploadError(null);
  };

  const handleEditFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsEditUploading(true);
    setEditUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "gallery");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Dosya yüklenemedi.");

      if (data.url) {
        setEditImageUrl(data.url);
        if (data.medyaTuru) setEditMedyaTuru(data.medyaTuru);
      }
    } catch (err: unknown) {
      setEditUploadError(err instanceof Error ? err.message : "Yükleme hatası.");
    } finally {
      setIsEditUploading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editTitle.trim() || !editImageUrl.trim()) return;

    const updates: Partial<GalleryItem> = {
      baslik: editTitle.trim(),
      kategori: editCategory,
      gorselUrl: editImageUrl.trim(),
      stilist: editStylist.trim() || "Yıldız Bayan Kuaförü",
      aciklama: editDescription.trim() || undefined,
      medyaTuru: editMedyaTuru,
      kapakUrl: editKapakUrl.trim() || undefined,
      sira: Number(editSira ?? 0),
    };

    if (onUpdatePhoto) {
      await onUpdatePhoto(editingItem.id, updates);
    }

    setEditingItem(null);
  };

  // Yorum Moderasyon Modalı State
  const [moderatingItem, setModeratingItem] = useState<GalleryItem | null>(null);
  const [itemComments, setItemComments] = useState<
    Array<{ id: string; musteri_adi: string; yorum: string; olusturulma_tarihi: string }>
  >([]);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [commentDeleteStatus, setCommentDeleteStatus] = useState<string | null>(null);

  const openModerationModal = async (item: GalleryItem) => {
    setModeratingItem(item);
    setIsCommentsLoading(true);
    setItemComments([]);
    setCommentDeleteStatus(null);

    try {
      const res = await fetch(`/api/admin/gallery/comments?galleryId=${encodeURIComponent(item.id)}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          setItemComments(json.data);
        }
      }
    } catch (err: unknown) {
      console.warn("Galeri yorumları yüklenemedi:", err);
    } finally {
      setIsCommentsLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/admin/gallery/comments?id=${encodeURIComponent(commentId)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setItemComments((prev) => prev.filter((c) => c.id !== commentId));
        if (moderatingItem) {
          const newYorumSayisi = Math.max(0, (moderatingItem.yorumSayisi || 0) - 1);
          setModeratingItem({ ...moderatingItem, yorumSayisi: newYorumSayisi });
          if (onUpdatePhoto) {
            onUpdatePhoto(moderatingItem.id, { yorumSayisi: newYorumSayisi });
          }
        }
        setCommentDeleteStatus("Yorum başarıyla silindi ✅");
        setTimeout(() => setCommentDeleteStatus(null), 3000);
      }
    } catch {
      setCommentDeleteStatus("Yorum silinirken hata oluştu.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "gallery");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Dosya yüklenemedi.");
      }

      if (data.url) {
        setImageUrl(data.url);
        if (data.medyaTuru) {
          setMedyaTuru(data.medyaTuru);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Yükleme hatası oluştu.";
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const filteredItems =
    activeCategory === "Tümü"
      ? gallery
      : gallery.filter((item) => item.kategori === activeCategory);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) return;

    onAddPhoto({
      baslik: title.trim(),
      kategori: category,
      gorselUrl: imageUrl.trim(),
      stilist: stylist.trim() || "Yıldız Bayan Kuaförü",
      aciklama: description.trim() || undefined,
      medyaTuru,
      kapakUrl: kapakUrl.trim() || undefined,
    });

    // Reset Form
    setTitle("");
    setImageUrl("");
    setDescription("");
    setMedyaTuru("image");
    setKapakUrl("");
    setUploadError(null);
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      {/* Üst Başlık & Aksiyon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-accent-gold block">
            Görsel &amp; CMS Portalı
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-text-primary">
            Galeri &amp; Lookbook Yöneticisi
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Müşteri /galeri sayfası ve ana sayfa lookbook vitrininde yayınlanan fotoğrafları yönetin.
          </p>
        </div>

        <Button
          variant={isAdding ? "outline" : "primary"}
          onClick={() => setIsAdding(!isAdding)}
          className="text-xs shrink-0 font-bold"
        >
          {isAdding ? "✕ Formu Kapat" : "+ Yeni Fotoğraf Ekle"}
        </Button>
      </div>

      {/* Yeni Fotoğraf Ekleme Formu */}
      {isAdding && (
        <Card className="p-6 bg-white border-accent-gold/40 shadow-sm animate-fadeIn">
          <div className="mb-4 pb-3 border-b border-border/70 flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-text-primary">
              + Yeni Lookbook / Galeri Fotoğrafı
            </h3>
            <span className="text-xs text-text-secondary">
              Eklenen görsel anında canlı yayına alınır
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Fotoğraf / Video Başlığı *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn: Sıcak Bal Balyaj & Editorial Dalgalar"
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Kategori *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                >
                  {DEFAULT_FORM_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Medya Türü
                </label>
                <select
                  value={medyaTuru}
                  onChange={(e) => setMedyaTuru(e.target.value as "image" | "video")}
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                >
                  <option value="image">Fotoğraf (Image)</option>
                  <option value="video">Video (MP4 / WebM)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Görsel veya Video Yükle (Otomatik Storage)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="w-full text-xs text-text-secondary file:mr-2 file:py-1.5 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-accent-gold/15 file:text-accent-gold hover:file:bg-accent-gold/25 cursor-pointer"
                />
                {isUploading && (
                  <span className="text-[11px] text-accent-gold mt-1 block font-medium animate-pulse">
                    Medya yükleniyor, lütfen bekleyiniz...
                  </span>
                )}
                {uploadError && (
                  <span className="text-[11px] text-red-600 mt-1 block">
                    {uploadError}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Medya URL (Unsplash / Storage / CDN) *
                </label>
                <input
                  type="text"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... veya dosya yükleyiniz"
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Uygulayan Stilist / Uzman
                </label>
                <input
                  type="text"
                  value={stylist}
                  onChange={(e) => setStylist(e.target.value)}
                  placeholder="Örn: Yıldız Bayan Kuaförü, Uzman Stilist"
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>

              {medyaTuru === "video" && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Video Kapak Resmi (Poster URL - Opsiyonel)
                  </label>
                  <input
                    type="text"
                    value={kapakUrl}
                    onChange={(e) => setKapakUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... (Video yüklenmeden önceki kapak)"
                    className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Kısa Açıklama &amp; Uygulama Notu (Lightbox Detayı)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Örn: Olaplex bağ koruyucu altında amonyaksız sıcak bal tonlama..."
                className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
              />
            </div>

            {imageUrl.trim() && (
              <div className="p-3 rounded-lg bg-bg-secondary border border-border flex items-center gap-4">
                <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-200 shrink-0 border border-border">
                  <img
                    src={imageUrl.trim()}
                    alt="Önizleme"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=300&q=80";
                    }}
                  />
                </div>
                <div className="text-xs">
                  <span className="font-bold block text-text-primary">Görsel Önizlemesi</span>
                  <span className="text-text-secondary text-[11px] truncate max-w-xs block">
                    {imageUrl}
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAdding(false)}
              >
                İptal
              </Button>
              <Button type="submit" variant="primary" size="sm" className="font-bold">
                ✓ Fotoğrafı Yayınla
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Kategori Filtre Butonları */}
      <div className="flex flex-wrap items-center gap-2">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          const count =
            cat === "Tümü"
              ? gallery.length
              : gallery.filter((i) => i.kategori === cat).length;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                isActive
                  ? "bg-text-primary text-white shadow-xs"
                  : "bg-white border border-border text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
              }`}
            >
              <span>{cat}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? "bg-accent-gold text-white" : "bg-bg-secondary text-text-secondary"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Galeri Izgarası */}
      {filteredItems.length === 0 ? (
        <Card className="p-12 text-center bg-white border-dashed border-2 border-border">
          <span className="text-3xl block mb-2">📸</span>
          <h4 className="font-serif text-base font-bold text-text-primary">
            Bu kategoride henüz fotoğraf yok
          </h4>
          <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto">
            Yukarıdaki &ldquo;+ Yeni Fotoğraf Ekle&rdquo; butonunu kullanarak yeni bir lookbook tasarımı ekleyebilirsiniz.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className="overflow-hidden bg-white border-border shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* Görsel Alanı */}
                <div className="relative h-56 w-full bg-bg-secondary overflow-hidden group">
                  <img
                    src={item.gorselUrl}
                    alt={item.baslik}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <Badge variant="gold">{item.kategori}</Badge>
                    {item.medyaTuru === "video" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/75 text-accent-gold border border-accent-gold/40">
                        ▶ Video
                      </span>
                    )}
                  </div>
                  <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-2">
                    <span>❤️ {item.begeniSayisi || 0}</span>
                    <span>💬 {item.yorumSayisi || 0}</span>
                  </div>
                </div>

                {/* Bilgi Alanı */}
                <div className="p-4 space-y-1.5">
                  <h4 className="font-serif text-sm font-bold text-text-primary line-clamp-1">
                    {item.baslik}
                  </h4>
                  <p className="text-[11px] text-text-secondary line-clamp-2">
                    {item.aciklama || "Açıklama belirtilmedi."}
                  </p>
                  <div className="pt-1 text-[11px] text-text-secondary flex justify-between items-center">
                    <span>
                      Stilist: <strong className="text-text-primary">{item.stilist}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Alt Butonlar: Yorumları Gör, Düzenle & Sil */}
              <div className="p-3 bg-bg-secondary border-t border-border flex items-center justify-between gap-1.5">
                <button
                  type="button"
                  onClick={() => openModerationModal(item)}
                  className="text-xs font-semibold px-2.5 py-1 rounded bg-white border border-border text-text-primary hover:border-accent-gold hover:text-accent-gold transition-colors flex items-center gap-1 shadow-2xs"
                >
                  <span>💬 Yorumlar</span>
                  <span className="text-[10px] text-accent-gold font-bold">({item.yorumSayisi || 0})</span>
                </button>

                <div className="flex items-center gap-1.5">
                  {onUpdatePhoto && (
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="text-xs font-semibold px-2.5 py-1 rounded bg-white border border-border text-text-primary hover:border-accent-gold hover:text-accent-gold transition-colors flex items-center gap-1 shadow-2xs"
                      title="Çalışmayı Düzenle"
                    >
                      <span>✏️ Düzenle</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`"${item.baslik}" çalışmasını silmek istediğinize emin misiniz?`)) {
                        onDeletePhoto(item.id);
                      }
                    }}
                    className="text-xs text-red-600 hover:text-red-800 font-semibold px-2 py-1 rounded hover:bg-red-50 transition-colors flex items-center gap-1"
                    title="Sil"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Sil</span>
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* YORUM MODERASYON MODALI */}
      {moderatingItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
          onClick={() => setModeratingItem(null)}
        >
          <div
            className="bg-bg-primary rounded-2xl border border-border shadow-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto p-5 sm:p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <span className="text-[10px] uppercase font-bold text-accent-gold block tracking-wider">
                  Sosyal Medya Yorum Moderasyonu
                </span>
                <h3 className="font-serif text-lg font-bold text-text-primary truncate max-w-md">
                  {moderatingItem.baslik}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModeratingItem(null)}
                className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center text-text-secondary hover:text-text-primary text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {commentDeleteStatus && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 animate-fadeIn">
                {commentDeleteStatus}
              </div>
            )}

            {/* Yorumlar Listesi */}
            <div className="space-y-2.5">
              {isCommentsLoading ? (
                <div className="text-center py-8 text-xs text-text-secondary animate-pulse">
                  Yorumlar yükleniyor...
                </div>
              ) : itemComments.length === 0 ? (
                <div className="text-center py-8 text-xs text-text-secondary bg-white rounded-xl border border-dashed border-border p-6">
                  Bu fotoğrafa henüz yorum yapılmamış.
                </div>
              ) : (
                itemComments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-3.5 bg-white rounded-xl border border-border shadow-2xs flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-xs text-text-primary">
                          {comment.musteri_adi}
                        </span>
                        <span className="text-[10px] text-text-secondary">
                          {new Date(comment.olusturulma_tarihi).toLocaleDateString("tr-TR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        {comment.yorum}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`"${comment.musteri_adi}" tarafından yapılan yorumu silmek istediğinize emin misiniz?`)) {
                          handleDeleteComment(comment.id);
                        }
                      }}
                      className="text-xs text-red-600 hover:text-red-800 font-semibold px-2 py-1 rounded hover:bg-red-50 transition-colors shrink-0"
                      title="Yorumu Sil"
                    >
                      Sil
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-border flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModeratingItem(null)}
                className="text-xs"
              >
                Pencereyi Kapat
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DÜZENLEME (UPDATE) MODALI */}
      {editingItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
          onClick={() => setEditingItem(null)}
        >
          <div
            className="bg-bg-primary rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 sm:p-7 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <span className="text-[10px] uppercase font-bold text-accent-gold block tracking-wider">
                  Lookbook Düzenleme
                </span>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-text-primary">
                  Galeri Çalışmasını Düzenle
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center text-text-secondary hover:text-text-primary text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Fotoğraf / Video Başlığı *
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Kategori *
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                  >
                    {DEFAULT_FORM_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Medya Türü
                  </label>
                  <select
                    value={editMedyaTuru}
                    onChange={(e) => setEditMedyaTuru(e.target.value as "image" | "video")}
                    className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                  >
                    <option value="image">Fotoğraf (Image)</option>
                    <option value="video">Video (MP4 / WebM)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Vitrin Sıralaması (Sıra No)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editSira}
                    onChange={(e) => setEditSira(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Yeni Görsel / Video Yükle
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm"
                    onChange={handleEditFileUpload}
                    disabled={isEditUploading}
                    className="w-full text-xs text-text-secondary file:mr-2 file:py-1.5 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-accent-gold/15 file:text-accent-gold hover:file:bg-accent-gold/25 cursor-pointer"
                  />
                  {isEditUploading && (
                    <span className="text-[11px] text-accent-gold mt-1 block font-medium animate-pulse">
                      Yükleniyor...
                    </span>
                  )}
                  {editUploadError && (
                    <span className="text-[11px] text-red-600 mt-1 block">
                      {editUploadError}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Uygulayan Stilist
                  </label>
                  <input
                    type="text"
                    value={editStylist}
                    onChange={(e) => setEditStylist(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Medya URL (Aktif Bağlantı) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                  />
                </div>

                {editMedyaTuru === "video" && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Video Kapak Resmi (Poster URL)
                    </label>
                    <input
                      type="text"
                      value={editKapakUrl}
                      onChange={(e) => setEditKapakUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Açıklama &amp; Uygulama Notu
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md text-xs bg-white text-text-primary focus:ring-1 focus:ring-accent-gold outline-none"
                />
              </div>

              {/* Önizleme */}
              {editImageUrl && (
                <div className="p-3 bg-white rounded-lg border border-border flex items-center gap-3">
                  <div className="w-16 h-16 rounded overflow-hidden bg-black/10 shrink-0">
                    <img
                      src={editKapakUrl || editImageUrl}
                      alt="Önizleme"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-xs space-y-0.5 min-w-0">
                    <span className="font-bold text-text-primary block truncate">
                      {editTitle || "Başlıksız"}
                    </span>
                    <span className="text-[11px] text-text-secondary block">
                      Tür: {editMedyaTuru === "video" ? "Video" : "Fotoğraf"} • {editCategory}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingItem(null)}
                >
                  İptal
                </Button>
                <Button type="submit" variant="primary" size="sm" className="font-bold">
                  ✓ Değişiklikleri Kaydet
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
