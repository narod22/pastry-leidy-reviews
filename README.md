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

## Working notes

Moved here from Claude's memory on 2026-10-20.

- Built 2026-10-01 because the MarketPushApps "Google Reviews" app's free plan caps at 10 reviews and Nathan won't pay for apps. Public repo on Nathan's personal account; repo-local git identity is narod22 because the global default authors as ranch-26.
- On the site: Wix Custom Embed id `8db32c0c-989b-4b1d-90b5-ca39c00a7f3b` ("Pastry Leidy reviews badge", BODY_END), switched on 2026-10-01 after Johanna's OK. The embed src carries `badge.js?v=N`; bump N (PATCH with the current revision) after any `badge.js` change, because GitHub Pages lets browsers cache it for 10 minutes.
- Data: Apify `compass/Google-Maps-Reviews-Scraper`, place ID `ChIJiy8JYSqtGYgRsFX0NiXSfDI`, on Nathan's personal Apify account. Token "Pastry Leidy reviews" is the repo secret `APIFY_TOKEN`.
- The `gh` token available to Claude lacks `workflow` scope, so changes to the workflow file go through the GitHub web UI (a prefilled `/new/main?filename=...&value=...` link).
- Sort is highest rated first, newest within a rating. Never hide reviews by rating: FTC 16 CFR 465.7 bars suppressing negative reviews while implying all are shown. A review can be dropped only if it is reasonably believed fake or unrelated.
- Layout copies the old app (logo, rating and count, up arrow). Phones get a slim full-width bar with no close button, which lifts itself above Wix's mobile `#QUICK_ACTION_BAR` when present.
