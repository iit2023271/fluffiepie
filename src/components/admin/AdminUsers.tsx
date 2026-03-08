import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, MapPin, ShoppingBag, User, Phone, Calendar, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Pagination from "@/components/Pagination";

const ITEMS_PER_PAGE = 10;

interface UserDetail {
  profile: any;
  addresses: any[];
  orders: any[];
  roles: any[];
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

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

  const filtered = useMemo(() => {
    setCurrentPage(1);
    let result = [...users];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((u) =>
        (u.profile.full_name || "").toLowerCase().includes(q) ||
        (u.profile.phone || "").includes(q)
      );
    }
    if (roleFilter) {
      result = result.filter((u) =>
        roleFilter === "no_role"
          ? u.roles.length === 0
          : u.roles.some((r) => r.role === roleFilter)
      );
    }
    switch (sortBy) {
      case "oldest": result.sort((a, b) => new Date(a.profile.created_at).getTime() - new Date(b.profile.created_at).getTime()); break;
      case "most_orders": result.sort((a, b) => b.orders.length - a.orders.length); break;
      case "highest_spent": result.sort((a, b) => b.orders.reduce((s, o) => s + (o.total || 0), 0) - a.orders.reduce((s, o) => s + (o.total || 0), 0)); break;
      default: result.sort((a, b) => new Date(b.profile.created_at).getTime() - new Date(a.profile.created_at).getTime());
    }
    return result;
  }, [users, search, roleFilter, sortBy]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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
      <h1 className="text-2xl font-display font-bold mb-2">Customers</h1>
      <p className="text-sm text-muted-foreground mb-4">{filtered.length} of {users.length} customers</p>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-border text-sm bg-background">
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="moderator">Moderator</option>
          <option value="user">User</option>
          <option value="no_role">No Role</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 rounded-xl border border-border text-sm bg-background">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="most_orders">Most Orders</option>
          <option value="highest_spent">Highest Spent</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-secondary rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {paginated.map((u) => {
            const isExpanded = expandedUser === u.profile.user_id;
            const totalSpent = u.orders.reduce((sum, o) => sum + (o.total || 0), 0);

            return (
              <div key={u.profile.id} className="bg-card rounded-2xl shadow-soft overflow-hidden border border-border">
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

                {isExpanded && (
                  <div className="border-t border-border px-4 py-4 space-y-5 bg-muted/30">
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
                                  </div>
                                  <span className="font-semibold">₹{order.total}</span>
                                </div>
                                <div className="text-xs text-muted-foreground mb-1">
                                  {format(new Date(order.created_at), "dd MMM yyyy, hh:mm a")}
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
          {filtered.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">No customers found.</div>
          )}
        </div>
      )}
    </div>
  );
}
