import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, formatDistanceToNow, startOfDay, endOfDay, isToday, isTomorrow, isYesterday } from "date-fns";
import { Search, MessageSquare, Send, Download, ChevronDown, ChevronUp, Trash2, Calendar as CalendarIcon, X, Clock, MapPin, Phone, Package, Truck, CheckCircle2, Timer, Copy } from "lucide-react";
import Pagination from "@/components/Pagination";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

const ITEMS_PER_PAGE = 10;
const statusOptions = ["placed", "confirmed", "baking", "out_for_delivery", "delivered", "cancelled"];

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; emoji: string; icon: string }> = {
  placed: { label: "Placed", color: "text-amber-600", bgColor: "bg-amber-50 border-amber-200", emoji: "📦", icon: "⏳" },
  confirmed: { label: "Confirmed", color: "text-blue-600", bgColor: "bg-blue-50 border-blue-200", emoji: "✅", icon: "👍" },
  baking: { label: "Baking", color: "text-orange-600", bgColor: "bg-orange-50 border-orange-200", emoji: "🧁", icon: "🔥" },
  out_for_delivery: { label: "Out for Delivery", color: "text-purple-600", bgColor: "bg-purple-50 border-purple-200", emoji: "🚚", icon: "🛵" },
  delivered: { label: "Delivered", color: "text-emerald-600", bgColor: "bg-emerald-50 border-emerald-200", emoji: "✔️", icon: "✅" },
  cancelled: { label: "Cancelled", color: "text-red-500", bgColor: "bg-red-50 border-red-200", emoji: "❌", icon: "🚫" },
};

const STATUS_STEP_ORDER = ["placed", "confirmed", "baking", "out_for_delivery", "delivered"];

function getRelativeDate(date: Date): string {
  if (isToday(date)) return `Today, ${format(date, "hh:mm a")}`;
  if (isYesterday(date)) return `Yesterday, ${format(date, "hh:mm a")}`;
  if (isTomorrow(date)) return `Tomorrow, ${format(date, "hh:mm a")}`;
  return format(date, "dd MMM yyyy, hh:mm a");
}

function getTimeAgo(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true });
}

function parseDeliveryInfo(slot: string | null): { label: string; isUrgent: boolean } {
  if (!slot) return { label: "Not specified", isUrgent: false };
  const lower = slot.toLowerCase();
  const isUrgent = lower.includes("today") || lower.includes("express") || lower.includes("asap");
  return { label: slot, isUrgent };
}

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
  const [deleteNoteConfirm, setDeleteNoteConfirm] = useState<{ open: boolean; noteId: string; orderId: string }>({ open: false, noteId: "", orderId: "" });
  const [bulkConfirm, setBulkConfirm] = useState<{ open: boolean; status: string }>({ open: false, status: "" });
  const [statusChangeConfirm, setStatusChangeConfirm] = useState<{ open: boolean; orderId: string; newStatus: string }>({ open: false, orderId: "", newStatus: "" });

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

  const copyOrderId = (id: string) => {
    navigator.clipboard.writeText(id.slice(0, 8).toUpperCase());
    toast.success("Order ID copied!");
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

  const handleStatusChange = (orderId: string, newStatus: string) => {
    const order = orders.find(o => o.id === orderId);
    if (newStatus === "cancelled" && order?.status !== "cancelled") {
      setStatusChangeConfirm({ open: true, orderId, newStatus });
    } else {
      updateStatus(orderId, newStatus);
    }
  };

  // Get next logical status for quick action button
  const getNextStatus = (currentStatus: string): string | null => {
    const idx = STATUS_STEP_ORDER.indexOf(currentStatus);
    if (idx === -1 || idx >= STATUS_STEP_ORDER.length - 1) return null;
    return STATUS_STEP_ORDER[idx + 1];
  };

  // Today's stats
  const todayStats = useMemo(() => {
    const today = orders.filter(o => isToday(new Date(o.created_at)));
    const todayRevenue = today.reduce((s, o) => s + (o.total || 0), 0);
    const pending = orders.filter(o => ["placed", "confirmed"].includes(o.status));
    const inProgress = orders.filter(o => ["baking", "out_for_delivery"].includes(o.status));
    return { todayCount: today.length, todayRevenue, pendingCount: pending.length, inProgressCount: inProgress.length };
  }, [orders]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and track all customer orders</p>
        </div>
        <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={exportCSV}>
          <Download className="w-3.5 h-3.5" /> Export
        </Button>
      </div>

      {/* Today's Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center"><Package className="w-4 h-4 text-primary" /></div>
            <span className="text-xs text-muted-foreground">Today's Orders</span>
          </div>
          <p className="text-2xl font-bold">{todayStats.todayCount}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-sm">💰</div>
            <span className="text-xs text-muted-foreground">Today's Revenue</span>
          </div>
          <p className="text-2xl font-bold">₹{todayStats.todayRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center"><Timer className="w-4 h-4 text-amber-600" /></div>
            <span className="text-xs text-muted-foreground">Needs Action</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{todayStats.pendingCount}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-sm">🔥</div>
            <span className="text-xs text-muted-foreground">In Progress</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">{todayStats.inProgressCount}</p>
        </div>
      </div>

      {/* Status Filter Pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setStatusFilter("")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${!statusFilter ? "bg-foreground text-background shadow-md" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
          All Orders ({orders.length})
        </button>
        {statusOptions.map(s => {
          const cfg = STATUS_CONFIG[s];
          const count = statusCounts[s] || 0;
          if (count === 0) return null;
          return (
            <button key={s} onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${statusFilter === s ? `${cfg.bgColor} ${cfg.color} shadow-sm` : "bg-card border-border text-muted-foreground hover:border-primary/30"}`}>
              {cfg.emoji} {cfg.label} <span className="ml-1 opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Search + Date Filter */}
      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input placeholder="Search by order ID, name, or phone..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background" />
        </div>

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
            <X className="w-3.5 h-3.5" /> Clear
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
        <div className="mb-4 p-4 rounded-2xl bg-primary/5 border border-primary/20">
          <p className="text-sm font-medium mb-3">{selectedOrders.size} order{selectedOrders.size > 1 ? "s" : ""} selected</p>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map(s => (
              <button key={s} onClick={() => setBulkConfirm({ open: true, status: s })}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all hover:shadow-sm ${STATUS_CONFIG[s].bgColor} ${STATUS_CONFIG[s].color}`}>
                {STATUS_CONFIG[s].emoji} {STATUS_CONFIG[s].label}
              </button>
            ))}
            <button onClick={() => setSelectedOrders(new Set())} className="text-xs text-muted-foreground hover:text-foreground ml-auto px-3 py-1.5">
              ✕ Clear
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-32 bg-secondary rounded-2xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {paginated.length > 0 && (
            <div className="flex items-center gap-2 px-2">
              <input type="checkbox" checked={selectedOrders.size === paginated.length && paginated.length > 0} onChange={toggleSelectAll} className="rounded" />
              <span className="text-xs text-muted-foreground">Select all on page</span>
            </div>
          )}

          {paginated.map((order) => {
            const addr = order.delivery_address as any;
            const isExpanded = expandedOrder === order.id;
            const notes = orderNotes[order.id] || [];
            const statusCfg = STATUS_CONFIG[order.status] || { label: order.status, color: "text-muted-foreground", bgColor: "bg-secondary border-border", emoji: "📦", icon: "📦" };
            const orderDate = new Date(order.created_at);
            const updatedDate = new Date(order.updated_at);
            const deliveryInfo = parseDeliveryInfo(order.delivery_slot);
            const nextStatus = getNextStatus(order.status);
            const itemCount = Array.isArray(order.items) ? (order.items as any[]).reduce((s, i) => s + (i.quantity || 1), 0) : 0;
            const currentStepIdx = STATUS_STEP_ORDER.indexOf(order.status);
            const isCancelled = order.status === "cancelled";

            return (
              <div key={order.id} className={`bg-card rounded-2xl overflow-hidden border transition-all hover:shadow-md ${isCancelled ? "border-red-200 opacity-75" : "border-border"}`}>
                {/* Main order card */}
                <div className="p-4 md:p-5">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" checked={selectedOrders.has(order.id)} onChange={() => toggleSelect(order.id)} className="rounded mt-1.5" />

                    <div className="flex-1 min-w-0">
                      {/* Top row: ID + Status + Time */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => copyOrderId(order.id)} className="flex items-center gap-1 text-sm font-bold font-mono hover:text-primary transition-colors" title="Click to copy">
                            #{order.id.slice(0, 8).toUpperCase()}
                            <Copy className="w-3 h-3 opacity-40" />
                          </button>
                          <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${statusCfg.bgColor} ${statusCfg.color}`}>
                            {statusCfg.emoji} {statusCfg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span title={format(orderDate, "dd MMM yyyy, hh:mm:ss a")}>{getTimeAgo(orderDate)}</span>
                        </div>
                      </div>

                      {/* Status Progress Bar (not for cancelled) */}
                      {!isCancelled && (
                        <div className="flex items-center gap-1 mb-4">
                          {STATUS_STEP_ORDER.map((step, idx) => {
                            const isCompleted = idx <= currentStepIdx;
                            const isCurrent = idx === currentStepIdx;
                            return (
                              <div key={step} className="flex items-center flex-1">
                                <div className={`h-1.5 w-full rounded-full transition-all ${isCompleted ? "bg-primary" : "bg-border"} ${isCurrent ? "bg-primary shadow-sm" : ""}`} />
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Customer + Delivery Info Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                        {/* Customer */}
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {(addr?.name || "?")[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{addr?.name || "Unknown"}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="w-3 h-3" />
                              <span>{addr?.phone || "—"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Delivery Address */}
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground truncate">
                              {addr?.address_line ? `${addr.address_line}, ` : ""}{addr?.city || ""} {addr?.pincode || ""}
                            </p>
                          </div>
                        </div>

                        {/* Delivery Slot */}
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${deliveryInfo.isUrgent ? "bg-red-50 text-red-600 border border-red-200" : "bg-muted/50 text-muted-foreground"}`}>
                          <Truck className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{deliveryInfo.label}</span>
                          {deliveryInfo.isUrgent && <span className="ml-auto text-[10px] font-bold uppercase tracking-wider animate-pulse">URGENT</span>}
                        </div>
                      </div>

                      {/* Items Summary (compact) */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-1 flex items-center gap-2 text-xs text-muted-foreground overflow-hidden">
                          <Package className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">
                            {(order.items as any[])?.slice(0, 3).map((item: any) => `${item.name} ×${item.quantity}`).join(", ")}
                            {(order.items as any[])?.length > 3 ? ` +${(order.items as any[]).length - 3} more` : ""}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
                      </div>

                      {/* Bottom Row: Price + Actions */}
                      <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold">₹{order.total?.toLocaleString()}</span>
                          {order.discount > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 font-medium border border-emerald-200">
                              -₹{order.discount} off
                            </span>
                          )}
                          {order.coupon_code && (
                            <span className="text-xs px-2 py-0.5 rounded-lg bg-purple-50 text-purple-600 font-mono font-medium border border-purple-200">
                              {order.coupon_code}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Quick next-step button */}
                          {nextStatus && (
                            <Button
                              size="sm"
                              className="text-xs h-8 gap-1.5 rounded-xl"
                              onClick={() => handleStatusChange(order.id, nextStatus)}
                            >
                              {STATUS_CONFIG[nextStatus].emoji} Mark {STATUS_CONFIG[nextStatus].label}
                            </Button>
                          )}

                          {/* Status dropdown for manual selection */}
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" className="text-xs h-8 px-2.5 rounded-xl">
                                <ChevronDown className="w-3.5 h-3.5" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-1.5" align="end">
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-2 py-1.5">Change Status</p>
                              {statusOptions.map(s => (
                                <button
                                  key={s}
                                  onClick={() => { handleStatusChange(order.id, s); }}
                                  disabled={order.status === s}
                                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${order.status === s ? "opacity-40 cursor-not-allowed" : "hover:bg-secondary"}`}
                                >
                                  <span>{STATUS_CONFIG[s].emoji}</span>
                                  <span>{STATUS_CONFIG[s].label}</span>
                                  {order.status === s && <CheckCircle2 className="w-3 h-3 ml-auto text-primary" />}
                                </button>
                              ))}
                            </PopoverContent>
                          </Popover>

                          {/* Notes toggle */}
                          <Button variant="ghost" size="sm" className="text-xs h-8 gap-1 rounded-xl px-2.5" onClick={() => toggleExpand(order.id)}>
                            <MessageSquare className="w-3.5 h-3.5" />
                            {notes.length > 0 && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">{notes.length}</span>}
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded: Items detail + Notes */}
                {isExpanded && (
                  <div className="border-t border-border">
                    {/* Detailed items */}
                    <div className="px-5 py-4 bg-muted/20">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Order Items</p>
                      <div className="space-y-1.5">
                        {(order.items as any[])?.map((item: any, i: number) => (
                          <div key={i} className="flex items-center justify-between py-1.5 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">{item.quantity}</span>
                              <span className="font-medium">{item.name}</span>
                              <span className="text-xs text-muted-foreground">({item.weight})</span>
                            </div>
                            <span className="font-semibold">₹{(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-border mt-3 pt-3 space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Subtotal</span><span>₹{order.subtotal?.toLocaleString()}</span>
                        </div>
                        {order.delivery_fee > 0 && (
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Delivery Fee</span><span>₹{order.delivery_fee}</span>
                          </div>
                        )}
                        {order.discount > 0 && (
                          <div className="flex justify-between text-xs text-emerald-600">
                            <span>Discount</span><span>-₹{order.discount}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-bold pt-1">
                          <span>Total</span><span>₹{order.total?.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="px-5 py-4 bg-muted/10 border-t border-border">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Timeline</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>Ordered {getRelativeDate(orderDate)}</span>
                      </div>
                      {order.updated_at !== order.created_at && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Last updated {getRelativeDate(updatedDate)}</span>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    <div className="px-5 py-4 border-t border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Internal Notes</p>
                        <span className="text-[10px] text-muted-foreground">Only visible to admins</span>
                      </div>
                      <div className="flex gap-2">
                        <Textarea placeholder="Add a note..." value={newNote} onChange={(e) => setNewNote(e.target.value)} rows={2} className="text-sm rounded-xl" />
                        <Button size="icon" className="shrink-0 self-end rounded-xl" onClick={() => addNote(order.id)} disabled={!newNote.trim()}>
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                      {notes.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic text-center py-2">No notes yet</p>
                      ) : (
                        <div className="space-y-2">
                          {notes.map((n: any) => (
                            <div key={n.id} className="bg-muted/30 rounded-xl p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm">{n.note}</p>
                                  <p className="text-[10px] text-muted-foreground mt-1">{getRelativeDate(new Date(n.created_at))}</p>
                                </div>
                                <button onClick={() => setDeleteNoteConfirm({ open: true, noteId: n.id, orderId: order.id })} className="shrink-0 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 text-2xl">📋</div>
              <p className="text-lg font-semibold mb-1">No orders found</p>
              <p className="text-sm text-muted-foreground">
                {search || statusFilter || hasDateFilter ? "Try adjusting your filters." : "Orders will appear here when customers place them."}
              </p>
            </div>
          )}
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filtered.length} itemsPerPage={ITEMS_PER_PAGE} />
        </div>
      )}

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={deleteNoteConfirm.open}
        onOpenChange={(open) => setDeleteNoteConfirm(prev => ({ ...prev, open }))}
        title="Delete Note"
        description="Are you sure you want to delete this note? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => { deleteNote(deleteNoteConfirm.noteId, deleteNoteConfirm.orderId); setDeleteNoteConfirm({ open: false, noteId: "", orderId: "" }); }}
      />
      <ConfirmDialog
        open={bulkConfirm.open}
        onOpenChange={(open) => setBulkConfirm(prev => ({ ...prev, open }))}
        title="Bulk Status Update"
        description={`Change ${selectedOrders.size} order${selectedOrders.size > 1 ? "s" : ""} to "${STATUS_CONFIG[bulkConfirm.status]?.label || bulkConfirm.status}"?`}
        confirmLabel={`Update ${selectedOrders.size} order${selectedOrders.size > 1 ? "s" : ""}`}
        variant={bulkConfirm.status === "cancelled" ? "destructive" : "default"}
        onConfirm={() => { bulkUpdateStatus(bulkConfirm.status); setBulkConfirm({ open: false, status: "" }); }}
      />
      <ConfirmDialog
        open={statusChangeConfirm.open}
        onOpenChange={(open) => setStatusChangeConfirm(prev => ({ ...prev, open }))}
        title="Cancel Order"
        description="Are you sure you want to cancel this order? The customer will be notified if email notifications are enabled."
        confirmLabel="Cancel Order"
        onConfirm={() => { updateStatus(statusChangeConfirm.orderId, statusChangeConfirm.newStatus); setStatusChangeConfirm({ open: false, orderId: "", newStatus: "" }); }}
      />
    </div>
  );
}
