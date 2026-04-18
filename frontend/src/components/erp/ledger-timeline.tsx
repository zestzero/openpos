import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchLedger, type LedgerEntryResponse } from "@/lib/api-client";

type LedgerEntryType = "sale" | "restock" | "adjustment" | "sync";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<LedgerEntryType, string> = {
  sale: "\u{1F3AF}",
  restock: "\u{1F4E5}",
  adjustment: "\u{1F527}",
  sync: "\u{1F504}",
};

const TYPE_COLORS: Record<LedgerEntryType, string> = {
  sale: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  restock: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  adjustment: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  sync: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}

function formatAbsoluteTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString();
}

interface LedgerEntryRowProps {
  entry: LedgerEntryResponse;
}

function LedgerEntryRow({ entry }: LedgerEntryRowProps) {
  const [showAbsolute, setShowAbsolute] = useState(false);

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className="flex-shrink-0 text-2xl w-8 text-center">
        {TYPE_ICONS[entry.type as LedgerEntryType] ?? "📋"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={cn("text-xs", TYPE_COLORS[entry.type as LedgerEntryType] ?? "bg-gray-100 text-gray-800")}>
            {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
          </Badge>
          <span
            className={cn(
              "text-sm font-semibold",
              entry.delta >= 0 ? "text-green-600" : "text-red-600"
            )}
          >
            {entry.delta >= 0 ? "+" : ""}
            {entry.delta}
          </span>
        </div>
        {entry.reason && (
          <p className="text-sm text-muted-foreground mt-1">{entry.reason}</p>
        )}
        {entry.reference_id && (
          <p className="text-xs text-muted-foreground mt-1">
            Ref: {entry.reference_id}
          </p>
        )}
      </div>
      <div
        className="text-xs text-muted-foreground cursor-help flex-shrink-0"
        title={formatAbsoluteTime(entry.created_at)}
        onMouseEnter={() => setShowAbsolute(true)}
        onMouseLeave={() => setShowAbsolute(false)}
      >
        {showAbsolute ? formatAbsoluteTime(entry.created_at) : formatRelativeTime(entry.created_at)}
      </div>
    </div>
  );
}

interface EmptyStateProps {
  variantId: string;
}

function EmptyState({ variantId }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-4xl mb-4">📋</div>
      <h3 className="text-lg font-semibold mb-2">No History Yet</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        This variant has no ledger entries. Start making sales, restocking, or adjustments to see the history here.
      </p>
    </div>
  );
}

interface LedgerTimelineProps {
  variantId: string;
  className?: string;
}

export function LedgerTimeline({ variantId, className }: LedgerTimelineProps) {
  const [selectedType, setSelectedType] = useState<LedgerEntryType | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["ledger", variantId, selectedType, startDate, endDate, page],
    queryFn: () =>
      fetchLedger(variantId, {
        type: selectedType || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: pageSize,
        offset: page * pageSize,
      }),
  });

  const entries = data?.entries ?? [];
  const hasMore = data?.hasMore ?? false;
  const total = data?.total ?? 0;

  const handleFilterChange = () => {
    setPage(0);
  };

  const handleTypeChange = (type: LedgerEntryType | "") => {
    setSelectedType(type);
    setPage(0);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle>Stock History</CardTitle>
          <div className="text-sm text-muted-foreground">
            {total > 0 && `${total} total entr${total === 1 ? "y" : "ies"}`}
          </div>
        </div>
        <div className="flex flex-col gap-3 mt-4">
          <Tabs
            value={selectedType}
            onValueChange={(v) => handleTypeChange(v as LedgerEntryType | "")}
          >
            <TabsList>
              <TabsTrigger value="">All</TabsTrigger>
              <TabsTrigger value="sale">Sale</TabsTrigger>
              <TabsTrigger value="restock">Restock</TabsTrigger>
              <TabsTrigger value="adjustment">Adjustment</TabsTrigger>
              <TabsTrigger value="sync">Sync</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">From:</span>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  handleFilterChange();
                }}
                className="h-8 w-auto text-xs"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">To:</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  handleFilterChange();
                }}
                className="h-8 w-auto text-xs"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : isError ? (
          <div className="py-8 text-center text-destructive">
            Failed to load ledger entries
          </div>
        ) : entries.length === 0 ? (
          <EmptyState variantId={variantId} />
        ) : (
          <>
            <div className="divide-y divide-border">
              {entries.map((entry) => (
                <LedgerEntryRow key={entry.id} entry={entry} />
              ))}
            </div>
            {(hasMore || page > 0) && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page + 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!hasMore}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
