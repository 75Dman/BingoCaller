/*
  src/utils/idb.js
  Minimal IndexedDB helper for storing image files by key.
*/

export function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('bingo-images', 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore('images')
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function putFile(key, file) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('images', 'readwrite')
    tx.objectStore('images').put(file, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getFile(key) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('images', 'readonly')
    const req = tx.objectStore('images').get(key)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => reject(req.error)
  })
}

export async function deleteFile(key) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('images', 'readwrite')
    tx.objectStore('images').delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
