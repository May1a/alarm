import { useEffect } from 'react'
import AlarmList from './components/AlarmList'
import AlarmOverlay from './components/AlarmOverlay'
import { useAlarmScheduler } from './hooks/useAlarmScheduler'

function App() {
  useAlarmScheduler()

  // Request notification permission on first load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  return (
    <div className="max-w-lg mx-auto relative">
      <AlarmList />
      <AlarmOverlay />
    </div>
  )
}

export default App
