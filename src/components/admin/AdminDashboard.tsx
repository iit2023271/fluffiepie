import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Package, ShoppingCart, Users, TrendingUp, ArrowUpRight, ArrowDownRight, CalendarDays } from "lucide-react";
import { format, subDays, startOfMonth, eachDayOfInterval, eachMonthOfInterval, subMonths, isSameDay, isSameMonth } from "date-fns";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface Order {
  id: string;
  total: number;
  status: string;
  created_at: string;
  items: any;
  discount: number;
  delivery_fee: number;
  subtotal: number;
}

const STATUS_COLORS: Record<string, string> = {
  placed: "hsl(var(--accent))",
  confirmed: "hsl(var(--primary))",
  baking: "hsl(30 80% 55%)",
  out_for_delivery: "hsl(200 70% 50%)",
  delivered: "hsl(142 71% 45%)",
  cancelled: "hsl(var(--destructive))",
};

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(30 80% 55%)", "hsl(200 70% 50%)", "hsl(142 71% 45%)", "hsl(0 65% 55%)"];

type TimeRange = "7d" | "30d" | "90d" | "12m";

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ products: 0, users: 0 });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [productsRes, ordersRes, usersRes] = await Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("id, total, status, created_at, items, discount, delivery_fee, subtotal"),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
    ]);
    setOrders((ordersRes.data as Order[]) || []);
    setStats({ products: productsRes.count || 0, users: usersRes.count || 0 });
    setLoading(false);
  };

  // Compute metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const totalDiscount = orders.reduce((s, o) => s + (o.discount || 0), 0);

    // Compare this week vs last week
    const thisWeekOrders = orders.filter(o => new Date(o.created_at) >= subDays(now, 7));
    const lastWeekOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= subDays(now, 14) && d < subDays(now, 7);
    });
    const thisWeekRevenue = thisWeekOrders.reduce((s, o) => s + (o.total || 0), 0);
    const lastWeekRevenue = lastWeekOrders.reduce((s, o) => s + (o.total || 0), 0);
    const revenueChange = lastWeekRevenue > 0 ? Math.round(((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100) : thisWeekRevenue > 0 ? 100 : 0;
    const ordersChange = lastWeekOrders.length > 0 ? Math.round(((thisWeekOrders.length - lastWeekOrders.length) / lastWeekOrders.length) * 100) : thisWeekOrders.length > 0 ? 100 : 0;

    return { totalRevenue, totalOrders, avgOrderValue, totalDiscount, revenueChange, ordersChange, thisWeekRevenue, thisWeekOrders: thisWeekOrders.length };
  }, [orders]);

  // Daily revenue chart data
  const dailyData = useMemo(() => {
    const now = new Date();
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const interval = eachDayOfInterval({ start: subDays(now, days - 1), end: now });
    return interval.map(day => {
      const dayOrders = orders.filter(o => isSameDay(new Date(o.created_at), day));
      return {
        date: format(day, days <= 7 ? "EEE" : "dd MMM"),
        revenue: dayOrders.reduce((s, o) => s + (o.total || 0), 0),
        orders: dayOrders.length,
      };
    });
  }, [orders, timeRange]);

  // Monthly revenue chart data
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

  // Order status breakdown
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));
  }, [orders]);

  // Top selling products
  const topProducts = useMemo(() => {
    const productMap: Record<string, { name: string; qty: number; revenue: number }> = {};
    orders.forEach(o => {
      const items = Array.isArray(o.items) ? o.items : [];
      items.forEach((item: any) => {
        const key = item.name || item.slug || "Unknown";
        if (!productMap[key]) productMap[key] = { name: key, qty: 0, revenue: 0 };
        productMap[key].qty += item.quantity || 1;
        productMap[key].revenue += (item.price || 0) * (item.quantity || 1);
      });
    });
    return Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [orders]);

  // Recent orders
  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  const chartData = timeRange === "12m" ? monthlyData : dailyData;
  const chartXKey = timeRange === "12m" ? "month" : "date";

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-display font-bold mb-6">Dashboard</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-secondary rounded-2xl animate-pulse" />)}
        </div>
        <div className="h-72 bg-secondary rounded-2xl animate-pulse mb-6" />
      </div>
    );
  }

  const statCards = [
    { label: "Total Revenue", value: `₹${metrics.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-primary", change: metrics.revenueChange, sub: "vs last week" },
    { label: "Total Orders", value: metrics.totalOrders, icon: ShoppingCart, color: "text-accent", change: metrics.ordersChange, sub: "vs last week" },
    { label: "Avg Order Value", value: `₹${metrics.avgOrderValue.toLocaleString()}`, icon: CalendarDays, color: "text-primary", change: null, sub: "per order" },
    { label: "Total Customers", value: stats.users, icon: Users, color: "text-accent", change: null, sub: `${stats.products} products` },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold">Dashboard</h1>
        <div className="flex gap-1 bg-secondary rounded-xl p-1">
          {([["7d", "7D"], ["30d", "30D"], ["90d", "90D"], ["12m", "12M"]] as [TimeRange, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTimeRange(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                timeRange === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-card rounded-2xl p-5 shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              {stat.change !== null && (
                <span className={`flex items-center gap-0.5 text-xs font-medium ${stat.change >= 0 ? "text-primary" : "text-destructive"}`}>
                  {stat.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(stat.change)}%
                </span>
              )}
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-card rounded-2xl p-6 shadow-soft mb-6">
        <h3 className="font-display font-semibold text-lg mb-4">
          {timeRange === "12m" ? "Monthly Revenue" : "Daily Revenue"}
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey={chartXKey} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}`} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "13px" }}
                formatter={(value: number) => [`₹${value.toLocaleString()}`, "Revenue"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#revenueGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Orders Chart + Status Pie */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-card rounded-2xl p-6 shadow-soft">
          <h3 className="font-display font-semibold text-lg mb-4">
            {timeRange === "12m" ? "Monthly Orders" : "Daily Orders"}
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey={chartXKey} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "13px" }}
                />
                <Bar dataKey="orders" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-soft">
          <h3 className="font-display font-semibold text-lg mb-4">Order Status</h3>
          {statusData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No order data.</p>
          ) : (
            <div className="h-56 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "13px" }}
                  />
                  <Legend
                    formatter={(value) => <span className="text-xs capitalize">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Top Products + Recent Orders */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl p-6 shadow-soft">
          <h3 className="font-display font-semibold text-lg mb-4">Top Selling Products</h3>
          {topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sales data yet.</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? "bg-primary text-primary-foreground" :
                    i === 1 ? "bg-accent text-accent-foreground" :
                    "bg-secondary text-secondary-foreground"
                  }`}>
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
          <h3 className="font-display font-semibold text-lg mb-4">Recent Orders</h3>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">#{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(order.created_at), "dd MMM, hh:mm a")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">₹{order.total?.toLocaleString()}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                      order.status === "delivered" ? "bg-primary/10 text-primary" :
                      order.status === "cancelled" ? "bg-destructive/10 text-destructive" :
                      order.status === "placed" ? "bg-accent/10 text-accent" :
                      "bg-secondary text-secondary-foreground"
                    }`}>
                      {order.status.replace(/_/g, " ")}
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
