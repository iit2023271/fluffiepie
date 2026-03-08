import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfDay, endOfDay, addDays, subDays, isToday, isTomorrow, isYesterday } from "date-fns";
import { ChefHat, Calendar, Printer, CheckCircle2, Circle, Clock, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrderItem {
  name: string;
  weight: string;
  quantity: number;
  price: number;
  productId?: string;
}

interface AggregatedItem {
  name: string;
  weight: string;
  totalQuantity: number;
  orders: { orderId: string; quantity: number; customerName: string; deliverySlot: string | null; status: string }[];
}

const STATUS_EMOJI: Record<string, string> = {
  placed: "📦", confirmed: "✅", baking: "🧁", out_for_delivery: "🚚", delivered: "✔️", cancelled: "❌",
};

export default function AdminKitchen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadOrders();
  }, [selectedDate]);

  const loadOrders = async () => {
    setLoading(true);
    const dateStart = startOfDay(new Date(selectedDate)).toISOString();
    const dateEnd = endOfDay(new Date(selectedDate)).toISOString();

    const { data } = await supabase
      .from("orders")
      .select("*")
      .gte("created_at", dateStart)
      .lte("created_at", dateEnd)
      .neq("status", "cancelled")
      .order("created_at", { ascending: true });

    if (data) setOrders(data);
    setLoading(false);
  };

  const aggregated = useMemo(() => {
    const map = new Map<string, AggregatedItem>();

    orders.forEach((order) => {
      const items = order.items as OrderItem[];
      const addr = order.delivery_address as any;
      const customerName = addr?.name || "Unknown";

      if (!Array.isArray(items)) return;

      items.forEach((item) => {
        const key = `${item.name}___${item.weight}`;
        if (!map.has(key)) {
          map.set(key, {
            name: item.name,
            weight: item.weight,
            totalQuantity: 0,
            orders: [],
          });
        }
        const entry = map.get(key)!;
        entry.totalQuantity += item.quantity;
        entry.orders.push({
          orderId: order.id,
          quantity: item.quantity,
          customerName,
          deliverySlot: order.delivery_slot,
          status: order.status,
        });
      });
    });

    return Array.from(map.values()).sort((a, b) => b.totalQuantity - a.totalQuantity);
  }, [orders]);

  const toggleCheck = (key: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const dateLabel = useMemo(() => {
    const d = new Date(selectedDate);
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    if (isYesterday(d)) return "Yesterday";
    return format(d, "EEEE, dd MMM");
  }, [selectedDate]);

  const totalItems = aggregated.reduce((sum, item) => sum + item.totalQuantity, 0);
  const checkedCount = aggregated.filter((item) => checkedItems.has(`${item.name}___${item.weight}`)).length;
  const progress = aggregated.length > 0 ? Math.round((checkedCount / aggregated.length) * 100) : 0;

  const handlePrint = () => {
    window.print();
  };

  const goToDate = (offset: number) => {
    setSelectedDate(format(addDays(new Date(selectedDate), offset), "yyyy-MM-dd"));
    setCheckedItems(new Set());
  };

  return (
    <div className="print:p-0">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 print:mb-4">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <ChefHat className="w-6 h-6" /> Kitchen Prep Sheet
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Daily production list — everything the kitchen needs to prepare
          </p>
        </div>
        <Button variant="outline" size="sm" className="text-xs gap-1.5 print:hidden" onClick={handlePrint}>
          <Printer className="w-3.5 h-3.5" /> Print Sheet
        </Button>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center gap-3 mb-6 print:hidden">
        <Button variant="outline" size="sm" onClick={() => goToDate(-1)} className="text-xs">
          ← Previous Day
        </Button>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => { setSelectedDate(e.target.value); setCheckedItems(new Set()); }}
            className="bg-transparent text-sm font-medium focus:outline-none"
          />
          <span className="text-sm font-semibold text-primary">{dateLabel}</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => goToDate(1)} className="text-xs">
          Next Day →
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs print:hidden"
          onClick={() => { setSelectedDate(format(new Date(), "yyyy-MM-dd")); setCheckedItems(new Set()); }}
        >
          Go to Today
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">📦 Total Orders</p>
          <p className="text-2xl font-bold">{orders.length}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">🧁 Items to Prepare</p>
          <p className="text-2xl font-bold">{totalItems}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">📋 Unique Items</p>
          <p className="text-2xl font-bold">{aggregated.length}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">✅ Prep Progress</p>
          <p className="text-2xl font-bold">{progress}%</p>
          <div className="w-full h-1.5 bg-secondary rounded-full mt-2">
            <div className="h-1.5 bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-secondary rounded-xl animate-pulse" />
          ))}
        </div>
      ) : aggregated.length === 0 ? (
        <div className="py-16 text-center">
          <ChefHat className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-lg font-semibold mb-1">No items to prepare</p>
          <p className="text-sm text-muted-foreground">
            There are no orders for {dateLabel.toLowerCase()}. Enjoy the break! ☕
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Column headers */}
          <div className="hidden md:grid grid-cols-12 gap-3 px-4 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            <div className="col-span-1">Done</div>
            <div className="col-span-4">Item</div>
            <div className="col-span-2">Size / Weight</div>
            <div className="col-span-2 text-center">Total Qty</div>
            <div className="col-span-3">Order Breakdown</div>
          </div>

          {aggregated.map((item) => {
            const key = `${item.name}___${item.weight}`;
            const isChecked = checkedItems.has(key);

            return (
              <div
                key={key}
                className={`bg-card rounded-2xl border transition-all ${
                  isChecked
                    ? "border-primary/30 bg-primary/5 opacity-75"
                    : "border-border"
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 items-center">
                  {/* Checkbox */}
                  <div className="col-span-1 print:hidden">
                    <button
                      onClick={() => toggleCheck(key)}
                      className="flex items-center justify-center"
                      title={isChecked ? "Mark as not done" : "Mark as done"}
                    >
                      {isChecked ? (
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                      ) : (
                        <Circle className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors" />
                      )}
                    </button>
                  </div>

                  {/* Item Name */}
                  <div className="col-span-4">
                    <p className={`font-semibold text-sm ${isChecked ? "line-through text-muted-foreground" : ""}`}>
                      🎂 {item.name}
                    </p>
                  </div>

                  {/* Weight */}
                  <div className="col-span-2">
                    <span className="px-3 py-1 rounded-full bg-secondary text-xs font-medium">
                      {item.weight}
                    </span>
                  </div>

                  {/* Quantity */}
                  <div className="col-span-2 text-center">
                    <span className="text-xl font-bold text-primary">{item.totalQuantity}</span>
                    <span className="text-xs text-muted-foreground ml-1">
                      {item.totalQuantity === 1 ? "piece" : "pieces"}
                    </span>
                  </div>

                  {/* Order breakdown */}
                  <div className="col-span-3">
                    <div className="space-y-1">
                      {item.orders.map((o, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{STATUS_EMOJI[o.status] || "📦"}</span>
                          <span className="truncate">{o.customerName}</span>
                          <span className="font-medium text-foreground">×{o.quantity}</span>
                          {o.deliverySlot && (
                            <span className="flex items-center gap-0.5 text-[10px]">
                              <Clock className="w-3 h-3" />
                              {o.deliverySlot}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:p-0, .print\\:p-0 * { visibility: visible; }
          .print\\:hidden { display: none !important; }
          .print\\:mb-4 { margin-bottom: 1rem; }
        }
      `}</style>
    </div>
  );
}
