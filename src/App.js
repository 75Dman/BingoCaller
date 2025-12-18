/*
  src/App.js
  Main application container. Coordinates OCR upload, card state,
  ball picker, dab logic, auto/manual modes, and win detection.
*/
import React, { useEffect, useState, useCallback } from 'react'
import ImageUploader from './components/ImageUploader'
import CardView from './components/CardView'
import BallPicker from './components/BallPicker'
import PlayerList from './components/PlayerList'
import DabOverlayControls from './components/DabOverlayControls'
import GridDesigner from './components/GridDesigner'
import WinModal from './components/WinModal'
import BingoCardView from './components/BingoCardView'
import BingoBallView from './components/BingoBallView'
import ConfirmModal from './components/ConfirmModal'
import ListenerDebug from './components/ListenerDebug'
import { useLocalStorage } from './hooks/useLocalStorage'
import { fireConfetti } from './utils/confetti'

// Keys for localStorage
const LS_KEYS = {
  CARD: 'bingo_card',
  PLAYERS: 'bingo_players',
  DABBED: 'bingo_dabbed',
  CALLED: 'bingo_called',
  SETTINGS: 'bingo_settings'
}

function defaultEmptyCard(rows = 5, cols = 5) {
  // generate an empty card of placeholders (null means empty cell)
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => null))
}

export default function App() {
  // Persisted state via custom hook
  const [card, setCard] = useLocalStorage(LS_KEYS.CARD, defaultEmptyCard())
  // separate persisted lists for row/column players (to support player-only overlays)
  const [playersRows, setPlayersRows] = useLocalStorage('bingo_players_rows', [])
  const [playersCols, setPlayersCols] = useLocalStorage('bingo_players_cols', [])
  // defaults to control whether row/col player labels are shown by default
  const [gridDefaults, setGridDefaults] = useLocalStorage('bingo_grid_defaults', { rows: 20, cols: 5, order: 'column', scrambled: false, firstNum: 1, overlayType: 'both', playerCount: 20, playerRowOffset: 110, playerColOffset: 36, showPlayerRows: true, showPlayerCols: false })
  const [dabbed, setDabbed] = useLocalStorage(LS_KEYS.DABBED, null)
  const [called, setCalled] = useLocalStorage(LS_KEYS.CALLED, [])
  const [settings, setSettings] = useLocalStorage(LS_KEYS.SETTINGS, { maxBall: 75, autoMode: true, soundEnabled: true })
  // persisted image reference: either a data URL, http URL, or an "indexeddb:<key>" marker
  const [imageRef, setImageRef] = useLocalStorage('bingo_image_url', null)
  // derived display URL (not persisted) used for rendering the <img src>
  const [displayImageUrl, setDisplayImageUrl] = useState(null)

  useEffect(() => {
    // Guard against stale blob: URLs persisted to localStorage from previous sessions.
    if (imageRef && typeof imageRef === 'string' && imageRef.startsWith('blob:')) {
      console.debug('[App] Clearing stale blob URL from persisted imageRef')
      setImageRef(null)
    }
  }, [imageRef, setImageRef])

  // If we get an indexeddb: marker, load it from IndexedDB and convert to data URL for display
  useEffect(() => {
    let cancelled = false
    async function resolveImage() {
      if (!imageRef) { setDisplayImageUrl(null); return }
      if (typeof imageRef === 'string' && imageRef.startsWith('indexeddb:')) {
        const key = imageRef.slice('indexeddb:'.length)
        try {
          const { getFile } = await import('./utils/idb')
          const file = await getFile(key)
          if (!file) {
            console.warn('[App] indexedDB entry not found for', key)
            if (!cancelled) setImageRef(null)
            return
          }
          // convert file to dataURL
          const dataURL = await new Promise((resolve, reject) => {
            const fr = new FileReader(); fr.onload = () => resolve(fr.result); fr.onerror = reject; fr.readAsDataURL(file)
          })
          if (!cancelled) setDisplayImageUrl(dataURL)
        } catch (err) {
          console.error('Error loading image from indexedDB', err)
          if (!cancelled) setImageRef(null)
        }
      } else {
        // regular URL or data URL
        setDisplayImageUrl(imageRef)
      }
    }
    resolveImage()
    return () => { cancelled = true }
  }, [imageRef, setImageRef])

  const [currentBall, setCurrentBall] = useState(null)
  const [winner, setWinner] = useState(null)
  // game mode and active full-screen view
  const [gameMode, setGameMode] = useState('idle') // 'idle' | 'running'
  const [activeView, setActiveView] = useState('card') // 'card' | 'ball'
  // pending start-time warning when overlay count doesn't match maxBall
  const [pendingStartWarning, setPendingStartWarning] = useState(null)

  // dab overlay grid state
  const [gridDesignerOpen, setGridDesignerOpen] = useState(false)
  const [grid, setGrid] = useLocalStorage('bingo_grid', null)
  // defaults for designer (persisted)
  // (gridDefaults declared earlier with player show flags)

  // ensure dabbed matrix shape matches card
  useEffect(() => {
    if (!card) return
    const rows = card.length
    const cols = card[0]?.length || 0

    // If the current grid does not include dab, explicitly clear any persisted dab state
    if (!(grid?.overlayType === 'dab' || grid?.overlayType === 'both')) {
      if (dabbed !== null) {
        console.debug('[App] Clearing persisted dab state because overlay is not dab/both')
        setDabbed(null)
      }
      return
    }

    // Otherwise ensure dabbed matrix shape matches card
    if (!dabbed || dabbed.length !== rows || dabbed[0].length !== cols) {
      const newDab = Array.from({ length: rows }, () => Array.from({ length: cols }, () => false))
      setDabbed(newDab)
    }
  }, [card, grid])

  // Called when OCR or manual edit produces a new card matrix.
  const setCardFromOCR = ({ rows, imageUrl: imgUrl }) => {
    // If rows were extracted from text, prefer them (simple case)
    if (rows && rows.length > 0) {
      setCard(rows)
      setImageRef(imgUrl)
      // reset dabbed when new card loaded ONLY when current grid overlay includes dab
      if (grid?.overlayType === 'dab' || grid?.overlayType === 'both') {
        const newDab = Array.from({ length: rows.length }, () => Array.from({ length: rows[0].length }, () => false))
        setDabbed(newDab)
      } else {
        setDabbed(null)
      }
      // do NOT automatically change players or detect rows anymore
      setCalled([])
      setCurrentBall(null)
      setWinner(null)
      return
    }

    // Fallback: no structured rows, just set empty or text-derived
    const fallback = rows || defaultEmptyCard()
    setCard(fallback)
    setImageRef(imgUrl)
    if (grid?.overlayType === 'dab' || grid?.overlayType === 'both') {
      const newDab2 = Array.from({ length: fallback.length }, () => Array.from({ length: fallback[0].length }, () => false))
      setDabbed(newDab2)
    } else {
      setDabbed(null)
    }
    setCalled([])
    setCurrentBall(null)
    setWinner(null)
    return
  }

  // Grid designer actions
  const openGridDesigner = () => setGridDesignerOpen(true)
  const closeGridDesigner = () => setGridDesignerOpen(false)
  const clearGrid = () => { setGrid(null) }

  const saveGrid = (g) => {
    // g: { bbox, rows, cols, numbering, values, overlayType }
    setGrid(g)
    // populate card matrix from values
      if (g && g.values) {
      setCard(g.values)
      // initialize dabbed only when overlayType includes dab
      if (g.overlayType === 'dab' || g.overlayType === 'both') {
        setDabbed(Array.from({ length: g.rows }, () => Array.from({ length: g.cols }, () => false)))
      } else {
        // explicitly clear any existing dabbed state when saving a player-only overlay
        setDabbed(null)
      }
      // update global player lists based on what the designer saved (if present)
      if (g.playerOverlay) {
        if (g.playerOverlay.showRows) setPlayersRows(g.playerOverlay.rows.slice(0, g.rows).map(n=> (n||'').slice(0,16)))
        if (g.playerOverlay.showCols) setPlayersCols(g.playerOverlay.cols.slice(0, g.cols).map(n=> (n||'').slice(0,16)))
      }
    }
    // If overlay doesn't include dab, also ensure any previous winner state is cleared
    if (!(g.overlayType === 'dab' || g.overlayType === 'both')) {
      setWinner(null)
      setCalled([])
      setCurrentBall(null)
    }
    setGridDesignerOpen(false)
  }

  // toggle dab for a specific cell (manual)
  const toggleDab = (r, c) => {
    // if dab overlay is not active/initialized, ignore manual toggles
    if (!dabbed) return
    setDabbed(prev => {
      const copy = prev.map(row => row.slice())
      copy[r][c] = !copy[r][c]
      return copy
    })
  }

  // When a number is called, mark any matching numbers on the card as dabbed (auto)
  const handleNumberCalled = useCallback((num, { auto } = { auto: false }) => {
    setCalled(prev => {
      const next = [...prev, num]
      return next
    })
    setCurrentBall(num)
    if (auto && dabbed) {
      setDabbed(prev => {
        const copy = prev.map(row => row.slice())
        for (let r = 0; r < card.length; r++) {
          for (let c = 0; c < (card[r] || []).length; c++) {
            if (String(card[r][c]) === String(num)) copy[r][c] = true
          }
        }
        return copy
      })
    }
  }, [card, dabbed])

  // On any dab change, check for full-row wins
  useEffect(() => {
    if (!dabbed) return
    // check rows
    for (let r = 0; r < dabbed.length; r++) {
      const row = dabbed[r]
      const all = row.every(Boolean)
      if (all) {
        const player = grid?.playerOverlay?.rows?.[r]
        setWinner({ axis: 'row', index: r, player })
        fireConfetti()
        return
      }
    }
    // check columns
    const cols = dabbed[0]?.length || 0
    for (let c = 0; c < cols; c++) {
      let all = true
      for (let r = 0; r < dabbed.length; r++) {
        if (!dabbed[r][c]) { all = false; break }
      }
      if (all) {
        const player = grid?.playerOverlay?.cols?.[c]
        setWinner({ axis: 'col', index: c, player })
        fireConfetti()
        return
      }
    }
  }, [dabbed, grid])

  const resetGame = () => {
    setCalled([])
    setCurrentBall(null)
    if (dabbed) setDabbed(prev => prev.map(row => row.map(() => false)))
    setWinner(null)
  }

  // Initiate game mode with optional validation that the saved grid count matches the configured maxBall
  const startGame = () => {
    // compute number of distinct numbered cells in the saved grid (if any)
    let overlayCount = 0
    if (grid && grid.values) {
      const nums = new Set()
      for (let r = 0; r < grid.values.length; r++) {
        const row = grid.values[r] || []
        for (let c = 0; c < row.length; c++) {
          const v = row[c]
          if (v !== null && v !== undefined && v !== '') nums.add(String(v))
        }
      }
      overlayCount = nums.size
    } else if (grid && grid.rows && grid.cols) {
      overlayCount = Number(grid.rows) * Number(grid.cols)
    }

      if (overlayCount && overlayCount !== settings.maxBall) {
      // show our themed modal instead of native confirm
      setPendingStartWarning({ overlayCount, maxBall: settings.maxBall })
      return
    }

    resetGame()
    setGameMode('running')
    setActiveView('card')
  }

  const continueStart = () => {
    setPendingStartWarning(null)
    resetGame()
    setGameMode('running')
    setActiveView('card')
  }

  const cancelStart = () => {
    setPendingStartWarning(null)
  }


  const toggleDabLine = (axis, idx) => {
    // ignore if dab overlay not present
    if (!dabbed) return
    setDabbed(prev => {
      const copy = prev.map(r=>r.slice())
      if (axis === 'row') {
        const all = copy[idx].every(Boolean)
        for (let c=0;c<copy[idx].length;c++) copy[idx][c] = !all
      } else {
        // col
        const rows = copy.length
        let all = true
        for (let r=0;r<rows;r++) if(!copy[r][idx]) { all = false; break }
        for (let r=0;r<rows;r++) copy[r][idx] = !all
      }
      return copy
    })
  }

  return (
    <div className="app-root">
      <header className="topbar" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <h1 style={{margin:0,display:'flex',alignItems:'center',gap:8,fontSize:18}}>
          <svg width="1em" height="1em" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{flex:'0 0 1em'}}>
            <circle cx="32" cy="32" r="30" fill="#fde68a" stroke="#c47c00" strokeWidth="3" />
            <circle cx="26" cy="22" r="6" fill="white" />
            <text x="32" y="38" textAnchor="middle" fontSize="18" fontWeight="700" fill="#9b3412">B</text>
          </svg>
          Bingo Caller Pro
        </h1>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{fontSize:12,color:'#cbd5e1'}}>Auto:</div>
            <button onClick={()=> setSettings(s => ({ ...s, autoMode: !s.autoMode }))} style={{padding:'6px 10px',background: settings.autoMode ? '#0b3d91' : 'transparent',color:'#fff',border: '1px solid rgba(255,255,255,0.06)',borderRadius:6}}>{settings.autoMode ? 'On' : 'Off'}</button>
          </div>

          {/* sound toggle: single global control for all app sounds */}
          <button
            className={`sound-toggle ${settings.soundEnabled ? '' : 'muted'}`}
            onClick={() => setSettings(s => ({ ...s, soundEnabled: !s.soundEnabled }))}
            title={settings.soundEnabled ? 'Mute sounds' : 'Unmute sounds'}
            aria-pressed={!settings.soundEnabled}
            style={{width:36,height:36,display:'inline-flex',alignItems:'center',justifyContent:'center',borderRadius:6,border:'1px solid rgba(255,255,255,0.06)',background: settings.soundEnabled ? 'transparent' : 'rgba(255,255,255,0.02)'}}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" style={{display:'block'}}>
              <path d="M3 10v4h4l5 5V5L7 10H3z" fill="currentColor" />
              <path d="M16.5 7.5a4 4 0 010 9" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {gameMode === 'idle' ? (
            <button className="btn-primary btn-pulse" onClick={() => startGame()} style={{fontSize:16,padding:'8px 16px'}}>Game On</button>
          ) : (
            <>
              <div style={{display:'flex',border:'1px solid rgba(255,255,255,0.06)',borderRadius:6,overflow:'hidden'}}>
                <button onClick={() => setActiveView('card')} className={`segmented ${activeView==='card' ? 'segmented--active' : ''}`} style={{padding:'8px 12px',background: activeView==='card' ? '#0b3d91' : 'transparent',color:'#fff',border:'none'}}>Card</button>
                <button onClick={() => setActiveView('ball')} className={`segmented ${activeView==='ball' ? 'segmented--active' : ''}`} style={{padding:'8px 12px',background: activeView==='ball' ? '#0b3d91' : 'transparent',color:'#fff',border:'none'}}>Ball</button>
              </div>
              <button className="btn-muted" onClick={() => { setGameMode('idle'); setActiveView('card') }} style={{padding:'6px 10px'}}>Stop</button>
            </>
          )}
        </div>
      </header>
      <main className="main">
        <section className="left">
          <ImageUploader onResult={setCardFromOCR} />
          <DabOverlayControls grid={grid} defaults={gridDefaults} setDefaults={setGridDefaults} onDesign={openGridDesigner} onClear={clearGrid} playersRows={playersRows} setPlayersRows={setPlayersRows} playersCols={playersCols} setPlayersCols={setPlayersCols} />
          <PlayerList playersRows={playersRows} setPlayersRows={setPlayersRows} playersCols={playersCols} setPlayersCols={setPlayersCols} showRows={gridDefaults?.showPlayerRows} setShowRows={(v)=>setGridDefaults(d=>({ ...d, showPlayerRows: v }))} showCols={gridDefaults?.showPlayerCols} setShowCols={(v)=>setGridDefaults(d=>({ ...d, showPlayerCols: v }))} />
          <BallPicker
            maxBall={settings.maxBall}
            setMaxBall={(v) => setSettings(s => ({ ...s, maxBall: v }))}
            autoMode={settings.autoMode}
            setAutoMode={(v) => setSettings(s => ({ ...s, autoMode: v }))}
            called={called}
            onCall={(num) => handleNumberCalled(num, { auto: settings.autoMode })}
            resetGame={resetGame}
            currentBall={currentBall}
          />
          {gridDesignerOpen && (
            <GridDesigner imageUrl={displayImageUrl} initialGrid={grid} initialDefaults={gridDefaults} onSave={saveGrid} onCancel={closeGridDesigner} playersRows={playersRows} setPlayersRows={setPlayersRows} playersCols={playersCols} setPlayersCols={setPlayersCols} />
          )}
        </section>
        <section className="right">
          {gameMode === 'idle' ? (
            <CardView
              card={card}
              playersRows={playersRows}
              setPlayersRows={setPlayersRows}
              playersCols={playersCols}
              setPlayersCols={setPlayersCols}
              dabbed={dabbed}
              onToggleDab={toggleDab}
              onToggleDabLine={toggleDabLine}
              manualMode={!settings.autoMode}
              setCard={setCard}
              setDabbed={setDabbed}
              imageUrl={displayImageUrl}
              grid={grid}
            />
          ) : (
            <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:9998,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column'}}>
                {/* toolbar visible in fullscreen overlay for switching and ending game */}
                <div style={{position:'absolute',right:12,top:12,zIndex:10000,display:'flex',alignItems:'center',gap:8}}>
                  <div style={{display:'flex',border:'1px solid rgba(255,255,255,0.06)',borderRadius:6,overflow:'hidden'}}>
                    <button onClick={() => setActiveView('card')} style={{padding:'8px 12px',background: activeView==='card' ? '#0b3d91' : 'transparent',color:'#fff',border:'none'}}>Card</button>
                    <button onClick={() => setActiveView('ball')} style={{padding:'8px 12px',background: activeView==='ball' ? '#0b3d91' : 'transparent',color:'#fff',border:'none'}}>Ball</button>
                  </div>
                  <button className="btn-muted" onClick={() => { setGameMode('idle'); setActiveView('card') }} style={{padding:'6px 10px'}}>End Game</button>
                </div>

                {activeView === 'card' ? (
                  <BingoCardView
                    card={card}
                    playersRows={playersRows}
                    setPlayersRows={setPlayersRows}
                    playersCols={playersCols}
                    setPlayersCols={setPlayersCols}
                    dabbed={dabbed}
                    onToggleDab={toggleDab}
                    onToggleDabLine={toggleDabLine}
                    manualMode={!settings.autoMode}
                    setCard={setCard}
                    setDabbed={setDabbed}
                    imageUrl={displayImageUrl}
                    grid={grid}
                    winner={winner}
                    onWinClose={() => setWinner(null)}
                  />
                ) : (
                  <BingoBallView
                    onDraw={(num, opts) => handleNumberCalled(num, opts)}
                    called={called}
                    currentBall={currentBall}
                    resetGame={resetGame}
                    maxBall={settings.maxBall}
                    setMaxBall={(v) => setSettings(s => ({ ...s, maxBall: v }))}
                    autoMode={settings.autoMode}
                    setAutoMode={(v) => setSettings(s => ({ ...s, autoMode: v }))}
                  />
                )}
              </div>
            </div>
          )}
        </section>
      </main>
      {/* Themed start-time warning modal (replaces confirm) */}
      <ConfirmModal open={!!pendingStartWarning} title={"Bingo Caller Pro"} onConfirm={continueStart} onCancel={cancelStart} confirmLabel="Continue" cancelLabel="Cancel">
        Grid contains <strong style={{color:'#fff'}}>{pendingStartWarning?.overlayCount}</strong> numbered cells but Max Balls is set to <strong style={{color:'#fff'}}>{pendingStartWarning?.maxBall}</strong>. Do you want to continue starting the game?
      </ConfirmModal>

      {/* When in game card fullscreen the modal is rendered inside BingoCardView; otherwise show the WinModal globally */}
      {!(gameMode === 'running' && activeView === 'card') && (
        <WinModal
          open={winner !== null}
          onClose={() => setWinner(null)}
          winner={winner}
        />
      )}
      <ListenerDebug />
    </div>
  )
}
