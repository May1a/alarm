import { useEffect, useState } from 'react'
import { useAlarmStore } from '../store/alarms'
import { stopAlarm } from '../lib/audio'
import { useWakeLock } from '../hooks/useWakeLock'
import MathChallenge from './challenges/MathChallenge'
import ShakeChallenge from './challenges/ShakeChallenge'
import MemoryChallenge from './challenges/MemoryChallenge'

export default function AlarmOverlay() {
  const firingAlarmId = useAlarmStore((s) => s.firingAlarmId)
  const firingWakeCheckId = useAlarmStore((s) => s.firingWakeCheckId)
  const alarms = useAlarmStore((s) => s.alarms)
  const setFiringAlarm = useAlarmStore((s) => s.setFiringAlarm)
  const updateAlarm = useAlarmStore((s) => s.updateAlarm)
  const scheduleWakeCheck = useAlarmStore((s) => s.scheduleWakeCheck)
  const clearWakeCheck = useAlarmStore((s) => s.clearWakeCheck)
  const { acquire, release } = useWakeLock()

  const [now, setNow] = useState(new Date())

  const isWakeCheck = !!firingWakeCheckId && !firingAlarmId
  const activeId = firingWakeCheckId ?? firingAlarmId
  const alarm = alarms.find((a) => a.id === activeId)

  useEffect(() => {
    if (!activeId) return
    acquire()
    const tick = setInterval(() => setNow(new Date()), 1000)
    return () => {
      clearInterval(tick)
      release()
    }
  }, [activeId])

  if (!activeId || !alarm) return null

  const dismiss = () => {
    stopAlarm()
    if (isWakeCheck) {
      clearWakeCheck()
    } else {
      setFiringAlarm(null)
      if (alarm.wakeCheckEnabled) {
        scheduleWakeCheck(alarm.id, alarm.wakeCheckDelayMinutes ?? 5)
      }
    }
  }

  const snooze = () => {
    stopAlarm()
    const snoozeDate = new Date(Date.now() + 5 * 60_000)
    updateAlarm(alarm.id, {
      hour: snoozeDate.getHours(),
      minute: snoozeDate.getMinutes(),
      lastFiredDate: null,
      enabled: true,
    })
    setFiringAlarm(null)
  }

  const accentColor = isWakeCheck ? '#f97316' : '#fbbf24' // orange vs amber
  const ringPing = isWakeCheck ? 'bg-orange-400/10' : 'bg-amber-400/10'
  const ringPing2 = isWakeCheck ? 'bg-orange-400/20' : 'bg-amber-400/20'
  const ringPulse = isWakeCheck ? 'bg-orange-400/40' : 'bg-amber-400/40'
  const labelColor = isWakeCheck ? 'text-orange-300' : 'text-amber-300'

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-between py-16 px-6 animate-fade-in"
      style={{
        background: isWakeCheck
          ? 'radial-gradient(ellipse at top, #2a0e00 0%, #0a0005 50%, #000 100%)'
          : 'radial-gradient(ellipse at top, #1a0533 0%, #0a0010 50%, #000 100%)',
      }}
    >
      {/* Animated gradient ring */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2">
        <div className="relative w-40 h-40">
          <div
            className="absolute inset-0 rounded-full animate-spin-slow"
            style={{
              background: `conic-gradient(from 0deg, ${accentColor}00, ${accentColor}40, ${accentColor}00)`,
              borderRadius: '50%',
            }}
          />
          <div className={`absolute inset-2 rounded-full ${ringPing} animate-ping`} />
          <div className={`absolute inset-6 rounded-full ${ringPing2} animate-ping`} style={{ animationDelay: '0.3s' }} />
          <div className={`absolute inset-10 rounded-full ${ringPulse} animate-pulse`} />
        </div>
      </div>

      {/* Top: time + label */}
      <div className="text-center z-10 pt-28">
        <p className="text-8xl font-thin tracking-tight text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {String(now.getHours() % 12 || 12).padStart(2, '\u2007')}:{String(now.getMinutes()).padStart(2, '0')}
        </p>
        <p className="text-2xl text-white/40 mt-1 font-light">
          {now.getHours() >= 12 ? 'PM' : 'AM'}
        </p>
        {isWakeCheck ? (
          <>
            <p className="text-xl text-orange-300 font-semibold mt-4 tracking-wide">
              Are you actually awake?
            </p>
            <p className="text-sm text-white/40 mt-1">Complete the challenge to confirm</p>
          </>
        ) : (
          <p className={`text-lg ${labelColor} font-medium mt-4 tracking-wide`}>
            {alarm.label || 'Alarm'}
          </p>
        )}
      </div>

      {/* Middle: challenge */}
      <div className="w-full z-10">
        <p className="text-center text-white/50 text-sm font-medium tracking-widest uppercase mb-8">
          {alarm.challenge === 'math' ? 'Solve to dismiss' : alarm.challenge === 'shake' ? 'Shake to dismiss' : 'Repeat the pattern'}
        </p>
        {alarm.challenge === 'math' && <MathChallenge onSuccess={dismiss} accentColor={accentColor} />}
        {alarm.challenge === 'shake' && <ShakeChallenge onSuccess={dismiss} accentColor={accentColor} />}
        {alarm.challenge === 'memory' && <MemoryChallenge onSuccess={dismiss} />}
      </div>

      {/* Bottom: snooze (not available for wake checks) */}
      <div className="z-10">
        {!isWakeCheck ? (
          <button
            onClick={snooze}
            className="text-white/50 text-sm font-semibold tracking-wide hover:text-white/80 transition-colors py-2.5 px-8 rounded-full border border-white/15 hover:border-white/30 bg-white/5"
          >
            Snooze 5 min
          </button>
        ) : (
          <p className="text-white/20 text-xs text-center">Wake checks cannot be snoozed</p>
        )}
      </div>
    </div>
  )
}
