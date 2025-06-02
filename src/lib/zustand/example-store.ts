import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

interface ExampleState {
  count: number
  isLoading: boolean
  error: string | null
}

interface ExampleActions {
  increment: () => void
  decrement: () => void
  reset: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export type ExampleStore = ExampleState & ExampleActions

const initialState: ExampleState = {
  count: 0,
  isLoading: false,
  error: null,
}

export const useExampleStore = create<ExampleStore>()(
  subscribeWithSelector((set) => ({
    ...initialState,
    increment: () => set((state) => ({ count: state.count + 1 })),
    decrement: () => set((state) => ({ count: state.count - 1 })),
    reset: () => set({ count: 0 }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
  }))
) 