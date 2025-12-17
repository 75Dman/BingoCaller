# BingoBallView Component — Reference

**Location:** `src/components/BingoBallView.js`

**Purpose:**
- Fullscreen view that focuses on drawing bingo balls and showing the current ball prominently. Notifies the app (`onDraw`) so `CardView`/`BingoCardView` can auto-dab matching numbers.

**Key behaviors**
- **Balls in Play grid:** Shows numbers 1..`maxBall` with the current ball highlighted and previously called numbers dimmed and shown with a red number mark.
- **Rolling sound:** A rolling sound plays while a draw animation is active. If `src/utils/ballsincage.wav` is present it is used (looped), otherwise a synthesized rolling noise is used as a fallback. The rolling sound stops when the final number is revealed.
- **Auto Dab UI:** Auto defaults to **On** and is toggleable in the view. When Auto is on, drawn numbers cause matching cells to be dabbed automatically.
- **Accessibility / Controls:** Press Space to draw, or use the Draw button; UI exposes a small indicator and toggle for Auto.

---

## Props
- `onDraw(num, opts)` — called when a number is drawn; `opts` can include `{auto}`
- `called` — list of already called numbers
- `currentBall` — last drawn number
- `resetGame()` — reset history and dabs
- `maxBall` / `setMaxBall` — configuration for the range of balls

---

## Notes
- Ensure `isSoundEnabled()` from `src/utils/sound.js` returns true if you want rolling sound to play; the topbar sound toggle controls this globally.
- Rolling sound playback is resilient to autoplay blocking: if the audio element cannot play it falls back gracefully to a synthesized noise.

*Created: reference for the Ball draw stage and rolling audio behavior.*