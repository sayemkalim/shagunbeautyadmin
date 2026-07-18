import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ArrowUpRight,
  ArrowDownRight,
  Users,
  ShoppingCart,
  IndianRupee,
} from "lucide-react";
import { fetchDashboardOverview } from "../helpers/fetchDashboardOverview";

const ACCENTS = [
  { bg: "bg-primary/10", text: "text-primary" },
  { bg: "bg-[var(--color-chart-2)]/15", text: "text-[var(--color-chart-2)]" },
  { bg: "bg-[var(--color-chart-4)]/15", text: "text-[var(--color-chart-4)]" },
];

const AnalyticsCards = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const result = await fetchDashboardOverview();

        if (result.success) {
          setDashboardData(result.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatGrowth = (growth, isPositive) => {
    const sign = isPositive ? "+" : "-";
    return `${sign}${Math.abs(growth)}%`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="gap-2 py-5">
            <CardHeader className="flex flex-row items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-9 rounded-lg" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-3">
        <Card className="border-destructive/30 bg-destructive/5 col-span-full py-5">
          <CardContent className="flex h-24 items-center justify-center">
            <p className="text-destructive text-sm">Error loading dashboard data: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const analyticsData = dashboardData
    ? [
        {
          title: "Total Sales",
          value: formatCurrency(dashboardData.totalSales.value),
          change: formatGrowth(dashboardData.totalSales.growth, dashboardData.totalSales.isPositive),
          isPositive: dashboardData.totalSales.isPositive,
          icon: IndianRupee,
        },
        {
          title: "New Users",
          value: dashboardData.newUsers.value.toString(),
          change: formatGrowth(dashboardData.newUsers.growth, dashboardData.newUsers.isPositive),
          isPositive: dashboardData.newUsers.isPositive,
          icon: Users,
        },
        {
          title: "Orders",
          value: dashboardData.orders.value.toString(),
          change: formatGrowth(dashboardData.orders.growth, dashboardData.orders.isPositive),
          isPositive: dashboardData.orders.isPositive,
          icon: ShoppingCart,
        },
      ]
    : [];

  return (
    <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-3">
      {analyticsData.map((data, index) => (
        <CardStats key={index} {...data} accent={ACCENTS[index % ACCENTS.length]} />
      ))}
    </div>
  );
};

export default AnalyticsCards;

function CardStats({ title, value, change, isPositive, icon: Icon, accent }) {
  return (
    <Card className="gap-3 py-5 transition-shadow hover:shadow-elegant">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-muted-foreground text-sm font-medium">{title}</CardTitle>
        <div className={cn("flex size-9 items-center justify-center rounded-lg", accent.bg)}>
          <Icon className={cn("size-4.5", accent.text)} />
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5">
        <div className="text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
        <div
          className={cn(
            "inline-flex items-center gap-1 text-sm font-medium",
            isPositive ? "text-[var(--color-success)]" : "text-destructive"
          )}
        >
          {isPositive ? (
            <ArrowUpRight className="size-4" />
          ) : (
            <ArrowDownRight className="size-4" />
          )}
          {change}
          <span className="text-muted-foreground font-normal">from last month</span>
        </div>
      </CardContent>
    </Card>
  );
}
