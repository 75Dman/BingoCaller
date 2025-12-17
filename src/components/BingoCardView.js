import React, { useEffect, useRef } from 'react'
import CardView from './CardView'
import ConfirmModal from './ConfirmModal'
import confetti from 'canvas-confetti'
import { playWinSound } from '../utils/sound'

export default function BingoCardView({ winner, onWinClose, ...props }){
  const rootRef = useRef(null)
  const confCanvasRef = useRef(null)
  const confettiInstanceRef = useRef(null)

  // When the fullscreen view mounts, trigger a resize/scroll event so CardView recomputes overlay positions immediately
  useEffect(()=>{
    // run a couple times spaced out so layout has a chance to settle
    const tick = () => {
      window.dispatchEvent(new Event('resize'))
      window.dispatchEvent(new Event('scroll'))
    }
    const t1 = setTimeout(() => { tick(); requestAnimationFrame(tick) }, 20)
    const t2 = setTimeout(() => { tick(); }, 200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  // create a canvas inside this fullscreen view for confetti so it appears above modals
  useEffect(()=>{
    if (!rootRef.current) return
    const container = rootRef.current
    const canvas = document.createElement('canvas')
    canvas.style.position = 'absolute'
    canvas.style.left = '0'
    canvas.style.top = '0'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.pointerEvents = 'none'
    canvas.style.zIndex = 10005 // above modal
    container.appendChild(canvas)
    confCanvasRef.current = canvas
    confettiInstanceRef.current = confetti.create(canvas, { resize: true })
    return () => {
      try { if (confettiInstanceRef.current) confettiInstanceRef.current.reset(); } catch (e) {}
      if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas)
      confCanvasRef.current = null
      confettiInstanceRef.current = null
    }
  }, [rootRef.current])

  // Fire confetti inside this view when a winner is set
  useEffect(()=>{
    if (!winner) return
    const inst = confettiInstanceRef.current || confetti
    // small multi-burst effect
    inst({ particleCount: 60, spread: 60, origin: { y: 0.35 } })
    setTimeout(()=> inst({ particleCount: 120, spread: 100, origin: { y: 0.6 } }), 250)
    setTimeout(()=> inst({ particleCount: 80, spread: 140, origin: { y: 0.4 } }), 900)
    try { playWinSound() } catch (e) { }
  }, [winner])

  const message = winner?.player ? <span><strong>{winner.player}</strong> has bingo!</span> : (winner?.axis === 'col' ? <span>Column {winner.index+1} has bingo!</span> : <span>Row {winner?.index+1} has bingo!</span>)

  return (
    <div ref={rootRef} style={{width:'100vw',height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(6,34,58,0.95)',position:'relative'}}>
      <div style={{width:'100%',height:'100%',overflow:'auto'}}>
        <CardView {...props} resizable={false} />
        {/* render the themed winner modal inside the fullscreen wrapper so it is visible in-game */}
        <ConfirmModal open={!!winner} title={"Bingo Caller Pro"} onConfirm={onWinClose} onCancel={onWinClose} confirmLabel={'OK'} cancelLabel={'Close'}>
          <div style={{fontSize:16}}>{message}</div>
        </ConfirmModal>
      </div>
    </div>
  )
}
