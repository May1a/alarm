import { useEffect } from 'react'
import { useAlarmStore } from '../store/alarms'
import { startAlarm } from '../lib/audio'

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
      if (firingAlarmId) return // already firing

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
      if (firingAlarmId || firingWakeCheckId) return // something already firing
      if (Date.now() >= pendingWakeCheck.fireAt) {
        clearWakeCheck()
        startAlarm()
        setFiringWakeCheck(pendingWakeCheck.alarmId)
      }
    }

    check()
    const interval = setInterval(check, 10_000)
    return () => clearInterval(interval)
  }, [pendingWakeCheck, firingAlarmId, firingWakeCheckId, setFiringWakeCheck, clearWakeCheck])
}
