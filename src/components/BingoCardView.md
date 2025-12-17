# BingoCardView Component — Reference

> Note: game-time confirmations or warnings use the themed **"Bingo Caller Pro"** modal (bingo-ball icon).

**Location:** `src/components/BingoCardView.js`

**Purpose:**
- Fullscreen wrapper around `CardView` used during game mode. The view is locked to the viewport and disables user resizing so the overlay math is stable at fullscreen.

---

## Props
- All props are forwarded to `CardView`. `resizable` is forced to `false` by the wrapper.

---

## Behavior
- Renders a full-viewport centered `CardView` instance suitable for the live game display.
- Designed to be used only while the app is in game mode (started from the main screen Start button).

*Created: simple wrapper to reuse existing `CardView` logic in fullscreen.*