# WinModal Component — Reference

**Location:** `src/components/WinModal.js`

**Purpose:**
- Announces a winner using the themed `ConfirmModal` UI and triggers the short celebratory chime. When in fullscreen `BingoCardView`, the modal is rendered inside the fullscreen wrapper so it appears above the in-view confetti canvas.

---

## Exports
- **default**: `WinModal({ open, onClose, winner })`

## Props
- `open` (boolean) — whether the modal is visible.
- `onClose` (fn) — callback invoked when the user presses Close.
- `winner` (object|null) — winner metadata; may include `{ axis: 'row'|'col', index: number, player?: string }`.

## Behavior
- Renders a modal with a message such as "<player> has bingo!" or "Row N has bingo!".
- On open, the component will attempt to play the bundled `src/utils/Bingo Tusch.mp3` (if present) or fall back to a synthesized chime. The sound respects the global `settings.soundEnabled` flag.
- When in the fullscreen `BingoCardView`, the modal appears within the wrapper so confetti from `BingoCardView` is visible above the app UI.

---

*Created: reference updated to highlight in-view behavior and sound integration.*