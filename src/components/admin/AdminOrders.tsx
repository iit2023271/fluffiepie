import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Search, MessageSquare, Send, Download, DollarSign, X, ChevronDown, ChevronUp, Printer, Trash2 } from "lucide-react";
import Pagination from "@/components/Pagination";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const ITEMS_PER_PAGE = 10;
const statusOptions = ["placed", "confirmed", "baking", "out_for_delivery", "delivered", "cancelled"];
const statusColors: Record<string, string> = {
  placed: "bg-accent/10 text-accent",
  confirmed: "bg-primary/10 text-primary",
  baking: "bg-accent/10 text-accent",
  out_for_delivery: "bg-primary/10 text-primary",
  delivered: "bg-primary/10 text-primary",
  cancelled: "bg-destructive/10 text-destructive",
};

export default function AdminOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [orderNotes, setOrderNotes] = useState<Record<string, any[]>>({});
  const [newNote, setNewNote] = useState("");
  const [noteOrderId, setNoteOrderId] = useState<string | null>(null);
  const [refundDialog, setRefundDialog] = useState<any | null>(null);
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundReason, setRefundReason] = useState("");

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
      order_id: orderId,
      admin_user_id: user.id,
      note: newNote.trim(),
      note_type: "general",
    });
    if (error) toast.error("Failed to add note");
    else {
      toast.success("Note added");
      setNewNote("");
      loadNotes(orderId);
    }
  };

  const sendNotification = async (order: any, newStatus: string) => {
    try {
      const deliveryAddr = order.delivery_address as any;
      const customerName = deliveryAddr?.name || "Customer";
      await supabase.functions.invoke("send-order-notification", {
        body: { orderId: order.id, newStatus, customerName, orderTotal: order.total, items: order.items, userId: order.user_id },
      });
    } catch (e) {
      console.error("Notification failed:", e);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    const order = orders.find(o => o.id === orderId);
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    if (error) toast.error("Failed to update status");
    else {
      toast.success(`Order → ${newStatus.replace(/_/g, " ")}`);
      if (order) sendNotification(order, newStatus);
      loadOrders();
    }
  };

  const bulkUpdateStatus = async (newStatus: string) => {
    if (selectedOrders.size === 0) return;
    const ids = Array.from(selectedOrders);
    for (const id of ids) {
      await supabase.from("orders").update({ status: newStatus }).eq("id", id);
    }
    toast.success(`${ids.length} orders updated to ${newStatus.replace(/_/g, " ")}`);
    setSelectedOrders(new Set());
    loadOrders();
  };

  const processRefund = async () => {
    if (!refundDialog || refundAmount <= 0) return;
    const { error } = await supabase.from("orders").update({
      refund_amount: refundAmount,
      refund_reason: refundReason,
      refund_status: "processed",
    }).eq("id", refundDialog.id);
    if (error) toast.error("Failed to process refund");
    else {
      toast.success("Refund processed");
      setRefundDialog(null);
      setRefundAmount(0);
      setRefundReason("");
      loadOrders();
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedOrders(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === paginated.length) setSelectedOrders(new Set());
    else setSelectedOrders(new Set(paginated.map(o => o.id)));
  };

  const toggleExpand = (id: string) => {
    if (expandedOrder === id) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(id);
      if (!orderNotes[id]) loadNotes(id);
    }
  };

  const exportCSV = () => {
    const source = filtered;
    const rows = [["Order ID", "Date", "Status", "Customer", "City", "Items", "Total", "Discount", "Refund", "Coupon"]];
    source.forEach(o => {
      const addr = o.delivery_address as any;
      const items = Array.isArray(o.items) ? o.items.map((i: any) => `${i.name} x${i.quantity}`).join("; ") : "";
      rows.push([o.id.slice(0, 8).toUpperCase(), format(new Date(o.created_at), "yyyy-MM-dd HH:mm"), o.status, addr?.name || "", addr?.city || "", items, String(o.total), String(o.discount || 0), String(o.refund_amount || 0), o.coupon_code || ""]);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `orders-${format(new Date(), "yyyy-MM-dd")}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported!");
  };

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const addr = o.delivery_address as any;
      const matchSearch = !search || o.id.toLowerCase().includes(search.toLowerCase()) ||
        (addr?.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (addr?.phone || "").includes(search);
      const matchStatus = !statusFilter || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter]);

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Orders</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} orders</p>
        </div>
        <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={exportCSV}>
          <Download className="w-3.5 h-3.5" /> Export CSV
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input placeholder="Search by ID, name, phone..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary bg-background" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-border text-sm bg-background">
          <option value="">All Statuses</option>
          {statusOptions.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      {/* Bulk actions */}
      {selectedOrders.size > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium">{selectedOrders.size} selected</span>
          <span className="text-xs text-muted-foreground">Bulk update:</span>
          {statusOptions.map(s => (
            <button key={s} onClick={() => bulkUpdateStatus(s)} className="px-2.5 py-1 rounded-lg text-xs bg-secondary hover:bg-primary/10 capitalize">
              {s.replace(/_/g, " ")}
            </button>
          ))}
          <button onClick={() => setSelectedOrders(new Set())} className="text-xs text-muted-foreground hover:text-foreground ml-auto">Clear</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-secondary rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          {/* Select all */}
          <div className="flex items-center gap-2 px-2">
            <input type="checkbox" checked={selectedOrders.size === paginated.length && paginated.length > 0}
              onChange={toggleSelectAll} className="rounded" />
            <span className="text-xs text-muted-foreground">Select all</span>
          </div>

          {paginated.map((order) => {
            const addr = order.delivery_address as any;
            const isExpanded = expandedOrder === order.id;
            const notes = orderNotes[order.id] || [];

            return (
              <div key={order.id} className="bg-card rounded-2xl shadow-soft overflow-hidden border border-border">
                <div className="flex items-start gap-3 p-4">
                  <input type="checkbox" checked={selectedOrders.has(order.id)} onChange={() => toggleSelect(order.id)} className="rounded mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-sm font-semibold">#{order.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(order.created_at), "dd MMM yyyy, hh:mm a")}</p>
                        {addr && <p className="text-xs text-muted-foreground mt-0.5">👤 {addr.name} · 📍 {addr.city} · 📞 {addr.phone}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border-0 ${statusColors[order.status] || "bg-secondary"}`}>
                          {statusOptions.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                        </select>
                        {order.refund_status && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-destructive/10 text-destructive">Refunded</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1 mb-2">
                      {(order.items as any[])?.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{item.name} ({item.weight}) × {item.quantity}</span>
                          <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm">₹{order.total?.toLocaleString()}</span>
                        {order.discount > 0 && <span className="text-xs text-muted-foreground">-₹{order.discount} disc.</span>}
                        {order.coupon_code && <span className="text-xs px-1.5 py-0.5 rounded bg-accent/10 text-accent font-mono">{order.coupon_code}</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => { setRefundDialog(order); setRefundAmount(order.total); }}>
                          <DollarSign className="w-3 h-3" /> Refund
                        </Button>
                        <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => toggleExpand(order.id)}>
                          <MessageSquare className="w-3 h-3" /> Notes
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded: Notes */}
                {isExpanded && (
                  <div className="border-t border-border p-4 bg-muted/30 space-y-3">
                    <div className="flex gap-2">
                      <Textarea placeholder="Add a note..." value={newNote} onChange={(e) => setNewNote(e.target.value)} rows={2} className="text-sm" />
                      <Button size="icon" className="shrink-0 self-end" onClick={() => addNote(order.id)} disabled={!newNote.trim()}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                    {notes.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No notes yet</p>
                    ) : (
                      <div className="space-y-2">
                        {notes.map((n: any) => (
                          <div key={n.id} className="bg-card rounded-lg p-3 border border-border">
                            <p className="text-sm">{n.note}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(n.created_at), "dd MMM, hh:mm a")}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">No orders found.</div>}
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filtered.length} itemsPerPage={ITEMS_PER_PAGE} />
        </div>
      )}

      {/* Refund Dialog */}
      <Dialog open={!!refundDialog} onOpenChange={(open) => !open && setRefundDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
          </DialogHeader>
          {refundDialog && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Order #{refundDialog.id.slice(0, 8).toUpperCase()} · Total ₹{refundDialog.total}</p>
              <div>
                <label className="text-xs font-medium mb-1 block">Refund Amount (₹)</label>
                <input type="number" value={refundAmount} onChange={(e) => setRefundAmount(parseInt(e.target.value) || 0)} max={refundDialog.total}
                  className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary bg-background" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Reason</label>
                <Textarea placeholder="Reason for refund..." value={refundReason} onChange={(e) => setRefundReason(e.target.value)} rows={2} />
              </div>
              <div className="flex gap-2">
                <Button onClick={processRefund} className="flex-1" disabled={refundAmount <= 0}>Process Refund</Button>
                <Button variant="outline" onClick={() => setRefundDialog(null)}>Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
