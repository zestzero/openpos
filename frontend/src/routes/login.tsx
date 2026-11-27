import { useMemo, useState, type ComponentType } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createRoute, useRouter } from '@tanstack/react-router'
import { CheckCircle2, KeyRound, Mail } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Chip } from '@/components/ui/chip'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { Input } from '@/components/ui/input'
import { api, type AuthResponse } from '@/lib/api'
import { getRedirectPath } from '@/lib/auth'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/lib/i18n'
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
  const { t } = useI18n()
  const [mode, setMode] = useState<LoginMode>('password')
  const [email, setEmail] = useState('')
  const [secret, setSecret] = useState('')
  const [name, setName] = useState('')

  const { data: authConfig } = useQuery({
    queryKey: ['auth-config'],
    queryFn: api.getAuthConfig,
    staleTime: 60_000,
  })
  const showRegister = authConfig?.publicRegistration !== false
  const activeMode = showRegister ? mode : mode === 'register' ? 'password' : mode

  const mutation = useMutation({
    mutationFn: async () => {
      if (activeMode === 'register') {
        await api.registerOwner(email, secret, name)
        return api.login(email, secret)
      }

      return activeMode === 'password' ? api.login(email, secret) : api.loginPIN(email, secret)
    },
    onSuccess: (response: AuthResponse) => {
      login(response)
      router.navigate({ to: getRedirectPath(response.user.role), replace: true })
    },
  })

  const buttonLabel = useMemo(() => {
    if (activeMode === 'register') return t('auth.createOwner')
    return activeMode === 'password' ? t('auth.signInWithPassword') : t('auth.signInWithPin')
  }, [activeMode, t])

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
      <Card className="relative w-full max-w-lg">
        <div className="absolute right-4 top-4">
          <LanguageSwitcher />
        </div>
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <CheckCircle2 className="size-6" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">{t('auth.welcome')}</CardTitle>
          <CardDescription className="text-base">{t('auth.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`grid gap-2 rounded-pill border border-border bg-muted p-1 ${showRegister ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabButton active={activeMode === 'password'} onClick={() => setMode('password')} label={t('auth.passwordMode')} />
            <TabButton active={activeMode === 'pin'} onClick={() => setMode('pin')} label={t('common.pin')} />
            {showRegister ? (
              <TabButton active={activeMode === 'register'} onClick={() => setMode('register')} label={t('auth.register')} />
            ) : null}
          </div>

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              mutation.mutate()
            }}
          >
            <Field
              label={t('common.email')}
              icon={Mail}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@store.co"
              autoComplete="email"
            />

            {activeMode === 'register' ? (
              <Field
                label={t('common.name')}
                icon={CheckCircle2}
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t('auth.namePlaceholder')}
                autoComplete="name"
              />
            ) : null}

            <Field
              label={activeMode === 'pin' ? t('common.pin') : t('common.password')}
              icon={KeyRound}
              type="password"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              placeholder={activeMode === 'pin' ? t('auth.enterPin') : t('auth.enterPassword')}
              autoComplete={activeMode === 'register' ? 'new-password' : activeMode === 'password' ? 'current-password' : 'off'}
              inputMode={activeMode === 'pin' ? 'numeric' : 'text'}
            />

            <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? (activeMode === 'register' ? t('auth.registering') : t('auth.signingIn')) : buttonLabel}
            </Button>

            {mutation.isError ? (
              <p className="text-sm text-destructive">
                {activeMode === 'register'
                  ? t('auth.registrationFailed')
                  : t('auth.invalidCredentials')}
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
    <Chip active={active} className="h-11 w-full min-h-11 whitespace-nowrap px-3 text-sm" onClick={onClick}>
      {label}
    </Chip>
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
