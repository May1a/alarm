import { useState, useEffect } from 'react'
import { type Alarm, useAlarmStore } from '../store/alarms'
import AlarmCard from './AlarmCard'
import AddAlarmModal from './AddAlarmModal'

function ClockDisplay() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const h = now.getHours()
  const m = String(now.getMinutes()).padStart(2, '0')
  const hour = h % 12 || 12
  const period = h >= 12 ? 'PM' : 'AM'

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  return (
    <div className="text-center pt-10 pb-6 select-none">
      <p className="text-white/35 text-xs font-semibold tracking-widest uppercase mb-3">
        {days[now.getDay()]}, {months[now.getMonth()]} {now.getDate()}
      </p>
      <div className="flex items-end justify-center gap-1">
        <span
          className="text-white font-extralight tracking-tight"
          style={{ fontSize: 'clamp(4rem, 22vw, 6.5rem)', lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}
        >
          {hour}:{m}
        </span>
        <div className="flex flex-col items-start pb-2 ml-1.5 gap-1.5">
          <span className="text-white/50 font-semibold text-lg leading-none">{period}</span>
          {/* Seconds as a pulse dot */}
          <div className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-full bg-white/30"
              style={{ animation: 'seconds-pulse 1s ease-in-out infinite' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function IOSBanner() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isStandalone = (window.navigator as any).standalone
  const [dismissed, setDismissed] = useState(
    localStorage.getItem('ios-banner-dismissed') === '1'
  )

  if (!isIOS || dismissed) return null

  // Show install prompt when not standalone
  if (!isStandalone) {
    return (
      <div className="mx-4 mb-4 rounded-2xl px-4 py-3.5 flex items-start gap-3 border border-amber-400/30 bg-amber-500/10">
        <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center shrink-0 mt-0.5 text-base">
          ⚠️
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold">Install required for alarms to work</p>
          <p className="text-white/55 text-xs mt-1 leading-relaxed">
            iOS stops web apps in the background. Tap{' '}
            <span className="text-white/80 font-semibold">Share →</span>{' '}
            <span className="text-white/80 font-semibold">Add to Home Screen</span>,
            then open from there and keep the screen on while you sleep.
          </p>
        </div>
        <button
          onClick={() => { setDismissed(true); localStorage.setItem('ios-banner-dismissed', '1') }}
          className="text-white/25 hover:text-white/60 text-xl leading-none shrink-0"
        >
          ×
        </button>
      </div>
    )
  }

  // Standalone — remind to keep screen on
  return (
    <div className="mx-4 mb-4 rounded-2xl px-4 py-3 flex items-center gap-3 border border-white/10 bg-white/5">
      <span className="text-base shrink-0">🔆</span>
      <p className="text-white/50 text-xs leading-relaxed flex-1">
        Keep the screen on while you sleep — iOS suspends apps when the display turns off.
      </p>
      <button
        onClick={() => { setDismissed(true); localStorage.setItem('ios-banner-dismissed', '1') }}
        className="text-white/25 hover:text-white/60 text-xl leading-none shrink-0"
      >
        ×
      </button>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
      {/* CSS illustration */}
      <div className="relative w-20 h-20 mb-6 opacity-25">
        <div className="absolute inset-0 rounded-full border-4 border-white/60" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-7 bg-white/60 rounded-full origin-bottom"
          style={{ transform: 'translate(-50%, -100%) rotate(-30deg)', transformOrigin: '50% 100%' }} />
        <div className="absolute top-1/2 left-1/2 w-1 h-5 bg-white/60 rounded-full origin-bottom"
          style={{ transform: 'translate(-50%, -100%) rotate(60deg)', transformOrigin: '50% 100%' }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 flex gap-2">
          <div className="w-3 h-3 rounded-full bg-white/60" />
          <div className="w-3 h-3 rounded-full bg-white/60" />
        </div>
      </div>
      <p className="text-white/40 text-base font-semibold">No alarms set</p>
      <p className="text-white/25 text-sm mt-1.5">Tap <span className="text-white/40 font-semibold">+</span> to add your first alarm</p>
    </div>
  )
}

export default function AlarmList() {
  const alarms = useAlarmStore((s) => s.alarms)
  const [showModal, setShowModal] = useState(false)
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null)

  const sorted = [...alarms].sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute))

  const openEdit = (alarm: Alarm) => {
    setEditingAlarm(alarm)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingAlarm(null)
  }

  return (
    <>
      <div
        className="min-h-dvh flex flex-col"
        style={{
          background: `
            radial-gradient(ellipse 70% 40% at 30% 10%, rgba(88,28,220,0.28) 0%, transparent 60%),
            radial-gradient(ellipse 50% 35% at 80% 15%, rgba(20,60,200,0.18) 0%, transparent 55%),
            radial-gradient(ellipse 60% 50% at 10% 80%, rgba(60,10,140,0.15) 0%, transparent 60%),
            linear-gradient(180deg, #000010 0%, #04001a 35%, #060020 65%, #04001a 100%)
          `,
        }}
      >
        <ClockDisplay />

        <IOSBanner />

        {/* Header row */}
        <div className="flex items-center justify-between px-5 mb-4">
          <h1 className="text-2xl font-semibold text-white tracking-tight">Alarms</h1>
          <button
            onClick={() => setShowModal(true)}
            className="w-12 h-12 rounded-full bg-amber-400 text-black flex items-center justify-center text-2xl font-light leading-none transition-all active:scale-90 shadow-lg shadow-amber-400/40 hover:shadow-amber-400/60 hover:bg-amber-300"
            aria-label="Add alarm"
          >
            +
          </button>
        </div>

        {/* Alarm list */}
        <div className="flex-1 px-4 flex flex-col gap-3 pb-10">
          {sorted.length === 0 ? (
            <EmptyState />
          ) : (
            sorted.map((alarm) => (
              <div key={alarm.id} className="animate-fade-in">
                <AlarmCard alarm={alarm} onEdit={openEdit} />
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <AddAlarmModal editing={editingAlarm} onClose={closeModal} />
      )}
    </>
  )
}
