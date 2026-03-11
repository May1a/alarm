import { useState, useEffect, useRef } from 'react'

interface Props {
  onSuccess: () => void
  length?: number
}

const COLORS = [
  { id: 0, bg: 'bg-red-500',    active: 'bg-red-300',    ring: 'ring-red-400'   },
  { id: 1, bg: 'bg-blue-500',   active: 'bg-blue-300',   ring: 'ring-blue-400'  },
  { id: 2, bg: 'bg-green-500',  active: 'bg-green-300',  ring: 'ring-green-400' },
  { id: 3, bg: 'bg-yellow-500', active: 'bg-yellow-300', ring: 'ring-yellow-400'},
]

type Phase = 'showing' | 'input' | 'fail' | 'success'

function generateSequence(len: number): number[] {
  return Array.from({ length: len }, () => Math.floor(Math.random() * 4))
}

export default function MemoryChallenge({ onSuccess, length = 5 }: Props) {
  const [sequence] = useState(() => generateSequence(length))
  const [phase, setPhase] = useState<Phase>('showing')
  const [highlighted, setHighlighted] = useState<number | null>(null)
  const [userInput, setUserInput] = useState<number[]>([])
  const [showError, setShowError] = useState(false)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
  }

  const playSequence = () => {
    setPhase('showing')
    setUserInput([])
    setShowError(false)

    let delay = 600
    sequence.forEach((colorId, i) => {
      const t1 = setTimeout(() => setHighlighted(colorId), delay)
      const t2 = setTimeout(() => setHighlighted(null), delay + 500)
      timeoutsRef.current.push(t1, t2)
      delay += 800
      if (i === sequence.length - 1) {
        const t3 = setTimeout(() => setPhase('input'), delay + 200)
        timeoutsRef.current.push(t3)
      }
    })
  }

  useEffect(() => {
    playSequence()
    return clearTimeouts
  }, [])

  const handleTap = (colorId: number) => {
    if (phase !== 'input') return

    setHighlighted(colorId)
    setTimeout(() => setHighlighted(null), 200)

    const next = [...userInput, colorId]
    const idx = next.length - 1

    if (next[idx] !== sequence[idx]) {
      setShowError(true)
      setPhase('fail')
      setTimeout(() => {
        clearTimeouts()
        playSequence()
      }, 1000)
      return
    }

    setUserInput(next)

    if (next.length === sequence.length) {
      setPhase('success')
      setTimeout(onSuccess, 600)
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 px-4">
      {/* Progress */}
      <div className="flex gap-2">
        {sequence.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i < userInput.length
                ? 'bg-amber-400'
                : i === userInput.length && phase === 'input'
                ? 'bg-amber-400/30 animate-pulse'
                : 'bg-white/10'
            }`}
            style={{ width: '28px' }}
          />
        ))}
      </div>

      {/* Status */}
      <p className="text-white/60 text-sm font-medium text-center">
        {phase === 'showing' && 'Watch the sequence…'}
        {phase === 'input' && `Repeat it! (${userInput.length}/${sequence.length})`}
        {phase === 'fail' && <span className="text-red-400">Wrong! Watch again…</span>}
        {phase === 'success' && <span className="text-green-400">Perfect!</span>}
      </p>

      {/* 2×2 grid — responsive sizing */}
      <div
        className={`grid grid-cols-2 gap-3 transition-all ${showError ? 'ring-2 ring-red-400 rounded-2xl p-1' : ''}`}
      >
        {COLORS.map((color) => (
          <button
            key={color.id}
            onPointerDown={() => handleTap(color.id)}
            disabled={phase !== 'input'}
            className={`rounded-2xl transition-all duration-150 active:scale-95
              ${highlighted === color.id ? color.active : color.bg}
              ${phase === 'input' ? 'cursor-pointer opacity-100' : 'opacity-60 cursor-default'}
              ${highlighted === color.id ? `ring-4 ${color.ring} ring-offset-2 ring-offset-transparent scale-105` : ''}
            `}
            style={{ width: 'min(40vw, 130px)', height: 'min(40vw, 130px)' }}
          />
        ))}
      </div>
    </div>
  )
}
