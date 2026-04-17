import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useInventory } from "@/hooks/use-inventory";
import { useCategories } from "@/hooks/use-catalog";
import { useDebouncedValue } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/erp/inventory/")({
  component: InventoryPage,
});

function InventoryPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"stock" | "product" | "sku">("product");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const debouncedSearch = useDebouncedValue(search, 300);

  const inventoryParams = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      category_id: categoryId !== "all" ? categoryId : undefined,
      status: status !== "all" ? (status as "in-stock" | "low" | "out") : undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
      page,
      page_size: pageSize,
    }),
    [debouncedSearch, categoryId, status, sortBy, sortOrder, page, pageSize]
  );

  const { data: inventoryData, isLoading, isError } = useInventory(inventoryParams);
  const { data: categories } = useCategories();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryId(value);
    setPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPage(1);
  };

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split("-") as [
      "stock" | "product" | "sku",
      "asc" | "desc"
    ];
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setPage(1);
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setPage(1);
  };

  const totalPages = inventoryData
    ? Math.ceil(inventoryData.total / inventoryData.page_size)
    : 0;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Inventory</h1>
      </div>

      <div className="flex flex-wrap gap-4 items-end">
        <div className="w-full max-w-sm">
          <Input
            placeholder="Search by name, SKU, or barcode..."
            value={search}
            onChange={handleSearchChange}
            className="w-full"
          />
        </div>

        <Select value={categoryId} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories?.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="in-stock">In Stock</SelectItem>
            <SelectItem value="low">Low Stock</SelectItem>
            <SelectItem value="out">Out of Stock</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={`${sortBy}-${sortOrder}`}
          onValueChange={handleSortChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="product-asc">Product (A-Z)</SelectItem>
            <SelectItem value="product-desc">Product (Z-A)</SelectItem>
            <SelectItem value="sku-asc">SKU (A-Z)</SelectItem>
            <SelectItem value="sku-desc">SKU (Z-A)</SelectItem>
            <SelectItem value="stock-asc">Stock (Low to High)</SelectItem>
            <SelectItem value="stock-desc">Stock (High to Low)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Barcode</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12 ml-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-16" />
                  </TableCell>
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Error loading inventory. Please try again.
                </TableCell>
              </TableRow>
            ) : inventoryData?.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No inventory items found. Try adjusting your filters.
                </TableCell>
              </TableRow>
            ) : (
              inventoryData?.items.map((item) => (
                <TableRow
                  key={item.variant_id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => window.location.href = `/erp/inventory/variant/${item.variant_id}`}
                >
                  <TableCell className="font-medium">{item.product_name}</TableCell>
                  <TableCell>{item.sku}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {item.barcode || "-"}
                  </TableCell>
                  <TableCell className="text-right">{item.stock}</TableCell>
                  <TableCell>
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
                        ? "Low"
                        : "Out"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <Select
            value={String(pageSize)}
            onValueChange={handlePageSizeChange}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Page {inventoryData?.page || 1} of {totalPages || 1}
          </span>
          <div className="flex gap-1">
            <button
              className={cn(
                "px-3 py-1 text-sm rounded border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed",
                (inventoryData?.page ?? 1) <= 1 && "cursor-not-allowed"
              )}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={(inventoryData?.page ?? 1) <= 1}
            >
              Previous
            </button>
            <button
              className={cn(
                "px-3 py-1 text-sm rounded border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed",
                (inventoryData?.page ?? 1) >= totalPages && "cursor-not-allowed"
              )}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={(inventoryData?.page ?? 1) >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}