export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { withStaffOrAdminAuth } from "@/lib/auth/api-guard";
import path from "node:path";
import fs from "node:fs/promises";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_FILE_SIZE = 52428800; // 50MB

export const POST = withStaffOrAdminAuth(async (request: Request) => {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "gallery";

    if (!file) {
      return NextResponse.json({ error: "Yüklenecek dosya bulunamadı." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Dosya boyutu 50MB sınırını aşıyor." },
        { status: 400 },
      );
    }

    const mimeType = file.type.toLowerCase();
    const isImage = ALLOWED_IMAGE_TYPES.includes(mimeType);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(mimeType);

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: "Desteklenmeyen dosya türü. Yalnızca JPEG, PNG, WEBP, AVIF ve MP4, WEBM videoları yüklenebilir." },
        { status: 400 },
      );
    }

    const medyaTuru: "image" | "video" = isVideo ? "video" : "image";
    const extension = path.extname(file.name) || (isImage ? ".jpg" : ".mp4");
    const sanitizedBase = path
      .basename(file.name, extension)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .slice(0, 30);
    const uniqueFileName = `${Date.now()}-${sanitizedBase}${extension}`;
    const storagePath = `${folder}/${uniqueFileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Supabase Storage 'salon-media' Bucket'a Yüklemeyi Dene
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { error: uploadError } = await supabase.storage
          .from("salon-media")
          .upload(storagePath, buffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from("salon-media")
            .getPublicUrl(storagePath);

          if (publicUrlData?.publicUrl) {
            return NextResponse.json({
              success: true,
              url: publicUrlData.publicUrl,
              medyaTuru,
              fileName: uniqueFileName,
            });
          }
        }
      } catch (storageErr) {
        console.warn("Supabase Storage yükleme uyarısı, yerel klasöre aktarılıyor:", storageErr);
      }
    }

    // 2. Güvenli Yerel Fallback: public/uploads/{folder}
    const uploadsDir = path.join(process.cwd(), "public", "uploads", folder);
    await fs.mkdir(uploadsDir, { recursive: true });
    const localFilePath = path.join(uploadsDir, uniqueFileName);
    await fs.writeFile(localFilePath, buffer);

    const localUrl = `/uploads/${folder}/${uniqueFileName}`;

    return NextResponse.json({
      success: true,
      url: localUrl,
      medyaTuru,
      fileName: uniqueFileName,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Medya yükleme sırasında hata oluştu";
    return NextResponse.json({ error: message }, { status: 500 });
  }
});
