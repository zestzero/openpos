import { createFileRoute } from "@tanstack/react-router";
import { LedgerTimeline } from "@/components/erp/ledger-timeline";

export const Route = createFileRoute("/erp/")({
  component: ErpIndex,
});

function ErpIndex() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Inventory Ledger</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Select a variant to view its stock history timeline. Use the filters to narrow down entries by type or date range.
      </p>
      <LedgerTimeline variantId="demo-variant" className="max-w-2xl" />
    </div>
  );
}
