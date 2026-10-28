import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, "../apps/web/.env.local");
let apiKey = process.env.GOOGLE_PLACES_API_KEY;
let placeId = process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID || "ChIJR_wdvgizzBQR0tN_pKYFp3M";

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("GOOGLE_PLACES_API_KEY=")) {
      apiKey = trimmed.split("=")[1]?.trim();
    }
    if (trimmed.startsWith("NEXT_PUBLIC_GOOGLE_PLACE_ID=")) {
      placeId = trimmed.split("=")[1]?.trim();
    }
  }
}

if (!apiKey) {
  console.error("GOOGLE_PLACES_API_KEY not found in environment or .env.local");
  process.exit(1);
}

async function testReviewFields() {
  const detailsUrl = `https://places.googleapis.com/v1/places/${placeId}?languageCode=tr`;
  const res = await fetch(detailsUrl, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "id,displayName,rating,userRatingCount,reviews.rating,reviews.text,reviews.authorAttribution,reviews.publishTime,reviews.relativePublishTimeDescription",
    },
  });
  const data = await res.json();
  console.log("Result with subfields:", JSON.stringify(data, null, 2));
}

testReviewFields().catch(console.error);
