/*
  src/utils/confetti.js
  Wrapper around canvas-confetti to fire a celebratory burst.
*/
import confetti from 'canvas-confetti'

export function fireConfetti(){
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } })
}
