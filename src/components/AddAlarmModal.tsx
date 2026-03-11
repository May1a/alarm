import { useState, useEffect } from 'react'
import { type Alarm, type RepeatDay, type ChallengeType, useAlarmStore } from '../store/alarms'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WAKE_CHECK_DELAYS = [3, 5, 10, 15] as const

interface Props {
  editing?: Alarm | null
  onClose: () => void
}

export default function AddAlarmModal({ editing, onClose }: Props) {
  const addAlarm = useAlarmStore((s) => s.addAlarm)
  const updateAlarm = useAlarmStore((s) => s.updateAlarm)

  const now = new Date()
  const [hour, setHour] = useState(editing?.hour ?? now.getHours())
  const [minute, setMinute] = useState(editing?.minute ?? now.getMinutes())
  const [label, setLabel] = useState(editing?.label ?? '')
  const [repeatDays, setRepeatDays] = useState<RepeatDay[]>(editing?.repeatDays ?? [])
  const [isOneTime, setIsOneTime] = useState((editing?.repeatDays ?? []).length === 0)
  const [challenge, setChallenge] = useState<ChallengeType>(editing?.challenge ?? 'math')
  const [wakeCheckEnabled, setWakeCheckEnabled] = useState(editing?.wakeCheckEnabled ?? false)
  const [wakeCheckDelay, setWakeCheckDelay] = useState<number>(editing?.wakeCheckDelayMinutes ?? 5)

  useEffect(() => {
    if (isOneTime) setRepeatDays([])
  }, [isOneTime])

  const toggleDay = (day: RepeatDay) => {
    setRepeatDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
  }

  const handleSave = () => {
    if (editing) {
      updateAlarm(editing.id, {
        hour, minute, label, repeatDays, challenge, lastFiredDate: null,
        wakeCheckEnabled, wakeCheckDelayMinutes: wakeCheckDelay,
      })
    } else {
      addAlarm({
        hour, minute, label, repeatDays, challenge, enabled: true,
        wakeCheckEnabled, wakeCheckDelayMinutes: wakeCheckDelay,
      })
    }
    onClose()
  }

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Sheet */}
      <div
        className="relative w-full max-w-lg glass rounded-t-3xl p-6 pb-10 animate-slide-up overflow-y-auto max-h-[92dvh]"
        style={{ background: 'rgba(8, 5, 30, 0.97)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {editing ? 'Edit Alarm' : 'New Alarm'}
            </h2>
            <p className="text-white/30 text-xs mt-0.5">Set your wake-up time and challenge</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center">×</button>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/8 my-5" />

        {/* Time picker */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex items-center gap-1 glass rounded-2xl overflow-hidden px-2">
            <button
              onClick={() => setHour((h) => (h - 1 + 24) % 24)}
              className="text-white/40 hover:text-white text-xl w-8 h-full py-4 flex items-center justify-center"
            >−</button>
            <input
              type="number"
              min={0}
              max={23}
              value={pad(hour)}
              onChange={(e) => setHour(Math.min(23, Math.max(0, parseInt(e.target.value) || 0)))}
              className="w-16 text-5xl font-light text-center bg-transparent text-white py-4 outline-none"
            />
            <button
              onClick={() => setHour((h) => (h + 1) % 24)}
              className="text-white/40 hover:text-white text-xl w-8 h-full py-4 flex items-center justify-center"
            >+</button>
          </div>
          <span className="text-5xl font-extralight text-white/40 select-none">:</span>
          <div className="flex items-center gap-1 glass rounded-2xl overflow-hidden px-2">
            <button
              onClick={() => setMinute((m) => (m - 1 + 60) % 60)}
              className="text-white/40 hover:text-white text-xl w-8 h-full py-4 flex items-center justify-center"
            >−</button>
            <input
              type="number"
              min={0}
              max={59}
              value={pad(minute)}
              onChange={(e) => setMinute(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
              className="w-16 text-5xl font-light text-center bg-transparent text-white py-4 outline-none"
            />
            <button
              onClick={() => setMinute((m) => (m + 1) % 60)}
              className="text-white/40 hover:text-white text-xl w-8 h-full py-4 flex items-center justify-center"
            >+</button>
          </div>
          <div className="flex flex-col gap-1 ml-2">
            <button
              onClick={() => setHour((h) => h < 12 ? h : h - 12)}
              className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                hour < 12 ? 'bg-amber-400 text-black' : 'text-white/40 hover:text-white'
              }`}
            >AM</button>
            <button
              onClick={() => setHour((h) => h >= 12 ? h : h + 12)}
              className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                hour >= 12 ? 'bg-amber-400 text-black' : 'text-white/40 hover:text-white'
              }`}
            >PM</button>
          </div>
        </div>

        {/* Label */}
        <div className="glass rounded-2xl mb-4 overflow-hidden">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (e.g. Morning run)"
            maxLength={40}
            className="w-full bg-transparent px-5 py-3.5 text-white placeholder-white/25 outline-none text-sm font-medium"
          />
        </div>

        {/* One-time vs Repeat */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setIsOneTime(true)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              isOneTime ? 'bg-amber-400 text-black' : 'glass text-white/50'
            }`}
          >
            One Time
          </button>
          <button
            onClick={() => setIsOneTime(false)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              !isOneTime ? 'bg-amber-400 text-black' : 'glass text-white/50'
            }`}
          >
            Repeat
          </button>
        </div>

        {/* Day selector */}
        {!isOneTime && (
          <div className="flex gap-2 mb-4">
            {DAY_LABELS.map((dayLabel, i) => (
              <button
                key={i}
                onClick={() => toggleDay(i as RepeatDay)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  repeatDays.includes(i as RepeatDay)
                    ? 'bg-amber-400/20 text-amber-400 ring-1 ring-amber-400/50'
                    : 'glass text-white/30'
                }`}
              >
                {dayLabel}
              </button>
            ))}
          </div>
        )}

        {/* Section divider */}
        <div className="h-px bg-white/8 my-4" />

        {/* Challenge picker */}
        <div className="mb-4">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-2 px-1">Wake-up Challenge</p>
          <div className="flex gap-2">
            {([
              { id: 'math',   label: '🔢 Math'   },
              { id: 'shake',  label: '📳 Shake'  },
              { id: 'memory', label: '🧠 Memory' },
            ] as { id: ChallengeType; label: string }[]).map((c) => (
              <button
                key={c.id}
                onClick={() => setChallenge(c.id)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  challenge === c.id
                    ? 'bg-amber-400/20 text-amber-400 ring-1 ring-amber-400/50'
                    : 'glass text-white/40'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section divider */}
        <div className="h-px bg-white/8 my-4" />

        {/* Wake-up Check toggle */}
        <div className="mb-1">
          <div className="flex items-center justify-between mb-1">
            <div>
              <p className="text-white text-sm font-semibold">Wake-up Check</p>
              <p className="text-white/35 text-xs mt-0.5">Re-challenge you after dismissal</p>
            </div>
            <button
              onClick={() => setWakeCheckEnabled((v) => !v)}
              className="relative shrink-0"
              aria-label={wakeCheckEnabled ? 'Disable wake-up check' : 'Enable wake-up check'}
            >
              <div className={`w-16 h-8 rounded-full transition-colors duration-300 ${
                wakeCheckEnabled ? 'bg-orange-400' : 'bg-white/10'
              }`}>
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${
                  wakeCheckEnabled ? 'left-9' : 'left-1'
                }`} />
              </div>
            </button>
          </div>

          {wakeCheckEnabled && (
            <div className="mt-3">
              <p className="text-white/35 text-xs font-semibold uppercase tracking-widest mb-2 px-1">Check delay</p>
              <div className="flex gap-2">
                {WAKE_CHECK_DELAYS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setWakeCheckDelay(d)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      wakeCheckDelay === d
                        ? 'bg-orange-400/20 text-orange-300 ring-1 ring-orange-400/50'
                        : 'glass text-white/35'
                    }`}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={!isOneTime && repeatDays.length === 0}
          className="w-full py-4 mt-6 rounded-2xl bg-amber-400 text-black font-bold text-base tracking-wide disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          {editing ? 'Save Changes' : 'Add Alarm'}
        </button>
      </div>
    </div>
  )
}
