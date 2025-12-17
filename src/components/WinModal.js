/*
  src/components/WinModal.js
  Simple modal that shows a winner row and triggers confetti (confetti called from parent).
*/
import React, { useEffect } from 'react'
import ConfirmModal from './ConfirmModal'
import { playWinSound } from '../utils/sound'

export default function WinModal({ open, onClose, winner }){
  useEffect(()=>{
    if (!open) return
    // play a short celebratory chime (non-blocking)
    try { playWinSound() } catch (e) {}
  }, [open])

  if(!open) return null
  const message = winner?.player ? <span><strong>{winner.player}</strong> has bingo!</span> : (winner?.axis === 'col' ? <span>Column {winner.index+1} has bingo!</span> : <span>Row {winner?.index+1} has bingo!</span>)
  return (
    <ConfirmModal open={!!open} title={"Bingo Caller Pro"} onConfirm={onClose} onCancel={onClose} confirmLabel={'OK'} cancelLabel={'Close'}>
      <div style={{fontSize:16}}>{message}</div>
    </ConfirmModal>
  )
}
