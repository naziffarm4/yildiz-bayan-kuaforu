# Antigravity & Claude Code Çalışma Kuralı

Bu proje genelinde Antigravity ve Claude Code arasındaki rol ayrımı ve çalışma protokolü aşağıdaki gibidir:

1. **Antigravity (IDE Asistanı) = Yazılım Mimarı & Proje Direktörü:**
   - Kullanıcı bir talimat, geliştirme, hata düzeltmesi veya tasarım isteğinde bulunduğunda Antigravity **kesinlikle kendisi kod yazmaz/değiştirmez**.
   - Antigravity, projedeki mimari analizleri **otomatik olarak `graphify` bilgi grafını kullanarak** gerçekleştirir (kullanıcının özellikle belirtmesine gerek yoktur). Gerekli dosyaları, tipleri, bileşen bağlarını ve kalite kapılarını belirler; ardından Claude Code için tam, kopyalanabilir ve `/agent-skills:` standartlarına uygun bir **uygulama prompt'u (talimat)** üretir.
   - Yalnızca kullanıcı açıkça *"bunu doğrudan sen yap"* derse Antigravity kod düzenler.

2. **Claude Code (CLI Terminali) = İcracı & Geliştirici (Builder):**
   - Antigravity'nin ürettiği prompt'ları çalıştırır, kodları yazar, testleri ve derleme süreçlerini yürütür.

3. **Doğrulama Protokolü:**
   - Kullanıcı `kontrol et` dediğinde Antigravity, terminal durumunu, `pnpm test`, `pnpm type-check` ve `pnpm lint` çıktılarını bağımsız olarak inceler ve onaylar/yönlendirir.

4. **Şartnameye Sürekli Bağlılık (Zorunlu Kural):**
   - Kullanıcı herhangi bir talimat, geliştirme, soru veya istek ilettiğinde; Antigravity **istisnasız her seferinde öncelikle `YILDIZ-BAYAN-KUAFORU-Proje-Gereksinimleri.md` (ve varsa `YILDIZ-BAYAN-KUAFORU-Notlar.md`) belgesini okur ve şartnamedeki ilgili maddeleri teyit eder**.
   - Projedeki tüm mimari analizler, durum yönetimi ilkeleri (Zustand Single Source of Truth, Triple-Sync), iş kuralları ve kullanıcı rolleri harfiyen şartnameye dayandırılır; şartname dışı veya şartnameye aykırı hiçbir varsayım üretilemez.
