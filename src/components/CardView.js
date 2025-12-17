/*
  src/components/CardView.js
  Renders the bingo card as an image with overlaid clickable number boxes.
  Falls back to grid view if no image.
*/
import React, { useState, useRef, useEffect } from 'react' 
import { useLocalStorage } from '../hooks/useLocalStorage'

export default function CardView({ card, playersRows, setPlayersRows, playersCols, setPlayersCols, dabbed, onToggleDab, onToggleDabLine, manualMode, setCard, setDabbed, imageUrl, grid, resizable = true }){
  const [editing, setEditing] = useState(null) // {r,c} for editing

  // image overlay refs/state (moved out of conditional to preserve hooks order)
  const imageContainerRef = useRef(null)
  const imgRef = useRef(null)
  const [imgRect, setImgRect] = useState(null)
  const [containerRect, setContainerRect] = useState(null)
  // average image color for subtle background blending when preview is smaller than the viewport
  const [avgColor, setAvgColor] = useState(null)

  // persisted user-chosen container size (width/height in px)
  const [savedSize, setSavedSize] = useLocalStorage('bingo_cardview_size', { width: null, height: null })
  // whether to show the editable grid below the image (persisted). Default to false per request
  const [showEditableGrid, setShowEditableGrid] = useLocalStorage('bingo_show_editable_grid', false)

  // track and update image/container rects; also react to user-resize via ResizeObserver
  useEffect(()=>{
    const updateRect = () => {
      if (!imageContainerRef.current) return
      const c = imageContainerRef.current.getBoundingClientRect()
      setContainerRect(c)
      if (imgRef.current) {
        const ir = imgRef.current.getBoundingClientRect()
        setImgRect(ir)
      } else {
        setImgRect(c)
      }
    }

    // If the user has a saved size, apply it on mount/load
    if (imageContainerRef.current && savedSize?.width) {
      imageContainerRef.current.style.width = savedSize.width ? `${savedSize.width}px` : ''
      imageContainerRef.current.style.height = savedSize.height ? `${savedSize.height}px` : ''
    }

    updateRect()
    // respond to window resize
    window.addEventListener('resize', updateRect)
    import('../utils/listenerTracker').then(m => { m.registerListener('resize') }).catch(()=>{})
    // respond to scroll events anywhere in the document (use capture so we catch scrolls from overflow:auto containers)
    window.addEventListener('scroll', updateRect, true)
    document.addEventListener('scroll', updateRect, true)
    import('../utils/listenerTracker').then(m => { m.registerListener('scroll'); m.registerListener('scroll') }).catch(()=>{})

    // compute average color for the preview background when the image is loaded or resized
    const computeAvgColor = () => {
      try {
        if (!imgRef.current || !imgRef.current.complete) return
        const canvas = document.createElement('canvas')
        const cw = 40, ch = 40
        canvas.width = cw; canvas.height = ch
        const ctx = canvas.getContext('2d')
        // draw the image scaled down to reduce sampling cost
        ctx.drawImage(imgRef.current, 0, 0, cw, ch)
        const data = ctx.getImageData(0,0,cw,ch).data
        let r=0,g=0,b=0,count=0
        for (let i=0;i<data.length;i+=4) {
          const alpha = data[i+3]
          if (alpha === 0) continue
          r += data[i]; g += data[i+1]; b += data[i+2]; count++
        }
        if (count > 0) {
          r = Math.round(r/count); g = Math.round(g/count); b = Math.round(b/count)
          setAvgColor({ r, g, b })
        }
      } catch (err) {
        // CORS or tainted canvas may cause getImageData to fail; ignore gracefully
        console.debug('[CardView] computeAvgColor failed', err)
        setAvgColor(null)
      }
    }

    // compute color initially and when the image element changes
    computeAvgColor()

    // Use ResizeObserver to detect user-driven container size changes
    let ro = null
    try {
      ro = new ResizeObserver(() => updateRect())
      if (imageContainerRef.current) ro.observe(imageContainerRef.current)
      if (imgRef.current) ro.observe(imgRef.current)
    } catch (err) {
      // ResizeObserver may not be available in all environments; fallback to polling or window resize
      console.debug('[CardView] ResizeObserver not available', err)
    }

    return () => {
      window.removeEventListener('resize', updateRect)
      import('../utils/listenerTracker').then(m => { m.unregisterListener('resize') }).catch(()=>{})
      window.removeEventListener('scroll', updateRect, true)
      document.removeEventListener('scroll', updateRect, true)
      import('../utils/listenerTracker').then(m => { m.unregisterListener('scroll'); m.unregisterListener('scroll') }).catch(()=>{})
      if (ro) ro.disconnect()
    }
  }, [imageUrl, savedSize])

  if (!card) return <div className="card-view">No card loaded.</div>

  // expose a small control to reset container size to auto (helpful after manual resize)
  const resetContainerSize = () => {
    if (!imageContainerRef.current) return
    imageContainerRef.current.style.width = ''
    imageContainerRef.current.style.height = ''
    setSavedSize({ width: null, height: null })
    const r = imageContainerRef.current.getBoundingClientRect()
    setContainerRect(r)
    if (imgRef.current) setImgRect(imgRef.current.getBoundingClientRect())
  }

  // resize handling: allow user to drag the bottom-right handle to resize the image container
  const [resizing, setResizing] = useState(false)
  const resizeRef = useRef(null)
  const startResize = (e) => {
    e.stopPropagation(); e.preventDefault()
    setResizing(true)
    resizeRef.current = { startX: e.clientX, startY: e.clientY, startW: imageContainerRef.current?.clientWidth || 0, startH: imageContainerRef.current?.clientHeight || 0 }
    window.addEventListener('mousemove', doResize)
    window.addEventListener('mouseup', endResize)
    import('../utils/listenerTracker').then(m => { m.registerListener('mousemove'); m.registerListener('mouseup') }).catch(()=>{})
  }
  const doResize = (ev) => {
    if (!resizeRef.current || !imageContainerRef.current) return
    const dx = ev.clientX - resizeRef.current.startX
    const dy = ev.clientY - resizeRef.current.startY
    const newW = Math.max(120, Math.round(resizeRef.current.startW + dx))
    const newH = Math.max(80, Math.round(resizeRef.current.startH + dy))
    imageContainerRef.current.style.width = newW + 'px'
    imageContainerRef.current.style.height = newH + 'px'
    // update measured rects immediately
    const r = imageContainerRef.current.getBoundingClientRect()
    setContainerRect(r)
    if (imgRef.current) setImgRect(imgRef.current.getBoundingClientRect())
  }
  const endResize = () => {
    setResizing(false)
    resizeRef.current = null
    window.removeEventListener('mousemove', doResize)
    window.removeEventListener('mouseup', endResize)
    import('../utils/listenerTracker').then(m => { m.unregisterListener('mousemove'); m.unregisterListener('mouseup') }).catch(()=>{})
    // persist final size
    if (imageContainerRef.current) {
      setSavedSize({ width: imageContainerRef.current.clientWidth, height: imageContainerRef.current.clientHeight })
    }
  }

  const rows = card.length
  const cols = card[0]?.length || 0

  const updateNumber = (r,c,val) => {
    const next = card.map(row=>row.slice())
    next[r][c] = val === '' ? null : isNaN(Number(val)) ? val : Number(val)
    setCard(next)
  }

  const toggleDabForNumber = (num) => {
    // Find position of num in card
    for (let r = 0; r < card.length; r++) {
      for (let c = 0; c < card[r].length; c++) {
        if (String(card[r][c]) === String(num)) {
          onToggleDab(r, c)
          return
        }
      }
    }
  }

  if (imageUrl) {
    // Image view with optional overlay (grid)
    const containerStyle = {position:'relative'}

    // compute overlay cell positions based on grid bbox percentages
    const renderOverlay = () => {
      if (!imgRect || !containerRect || !imageUrl || !grid) return null
      const bbox = grid.bbox
      if (!bbox) return null
      // compute overlay left/top relative to container rect (we position overlay inside container)
      const offsetLeft = imgRect.left - containerRect.left
      const offsetTop = imgRect.top - containerRect.top
      const x0 = offsetLeft + bbox.x0p * imgRect.width
      const y0 = offsetTop + bbox.y0p * imgRect.height
      const width = (bbox.x1p - bbox.x0p) * imgRect.width
      const height = (bbox.y1p - bbox.y0p) * imgRect.height
      const cellW = width / grid.cols
      const cellH = height / grid.rows
      // helper to coerce numeric values and avoid NaN in styles
      const safeNumber = (v, d = 0) => Number.isFinite(Number(v)) ? Number(v) : d
      // overlay container positioned relative to image container
      return (
        <div className="card-overlay" style={{position:'absolute',left:x0,top:y0,width:width,height:height,pointerEvents:'auto'}}>
          {/* Render grid cells only when the grid overlay includes dab */}
          {(grid.overlayType === 'dab' || grid.overlayType === 'both') && (
            Array.from({length: grid.rows}).map((_, r) => (
              <div key={r} style={{position:'relative'}}>
                {Array.from({length: grid.cols}).map((_, c) => {
                  const left = c * cellW
                  const top = r * cellH
                  const isDab = dabbed?.[r]?.[c]
                  return (
                    <div
                      key={c}
                      className={`card-overlay-cell ${isDab ? 'dab' : ''}`}
                      onClick={(e) => { e.stopPropagation(); if (manualMode) onToggleDab(r,c) }}
                      style={{position:'absolute',left:left,top:top,width:Math.max(0,Math.floor(cellW)),height:Math.max(0,Math.floor(cellH)),pointerEvents:'auto'}}
                    />
                  )
                })}
              </div>
            ))
          )}

          {/* row player labels (to left of overlay, clamped inside container) */}
          {grid.playerOverlay?.showRows && (Array.from({length: grid.rows}).map((_, r) => {
            const name = (playersRows && playersRows[r]) || grid.playerOverlay?.rows?.[r] || `Row ${r+1}`
            // use saved normalized centers when available (designer may have non-uniform rows)
            const centerYPctRaw = grid.playerOverlay?.rowCentersPct ? grid.playerOverlay.rowCentersPct[r] : null
            const centerYPct = Number.isFinite(Number(centerYPctRaw)) ? Number(centerYPctRaw) : null
            const centerY = centerYPct != null ? safeNumber(centerYPct * height, (r * cellH + cellH / 2)) : (r * cellH + cellH / 2)

            // dynamic sizing: base font on cell height and width on offset
            const rowOffsetPctRaw = grid.playerOverlay?.rowOffsetPct
            const rowOffsetPct = Number.isFinite(Number(rowOffsetPctRaw)) ? Number(rowOffsetPctRaw) : null
            const rowOffsetFallback = Number.isFinite(Number(grid.playerOverlay?.rowOffset)) ? Number(grid.playerOverlay.rowOffset) : 110
            const rowOffsetPx = safeNumber(rowOffsetPct != null ? Math.round(rowOffsetPct * width) : rowOffsetFallback, rowOffsetFallback)

            // Position relative to the overlay container (not absolute page coords)
            const leftPos = -rowOffsetPx
            const labelH = Math.max(20, Math.min(32, Math.round(cellH * 0.65)))
            const labelW = Math.max(60, Math.min(160, safeNumber(Math.round(rowOffsetPx - 8), 60)))
            const fontSize = Math.max(10, Math.min(18, Math.round(cellH * 0.45)))
            const topPos = safeNumber(centerY - labelH / 2, 0)
            return (
              <div key={'prow'+r} className="player-label row" onClick={(e)=>{ e.stopPropagation(); onToggleDabLine && onToggleDabLine('row', r) }} style={{position:'absolute',left:leftPos,top:topPos,width:labelW,height:labelH,display:'flex',alignItems:'center',padding:'4px 6px',background:'transparent',color:'#012',cursor:'pointer',borderRadius:4,fontSize:fontSize}}>{name}</div>
            )
          }))}

          {/* column player labels (above overlay, rotated) */}
          {grid.playerOverlay?.showCols && (Array.from({length: grid.cols}).map((_, c) => {
            const name = (playersCols && playersCols[c]) || grid.playerOverlay?.cols?.[c] || `Col ${c+1}`
            const centerX = c * cellW + cellW / 2
            const colOffsetPctRaw = grid.playerOverlay?.colOffsetPct
            const colOffsetPct = Number.isFinite(Number(colOffsetPctRaw)) ? Number(colOffsetPctRaw) : null
            const colOffsetFallback = Number.isFinite(Number(grid.playerOverlay?.colOffset)) ? Number(grid.playerOverlay.colOffset) : 36
            const colOffsetPx = safeNumber(colOffsetPct != null ? Math.round(colOffsetPct * height) : colOffsetFallback, colOffsetFallback)
            const labelW = Math.max(20, Math.min(40, Math.round(cellW * 0.8)))
            const labelH = Math.max(60, Math.min(140, safeNumber(Math.round(colOffsetPx - 8), 60)))
            const fontSize = Math.max(10, Math.min(16, Math.round(cellW * 0.4)))
            // position relative to overlay container
            // anchor rotated label by its bottom center so it sits just above the overlay by colOffsetPx
            const topPos = safeNumber(-colOffsetPx - labelH + 8, -colOffsetPx)
            const leftPos = safeNumber(centerX - labelW / 2, 0)
            return (
              <div key={'pcol'+c} className="player-label col" onClick={(e)=>{ e.stopPropagation(); onToggleDabLine && onToggleDabLine('col', c) }} style={{position:'absolute',left:leftPos,top:topPos,width:labelW,height:labelH,display:'flex',alignItems:'center',justifyContent:'center',padding:'4px 6px',background:'transparent',color:'#012',cursor:'pointer',borderRadius:4,transform:'rotate(-90deg)',transformOrigin:'center bottom',fontSize:fontSize}}>{name}</div>
            )
          }))}

        </div>
      )
    }



    const baseBg = 'rgba(6,34,58,0.95)'
    const previewBg = avgColor ? `linear-gradient(rgba(${avgColor.r},${avgColor.g},${avgColor.b},0.06), rgba(${avgColor.r},${avgColor.g},${avgColor.b},0.06)), ${baseBg}` : baseBg

    const headerTitle = resizable ? 'Card View' : 'Bingo Caller Pro'

    return (
      <div className="card-view" style={{background: baseBg, padding:12, borderRadius:6}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h3 style={{margin:0,color:'#fff',display:'flex',alignItems:'center',gap:8}}>
            {!resizable && (
              <svg width="1em" height="1em" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{flex:'0 0 1em'}}>
                <circle cx="32" cy="32" r="30" fill="#fde68a" stroke="#c47c00" strokeWidth="3" />
                <circle cx="26" cy="22" r="6" fill="white" />
                <text x="32" y="38" textAnchor="middle" fontSize="18" fontWeight="700" fill="#9b3412">B</text>
              </svg>
            )}
            {headerTitle}
          </h3>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{fontSize:12,color:'#cbd5e1'}}>Click numbers in the grid below to dab (manual)</div>
            <label style={{display:'flex',alignItems:'center',gap:8,color:'#cbd5e1'}}><input type="checkbox" checked={showEditableGrid} onChange={(e)=>setShowEditableGrid(e.target.checked)} /> Show editable grid</label>
            {resizable && <button className="btn-muted" onClick={resetContainerSize} title="Reset preview size">Reset size</button>}
          </div>
        </div>
        <div style={{marginTop:8}}>
          <div ref={imageContainerRef} style={{...containerStyle, width: 'auto', height: 'auto', resize: 'none', position: 'relative', display: 'inline-block', background: previewBg}}>
            <img ref={imgRef} src={imageUrl} alt="Bingo Card" style={{maxWidth:'100%', height:'auto', display:'block', border: '1px solid #ddd'}} onLoad={()=>{
              if (!imageContainerRef.current) return
              const r = imageContainerRef.current.getBoundingClientRect()
              setImgRect(r)
              // recompute average color when image loads
              try {
                const canvas = document.createElement('canvas')
                const cw = 40, ch = 40
                canvas.width = cw; canvas.height = ch
                const ctx = canvas.getContext('2d')
                ctx.drawImage(imgRef.current, 0, 0, cw, ch)
                const data = ctx.getImageData(0,0,cw,ch).data
                let rr=0,gg=0,bb=0,cnt=0
                for (let i=0;i<data.length;i+=4) {
                  const a = data[i+3]
                  if (a === 0) continue
                  rr += data[i]; gg += data[i+1]; bb += data[i+2]; cnt++
                }
                if (cnt > 0) setAvgColor({ r: Math.round(rr/cnt), g: Math.round(gg/cnt), b: Math.round(bb/cnt) })
              } catch (err) {
                setAvgColor(null)
              }
            }} />
            {renderOverlay()}

            {/* resize handle - pinned to bottom-right of the displayed image */}
            {resizable && (imgRect && containerRect ? (
              (() => {
                const handleSize = 14
                const left = Math.round((imgRef.current.getBoundingClientRect().right - containerRect.left) - handleSize - 4)
                const top = Math.round((imgRef.current.getBoundingClientRect().bottom - containerRect.top) - handleSize - 4)
                return <div onMouseDown={startResize} style={{position:'absolute',left:left,top:top,width:handleSize,height:handleSize,background:'rgba(0,0,0,0.2)',border:'1px solid rgba(255,255,255,0.6)',cursor:'nwse-resize',borderRadius:2}} title="Drag to resize" />
              })()
            ) : (
              <div onMouseDown={startResize} style={{position:'absolute',right:2,bottom:2,width:14,height:14,background:'rgba(0,0,0,0.2)',border:'1px solid rgba(255,255,255,0.6)',cursor:'nwse-resize',borderRadius:2}} title="Drag to resize" />
            ))}
          </div>
        </div>
        {/* show the editable grid below for manual dabbing (toggleable) */}
        {showEditableGrid && (
          <div style={{marginTop:12}}>
            {card.map((row, r) => (
              <div key={r} style={{marginBottom:6}}>
                <div className="player-row">
                  <strong style={{width:90,color:'#fff'}}>{(playersRows && playersRows[r]) || `Row ${r+1}`}</strong>
                  <div style={{flex:1,display:'grid',gridTemplateColumns:`repeat(${cols},1fr)`,gap:6}}>
                    {row.map((cell, c) => (
                      <div key={c} className={`cell ${dabbed?.[r]?.[c] ? 'dab' : ''}`} onClick={()=>{ if (manualMode) onToggleDab(r,c) }}>
                        <div>
                          <input value={cell ?? ''} onChange={(e)=>updateNumber(r,c,e.target.value)} style={{width:'100%',border:'none',background:'transparent',textAlign:'center'}} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
  // Simple grid view (no automatic overlays or player detection)
  const headerTitle = resizable ? 'Card View' : 'Bingo Caller Pro'
  return (
    <div className="card-view">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h3 style={{display:'flex',alignItems:'center',gap:8}}>
          {!resizable && (
            <svg width="1em" height="1em" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{flex:'0 0 1em'}}>
              <circle cx="32" cy="32" r="30" fill="#fde68a" stroke="#c47c00" strokeWidth="3" />
              <circle cx="26" cy="22" r="6" fill="white" />
              <text x="32" y="38" textAnchor="middle" fontSize="18" fontWeight="700" fill="#9b3412">B</text>
            </svg>
          )}
          {headerTitle}
        </h3>
        <div style={{fontSize:12,color:'#666'}}>Tap numbers to dab (manual)</div>
      </div>
      <div style={{marginTop:8}}>
        {card.map((row, r) => (
          <div key={r} style={{marginBottom:6}}>
            <div className="player-row">
              <strong style={{width:90}}>{(playersRows && playersRows[r]) || `Row ${r+1}`}</strong>
              <div style={{flex:1,display:'grid',gridTemplateColumns:`repeat(${cols},1fr)`,gap:6}}>
                {row.map((cell, c) => (
                  <div key={c} className={`cell ${dabbed?.[r]?.[c] ? 'dab' : ''}`} onClick={()=>{ if (manualMode) onToggleDab(r,c) }}>
                    <div>
                      <input value={cell ?? ''} onChange={(e)=>updateNumber(r,c,e.target.value)} style={{width:'100%',border:'none',background:'transparent',textAlign:'center'}} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

