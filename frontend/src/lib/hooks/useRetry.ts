import { useState, useCallback } from 'react'

interface RetryOptions {
  maxAttempts?: number
  delayMs?: number
  backoffMultiplier?: number
}

interface RetryState {
  isLoading: boolean
  error: Error | null
  attemptCount: number
}

export function useRetry<T>(
  asyncFunction: () => Promise<T>,
  options: RetryOptions = {},
) {
  const { maxAttempts = 3, delayMs = 1000, backoffMultiplier = 2 } = options

  const [state, setState] = useState<RetryState>({
    isLoading: false,
    error: null,
    attemptCount: 0,
  })

  const execute = useCallback(async (): Promise<T | null> => {
    setState({ isLoading: true, error: null, attemptCount: 0 })

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await asyncFunction()
        setState({ isLoading: false, error: null, attemptCount: attempt })
        return result
      } catch (error) {
        const isLastAttempt = attempt === maxAttempts

        if (isLastAttempt) {
          setState({
            isLoading: false,
            error: error as Error,
            attemptCount: attempt,
          })
          return null
        }

        // Wait before retry with exponential backoff
        const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1)
        await new Promise((resolve) => setTimeout(resolve, delay))

        setState((prev) => ({ ...prev, attemptCount: attempt }))
      }
    }

    return null
  }, [asyncFunction, maxAttempts, delayMs, backoffMultiplier])

  const retry = useCallback(async (): Promise<T | null> => {
    return execute()
  }, [execute])

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null, attemptCount: 0 })
  }, [])

  return {
    ...state,
    execute,
    retry,
    reset,
    canRetry: !state.isLoading && state.error !== null,
  }
}
