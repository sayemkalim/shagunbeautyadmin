import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { fetchSalesOverview } from "../helpers/fetchSalesOverview";
import { fetchMonthlyGrowth } from "../helpers/fetchMonthlyGrowth";
import { fetchRevenueTrend } from "../helpers/fetchRevenueTrend";
// import { fetchCategoryDistribution } from "../helpers/fetchCategoryDistribution";

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

const axisTick = { fill: "var(--color-muted-foreground)", fontSize: 12 };

const DashboardCharts = () => {
  const [salesData, setSalesData] = useState([]);
  const [growthData, setGrowthData] = useState([]);
  const [revenueTrendData, setRevenueTrendData] = useState([]);
  // const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch all dashboard data in parallel for optimal performance
        const [salesResult, growthResult, revenueTrendResult] = await Promise.all([
          fetchSalesOverview(),
          fetchMonthlyGrowth(),
          fetchRevenueTrend(),
          // fetchCategoryDistribution()
        ]);

        if (salesResult.success) {
          setSalesData(salesResult.data);
        }

        if (growthResult.success) {
          setGrowthData(growthResult.data);
        }

        if (revenueTrendResult.success) {
          setRevenueTrendData(revenueTrendResult.data);
        }

        // if (categoryResult.success) {
        //   setCategoryData(categoryResult.data);
        // }

        if (!salesResult.success && !growthResult.success && !revenueTrendResult.success) {
          setError("Failed to load dashboard data");
        }
      } catch (error) {
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Use dummy data for category distribution (category API commented out)
  const pieData = [
    { name: "Electronics", value: 400 },
    { name: "Clothing", value: 300 },
    { name: "Home Appliances", value: 300 },
    { name: "Home", value: 330 },
  ];

  // Format currency for tooltips
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Custom tooltip for sales charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover text-popover-foreground shadow-elegant rounded-lg border p-3 text-sm">
          <p className="mb-1 font-semibold">{`Month: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey === "sales" || entry.dataKey === "revenue"
                ? `${entry.dataKey === "sales" ? "Sales" : "Revenue"}: ${formatCurrency(entry.value)}`
                : entry.dataKey === "growth"
                  ? `Growth: ${entry.value}%`
                  : `${entry.dataKey.charAt(0).toUpperCase() + entry.dataKey.slice(1)}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Loading state
  if (loading) {
    return (
      <div className="mt-2 mb-4 grid grid-cols-1 gap-4 px-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[280px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mt-2 mb-4 grid grid-cols-1 gap-4 px-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-destructive/30 bg-destructive/5 col-span-full">
          <CardContent className="flex h-[280px] items-center justify-center">
            <p className="text-destructive text-sm">Error loading chart data: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-2 mb-4 grid grid-cols-1 gap-4 px-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Sales Overview Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Overview</CardTitle>
          <CardDescription>Monthly sales performance</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="month" tick={axisTick} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-accent)" }} />
              <Bar dataKey="sales" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Growth</CardTitle>
          <CardDescription>Growth rate month over month</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="month" tick={axisTick} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-accent)" }} />
              <Bar dataKey="growth" name="Growth %" radius={[4, 4, 0, 0]}>
                {growthData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.growth >= 0 ? "var(--color-success)" : "var(--color-destructive)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Orders Trend Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Orders Trend</CardTitle>
          <CardDescription>Order volume over time</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revenueTrendData.length > 0 ? revenueTrendData : growthData.length > 0 ? growthData : salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="month" tick={axisTick} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--color-border)" }} />
              <Line
                type="monotone"
                dataKey="orders"
                stroke={CHART_COLORS[4]}
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Revenue over time</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revenueTrendData.length > 0 ? revenueTrendData : growthData.length > 0 ? growthData : salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="month" tick={axisTick} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--color-border)" }} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke={CHART_COLORS[2]}
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Distribution Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Category Distribution</CardTitle>
          <CardDescription>Share of sales by category</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={95} paddingAngle={2} dataKey="value">
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="var(--color-card)" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardCharts;
