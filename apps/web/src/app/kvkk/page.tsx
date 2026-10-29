import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card } from "@yildiz/ui";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SALON_INFO } from "@/lib/site-defaults";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni, Açık Rıza & Gizlilik Politikası",
  description:
    "6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında Yıldız Bayan Kuaförü aydınlatma metni, veri saklama ilkeleri ve veri sahibi başvuru hakları.",
  alternates: {
    canonical: "/kvkk",
  },
};

export default function KvkkPage() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-primary text-text-primary">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
        <div className="space-y-3 text-center sm:text-left">
          <Badge variant="gold" className="text-[10px] uppercase tracking-widest font-bold">
            6698 Sayılı KVKK &amp; Veri Güvenliği
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-text-primary">
            Kişisel Verilerin Korunması Aydınlatma Metni ve Gizlilik Politikası
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
            <strong>{SALON_INFO.ad}</strong> (&ldquo;Veri Sorumlusu&rdquo;) olarak, 6698 sayılı
            Kişisel Verilerin Korunması Kanunu (&ldquo;KVKK&rdquo;) uyarınca kişisel verilerinizin
            güvenliğine, gizliliğine ve yalnızca açıkça belirtilen amaçlarla işlenmesine azami
            özen göstermekteyiz.
          </p>
        </div>

        <Card className="p-6 sm:p-8 bg-bg-secondary border-border rounded-2xl space-y-6 text-xs sm:text-sm leading-relaxed text-text-secondary">
          <section className="space-y-2">
            <h2 className="font-serif text-lg font-bold text-text-primary">
              1. Veri Sorumlusu Kimliği
            </h2>
            <p>
              <strong>Ünvan:</strong> {SALON_INFO.ad}
              <br />
              <strong>Adres:</strong> {SALON_INFO.adres}
              <br />
              <strong>Telefon:</strong> {SALON_INFO.telefon}
              <br />
              <strong>E-posta:</strong> {SALON_INFO.eposta}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-bold text-text-primary">
              2. İşlenen Kişisel Veriler ve İşleme Amaçları
            </h2>
            <p>
              Veri minimizasyonu ilkesi (Şartname Bölüm 15 &amp; 16) gereği doğum tarihi gibi
              hizmetle doğrudan ilgisi olmayan veriler toplanmamaktadır. Yalnızca aşağıdaki
              veriler işlenir:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Kimlik ve İletişim Bilgileri (Ad, Soyad, Telefon, E-posta):</strong>{" "}
                Online randevu oluşturulması, randevu onay/hatırlatma bildirimlerinin (SMS /
                WhatsApp / E-posta) iletilmesi ve sadakat puanı takibi.
              </li>
              <li>
                <strong>Hizmet ve İşlem Geçmişi:</strong> Randevu kayıtları, uygulanan saç
                tasarım/renklendirme formülleri ve yasal mali yükümlülüklerin yerine getirilmesi.
              </li>
              <li>
                <strong>Özel Nitelikli Kişisel Veriler (Alerji Notu):</strong> Yalnızca müşterinin
                açık rızası bulunması halinde, kozmetik ürün güvenliği amacıyla işlenir ve erişimi
                veritabanı düzeyinde (Row Level Security) kısıtlanır.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-bold text-text-primary">
              3. Verilerin Saklama Süresi, Silinmesi ve Anonimleştirme
            </h2>
            <p>
              Müşterinin hesabını silme talebinde bulunması veya yasal saklama süresinin dolması
              halinde:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                Kimlik ve iletişim verileri geri döndürülemeyecek şekilde{" "}
                <strong>anonimleştirilir</strong>.
              </li>
              <li>
                <strong>İstisna (Şartname Bölüm 15):</strong> Yüz içeren fotoğraflar ve alerji
                notları anonimleştirilmeksizin kalıcı olarak <strong>silinir</strong>.
              </li>
              <li>
                Vergi Usul Kanunu ve ilgili mevzuat kapsamındaki mali kasa kayıtları yasal saklama
                süresince muhafaza edilir.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-bold text-text-primary">
              4. KVKK Madde 11 Kapsamındaki Haklarınız (Veri İndirme &amp; Silme Başvurusu)
            </h2>
            <p>
              KVKK&apos;nın 11. maddesi uyarınca kişisel verilerinizin işlenip işlenmediğini
              öğrenme, düzeltilmesini isteme, verilerinizin bir kopyasını dışa aktarma veya
              silinmesini/anonimleştirilmesini talep etme hakkına sahipsiniz.
            </p>
            <p>
              Veri silme veya dışa aktarma başvurularınızı kayıtlı e-posta adresiniz üzerinden{" "}
              <a
                href={`mailto:${SALON_INFO.eposta}?subject=KVKK%20Veri%20Talebi`}
                className="text-accent-gold font-semibold underline"
              >
                {SALON_INFO.eposta}
              </a>{" "}
              adresine iletebilir veya{" "}
              <Link href="/profil" className="text-accent-gold font-semibold underline">
                Müşteri Profilim
              </Link>{" "}
              sayfası üzerinden hesap bilgilerinizi yönetebilirsiniz.
            </p>
          </section>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
