/*
  src/components/BallPicker.js
  Handles drawing random balls, keeping history, and exposing the current ball.
*/
import React, { useState, useEffect } from 'react'

function randomPick(max, excluded){
  const pool = []
  for(let i=1;i<=max;i++) if(!excluded.includes(i)) pool.push(i)
  if(pool.length===0) return null
  return pool[Math.floor(Math.random()*pool.length)]
}

export default function BallPicker({ maxBall, setMaxBall, autoMode, setAutoMode, called, onCall, resetGame, currentBall }){
  const [animating, setAnimating] = useState(false)
  // local input state to avoid forcing value when user clears field
  const [inputMax, setInputMax] = useState(String(maxBall))

  useEffect(()=>{
    setInputMax(String(maxBall))
  }, [maxBall])

  const commitMax = () => {
    const n = parseInt(inputMax, 10)
    if (!Number.isFinite(n) || n < 1) {
      // reset to current maxBall
      setInputMax(String(maxBall))
    } else {
      setMaxBall(n)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter') commitMax()
  }

  const draw = ()=>{
    if(animating) return
    setAnimating(true)
    setTimeout(()=>{
      const pick = randomPick(maxBall, called)
      if(pick) onCall(pick)
      setAnimating(false)
    }, 600)
  }

  return (
    <div className="controls">
      <h3>Bingo Ball Picker</h3>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <label>Max Balls:</label>
        <input type="number" value={inputMax} onChange={(e)=>setInputMax(e.target.value)} onBlur={commitMax} onKeyDown={handleKey} style={{width:80}} />
        <label style={{marginLeft:8}}>Auto Dab:</label>
        <input type="checkbox" checked={autoMode} onChange={(e)=>setAutoMode(e.target.checked)} />
      </div>
      <div style={{marginTop:10,display:'flex',alignItems:'center',gap:12}}>
        <button onClick={draw} disabled={animating}> {animating ? 'Drawing...' : 'Draw Ball'}</button>
        <button onClick={resetGame}>Reset Dabs</button>
      </div>
      <div style={{marginTop:12}}>
        <div>Current Ball:</div>
        <div className="ball-current">{currentBall ?? '-'}</div>
        <div className="history">
          {called.map(n => <div key={n} className="ball">{n}</div>)}
        </div>
      </div>
    </div>
  )
}
