import { useEffect, useRef, useState } from 'react'

interface IdleTimeoutOptions {
  /**
   * Idle timeout in milliseconds (default: 30 minutes)
   */
  timeout?: number
  /**
   * Warning time before logout in milliseconds (default: 2 minutes)
   */
  warningTime?: number
  /**
   * Callback when user becomes idle
   */
  onIdle: () => void
  /**
   * Callback when warning should be shown
   */
  onWarning?: () => void
}

/**
 * Hook to detect user inactivity and trigger auto-logout
 * Monitors mouse, keyboard, touch, and scroll events
 */
export function useIdleTimeout({
  timeout = 30 * 60 * 1000, // 30 minutes
  warningTime = 2 * 60 * 1000, // 2 minutes
  onIdle,
  onWarning,
}: IdleTimeoutOptions) {
  const [isWarning, setIsWarning] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const warningTimeoutRef = useRef<NodeJS.Timeout>()

  const resetTimer = useRef(() => {
    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current)
    }

    // Clear warning state
    setIsWarning(false)

    // Set warning timer
    const warningDelay = timeout - warningTime
    if (onWarning && warningDelay > 0) {
      warningTimeoutRef.current = setTimeout(() => {
        setIsWarning(true)
        onWarning()
      }, warningDelay)
    }

    // Set idle timer
    timeoutRef.current = setTimeout(() => {
      onIdle()
    }, timeout)
  })

  // Update resetTimer function when dependencies change
  useEffect(() => {
    resetTimer.current = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current)
      }

      setIsWarning(false)

      const warningDelay = timeout - warningTime
      if (onWarning && warningDelay > 0) {
        warningTimeoutRef.current = setTimeout(() => {
          setIsWarning(true)
          onWarning()
        }, warningDelay)
      }

      timeoutRef.current = setTimeout(() => {
        onIdle()
      }, timeout)
    }
  }, [timeout, warningTime, onIdle, onWarning])

  const handleActivity = useRef(() => {
    if (!isWarning) {
      resetTimer.current()
    }
  })

  // Update handleActivity when isWarning changes
  useEffect(() => {
    handleActivity.current = () => {
      if (!isWarning) {
        resetTimer.current()
      }
    }
  }, [isWarning])

  const stayActive = () => {
    setIsWarning(false)
    resetTimer.current()
  }

  useEffect(() => {
    // List of events to track user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ]

    const activityHandler = () => handleActivity.current()

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, activityHandler)
    })

    // Start initial timer
    resetTimer.current()

    // Cleanup
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, activityHandler)
      })
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current)
      }
    }
  }, [])

  return {
    isWarning,
    stayActive,
    resetTimer: resetTimer.current,
  }
}
