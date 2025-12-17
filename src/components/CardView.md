# CardView Component — Reference

> Note: card-related warnings and confirmations use the themed **"Bingo Caller Pro"** modal (bingo-ball icon) for a consistent UI.

**Location:** `src/components/CardView.js`

**Purpose:**
- Renders the bingo card image (if present) and an editable grid view for manual dabbing and verification.
- Supports a resizable preview, persistent preview size, and a precise overlay computed from saved grid `bbox` and the actual rendered image rect.

---

## Key features & behavior
- **Resizable preview & persistence:** Users can resize the image preview using a pinned drag handle; the chosen size persists in `localStorage` under `bingo_cardview_size`. A **Reset size** button restores automatic sizing.
- **Accurate overlay math:** CardView uses `imgRef` and `imageContainerRef` and prefers `img.getBoundingClientRect()` to compute precise overlay positions so saved `bbox` values remain correct across CSS scaling and letterboxing.
- **Resize/Scroll robustness:** The component uses `ResizeObserver` (when available) and scroll capture listeners to recompute overlay positions on window resize and scroll. When mounted inside `BingoCardView` it dispatches a short mount-time tick to ensure overlays align immediately on entering fullscreen.
- **Dab visuals:** Dabbed cells render a rounded ink-drop visual (radial gradient, inner highlight, and depth) to mimic an actual dabber mark.
- **Player labels:** If `grid.playerOverlay` is present, CardView renders row/column labels using normalized centers or pixel offsets saved by the designer to ensure label placement matches the designer preview.
- **Defensive styling:** Numeric values used in inline styles are guarded against `NaN`/missing values to avoid console warnings.

---

## Props & usage (summary)
- `card` — 2D matrix for values
- `playersRows`, `playersCols` & setters — global player lists
- `dabbed`, `onToggleDab(r,c)` — dab state and manual toggle handler
- `manualMode` — when true enables manual dab clicks
- `grid` — optional saved grid object with `bbox`, `values`, `playerOverlay` and offsets
- `imageUrl` — `data:` URL or resolved `indexeddb:` marker

---

## Implementation notes
- The overlay is built by converting normalized `{x0p,y0p,x1p,y1p}` into pixel positions using the actual `imgRect` and `containerRect` so overlay cells remain correctly aligned.
- CardView ensures overlays are only rendered when `grid.overlayType === 'dab'` or `'both'` (player-only overlays do not implicitly enable dab rendering).
- Overlay cells enable pointer events; clicking calls `onToggleDab` (if `manualMode` is true) and stops propagation so verification clicks don't bubble.

---

## Integrations
- When `CardView` is used inside `BingoCardView` (fullscreen), `WinModal` is rendered inside the fullscreen wrapper so it appears above the internal confetti canvas and the win chime plays via `playWinSound()`.

---

## Styling
- See `.card-overlay`, `.card-overlay-cell`, and `.card-overlay-cell.dab` in `src/styles.css` for the ink-drop visuals, hover outlines, and overlay styling.

---

## TODOs
- Add a verification toggle to show/hide overlay cell numbers as a compact QA feature.
- Add unit tests for the overlay coordinate math.

---

If you'd like, I can produce a small Storybook story or an automated visual test that renders a known image + grid and verifies overlay coordinates programmatically.
