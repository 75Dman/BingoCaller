/*
  src/components/PlayerList.js
  Simple list to name players (one per row). Names persist via parent state.
*/
import React from 'react'

export default function PlayerList({ playersRows, setPlayersRows, playersCols, setPlayersCols, showRows, setShowRows, showCols, setShowCols }){
  // if neither rows nor cols are used, render nothing
  if(!playersRows && !playersCols) return null

  const update = (arrSetter, arr, i, val) => {
    const next = (arr || []).slice()
    next[i] = val
    arrSetter(next)
  }

  return (
    <div className="controls">
      <h3>Players</h3>

      <div style={{marginBottom:8}}>
        <label style={{display:'flex',alignItems:'center',gap:8}}>
          <input type="checkbox" checked={!!showRows} onChange={(e)=>setShowRows(e.target.checked)} /> <strong>Show row labels</strong>
        </label>
        <label style={{display:'flex',alignItems:'center',gap:8}}>
          <input type="checkbox" checked={!!showCols} onChange={(e)=>setShowCols(e.target.checked)} /> <strong>Show column labels</strong>
        </label>
      </div>

      {showRows && (
        <div style={{marginBottom:8}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:6}}>Row players</div>
          {(playersRows || []).map((p,i)=> (
            <div key={i} style={{display:'flex',gap:8,alignItems:'center',marginBottom:6}}>
              <label style={{width:60}}>Row {i+1}</label>
              <input value={p ?? ''} onChange={(e)=>update(setPlayersRows, playersRows, i, e.target.value)} />
            </div>
          ))}
        </div>
      )}

      {showCols && (
        <div style={{marginBottom:8}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:6}}>Column players</div>
          {(playersCols || []).map((p,i)=> (
            <div key={i} style={{display:'flex',gap:8,alignItems:'center',marginBottom:6}}>
              <label style={{width:60}}>Col {i+1}</label>
              <input value={p ?? ''} onChange={(e)=>update(setPlayersCols, playersCols, i, e.target.value)} />
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
