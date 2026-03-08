import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Search } from "lucide-react";
import Pagination from "@/components/Pagination";

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
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setOrders(data);
    setLoading(false);
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    if (error) toast.error("Failed to update status");
    else { toast.success(`Order updated to ${newStatus}`); loadOrders(); }
  };

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch = o.id.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !statusFilter || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter]);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-6">Orders</h1>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input placeholder="Search by order ID..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-border text-sm bg-background">
          <option value="">All Statuses</option>
          {statusOptions.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-20 bg-secondary rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {paginated.map((order) => (
            <div key={order.id} className="bg-card rounded-2xl p-5 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-semibold">#{order.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(order.created_at), "dd MMM yyyy, hh:mm a")}
                  </p>
                  {order.delivery_slot && (
                    <p className="text-xs text-muted-foreground mt-0.5">🚚 {order.delivery_slot}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border-0 ${statusColors[order.status] || "bg-secondary"}`}
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1 mb-3">
                {(order.items as any[])?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.name} ({item.weight}) × {item.quantity}</span>
                    <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border text-sm">
                <div className="text-xs text-muted-foreground">
                  {order.delivery_address && typeof order.delivery_address === "object" && (
                    <span>📍 {(order.delivery_address as any).city}, {(order.delivery_address as any).pincode}</span>
                  )}
                </div>
                <div className="font-bold">₹{order.total?.toLocaleString()}</div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">No orders found.</div>
          )}
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filtered.length} itemsPerPage={ITEMS_PER_PAGE} />
        </div>
      )}
    </div>
  );
}
