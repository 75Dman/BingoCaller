# ImageUploader Component — Reference

**Location:** `src/components/ImageUploader.js`

> Note: upload warnings or size/format confirmations use the themed **"Bingo Caller Pro"** modal (bingo-ball icon).

**Purpose:**
- Handles image upload and runs OCR via `useOCR`.
- Converts uploaded images to persistable formats (small images → data URLs saved in localStorage; large images → stored in IndexedDB and referenced by an `indexeddb:<key>` marker).
- Returns OCR-parsed rows via `onResult({ rows, imageUrl })` where `imageUrl` is a data URL or an `indexeddb:` marker.

---

## Behavior & implementation notes
- Small images are converted to `data:` URLs and persisted to `imageRef` in `localStorage`.
- Large images (default threshold ~2MB) are saved to IndexedDB using `src/utils/idb.js`, and `imageRef` is set to `indexeddb:<key>`; `App` resolves these markers at runtime to a display data URL for rendering.
- When storing to IndexedDB the component shows a small warning and provides a control to remove the stored file if needed.

## OCR flow
- `doOCR()` uses `useOCR().recognize(file)` (runs in a worker). After parsing it calls `onResult({ rows, imageUrl })`.
- `submitFallback()` supports manual input fallback and yields `rows` and the same `imageUrl` markers.

---

## Notes
- Keep an eye on storage size when using data URLs; IndexedDB is used to avoid inflating `localStorage` with large strings.

*Created: updated reference for `ImageUploader.js`.*