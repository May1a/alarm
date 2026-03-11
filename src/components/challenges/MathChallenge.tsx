import { useState, useMemo } from 'react'

interface Props {
  onSuccess: () => void
  accentColor?: string
}

type Problem = { a: number; b: number; op: '+' | '-' | '×'; answer: number }

function generateProblems(): Problem[] {
  const problems: Problem[] = []
  for (let i = 0; i < 3; i++) {
    const type = Math.floor(Math.random() * 3) as 0 | 1 | 2
    let a: number, b: number, answer: number, op: '+' | '-' | '×'
    if (type === 0) {
      a = Math.floor(Math.random() * 50) + 10
      b = Math.floor(Math.random() * 50) + 10
      op = '+'
      answer = a + b
    } else if (type === 1) {
      a = Math.floor(Math.random() * 50) + 30
      b = Math.floor(Math.random() * 30) + 1
      op = '-'
      answer = a - b
    } else {
      a = Math.floor(Math.random() * 12) + 2
      b = Math.floor(Math.random() * 12) + 2
      op = '×'
      answer = a * b
    }
    problems.push({ a, b, op, answer })
  }
  return problems
}

const KEYPAD = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['⌫', '0', '✓'],
]

export default function MathChallenge({ onSuccess, accentColor = '#fbbf24' }: Props) {
  const problems = useMemo(() => generateProblems(), [])
  const [current, setCurrent] = useState(0)
  const [input, setInput] = useState('')
  const [shake, setShake] = useState(false)

  const problem = problems[current]
  const isLast = current + 1 >= problems.length

  const handleSubmit = () => {
    if (!input) return
    if (parseInt(input) === problem.answer) {
      if (isLast) {
        onSuccess()
      } else {
        setCurrent(current + 1)
        setInput('')
      }
    } else {
      setShake(true)
      setInput('')
      setTimeout(() => setShake(false), 600)
    }
  }

  const handleKeyPress = (key: string) => {
    if (key === '⌫') {
      setInput((prev) => prev.slice(0, -1))
    } else if (key === '✓') {
      handleSubmit()
    } else {
      if (input.length >= 5) return
      // Handle negative sign for subtraction results (not needed since a > b always)
      setInput((prev) => prev + key)
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto px-4">
      {/* Progress dots */}
      <div className="flex gap-3">
        {problems.map((_, i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full transition-all duration-300"
            style={{
              background: i < current ? accentColor : i === current ? accentColor : 'rgba(255,255,255,0.15)',
              transform: i === current ? 'scale(1.3)' : i < current ? 'scale(0.9)' : 'scale(1)',
              opacity: i < current ? 0.6 : 1,
            }}
          />
        ))}
      </div>

      {/* Problem */}
      <div className="text-center">
        <p className="text-white/40 text-xs font-semibold tracking-widest uppercase mb-2">
          Problem {current + 1} of {problems.length}
        </p>
        <p className="text-5xl font-bold tracking-tight text-white">
          {problem.a} {problem.op} {problem.b} = ?
        </p>
      </div>

      {/* Answer display */}
      <div
        className={`w-full glass rounded-2xl flex items-center justify-center h-16 transition-all ${
          shake ? 'ring-2 ring-red-400' : ''
        }`}
        style={shake ? { animation: 'shake-hint 0.5s ease' } : {}}
      >
        <span className={`text-3xl font-semibold tabular-nums ${input ? 'text-white' : 'text-white/20'}`}>
          {input || '—'}
        </span>
      </div>

      {/* Custom numeric keypad */}
      <div className="w-full grid grid-cols-3 gap-2">
        {KEYPAD.flat().map((key) => {
          const isSubmit = key === '✓'
          const isBackspace = key === '⌫'
          const isDisabled = isSubmit && !input
          return (
            <button
              key={key}
              onPointerDown={() => handleKeyPress(key)}
              disabled={isDisabled}
              className={`h-14 rounded-2xl text-xl font-semibold transition-all active:scale-95 select-none ${
                isSubmit
                  ? `text-black font-bold disabled:opacity-30`
                  : isBackspace
                  ? 'glass text-white/60 hover:text-white'
                  : 'glass text-white hover:bg-white/10'
              }`}
              style={isSubmit ? { background: accentColor } : {}}
            >
              {key}
            </button>
          )
        })}
      </div>
    </div>
  )
}
