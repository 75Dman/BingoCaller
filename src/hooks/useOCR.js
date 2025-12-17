/*
  src/hooks/useOCR.js
  Provides a simple wrapper around Tesseract.js for client-side OCR.
  Exposes `recognize(file)` which returns the recognized text and bounding boxes.
*/
import { useState } from 'react'
import { createWorker } from 'tesseract.js'

export function useOCR(){
  const [recognizing, setRecognizing] = useState(false)
  const [resultText, setResultText] = useState('')
  const [boxes, setBoxes] = useState([])

  const recognize = async (file) => {
    setRecognizing(true)
    try {
      const worker = await createWorker({ logger: m => {} })
      await worker.loadLanguage('eng')
      await worker.initialize('eng')
      // restrict to digits and whitespace to improve accuracy on numbers
      await worker.setParameters({ tessedit_char_whitelist: '0123456789\n ,.' })
      const { data } = await worker.recognize(file)
      setResultText(data.text)
      // Extract bounding boxes for words
      const wordBoxes = data.words.map(word => ({
        text: word.text.trim(),
        bbox: word.bbox
      })).filter(box => box.text && /^\d+$/.test(box.text)) // only numeric words
      setBoxes(wordBoxes)
      await worker.terminate()
      return { text: data.text, boxes: wordBoxes }
    } catch (err) {
      setResultText('')
      setBoxes([])
      console.error('OCR error', err)
      return { text: '', boxes: [] }
    } finally {
      setRecognizing(false)
    }
  }

  return { recognizing, resultText, boxes, recognize }
}
