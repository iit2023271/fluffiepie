import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parse, formatDistanceToNow, startOfDay, endOfDay, isToday, isTomorrow, isYesterday } from "date-fns";
import { Search, Send, Download, ChevronDown, ChevronUp, Trash2, Calendar as CalendarIcon, X, Clock, Package, CheckCircle2, Timer, Copy, Undo2 } from "lucide-react";
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
  // Check if delivery is today
  const lower = slot.toLowerCase();
  const isUrgent = lower.includes("today") || lower.includes("express") || lower.includes("asap");
  // For new format "dd MMM yyyy, time", check if date matches today
  let urgentByDate = false;
  try {
    const datePart = slot.split(",")[0].trim();
    const parsed = parse(datePart, "dd MMM yyyy", new Date());
    if (!isNaN(parsed.getTime()) && isToday(parsed)) urgentByDate = true;
  } catch {}
  return { label: slot, isUrgent: isUrgent || urgentByDate };
}

export default function AdminOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [orderNotes, setOrderNotes] = useState<Record<string, any[]>>({});
  const [newNote, setNewNote] = useState("");
  const [newNoteType, setNewNoteType] = useState<"internal" | "customer">("internal");
  const [deleteNoteConfirm, setDeleteNoteConfirm] = useState<{ open: boolean; noteId: string; orderId: string }>({ open: false, noteId: "", orderId: "" });
  const [bulkConfirm, setBulkConfirm] = useState<{ open: boolean; status: string }>({ open: false, status: "" });
  const [statusChangeConfirm, setStatusChangeConfirm] = useState<{ open: boolean; orderId: string; newStatus: string }>({ open: false, orderId: "", newStatus: "" });
  const [notificationSettings, setNotificationSettings] = useState<Record<string, boolean>>({
    placed: true,
    confirmed: true,
    baking: true,
    out_for_delivery: true,
    delivered: true,
    cancelled: true,
  });

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    setLoading(true);
    const [ordersRes, notificationsRes] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("store_config").select("value, is_active").eq("config_type", "email_notification"),
    ]);

    if (ordersRes.data) setOrders(ordersRes.data);

    if (notificationsRes.data) {
      const nextSettings: Record<string, boolean> = {
        placed: true,
        confirmed: true,
        baking: true,
        out_for_delivery: true,
        delivered: true,
        cancelled: true,
      };

      notificationsRes.data.forEach((item) => {
        if (item.value in nextSettings) {
          nextSettings[item.value] = item.is_active;
        }
      });

      setNotificationSettings(nextSettings);
    }

    setLoading(false);
  };

  const loadNotes = async (orderId: string) => {
    const { data } = await supabase.from("order_notes").select("*").eq("order_id", orderId).order("created_at", { ascending: false });
    if (data) setOrderNotes(prev => ({ ...prev, [orderId]: data }));
  };

  const addNote = async (orderId: string) => {
    if (!newNote.trim() || !user) return;
    const { error } = await supabase.from("order_notes").insert({
      order_id: orderId, admin_user_id: user.id, note: newNote.trim(), note_type: newNoteType,
    });
    if (error) toast.error("Failed to add note");
    else { toast.success(newNoteType === "customer" ? "Customer note added" : "Internal note added"); setNewNote(""); setNewNoteType("internal"); loadNotes(orderId); }
  };

  const deleteNote = async (noteId: string, orderId: string) => {
    const { error } = await supabase.from("order_notes").delete().eq("id", noteId);
    if (error) toast.error("Failed to delete note");
    else { toast.success("Note deleted"); loadNotes(orderId); }
  };

  const STATUS_LABELS: Record<string, string> = {
    placed: "Order Placed", confirmed: "Order Confirmed", baking: "Being Prepared",
    out_for_delivery: "Out for Delivery", delivered: "Delivered", cancelled: "Cancelled",
  };

  const sendNotification = async (order: any, newStatus: string, composeWindow?: Window | null) => {
    try {
      // Fetch customer email from profiles
      const { data: profile } = await supabase.from("profiles").select("email, full_name").eq("user_id", order.user_id).maybeSingle();
      const email = profile?.email;
      if (!email) {
        if (composeWindow && !composeWindow.closed) composeWindow.close();
        toast.error("Customer email not found — cannot send notification");
        return;
      }
      const deliveryAddr = order.delivery_address as any;
      const customerName = deliveryAddr?.name || profile?.full_name || "Customer";
      const shortId = order.id.slice(0, 8).toUpperCase();
      const statusLabel = STATUS_LABELS[newStatus] || newStatus;
      const itemsList = Array.isArray(order.items) ? (order.items as any[]).map((i: any) => `• ${i.name || "Item"} (${i.weight || ""}) x${i.quantity || 1}`).join("\n") : "";

      const subject = `Order #${shortId} — ${statusLabel}`;
      const body = `Hi ${customerName},\n\nYour order #${shortId} status has been updated to: ${statusLabel}.\n\n${itemsList ? `Order Items:\n${itemsList}\n\n` : ""}Total: ₹${Number(order.total).toLocaleString()}\n\nThank you for ordering with us!`;
      const gmailUrl = `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      if (composeWindow && !composeWindow.closed) {
        composeWindow.location.href = gmailUrl;
        toast.success("Gmail compose opened!");
        return;
      }

      await navigator.clipboard.writeText(gmailUrl);
      toast.success("Gmail link copied — paste it in a new tab to open compose");
    } catch (e) {
      if (composeWindow && !composeWindow.closed) composeWindow.close();
      console.error("Notification failed:", e);
      toast.error("Could not open Gmail in preview. Please use the published site.");
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    const order = orders.find(o => o.id === orderId);
    // Guard: don't allow changes on finalized orders
    if (order && (order.status === "delivered" || order.status === "cancelled")) {
      toast.error(`Cannot change status — order is already ${order.status}`);
      return;
    }
    const shouldNotify = notificationSettings[newStatus] ?? true;
    const composeWindow = order && shouldNotify ? window.open("about:blank", "_blank") : null;

    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    if (error) {
      if (composeWindow && !composeWindow.closed) composeWindow.close();
      toast.error("Failed to update status");
    }
    else {
      toast.success(`Order updated to "${STATUS_CONFIG[newStatus]?.label || newStatus}"`);
      if (order && shouldNotify) sendNotification(order, newStatus, composeWindow);
      loadOrders();
    }
  };

  const bulkUpdateStatus = async (newStatus: string) => {
    if (selectedOrders.size === 0) return;
    const ids = Array.from(selectedOrders);
    // Filter out finalized orders
    const actionableIds = ids.filter(id => {
      const order = orders.find(o => o.id === id);
      return order && order.status !== "delivered" && order.status !== "cancelled";
    });
    if (actionableIds.length === 0) {
      toast.error("No actionable orders selected");
      return;
    }
    for (const id of actionableIds) await supabase.from("orders").update({ status: newStatus }).eq("id", id);
    toast.success(`${actionableIds.length} order${actionableIds.length > 1 ? "s" : ""} updated to "${STATUS_CONFIG[newStatus]?.label || newStatus}"`);
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
      // When searching, show all orders; otherwise default to today only unless "All Orders" is toggled
      const matchToday = search ? true : showAllOrders ? true : isToday(orderDate);
      return matchSearch && matchStatus && matchDateFrom && matchDateTo && matchToday;
    });
  }, [orders, search, statusFilter, dateFrom, dateTo, showAllOrders]);

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter, dateFrom, dateTo]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Only select orders that can still be acted upon (exclude delivered/cancelled)
  const selectableOnPage = paginated.filter(o => o.status !== "delivered" && o.status !== "cancelled");
  const toggleSelectAll = () => {
    if (selectedOrders.size === selectableOnPage.length && selectableOnPage.length > 0) setSelectedOrders(new Set());
    else setSelectedOrders(new Set(selectableOnPage.map(o => o.id)));
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
    // Block changes on finalized orders
    if (order && (order.status === "delivered" || order.status === "cancelled")) {
      toast.error(`Cannot change status — order is already ${order.status}`);
      return;
    }
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

  // Get previous status for undo
  const getPrevStatus = (currentStatus: string): string | null => {
    const idx = STATUS_STEP_ORDER.indexOf(currentStatus);
    if (idx <= 0) return null;
    return STATUS_STEP_ORDER[idx - 1];
  };

  const [undoConfirm, setUndoConfirm] = useState<{ open: boolean; orderId: string; prevStatus: string }>({ open: false, orderId: "", prevStatus: "" });

  // Stats derived from the currently filtered order set
  const orderStats = useMemo(() => {
    const revenue = filtered.filter(o => o.status !== "cancelled").reduce((s, o) => s + (o.total || 0), 0);
    const pending = filtered.filter(o => ["placed", "confirmed"].includes(o.status));
    const delivered = filtered.filter(o => o.status === "delivered");
    return { totalCount: filtered.length, revenue, pendingCount: pending.length, deliveredCount: delivered.length };
  }, [filtered]);

  const statsLabel = showAllOrders ? "All" : (dateFrom || dateTo) ? "Filtered" : "Today's";

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
            <span className="text-xs text-muted-foreground">{statsLabel} Orders</span>
          </div>
          <p className="text-2xl font-bold">{orderStats.totalCount}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-sm">💰</div>
            <span className="text-xs text-muted-foreground">{statsLabel} Revenue</span>
          </div>
          <p className="text-2xl font-bold">₹{orderStats.revenue.toLocaleString()}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center"><Timer className="w-4 h-4 text-amber-600" /></div>
            <span className="text-xs text-muted-foreground">Needs Action</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{orderStats.pendingCount}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-sm">✅</div>
            <span className="text-xs text-muted-foreground">Delivered</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{orderStats.deliveredCount}</p>
        </div>
      </div>

      {/* Today / All Orders Toggle */}
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant={showAllOrders ? "outline" : "default"}
          size="sm"
          className="text-xs rounded-xl"
          onClick={() => setShowAllOrders(false)}
        >
          📅 Today's Orders
        </Button>
        <Button
          variant={showAllOrders ? "default" : "outline"}
          size="sm"
          className="text-xs rounded-xl"
          onClick={() => setShowAllOrders(true)}
        >
          📋 All Orders
        </Button>
      </div>

      {/* Status Filter Pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setStatusFilter("")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${!statusFilter ? "bg-foreground text-background shadow-md" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
          All Statuses ({filtered.length})
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
            {statusOptions.filter(s => s !== "delivered" && s !== "cancelled").map(s => (
              <button key={s} onClick={() => setBulkConfirm({ open: true, status: s })}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all hover:shadow-sm ${STATUS_CONFIG[s].bgColor} ${STATUS_CONFIG[s].color}`}>
                {STATUS_CONFIG[s].emoji} {STATUS_CONFIG[s].label}
              </button>
            ))}
            <button key="cancelled" onClick={() => setBulkConfirm({ open: true, status: "cancelled" })}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all hover:shadow-sm ${STATUS_CONFIG["cancelled"].bgColor} ${STATUS_CONFIG["cancelled"].color}`}>
              {STATUS_CONFIG["cancelled"].emoji} Cancel
            </button>
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
          {selectableOnPage.length > 0 && (
            <div className="flex items-center gap-2 px-2">
              <input type="checkbox" checked={selectedOrders.size === selectableOnPage.length && selectableOnPage.length > 0} onChange={toggleSelectAll} className="rounded" />
              <span className="text-xs text-muted-foreground">Select all actionable ({selectableOnPage.length})</span>
            </div>
          )}

          {paginated.map((order) => {
            const addr = order.delivery_address as any;
            const isExpanded = expandedOrder === order.id;
            const notes = orderNotes[order.id] || [];
            const statusCfg = STATUS_CONFIG[order.status] || { label: order.status, color: "text-muted-foreground", bgColor: "bg-secondary border-border", emoji: "📦", icon: "📦" };
            const orderDate = new Date(order.created_at);
            const nextStatus = getNextStatus(order.status);
            const itemCount = Array.isArray(order.items) ? (order.items as any[]).reduce((s, i) => s + (i.quantity || 1), 0) : 0;
            const isFinal = order.status === "delivered" || order.status === "cancelled";
            const currentStepIdx = STATUS_STEP_ORDER.indexOf(order.status);

            return (
              <div key={order.id} className={`bg-card rounded-2xl overflow-hidden border transition-all ${isFinal ? "opacity-70" : "hover:shadow-md"} ${order.status === "cancelled" ? "border-red-200" : "border-border"}`}>
                <div className="p-3 md:p-4">
                  {/* Row 1: Checkbox + ID + Status + Time */}
                  <div className="flex items-center gap-2 mb-2">
                    {!isFinal && (
                      <input type="checkbox" checked={selectedOrders.has(order.id)} onChange={() => toggleSelect(order.id)} className="rounded shrink-0" />
                    )}
                    <button onClick={() => copyOrderId(order.id)} className="flex items-center gap-1 text-xs font-bold font-mono hover:text-primary transition-colors" title="Copy ID">
                      #{order.id.slice(0, 8).toUpperCase()}
                      <Copy className="w-2.5 h-2.5 opacity-40" />
                    </button>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${statusCfg.bgColor} ${statusCfg.color}`}>
                      {statusCfg.emoji} {statusCfg.label}
                    </span>
                    {isFinal && <span className="text-[10px] text-muted-foreground ml-auto">🔒 Final</span>}
                    <span className="text-[10px] text-muted-foreground ml-auto" title={format(orderDate, "dd MMM yyyy, hh:mm a")}>
                      {getTimeAgo(orderDate)}
                    </span>
                  </div>

                  {/* Progress bar — only for active orders */}
                  {!isFinal && order.status !== "cancelled" && (
                    <div className="flex items-center gap-0.5 mb-2">
                      {STATUS_STEP_ORDER.map((step, idx) => (
                        <div key={step} className={`h-1 flex-1 rounded-full ${idx <= currentStepIdx ? "bg-primary" : "bg-border"}`} />
                      ))}
                    </div>
                  )}

                  {/* Row 2: Customer name + phone + total */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                        {(addr?.name || "?")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate leading-tight">{addr?.name || "Unknown"}</p>
                        <p className="text-[10px] text-muted-foreground">{addr?.phone || "—"}</p>
                      </div>
                    </div>
                    <span className="text-base font-bold shrink-0">₹{order.total?.toLocaleString()}</span>
                  </div>

                  {/* Row 3: Items summary (1 line) */}
                  <p className="text-[11px] text-muted-foreground truncate mb-2">
                    {itemCount} item{itemCount !== 1 ? "s" : ""}: {(order.items as any[])?.slice(0, 2).map((i: any) => i.name).join(", ")}
                    {(order.items as any[])?.length > 2 ? ` +${(order.items as any[]).length - 2} more` : ""}
                  </p>

                  {/* Row 4: Delivery slot (if urgent) + Actions */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {parseDeliveryInfo(order.delivery_slot).isUrgent && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-destructive/10 text-destructive font-semibold border border-destructive/20 animate-pulse">
                          🔴 URGENT
                        </span>
                      )}
                      {order.discount > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 font-medium">
                          -₹{order.discount}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Actions only for non-final orders */}
                      {!isFinal && (
                        <>
                          {getPrevStatus(order.status) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-[10px] h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-amber-700"
                              onClick={() => setUndoConfirm({ open: true, orderId: order.id, prevStatus: getPrevStatus(order.status)! })}
                              title={`Undo to ${STATUS_CONFIG[getPrevStatus(order.status)!]?.label}`}
                            >
                              <Undo2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {nextStatus && (
                            <Button
                              size="sm"
                              className="text-[10px] h-7 gap-1 rounded-lg px-2"
                              onClick={() => handleStatusChange(order.id, nextStatus)}
                            >
                              {STATUS_CONFIG[nextStatus].emoji} {STATUS_CONFIG[nextStatus].label}
                            </Button>
                          )}
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-lg">
                                <ChevronDown className="w-3 h-3" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-44 p-1" align="end">
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-2 py-1">Change Status</p>
                              {statusOptions.map(s => (
                                <button
                                  key={s}
                                  onClick={() => handleStatusChange(order.id, s)}
                                  disabled={order.status === s}
                                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${order.status === s ? "opacity-40 cursor-not-allowed" : "hover:bg-secondary"}`}
                                >
                                  <span>{STATUS_CONFIG[s].emoji}</span>
                                  <span>{STATUS_CONFIG[s].label}</span>
                                  {order.status === s && <CheckCircle2 className="w-3 h-3 ml-auto text-primary" />}
                                </button>
                              ))}
                            </PopoverContent>
                          </Popover>
                        </>
                      )}

                      {/* Expand for details/notes */}
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => toggleExpand(order.id)}>
                        {notes.length > 0 && <span className="absolute -top-1 -right-1 text-[8px] bg-primary text-primary-foreground w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">{notes.length}</span>}
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </Button>
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
                          <span>Last updated {getRelativeDate(new Date(order.updated_at))}</span>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    <div className="px-5 py-4 border-t border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Notes</p>
                      </div>

                      {/* Note type toggle */}
                      <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-fit">
                        <button
                          onClick={() => setNewNoteType("internal")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${newNoteType === "internal" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        >
                          🔒 Internal
                        </button>
                        <button
                          onClick={() => setNewNoteType("customer")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${newNoteType === "customer" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                        >
                          👤 Customer Visible
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <Textarea
                          placeholder={newNoteType === "customer" ? "Write a note visible to the customer..." : "Add an internal note (admin only)..."}
                          value={newNote} onChange={(e) => setNewNote(e.target.value)} rows={2}
                          className={`text-sm rounded-xl ${newNoteType === "customer" ? "border-primary/40 focus-visible:ring-primary/30" : ""}`}
                        />
                        <Button size="icon" className="shrink-0 self-end rounded-xl" onClick={() => addNote(order.id)} disabled={!newNote.trim()}>
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>

                      {newNoteType === "customer" && (
                        <p className="text-[10px] text-primary flex items-center gap-1">
                          ⚠️ This note will be visible to the customer on their dashboard
                        </p>
                      )}

                      {notes.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic text-center py-2">No notes yet</p>
                      ) : (
                        <div className="space-y-2">
                          {notes.map((n: any) => (
                            <div key={n.id} className={`rounded-xl p-3 ${n.note_type === "customer" ? "bg-primary/5 border border-primary/20" : "bg-muted/30"}`}>
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider">
                                      {n.note_type === "customer" ? (
                                        <span className="text-primary">👤 Customer Visible</span>
                                      ) : (
                                        <span className="text-muted-foreground">🔒 Internal</span>
                                      )}
                                    </span>
                                  </div>
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
                {search || statusFilter || hasDateFilter ? "Try adjusting your filters." : !showAllOrders ? "No orders today. Tap \"All Orders\" to see past orders." : "Orders will appear here when customers place them."}
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
      <ConfirmDialog
        open={undoConfirm.open}
        onOpenChange={(open) => setUndoConfirm(prev => ({ ...prev, open }))}
        title="Undo Status Change"
        description={`Are you sure you want to move this order back to "${STATUS_CONFIG[undoConfirm.prevStatus]?.label || undoConfirm.prevStatus}"? The customer will be notified if email notifications are enabled.`}
        confirmLabel={`Revert to ${STATUS_CONFIG[undoConfirm.prevStatus]?.label || undoConfirm.prevStatus}`}
        variant="default"
        onConfirm={() => { updateStatus(undoConfirm.orderId, undoConfirm.prevStatus); setUndoConfirm({ open: false, orderId: "", prevStatus: "" }); }}
      />
    </div>
  );
}
