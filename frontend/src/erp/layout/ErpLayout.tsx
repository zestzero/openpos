import type { ReactNode } from "react";
import { ChevronDown, LogOut, ScanLine, Search, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";

import { ErpNav } from "../navigation/ErpNav";

export function ErpLayout({ children }: { children: ReactNode }) {
  const { logout } = useAuth();

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
                  <Input
                    className="h-10 rounded-pill pl-9"
                    placeholder="Search products, variants, reports"
                  />
                </div>
                <a
                  href="/pos"
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <ScanLine className="h-4 w-4" />
                  POS
                </a>
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
          </div>
        </header>

        <main className="flex-1 bg-muted/20 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
