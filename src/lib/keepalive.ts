/**
 * Silent audio keepalive for iOS.
 *
 * iOS suspends background web app JS after ~30 s. Playing a near-silent
 * audio ping every 20 s keeps the Audio Session "active", which delays
 * suspension and allows the alarm scheduler to keep running longer.
 *
 * Must be started from a user-gesture context (button tap etc.) because
 * iOS requires a user interaction before an AudioContext can produce sound.
 */

let ctx: AudioContext | null = null
let intervalId: ReturnType<typeof setInterval> | null = null

function ping() {
  if (!ctx || ctx.state === 'closed') return
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }

  // Near-silent 10 ms tone — quiet enough to be inaudible, loud enough that
  // iOS does not classify the session as silent and suspend it.
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.001, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.01)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.01)
}

export function startKeepAlive() {
  if (ctx) return // already running
  try {
    ctx = new AudioContext()
    ping() // immediate first ping to activate the session
    intervalId = setInterval(ping, 20_000)
  } catch (_) {}
}

export function stopKeepAlive() {
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
  if (ctx) {
    try { ctx.close() } catch (_) {}
    ctx = null
  }
}
