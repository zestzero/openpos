import type { ReactNode } from "react";
import { LogOut, ScanLine, Search } from "lucide-react";

import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";

import { ErpNav } from "../navigation/ErpNav";

export function ErpLayout({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const { t } = useI18n();

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground md:flex-row">
      <ErpNav />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="px-4 pb-2 pt-5 md:px-8 md:pt-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-muted-foreground">{t("erp.label")}</p>
              <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{t("erp.managementShell")}</h1>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative hidden w-96 lg:block">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-12 rounded-full pl-11"
                  placeholder={t("erp.searchPlaceholder")}
                />
              </div>
              <a
                href="/pos"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-foreground px-4 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
              >
                <ScanLine className="size-4" />
                {t("erp.pos")}
              </a>
              <IconButton variant="outline" onClick={logout} label={t("erp.logOut")}>
                <LogOut className="size-4" />
              </IconButton>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-4 md:px-8 md:py-6">{children}</main>
      </div>
    </div>
  );
}
