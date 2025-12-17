# BallPicker Component — Reference

**Location:** `src/components/BallPicker.js`

**Purpose:**
- UI for calling bingo balls, managing called history, and controlling Auto Dab.

---

## Props
- `maxBall` (number) — maximum ball number allowed.
- `setMaxBall(number)` — setter for the max ball limit.
- `autoMode` (boolean) — whether automatic calling is enabled.
- `setAutoMode(boolean)` — setter to toggle auto mode.
- `called` (number[]) — list of called numbers.
- `onCall(number, opts)` — called when a number is chosen (opts can include `{auto}`).
- `resetGame()` — reset/clear called numbers.
- `currentBall` (number|null) — most recently called ball.

## Behavior
- Renders controls for drawing numbers (random next or manual input), displays called history, and shows the current ball.
- `autoMode` defaults to **On** and will call `onCall(num, {auto:true})` when drawing.
- Input UX: the Max Balls input uses a local edit buffer and commits changes only on blur or Enter to avoid resetting when the input is cleared while editing.

---

*Created: updated reference for `BallPicker.js`.*