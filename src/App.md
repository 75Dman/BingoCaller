# src/App.js

## Overview ✅

`src/App.js` is the main application container for Bingo Caller Pro. It coordinates:

- OCR upload and parsing (`ImageUploader`) 🔍
- Card state and manual edits (`CardView`) 🃏
- Ball picking and call history (`BallPicker` / `BingoBallView`) 🎱
- Dab overlay/grid design (`GridDesigner`) 🔧
- Win detection and celebratory effects (`WinModal`, confetti, win chime) 🎉

It persists key state with a small `useLocalStorage` hook and uses IndexedDB for large images when needed.

> Note: user-facing confirmations and warnings use the themed **"Bingo Caller Pro"** `ConfirmModal` (bingo-ball icon) instead of native `confirm()` dialogs.

---

## Key persisted keys (localStorage) 🔐

- `bingo_card` — the card matrix
- `bingo_players` — player names
- `bingo_dabbed` — dabbed (marked) matrix (only present when overlay is a dab overlay)
- `bingo_called` — called ball history
- `bingo_settings` — settings such as `maxBall`, `autoMode`, and `soundEnabled` (see below)
- `bingo_grid` — saved grid object from the designer

---

## Notable UI & features 🔧

- **Game Mode / Fullscreen Views** — A prominent **Game On** control starts the running game and presents two fullscreen views selectable via segmented control:
  - `BingoCardView` — fullscreen card display (hosts in-view win modal and confetti canvas)
  - `BingoBallView` — fullscreen draw stage (Balls in Play grid + draw controls)

- **Auto Dab** — Auto Dab defaults to **On**. When enabled, drawn numbers automatically mark matching cells on the card.

- **Sound toggle** — A single, persisted **Sound** toggle lives in the top bar (next to the Auto pill) and controls all in-app sounds (win chime, rolling draw sound). The setting is stored in `settings.soundEnabled` and sound helpers early-return when sound is disabled.

- **Themed confirmations** — Native `confirm()` dialogs were replaced with `ConfirmModal` for a consistent, branded experience.

- **IndexedDB image storage** — Large uploaded images (> ~2MB) are stored in IndexedDB and referenced by an `indexeddb:<key>` marker in `localStorage`. `App` resolves these markers to data URLs at runtime for display.

- **Dev instrumentation** — A development-only `listenerTracker` and `ListenerDebug` overlay were added to surface global listener counts. This helped find and fix orphaned global `mousemove`/`mouseup` listeners in `GridDesigner`.

---

## Important functions & behaviors 🧭

- `setCardFromOCR({rows, imageUrl})` — sets card from OCR, stores `imageRef` as a data URL or `indexeddb:<key>`, and reinitializes relevant state (dabbed, called, winner) appropriately.

- `startGame()` — validates saved grid vs `settings.maxBall` (shows `ConfirmModal` if mismatched), then resets state and enters game mode.

- `handleNumberCalled(num, {auto})` — records a call, sets `currentBall`, and when `auto` and `dabbed` exist, auto-dabs matching numbers on the card.

- `resetGame()` — clears `called`, `currentBall`, `dabbed` (if present), and `winner`.

- `saveGrid(g)` — saves designer output; **only initializes the dabbed matrix when the grid overlay type includes dab** (`'dab'` or `'both'`). Player overlay offsets/centers are persisted in `g.playerOverlay`.

---

## Potential causes for mouse input issues (what was checked) ⚠️

- Orphaned global listeners in `GridDesigner` — fixed by tracking exact handler function references and removing them reliably on drag end or unmount.
- Confetti canvas — confetti is rendered into a canvas with `pointer-events:none` except for the in-view confetti canvas in `BingoCardView` which is intentionally non-interactive to avoid intercepting events.
- Heavy OCR jobs — Tesseract runs in a worker, but very large jobs can still impact responsiveness; consider instrumenting long jobs if you see UI freezes.

---

## Notes for integrators & contributors

- If you add new sounds, check `src/utils/sound.js` and ensure `isSoundEnabled()` is respected; the topbar toggle is the single UI to control all app audio.
- Use `ListenerDebug` in development to monitor global listener counts when adding window-level listeners.
- Large image persistence uses IndexedDB; `App` resolves `indexeddb:` markers automatically on load.

---

If you'd like, I can also add a short pre-deploy checklist that scans the repo for common secrets and suggests `.gitignore` entries for sample images and other local-only files.

---

If you'd like, I can open a PR that adds a small unit/integration test, or further harden the designer (throttle mouse handling or convert handlers to stable `useCallback`/ref-based implementations). Let me know which you'd prefer. 🔧
