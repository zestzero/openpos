import type { ReactNode } from 'react'
import { ChevronDown, LogOut, ScanLine, Search, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'

import { ErpNav } from '../navigation/ErpNav'

const tabs = [
  { label: 'Products', to: '/erp/products' },
  { label: 'Inventory', to: '/erp/inventory' },
  { label: 'Reporting', to: '/erp/reports' },
] as const

export function ErpLayout({ children }: { children: ReactNode }) {
  const { logout } = useAuth()
  const pathname = typeof window !== 'undefined' && window.location.pathname !== '/' ? window.location.pathname : '/erp'

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      <ErpNav />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="flex flex-col gap-4 px-6 py-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-brand" />
                  Desktop ERP
                </div>
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <span>Management shell</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative hidden min-w-72 lg:block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="h-10 rounded-pill pl-9" placeholder="Search products, variants, reports" />
                </div>
                <a href="/pos" className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                  <ScanLine className="h-4 w-4" />
                  POS
                </a>
                <Button variant="outline">Create product</Button>
                <Button variant="outline">Import</Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  aria-label="Log out"
                  title="Log out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
              <nav className="flex flex-wrap gap-2" role="tablist" aria-label="ERP workspace tabs">
                {tabs.map((tab) => {
                  const isActive = tab.to ? pathname === tab.to : false

                  return (
                    <a
                      key={tab.label}
                      href={tab.to ?? '#'}
                      role="tab"
                      aria-selected={isActive}
                      className={isActive
                        ? 'rounded-pill bg-primary px-4 py-2 text-sm font-medium text-primary-foreground'
                        : 'rounded-pill border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'}
                    >
                      {tab.label}
                    </a>
                  )
                })}
              </nav>

              <div className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
                <span className="h-2 w-2 rounded-full bg-brand" />
                Reporting tab ready for Phase 4 workflows
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 bg-muted/20 px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  )
}
