// Pulls every Google review for Pastry Leidy through Apify and writes docs/reviews.json.
//
//   APIFY_TOKEN=... node scripts/refresh.mjs          run the scraper (weekly job)
//   node scripts/refresh.mjs --dataset <datasetId>    rebuild from an existing Apify run
//
// Guard: if the scrape comes back empty or with far fewer reviews than we already
// publish, the script exits non-zero and leaves reviews.json untouched. A bad scrape
// should fail loudly in GitHub Actions, never blank the badge.

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const PLACE_ID = "ChIJiy8JYSqtGYgRsFX0NiXSfDI"; // Pastry Leidy, 118 Travis St NE, Grand Rapids
const ACTOR = "compass~Google-Maps-Reviews-Scraper";
const MAX_CHARGE_USD = 0.5; // hard cap per run; a full pull of ~100 reviews costs about $0.06
const MIN_KEEP_RATIO = 0.8; // refuse to publish if we'd lose more than 20% of reviews

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(root, "docs", "reviews.json");

async function fromActor(token) {
  const url =
    `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items` +
    `?clean=true&maxTotalChargeUsd=${MAX_CHARGE_USD}&timeout=240`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      placeIds: [PLACE_ID],
      maxReviews: 2000,
      reviewsSort: "newest",
      language: "en",
      reviewsOrigin: "google",
      personalData: true,
    }),
  });
  if (!res.ok) throw new Error(`Apify run failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function fromDataset(id) {
  const res = await fetch(`https://api.apify.com/v2/datasets/${id}/items?clean=true&format=json`);
  if (!res.ok) throw new Error(`Dataset read failed: ${res.status}`);
  return res.json();
}

function shape(items) {
  const first = items.find((i) => i.placeId === PLACE_ID) || items[0];
  if (!first || first.placeId !== PLACE_ID) {
    throw new Error(`Scrape returned a different place (${first && first.placeId}); refusing to publish.`);
  }
  const reviews = items
    .filter((i) => i.placeId === PLACE_ID && i.reviewId && i.stars)
    .map((i) => ({
      id: i.reviewId,
      name: i.name || "Google user",
      // Apify returns 1920px avatars; the badge shows them at 36px, so ask Google for 72px.
      photo: i.reviewerPhotoUrl ? i.reviewerPhotoUrl.replace(/=s\d+/, "=s72") : null,
      stars: i.stars,
      date: i.publishedAtDate,
      text: (i.text || i.textTranslated || "").trim() || null,
      reply: (i.responseFromOwnerText || "").trim() || null,
      url: i.reviewUrl || null,
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Dedupe on review id in case the scraper pages overlap.
  const seen = new Set();
  const unique = reviews.filter((r) => (seen.has(r.id) ? false : seen.add(r.id)));

  return {
    updated: new Date().toISOString(),
    place: {
      name: first.title || "Pastry Leidy",
      placeId: PLACE_ID,
      rating: Number(first.totalScore) || null,
      reviewsCount: Number(first.reviewsCount) || unique.length,
      url: `https://www.google.com/maps/place/?q=place_id:${PLACE_ID}`,
      writeReviewUrl: `https://search.google.com/local/writereview?placeid=${PLACE_ID}`,
    },
    reviews: unique,
  };
}

async function main() {
  const i = process.argv.indexOf("--dataset");
  const items = i > -1 ? await fromDataset(process.argv[i + 1]) : await fromActor(requireToken());
  const next = shape(items);

  let prevCount = 0;
  try {
    prevCount = JSON.parse(await readFile(OUT, "utf8")).reviews.length;
  } catch {}

  if (!next.reviews.length) throw new Error("Scrape returned no reviews; keeping the published file.");
  if (prevCount && next.reviews.length < prevCount * MIN_KEEP_RATIO) {
    throw new Error(
      `Scrape returned ${next.reviews.length} reviews but ${prevCount} are published; ` +
        `looks like a partial scrape, keeping the published file.`
    );
  }
  if (!next.place.rating) throw new Error("Scrape returned no overall rating; keeping the published file.");

  await writeFile(OUT, JSON.stringify(next, null, 2) + "\n");
  console.log(
    `Wrote ${next.reviews.length} reviews (Google shows ${next.place.reviewsCount}, rating ${next.place.rating}); ` +
      `previously ${prevCount}.`
  );
}

function requireToken() {
  const t = process.env.APIFY_TOKEN;
  if (!t) throw new Error("APIFY_TOKEN is not set.");
  return t;
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
