# PlayerList Component — Reference

**Location:** `src/components/PlayerList.js`

**Purpose:**
- Provides editable player name lists and toggles to control whether row and/or column player labels are shown on the card overlay.

> Note: confirmation or warning prompts (e.g., bulk changes) use the themed **"Bingo Caller Pro"** modal.
- Supports two separate lists: row player names (`playersRows`) and column player names (`playersCols`). This makes it possible to display only row labels, only column labels, both, or neither.

---

## Props
- `playersRows` (string[]) — persisted list of row player names
- `setPlayersRows(fn)` — setter for row player list
- `playersCols` (string[]) — persisted list of column player names
- `setPlayersCols(fn)` — setter for column player list
- `showRows` (boolean) — whether row labels are currently enabled
- `setShowRows(bool)` — setter to toggle visibility of row labels (also persisted via `gridDefaults` in App)
- `showCols` (boolean) — whether column labels are currently enabled
- `setShowCols(bool)` — setter to toggle visibility of column labels

---

## Behavior
- Displays two checkboxes at the top: **Show row labels** and **Show column labels** (the same visibility toggles are also available in the Grid Designer header for quick access while designing).
- Shows editable lists for row players and/or column players depending on those toggles. Name inputs remain editable both here and in the Grid Designer so users can manage player names from either place.
- Editing and toggling here updates the persisted player lists and toggles so the overlay rendering and the Grid Designer can pick up the current preference; edits to names are applied immediately and will be reflected in the Grid Designer preview and in `CardView`.
- Live sync: if you change the number of rows/columns in the defaults (main screen) or in the Grid Designer, the player lists will resize immediately to match (existing names are preserved; new slots are filled with `Player n`).

---

## Integration notes
- Typical usage (in `App.js`):
```jsx
<PlayerList
  playersRows={playersRows}
  setPlayersRows={setPlayersRows}
  playersCols={playersCols}
  setPlayersCols={setPlayersCols}
  showRows={gridDefaults?.showPlayerRows}
  setShowRows={(v)=>setGridDefaults(d=>({ ...d, showPlayerRows: v }))}
  showCols={gridDefaults?.showPlayerCols}
  setShowCols={(v)=>setGridDefaults(d=>({ ...d, showPlayerCols: v }))}
/>
```

*Created: automated reference for `PlayerList.js`.*