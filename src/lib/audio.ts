let audioCtx: AudioContext | null = null

export function startAlarm() {
  stopAlarm()

  try {
    audioCtx = new AudioContext()
    const schedule = [
      { freq: 880, time: 0 },
      { freq: 1100, time: 0.2 },
      { freq: 880, time: 0.4 },
      { freq: 1100, time: 0.6 },
    ]

    const loop = () => {
      if (!audioCtx) return
      const now = audioCtx.currentTime
      schedule.forEach(({ freq, time }) => {
        const osc = audioCtx!.createOscillator()
        const gain = audioCtx!.createGain()
        osc.type = 'sine'
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0, now + time)
        gain.gain.linearRampToValueAtTime(0.4, now + time + 0.05)
        gain.gain.linearRampToValueAtTime(0, now + time + 0.18)
        osc.connect(gain)
        gain.connect(audioCtx!.destination)
        osc.start(now + time)
        osc.stop(now + time + 0.2)
      })
    }

    loop()
    const interval = setInterval(() => {
      if (!audioCtx) { clearInterval(interval); return }
      loop()
    }, 800)

    ;(audioCtx as unknown as Record<string, unknown>)._interval = interval
  } catch (e) {
    console.error('Audio error:', e)
  }
}

export function stopAlarm() {
  if (audioCtx) {
    clearInterval((audioCtx as unknown as Record<string, unknown>)._interval as number)
    try { audioCtx.close() } catch (_) {}
    audioCtx = null
  }
}
