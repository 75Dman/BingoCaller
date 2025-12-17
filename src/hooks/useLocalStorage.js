/*
  src/hooks/useLocalStorage.js
  Simple React hook to persist state to localStorage.
*/
import { useState, useEffect } from 'react'

export function useLocalStorage(key, initial) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : initial
    } catch (err) {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state))
    } catch (err) {
      // ignore write errors
    }
  }, [key, state])

  return [state, setState]
}
