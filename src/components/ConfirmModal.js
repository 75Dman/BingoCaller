import React from 'react'

export default function ConfirmModal({ open, title = 'Confirm', children, onConfirm, onCancel, confirmLabel = 'Continue', cancelLabel = 'Cancel' }){
  if (!open) return null
  return (
    <div style={{position:'fixed',left:0,top:0,right:0,bottom:0,background:'rgba(0,0,0,0.6)',zIndex:10001,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div role="dialog" aria-modal="true" style={{width:460,maxWidth:'92%',background:'#031330',borderRadius:10,padding:18,boxShadow:'0 10px 30px rgba(0,0,0,0.6)',color:'#fff',border:'1px solid rgba(255,255,255,0.04)'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:64,height:64,flex:'0 0 64px',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <svg width="56" height="56" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="32" cy="32" r="30" fill="#fde68a" stroke="#c47c00" strokeWidth="3" />
              <circle cx="26" cy="22" r="6" fill="white" />
              <text x="32" y="38" textAnchor="middle" fontSize="18" fontWeight="700" fill="#9b3412">B</text>
            </svg>
          </div>

          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:700}}>{title}</div>
            <div style={{marginTop:12,fontSize:14,color:'#e6eef8'}}>{children}</div>

            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:18}}>
              <button className="btn-muted" onClick={onCancel} style={{padding:'6px 10px'}}>{cancelLabel}</button>
              <button className="btn-primary" onClick={onConfirm} style={{padding:'6px 12px'}}>{confirmLabel}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
