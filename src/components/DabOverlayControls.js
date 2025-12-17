/*
  src/components/DabOverlayControls.js
  Small control panel placed above Players to open the Grid Designer
*/
import React from 'react'

export default function DabOverlayControls({ grid, defaults, setDefaults, onDesign, onClear, playersRows, setPlayersRows, playersCols, setPlayersCols }){
  // helper to resize a players array preserving existing names and filling defaults
  const resizePlayers = (arr, size) => {
    const next = (arr || []).slice(0, size)
    while (next.length < size) next.push(`Player ${next.length+1}`)
    return next
  }

  return (
    <div className="controls dab-overlay-card" style={{marginBottom:12, padding:12}}>
      <div className="dab-overlay-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <strong style={{color:'#fff'}}>🖍️ Dab Overlay</strong>
          <div style={{fontSize:12,color:'#cbd5e1',marginTop:4}}>Define a dabbable grid for the uploaded card image.</div>
        </div>
        <div>
          <button className="btn-primary" onClick={onDesign} style={{marginRight:8}}>Design Grid</button>
          <button className="btn-muted" onClick={onClear} disabled={!grid}>Clear Grid</button>
        </div>
      </div>

      <div className="defaults-row" style={{marginTop:10}}>
        <div style={{fontSize:12,color:'#cbd5e1',marginRight:8,minWidth:120}}>Defaults before design:</div>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <label style={{fontSize:12,display:'flex',alignItems:'center',gap:6}}>
            <span>Rows</span>
            <input type="number" value={defaults.rows} min={1} max={50} onChange={(e)=>{
              const n = Number(e.target.value)
              setDefaults(d=>({ ...d, rows: n }))
              if (setPlayersRows) setPlayersRows(prev => resizePlayers(prev, n))
            }} style={{width:60,background:'transparent',color:'#fff',border:'1px solid rgba(255,255,255,0.06)',padding:4,borderRadius:4}} />
          </label>
          <label style={{fontSize:12,display:'flex',alignItems:'center',gap:6}}>
            <span>Cols</span>
            <input type="number" value={defaults.cols} min={1} max={100} onChange={(e)=>{
              const n = Number(e.target.value)
              setDefaults(d=>({ ...d, cols: n }))
              if (setPlayersCols) setPlayersCols(prev => resizePlayers(prev, n))
            }} style={{width:80,background:'transparent',color:'#fff',border:'1px solid rgba(255,255,255,0.06)',padding:4,borderRadius:4}} />
          </label>
          <label style={{fontSize:12,display:'flex',alignItems:'center',gap:6}}>
            <span>Start</span>
            <input type="number" value={defaults.firstNum ?? 1} min={0} max={999} onChange={(e)=>setDefaults(d=>({ ...d, firstNum: Number(e.target.value) }))} style={{width:80,background:'transparent',color:'#fff',border:'1px solid rgba(255,255,255,0.06)',padding:4,borderRadius:4}} />
          </label>
          <label style={{fontSize:12}}>
            Numbering
            <select value={defaults.order} onChange={(e)=>setDefaults(d=>({ ...d, order: e.target.value }))} style={{marginLeft:6,background:'transparent',color:'#fff',border:'1px solid rgba(255,255,255,0.06)',padding:4,borderRadius:4}}>
              <option value="column">Down columns (default)</option>
              <option value="row">Across rows</option>
            </select>
          </label>

          <label style={{fontSize:12,display:'flex',alignItems:'center',gap:6}}>
            <span>Overlay</span>
            <select value={defaults.overlayType || 'dab'} onChange={(e)=>setDefaults(d=>({ ...d, overlayType: e.target.value }))} style={{marginLeft:6,background:'transparent',color:'#0b3d91',border:'1px solid rgba(255,255,255,0.06)',padding:4,borderRadius:4}}>
              <option value="dab">Dab overlay</option>
              <option value="player">Player overlay</option>
              <option value="both">Both</option>
            </select>
          </label>

          <label style={{fontSize:12,display:'flex',alignItems:'center',gap:6}}>
            <span>Players</span>
            <input type="number" value={defaults.playerCount ?? 20} min={1} max={100} onChange={(e)=>setDefaults(d=>({ ...d, playerCount: Number(e.target.value) }))} style={{width:80,background:'transparent',color:'#fff',border:'1px solid rgba(255,255,255,0.06)',padding:4,borderRadius:4}} />
          </label>

          <label style={{fontSize:12,marginLeft:8,color:'#cbd5e1',display:'flex',alignItems:'center',gap:6}}>
            <input type="checkbox" checked={defaults.scrambled} onChange={(e)=>setDefaults(d=>({ ...d, scrambled: e.target.checked }))} /> <span>Scrambled</span>
          </label>
        </div>
      </div>

      {grid && (
        <div style={{marginTop:8,fontSize:12,color:'#cbd5e1'}}>
          Current grid: <strong>{grid.rows}×{grid.cols}</strong> — numbering: <strong>{grid.numbering?.order || 'column'}</strong>
        </div>
      )}
    </div>
  )
}
