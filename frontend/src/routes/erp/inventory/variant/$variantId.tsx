import { createFileRoute } from "@tanstack/react-router";
import { use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useInventory } from "@/hooks/use-inventory";
import { useProducts } from "@/hooks/use-catalog";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/erp/inventory/variant/$variantId")({
  component: VariantDetailPage,
});

function VariantDetailPage() {
  const { variantId } = Route.useParams();
  
  const { data: inventoryData, isLoading: inventoryLoading } = useInventory({
    search: variantId,
    page_size: 1,
  });

  const item = inventoryData?.items[0];

  if (inventoryLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Variant not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{item.product_name}</h1>
        <Badge
          variant={
            item.status === "in-stock"
              ? "default"
              : item.status === "low"
              ? "secondary"
              : "destructive"
          }
        >
          {item.status === "in-stock"
            ? "In Stock"
            : item.status === "low"
            ? "Low Stock"
            : "Out of Stock"}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Variant Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Variant ID</p>
              <p className="font-mono text-sm">{item.variant_id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">SKU</p>
              <p className="font-mono text-sm">{item.sku}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Barcode</p>
              <p className="font-mono text-sm">{item.barcode || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Category</p>
              <p>{item.category_name || "Uncategorized"}</p>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">Current Stock</p>
            <p className="text-3xl font-bold">{item.stock} units</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}