import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read from apps/web/.env.local
const envPath = path.resolve(__dirname, "../apps/web/.env.local");
let apiKey = process.env.GOOGLE_PLACES_API_KEY;
if (!apiKey && fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("GOOGLE_PLACES_API_KEY=")) {
      apiKey = trimmed.split("=")[1]?.trim();
    }
  }
}

if (!apiKey) {
  console.error("GOOGLE_PLACES_API_KEY not found in environment or .env.local");
  process.exit(1);
}

async function testPlacesSearch() {
  console.log("Testing Google Places API (New) Text Search...");
  const searchUrl = "https://places.googleapis.com/v1/places:searchText";
  const searchRes = await fetch(searchUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.location",
    },
    body: JSON.stringify({
      textQuery: "YILDIZ BAYAN KUAFÖRÜ Köprübaşı Serdivan Sakarya",
      languageCode: "tr",
    }),
  });
  const data = await searchRes.json();
  console.log("Search Result:", JSON.stringify(data, null, 2));
}

testPlacesSearch().catch(console.error);
