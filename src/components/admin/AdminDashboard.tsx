import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Package, ShoppingCart, Users, TrendingUp, ArrowUpRight, ArrowDownRight, CalendarDays, X, Download, AlertTriangle, DollarSign, BarChart3, Info } from "lucide-react";
import { format, subDays, startOfMonth, eachDayOfInterval, eachMonthOfInterval, subMonths, isSameDay, isSameMonth, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Order {
  id: string;
  total: number;
  status: string;
  created_at: string;
  items: any;
  discount: number;
  delivery_fee: number;
  subtotal: number;
  user_id: string;
  refund_amount: number;
  coupon_code: string | null;
}

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(30 80% 55%)", "hsl(200 70% 50%)", "hsl(142 71% 45%)", "hsl(0 65% 55%)"];

const STATUS_LABELS: Record<string, string> = {
  placed: "📦 Placed",
  confirmed: "✅ Confirmed",
  baking: "🧁 Baking",
  out_for_delivery: "🚚 Out for Delivery",
  delivered: "✔️ Delivered",
  cancelled: "❌ Cancelled",
};

type TimeRange = "7d" | "30d" | "90d" | "12m" | "custom";

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ products: 0, users: 0, lowStock: 0 });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [productsRes, ordersRes, usersRes, lowStockRes] = await Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("id, total, status, created_at, items, discount, delivery_fee, subtotal, user_id, refund_amount, coupon_code"),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("products").select("id", { count: "exact", head: true }).lt("stock_quantity", 10),
    ]);
    setOrders((ordersRes.data as Order[]) || []);
    setStats({
      products: productsRes.count || 0,
      users: usersRes.count || 0,
      lowStock: lowStockRes.count || 0,
    });
    setLoading(false);
  };

  const filteredOrders = useMemo(() => {
    const now = new Date();
    if (timeRange === "custom" && dateFrom) {
      const from = startOfDay(dateFrom);
      const to = dateTo ? endOfDay(dateTo) : endOfDay(dateFrom);
      return orders.filter(o => isWithinInterval(new Date(o.created_at), { start: from, end: to }));
    }
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 365;
    return orders.filter(o => new Date(o.created_at) >= subDays(now, days));
  }, [orders, timeRange, dateFrom, dateTo]);

  const metrics = useMemo(() => {
    const now = new Date();
    const source = filteredOrders;
    const nonCancelled = source.filter(o => o.status !== "cancelled");
    const delivered = source.filter(o => o.status === "delivered");
    const cancelled = source.filter(o => o.status === "cancelled");
    const totalRevenue = delivered.reduce((s, o) => s + (o.total || 0), 0);
    const deliveredRevenue = totalRevenue;
    const totalOrders = source.length;
    const avgOrderValue = delivered.length > 0 ? Math.round(totalRevenue / delivered.length) : 0;
    const totalDiscount = nonCancelled.reduce((s, o) => s + (o.discount || 0), 0);
    const totalRefunds = source.reduce((s, o) => s + (o.refund_amount || 0), 0);
    const conversionRate = totalOrders > 0 ? Math.round((delivered.length / totalOrders) * 100) : 0;
    const cancelRate = totalOrders > 0 ? Math.round((cancelled.length / totalOrders) * 100) : 0;
    const uniqueCustomers = new Set(source.map(o => o.user_id)).size;
    const customerOrders: Record<string, number> = {};
    source.forEach(o => { customerOrders[o.user_id] = (customerOrders[o.user_id] || 0) + 1; });
    const repeatCustomers = Object.values(customerOrders).filter(c => c > 1).length;

    // Week comparison (delivered only)
    const thisWeekDelivered = orders.filter(o => new Date(o.created_at) >= subDays(now, 7) && o.status === "delivered");
    const lastWeekDelivered = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= subDays(now, 14) && d < subDays(now, 7) && o.status === "delivered";
    });
    const thisWeekRevenue = thisWeekDelivered.reduce((s, o) => s + (o.total || 0), 0);
    const lastWeekRevenue = lastWeekDelivered.reduce((s, o) => s + (o.total || 0), 0);
    const revenueChange = lastWeekRevenue > 0 ? Math.round(((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100) : thisWeekRevenue > 0 ? 100 : 0;

    const thisWeekOrders = orders.filter(o => new Date(o.created_at) >= subDays(now, 7));
    const lastWeekOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= subDays(now, 14) && d < subDays(now, 7);
    });
    const ordersChange = lastWeekOrders.length > 0 ? Math.round(((thisWeekOrders.length - lastWeekOrders.length) / lastWeekOrders.length) * 100) : thisWeekOrders.length > 0 ? 100 : 0;
    const couponOrders = source.filter(o => o.coupon_code);

    return {
      totalRevenue, deliveredRevenue, totalOrders, avgOrderValue, totalDiscount, totalRefunds,
      revenueChange, ordersChange, conversionRate, cancelRate,
      uniqueCustomers, repeatCustomers, deliveredCount: delivered.length,
      cancelledCount: cancelled.length, couponOrders: couponOrders.length,
      netRevenue: totalRevenue - totalRefunds,
    };
  }, [orders, filteredOrders, timeRange]);

  const clvData = useMemo(() => {
    const customerSpend: Record<string, number> = {};
    orders.filter(o => o.status === "delivered").forEach(o => {
      customerSpend[o.user_id] = (customerSpend[o.user_id] || 0) + (o.total || 0);
    });
    const values = Object.values(customerSpend);
    if (values.length === 0) return { avg: 0, median: 0, top: 0 };
    values.sort((a, b) => a - b);
    const avg = Math.round(values.reduce((s, v) => s + v, 0) / values.length);
    const median = Math.round(values[Math.floor(values.length / 2)]);
    const top = values[values.length - 1];
    return { avg, median, top };
  }, [orders]);

  const dailyData = useMemo(() => {
    const now = new Date();
    if (timeRange === "custom" && dateFrom) {
      const from = startOfDay(dateFrom);
      const to = dateTo ? endOfDay(dateTo) : endOfDay(dateFrom);
      const interval = eachDayOfInterval({ start: from, end: to > now ? now : to });
      return interval.map(day => {
        const dayOrders = filteredOrders.filter(o => isSameDay(new Date(o.created_at), day));
        return {
          date: format(day, interval.length <= 7 ? "EEE" : "dd MMM"),
          revenue: dayOrders.reduce((s, o) => s + (o.total || 0), 0),
          orders: dayOrders.length,
        };
      });
    }
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const interval = eachDayOfInterval({ start: subDays(now, days - 1), end: now });
    return interval.map(day => {
      const dayOrders = filteredOrders.filter(o => isSameDay(new Date(o.created_at), day));
      return {
        date: format(day, days <= 7 ? "EEE" : "dd MMM"),
        revenue: dayOrders.reduce((s, o) => s + (o.total || 0), 0),
        orders: dayOrders.length,
      };
    });
  }, [filteredOrders, timeRange, dateFrom, dateTo]);

  const monthlyData = useMemo(() => {
    const now = new Date();
    const months = eachMonthOfInterval({ start: subMonths(startOfMonth(now), 11), end: now });
    return months.map(month => {
      const monthOrders = orders.filter(o => isSameMonth(new Date(o.created_at), month));
      return {
        month: format(month, "MMM yy"),
        revenue: monthOrders.reduce((s, o) => s + (o.total || 0), 0),
        orders: monthOrders.length,
      };
    });
  }, [orders]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredOrders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({
      name: STATUS_LABELS[name] || name.replace(/_/g, " "),
      value,
    }));
  }, [filteredOrders]);

  const topProducts = useMemo(() => {
    const productMap: Record<string, { name: string; qty: number; revenue: number }> = {};
    filteredOrders.filter(o => o.status !== "cancelled").forEach(o => {
      const items = Array.isArray(o.items) ? o.items : [];
      items.forEach((item: any) => {
        const key = item.name || item.slug || "Unknown";
        if (!productMap[key]) productMap[key] = { name: key, qty: 0, revenue: 0 };
        productMap[key].qty += item.quantity || 1;
        productMap[key].revenue += (item.price || 0) * (item.quantity || 1);
      });
    });
    return Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [filteredOrders]);

  const recentOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
  }, [filteredOrders]);

  const chartData = timeRange === "12m" ? monthlyData : dailyData;
  const chartXKey = timeRange === "12m" ? "month" : "date";

  const handleDateSelect = (type: "from" | "to", date: Date | undefined) => {
    if (type === "from") {
      setDateFrom(date);
      if (!dateTo || (date && dateTo && date > dateTo)) setDateTo(date);
      setTimeRange("custom");
    } else {
      setDateTo(date);
      setTimeRange("custom");
    }
  };

  const clearDateFilter = () => { setDateFrom(undefined); setDateTo(undefined); setTimeRange("30d"); };

  const exportCSV = () => {
    const source = filteredOrders;
    const rows = [["Order ID", "Date", "Status", "Items", "Subtotal", "Discount", "Delivery Fee", "Total", "Coupon"]];
    source.forEach(o => {
      const items = Array.isArray(o.items) ? o.items.map((i: any) => `${i.name} x${i.quantity}`).join("; ") : "";
      rows.push([
        o.id.slice(0, 8).toUpperCase(),
        format(new Date(o.created_at), "yyyy-MM-dd HH:mm"),
        o.status,
        items,
        String(o.subtotal || 0),
        String(o.discount || 0),
        String(o.delivery_fee || 0),
        String(o.total),
        o.coupon_code || "",
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenue-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded!");
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-display font-bold mb-2">📊 Dashboard</h1>
        <p className="text-sm text-muted-foreground mb-6">Loading your store overview...</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-secondary rounded-2xl animate-pulse" />)}
        </div>
        <div className="h-72 bg-secondary rounded-2xl animate-pulse mb-6" />
      </div>
    );
  }

  const dateLabel = dateFrom
    ? dateTo && !isSameDay(dateFrom, dateTo)
      ? `${format(dateFrom, "dd MMM yyyy")} – ${format(dateTo, "dd MMM yyyy")}`
      : format(dateFrom, "dd MMM yyyy")
    : "Pick date";

  const noData = filteredOrders.length === 0;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold">📊 Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Your store performance at a glance</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={exportCSV}>
            <Download className="w-3.5 h-3.5" /> Download Report
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={timeRange === "custom" ? "default" : "outline"} size="sm" className={cn("text-xs gap-1.5")}>
                <CalendarDays className="w-3.5 h-3.5" />
                {timeRange === "custom" ? dateLabel : "📅 Pick Dates"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-3 space-y-3">
                <p className="text-sm font-medium">Select date range</p>
                <div className="flex gap-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Start Date</p>
                    <Calendar mode="single" selected={dateFrom} onSelect={(d) => handleDateSelect("from", d)} disabled={(date) => date > new Date()} className={cn("p-2 pointer-events-auto")} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">End Date</p>
                    <Calendar mode="single" selected={dateTo} onSelect={(d) => handleDateSelect("to", d)} disabled={(date) => date > new Date() || (dateFrom ? date < dateFrom : false)} className={cn("p-2 pointer-events-auto")} />
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-border">
                  {[
                    { label: "Today", fn: () => { const t = new Date(); setDateFrom(t); setDateTo(t); setTimeRange("custom"); } },
                    { label: "Yesterday", fn: () => { const y = subDays(new Date(), 1); setDateFrom(y); setDateTo(y); setTimeRange("custom"); } },
                    { label: "Last 7 days", fn: () => { setDateFrom(subDays(new Date(), 6)); setDateTo(new Date()); setTimeRange("custom"); } },
                    { label: "This month", fn: () => { setDateFrom(startOfMonth(new Date())); setDateTo(new Date()); setTimeRange("custom"); } },
                  ].map((preset) => (
                    <Button key={preset.label} variant="ghost" size="sm" className="text-xs" onClick={preset.fn}>{preset.label}</Button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          {timeRange === "custom" && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearDateFilter} title="Clear date filter"><X className="w-3.5 h-3.5" /></Button>
          )}
          <div className="flex gap-1 bg-secondary rounded-xl p-1">
            {([["7d", "7 Days"], ["30d", "30 Days"], ["90d", "90 Days"], ["12m", "1 Year"]] as [TimeRange, string][]).map(([key, label]) => (
              <button key={key} onClick={() => { setTimeRange(key); setDateFrom(undefined); setDateTo(undefined); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${timeRange === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {stats.lowStock > 0 && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
          <div>
            <p className="text-sm font-medium">⚠️ Low Stock Alert</p>
            <p className="text-xs text-muted-foreground">{stats.lowStock} product{stats.lowStock > 1 ? "s are" : " is"} running low. Go to Products tab to restock.</p>
          </div>
        </div>
      )}

      {timeRange === "custom" && dateFrom && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3">
          <CalendarDays className="w-5 h-5 text-primary shrink-0" />
          <div>
            <p className="text-sm font-medium">📅 Filtered View</p>
            <p className="text-xs text-muted-foreground">Showing data for <span className="font-semibold">{dateLabel}</span> · {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""} found</p>
          </div>
        </div>
      )}

      {noData && (
        <div className="mb-6 px-6 py-8 rounded-2xl bg-muted/50 border border-border text-center">
          <Info className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-lg font-semibold mb-1">No orders yet</p>
          <p className="text-sm text-muted-foreground">Once customers start placing orders, your revenue, charts, and analytics will appear here automatically.</p>
        </div>
      )}

      {/* KPI Cards Row 1 - Main metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {[
          { label: "💰 Revenue", value: `₹${metrics.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-primary", change: timeRange !== "custom" ? metrics.revenueChange : null, sub: `From ${metrics.deliveredCount} delivered orders`, tooltip: "Revenue from delivered orders only" },
          { label: "📦 Total Orders", value: metrics.totalOrders, icon: ShoppingCart, color: "text-accent", change: timeRange !== "custom" ? metrics.ordersChange : null, sub: `${metrics.deliveredCount} delivered · ${metrics.cancelledCount} cancelled`, tooltip: "Number of orders placed" },
          { label: "🧾 Avg. Order Value", value: `₹${metrics.avgOrderValue.toLocaleString()}`, icon: BarChart3, color: "text-primary", change: null, sub: "Average per delivered order", tooltip: "Average amount per delivered order" },
          { label: "👥 Customers", value: metrics.uniqueCustomers, icon: Users, color: "text-accent", change: null, sub: `${metrics.repeatCustomers} ordered again`, tooltip: "Unique customers who placed orders" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-2xl p-5 shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
              {stat.change !== null && (
                <span className={`flex items-center gap-0.5 text-xs font-medium ${stat.change >= 0 ? "text-primary" : "text-destructive"}`}>
                  {stat.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(stat.change)}% vs last week
                </span>
              )}
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* KPI Cards Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "✅ Delivery Rate", value: `${metrics.conversionRate}%`, sub: "Orders successfully delivered" },
          { label: "❌ Cancel Rate", value: `${metrics.cancelRate}%`, sub: `${metrics.cancelledCount} order${metrics.cancelledCount !== 1 ? "s" : ""} cancelled` },
          { label: "🏷️ Discounts Given", value: `₹${metrics.totalDiscount.toLocaleString()}`, sub: `Used in ${metrics.couponOrders} order${metrics.couponOrders !== 1 ? "s" : ""}` },
          { label: "📊 Net Revenue", value: `₹${metrics.netRevenue.toLocaleString()}`, sub: "Revenue after refunds" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-2xl p-4 shadow-soft">
            <p className="text-lg font-bold">{stat.value}</p>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">{stat.label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-card rounded-2xl p-6 shadow-soft mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-display font-semibold text-lg">
              📈 {timeRange === "12m" ? "Monthly Revenue" : "Daily Revenue"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {timeRange === "custom" ? `Revenue for ${dateLabel}` : `Revenue trend over the last ${timeRange === "7d" ? "7 days" : timeRange === "30d" ? "30 days" : timeRange === "90d" ? "90 days" : "12 months"}`}
            </p>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey={chartXKey} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}`} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "13px" }} formatter={(value: number) => [`₹${value.toLocaleString()}`, "Revenue"]} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#revenueGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Orders Chart + Status Pie */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-card rounded-2xl p-6 shadow-soft">
          <h3 className="font-display font-semibold text-lg mb-1">📦 Orders Volume</h3>
          <p className="text-xs text-muted-foreground mb-4">How many orders you're receiving each day</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey={chartXKey} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "13px" }} />
                <Bar dataKey="orders" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-6 shadow-soft">
          <h3 className="font-display font-semibold text-lg mb-1">🔄 Order Status Breakdown</h3>
          <p className="text-xs text-muted-foreground mb-4">Where your orders are in the pipeline</p>
          {statusData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No orders to show.</p>
          ) : (
            <div className="h-56 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" nameKey="name">
                    {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "13px" }} />
                  <Legend formatter={(value) => <span className="text-xs">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* CLV + Top Products + Recent Orders */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-card rounded-2xl p-6 shadow-soft">
          <h3 className="font-display font-semibold text-lg mb-1">💎 Customer Value</h3>
          <p className="text-xs text-muted-foreground mb-4">How much each customer spends over time</p>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">Average per Customer</p>
              <p className="text-2xl font-bold">₹{clvData.avg.toLocaleString()}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Median</p>
                <p className="text-lg font-semibold">₹{clvData.median.toLocaleString()}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Best Customer</p>
                <p className="text-lg font-semibold">₹{clvData.top.toLocaleString()}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">🛍️ {stats.products} products · 👥 {stats.users} total customers</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-soft">
          <h3 className="font-display font-semibold text-lg mb-1">🏆 Best Sellers</h3>
          <p className="text-xs text-muted-foreground mb-4">Your top performing products</p>
          {topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No sales data yet.</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-primary text-primary-foreground" : i === 1 ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground"}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.qty} sold</p>
                  </div>
                  <p className="text-sm font-semibold">₹{p.revenue.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-soft">
          <h3 className="font-display font-semibold text-lg mb-1">🕐 Recent Orders</h3>
          <p className="text-xs text-muted-foreground mb-4">Latest orders from your store</p>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No orders yet. They'll show up here!</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">#{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(order.created_at), "dd MMM, hh:mm a")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">₹{order.total?.toLocaleString()}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${order.status === "delivered" ? "bg-primary/10 text-primary" : order.status === "cancelled" ? "bg-destructive/10 text-destructive" : "bg-secondary text-secondary-foreground"}`}>
                      {STATUS_LABELS[order.status] || order.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
