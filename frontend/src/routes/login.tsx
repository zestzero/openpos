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

type LoginMode = 'password' | 'pin'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: 'login',
  component: LoginRoute,
})

function LoginRoute() {
  const router = useRouter()
  const { login } = useAuth()
  const [mode, setMode] = useState<LoginMode>('password')
  const [email, setEmail] = useState('')
  const [secret, setSecret] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      return mode === 'password' ? api.login(email, secret) : api.loginPIN(email, secret)
    },
    onSuccess: (response: AuthResponse) => {
      login(response)
      router.navigate({ to: getRedirectPath(response.user.role), replace: true })
    },
  })

  const buttonLabel = useMemo(() => (mode === 'password' ? 'Sign in with password' : 'Sign in with PIN'), [mode])

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50 px-4 py-8">
      <Card className="w-full max-w-md border-slate-200 bg-white shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <CardTitle>Welcome to OpenPOS</CardTitle>
          <CardDescription>Cashiers use PIN login; owners can use email and password.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
            <TabButton active={mode === 'password'} onClick={() => setMode('password')} label="Password" />
            <TabButton active={mode === 'pin'} onClick={() => setMode('pin')} label="PIN" />
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

            <Field
              label={mode === 'password' ? 'Password' : 'PIN'}
              icon={KeyRound}
              type={mode === 'password' ? 'password' : 'password'}
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              placeholder={mode === 'password' ? 'Enter password' : 'Enter PIN'}
              autoComplete={mode === 'password' ? 'current-password' : 'off'}
              inputMode={mode === 'pin' ? 'numeric' : 'text'}
            />

            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? 'Signing in…' : buttonLabel}
            </Button>

            {mutation.isError ? (
              <p className="text-sm text-rose-600">Unable to sign in. Check your credentials and try again.</p>
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
      className="h-11 rounded-xl"
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
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input className="pl-9" {...props} />
      </div>
    </label>
  )
}
