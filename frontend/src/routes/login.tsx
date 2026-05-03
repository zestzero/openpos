import { useMemo, useState, type ComponentType } from 'react'
import { useMutation } from '@tanstack/react-query'
import { createRoute, useRouter } from '@tanstack/react-router'
import { CheckCircle2, KeyRound, Mail } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { api, type AuthResponse } from '@/lib/api'
import { getRedirectPath } from '@/lib/auth'
import { useAuth } from '@/hooks/useAuth'
import { Route as rootRoute } from './__root'

type LoginMode = 'password' | 'pin' | 'register'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: 'login',
  component: LoginRoute,
})

export function LoginRoute() {
  const router = useRouter()
  const { login } = useAuth()
  const [mode, setMode] = useState<LoginMode>('password')
  const [email, setEmail] = useState('')
  const [secret, setSecret] = useState('')
  const [name, setName] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      if (mode === 'register') {
        await api.registerOwner(email, secret, name)
        return api.login(email, secret)
      }

      return mode === 'password' ? api.login(email, secret) : api.loginPIN(email, secret)
    },
    onSuccess: (response: AuthResponse) => {
      login(response)
      router.navigate({ to: getRedirectPath(response.user.role), replace: true })
    },
  })

  const buttonLabel = useMemo(() => {
    if (mode === 'register') return 'Create owner account'
    return mode === 'password' ? 'Sign in with password' : 'Sign in with PIN'
  }, [mode])

  return (
    <div className="hero-wash relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-4 py-8">
      <Card className="relative w-full max-w-md border-border bg-background/95 shadow-dialog backdrop-blur-sm">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-card bg-accent text-accent-foreground">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <CardTitle>Welcome to OpenPOS</CardTitle>
          <CardDescription>Cashiers use PIN login; owners can use email and password.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2 rounded-pill border border-border bg-muted p-1">
            <TabButton active={mode === 'password'} onClick={() => setMode('password')} label="Password" />
            <TabButton active={mode === 'pin'} onClick={() => setMode('pin')} label="PIN" />
            <TabButton active={mode === 'register'} onClick={() => setMode('register')} label="Register owner" />
          </div>

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              mutation.mutate()
            }}
          >
            <Field
              label="Email"
              icon={Mail}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@store.co"
              autoComplete="email"
            />

            {mode === 'register' ? (
              <Field
                label="Name"
                icon={CheckCircle2}
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Owner name"
                autoComplete="name"
              />
            ) : null}

            <Field
              label={mode === 'pin' ? 'PIN' : 'Password'}
              icon={KeyRound}
              type="password"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              placeholder={mode === 'pin' ? 'Enter PIN' : 'Enter password'}
              autoComplete={mode === 'register' ? 'new-password' : mode === 'password' ? 'current-password' : 'off'}
              inputMode={mode === 'pin' ? 'numeric' : 'text'}
            />

            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? 'Signing in…' : buttonLabel}
            </Button>

            {mutation.isError ? (
              <p className="text-sm text-destructive">
                {mode === 'register'
                  ? 'Unable to create owner account. Check your details and try again.'
                  : 'Unable to sign in. Check your credentials and try again.'}
              </p>
            ) : null}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant={active ? 'default' : 'ghost'}
      className="h-11 rounded-pill"
      onClick={onClick}
    >
      {label}
    </Button>
  )
}

function Field({
  label,
  icon: Icon,
  ...props
}: React.ComponentProps<typeof Input> & {
  label: string
  icon: ComponentType<{ className?: string }>
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-10" {...props} />
      </div>
    </label>
  )
}
