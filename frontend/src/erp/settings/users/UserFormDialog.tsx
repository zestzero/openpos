import { useEffect, useRef, useState, type FormEvent } from 'react'

import { FormSelect } from '@/components/ui/form-select'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  type CreateUserValues,
  type UpdateUserValues,
  type UserRecord,
  useCreateUserMutation,
  useUpdateUserMutation,
} from '@/lib/users-api'
import { useI18n } from '@/lib/i18n'

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserRecord | null
}

export function UserFormDialog({ open, onOpenChange, user }: UserFormDialogProps) {
  const { t } = useI18n()
  const createMutation = useCreateUserMutation()
  const updateMutation = useUpdateUserMutation()
  const dialogContentRef = useRef<HTMLDivElement>(null)
  const isEditing = user !== null

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'owner' | 'cashier'>('cashier')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
      setRole(user.role)
    } else {
      setName('')
      setEmail('')
      setRole('cashier')
    }

    setPassword('')
    setPin('')
    setError('')
  }, [user, open])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const trimmedName = name.trim()
    const trimmedEmail = email.trim()

    if (!trimmedName || !trimmedEmail) {
      setError('Name and email are required.')
      return
    }

    if (!isEditing && role === 'owner' && !password.trim()) {
      setError('Password is required for owner users.')
      return
    }

    if (!isEditing && role === 'cashier' && !pin.trim()) {
      setError('PIN is required for cashier users.')
      return
    }

    try {
      if (isEditing && user) {
        const data: UpdateUserValues = { name: trimmedName, email: trimmedEmail, role }
        await updateMutation.mutateAsync({ id: user.id, data })
      } else {
        const data: CreateUserValues = {
          name: trimmedName,
          email: trimmedEmail,
          role,
          password,
          pin,
        }
        await createMutation.mutateAsync(data)
      }
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.retry'))
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent ref={dialogContentRef}>
        <DialogHeader>
          <DialogTitle>{isEditing ? t('erp.editUser') : t('erp.addUserTitle')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('common.name')}</Label>
            <Input id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder={t('auth.namePlaceholder')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('common.email')}</Label>
            <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t('auth.emailPlaceholder')} />
          </div>

          <div className="space-y-2">
            <Label id="role-label" htmlFor="role">{t('erp.role')}</Label>
            <FormSelect
              portalContainer={dialogContentRef}
              aria-labelledby="role-label"
              value={role}
              onValueChange={(value) => value !== null && setRole(value as 'owner' | 'cashier')}
              options={[
                { value: 'owner', label: t('erp.owner') },
                { value: 'cashier', label: t('erp.cashier') },
              ]}
              className="h-10 rounded-card bg-background px-3 text-sm"
            />
          </div>

          {!isEditing && role === 'owner' ? (
            <div className="space-y-2">
              <Label htmlFor="password">{t('common.password')}</Label>
              <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t('auth.passwordPlaceholder')} />
            </div>
          ) : null}

          {!isEditing && role === 'cashier' ? (
            <div className="space-y-2">
              <Label htmlFor="pin">{t('common.pin')}</Label>
              <Input id="pin" type="password" value={pin} onChange={(event) => setPin(event.target.value)} placeholder={t('auth.pinPlaceholder')} maxLength={6} />
            </div>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isEditing ? t('erp.saveChanges') : t('erp.createUser')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
