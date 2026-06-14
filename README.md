# Salted Margin Command Center

A Vercel-ready static SaaS MVP that demonstrates a finance + operations command center for a delivery-first, multi-brand restaurant group.

## What It Proves

- Location and district contribution-margin reporting.
- Delivery channel economics across marketplace, direct, pickup, and catering.
- Menu item unit economics with COGS, packaging, platform fees, and recommendations.
- Rolling 13-week forecasts with scenario controls.
- Modeled evidence operator action queue.
- Send-ready weekly finance summary.
- CSV validation and export workflows.

## Important Disclosure

The app uses sample modeled operating data for a Salted application prototype. It is not actual Salted data and does not use private company systems.

## Run Locally

This project has no package manager or build step.

```bash
python3 -m http.server 4173
```

Open:

```text
http://localhost:4173
```

## Test

Use the bundled Codex Node runtime if system Node is unavailable:

```bash
/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/calculations.test.mjs
```

Expected output:

```text
calculation smoke tests passed
```

## Deploy To Vercel

This is a static project. Deploy the repository root to Vercel. If the Vercel CLI is authenticated:

```bash
vercel --prod
```

If using the Vercel web UI, import the repo and keep the default static settings. There is no build command and no output directory.

## Files

- `index.html` - app entry point.
- `src/app.js` - navigation, state, views, interactions.
- `src/data.js` - deterministic sample operating data.
- `src/calculations.js` - finance formulas, variance bridge, forecasts.
- `src/charts.js` - dependency-free SVG charts.
- `src/csv.js` - CSV parsing, validation, downloads.
- `src/export.js` - weekly summary and export helpers.
- `src/styles.css` - Salted-aligned internal SaaS design system.
- `samples/` - example CSV templates.
- `assets/` - approved design reference and synthetic menu imagery.
