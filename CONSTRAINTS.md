# CONSTRAINTS - YILDIZ BAYAN KUAFÖRÜ

Last reviewed: 2026-10-21 by @claude

## 1. Kod Kalitesi ve Güvenlik Zemin Kuralları (Floor - Her Zaman Zorunlu)

Aşağıdaki kurallar tüm paketler (`apps/web`, `packages/*`, ileride eklenecek mobil ve masaüstü) için istisnasız zorunludur:

- **`any` Tipi KESİNLİKLE YASAKTIR:**
  - Hiçbir dosyada `any`, `as any`, `any[]`, `Record<string, any>` kullanılamaz.
  - Bilinmeyen veya dinamik dış veriler için her zaman `unknown` tipi kullanılır ve Zod şeması veya Type Guard ile tip daraltması (narrowing) yapılır.
- **Tip Bastırma Yasaktır:**
  - `// @ts-ignore` ve `// @ts-nocheck` KESİNLİKLE YASAKTIR.
  - `eslint-disable` ile kalite kurallarını devre dışı bırakmak yasaktır.
  - Sadece kaçınılmaz ve üçüncü parti kütüphane uyumsuzluklarında, gerekçesi açıkça yorumda belirtilmek kaydıyla `// @ts-expect-error [gerekçe]` kullanılabilir.
- **Bitmemiş Kod / Boş Yakalama Yasaktır:**
  - `throw new Error("Not implemented")` veya sessiz boş `catch {}` blokları kabul edilmez.
- **Test Atlama Yasaktır:**
  - Git commit mesajında ve PR'da açık ve onaylanmış bir gerekçe olmaksızın `.skip`, `.only` kullanılamaz, mevcut testler silinemez.
- **Sır ve Hassas Bilgiler:**
  - Kaynak kodda API anahtarları, şifreler, özel anahtarlar veya hassas veriler yer alamaz.
- **Sözleşmeyi Zayıflatma Yasağı:**
  - Testlerin veya lint kontrollerinin geçmesi için bu dosyadaki kurallar, toleranslar veya eşikler aşağı çekilemez.

## 2. Sayısal Olarak Dayatılan Kurallar (Enforced with Numbers)

| Boyut | Kural | Kontrol Aracı | Çalışma Zamanı |
|-------|-------|---------------|----------------|
| **Tip Güvenliği** | 0 Hata, `strict: true`, `noImplicitAny: true`, `strictNullChecks: true` | `pnpm type-check` (`turbo run type-check` -> `tsc --noEmit`) | Her düzenlemede / Görev sonu / CI |
| **Lint & Format** | 0 Hata, 0 Uyarı | `pnpm lint` (`turbo run lint` -> ESLint + Prettier) | Her düzenlemede / Görev sonu / CI |
| **`any` Kontrolü** | 0 İhlal (`@typescript-eslint/no-explicit-any: error`) | ESLint kuralı | `pnpm lint` / CI |
| **Birim Testleri** | 0 Başarısız Test (%100 Başarı) | `pnpm test` (`turbo run test` -> Vitest) | Görev sonu / CI |
| **İş Kuralları Testleri** | Komisyon, puan, paket iadesi, kasa hesapları, tampon süre vb. kurallara birim testi zorunlu | Vitest | Görev sonu / CI |

## 3. Doğrulama Kapısı (Quality Gate Workflow)

Her görev veya değişiklik sonunda istisnasız sırasıyla şu 3 komut çalıştırılır ve tümü sıfır hatayla geçmeden iş tamamlanmış kabul edilmez:

```bash
pnpm lint
pnpm type-check
pnpm test
```

## 4. İstisnalar (Exceptions)

Şu an tanımlı hiçbir istisna yoktur. Herhangi bir istisna eklenmesi durumunda ID, Kural, Dosya Yolu, Gerekçe, Sorumlu ve Bitiş Tarihi belirtilmelidir.
