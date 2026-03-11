import { useState } from 'react'
import { type Alarm, useAlarmStore } from '../store/alarms'

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatTime(h: number, m: number) {
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return { time: `${hour}:${String(m).padStart(2, '0')}`, period }
}

function getNextFire(alarm: Alarm): string {
  const now = new Date()
  const candidate = new Date()
  candidate.setHours(alarm.hour, alarm.minute, 0, 0)

  if (alarm.repeatDays.length === 0) {
    if (candidate <= now) candidate.setDate(candidate.getDate() + 1)
    const diff = candidate.getTime() - now.getTime()
    const h = Math.floor(diff / 3_600_000)
    const m = Math.floor((diff % 3_600_000) / 60_000)
    if (h === 0) return `in ${m}m`
    return `in ${h}h ${m}m`
  }

  for (let offset = 0; offset <= 7; offset++) {
    const day = new Date(now)
    day.setDate(day.getDate() + offset)
    day.setHours(alarm.hour, alarm.minute, 0, 0)
    if (day <= now) continue
    if (alarm.repeatDays.includes(day.getDay() as any)) {
      if (offset === 0) return 'Today'
      if (offset === 1) return 'Tomorrow'
      return DAY_NAMES[day.getDay()]
    }
  }
  return ''
}

const CHALLENGE_LABELS: Record<string, string> = {
  math: '🔢 Math',
  shake: '📳 Shake',
  memory: '🧠 Memory',
}

interface Props {
  alarm: Alarm
  onEdit: (alarm: Alarm) => void
}

export default function AlarmCard({ alarm, onEdit }: Props) {
  const toggleAlarm = useAlarmStore((s) => s.toggleAlarm)
  const deleteAlarm = useAlarmStore((s) => s.deleteAlarm)
  const [pressing, setPressing] = useState(false)
  const { time, period } = formatTime(alarm.hour, alarm.minute)
  const nextFire = getNextFire(alarm)

  return (
    <div
      className={`glass-card rounded-2xl px-5 py-4 transition-all duration-300 ${
        alarm.enabled ? 'opacity-100' : 'opacity-40'
      } ${pressing ? 'scale-[0.98]' : ''}`}
    >
      <div className="flex items-start justify-between">
        {/* Left: time + label */}
        <button
          className="text-left flex-1 min-w-0 mr-4"
          onClick={() => onEdit(alarm)}
          onMouseDown={() => setPressing(true)}
          onMouseUp={() => setPressing(false)}
          onMouseLeave={() => setPressing(false)}
          onTouchStart={() => setPressing(true)}
          onTouchEnd={() => setPressing(false)}
        >
          <div className="flex items-end gap-1.5">
            <span
              className="font-light tracking-tight text-white"
              style={{ fontSize: '2.75rem', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}
            >
              {time}
            </span>
            <span className="text-white/40 font-medium mb-1 text-lg">{period}</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-white/70 text-sm font-medium truncate">
              {alarm.label || 'Alarm'}
            </span>
            {alarm.enabled && nextFire && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-400/15 text-amber-300 border border-amber-400/25">
                {nextFire}
              </span>
            )}
          </div>
        </button>

        {/* Right: toggle */}
        <button
          onClick={() => toggleAlarm(alarm.id)}
          className="relative mt-1 shrink-0"
          aria-label={alarm.enabled ? 'Disable alarm' : 'Enable alarm'}
        >
          <div className={`w-16 h-8 rounded-full transition-colors duration-300 ${
            alarm.enabled ? 'bg-amber-400' : 'bg-white/10'
          }`}>
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${
              alarm.enabled ? 'left-9' : 'left-1'
            }`} />
          </div>
        </button>
      </div>

      {/* Repeat days */}
      {alarm.repeatDays.length > 0 ? (
        <div className="flex gap-1.5 mt-3">
          {DAY_LABELS.map((dayLabel, i) => (
            <div
              key={i}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                alarm.repeatDays.includes(i as any)
                  ? 'bg-amber-400/20 text-amber-400 ring-1 ring-amber-400/40'
                  : 'text-white/20'
              }`}
            >
              {dayLabel}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-white/25 text-xs mt-2 font-medium tracking-wide">ONE TIME</p>
      )}

      {/* Bottom chips row */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white/8 text-white/50 border border-white/10 glow-chip">
          {CHALLENGE_LABELS[alarm.challenge]}
        </span>
        {(alarm.wakeCheckEnabled) && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-400/10 text-orange-300 border border-orange-400/25">
            ⏱ {alarm.wakeCheckDelayMinutes ?? 5}m check
          </span>
        )}
        <div className="flex-1" />
        <button
          onClick={() => deleteAlarm(alarm.id)}
          className="text-red-400/40 text-xs font-medium tracking-wide hover:text-red-400 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
