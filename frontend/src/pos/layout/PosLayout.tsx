import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react'
import { LayoutGrid, ScanLine, Sparkles, ShoppingCart } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { formatTHB } from '@/lib/formatCurrency'
import { PosHeader } from '@/pos/components/PosHeader'
import { PosNav, type PosTab } from '@/pos/components/PosNav'

interface PosLayoutProps {
  children?: ReactNode
}

function useOnlineStatus() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return online
}

function tabSummary(tab: PosTab) {
  switch (tab) {
    case 'catalog':
      return {
        icon: LayoutGrid,
        title: 'Touch catalog ready',
        description: 'Category grid, quick-add cards, and search stay within thumb reach.',
      }
    case 'scan':
      return {
        icon: ScanLine,
        title: 'Scan workflow ready',
        description: 'Camera and scanner flows can live here without leaving the POS shell.',
      }
    default:
      return {
        icon: ShoppingCart,
        title: 'Cart workspace ready',
        description: 'Running total, line items, and payment actions stay visible at a glance.',
      }
  }
}

export function PosLayout({ children }: PosLayoutProps) {
  const { user, logout } = useAuth()
  const online = useOnlineStatus()
  const [activeTab, setActiveTab] = useState<PosTab>('catalog')

  const summary = useMemo(() => tabSummary(activeTab), [activeTab])
  const SummaryIcon = summary.icon

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <PosHeader user={user} online={online} onLogout={logout} />

      <main className="flex-1 overflow-y-auto px-4 pb-28 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          {children}

          <Card className="border-border bg-background">
            <CardHeader className="flex-row items-center gap-3 space-y-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-card bg-accent text-accent-foreground">
                <SummaryIcon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>{summary.title}</CardTitle>
                <CardDescription>{summary.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <Metric label="Catalog total" value={formatTHB(129900)} />
              <Metric label="Active items" value="24" />
              <Metric label="Quick keys" value="8" />
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-3">
            <FeatureCard
              title="Catalog"
              description="Big, touch-friendly product cards for fast tap-to-add selling."
              icon={LayoutGrid}
            />
            <FeatureCard
              title="Scan"
              description="Barcode capture stays one tap away for keyboard wedge and camera input."
              icon={ScanLine}
            />
            <FeatureCard
              title="Cart"
              description="Checkout actions and running totals remain easy to reach on small screens."
              icon={ShoppingCart}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand" />
                Workspace notes
              </CardTitle>
              <CardDescription>
                POS and ERP stay route-separated; this shell is optimized for cashier speed.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>

      <PosNav activeTab={activeTab} onChangeTab={setActiveTab} />
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-border bg-muted p-4">
      <p className="font-mono text-xs font-medium uppercase tracking-label text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  )
}

function FeatureCard({
  title,
  description,
  icon: Icon,
}: {
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex h-10 w-10 items-center justify-center rounded-card bg-muted text-foreground">
          <Icon className="h-4 w-4" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  )
}
