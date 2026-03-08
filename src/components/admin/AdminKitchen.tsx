import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfDay, endOfDay, addDays, isToday, isTomorrow, isYesterday } from "date-fns";
import { ChefHat, Calendar as CalendarIcon, Printer, CheckCircle2, Circle, Clock, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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
  orders: { orderId: string; quantity: number; customerName: string; deliverySlot: string | null; status: string; orderDate: string }[];
}

const STATUS_EMOJI: Record<string, string> = {
  placed: "📦", confirmed: "✅", baking: "🧁", out_for_delivery: "🚚", delivered: "✔️", cancelled: "❌",
};

/**
 * Resolves delivery slot string into an actual Date.
 * Supports new format "dd MMM yyyy, time" and legacy "Today/Tomorrow" format.
 */
function resolveDeliveryDate(deliverySlot: string | null, orderCreatedAt: string): Date {
  if (!deliverySlot) return new Date(orderCreatedAt);
  const lower = deliverySlot.toLowerCase();

  // Legacy format: "Today, ..." or "Tomorrow, ..."
  if (lower.startsWith("tomorrow")) return addDays(startOfDay(new Date(orderCreatedAt)), 1);
  if (lower.startsWith("today") || lower.startsWith("day after")) return startOfDay(new Date(orderCreatedAt));

  // New format: "dd MMM yyyy, time" — try to parse the date part
  try {
    const datePart = deliverySlot.split(",")[0].trim();
    const parsed = parse(datePart, "dd MMM yyyy", new Date());
    if (!isNaN(parsed.getTime())) return startOfDay(parsed);
  } catch {}

  return startOfDay(new Date(orderCreatedAt));
}

export default function AdminKitchen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  // Load a wide range of orders and filter client-side by resolved delivery date
  useEffect(() => {
    loadOrders();
  }, [selectedDate]);

  const loadOrders = async () => {
    setLoading(true);
    // Fetch orders from 2 days before to 2 days after to cover "Today/Tomorrow" slots
    const rangeStart = addDays(startOfDay(selectedDate), -2).toISOString();
    const rangeEnd = endOfDay(addDays(selectedDate, 1)).toISOString();

    const { data } = await supabase
      .from("orders")
      .select("*")
      .gte("created_at", rangeStart)
      .lte("created_at", rangeEnd)
      .neq("status", "cancelled")
      .order("created_at", { ascending: true });

    if (data) setOrders(data);
    setLoading(false);
  };

  // Filter orders whose resolved delivery date matches selectedDate
  const deliveryOrders = useMemo(() => {
    const target = format(selectedDate, "yyyy-MM-dd");
    return orders.filter((order) => {
      const resolved = resolveDeliveryDate(order.delivery_slot, order.created_at);
      return format(resolved, "yyyy-MM-dd") === target;
    });
  }, [orders, selectedDate]);

  const aggregated = useMemo(() => {
    const map = new Map<string, AggregatedItem>();

    deliveryOrders.forEach((order) => {
      const items = order.items as OrderItem[];
      const addr = order.delivery_address as any;
      const customerName = addr?.name || "Unknown";

      if (!Array.isArray(items)) return;

      items.forEach((item) => {
        const key = `${item.name}___${item.weight}`;
        if (!map.has(key)) {
          map.set(key, { name: item.name, weight: item.weight, totalQuantity: 0, orders: [] });
        }
        const entry = map.get(key)!;
        entry.totalQuantity += item.quantity;
        entry.orders.push({
          orderId: order.id,
          quantity: item.quantity,
          customerName,
          deliverySlot: order.delivery_slot,
          status: order.status,
          orderDate: order.created_at,
        });
      });
    });

    return Array.from(map.values()).sort((a, b) => b.totalQuantity - a.totalQuantity);
  }, [deliveryOrders]);

  const toggleCheck = (key: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const dateLabel = useMemo(() => {
    if (isToday(selectedDate)) return "Today";
    if (isTomorrow(selectedDate)) return "Tomorrow";
    if (isYesterday(selectedDate)) return "Yesterday";
    return format(selectedDate, "EEEE, dd MMM");
  }, [selectedDate]);

  const totalItems = aggregated.reduce((sum, item) => sum + item.totalQuantity, 0);
  const checkedCount = aggregated.filter((item) => checkedItems.has(`${item.name}___${item.weight}`)).length;
  const progress = aggregated.length > 0 ? Math.round((checkedCount / aggregated.length) * 100) : 0;

  const goToDate = (offset: number) => {
    setSelectedDate((d) => addDays(d, offset));
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
            Items to prepare for <span className="font-semibold text-foreground">{dateLabel}'s deliveries</span>
          </p>
        </div>
        <Button variant="outline" size="sm" className="text-xs gap-1.5 print:hidden" onClick={() => window.print()}>
          <Printer className="w-3.5 h-3.5" /> Print Sheet
        </Button>
      </div>

      {/* Date Navigation */}
      <div className="flex flex-wrap items-center gap-3 mb-6 print:hidden">
        <Button variant="outline" size="sm" onClick={() => goToDate(-1)} className="text-xs">
          ← Previous
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 text-sm font-medium">
              <CalendarIcon className="w-4 h-4" />
              {format(selectedDate, "dd MMM yyyy")}
              <span className="text-xs text-primary font-semibold">({dateLabel})</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => { if (d) { setSelectedDate(d); setCheckedItems(new Set()); } }}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        <Button variant="outline" size="sm" onClick={() => goToDate(1)} className="text-xs">
          Next →
        </Button>

        {!isToday(selectedDate) && (
          <Button variant="ghost" size="sm" className="text-xs"
            onClick={() => { setSelectedDate(new Date()); setCheckedItems(new Set()); }}>
            Go to Today
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">🚚 Deliveries</p>
          <p className="text-2xl font-bold">{deliveryOrders.length}</p>
          <p className="text-[10px] text-muted-foreground">orders to deliver</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">🧁 Items to Prepare</p>
          <p className="text-2xl font-bold">{totalItems}</p>
          <p className="text-[10px] text-muted-foreground">total pieces</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">📋 Unique Items</p>
          <p className="text-2xl font-bold">{aggregated.length}</p>
          <p className="text-[10px] text-muted-foreground">different cakes</p>
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
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-secondary rounded-xl animate-pulse" />)}
        </div>
      ) : aggregated.length === 0 ? (
        <div className="py-16 text-center">
          <ChefHat className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-lg font-semibold mb-1">No items to prepare</p>
          <p className="text-sm text-muted-foreground">
            No deliveries scheduled for {dateLabel.toLowerCase()}. Enjoy the break! ☕
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Column headers */}
          <div className="hidden md:grid grid-cols-12 gap-3 px-4 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            <div className="col-span-1">Done</div>
            <div className="col-span-3">Item</div>
            <div className="col-span-2">Size</div>
            <div className="col-span-1 text-center">Qty</div>
            <div className="col-span-5">Order Details</div>
          </div>

          {aggregated.map((item) => {
            const key = `${item.name}___${item.weight}`;
            const isChecked = checkedItems.has(key);

            return (
              <div key={key} className={`bg-card rounded-2xl border transition-all ${isChecked ? "border-primary/30 bg-primary/5 opacity-70" : "border-border"}`}>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 items-center">
                  <div className="col-span-1 print:hidden">
                    <button onClick={() => toggleCheck(key)} title={isChecked ? "Mark undone" : "Mark done"}>
                      {isChecked ? <CheckCircle2 className="w-6 h-6 text-primary" /> : <Circle className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors" />}
                    </button>
                  </div>

                  <div className="col-span-3">
                    <p className={`font-semibold text-sm ${isChecked ? "line-through text-muted-foreground" : ""}`}>
                      🎂 {item.name}
                    </p>
                  </div>

                  <div className="col-span-2">
                    <span className="px-3 py-1 rounded-full bg-secondary text-xs font-medium">{item.weight}</span>
                  </div>

                  <div className="col-span-1 text-center">
                    <span className="text-xl font-bold text-primary">{item.totalQuantity}</span>
                  </div>

                  <div className="col-span-5">
                    <div className="space-y-1.5">
                      {item.orders.map((o, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs bg-secondary/50 rounded-lg px-2.5 py-1.5">
                          <span>{STATUS_EMOJI[o.status] || "📦"}</span>
                          <span className="font-medium truncate">{o.customerName}</span>
                          <span className="text-muted-foreground">×{o.quantity}</span>
                          {o.deliverySlot && (
                            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground ml-auto">
                              <Truck className="w-3 h-3" />
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
    </div>
  );
}
