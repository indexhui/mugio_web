# Mugio official website

A responsive, dependency-free official website and press kit for Mugio and *Moments / 走走小日 / てくてく日和*.

## Run locally

```bash
npm run dev
```

Open one of the language routes:

- `http://127.0.0.1:3000/zh-TW`
- `http://127.0.0.1:3000/en`
- `http://127.0.0.1:3000/ja`

Early bird registration pages are available at:

- `/zh-TW/early-bird`
- `/en/early-bird`
- `/ja/early-bird`

The Tokyo Game Show 2026 landing page is available at `/tgs2026`. It defaults to Japanese unless the visitor already has a saved language preference. Localized routes are:

- `/zh-TW/tgs2026`
- `/en/tgs2026`
- `/ja/tgs2026`

## Verify

```bash
npm run build
```

The project is a dependency-free static site. `npm run build` pre-renders complete localized HTML for the home, early bird, and TGS 2026 pages into `dist/zh-TW`, `dist/en`, and `dist/ja`, so every language route has crawlable copy and its own metadata. The legacy `?lang=` links remain supported.

## Preview the production build

```bash
npm run build
PORT=3001 npm run preview
```

## Deploy to Vercel

The repository includes `vercel.json`; Vercel serves the pre-rendered `dist/` output and redirects `/` to `/zh-TW`.

Press assets are stored under `assets/press/`; the downloadable bundle is `assets/press/mugio-press-kit.zip`.
