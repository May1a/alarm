import { useEffect } from 'react'
import { useAlarmStore } from '../store/alarms'
import { startAlarm } from '../lib/audio'

async function showAlarmNotification(label: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  const options: NotificationOptions = {
    body: 'Open the app to dismiss',
    icon: '/alarm/icons/icon-192.svg',
    requireInteraction: true,
    silent: false,
  }
  // Prefer service worker notification — works better on iOS PWA
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready
      await reg.showNotification(label || 'Alarm', options)
      return
    } catch (_) {}
  }
  new Notification(label || 'Alarm', options)
}

export function useAlarmScheduler() {
  const alarms = useAlarmStore((s) => s.alarms)
  const setFiringAlarm = useAlarmStore((s) => s.setFiringAlarm)
  const markAlarmFired = useAlarmStore((s) => s.markAlarmFired)
  const firingAlarmId = useAlarmStore((s) => s.firingAlarmId)
  const firingWakeCheckId = useAlarmStore((s) => s.firingWakeCheckId)
  const pendingWakeCheck = useAlarmStore((s) => s.pendingWakeCheck)
  const setFiringWakeCheck = useAlarmStore((s) => s.setFiringWakeCheck)
  const clearWakeCheck = useAlarmStore((s) => s.clearWakeCheck)

  // Regular alarm scheduler
  useEffect(() => {
    const check = () => {
      if (firingAlarmId) return

      const now = new Date()
      const hour = now.getHours()
      const minute = now.getMinutes()
      const dayOfWeek = now.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6
      const today = now.toISOString().split('T')[0]

      for (const alarm of alarms) {
        if (!alarm.enabled) continue
        if (alarm.hour !== hour || alarm.minute !== minute) continue
        if (alarm.lastFiredDate === today) continue

        const isRepeat = alarm.repeatDays.length > 0
        if (isRepeat && !alarm.repeatDays.includes(dayOfWeek)) continue

        markAlarmFired(alarm.id)
        startAlarm()
        setFiringAlarm(alarm.id)
        showAlarmNotification(alarm.label)
        break
      }
    }

    check()
    const interval = setInterval(check, 10_000)
    return () => clearInterval(interval)
  }, [alarms, firingAlarmId, setFiringAlarm, markAlarmFired])

  // Wake-check scheduler
  useEffect(() => {
    if (!pendingWakeCheck) return

    const check = () => {
      if (firingAlarmId || firingWakeCheckId) return
      if (Date.now() >= pendingWakeCheck.fireAt) {
        const alarm = useAlarmStore.getState().alarms.find(a => a.id === pendingWakeCheck.alarmId)
        clearWakeCheck()
        startAlarm()
        setFiringWakeCheck(pendingWakeCheck.alarmId)
        showAlarmNotification(`⏱ Wake-up check${alarm?.label ? ` — ${alarm.label}` : ''}`)
      }
    }

    check()
    const interval = setInterval(check, 10_000)
    return () => clearInterval(interval)
  }, [pendingWakeCheck, firingAlarmId, firingWakeCheckId, setFiringWakeCheck, clearWakeCheck])
}
