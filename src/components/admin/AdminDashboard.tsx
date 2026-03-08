import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Package, ShoppingCart, Users, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ products: 0, orders: 0, users: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const [productsRes, ordersRes, usersRes] = await Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("id, total, status, created_at, items"),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
    ]);

    const orders = ordersRes.data || [];
    const revenue = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);

    setStats({
      products: productsRes.count || 0,
      orders: orders.length,
      users: usersRes.count || 0,
      revenue,
    });

    setRecentOrders(orders.slice(0, 5));
  };

  const statCards = [
    { label: "Total Products", value: stats.products, icon: Package, color: "text-primary" },
    { label: "Total Orders", value: stats.orders, icon: ShoppingCart, color: "text-accent" },
    { label: "Total Users", value: stats.users, icon: Users, color: "text-primary" },
    { label: "Revenue", value: `₹${stats.revenue.toLocaleString()}`, icon: TrendingUp, color: "text-accent" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-card rounded-2xl p-5 shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl p-6 shadow-soft">
        <h3 className="font-display font-semibold text-lg mb-4">Recent Orders</h3>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">#{order.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">₹{order.total?.toLocaleString()}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    order.status === "delivered" ? "bg-primary/10 text-primary" :
                    order.status === "placed" ? "bg-accent/10 text-accent" :
                    "bg-secondary text-secondary-foreground"
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
