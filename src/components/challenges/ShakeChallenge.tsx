import { useState, useEffect, useRef } from 'react'

interface Props {
  onSuccess: () => void
  target?: number
  accentColor?: string
}

export default function ShakeChallenge({ onSuccess, target = 20, accentColor = '#fbbf24' }: Props) {
  const [count, setCount] = useState(0)
  const lastMag = useRef(0)
  const lastTime = useRef(0)
  const [supported, setSupported] = useState(true)
  const [permissionNeeded, setPermissionNeeded] = useState(false)
  const countRef = useRef(0)

  const startListening = () => {
    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity
      if (!acc) return
      const mag = Math.sqrt((acc.x ?? 0) ** 2 + (acc.y ?? 0) ** 2 + (acc.z ?? 0) ** 2)
      const now = Date.now()
      const delta = Math.abs(mag - lastMag.current)

      if (delta > 20 && now - lastTime.current > 150) {
        lastTime.current = now
        countRef.current += 1
        setCount(countRef.current)
        if (countRef.current >= target) {
          window.removeEventListener('devicemotion', handleMotion)
          onSuccess()
        }
      }
      lastMag.current = mag
    }
    window.addEventListener('devicemotion', handleMotion)
    return () => window.removeEventListener('devicemotion', handleMotion)
  }

  useEffect(() => {
    if (typeof DeviceMotionEvent === 'undefined') {
      setSupported(false)
      return
    }

    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      setPermissionNeeded(true)
      return
    }

    return startListening()
  }, [])

  const requestPermission = async () => {
    try {
      const result = await (DeviceMotionEvent as any).requestPermission()
      if (result === 'granted') {
        setPermissionNeeded(false)
        startListening()
      }
    } catch (_) {}
  }

  const progress = Math.min(count / target, 1)
  const circumference = 2 * Math.PI * 54

  if (!supported) {
    return (
      <div className="flex flex-col items-center gap-6 px-6">
        <p className="text-white/50 text-center text-sm">Shake not supported on this device.</p>
        <button
          onClick={onSuccess}
          className="w-full py-4 rounded-2xl text-black font-bold text-lg tracking-wide transition-all active:scale-95"
          style={{ background: accentColor }}
        >
          Dismiss Anyway
        </button>
      </div>
    )
  }

  if (permissionNeeded) {
    return (
      <div className="flex flex-col items-center gap-6 px-6">
        <p className="text-white/60 text-center text-sm leading-relaxed">
          Motion access is needed to detect shaking.
        </p>
        <button
          onClick={requestPermission}
          className="w-full py-4 rounded-2xl text-black font-bold text-lg tracking-wide transition-all active:scale-95"
          style={{ background: accentColor }}
        >
          Allow Motion Access
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-8 px-6">
      {/* Circular progress */}
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
          <circle
            cx="60" cy="60" r="54" fill="none"
            stroke={accentColor} strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            style={{ transition: 'stroke-dashoffset 0.2s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-white tabular-nums">{count}</span>
          <span className="text-white/40 text-xs font-medium">/ {target}</span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-white text-lg font-semibold">Shake your phone!</p>
        <p className="text-white/40 text-sm mt-1">
          {count === 0
            ? `Shake ${target} times to dismiss`
            : count >= target
            ? 'Done!'
            : `${target - count} more to go`}
        </p>
      </div>

      {/* Animated phone icon — bounce + shake */}
      <div
        className="text-5xl select-none"
        style={{
          display: 'inline-block',
          animation: count < target ? 'phone-bounce 0.6s ease-in-out infinite alternate' : 'none',
        }}
      >
        📱
      </div>
    </div>
  )
}
