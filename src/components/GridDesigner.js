/*
  src/components/GridDesigner.js
  Minimal grid designer overlay: draw rectangle, set rows/cols, choose ordering
  and either auto-fill sequential numbers (column-major default) or manual fill.
*/
import React, { useRef, useState, useEffect } from 'react'

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)) }

export default function GridDesigner({ imageUrl, initialGrid, initialDefaults, onSave, onCancel, playersRows, setPlayersRows, playersCols, setPlayersCols }){
  const imgRef = useRef(null)
  const containerRef = useRef(null)
  const [drawing, setDrawing] = useState(false)
  const [rect, setRect] = useState(initialGrid?.bbox ? {...initialGrid.bbox} : null)
  const [startPt, setStartPt] = useState(null)
  const [rows, setRows] = useState(initialGrid?.rows ?? initialDefaults?.rows ?? 5)
  const [cols, setCols] = useState(initialGrid?.cols ?? initialDefaults?.cols ?? 20)
  const [order, setOrder] = useState((initialGrid?.numbering?.order) || initialDefaults?.order || 'column')
  const [scrambled, setScrambled] = useState(initialGrid?.numbering?.mode === 'manual' || initialDefaults?.scrambled || false)
  const [firstNum, setFirstNum] = useState(initialGrid?.numbering?.first ?? initialDefaults?.firstNum ?? 1)
  const [lastNum, setLastNum] = useState(initialGrid?.numbering?.last ?? (rows*cols))
  const [values, setValues] = useState(initialGrid?.values || null)
  // overlay/player mode
  const [overlayType, setOverlayType] = useState(initialGrid?.playerOverlay ? (initialDefaults?.overlayType || 'both') : (initialDefaults?.overlayType || 'dab'))
  const [playerRows, setPlayerRows] = useState(initialGrid?.playerOverlay?.rows || playersRows || Array.from({length:rows},(_,i)=>`Player ${i+1}`))
  const [playerCols, setPlayerCols] = useState(initialGrid?.playerOverlay?.cols || playersCols || Array.from({length:cols},(_,i)=>`Player ${i+1}`))
  const [rowOffset, setRowOffset] = useState(initialGrid?.playerOverlay?.rowOffset ?? (initialDefaults?.playerRowOffset ?? 110))
  const [colOffset, setColOffset] = useState(initialGrid?.playerOverlay?.colOffset ?? (initialDefaults?.playerColOffset ?? 36))
  const [showPlayerRows, setShowPlayerRows] = useState(initialGrid?.playerOverlay?.showRows ?? (initialDefaults?.showPlayerRows ?? true))
  const [showPlayerCols, setShowPlayerCols] = useState(initialGrid?.playerOverlay?.showCols ?? (initialDefaults?.showPlayerCols ?? false))


  // divider positions (px offsets inside rect)
  const [rowPos, setRowPos] = useState(null) // length rows+1
  const [colPos, setColPos] = useState(null) // length cols+1
  const dragRef = useRef(null) // {type:'row'|'col'|'resize'|'move', idx, startClient, startPos}
  const addedListenersRef = useRef(null) // store actual added listener references so they can be removed reliably
  const [hoverEdges, setHoverEdges] = useState({ left:false, right:false, top:false, bottom:false })

  // initialize row/col positions when rect or rows/cols change
  useEffect(() => {
    if (!rect) return
    const h = rect.y1 - rect.y0
    const w = rect.x1 - rect.x0
    const rp = Array.from({length: rows+1}, (_,i) => Math.round(i * h / rows))
    const cp = Array.from({length: cols+1}, (_,i) => Math.round(i * w / cols))
    setRowPos(rp)
    setColPos(cp)
    // ensure player arrays match sizes locally
    setPlayerRows(prev => {
      const next = (prev || []).slice(0, rows)
      while (next.length < rows) next.push(`Player ${next.length+1}`)
      return next
    })
    setPlayerCols(prev => {
      const next = (prev || []).slice(0, cols)
      while (next.length < cols) next.push(`Player ${next.length+1}`)
      return next
    })
    // sync local names from global lists if provided (keeps designer up-to-date when PlayerList changes)
    if (playersRows) {
      const next = (playersRows || []).slice(0, rows)
      while (next.length < rows) next.push(`Player ${next.length+1}`)
      setPlayerRows(next)
    }
    if (playersCols) {
      const next = (playersCols || []).slice(0, cols)
      while (next.length < cols) next.push(`Player ${next.length+1}`)
      setPlayerCols(next)
    }
    // also sync global player lists if setters were provided
    if (setPlayersRows) setPlayersRows(prev => {
      const next = (prev || []).slice(0, rows)
      while (next.length < rows) next.push(`Player ${next.length+1}`)
      return next
    })
    if (setPlayersCols) setPlayersCols(prev => {
      const next = (prev || []).slice(0, cols)
      while (next.length < cols) next.push(`Player ${next.length+1}`)
      return next
    })
  }, [rect, rows, cols])

  useEffect(()=>{ setLastNum(rows*cols) }, [rows, cols])

  // keep local player arrays in sync when global player lists change
  useEffect(() => {
    if (!playersRows) return
    const next = (playersRows || []).slice(0, rows)
    while (next.length < rows) next.push(`Player ${next.length+1}`)
    setPlayerRows(next)
  }, [playersRows, rows])

  useEffect(() => {
    if (!playersCols) return
    const next = (playersCols || []).slice(0, cols)
    while (next.length < cols) next.push(`Player ${next.length+1}`)
    setPlayerCols(next)
  }, [playersCols, cols])

  // Mouse/touch handlers to draw bbox relative to image client rect
  const cornerTol = 14
  const onPointerDown = (e) => {
    if (!containerRef.current) return
    const rectC = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rectC.left
    const y = e.clientY - rectC.top

    // If rect exists, check for edge/corner proximity for resize/move
    if (rect) {
      const rx0 = rect.x0, ry0 = rect.y0, rx1 = rect.x1, ry1 = rect.y1
      const nearLeft = Math.abs(x - rx0) <= cornerTol
      const nearRight = Math.abs(x - rx1) <= cornerTol
      const nearTop = Math.abs(y - ry0) <= cornerTol
      const nearBottom = Math.abs(y - ry1) <= cornerTol
      const inside = x >= rx0 && x <= rx1 && y >= ry0 && y <= ry1
      if (nearLeft || nearRight || nearTop || nearBottom) {
        // start resizing from the corner/edge
        dragRef.current = { type: 'resize', edges: { left: nearLeft, right: nearRight, top: nearTop, bottom: nearBottom }, startClientX: e.clientX, startClientY: e.clientY, startRect: { ...rect } }
        // store exact references so we can remove the same functions later
        addedListenersRef.current = { move: onPointerMove, up: endDrag }
        window.addEventListener('mousemove', onPointerMove)
        window.addEventListener('mouseup', endDrag)
        // dev-only listener tracking
        import('../utils/listenerTracker').then(m => { m.registerListener('mousemove'); m.registerListener('mouseup') }).catch(()=>{})
        return
      }
      if (inside) {
        // start moving the whole rect
        dragRef.current = { type: 'move', startClientX: e.clientX, startClientY: e.clientY, startRect: { ...rect } }
        addedListenersRef.current = { move: onPointerMove, up: endDrag }
        window.addEventListener('mousemove', onPointerMove)
        window.addEventListener('mouseup', endDrag)
        // dev-only listener tracking
        import('../utils/listenerTracker').then(m => { m.registerListener('mousemove'); m.registerListener('mouseup') }).catch(()=>{})
        return
      }

      // Clicked outside rect: allow starting a new draw anchored at the opposite corner
      const anchorX = x < rx0 ? rx1 : (x > rx1 ? rx0 : (Math.abs(x - rx0) > Math.abs(x - rx1) ? rx0 : rx1))
      const anchorY = y < ry0 ? ry1 : (y > ry1 ? ry0 : (Math.abs(y - ry0) > Math.abs(y - ry1) ? ry0 : ry1))
      setStartPt({ x: anchorX, y: anchorY })
      setDrawing(true)
      return
    }

    // otherwise start a new draw
    setStartPt({x,y})
    setDrawing(true)
  }
  const safeNumber = (v, d = 0) => Number.isFinite(Number(v)) ? Number(v) : d
  const onPointerMove = (e) => {
    // update hover state even when not dragging
    if (!containerRef.current) return
    const rectC = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rectC.left
    const y = e.clientY - rectC.top
    if (!dragRef.current && rect && !drawing) {
      const rx0 = rect.x0, ry0 = rect.y0, rx1 = rect.x1, ry1 = rect.y1
      const nearLeft = Math.abs(x - rx0) <= cornerTol
      const nearRight = Math.abs(x - rx1) <= cornerTol
      const nearTop = Math.abs(y - ry0) <= cornerTol
      const nearBottom = Math.abs(y - ry1) <= cornerTol
      setHoverEdges({ left: nearLeft, right: nearRight, top: nearTop, bottom: nearBottom })
      // set cursor
      if (nearLeft || nearRight) containerRef.current.style.cursor = 'ew-resize'
      else if (nearTop || nearBottom) containerRef.current.style.cursor = 'ns-resize'
      else containerRef.current.style.cursor = ''
    }

    if (dragRef.current) {
      if (dragRef.current.type === 'row') {
        const dy = e.clientY - dragRef.current.startClient
        setRowPos(prev => {
          const next = prev.slice()
          const idx = dragRef.current.idx
          const newVal = clamp(dragRef.current.startPos + dy, 0, rectC.height)
          // enforce min cell px
          const min = minCellPx
          if (newVal - next[idx-1] < min) return prev
          if (next[idx+1] - newVal < min) return prev
          next[idx] = Math.round(newVal)
          return next
        })
      } else if (dragRef.current.type === 'col') {
        const dx = e.clientX - dragRef.current.startClient
        setColPos(prev => {
          const next = prev.slice()
          const idx = dragRef.current.idx
          const newVal = clamp(dragRef.current.startPos + dx, 0, rectC.width)
          const min = minCellPx
          if (newVal - next[idx-1] < min) return prev
          if (next[idx+1] - newVal < min) return prev
          next[idx] = Math.round(newVal)
          return next
        })
      } else if (dragRef.current.type === 'resize') {
        const dr = dragRef.current
        const dx = e.clientX - dr.startClientX
        const dy = e.clientY - dr.startClientY
        const s = dr.startRect
        let nx0 = s.x0, ny0 = s.y0, nx1 = s.x1, ny1 = s.y1
        if (dr.edges.left) nx0 = clamp(s.x0 + dx, 0, s.x1 - minCellPx * cols)
        if (dr.edges.right) nx1 = clamp(s.x1 + dx, nx0 + minCellPx * cols, rectC.width)
        if (dr.edges.top) ny0 = clamp(s.y0 + dy, 0, s.y1 - minCellPx * rows)
        if (dr.edges.bottom) ny1 = clamp(s.y1 + dy, ny0 + minCellPx * rows, rectC.height)
        setRect({ x0: nx0, y0: ny0, x1: nx1, y1: ny1 })
      } else if (dragRef.current.type === 'move') {
        const dr = dragRef.current
        const dx = e.clientX - dr.startClientX
        const dy = e.clientY - dr.startClientY
        const s = dr.startRect
        const width = s.x1 - s.x0
        const height = s.y1 - s.y0
        const nx0 = clamp(s.x0 + dx, 0, rectC.width - width)
        const ny0 = clamp(s.y0 + dy, 0, rectC.height - height)
        setRect({ x0: nx0, y0: ny0, x1: nx0 + width, y1: ny0 + height })
      }
      return
    }
    if (!drawing || !startPt || !containerRef.current) return
    const xClamped = clamp(x, 0, rectC.width)
    const yClamped = clamp(y, 0, rectC.height)
    const x0 = Math.min(startPt.x, xClamped)
    const y0 = Math.min(startPt.y, yClamped)
    const x1 = Math.max(startPt.x, xClamped)
    const y1 = Math.max(startPt.y, yClamped)
    setRect({ x0, y0, x1, y1 })
  }
  const finishDraw = () => { setDrawing(false); setStartPt(null); setHoverEdges({ left:false, right:false, top:false, bottom:false }); if (containerRef.current) containerRef.current.style.cursor = '' }

  // start dragging a divider
  const startDrag = (type, idx, e) => {
    if (!containerRef.current) return
    e.stopPropagation(); e.preventDefault()
    const rectC = containerRef.current.getBoundingClientRect()
    if (type === 'row') {
      dragRef.current = { type:'row', idx, startClient: e.clientY, startPos: rowPos[idx] }
    } else {
      dragRef.current = { type:'col', idx, startClient: e.clientX, startPos: colPos[idx] }
    }
    // attach global listeners and remember the exact references so they can be removed
    addedListenersRef.current = { move: onPointerMove, up: endDrag }
    window.addEventListener('mousemove', onPointerMove)
    window.addEventListener('mouseup', endDrag)
    import('../utils/listenerTracker').then(m => { m.registerListener('mousemove'); m.registerListener('mouseup') }).catch(()=>{})
  }
  const endDrag = () => {
    dragRef.current = null
    if (addedListenersRef.current) {
      window.removeEventListener('mousemove', addedListenersRef.current.move)
      window.removeEventListener('mouseup', addedListenersRef.current.up)
      // dev-only tracking cleanup
      import('../utils/listenerTracker').then(m => { m.unregisterListener('mousemove'); m.unregisterListener('mouseup') }).catch(()=>{})
      addedListenersRef.current = null
    } else {
      // fallback: try removing the handlers directly
      window.removeEventListener('mousemove', onPointerMove)
      window.removeEventListener('mouseup', endDrag)
      import('../utils/listenerTracker').then(m => { m.unregisterListener('mousemove'); m.unregisterListener('mouseup') }).catch(()=>{})
    }
  }

  // Ensure any leftover global listeners are cleaned up on unmount (safety net)
  useEffect(() => {
    return () => {
      if (addedListenersRef.current) {
        window.removeEventListener('mousemove', addedListenersRef.current.move)
        window.removeEventListener('mouseup', addedListenersRef.current.up)
        addedListenersRef.current = null
      }
    }
  }, [])

  // Dragging player label offsets (row labels drag horizontally to adjust rowOffset; column labels drag vertically to adjust colOffset)
  const labelDragRef = useRef(null)
  const labelListenersRef = useRef(null)
  const startLabelDrag = (type, e) => {
    e.stopPropagation(); e.preventDefault()
    if (!containerRef.current || !rect) return
    const start = type === 'row' ? e.clientX : e.clientY
    labelDragRef.current = { type, start, startOffset: type === 'row' ? rowOffset : colOffset }
    const onMove = (ev) => {
      if (!labelDragRef.current) return
      const delta = (labelDragRef.current.type === 'row') ? (ev.clientX - labelDragRef.current.start) : (ev.clientY - labelDragRef.current.start)
      if (labelDragRef.current.type === 'row') setRowOffset(Math.max(4, Math.round(labelDragRef.current.startOffset - delta)))
      else setColOffset(Math.max(4, Math.round(labelDragRef.current.startOffset - delta)))
    }
    const onUp = () => {
      labelDragRef.current = null
      if (labelListenersRef.current) {
        window.removeEventListener('mousemove', labelListenersRef.current.move)
        window.removeEventListener('mouseup', labelListenersRef.current.up)
        import('../utils/listenerTracker').then(m => { m.unregisterListener('mousemove'); m.unregisterListener('mouseup') }).catch(()=>{})
        labelListenersRef.current = null
      }
    }
    labelListenersRef.current = { move: onMove, up: onUp }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    import('../utils/listenerTracker').then(m => { m.registerListener('mousemove'); m.registerListener('mouseup') }).catch(()=>{})
  }
  useEffect(() => {
    return () => {
      if (labelListenersRef.current) {
        window.removeEventListener('mousemove', labelListenersRef.current.move)
        window.removeEventListener('mouseup', labelListenersRef.current.up)
        labelListenersRef.current = null
      }
    }
  }, [])

  // generate values for sequential fill
  const generateSequential = () => {
    const total = rows*cols
    const seq = []
    let value = Number(firstNum)
    for (let i=0;i<total;i++) { seq.push(value); value = value + 1 }
    // arrange according to order
    const mat = Array.from({length:rows}, ()=>Array.from({length:cols}, ()=>null))
    let idx = 0
    if (order === 'column') {
      for (let c=0;c<cols;c++){
        for (let r=0;r<rows;r++){
          mat[r][c] = seq[idx++]
        }
      }
    } else {
      for (let r=0;r<rows;r++){
        for (let c=0;c<cols;c++){
          mat[r][c] = seq[idx++]
        }
      }
    }
    setValues(mat)
  }

  useEffect(()=>{ if (!scrambled) generateSequential() }, [rows, cols, order, firstNum, lastNum, scrambled])

  // snap bounding rect to the full image/container
  const snapToImage = () => {
    if (!containerRef.current) return
    const r = containerRef.current.getBoundingClientRect()
    setRect({ x0: 0, y0: 0, x1: r.width, y1: r.height })
  }

  // check minimum cell size and compute metrics
  const minCellPx = 18
  const rectWidth = rect ? (rect.x1 - rect.x0) : 0
  const rectHeight = rect ? (rect.y1 - rect.y0) : 0
  const cellWidth = rectWidth && cols ? rectWidth / cols : 0
  const cellHeight = rectHeight && rows ? rectHeight / rows : 0
  const cellTooSmall = (cellWidth < minCellPx) || (cellHeight < minCellPx)

  const updateCell = (r,c,v) => {
    const next = values.map(row=>row.slice())
    next[r][c] = v === '' ? null : Number(v)
    setValues(next)
  }

  const computeBboxPct = () => {
    // compute normalized bbox (prefer percent of the image area if available, else container)
    if (!rect || !containerRef.current) return null
    const rectC = containerRef.current.getBoundingClientRect()
    // if we have an image element, compute bbox relative to the image displayed rect inside the container
    if (imgRef && imgRef.current) {
      const imgR = imgRef.current.getBoundingClientRect()
      const offsetLeft = imgR.left - rectC.left
      const offsetTop = imgR.top - rectC.top
      const x0p = clamp((rect.x0 - offsetLeft) / imgR.width, 0, 1)
      const y0p = clamp((rect.y0 - offsetTop) / imgR.height, 0, 1)
      const x1p = clamp((rect.x1 - offsetLeft) / imgR.width, 0, 1)
      const y1p = clamp((rect.y1 - offsetTop) / imgR.height, 0, 1)
      return { x0p, y0p, x1p, y1p, designWidth: Math.round(imgR.width), designHeight: Math.round(imgR.height) }
    }
    const x0p = rect.x0 / rectC.width
    const y0p = rect.y0 / rectC.height
    const x1p = rect.x1 / rectC.width
    const y1p = rect.y1 / rectC.height
    return { x0p, y0p, x1p, y1p }
  }

  const handleSave = () => {
    if (cellTooSmall) return
    // build grid object
    const bbox = computeBboxPct()
    const numbering = scrambled ? { mode: 'manual' } : { mode: 'sequential', order, first: Number(firstNum), last: Number(lastNum) }
    const grid = { bbox, rows: Number(rows), cols: Number(cols), numbering, values }
    if (overlayType === 'player' || overlayType === 'both') {
      // save both absolute px offsets (for backward compatibility) and normalized offsets
      // Prefer measuring overlay size in image-space when available (computeBboxPct supplies designWidth/designHeight)
      const overlayPxWidth = bbox?.designWidth ? Math.round((bbox.x1p - bbox.x0p) * bbox.designWidth) : (rect ? (rect.x1 - rect.x0) : 0)
      const overlayPxHeight = bbox?.designHeight ? Math.round((bbox.y1p - bbox.y0p) * bbox.designHeight) : (rect ? (rect.y1 - rect.y0) : 0)
      const rowOffsetPct = overlayPxWidth ? Number(rowOffset) / overlayPxWidth : 0
      const colOffsetPct = overlayPxHeight ? Number(colOffset) / overlayPxHeight : 0
      // compute normalized centers for each row/col from rowPos/colPos so player labels can be placed independently
      let rowCentersPct = null
      let colCentersPct = null
      if (rect && rowPos && colPos) {
        const rectH = rect.y1 - rect.y0
        const rectW = rect.x1 - rect.x0
        rowCentersPct = Array.from({length: rows}).map((_, i) => {
          const start = rowPos[i]
          const end = rowPos[i+1]
          const center = (start + end) / 2
          return rectH ? (center / rectH) : 0
        })
        colCentersPct = Array.from({length: cols}).map((_, i) => {
          const start = colPos[i]
          const end = colPos[i+1]
          const center = (start + end) / 2
          return rectW ? (center / rectW) : 0
        })
      }
      const showRows = !!showPlayerRows
      const showCols = !!showPlayerCols
      grid.playerOverlay = { rows: playerRows.slice(0, rows), cols: playerCols.slice(0, cols), rowOffset: Number(rowOffset), colOffset: Number(colOffset), rowOffsetPct, colOffsetPct, rowCentersPct, colCentersPct, showRows, showCols }
    }
    grid.overlayType = overlayType
    onSave(grid)
  }

  return (
    <div style={{position:'fixed',left:0,top:0,right:0,bottom:0,background:'rgba(0,0,0,0.4)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div className="card-view grid-designer-modal" style={{width:'85vw',height:'85vh',maxWidth:1200,minWidth:520,minHeight:360,overflow:'auto'}}>
        <div className="grid-designer-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h3 style={{margin:0}}>Design Dab Grid</h3>
          <div>
            <div style={{fontSize:12,color:'#cbd5e1',marginBottom:6,textAlign:'right'}}>Drag lower-right corner to resize</div>
            <button className="btn-muted" onClick={onCancel} style={{marginRight:8}}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={!rect || !values}>Save Grid</button>
          </div>
        </div>

        <div style={{marginTop:8,display:'flex',gap:12,alignItems:'stretch',height:'calc(100% - 60px)'}}>
          <div style={{flex:'1 1 auto',minWidth:240,maxWidth:'100%',display:'flex',height:'100%'}}>
            <div className="grid-designer-image-container" ref={containerRef} onMouseDown={onPointerDown} onMouseMove={onPointerMove} onMouseUp={finishDraw} onMouseLeave={finishDraw} style={{height:'100%'}}>
              <img ref={imgRef} src={imageUrl} alt="Design" style={{display:'block',maxWidth:'100%',maxHeight:'100%',objectFit:'contain'}} />
              {/* instructions for drawing */}
              <div style={{position:'absolute',left:8,top:8,background:'rgba(255,255,255,0.95)',padding:'6px 8px',borderRadius:4,fontSize:12,color:'#111'}}>
                Click and drag to draw the grid bounding box. Adjust rows/cols on the right, then Preview or Save.
                <div style={{marginTop:6}}><button onClick={snapToImage}>Snap to image</button></div>
              </div>

              {rect && (
                <div style={{position:'absolute',left:rect.x0,top:rect.y0,width:rect.x1-rect.x0,height:rect.y1-rect.y0,border: hoverEdges.left||hoverEdges.right||hoverEdges.top||hoverEdges.bottom ? '3px solid #f59e0b' : '2px dashed #00A',background: hoverEdges.left||hoverEdges.right||hoverEdges.top||hoverEdges.bottom ? 'rgba(245,158,11,0.06)' : 'rgba(0,160,255,0.08)',boxShadow: hoverEdges.left||hoverEdges.right||hoverEdges.top||hoverEdges.bottom ? '0 4px 12px rgba(245,158,11,0.12)' : 'none',overflow:'hidden'}}>
                  {/* live label showing rows x cols and cell px size */}
                  <div style={{position:'absolute',left:6,top:6,background: hoverEdges.left||hoverEdges.right||hoverEdges.top||hoverEdges.bottom ? '#fff' : 'rgba(255,255,255,0.92)',padding:'4px 6px',borderRadius:3,fontSize:12,color:'#000'}}>{rows} × {cols} — {Math.max(0,Math.floor(cellWidth))}×{Math.max(0,Math.floor(cellHeight))} px</div>
                </div>
              )}

              {/* grid preview inside rect */}
              {rect && values && rowPos && colPos && (
                <div style={{position:'absolute',left:rect.x0,top:rect.y0,width:rect.x1-rect.x0,height:rect.y1-rect.y0,pointerEvents:(overlayType === 'player' || overlayType === 'both') ? 'auto' : 'none',overflow:'visible'}}>
                  {Array.from({length:rows}).map((_,r)=> {
                    const rowH = Math.max(0, rowPos[r+1] - rowPos[r])
                    return (
                      <div key={r} style={{display:'flex',height:rowH + 'px'}}>
                        {Array.from({length:cols}).map((_,c)=> {
                          const colW = Math.max(0, colPos[c+1] - colPos[c])
                          return (
                            <div key={c} className="grid-designer-cell" style={{width: colW + 'px', height: rowH + 'px', fontSize:16, fontWeight:700, color:'#012'}}>
                              {values?.[r]?.[c]}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}

                  {/* render draggable horizontal dividers */}
                  {rowPos.map((p, i) => {
                    // skip first and last (outer border lines optional)
                    if (i === 0 || i === rowPos.length-1) return null
                    const top = p
                    return (
                      <div key={'r'+i} onMouseDown={(e)=>startDrag('row', i, e)} className="designer-divider horizontal" style={{position:'absolute',left:0,top:top-2,width:'100%',height:4,background:'rgba(0,0,0,0.5)',cursor:'ns-resize',pointerEvents:'auto',opacity:0.9}} />
                    )
                  })}

                  {/* render draggable vertical dividers */}
                  {colPos.map((p, i) => {
                    if (i === 0 || i === colPos.length-1) return null
                    const left = p
                    return (
                      <div key={'c'+i} onMouseDown={(e)=>startDrag('col', i, e)} className="designer-divider vertical" style={{position:'absolute',left:left-2,top:0,height:'100%',width:4,background:'rgba(0,0,0,0.5)',cursor:'ew-resize',pointerEvents:'auto',opacity:0.9}} />
                    )
                  })}
                  {/* preview player labels when enabled */}
                  {(overlayType === 'player' || overlayType === 'both') && (
                    <>
                      {/* row labels (to left) - draggable horizontally to adjust rowOffset */}
                      {showPlayerRows && playerRows.slice(0, rows).map((name, r) => {
                        const centerYraw = (rowPos[r] + rowPos[r+1]) / 2
                        const centerY = Number.isFinite(Number(centerYraw)) ? Number(centerYraw) : 0
                        const rowH = Math.max(1, rowPos[r+1] - rowPos[r])
                        const overlayW = rect ? (rect.x1 - rect.x0) : 0
                        const rowOffsetPx = Number.isFinite(Number(rowOffset)) ? Number(rowOffset) : 110
                        const labelH = Math.max(20, Math.min(32, Math.round(rowH * 0.65)))
                        const labelW = Math.max(60, Math.min(160, safeNumber(Math.round(rowOffsetPx - 8), 60)))
                        const fontSize = Math.max(10, Math.min(18, Math.round(rowH * 0.45)))
                        const topPos = safeNumber(centerY - labelH / 2, 0)
                        const leftPos = -rowOffsetPx
                        return (
                          <div key={'prow'+r} className="player-label row" onMouseDown={(e)=>startLabelDrag('row', e)} style={{position:'absolute',left:leftPos,top:topPos,width:labelW,height:labelH,display:'flex',alignItems:'center',padding:'4px 6px',background:'transparent',color:'#012',cursor:'grab',borderRadius:4,fontSize:fontSize}}>{name}</div>
                        )
                      })}

                      {/* column labels (above) - draggable vertically to adjust colOffset */}
                      {showPlayerCols && playerCols.slice(0, cols).map((name, c) => {
                        const centerX = (colPos[c] + colPos[c+1]) / 2
                        const colW = Math.max(1, colPos[c+1] - colPos[c])
                        const colOffsetPx = colOffset
                        const labelW = Math.max(16, Math.min(40, Math.round(colW * 0.8)))
                        const labelH = Math.max(60, Math.min(140, Math.round(colOffsetPx - 8)))
                        const fontSize = Math.max(10, Math.min(16, Math.round(colW * 0.4)))
                        const leftPos = centerX - labelW / 2
                        const topPos = -colOffsetPx - labelH + 8
                        return (
                          <div key={'pcol'+c} className="player-label col" onMouseDown={(e)=>startLabelDrag('col', e)} style={{position:'absolute',left:leftPos,top:topPos,width:labelW,height:labelH,display:'flex',alignItems:'center',justifyContent:'center',padding:'4px 6px',background:'transparent',color:'#012',cursor:'grab',borderRadius:4,transform:'rotate(-90deg)',transformOrigin:'center bottom',fontSize:fontSize}}>{name}</div>
                        )
                      })}
                    </>
                  )}

                </div>
              )}
            </div>
          </div>

          <div style={{width:340}} className="grid-designer-controls">
            <div className="grid-designer-controls-panel">
              <div style={{fontSize:13,fontWeight:700,marginBottom:6}}>Grid Size</div>
              <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
                <label style={{fontSize:13}}>Rows
                  <input type="number" value={rows} min={1} max={50} onChange={(e)=>setRows(Number(e.target.value))} style={{width:70,marginLeft:8}} />
                </label>
                <label style={{fontSize:13}}>Columns
                  <input type="number" value={cols} min={1} max={100} onChange={(e)=>setCols(Number(e.target.value))} style={{width:80,marginLeft:8}} />
                </label>
              </div>

              <div style={{fontSize:13,fontWeight:700,marginBottom:6}}>Numbering</div>
              <div style={{marginBottom:8}}>
                <label style={{display:'block'}}><input type="radio" checked={order==='column'} onChange={()=>setOrder('column')} /> <strong>Down columns</strong> — numbers fill top-to-bottom, then left-to-right (default)</label>
                <label style={{display:'block'}}><input type="radio" checked={order==='row'} onChange={()=>setOrder('row')} /> <strong>Across rows</strong> — numbers fill left-to-right, then top-to-bottom</label>
              </div>

              <div style={{fontSize:13,fontWeight:700,marginBottom:6}}>Mode</div>
              <div style={{marginBottom:8}}>
                <label>
                  <input
                    type="checkbox"
                    checked={scrambled}
                    onChange={(e)=>{
                      const isChecked = e.target.checked
                      setScrambled(isChecked)
                      if (isChecked) {
                        setValues(Array.from({length:rows}, ()=> Array.from({length:cols}, ()=> null)))
                      } else {
                        generateSequential()
                      }
                    }}
                  /> <strong>Scrambled grid</strong> — you will fill numbers manually
                </label>
              </div>

              {!scrambled && (
                <div style={{marginBottom:8}}>
                  <label style={{display:'block'}}>First number (default start)
                    <input type="number" value={firstNum} onChange={(e)=>setFirstNum(Number(e.target.value))} style={{width:100,marginLeft:8}} />
                  </label>
                </div>
              )}

              {scrambled && (
                <div style={{marginTop:8,maxHeight:240,overflow:'auto',border:'1px solid #eee',padding:8}}>
                  <div style={{fontSize:13,fontWeight:600,marginBottom:6}}>Fill numbers manually</div>
                  <div style={{fontSize:12,color:'#333',marginBottom:8}}>Click each cell in the preview to enter a number, or type into the fields below.</div>
                  {Array.from({length:rows}).map((_,r)=> (
                    <div key={r} style={{display:'flex',gap:6,marginBottom:6}}>
                      {Array.from({length:cols}).map((_,c)=> (
                        <input key={c} value={values?.[r]?.[c] ?? ''} onChange={(e)=>updateCell(r,c,e.target.value)} style={{width:48,textAlign:'center'}} />
                      ))}
                    </div>
                  ))}
                </div>
              )}

              <div style={{marginTop:12,display:'flex',gap:8,alignItems:'center'}}>
                <button onClick={generateSequential} style={{marginRight:8}}>Preview Fill</button>
                <button onClick={()=>{ setRows(20); setCols(5); setOrder('column'); setScrambled(false); generateSequential(); }}>Reset Defaults</button>
                <div style={{marginLeft:8,color: cellTooSmall ? '#b00' : '#666', fontSize:12}}>
                  {cellTooSmall ? 'Bounding box too small for selected grid — enlarge box' : `Cell size: ${Math.max(0,Math.floor(cellWidth))}×${Math.max(0,Math.floor(cellHeight))} px`}
                </div>
              </div>

              {/* Player overlay controls */}
              <div style={{marginTop:12}}> 
                <div style={{fontSize:13,fontWeight:700,marginBottom:6}}>Player Overlay</div>
                <div style={{marginBottom:8,display:'flex',gap:12,alignItems:'flex-start',justifyContent:'space-between'}}>
                <div style={{flex:'1 1 auto'}}>
                  <label style={{display:'block'}}>
                    <input type="radio" name="overlayType" checked={overlayType==='dab'} onChange={()=>setOverlayType('dab')} /> <strong>Dab overlay</strong>
                  </label>
                  <label style={{display:'block'}}>
                    <input type="radio" name="overlayType" checked={overlayType==='player'} onChange={()=>setOverlayType('player')} /> <strong>Player overlay</strong>
                  </label>
                  <label style={{display:'block'}}>
                    <input type="radio" name="overlayType" checked={overlayType==='both'} onChange={()=>setOverlayType('both')} /> <strong>Both</strong>
                  </label>
                </div>

                {/* quick toggles to show/hide row/column player labels (moved to the right) */}
                {(overlayType === 'player' || overlayType === 'both') && (
                  <div style={{minWidth:140,display:'flex',flexDirection:'column',gap:8}}>
                    <label style={{fontSize:12}}><input type="checkbox" checked={showPlayerRows} onChange={(e)=>setShowPlayerRows(e.target.checked)} /> Show players in rows</label>
                    <label style={{fontSize:12}}><input type="checkbox" checked={showPlayerCols} onChange={(e)=>setShowPlayerCols(e.target.checked)} /> Show players in columns</label>
                  </div>
                )}
              </div>

                {/* only show player name editors when player overlay is enabled */}
                {(overlayType === 'player' || overlayType === 'both') && (
                  <div style={{marginTop:8,maxHeight:220,overflow:'auto',border:'1px solid #eee',padding:8}}>
                    <div style={{fontSize:12,fontWeight:600,marginBottom:6}}>Player names for rows</div>
                    {playerRows.map((name, i) => (
                      <input key={i} value={name} onChange={(e)=>{
                        const val = e.target.value
                        // update local preview
                        setPlayerRows(prev=>{ const next = prev.slice(); next[i] = val; return next })
                        // update global players immediately so other UIs stay in sync
                        if (setPlayersRows) setPlayersRows(prev => { const next = (prev || []).slice(); next[i] = val; return next })
                      }} style={{width:'100%',marginBottom:6}} />
                    ))}

                    <div style={{fontSize:12,fontWeight:600,marginTop:8,marginBottom:6}}>Player names for columns</div>
                    {playerCols.map((name, i) => (
                      <input key={i} value={name} onChange={(e)=>{
                        const val = e.target.value
                        setPlayerCols(prev=>{ const next = prev.slice(); next[i] = val; return next })
                        if (setPlayersCols) setPlayersCols(prev => { const next = (prev || []).slice(); next[i] = val; return next })
                      }} style={{width:'100%',marginBottom:6}} />
                    ))}

                    <div style={{display:'flex',gap:8,marginTop:6}}>
                      <button onClick={()=>{ const rdef = Array.from({length:rows}, (_,i)=>`Player ${i+1}`); const cdef = Array.from({length:cols}, (_,i)=>`Player ${i+1}`); setPlayerRows(rdef); setPlayerCols(cdef); if (setPlayersRows) setPlayersRows(rdef); if (setPlayersCols) setPlayersCols(cdef); }}>Populate defaults</button>
                      <button onClick={()=>{ const rempR = Array.from({length:rows}, ()=>''); const rempC = Array.from({length:cols}, ()=>''); setPlayerRows(rempR); setPlayerCols(rempC); if (setPlayersRows) setPlayersRows(rempR); if (setPlayersCols) setPlayersCols(rempC); }}>Clear</button>
                    </div>

                    <div style={{marginTop:8,display:'flex',gap:8,alignItems:'center'}}>
                      <label style={{fontSize:12}}>Row label offset (px)
                        <input type="number" value={rowOffset} onChange={(e)=>setRowOffset(Number(e.target.value))} style={{width:80,marginLeft:8}} />
                      </label>
                      <label style={{fontSize:12}}>Column label offset (px)
                        <input type="number" value={colOffset} onChange={(e)=>setColOffset(Number(e.target.value))} style={{width:80,marginLeft:8}} />
                      </label>
                      <div style={{fontSize:12,color:'#666'}}>Tip: drag labels in the preview to adjust offsets interactively</div>
                    </div>


                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
