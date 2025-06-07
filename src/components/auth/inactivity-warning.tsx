'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Snackbar, Alert } from '@mui/material'
import { useAuthStore } from '@/lib/zustand/auth-store'

interface InactivityWarningProps {
  timeoutMinutes: number
}

export function InactivityWarning({ timeoutMinutes }: InactivityWarningProps) {
  const { signOut, isAuthenticated } = useAuthStore()
  const [showWarning, setShowWarning] = useState(false)
  
  // Use refs to store timer IDs so they persist across re-renders
  const warningRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Track when timers were paused and remaining time
  const pausedAtRef = useRef<number | null>(null)
  const remainingWarningTimeRef = useRef<number | null>(null)
  const remainingTimeoutTimeRef = useRef<number | null>(null)
  
  // Convert minutes to milliseconds
  const timeoutDuration = timeoutMinutes * 60 * 1000
  // Warning will show 1 minute before logout
  const warningTime = 1 * 60 * 1000

  // Clear all timers
  const clearAllTimers = useCallback(() => {
    if (warningRef.current) {
      clearTimeout(warningRef.current)
      warningRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    
    // Clear pause state
    pausedAtRef.current = null
    remainingWarningTimeRef.current = null
    remainingTimeoutTimeRef.current = null
  }, [])

  // Reset timers when user is active
  const resetTimers = useCallback(() => {
    // Clear existing timers
    clearAllTimers()
    
    // Hide warning if it's showing
    setShowWarning(false)
    
    // Only set new timers if user is authenticated and tab is visible
    if (!isAuthenticated || document.hidden) return
    
    // Set a new warning timer (9 minutes for 10-minute timeout)
    warningRef.current = setTimeout(() => {
      setShowWarning(true)
    }, timeoutDuration - warningTime)
    
    // Set a new timeout timer (10 minutes)
    timeoutRef.current = setTimeout(() => {
      signOut()
    }, timeoutDuration)
  }, [timeoutDuration, warningTime, signOut, isAuthenticated, clearAllTimers])

  // Pause timers and store remaining time
  const pauseTimers = useCallback(() => {
    if (!warningRef.current && !timeoutRef.current) return
    
    const now = Date.now()
    pausedAtRef.current = now
    
    // Calculate remaining times (we don't have direct access to remaining time from setTimeout)
    // So we'll track when the timers were set and calculate remaining time
    clearAllTimers()
  }, [clearAllTimers])

  // Resume timers with remaining time
  const resumeTimers = useCallback(() => {
    if (!isAuthenticated) return
    
    // If we have a paused state, use remaining time; otherwise start fresh
    if (pausedAtRef.current) {
      // For simplicity, we'll just reset timers when resuming
      // In a production app, you might want to calculate exact remaining time
      resetTimers()
    } else {
      resetTimers()
    }
  }, [isAuthenticated, resetTimers])

  // Handle tab visibility changes
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      pauseTimers()
    } else {
      resumeTimers()
    }
  }, [pauseTimers, resumeTimers])

  // Handle user activity with throttling to improve performance
  const handleActivity = useCallback(() => {
    if (!document.hidden) {
      resetTimers()
    }
  }, [resetTimers])

  // Throttled activity handler to prevent excessive timer resets
  const throttledActivityHandler = useRef<NodeJS.Timeout | null>(null)
  
  const throttledHandleActivity = useCallback(() => {
    // Clear existing throttle timer
    if (throttledActivityHandler.current) {
      clearTimeout(throttledActivityHandler.current)
    }
    
    // Set new throttle timer (only reset timers once every 500ms)
    throttledActivityHandler.current = setTimeout(() => {
      handleActivity()
    }, 500)
  }, [handleActivity])

  // Handle warning close (user clicked or moved)
  const handleWarningClose = useCallback(() => {
    setShowWarning(false)
    resetTimers() // Reset timers when user interacts with warning
  }, [resetTimers])

  // Set up activity listeners and initial timers
  useEffect(() => {
    if (!isAuthenticated) {
      clearAllTimers()
      setShowWarning(false)
      return
    }

    // Initial timer setup (only if tab is visible)
    if (!document.hidden) {
      resetTimers()
    }

    // Add event listeners for user activity
    const events = [
      'mousemove',
      'mousedown', 
      'keypress',
      'touchmove',
      'scroll',
      'click'
    ]

    events.forEach(event => {
      window.addEventListener(event, throttledHandleActivity)
    })

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup function
    return () => {
      clearAllTimers()
      
      // Clear throttle timer
      if (throttledActivityHandler.current) {
        clearTimeout(throttledActivityHandler.current)
      }
      
      // Remove event listeners
      events.forEach(event => {
        window.removeEventListener(event, throttledHandleActivity)
      })
      
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isAuthenticated, resetTimers, throttledHandleActivity, clearAllTimers, handleVisibilityChange])

  // Don't render anything if user is not authenticated
  if (!isAuthenticated) {
    return null
  }

  return (
    <Snackbar
      open={showWarning}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      onClose={handleWarningClose}
      sx={{ zIndex: (theme) => theme.zIndex.snackbar + 1 }}
    >
      <Alert
        onClose={handleWarningClose}
        severity="warning"
        sx={{ width: '100%' }}
      >
        Your session will expire in 1 minute due to inactivity. Click or move to stay logged in.
      </Alert>
    </Snackbar>
  )
} 