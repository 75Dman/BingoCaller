import React, { useEffect, useState } from 'react'

export default function ListenerDebug(){
  const [counts, setCounts] = useState({})
  useEffect(()=>{
    if (process.env.NODE_ENV === 'production') return
    let mounted = true
    const update = async () => {
      const mod = await import('../utils/listenerTracker')
      if (!mounted) return
      setCounts(mod.getListenerCounts())
    }
    const iv = setInterval(update, 1000)
    update()
    return () => { mounted = false; clearInterval(iv) }
  }, [])
  if (process.env.NODE_ENV === 'production') return null
  return (
    <div style={{position:'fixed',right:12,bottom:12,background:'rgba(0,0,0,0.6)',color:'#fff',padding:'8px 10px',borderRadius:8,fontSize:12,zIndex:20000}}>
      <div style={{fontWeight:700,marginBottom:6}}>Listener Debug</div>
      {Object.keys(counts).length === 0 ? <div style={{color:'#9ca3af'}}>No counts</div> : Object.entries(counts).map(([k,v]) => (<div key={k} style={{display:'flex',justifyContent:'space-between'}}><span>{k}</span><strong>{v}</strong></div>))}
    </div>
  )
}
