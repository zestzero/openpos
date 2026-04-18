import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchValuation, fetchLowStock, fetchRecentLedger, fetchAllVariants, type RecentLedgerResponse, type LowStockItem, type VariantStockItem } from "@/lib/api-client";

export const Route = createFileRoute("/erp/")({
  component: DashboardPage,
});

interface DashboardData {
  totalSkus: number;
  totalUnits: number;
  totalValue: number;
  lowStockCount: number;
  lowStockItems: LowStockItem[];
  recentLedger: RecentLedgerResponse["ledger"];
}

function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [valuation, lowStock, ledger, variants] = await Promise.all([
        fetchValuation(),
        fetchLowStock(10),
        fetchRecentLedger(10),
        fetchAllVariants(),
      ]);

      const totalUnits = variants.variants.reduce((sum, v) => sum + v.balance, 0);

      setData({
        totalSkus: valuation.variant_count,
        totalUnits,
        totalValue: valuation.total_value_cents,
        lowStockCount: lowStock.variants.length,
        lowStockItems: lowStock.variants,
        recentLedger: ledger.ledger,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    const interval = setInterval(loadData, 60000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, [loadData]);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getLedgerTypeLabel = (type: string) => {
    switch (type) {
      case "sale":
        return "Sale";
      case "restock":
        return "Restock";
      case "adjustment":
        return "Adjustment";
      case "sync":
        return "Sync";
      default:
        return type;
    }
  };

  const getLedgerTypeColor = (type: string, delta: number) => {
    if (type === "sale") return "text-red-600";
    if (type === "restock") return "text-green-600";
    if (type === "adjustment") return delta > 0 ? "text-green-600" : "text-red-600";
    return "text-gray-600";
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Stock Dashboard</h2>
        <button
          onClick={loadData}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Active SKUs</CardDescription>
            <CardTitle className="text-3xl">{data?.totalSkus ?? 0}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Units</CardDescription>
            <CardTitle className="text-3xl">{data?.totalUnits?.toLocaleString() ?? 0}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Inventory Value</CardDescription>
            <CardTitle className="text-3xl">{formatCurrency(data?.totalValue ?? 0)}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Low Stock Items</CardDescription>
            <CardTitle className="text-3xl">{data?.lowStockCount ?? 0}</CardTitle>
          </CardHeader>
          {data && data.lowStockCount > 0 && (
            <CardContent className="pt-0">
              <Link
                to="/erp/inventory"
                search={{ tab: 'low-stock' } as any}
                className="text-sm text-blue-600 hover:underline"
              >
                View items →
              </Link>
            </CardContent>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Ledger Activity</CardTitle>
            <CardDescription>Last 10 inventory changes</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.recentLedger.length === 0 ? (
              <div className="text-gray-500 text-sm">No recent activity</div>
            ) : (
              <div className="space-y-3">
                {data?.recentLedger.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between py-2 border-b last:border-b-0"
                  >
                    <div>
                      <div className="font-medium text-sm">
                        {getLedgerTypeLabel(entry.type)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {entry.variant_id.slice(0, 8)} • {formatDate(entry.created_at)}
                      </div>
                    </div>
                    <div className={`font-medium ${getLedgerTypeColor(entry.type, entry.delta)}`}>
                      {entry.delta > 0 ? "+" : ""}{entry.delta}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low Stock Items</CardTitle>
            <CardDescription>Items with balance below 10 units</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.lowStockItems.length === 0 ? (
              <div className="text-gray-500 text-sm">No low stock items</div>
            ) : (
              <div className="space-y-3">
                {data?.lowStockItems.slice(0, 10).map((item) => (
                  <div
                    key={item.variant_id}
                    className="flex items-center justify-between py-2 border-b last:border-b-0"
                  >
                    <div>
                      <div className="font-medium text-sm">{item.sku || item.variant_id.slice(0, 8)}</div>
                      {item.barcode && (
                        <div className="text-xs text-gray-500">{item.barcode}</div>
                      )}
                    </div>
                    <div className="font-medium text-red-600">{item.balance} units</div>
                  </div>
                ))}
                {data && data.lowStockItems.length > 10 && (
                  <div className="text-sm text-gray-500 pt-2">
                    +{data.lowStockItems.length - 10} more items
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}