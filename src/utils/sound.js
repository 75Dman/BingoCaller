// If a bundled audio file is present, prefer it for the win chime; otherwise fallback to WebAudio synthesis.
import winSoundUrl from './Bingo Tusch.mp3'
import rollingSoundUrl from './ballsincage.wav'

// internal synthesized chime (fallback)
function playWinChime(){
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const now = ctx.currentTime
    const master = ctx.createGain(); master.gain.setValueAtTime(0.0001, now); master.connect(ctx.destination)

    // quick arpeggio of three notes
    const freqs = [880, 1320, 1760]
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(f, now + i * 0.06)
      const g = ctx.createGain(); g.gain.setValueAtTime(0, now + i * 0.06)
      g.gain.linearRampToValueAtTime(0.12, now + i * 0.06 + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.06 + 0.35)
      o.connect(g); g.connect(master); o.start(now + i * 0.06); o.stop(now + i * 0.06 + 0.4)
    })

    master.gain.exponentialRampToValueAtTime(0.9, now + 0.001)
    master.gain.exponentialRampToValueAtTime(0.0001, now + 1.2)
    setTimeout(()=>{ try{ ctx.close() }catch(e){} }, 1600)
  } catch (err) {
    console.debug('playWinChime failed', err)
  }
}

function isSoundEnabled(){
  try {
    const raw = localStorage.getItem('bingo_settings')
    if (!raw) return true
    const s = JSON.parse(raw)
    if (typeof s.soundEnabled === 'boolean') return s.soundEnabled
  } catch (e) {}
  return true
}

export function playWinSound(){
  if (!isSoundEnabled()) return
  try {
    if (typeof Audio !== 'undefined' && winSoundUrl) {
      const a = new Audio(winSoundUrl)
      a.volume = 0.95
      a.play().catch(()=>{
        // fallback to chime
        playWinChime()
      })
      return
    }
  } catch (err) {
    console.debug('playWinSound (file) failed', err)
  }
  // fallback
  playWinChime()
}

// Rolling/noise sound for ball-draw effect. Returns a stop function.
export function startRollingSound(){
  if (!isSoundEnabled()) return () => {}
  // If a bundled rolling sound exists, use it for a realistic effect (looped); otherwise fall back to synthetic noise
  try {
    if (typeof Audio !== 'undefined' && rollingSoundUrl) {
      const a = new Audio(rollingSoundUrl)
      a.loop = true
      a.volume = 0.6
      // try to play; if blocked, return a no-op stop
      a.play().catch(()=>{})
      const stop = (fade = 0.12) => {
        // fade out volume smoothly
        const steps = 8
        const stepTime = (fade * 1000) / steps
        let cur = a.volume
        const dec = cur / steps
        const iv = setInterval(()=>{
          cur = Math.max(0, cur - dec)
          a.volume = cur
        }, stepTime)
        setTimeout(()=>{ clearInterval(iv); try { a.pause(); a.currentTime = 0 } catch(e){} }, fade*1000 + 20)
      }
      return stop
    }
  } catch (err) {
    console.debug('startRollingSound (file) failed', err)
  }

  // fallback to synthesized rolling noise
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return () => {}
    const ctx = new AudioCtx()
    const now = ctx.currentTime

    // noise buffer
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * 1))
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i=0;i<bufferSize;i++) data[i] = (Math.random()*2-1) * 0.25

    const src = ctx.createBufferSource(); src.buffer = buffer; src.loop = true
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(800 + Math.random()*1200, now)
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.setValueAtTime(200 + Math.random()*200, now)
    const gain = ctx.createGain(); gain.gain.setValueAtTime(0.0001, now)

    src.connect(lp); lp.connect(hp); hp.connect(gain); gain.connect(ctx.destination)
    src.start()

    // fade in
    gain.gain.linearRampToValueAtTime(0.5, now + 0.05)

    // modulate filter and gain rapidly to simulate rolling
    const iv = setInterval(()=>{
      lp.frequency.linearRampToValueAtTime(400 + Math.random()*1600, ctx.currentTime + 0.05)
      hp.frequency.linearRampToValueAtTime(200 + Math.random()*400, ctx.currentTime + 0.05)
      gain.gain.linearRampToValueAtTime(0.2 + Math.random()*0.45, ctx.currentTime + 0.05)
    }, 120)

    const stop = (fade = 0.12) => {
      clearInterval(iv)
      gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + fade)
      setTimeout(()=>{ try{ src.stop(); ctx.close() }catch(e){} }, (fade+0.05)*1000)
    }
    return stop
  } catch (err) {
    console.debug('startRollingSound failed', err)
    return () => {}
  }
}

export default { playWinSound, startRollingSound }
