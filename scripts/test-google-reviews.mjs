import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

if (process.env.NODE_ENV === "production") {
  console.error("Bu geliştirici betiği üretim ortamında çalıştırılamaz.");
  process.exit(1);
}

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

async function testFetchReviews() {
  console.log("--- Testing Places API New with specific review fields ---");
  const detailsUrl = `https://places.googleapis.com/v1/places/${placeId}?languageCode=tr`;
  const res1 = await fetch(detailsUrl, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "id,displayName,rating,userRatingCount,reviews,websiteUri,nationalPhoneNumber,regularOpeningHours",
    },
  });
  const data1 = await res1.json();
  console.log("API New res:", JSON.stringify(data1, null, 2));
}

testFetchReviews().catch(console.error);
