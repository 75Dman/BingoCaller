import React, { useState, useEffect, useRef } from 'react'
import { startRollingSound } from '../utils/sound'

export default function BingoBallView({ onDraw, called = [], currentBall = null, resetGame, maxBall = 75, setMaxBall, autoMode = true, setAutoMode = () => {} }){
  const [anim, setAnim] = useState(false)

  const numbers = Array.from({ length: maxBall }, (_, i) => i + 1)

  const rollStopRef = useRef(null)
  const drawNext = () => {
    // choose a random number not in called
    const pool = []
    for (let i=1;i<=maxBall;i++) if (!called.includes(i)) pool.push(i)
    if (pool.length === 0) return
    const idx = Math.floor(Math.random() * pool.length)
    const num = pool[idx]
    // trigger animation then call
    setAnim(true)
    // start rolling sound
    try { rollStopRef.current = startRollingSound() } catch (e) {}
    setTimeout(()=>{
      setAnim(false)
      // stop rolling sound when number displays
      try { if (rollStopRef.current) { rollStopRef.current(); rollStopRef.current = null } } catch (e) {}
      onDraw(num, { auto: !!autoMode })
    }, 700)
  }

  useEffect(()=>{
    const onKey = (e) => {
      if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); drawNext() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [called, maxBall])

  return (
    <div className="bingo-ball-view" style={{width:'100vw',height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',background:'#061a36'}}>
      <div className="bingo-ball-flex" style={{width:'100%',maxWidth:1100,display:'flex',gap:20,alignItems:'flex-start',padding:18}}>

        {/* Balls grid (left on wide, below on mobile) */}
        <div className="balls-grid" style={{width:300}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
            <div style={{fontSize:16,fontWeight:700}}>Balls in Play</div>
            <div style={{fontSize:12,color:'#cbd5e1'}}>{called.length}/{maxBall}</div>
          </div>
          <div className="balls-grid-inner" style={{display:'grid',gridTemplateColumns:'repeat(10,1fr)',gap:8}}>
            {numbers.map(n => {
              const isCurrent = Number(currentBall) === n
              const wasCalled = called.includes(n)
              // show X only for previously called numbers (not the current one)
              const showX = wasCalled && !isCurrent
              return (
                <div key={n} className={`ball-cell ${isCurrent ? 'current' : ''} ${showX ? 'called' : ''}`} style={{position:'relative',height:36,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:6,background:isCurrent ? '#fde68a' : 'rgba(255,255,255,0.04)',color:isCurrent ? '#111' : '#fff',fontWeight:700,border:isCurrent ? '2px solid #c47c00' : '1px solid rgba(255,255,255,0.04)'}}>
                  <span style={{fontSize:12}}>{n}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Draw area */}
        <div className="ball-draw-area" style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
            <div style={{fontSize:20}}>Bingo Draw</div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginLeft:8}}>
              <div style={{fontSize:12,color:'#cbd5e1'}}>Auto:</div>
              <button onClick={()=>setAutoMode(!autoMode)} style={{padding:'6px 10px',background: autoMode ? '#0b3d91' : 'transparent',color:'#fff',border: '1px solid rgba(255,255,255,0.06)',borderRadius:6}}>{autoMode ? 'On' : 'Off'}</button>
            </div>
          </div>

          <div style={{width:260,height:260,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:260,background:'#fff',color:'#111',fontSize:64,boxShadow: anim ? '0 0 24px rgba(255,255,255,0.9)' : '0 8px 24px rgba(0,0,0,0.6)',transition:'box-shadow 300ms ease'}}>
            {currentBall || '-'}
          </div>

          <div style={{marginTop:18,display:'flex',gap:12}}>
            <button className="btn-primary" onClick={drawNext}>Draw Next</button>
            <button className="btn-muted" onClick={resetGame}>Reset</button>
          </div>
          <div style={{marginTop:18,fontSize:12,color:'#cbd5e1'}}>Press Space to draw. Called: {called.length}/{maxBall}</div>
        </div>

      </div>
    </div>
  )
}
