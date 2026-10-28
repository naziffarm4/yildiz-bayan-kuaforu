import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, "../apps/web/.env.local");
let apiKey = process.env.GOOGLE_PLACES_API_KEY;

if (fs.existsSync(envPath)) {
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

async function testKnownPlace() {
  const searchUrl = "https://places.googleapis.com/v1/places:searchText";
  const searchRes = await fetch(searchUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id,places.displayName",
    },
    body: JSON.stringify({ textQuery: "Anitkabir Ankara", languageCode: "tr" }),
  });
  const data = await searchRes.json();
  const placeId = data.places?.[0]?.id;
  console.log("Known Place ID:", placeId);
}

testKnownPlace().catch(console.error);
