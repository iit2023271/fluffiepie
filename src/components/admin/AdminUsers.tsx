import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, MapPin, ShoppingBag, User, Phone, Calendar, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UserDetail {
  profile: any;
  addresses: any[];
  orders: any[];
  roles: any[];
  email?: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);

    const [profilesRes, addressesRes, ordersRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("addresses").select("*"),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
    ]);

    const profiles = profilesRes.data || [];
    const addresses = addressesRes.data || [];
    const orders = ordersRes.data || [];
    const roles = rolesRes.data || [];

    const combined: UserDetail[] = profiles.map((p) => ({
      profile: p,
      addresses: addresses.filter((a) => a.user_id === p.user_id),
      orders: orders.filter((o) => o.user_id === p.user_id),
      roles: roles.filter((r) => r.user_id === p.user_id),
    }));

    setUsers(combined);
    setLoading(false);
  };

  const toggleExpand = (userId: string) => {
    setExpandedUser(expandedUser === userId ? null : userId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "placed": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "cancelled": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-6">Customers</h1>
      <p className="text-sm text-muted-foreground mb-4">{users.length} registered customers</p>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-secondary rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => {
            const isExpanded = expandedUser === u.profile.user_id;
            const totalSpent = u.orders.reduce((sum, o) => sum + (o.total || 0), 0);

            return (
              <div key={u.profile.id} className="bg-card rounded-2xl shadow-soft overflow-hidden border border-border">
                {/* Summary row */}
                <button
                  onClick={() => toggleExpand(u.profile.user_id)}
                  className="w-full flex items-center justify-between px-4 py-4 hover:bg-accent/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold shrink-0">
                      {(u.profile.full_name || "?")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{u.profile.full_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined {format(new Date(u.profile.created_at), "dd MMM yyyy")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ShoppingBag className="w-3.5 h-3.5" />
                        {u.orders.length} orders
                      </span>
                      <span className="font-semibold text-foreground">₹{totalSpent.toLocaleString()}</span>
                      {u.roles.length > 0 && (
                        <Badge variant="outline" className="text-xs">{u.roles[0].role}</Badge>
                      )}
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-border px-4 py-4 space-y-5 bg-muted/30">
                    {/* Profile Info */}
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" /> Profile
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Name:</span>
                          <span className="font-medium">{u.profile.full_name || "—"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Phone:</span>
                          <span className="font-medium">{u.profile.phone || "—"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Joined:</span>
                          <span className="font-medium">{format(new Date(u.profile.created_at), "dd MMM yyyy, hh:mm a")}</span>
                        </div>
                        {u.roles.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Role:</span>
                            <Badge variant="secondary">{u.roles[0].role}</Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Addresses */}
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" /> Addresses ({u.addresses.length})
                      </h3>
                      {u.addresses.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No addresses saved</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {u.addresses.map((addr) => (
                            <div key={addr.id} className="bg-card rounded-lg border border-border p-3 text-sm">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold">{addr.full_name}</span>
                                <Badge variant="outline" className="text-[10px]">{addr.label}</Badge>
                                {addr.is_default && <Badge className="text-[10px] bg-primary/10 text-primary border-0">Default</Badge>}
                              </div>
                              <p className="text-muted-foreground">{addr.address_line}</p>
                              <p className="text-muted-foreground">{addr.city} - {addr.pincode}</p>
                              <p className="text-muted-foreground">{addr.phone}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Orders */}
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5" /> Orders ({u.orders.length})
                      </h3>
                      {u.orders.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No orders yet</p>
                      ) : (
                        <div className="space-y-2">
                          {u.orders.map((order) => {
                            const items = Array.isArray(order.items) ? order.items : [];
                            return (
                              <div key={order.id} className="bg-card rounded-lg border border-border p-3 text-sm">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs text-muted-foreground">#{order.id.slice(0, 8)}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusColor(order.status)}`}>
                                      {order.status}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusColor(order.payment_status)}`}>
                                      {order.payment_status}
                                    </span>
                                  </div>
                                  <span className="font-semibold">₹{order.total}</span>
                                </div>
                                <div className="text-xs text-muted-foreground mb-1">
                                  {format(new Date(order.created_at), "dd MMM yyyy, hh:mm a")}
                                  {order.delivery_slot && ` • Slot: ${order.delivery_slot}`}
                                </div>
                                {items.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {items.map((item: any, idx: number) => (
                                      <div key={idx} className="flex justify-between text-xs">
                                        <span>{item.name || "Item"} {item.weight ? `(${item.weight})` : ""} × {item.quantity || 1}</span>
                                        <span className="text-muted-foreground">₹{item.price || 0}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {order.coupon_code && (
                                  <p className="text-xs text-muted-foreground mt-1">Coupon: {order.coupon_code} (−₹{order.discount})</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {users.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">No customers yet.</div>
          )}
        </div>
      )}
    </div>
  );
}
