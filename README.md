# Pastry Leidy reviews badge

A free, self-hosted replacement for the paid Google reviews app on pastryleidy.com. It shows every Google review, not just the first 10.

- `docs/badge.js`: the floating badge and review panel. Loaded on the Wix site through a Custom Embed (Wix dashboard → Settings → Custom Code, "Pastry Leidy reviews badge").
- `docs/reviews.json`: all reviews plus the overall rating and count. Served by GitHub Pages.
- `scripts/refresh.mjs`: pulls reviews from Google through the Apify Google Maps Reviews Scraper (about $0.0006 per review, which the Apify free plan's $5 monthly credit covers).
- `.github/workflows/refresh.yml`: runs the refresh every Monday at 7am ET and commits the new file.

## Run it by hand

Actions tab → "Refresh Google reviews" → Run workflow. Or locally:

```
APIFY_TOKEN=... node scripts/refresh.mjs
```

## Safety

If a scrape returns nothing, the wrong place, no rating, or more than 20% fewer reviews than are already published, the job fails and the published file stays as it was. GitHub emails the repo owner when a scheduled run fails.

## Setup

The workflow needs one repository secret, `APIFY_TOKEN` (Apify console → Settings → API & Integrations).
