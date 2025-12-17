# Bingo Caller Pro — Client-only App

> Note: This app uses a themed **"Bingo Caller Pro"** modal (bingo-ball icon) for user-facing warnings and confirmations instead of native browser dialogs.

Bingo Caller Pro is a client-side React app for playing Bingo with custom card images.

Quick start:

```bash
npm install
npm start
```

Key features:
- Upload a bingo card image, OCR with Tesseract.js and auto-parse numbers.
- Manual fallback to edit parsed numbers.
- Assign player names to rows/columns and preview label offsets.
- Ball picker + fullscreen Game Mode with separate **Card** and **Ball** views.
- Auto Dab mode (defaults to ON) and manual dab verification.
- Win detection with in-view confetti and a short chime (configurable, file fallback if bundled audio exists).
- A single, persisted topbar **Sound** toggle controls app audio (win chime, rolling draw sound).

Saving card images to SampleCards
--------------------------------
If you want to save a bingo card image into the workspace `SampleCards` folder (where you keep test cards), there are two helpers included:

- Node script: `scripts/save_image.js`
  - Usage (PowerShell or CMD):
    ```bash
    node scripts/save_image.js "C:\\Users\\You\\Downloads\\card.jpg" optional-new-name.jpg
    ```
  - This copies the source image into `SampleCards` (creates the folder if missing).

- PowerShell: `tools/save_image.ps1`
  - Usage (PowerShell):
    ```powershell
    .\tools\save_image.ps1 -Source "C:\\Users\\You\\Downloads\\card.jpg" -Name "card1.jpg"
    ```

Notes & deployment checklist
---------------------------
- Large images are stored in IndexedDB and referenced with `indexeddb:<key>` markers in localStorage. `App` resolves those markers to data URLs when rendering.
- Before publishing or pushing a repo publically, consider removing sample images that may contain personal data (e.g., `SampleCards/`) and add them to `.gitignore` if you want to keep them locally.
- The app is a client-side project only; no server-side secrets should be embedded in the repo.
- A **light** Node-based `predeploy-scan` script has been added at `tools/predeploy-scan.js` and is available via `npm run predeploy-scan`.
  - What it checks: common secret patterns (API keys, private key headers, bearer tokens), tracked `.env*` files, and large committed files (>2MB). It will also optionally run `npm test` (single-run under `CI=true`) and `npm audit --audit-level=moderate` when applicable. Note: `npm audit` findings are reported as **warnings only** (non-blocking) so that transitive vulnerabilities do not automatically stop deploys — review and fix them as part of maintenance.
  - How to use: run `npm run predeploy-scan` locally or add it as a step in your CI workflow; the script exits non-zero on any failures (except audit warnings) so CI will stop the deploy when actual blocking checks fail.

- The repository contains `eng.traineddata` (Tesseract English traineddata), a binary language model used by Tesseract/Tesseract.js for OCR; it has been placed in the `public/` folder so it will be served by GitHub Pages after deployment.
  - File: `public/eng.traineddata`
  - Size: ~23 MB (checked in place)
  - Purpose: Provides the English recognition model for OCR; often sourced from the Tesseract tessdata project.
  - License: many tessdata files are Apache-2.0, but verify the original source if you plan to redistribute the file publicly.
  - Notes: Keeping this file in the repo increases clone size; it is safe to keep if you prefer local availability. Alternatives include hosting it externally (GitHub Releases, S3, CDN) and fetching at runtime — Tesseract.js supports loading language data from a URL.

Per your request, `eng.traineddata` is retained in the repository and moved to `public/` so it's accessible to the deployed site.

If you'd like, I can also add instructions for hosting `eng.traineddata` externally and modify `ImageUploader`/OCR loader to fetch it on demand (optional).