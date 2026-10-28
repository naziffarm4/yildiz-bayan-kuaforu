import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { createClient } = require("../apps/web/node_modules/@supabase/supabase-js");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. apps/web/.env.local dosyasından ortam değişkenlerini oku
const envPath = path.resolve(__dirname, "../apps/web/.env.local");
if (!fs.existsSync(envPath)) {
  console.error("❌ apps/web/.env.local dosyası bulunamadı!");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf-8");
const envVars = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#")) {
    const [key, ...values] = trimmed.split("=");
    if (key && values.length > 0) {
      envVars[key.trim()] = values.join("=").trim();
    }
  }
}

const supabaseUrl = envVars["NEXT_PUBLIC_SUPABASE_URL"];
const anonKey = envVars["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
const serviceRoleKey = envVars["SUPABASE_SERVICE_ROLE_KEY"];

console.log("==================================================");
console.log("Supabase Canlı Veritabanı Doğrulama Testi");
console.log("URL:", supabaseUrl);
console.log("==================================================");

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY eksik!");
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const anonClient = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false },
});

async function runTests() {
  let hasError = false;

  // TEST 1: Service Role ile site_settings Okuma
  console.log("\n[1/4] Service Role ile site_settings okunuyor...");
  const { data: readData, error: readError } = await adminClient
    .from("site_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (readError) {
    console.error("❌ Service Role Okuma Hatası:", readError.message, "(Kod:", readError.code, ")");
    hasError = true;
  } else {
    console.log("✅ Service Role Okuma Başarılı! ID:", readData?.id || "Kayıt henüz yok");
  }

  // TEST 2: Service Role ile site_settings Yazma (UPDATE veya INSERT)
  console.log("\n[2/4] Service Role ile site_settings yazılıyor (UPDATE)...");
  if (readData?.id) {
    const { data: updateData, error: updateError } = await adminClient
      .from("site_settings")
      .update({
        facebook: "yildizbayankuaforu",
      })
      .eq("id", readData.id)
      .select()
      .single();

    if (updateError) {
      console.error("❌ Service Role Yazma Hatası:", updateError.message, "(Kod:", updateError.code, ")");
      hasError = true;
    } else {
      console.log("✅ Service Role Yazma Başarılı! Facebook:", updateData.facebook);
    }
  } else {
    const { data: insertData, error: insertError } = await adminClient
      .from("site_settings")
      .insert({
        salon_adi: "YILDIZ BAYAN KUAFÖRÜ",
        facebook: "yildizbayankuaforu",
      })
      .select()
      .single();

    if (insertError) {
      console.error("❌ Service Role Ekleme Hatası:", insertError.message, "(Kod:", insertError.code, ")");
      hasError = true;
    } else {
      console.log("✅ Service Role Ekleme Başarılı! ID:", insertData.id);
    }
  }

  // TEST 3: Anon Client ile site_settings Okuma (Kamuya açık alan)
  console.log("\n[3/4] Anon Client (İstemci) ile site_settings okunuyor...");
  const { data: anonData, error: anonError } = await anonClient
    .from("site_settings")
    .select("salon_adi, facebook, instagram")
    .limit(1)
    .maybeSingle();

  if (anonError) {
    console.error("❌ Anon Client Okuma Hatası:", anonError.message, "(Kod:", anonError.code, ")");
    hasError = true;
  } else {
    console.log("✅ Anon Client Okuma Başarılı! Salon:", anonData?.salon_adi, "| Facebook:", anonData?.facebook);
  }

  // TEST 4: Permission Denied Kontrolü
  console.log("\n[4/4] 42501 (Permission Denied) İncelemesi:");
  if (!hasError) {
    console.log("✅ 42501 (Permission Denied) hatası tespit edilmedi!");
    console.log("✅ Canlı Supabase bağlantısı ve site_settings okuma/yazma işlemi tamamen sağlıklı.");
  } else {
    console.error("⚠️ Veritabanı izinlerinde sorun tespit edildi. Lütfen 0003_fix_permissions.sql dosyasını çalıştırın.");
  }

  console.log("\n==================================================");
  if (hasError) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error("Beklenmeyen hata:", err);
  process.exit(1);
});
