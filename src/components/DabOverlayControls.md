# DabOverlayControls Component — Reference

**Location:** `src/components/DabOverlayControls.js`

**Purpose:**
- Small control panel placed above the Players list that exposes defaults used when opening the Grid Designer and quick actions to open/clear the grid.
- Allows changing default rows/cols/numbering/overlay type and player count; changing rows/cols will resize the global `playersRows` / `playersCols` if the setters are passed in.

> Note: any confirmation or warning prompts originating here use the themed **"Bingo Caller Pro"** modal.

---

## Exports
- **default**: `DabOverlayControls(props)`

## Props
- `grid` (object|null) — current saved grid (optional).
- `defaults` (object) — defaults for the designer (rows, cols, order, firstNum, scrambled, overlayType, playerCount, etc.).
- `setDefaults(fn)` — setter for defaults.
- `onDesign()` — callback to open the Grid Designer.
- `onClear()` — callback to clear the current grid.
- `playersRows` (string[] | undefined) — optional global rows list.
- `setPlayersRows(fn | undefined)` — optional setter to update global rows list.
- `playersCols` (string[] | undefined) — optional global cols list.
- `setPlayersCols(fn | undefined)` — optional setter to update global cols list.

## Behavior & notes
- Renders controls to adjust default rows, columns, start number, numbering order, overlay type, and player count.
- Inputs for **Rows**, **Cols**, and **Start (firstNum)** use buffered string state while editing so the user can clear a field without it snapping back to `0` (the component validates and only updates `setDefaults` when a non-empty, numeric value is present; empty fields are restored on blur to a sensible default).
- When the rows or columns defaults are changed, `DabOverlayControls` will resize the corresponding global `playersRows` / `playersCols` lists (if setter props are provided), preserving existing names and filling new entries with `Player n`.
- Exposes a Design Grid button to open the Grid Designer and a Clear Grid button to clear the current grid.

---

*Created: reference for `DabOverlayControls.js`.*