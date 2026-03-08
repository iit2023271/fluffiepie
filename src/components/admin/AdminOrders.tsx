import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfDay, endOfDay } from "date-fns";
import { Search, MessageSquare, Send, Download, ChevronDown, ChevronUp, Trash2, Info, Calendar as CalendarIcon, X } from "lucide-react";
import Pagination from "@/components/Pagination";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 10;
const statusOptions = ["placed", "confirmed", "baking", "out_for_delivery", "delivered", "cancelled"];

const STATUS_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
  placed: { label: "Placed", color: "bg-accent/10 text-accent", emoji: "📦" },
  confirmed: { label: "Confirmed", color: "bg-primary/10 text-primary", emoji: "✅" },
  baking: { label: "Baking", color: "bg-accent/10 text-accent", emoji: "🧁" },
  out_for_delivery: { label: "Out for Delivery", color: "bg-primary/10 text-primary", emoji: "🚚" },
  delivered: { label: "Delivered", color: "bg-primary/10 text-primary", emoji: "✔️" },
  cancelled: { label: "Cancelled", color: "bg-destructive/10 text-destructive", emoji: "❌" },
};

export default function AdminOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [orderNotes, setOrderNotes] = useState<Record<string, any[]>>({});
  const [newNote, setNewNote] = useState("");

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    setLoading(true);
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (data) setOrders(data);
    setLoading(false);
  };

  const loadNotes = async (orderId: string) => {
    const { data } = await supabase.from("order_notes").select("*").eq("order_id", orderId).order("created_at", { ascending: false });
    if (data) setOrderNotes(prev => ({ ...prev, [orderId]: data }));
  };

  const addNote = async (orderId: string) => {
    if (!newNote.trim() || !user) return;
    const { error } = await supabase.from("order_notes").insert({
      order_id: orderId, admin_user_id: user.id, note: newNote.trim(), note_type: "general",
    });
    if (error) toast.error("Failed to add note");
    else { toast.success("Note added"); setNewNote(""); loadNotes(orderId); }
  };

  const deleteNote = async (noteId: string, orderId: string) => {
    if (!confirm("Delete this note?")) return;
    const { error } = await supabase.from("order_notes").delete().eq("id", noteId);
    if (error) toast.error("Failed to delete note");
    else { toast.success("Note deleted"); loadNotes(orderId); }
  };

  const sendNotification = async (order: any, newStatus: string) => {
    try {
      const deliveryAddr = order.delivery_address as any;
      const customerName = deliveryAddr?.name || "Customer";
      await supabase.functions.invoke("send-order-notification", {
        body: { orderId: order.id, newStatus, customerName, orderTotal: order.total, items: order.items, userId: order.user_id },
      });
    } catch (e) { console.error("Notification failed:", e); }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    const order = orders.find(o => o.id === orderId);
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    if (error) toast.error("Failed to update status");
    else {
      toast.success(`Order updated to "${STATUS_CONFIG[newStatus]?.label || newStatus}"`);
      if (order) sendNotification(order, newStatus);
      loadOrders();
    }
  };

  const bulkUpdateStatus = async (newStatus: string) => {
    if (selectedOrders.size === 0) return;
    const ids = Array.from(selectedOrders);
    for (const id of ids) await supabase.from("orders").update({ status: newStatus }).eq("id", id);
    toast.success(`${ids.length} order${ids.length > 1 ? "s" : ""} updated to "${STATUS_CONFIG[newStatus]?.label || newStatus}"`);
    setSelectedOrders(new Set());
    loadOrders();
  };

  const toggleSelect = (id: string) => {
    setSelectedOrders(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const toggleExpand = (id: string) => {
    if (expandedOrder === id) { setExpandedOrder(null); }
    else { setExpandedOrder(id); if (!orderNotes[id]) loadNotes(id); }
  };

  const exportCSV = () => {
    const rows = [["Order ID", "Date", "Status", "Customer", "City", "Phone", "Items", "Total", "Discount", "Coupon"]];
    filtered.forEach(o => {
      const addr = o.delivery_address as any;
      const items = Array.isArray(o.items) ? o.items.map((i: any) => `${i.name} x${i.quantity}`).join("; ") : "";
      rows.push([o.id.slice(0, 8).toUpperCase(), format(new Date(o.created_at), "yyyy-MM-dd HH:mm"), o.status, addr?.name || "", addr?.city || "", addr?.phone || "", items, String(o.total), String(o.discount || 0), o.coupon_code || ""]);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `orders-${format(new Date(), "yyyy-MM-dd")}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Orders downloaded!");
  };

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const addr = o.delivery_address as any;
      const matchSearch = !search || o.id.toLowerCase().includes(search.toLowerCase()) ||
        (addr?.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (addr?.phone || "").includes(search);
      const matchStatus = !statusFilter || o.status === statusFilter;
      const orderDate = new Date(o.created_at);
      const matchDateFrom = !dateFrom || orderDate >= startOfDay(dateFrom);
      const matchDateTo = !dateTo || orderDate <= endOfDay(dateTo);
      return matchSearch && matchStatus && matchDateFrom && matchDateTo;
    });
  }, [orders, search, statusFilter, dateFrom, dateTo]);

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter, dateFrom, dateTo]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const toggleSelectAll = () => {
    if (selectedOrders.size === paginated.length) setSelectedOrders(new Set());
    else setSelectedOrders(new Set(paginated.map(o => o.id)));
  };

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return counts;
  }, [orders]);

  const hasDateFilter = dateFrom || dateTo;
  const clearDateFilter = () => { setDateFrom(undefined); setDateTo(undefined); };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-display font-bold">📋 Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and track all customer orders</p>
        </div>
        <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={exportCSV}>
          <Download className="w-3.5 h-3.5" /> Download Orders
        </Button>
      </div>

      {/* Quick status summary */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setStatusFilter("")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!statusFilter ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-primary/10"}`}>
          All ({orders.length})
        </button>
        {statusOptions.map(s => {
          const cfg = STATUS_CONFIG[s];
          const count = statusCounts[s] || 0;
          if (count === 0) return null;
          return (
            <button key={s} onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground" : `${cfg.color} hover:opacity-80`}`}>
              {cfg.emoji} {cfg.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Search + Date Filter */}
      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input placeholder="🔍 Search by order ID, name, or phone..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:border-primary bg-background" />
        </div>

        {/* Date From */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">From</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("gap-2 text-xs min-w-[140px] justify-start", !dateFrom && "text-muted-foreground")}>
                <CalendarIcon className="w-3.5 h-3.5" />
                {dateFrom ? format(dateFrom, "dd MMM yyyy") : "Start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
        </div>

        {/* Date To */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">To</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("gap-2 text-xs min-w-[140px] justify-start", !dateTo && "text-muted-foreground")}>
                <CalendarIcon className="w-3.5 h-3.5" />
                {dateTo ? format(dateTo, "dd MMM yyyy") : "End date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
        </div>

        {hasDateFilter && (
          <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground h-9 self-end" onClick={clearDateFilter}>
            <X className="w-3.5 h-3.5" /> Clear dates
          </Button>
        )}
      </div>

      {/* Active filters summary */}
      {(hasDateFilter || statusFilter || search) && (
        <div className="mb-4 text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filtered.length}</span> order{filtered.length !== 1 ? "s" : ""}
          {hasDateFilter && (
            <span> from <span className="font-medium text-foreground">{dateFrom ? format(dateFrom, "dd MMM") : "start"}</span> to <span className="font-medium text-foreground">{dateTo ? format(dateTo, "dd MMM") : "now"}</span></span>
          )}
        </div>
      )}

      {/* Bulk actions */}
      {selectedOrders.size > 0 && (
        <div className="mb-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
          <p className="text-sm font-medium mb-2">✏️ {selectedOrders.size} order{selectedOrders.size > 1 ? "s" : ""} selected — Change status to:</p>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map(s => (
              <button key={s} onClick={() => bulkUpdateStatus(s)} className="px-3 py-1.5 rounded-lg text-xs bg-secondary hover:bg-primary/10 font-medium">
                {STATUS_CONFIG[s].emoji} {STATUS_CONFIG[s].label}
              </button>
            ))}
            <button onClick={() => setSelectedOrders(new Set())} className="text-xs text-muted-foreground hover:text-foreground ml-auto px-3 py-1.5">
              ✕ Clear selection
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-secondary rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          {paginated.length > 0 && (
            <div className="flex items-center gap-2 px-3">
              <input type="checkbox" checked={selectedOrders.size === paginated.length && paginated.length > 0} onChange={toggleSelectAll} className="rounded" />
              <span className="text-xs text-muted-foreground">Select all on this page</span>
            </div>
          )}

          {paginated.map((order) => {
            const addr = order.delivery_address as any;
            const isExpanded = expandedOrder === order.id;
            const notes = orderNotes[order.id] || [];
            const statusCfg = STATUS_CONFIG[order.status] || { label: order.status, color: "bg-secondary", emoji: "📦" };

            return (
              <div key={order.id} className="bg-card rounded-2xl shadow-soft overflow-hidden border border-border">
                <div className="flex items-start gap-3 p-4">
                  <input type="checkbox" checked={selectedOrders.has(order.id)} onChange={() => toggleSelect(order.id)} className="rounded mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                      <div>
                        <p className="text-sm font-semibold">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">📅 {format(new Date(order.created_at), "dd MMM yyyy, hh:mm a")}</p>
                        {addr && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            👤 {addr.name} {addr.city ? `· 📍 ${addr.city}` : ""} {addr.phone ? `· 📞 ${addr.phone}` : ""}
                          </p>
                        )}
                        {order.delivery_slot && (
                          <p className="text-xs text-muted-foreground mt-0.5">🚚 Delivery: {order.delivery_slot}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] text-muted-foreground mr-1">Status:</label>
                        <select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border-0 cursor-pointer ${statusCfg.color}`}>
                          {statusOptions.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].emoji} {STATUS_CONFIG[s].label}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="bg-muted/30 rounded-xl p-3 mb-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Items Ordered</p>
                      {(order.items as any[])?.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm py-0.5">
                          <span className="text-muted-foreground">{item.name} ({item.weight}) × {item.quantity}</span>
                          <span className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-bold">💰 ₹{order.total?.toLocaleString()}</span>
                        {order.discount > 0 && <span className="text-xs text-muted-foreground">🏷️ -₹{order.discount} discount</span>}
                        {order.coupon_code && <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-mono">{order.coupon_code}</span>}
                      </div>
                      <Button variant="ghost" size="sm" className="text-xs h-8 gap-1.5" onClick={() => toggleExpand(order.id)}>
                        <MessageSquare className="w-3.5 h-3.5" />
                        📝 Notes {notes.length > 0 && `(${notes.length})`}
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border p-4 bg-muted/30 space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">📝 Internal Notes</p>
                    <p className="text-[10px] text-muted-foreground">Only visible to you. Customers can't see these notes.</p>
                    <div className="flex gap-2">
                      <Textarea placeholder="Write a note about this order..." value={newNote} onChange={(e) => setNewNote(e.target.value)} rows={2} className="text-sm" />
                      <Button size="icon" className="shrink-0 self-end" onClick={() => addNote(order.id)} disabled={!newNote.trim()} title="Add note">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                    {notes.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic text-center py-2">No notes added yet</p>
                    ) : (
                      <div className="space-y-2">
                        {notes.map((n: any) => (
                          <div key={n.id} className="bg-card rounded-lg p-3 border border-border">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm">{n.note}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">📅 {format(new Date(n.created_at), "dd MMM yyyy, hh:mm a")}</p>
                              </div>
                              <button onClick={() => deleteNote(n.id, order.id)} className="shrink-0 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors" title="Delete note">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <Info className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-lg font-semibold mb-1">No orders found</p>
              <p className="text-sm text-muted-foreground">
                {search || statusFilter || hasDateFilter ? "Try adjusting your search, status, or date filters." : "Orders will appear here when customers place them."}
              </p>
            </div>
          )}
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filtered.length} itemsPerPage={ITEMS_PER_PAGE} />
        </div>
      )}
    </div>
  );
}
