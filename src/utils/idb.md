# IndexedDB helper — Reference

> Note: idb-related warnings (e.g., read failures) are surfaced via the themed **"Bingo Caller Pro"** modal when shown to users.

**Location:** `src/utils/idb.js`

**Purpose:**
- Minimal helper functions for storing and retrieving image files in IndexedDB under a named database (`bingo-images`) and object store (`images`). This is used by `ImageUploader` to persist large uploaded images without storing big data URLs in localStorage.

## Functions
- `openDB()` — opens the `bingo-images` database (version 1) and ensures the `images` object store exists; returns the DB instance.
- `putFile(key, file)` — store a `File` (or Blob) under the given key and return the key (prefixed with `img_` + timestamp).
- `getFile(key)` — retrieve a `File` by key (resolves to `null` if missing).
- `deleteFile(key)` — remove the stored file for the key.

## Usage notes
- When `ImageUploader` stores a large image it returns `imageRef: 'indexeddb:<key>'` where `<key>` is the ID returned by `putFile`.
- `App` recognizes `indexeddb:` markers and resolves them to a data URL at runtime for display (`displayImageUrl`) so the app can persist only a small marker in `localStorage` while keeping the binary in IndexedDB.

## Caveats
- This helper is minimal and intended for small sets of images. For heavy usage consider a more robust library or a backend storage option.

*Created: automated reference for `idb.js`.*