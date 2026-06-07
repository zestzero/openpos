import { useState } from 'react'
import { Plus, RotateCcw } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { type UserRecord, useToggleUserActiveMutation, useUsersQuery } from '@/lib/users-api'

import { UserFormDialog } from './UserFormDialog'

export function UserManagementPage() {
  const { data: users = [], isLoading, error } = useUsersQuery()
  const toggleActiveMutation = useToggleUserActiveMutation()
  const [searchQuery, setSearchQuery] = useState('')
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null)

  const normalizedSearch = searchQuery.trim().toLowerCase()
  const filteredUsers = normalizedSearch
    ? users.filter((user) => (
      user.name.toLowerCase().includes(normalizedSearch)
      || user.email.toLowerCase().includes(normalizedSearch)
    ))
    : users

  const handleEdit = (user: UserRecord) => {
    setEditingUser(user)
    setUserDialogOpen(true)
  }

  const handleCreate = () => {
    setEditingUser(null)
    setUserDialogOpen(true)
  }

  const handleToggleActive = (userId: string) => {
    toggleActiveMutation.mutate(userId)
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-destructive">
        Failed to load users. Please try again.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">User Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create owner and cashier accounts, then control access without leaving Settings.</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <Input
        placeholder="Search by name or email..."
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        className="max-w-sm"
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-card" />
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-card border border-dashed border-border text-muted-foreground">
          {searchQuery ? 'No users match your search.' : 'No users found.'}
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={user.role === 'owner' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.is_active ? 'outline' : 'destructive'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(user.id)}
                        disabled={toggleActiveMutation.isPending}
                      >
                        <RotateCcw className="mr-1 h-3 w-3" />
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <UserFormDialog
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        user={editingUser}
      />
    </div>
  )
}
