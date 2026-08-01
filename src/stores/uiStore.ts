import { create } from 'zustand'

export type Toast = { id: number; text: string; kind: 'achievement' | 'info' | 'danger' }

interface UiState {
  toasts: Toast[]
  showMenuBg: boolean
  pushToast: (text: string, kind?: Toast['kind']) => void
  dismissToast: (id: number) => void
  setMenuBg: (v: boolean) => void
}

let toastSeq = 1

export const useUiStore = create<UiState>((set) => ({
  toasts: [],
  showMenuBg: true,
  pushToast: (text, kind = 'info') => {
    const id = toastSeq++
    set((s) => ({ toasts: [...s.toasts, { id, text, kind }].slice(-4) }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 4200)
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  setMenuBg: (v) => set({ showMenuBg: v }),
}))
