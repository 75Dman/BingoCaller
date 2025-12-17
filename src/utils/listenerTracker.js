// Dev-only listener tracker to help diagnose orphaned global event listeners
const counts = {}

export function registerListener(type){
  if (process.env.NODE_ENV === 'production') return
  counts[type] = (counts[type] || 0) + 1
  // small debug log to help trace where listeners are added
  try { console.debug(`[listenerTracker] add ${type} -> ${counts[type]}`) } catch (e){}
}

export function unregisterListener(type){
  if (process.env.NODE_ENV === 'production') return
  counts[type] = Math.max(0, (counts[type] || 0) - 1)
  try { console.debug(`[listenerTracker] remove ${type} -> ${counts[type]}`) } catch (e){}
}

export function getListenerCounts(){
  return { ...counts }
}

export default { registerListener, unregisterListener, getListenerCounts }
