import { useEffect, useState, type FormEvent } from 'react'

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

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserRecord | null
}

export function UserFormDialog({ open, onOpenChange, user }: UserFormDialogProps) {
  const createMutation = useCreateUserMutation()
  const updateMutation = useUpdateUserMutation()
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
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit User' : 'Add User'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="John Doe" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="john@example.com" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              value={role}
              onChange={(event) => setRole(event.target.value as 'owner' | 'cashier')}
              className="flex h-10 w-full rounded-card border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="owner">Owner</option>
              <option value="cashier">Cashier</option>
            </select>
          </div>

          {!isEditing && role === 'owner' ? (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" />
            </div>
          ) : null}

          {!isEditing && role === 'cashier' ? (
            <div className="space-y-2">
              <Label htmlFor="pin">PIN</Label>
              <Input id="pin" type="password" value={pin} onChange={(event) => setPin(event.target.value)} placeholder="4-6 digits" maxLength={6} />
            </div>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isEditing ? 'Save Changes' : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
