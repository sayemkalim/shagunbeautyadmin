import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Boxes, Layers3, IndianRupee, AlertTriangle, XCircle } from "lucide-react";
import { fetchInventoryStats } from "../helpers/fetchInventoryStats";
import { getApiData, isApiError } from "../helpers/apiResult";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);

const InventoryStatsCards = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["inventory-stats"],
    queryFn: fetchInventoryStats,
  });

  const stats = !isApiError(data) ? getApiData(data) : null;

  const tiles = stats
    ? [
        {
          title: "SKUs Tracked",
          value: stats.total_skus_tracked?.toLocaleString() ?? "0",
          icon: Boxes,
          bg: "bg-primary/10",
          text: "text-primary",
        },
        {
          title: "Units In Stock",
          value: stats.total_units_in_stock?.toLocaleString() ?? "0",
          icon: Layers3,
          bg: "bg-[var(--color-chart-2)]/15",
          text: "text-[var(--color-chart-2)]",
        },
        {
          title: "Stock Value",
          value: formatCurrency(stats.total_stock_value),
          icon: IndianRupee,
          bg: "bg-[var(--color-chart-4)]/15",
          text: "text-[var(--color-chart-4)]",
        },
        {
          title: "Low Stock",
          value: stats.low_stock_count?.toLocaleString() ?? "0",
          icon: AlertTriangle,
          bg: "bg-amber-100 dark:bg-amber-500/15",
          text: "text-amber-700 dark:text-amber-400",
        },
        {
          title: "Out of Stock",
          value: stats.out_of_stock_count?.toLocaleString() ?? "0",
          icon: XCircle,
          bg: "bg-destructive/10",
          text: "text-destructive",
        },
      ]
    : [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="gap-2 py-5">
            <CardHeader className="flex flex-row items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-9 w-9 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Card className="border-destructive/30 bg-destructive/5 py-5">
        <CardContent className="flex h-16 items-center justify-center">
          <p className="text-destructive text-sm">Failed to load inventory stats.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {tiles.map((tile) => (
        <Card key={tile.title} className="gap-3 py-5 transition-shadow hover:shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {tile.title}
            </CardTitle>
            <div className={cn("flex size-9 items-center justify-center rounded-lg", tile.bg)}>
              <tile.icon className={cn("size-4.5", tile.text)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight tabular-nums">{tile.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default InventoryStatsCards;
