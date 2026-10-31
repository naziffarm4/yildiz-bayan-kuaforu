export const dynamic = "force-dynamic";

import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  getRequestAuthContext,
  withStaffOrAdminAuth,
} from "@/lib/auth/api-guard";
import { safeErrorResponse } from "@/lib/api-utils";
import { recordAuditLog } from "@/lib/audit-log";

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

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB (Şartname Madde 15)
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

function isAllowedFolder(value: string): value is AllowedFolder {
  return (ALLOWED_FOLDERS as readonly string[]).includes(value);
}

function sanitizeBaseName(fileName: string): string {
  const clientExt = path.extname(fileName);
  return (
    path
      .basename(fileName, clientExt)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30) || "medya"
  );
}

function verifyMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 12) {
    return false;
  }

  switch (mimeType) {
    case "image/jpeg":
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    case "image/png":
      return (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
      );
    case "image/webp":
      return (
        buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
        buffer.subarray(8, 12).toString("ascii") === "WEBP"
      );
    case "image/avif":
    case "video/mp4":
    case "video/quicktime":
      return buffer.subarray(4, 8).toString("ascii") === "ftyp";
    case "video/webm":
      return (
        buffer[0] === 0x1a &&
        buffer[1] === 0x45 &&
        buffer[2] === 0xdf &&
        buffer[3] === 0xa3
      );
    default:
      return false;
  }
}

export const POST = withStaffOrAdminAuth(async (request: Request) => {
  try {
    const contentType = request.headers.get("content-type") || "";

    // İmzalı Yükleme URL'i Oluşturma Desteği (G-10 & Bölüm 2.4: Vercel 4.5MB sınırını aşan dosyalar için)
    if (contentType.includes("application/json")) {
      const authCtx = getRequestAuthContext(request);
      if (authCtx && authCtx.role !== "Admin") {
        return NextResponse.json(
          { error: "İmzalı yükleme bağlantısı yalnızca Admin yetkisiyle oluşturulabilir." },
          { status: 403 }
        );
      }

      const body = (await request.json().catch(() => ({}))) as {
        action?: unknown;
        folder?: unknown;
        fileName?: unknown;
        mimeType?: unknown;
        fileSize?: unknown;
      };

      if (body.action !== "createSignedUploadUrl") {
        return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
      }

      const folderInput =
        typeof body.folder === "string" && body.folder.trim() !== ""
          ? body.folder.trim()
          : "gallery";

      if (!isAllowedFolder(folderInput)) {
        return NextResponse.json({ error: "Geçersiz klasör parametresi." }, { status: 400 });
      }

      const mimeType = typeof body.mimeType === "string" ? body.mimeType.toLowerCase() : "";
      const extension = MIME_TO_EXT[mimeType];
      if (!extension) {
        return NextResponse.json({ error: "Desteklenmeyen dosya türü." }, { status: 400 });
      }

      const isImage = ALLOWED_IMAGE_TYPES.includes(mimeType);
      const maxAllowedSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
      const rawFileSize = Number(body.fileSize);
      if (!Number.isFinite(rawFileSize) || rawFileSize <= 0) {
        return NextResponse.json(
          { error: "Geçerli bir dosya boyutu (fileSize) belirtilmelidir." },
          { status: 400 }
        );
      }
      if (rawFileSize > maxAllowedSize) {
        return NextResponse.json(
          {
            error: isImage
              ? "Görsel boyutu 5MB sınırını aşıyor."
              : "Video boyutu 50MB sınırını aşıyor.",
          },
          { status: 400 }
        );
      }

      const rawName = typeof body.fileName === "string" ? body.fileName : "medya";
      const uniqueFileName = `${crypto.randomUUID()}-${sanitizeBaseName(rawName)}${extension}`;
      const storagePath = `${folderInput}/${uniqueFileName}`;

      const supabase = getSupabaseAdmin();
      if (!supabase) {
        return safeErrorResponse("Medya depolama bağlantısı yapılandırılmamış.", 500);
      }

      const { data, error } = await supabase.storage
        .from("salon-media")
        .createSignedUploadUrl(storagePath);

      if (error || !data) {
        return safeErrorResponse("İmzalı yükleme bağlantısı oluşturulamadı.", 500, error);
      }

      const { data: publicUrlData } = supabase.storage
        .from("salon-media")
        .getPublicUrl(storagePath);

      await recordAuditLog({
        request,
        action: "media.signed_upload_url",
        entityType: "storage",
        entityId: storagePath,
        metadata: {
          folder: folderInput,
          mimeType,
          fileSize: rawFileSize,
          fileName: uniqueFileName,
        },
      });

      return NextResponse.json({
        success: true,
        signedUrl: data.signedUrl,
        token: data.token,
        path: storagePath,
        fileName: uniqueFileName,
        publicUrl: publicUrlData?.publicUrl ?? null,
      });
    }

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

    const maxAllowedSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
    if (file.size > maxAllowedSize) {
      return NextResponse.json(
        {
          error: isImage
            ? "Görsel boyutu 5MB sınırını aşıyor."
            : "Video boyutu 50MB sınırını aşıyor.",
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!verifyMagicBytes(buffer, mimeType)) {
      return NextResponse.json(
        { error: "Dosya içeriği beyan edilen dosya türüyle eşleşmiyor." },
        { status: 400 }
      );
    }

    const medyaTuru: "image" | "video" = isVideo ? "video" : "image";
    const sanitizedBase = sanitizeBaseName(file.name);
    const uniqueFileName = `${crypto.randomUUID()}-${sanitizedBase}${extension}`;
    const storagePath = `${folder}/${uniqueFileName}`;

    // 1. Supabase Storage 'salon-media' Bucket'a Yüklemeyi Dene (upsert: false)
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { error: uploadError } = await supabase.storage
          .from("salon-media")
          .upload(storagePath, buffer, {
            contentType: mimeType,
            upsert: false,
          });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from("salon-media")
            .getPublicUrl(storagePath);

          if (publicUrlData?.publicUrl) {
            await recordAuditLog({
              request,
              action: "media.upload",
              entityType: "storage",
              entityId: storagePath,
              metadata: {
                folder,
                mimeType,
                fileName: uniqueFileName,
                url: publicUrlData.publicUrl,
              },
            });

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

    await recordAuditLog({
      request,
      action: "media.upload_local",
      entityType: "storage",
      entityId: storagePath,
      metadata: { folder, mimeType, fileName: uniqueFileName, url: localUrl },
    });

    return NextResponse.json({
      success: true,
      url: localUrl,
      medyaTuru,
      fileName: uniqueFileName,
    });
  } catch (err: unknown) {
    return safeErrorResponse("Medya yükleme sırasında hata oluştu.", 500, err);
  }
});
