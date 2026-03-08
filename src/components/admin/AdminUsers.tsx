import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, MapPin, ShoppingBag, User, Phone, Calendar, Search, Tag, X, Download, Ban, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Pagination from "@/components/Pagination";
import { toast } from "sonner";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

const ITEMS_PER_PAGE = 10;

interface UserDetail {
  profile: any;
  addresses: any[];
  orders: any[];
  tags: string[];
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  
  const [tagFilter, setTagFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [newTag, setNewTag] = useState("");
  const [allTags, setAllTags] = useState<string[]>([]);
  const [removeTagConfirm, setRemoveTagConfirm] = useState<{ open: boolean; userId: string; tag: string }>({ open: false, userId: "", tag: "" });

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    const [profilesRes, addressesRes, ordersRes, tagsRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("addresses").select("*"),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("customer_tags").select("*"),
    ]);

    const profiles = profilesRes.data || [];
    const addresses = addressesRes.data || [];
    const orders = ordersRes.data || [];
    const tags = tagsRes.data || [];

    const uniqueTags = [...new Set(tags.map((t: any) => t.tag))];
    setAllTags(uniqueTags);

    const combined: UserDetail[] = profiles.map((p) => ({
      profile: p,
      addresses: addresses.filter((a) => a.user_id === p.user_id),
      orders: orders.filter((o) => o.user_id === p.user_id),
      tags: tags.filter((t: any) => t.user_id === p.user_id).map((t: any) => t.tag),
    }));

    setUsers(combined);
    setLoading(false);
  };

  const addTag = async (userId: string, tag: string) => {
    if (!tag.trim()) return;
    const { error } = await supabase.from("customer_tags").insert({ user_id: userId, tag: tag.trim() });
    if (error) {
      if (error.code === "23505") toast.error("Tag already exists");
      else toast.error("Failed to add tag");
    } else {
      toast.success("Tag added");
      setNewTag("");
      loadUsers();
    }
  };

  const removeTag = async (userId: string, tag: string) => {
    const { error } = await supabase.from("customer_tags").delete().eq("user_id", userId).eq("tag", tag);
    if (error) toast.error("Failed to remove tag");
    else { toast.success("Tag removed"); loadUsers(); }
  };

  const exportCSV = () => {
    const rows = [["Name", "Phone", "Joined", "Total Orders", "Total Spent", "Roles", "Tags"]];
    filtered.forEach(u => {
      const totalSpent = u.orders.reduce((s, o) => s + (o.total || 0), 0);
      rows.push([
        u.profile.full_name || "", u.profile.phone || "",
        format(new Date(u.profile.created_at), "yyyy-MM-dd"),
        String(u.orders.length), String(totalSpent),
        u.roles.map((r: any) => r.role).join(", "),
        u.tags.join(", "),
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `customers-${format(new Date(), "yyyy-MM-dd")}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported!");
  };

  const filtered = useMemo(() => {
    let result = [...users];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((u) =>
        (u.profile.full_name || "").toLowerCase().includes(q) ||
        (u.profile.phone || "").includes(q)
      );
    }
    if (roleFilter) {
      result = result.filter((u) => roleFilter === "no_role" ? u.roles.length === 0 : u.roles.some((r) => r.role === roleFilter));
    }
    if (tagFilter) {
      result = result.filter(u => u.tags.includes(tagFilter));
    }
    switch (sortBy) {
      case "oldest": result.sort((a, b) => new Date(a.profile.created_at).getTime() - new Date(b.profile.created_at).getTime()); break;
      case "most_orders": result.sort((a, b) => b.orders.length - a.orders.length); break;
      case "highest_spent": result.sort((a, b) => b.orders.reduce((s, o) => s + (o.total || 0), 0) - a.orders.reduce((s, o) => s + (o.total || 0), 0)); break;
      default: result.sort((a, b) => new Date(b.profile.created_at).getTime() - new Date(a.profile.created_at).getTime());
    }
    return result;
  }, [users, search, roleFilter, tagFilter, sortBy]);

  useEffect(() => { setCurrentPage(1); }, [search, roleFilter, tagFilter, sortBy]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-primary/10 text-primary";
      case "placed": return "bg-accent/10 text-accent";
      case "cancelled": return "bg-destructive/10 text-destructive";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const segmentStats = useMemo(() => {
    const highValue = users.filter(u => u.orders.reduce((s, o) => s + (o.total || 0), 0) > 5000);
    const newCustomers = users.filter(u => u.orders.length <= 1);
    const repeatBuyers = users.filter(u => u.orders.length > 1);
    return { highValue: highValue.length, newCustomers: newCustomers.length, repeatBuyers: repeatBuyers.length };
  }, [users]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-display font-bold">Customers</h1>
        <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={exportCSV}>
          <Download className="w-3.5 h-3.5" /> Export CSV
        </Button>
      </div>

      {/* Segments */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "High Value (₹5k+)", value: segmentStats.highValue, color: "text-primary" },
          { label: "Repeat Buyers", value: segmentStats.repeatBuyers, color: "text-accent" },
          { label: "New Customers", value: segmentStats.newCustomers, color: "text-muted-foreground" },
        ].map(seg => (
          <div key={seg.label} className="bg-card rounded-xl p-3 shadow-soft text-center">
            <p className={`text-xl font-bold ${seg.color}`}>{seg.value}</p>
            <p className="text-[10px] text-muted-foreground">{seg.label}</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground mb-4">{filtered.length} of {users.length} customers</p>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input placeholder="Search by name or phone..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary bg-background" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-border text-sm bg-background">
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="moderator">Moderator</option>
          <option value="user">User</option>
          <option value="no_role">No Role</option>
        </select>
        {allTags.length > 0 && (
          <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-border text-sm bg-background">
            <option value="">All Tags</option>
            {allTags.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 rounded-xl border border-border text-sm bg-background">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="most_orders">Most Orders</option>
          <option value="highest_spent">Highest Spent</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-secondary rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {paginated.map((u) => {
            const isExpanded = expandedUser === u.profile.user_id;
            const totalSpent = u.orders.reduce((sum, o) => sum + (o.total || 0), 0);
            const deliveredOrders = u.orders.filter(o => o.status === "delivered");
            const avgOrder = deliveredOrders.length > 0 ? Math.round(deliveredOrders.reduce((s, o) => s + (o.total || 0), 0) / deliveredOrders.length) : 0;

            return (
              <div key={u.profile.id} className="bg-card rounded-2xl shadow-soft overflow-hidden border border-border">
                <button onClick={() => setExpandedUser(isExpanded ? null : u.profile.user_id)}
                  className="w-full flex items-center justify-between px-4 py-4 hover:bg-accent/50 transition-colors text-left">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold shrink-0">
                      {(u.profile.full_name || "?")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">{u.profile.full_name || "—"}</p>
                        {u.tags.map(t => (
                          <span key={t} className="px-1.5 py-0.5 rounded text-[10px] bg-accent/10 text-accent font-medium">{t}</span>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">Joined {format(new Date(u.profile.created_at), "dd MMM yyyy")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><ShoppingBag className="w-3.5 h-3.5" />{u.orders.length}</span>
                      <span className="font-semibold text-foreground">₹{totalSpent.toLocaleString()}</span>
                      {u.roles.length > 0 && <Badge variant="outline" className="text-xs">{u.roles[0].role}</Badge>}
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border px-4 py-4 space-y-5 bg-muted/30">
                    {/* Profile info */}
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Profile</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-card rounded-lg p-3 border border-border">
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="text-sm font-medium">{u.profile.phone || "—"}</p>
                        </div>
                        <div className="bg-card rounded-lg p-3 border border-border">
                          <p className="text-xs text-muted-foreground">Total Spent</p>
                          <p className="text-sm font-medium">₹{totalSpent.toLocaleString()}</p>
                        </div>
                        <div className="bg-card rounded-lg p-3 border border-border">
                          <p className="text-xs text-muted-foreground">Avg Order</p>
                          <p className="text-sm font-medium">₹{avgOrder.toLocaleString()}</p>
                        </div>
                        <div className="bg-card rounded-lg p-3 border border-border">
                          <p className="text-xs text-muted-foreground">Last Order</p>
                          <p className="text-sm font-medium">{u.orders.length > 0 ? format(new Date(u.orders[0].created_at), "dd MMM") : "—"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Tags</h3>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {u.tags.map(t => (
                          <span key={t} className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-accent/10 text-accent font-medium">
                            {t}
                            <button onClick={() => setRemoveTagConfirm({ open: true, userId: u.profile.user_id, tag: t })} className="hover:text-destructive"><X className="w-3 h-3" /></button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input placeholder="Add tag (e.g. VIP, wholesale)" value={newTag} onChange={(e) => setNewTag(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addTag(u.profile.user_id, newTag)}
                          className="max-w-[200px] px-3 py-1.5 rounded-lg border border-border text-xs focus:outline-none focus:border-primary bg-background" />
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => addTag(u.profile.user_id, newTag)}>Add</Button>
                      </div>
                    </div>

                    {/* Addresses */}
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Addresses ({u.addresses.length})</h3>
                      {u.addresses.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No addresses</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {u.addresses.map((addr) => (
                            <div key={addr.id} className="bg-card rounded-lg border border-border p-3 text-sm">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold">{addr.full_name}</span>
                                <Badge variant="outline" className="text-[10px]">{addr.label}</Badge>
                                {addr.is_default && <Badge className="text-[10px] bg-primary/10 text-primary border-0">Default</Badge>}
                              </div>
                              <p className="text-muted-foreground">{addr.address_line}, {addr.city} - {addr.pincode}</p>
                              <p className="text-muted-foreground">{addr.phone}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Orders */}
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><ShoppingBag className="w-3.5 h-3.5" /> Orders ({u.orders.length})</h3>
                      {u.orders.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No orders</p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {u.orders.map((order) => {
                            const items = Array.isArray(order.items) ? order.items : [];
                            return (
                              <div key={order.id} className="bg-card rounded-lg border border-border p-3 text-sm">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs text-muted-foreground">#{order.id.slice(0, 8)}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusColor(order.status)}`}>{order.status}</span>
                                  </div>
                                  <span className="font-semibold">₹{order.total}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{format(new Date(order.created_at), "dd MMM yyyy, hh:mm a")}</p>
                                {items.length > 0 && (
                                  <div className="mt-1 space-y-0.5">
                                    {items.slice(0, 3).map((item: any, idx: number) => (
                                      <div key={idx} className="flex justify-between text-xs text-muted-foreground">
                                        <span>{item.name} ({item.weight}) × {item.quantity}</span>
                                        <span>₹{item.price * item.quantity}</span>
                                      </div>
                                    ))}
                                    {items.length > 3 && <p className="text-[10px] text-muted-foreground">+{items.length - 3} more items</p>}
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
          {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">No customers found</p>}
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filtered.length} itemsPerPage={ITEMS_PER_PAGE} />
        </div>
      )}

      <ConfirmDialog
        open={removeTagConfirm.open}
        onOpenChange={(open) => setRemoveTagConfirm(prev => ({ ...prev, open }))}
        title="Remove Tag"
        description={`Remove the tag "${removeTagConfirm.tag}" from this customer?`}
        confirmLabel="Remove"
        onConfirm={() => { removeTag(removeTagConfirm.userId, removeTagConfirm.tag); setRemoveTagConfirm({ open: false, userId: "", tag: "" }); }}
      />
    </div>
  );
}
