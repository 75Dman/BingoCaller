# GridDesigner Component — Reference

**Location:** `src/components/GridDesigner.js`

**Purpose:**
- Interactive modal for drawing and editing a rectangular bingo grid on an uploaded image, tuning rows/cols, numbering order, and editing player overlay offsets/centers. Produces a normalized grid object consumable by `App` and `CardView`.

> Note: designer warnings or confirmations use the themed **"Bingo Caller Pro"** `ConfirmModal`.

---

## Key updates & notes
- **Listener safety:** Global listeners used during drag/resize (e.g., `mousemove`, `mouseup`) are tracked by exact function references and removed on drag end or component unmount. This avoids orphaned listeners that can cause UI lag or mouse problems.
- **Player overlay preview & drag-to-adjust:** You can drag row/column label previews directly in the designer to fine-tune offsets and centers; these values are saved to `grid.playerOverlay` and consumed by `CardView` for consistent label placement.
- **Resizable modal container:** The modal is resizable by the user (`resize: both`), launches in a large viewport-friendly size, and ensures the image container scales so the preview stays usable while resizing.

---

## Grid object shape (what `onSave` receives)
```json
{
  bbox: { x0p: 0.1, y0p: 0.05, x1p: 0.9, y1p: 0.95 },
  rows: 20,
  cols: 5,
  numbering: { mode: 'sequential', order: 'column', first: 1, last: 100 },
  values: [[...], [...], ...],
  playerOverlay: {
    rows: ["Player 1", ...],
    cols: ["P1","P2",...],
    rowOffset: 110,
    colOffset: 36,
    rowOffsetPct: 0.2,
    colOffsetPct: 0.08,
    rowCentersPct: [0.03,0.08,...],
    colCentersPct: [0.05,0.15,...],
    showRows: true,
    showCols: false
  }
}
```

---

## Interaction summary
- Pointer down inside container: starts draw / move / resize depending on proximity to rect edges.
- Dragging dividers: start with `startDrag`; `endDrag` removes registered global listeners reliably.
- Dragging player labels: direct drag persists offsets and normalized centers for `playerOverlay`.
- `generateSequential()` and `updateCell(r,c,v)` behave as before; `handleSave()` validates `minCellPx` and includes any player overlay fields.

---

## Tips & TODOs
- Improve pointer event handling for touch by moving to `pointerdown`/`pointermove`/`pointerup` to improve cross-device behavior.
- Add undo/redo stacks for divider moves and label adjustments for easier recovery during complex edits.

*Created: automated reference for `GridDesigner.js` — updated to reflect listener cleanup and player overlay drag persistence.*
## Classnames / styles used (so LLMs can find styling in `src/styles.css`)
- `.grid-designer-cell` — classes used for preview cell boxes.
- The component inlines many styles; outer highlight styles are applied inline on the rectangle element when `hoverEdges` indicate edge proximity.

---

## Edge cases & validations
- Save is disabled if `rect` is null or `values` is null, or when `cellTooSmall` is `true` (cells smaller than `minCellPx`).
- Divider dragging enforces `minCellPx` between adjacent dividers (prevents collapsing a cell below the limit).
- Resizing from edges constrains min width/height based on `minCellPx * cols` or `minCellPx * rows` respectively.

---

## Integration notes
- Typical call-site (in `App.js`) will be something like:
```jsx
<GridDesigner
  imageUrl={imageUrl}
  initialGrid={currentGrid}
  initialDefaults={gridDefaults}
  onSave={(grid) => { saveGrid(grid); closeDesigner(); }}
  onCancel={() => closeDesigner()}
/>
```
- `saveGrid(grid)` should convert `bbox` percent values to the coordinate system your app expects (the component already returns normalized percentages).

---

## TODOs and possible improvements
- Improve touch support: attach `pointerdown`/`pointermove`/`pointerup` for better cross-device handling. (Implemented)
- Mobile: the designer now opens full-screen on narrow viewports (<=640px) so the image preview has priority and controls move below the preview; the overlay covers the full viewport from left→right and top→bottom so the bingo card fills the screen and the user must scroll down to access dab settings / defaults and player settings / defaults. The component detects small screens at runtime (window width <= 640px) via `window.matchMedia('(max-width:640px)')` and switches to a true fullscreen modal where the image preview consumes the visible viewport height and controls are stacked underneath. Divider hit targets are slightly increased for touch and the modal padding and corners are optimized for small screens.
- Default overlay type: the default `overlayType` now defaults to **`both`** (player labels + dab overlay) unless overridden in your saved `grid` or `gridDefaults`.
- Unsaved preview indicator: when you draw or modify a grid, a small **"Preview — Unsaved"** badge appears in the preview area so mobile users know the overlay isn't persisted until they press **Save Grid**.
- Label clamping: row/column player labels are now clamped so they do not render far off the left/top of the overlay on small screens. Also, designer now clamps saved `rowOffset`/`colOffset` to the overlay size so saved grids are more likely to display labels correctly on small devices.
- Save on mobile: minimum cell size threshold is reduced on narrow viewports so valid small grids can be saved from handheld devices.
- Add small draggable corner handles for an easier resize affordance on touch devices.
- Provide keyboard nudging for divider positions and allow undo/redo for divider moves.
- Consider persisting the image as base64 (or storing uploads in persistent blob storage) so image URLs survive reloads.
- Add unit tests for `generateSequential`, `computeBboxPct`, and gutter boundary conditions.

---

## Mobile testing steps (quick)
1. Open the app on a phone or in DevTools device emulator (choose a width <= 520px).
2. Open **Design Dab Grid** — the modal should occupy the full screen and the image preview should take most of the space.
3. Draw a bounding box; drag dividers and labels with touch and ensure labels remain visible and clamped to the overlay edge.
4. If cells appear small, you should still be able to save; Save will be disabled only if cells are too small for reliable interaction.
5. After saving, open the card in the main view to verify overlay alignment and label placement.

**Testing helper:** there is a temporary **Force mobile** toggle in the designer header (button labeled **Force mobile**; when active it reads **Mobile (forced)**) that forces the mobile/layout preview so you can test behavior without an actual handset; the toggle is intended to be removed after testing.

---

## Quick reference — variables and types
- `rect: {x0:number,y0:number,x1:number,y1:number} | null`
- `rowPos: number[]` (length rows+1)
- `colPos: number[]` (length cols+1)
- `values: (number|null)[][]`
- `dragRef.current` — object describing active drag
- `minCellPx` — number (18)

---

If you'd like, I can also:
- Add inline JSDoc comments directly above functions in `GridDesigner.js` to help further LLM-assisted edits ✅
- Extract some helper logic (e.g., generateSequential, computeBboxPct) into a small module for unit testing and reuse ✅

---

*Created: automated reference for `GridDesigner.js` — edit as needed.*
