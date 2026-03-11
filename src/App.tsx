import { useEffect } from 'react'
import AlarmList from './components/AlarmList'
import AlarmOverlay from './components/AlarmOverlay'
import { useAlarmScheduler } from './hooks/useAlarmScheduler'
import { startKeepAlive } from './lib/keepalive'

function App() {
  useAlarmScheduler()

  // Request notification permission on first load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Start silent audio keepalive on first user interaction.
  // Must be triggered by a gesture — iOS blocks AudioContext until then.
  useEffect(() => {
    const handler = () => {
      startKeepAlive()
      window.removeEventListener('pointerdown', handler)
    }
    window.addEventListener('pointerdown', handler, { once: true })
    return () => window.removeEventListener('pointerdown', handler)
  }, [])

  return (
    <div className="max-w-lg mx-auto relative">
      <AlarmList />
      <AlarmOverlay />
    </div>
  )
}

export default App
