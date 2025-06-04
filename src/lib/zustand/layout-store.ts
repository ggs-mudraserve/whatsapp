import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface LayoutState {
  sidebarCollapsed: boolean
  mobileOpen: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  setMobileOpen: (open: boolean) => void
  toggleSidebar: () => void
  toggleMobile: () => void
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileOpen: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setMobileOpen: (open) => set({ mobileOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      toggleMobile: () => set((state) => ({ mobileOpen: !state.mobileOpen })),
    }),
    {
      name: 'layout-storage',
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    }
  )
) 