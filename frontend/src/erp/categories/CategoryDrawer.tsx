import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FormSelect } from '@/components/ui/form-select'
import { Input } from '@/components/ui/input'
import type { CatalogCategory, CategoryFormValues } from '@/lib/erp-api'
import { normalizeCategoryDraft } from '@/lib/erp-api'
import { useI18n } from '@/lib/i18n'

type CategoryDrawerProps = {
  open: boolean
  category?: CatalogCategory | null
  categories: CatalogCategory[]
  onOpenChange: (open: boolean) => void
  onSave: (values: CategoryFormValues) => void | Promise<void>
}

export function CategoryDrawer({ open, category, categories, onOpenChange, onSave }: CategoryDrawerProps) {
  const { t } = useI18n()
  const [draft, setDraft] = useState<CategoryFormValues>(() => normalizeCategoryDraft(category))
  const dialogContentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setDraft(normalizeCategoryDraft(category))
    }
  }, [open, category])

  const title = useMemo(() => (category ? t('erp.categoryEdit') : t('erp.categoryCreate')), [category, t])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent ref={dialogContentRef} className="flex max-h-[min(90vh,640px)] w-[calc(100vw-2rem)] max-w-xl flex-col gap-0 overflow-hidden p-0 sm:rounded-card">
        <div className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="border-b border-border px-6 py-5 text-left">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {t('erp.categoryDialogDescription')}
            </DialogDescription>
          </DialogHeader>

          <form
            className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-5"
            onSubmit={(event) => {
              event.preventDefault()
              void onSave(draft)
            }}
          >
            <Field label={t('common.name')}>
              <Input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
            </Field>

            <Field label={t('erp.description')}>
              <textarea
                value={draft.description}
                onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                className="min-h-28 w-full rounded-card border border-input bg-background px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </Field>

            <Field label={t('erp.parentCategory')}>
              <FormSelect
                portalContainer={dialogContentRef}
                value={draft.parentId}
                onValueChange={(parentId) => setDraft((current) => ({ ...current, parentId }))}
                options={categories
                  .filter((item) => item.id !== category?.id)
                  .map((item) => ({ value: item.id, label: item.name }))}
                emptyOption={{ label: t('erp.noParent') }}
                className="h-11 bg-background"
              />
            </Field>

            <DialogFooter className="border-t border-border px-0 py-5">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit">{t('erp.saveCategory')}</Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-2 text-sm font-medium text-foreground">
      <span>{label}</span>
      {children}
    </label>
  )
}
