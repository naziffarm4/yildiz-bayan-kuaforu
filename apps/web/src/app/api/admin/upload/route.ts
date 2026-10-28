export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { withStaffOrAdminAuth } from "@/lib/auth/api-guard";
import path from "node:path";
import fs from "node:fs/promises";

const ALLOWED_FOLDERS = ["gallery", "services", "sliders", "staff", "general"] as const;
type AllowedFolder = (typeof ALLOWED_FOLDERS)[number];

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

const MAX_FILE_SIZE = 52428800; // 50MB

function isAllowedFolder(value: string): value is AllowedFolder {
  return (ALLOWED_FOLDERS as readonly string[]).includes(value);
}

export const POST = withStaffOrAdminAuth(async (request: Request) => {
  try {
    const formData = await request.formData();
    const fileEntry = formData.get("file");
    const file = fileEntry instanceof File ? fileEntry : null;
    const rawFolder = formData.get("folder");
    const folderInput =
      typeof rawFolder === "string" && rawFolder.trim() !== ""
        ? rawFolder.trim()
        : "gallery";

    if (!isAllowedFolder(folderInput)) {
      return NextResponse.json(
        { error: "Geçersiz klasör parametresi." },
        { status: 400 }
      );
    }

    const folder: AllowedFolder = folderInput;

    if (!file) {
      return NextResponse.json({ error: "Yüklenecek dosya bulunamadı." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Dosya boyutu 50MB sınırını aşıyor." },
        { status: 400 }
      );
    }

    const mimeType = file.type.toLowerCase();
    const isImage = ALLOWED_IMAGE_TYPES.includes(mimeType);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(mimeType);
    const extension = MIME_TO_EXT[mimeType];

    if ((!isImage && !isVideo) || !extension) {
      return NextResponse.json(
        {
          error:
            "Desteklenmeyen dosya türü. Yalnızca JPEG, PNG, WEBP, AVIF ve MP4, WEBM videoları yüklenebilir.",
        },
        { status: 400 }
      );
    }

    const medyaTuru: "image" | "video" = isVideo ? "video" : "image";
    const clientExt = path.extname(file.name);
    const sanitizedBase =
      path
        .basename(file.name, clientExt)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 30) || "medya";

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
      } catch (storageErr: unknown) {
        console.warn("Supabase Storage yükleme uyarısı:", storageErr);
      }
    }

    // Üretim ortamında yerel dosya sistemine sessiz fallback yapılmaz
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Medya depolama alanına yüklenemedi." },
        { status: 500 }
      );
    }

    // 2. Güvenli Yerel Fallback (yalnızca geliştirme/test ortamında): public/uploads/{folder}
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
