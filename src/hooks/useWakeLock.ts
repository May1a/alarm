import { useRef } from 'react'

export function useWakeLock() {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  const acquire = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
      } catch (_) {}
    }
  }

  const release = () => {
    wakeLockRef.current?.release()
    wakeLockRef.current = null
  }

  return { acquire, release }
}
