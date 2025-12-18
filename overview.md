# Project Overview

> Note: For a consistent, themed experience, warnings and confirmations use the **"Bingo Caller Pro"** modal (bingo-ball icon) instead of native browser dialogs.

**App Overview**
- Client-only React app to load a custom Bingo card image, extract numbers with OCR (Tesseract.js), assign player names, and run a ball picker. Bingo Caller Pro supports manual and auto dab modes, detects wins with confetti and a short chime, and includes a fullscreen **Game Mode** for live play.

**File Structure**
- `public/index.html` — App shell.
- `src/index.js` — React entry.
- `src/App.js` — Main coordinator component (settings include `soundEnabled`, `autoMode`).
- `src/components` — focused components: `ImageUploader`, `CardView`, `BingoCardView`, `BingoBallView`, `BallPicker`, `GridDesigner`, `WinModal`, `ConfirmModal`.
- `src/hooks` — `useOCR`, `useLocalStorage`.
- `src/utils` — `confetti`, `sound.js`, `idb.js`, `listenerTracker.js`.
- `src/styles.css` — Theme and layout.

**Key Components & Their Roles**
- `ImageUploader` — Uploads and persists images (IndexedDB for large files) and runs OCR.
- `CardView` — Renders the card image or grid and overlay; supports resizable preview, scroll/resize capture, and ink-drop dab visuals.
- `BingoCardView` — Fullscreen card wrapper that hosts an internal confetti canvas and shows in-view winner modals.
- `BingoBallView` — Fullscreen draw stage with rolling sound during draws and the **Balls in Play** grid.
- `BallPicker` — Inline picker for manual draws and called history.
- `GridDesigner` — Design mode for drawing grid bounding boxes, dragging dividers, and saving player overlay offsets/centers.
- `ConfirmModal` — Themed confirmation modal (replaces native confirm calls).

**Dev & Debugging Tools**
- `listenerTracker` and `ListenerDebug` — Dev-only utilities to surface global listener counts and help detect leaks (useful for troubleshooting mouse responsiveness).

**Audio & Visuals**
- Rolling draw sound: prefers `src/utils/ballsincage.wav` if present; falls back to a synthetic rolling noise generator.
- Win chime: prefers `src/utils/BingoTusch.mp3` if present; falls back to WebAudio synthesized chime.
- A single topbar Sound toggle (persisted) controls all app audio.

**Language data**
- `eng.traineddata` — English Tesseract traineddata is included in the repository and used by the app for OCR (file is approximately 23 MB). Verify the source and license (often Apache-2.0) before redistributing. If you prefer to reduce repository size, host the traineddata externally (e.g., GitHub Releases or an S3 bucket) and configure Tesseract.js to load the language data from a URL at runtime.

**User Flow**
1. Upload a Bingo card image and run OCR.
2. Review and edit parsed numbers; save a grid via the Grid Designer if needed.
3. Start Game Mode (Game On) to enter fullscreen Card/Ball views.
4. Draw numbers (Space or Draw button); when Auto is on matching cells are auto-dabbed.
5. When a win is detected you will see an in-view winner modal and confetti; a chime plays (if not muted).

**How to Extend**
- Add additional win patterns, per-player cards, or a networked sync to enable remote players.
- Add more rigorous OCR preprocessing (deskew / binarize) for harder images.
- Add an accessibility pass (focus management for fullscreen, ARIA labels for the Ball draw controls).

---

If you'd like, I can also add a CI `predeploy-scan` step to run a quick secrets grep before any publish.