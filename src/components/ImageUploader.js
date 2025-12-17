/*
  src/components/ImageUploader.js
  Handles image upload and runs OCR via the useOCR hook. Provides a manual
  fallback textarea to edit detected numbers as a simple CSV.
*/
import React, { useState } from 'react'
import { useOCR } from '../hooks/useOCR'

export default function ImageUploader({ onResult }) {
  const [file, setFile] = useState(null)
  const [storedKey, setStoredKey] = useState(null)
  const [storedWarning, setStoredWarning] = useState(null)
  // when OCR runs and doesn't confidently produce rows, we keep the image reference so the user can choose "Use Manual Input" (uses raw OCR text)
  const [pendingImageRef, setPendingImageRef] = useState(null)
  const { recognizing, resultText, recognize } = useOCR()

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    setFile(f)
    setStoredKey(null)
    setStoredWarning(null)
  }

  // convert file to data URL (safe to persist in localStorage)
  const toDataURL = (file) => new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(fr.result)
    fr.onerror = reject
    fr.readAsDataURL(file)
  })

  const doOCR = async () => {
    if (!file) return
    const { text } = await recognize(file)
    // If image is large, save to IndexedDB and return a marker string to persist instead of the full dataURL
    if (file.size > 2 * 1024 * 1024) {
      const key = 'img_' + Date.now()
      const { putFile } = await import('../utils/idb')
      await putFile(key, file)
      setStoredKey(key)
      setStoredWarning('Image was stored in IndexedDB (persistent).')
      const imageRef = `indexeddb:${key}`
      const rows = text.trim().split(/\r?\n/).map(line => {
        const nums = line.match(/\d+/g)
        return nums ? nums.map(n => Number(n)) : []
      }).filter(r => r.length > 0)
      if (rows.length > 0) {
        onResult({ rows, imageUrl: imageRef })
      } else {
        // keep the image ref so user can choose "Use Manual Input" (uses raw OCR text)
        setPendingImageRef(imageRef)
      }
      return
    }

    const imageUrl = await toDataURL(file)
    // Parse simple rows from text: split lines, find numbers
    const rows = text.trim().split(/\r?\n/).map(line => {
      const nums = line.match(/\d+/g)
      return nums ? nums.map(n => Number(n)) : []
    }).filter(r => r.length > 0)
    if (rows.length > 0) {
      onResult({ rows, imageUrl })
    } else {
      // keep the image ref so user can choose "Use Manual Input" (uses raw OCR text)
      setPendingImageRef(imageUrl)
    }
  }

  const submitFallback = async (text = resultText) => {
    // Flexible manual input: extract numbers per line from OCR text
    if (!text || !text.trim()) return
    const rows = text.trim().split(/\r?\n/).map(line => {
      const nums = line.match(/\d+/g)
      return nums ? nums.map(n => Number(n)) : []
    }).filter(r => r.length > 0)

    const imageUrl = pendingImageRef || (file && file.size <= 2 * 1024 * 1024 ? await toDataURL(file) : (storedKey ? `indexeddb:${storedKey}` : null))
    onResult({ rows, imageUrl })
    setPendingImageRef(null)
  }

  return (
    <div className="uploader">
      <h3>Upload Bingo Card Image</h3>
      <input type="file" accept="image/*" onChange={handleFile} />
      <div style={{marginTop:8}}>
        <button onClick={doOCR} disabled={!file || recognizing}>{recognizing ? 'Processing...' : 'Upload Game Card'}</button>
      </div>
      {storedWarning && (
        <div style={{marginTop:8,color:'#f59e0b',fontSize:12}}>{storedWarning} <button onClick={async ()=>{ if (!storedKey) return; const { deleteFile } = await import('../utils/idb'); await deleteFile(storedKey); setStoredKey(null); setStoredWarning(null); }}>Remove stored image</button></div>
      )}


    </div>
  )
}
