import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type RepeatDay = 0 | 1 | 2 | 3 | 4 | 5 | 6 // 0=Sun, 6=Sat
export type ChallengeType = 'math' | 'shake' | 'memory'

export interface Alarm {
  id: string
  hour: number
  minute: number
  label: string
  enabled: boolean
  repeatDays: RepeatDay[] // empty = one-time
  challenge: ChallengeType
  lastFiredDate: string | null // ISO date string of last fire (YYYY-MM-DD)
  wakeCheckEnabled: boolean
  wakeCheckDelayMinutes: number
}

interface AlarmStore {
  alarms: Alarm[]
  firingAlarmId: string | null
  // Ephemeral — not persisted across restarts
  pendingWakeCheck: { alarmId: string; fireAt: number } | null
  firingWakeCheckId: string | null

  addAlarm: (alarm: Omit<Alarm, 'id' | 'lastFiredDate'>) => void
  updateAlarm: (id: string, updates: Partial<Alarm>) => void
  deleteAlarm: (id: string) => void
  toggleAlarm: (id: string) => void
  setFiringAlarm: (id: string | null) => void
  markAlarmFired: (id: string) => void
  scheduleWakeCheck: (alarmId: string, delayMinutes: number) => void
  clearWakeCheck: () => void
  setFiringWakeCheck: (id: string | null) => void
}

export const useAlarmStore = create<AlarmStore>()(
  persist(
    (set) => ({
      alarms: [],
      firingAlarmId: null,
      pendingWakeCheck: null,
      firingWakeCheckId: null,

      addAlarm: (alarm) =>
        set((state) => ({
          alarms: [
            ...state.alarms,
            { ...alarm, id: crypto.randomUUID(), lastFiredDate: null },
          ],
        })),

      updateAlarm: (id, updates) =>
        set((state) => ({
          alarms: state.alarms.map((a) => (a.id === id ? { ...a, ...updates } : a)),
        })),

      deleteAlarm: (id) =>
        set((state) => ({ alarms: state.alarms.filter((a) => a.id !== id) })),

      toggleAlarm: (id) =>
        set((state) => ({
          alarms: state.alarms.map((a) =>
            a.id === id ? { ...a, enabled: !a.enabled } : a
          ),
        })),

      setFiringAlarm: (id) => set({ firingAlarmId: id }),

      markAlarmFired: (id) => {
        const today = new Date().toISOString().split('T')[0]
        set((state) => ({
          alarms: state.alarms.map((a) => {
            if (a.id !== id) return a
            if (a.repeatDays.length === 0) {
              return { ...a, enabled: false, lastFiredDate: today }
            }
            return { ...a, lastFiredDate: today }
          }),
        }))
      },

      scheduleWakeCheck: (alarmId, delayMinutes) =>
        set({ pendingWakeCheck: { alarmId, fireAt: Date.now() + delayMinutes * 60_000 } }),

      clearWakeCheck: () =>
        set({ pendingWakeCheck: null, firingWakeCheckId: null }),

      setFiringWakeCheck: (id) => set({ firingWakeCheckId: id }),
    }),
    {
      name: 'wakey-alarms',
      // Only persist alarms array — ephemeral wake-check state clears on restart
      partialize: (state) => ({ alarms: state.alarms }),
    }
  )
)
