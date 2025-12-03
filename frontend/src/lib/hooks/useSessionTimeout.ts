import { useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'

const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes in milliseconds

export function useSessionTimeout() {
  const { user, logout } = useAuth()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const resetTimeout = () => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Only set timeout if user is logged in
    if (user) {
      timeoutRef.current = setTimeout(() => {
        console.log('Session timeout - logging out due to inactivity')
        logout()
      }, INACTIVITY_TIMEOUT)
    }
  }

  useEffect(() => {
    if (!user) return

    // Events that indicate user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']

    // Reset timeout on any user activity
    const handleActivity = () => {
      resetTimeout()
    }

    // Set initial timeout
    resetTimeout()

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity)
    })

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      events.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
    }
  }, [user, logout])
}
