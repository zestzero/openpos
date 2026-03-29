import { useState, useCallback } from 'react'
import { Delete, LogIn, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'

const PIN_LENGTH = 6
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const

export function PinLogin() {
  const { loginWithPin } = useAuth()
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleKey = useCallback(
    (key: string) => {
      if (loading) return
      setError(null)
      if (key === 'del') {
        setPin((p) => p.slice(0, -1))
      } else if (pin.length < PIN_LENGTH) {
        setPin((p) => p + key)
      }
    },
    [pin, loading]
  )

  const handleSubmit = useCallback(async () => {
    if (pin.length < 4 || loading) return
    setLoading(true)
    setError(null)
    try {
      await loginWithPin(pin)
    } catch {
      setError('Invalid PIN')
      setPin('')
    } finally {
      setLoading(false)
    }
  }, [pin, loading, loginWithPin])

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6">
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          OpenPOS
        </h1>
        <p className="mt-1 text-sm text-zinc-500">Enter your PIN to start</p>
      </div>

      <div className="mb-2 flex gap-3">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <div
            key={i}
            className={`size-3.5 rounded-full transition-all duration-150 ${
              i < pin.length
                ? 'scale-110 bg-zinc-900'
                : 'border-2 border-zinc-300 bg-transparent'
            }`}
          />
        ))}
      </div>

      <div className="mb-6 h-5">
        {error && (
          <p className="text-sm font-medium text-destructive">{error}</p>
        )}
      </div>

      <div className="grid w-full max-w-[17rem] grid-cols-3 gap-3">
        {KEYS.map((key, i) => {
          if (key === '') return <div key={i} />
          if (key === 'del') {
            return (
              <Button
                key={i}
                variant="ghost"
                size="lg"
                className="h-14 text-lg text-zinc-500"
                onClick={() => handleKey('del')}
                disabled={loading || pin.length === 0}
                aria-label="Delete"
              >
                <Delete className="size-5" />
              </Button>
            )
          }
          return (
            <Button
              key={i}
              variant="outline"
              size="lg"
              className="h-14 text-lg font-medium"
              onClick={() => handleKey(key)}
              disabled={loading}
            >
              {key}
            </Button>
          )
        })}
      </div>

      <Button
        className="mt-8 w-full max-w-[17rem] h-12 text-base font-medium"
        onClick={handleSubmit}
        disabled={pin.length < 4 || loading}
      >
        {loading ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <>
            <LogIn className="size-5" />
            Sign In
          </>
        )}
      </Button>
    </div>
  )
}
