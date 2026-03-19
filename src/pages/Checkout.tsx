import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Tag, MapPin, CalendarIcon, Clock, MessageCircle, QrCode, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { z } from "zod";
import { useStoreInfo } from "@/hooks/useStoreInfo";
import { motion, AnimatePresence } from "framer-motion";

const addressSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50),
  lastName: z.string().trim().max(50),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit phone number"),
  address: z.string().trim().min(5, "Address too short").max(200),
  city: z.string().trim().min(2, "City is required").max(50),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
});

const couponSchema = z.string().trim().min(1).max(20).regex(/^[A-Z0-9]+$/i, "Invalid coupon format");
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import SavedAddresses from "@/components/SavedAddresses";
import { useDeliveryConfig } from "@/hooks/useDeliveryConfig";

interface PaymentConfig {
  qrImageUrl: string;
  infoLines: { label: string; value: string }[];
  enabled: boolean;
}

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

export default function Checkout() {
  const { config: deliveryConfig } = useDeliveryConfig();
  const { storeInfo } = useStoreInfo();
  const { state, totalPrice, dispatch } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [addressMode, setAddressMode] = useState<"saved" | "new">(user ? "saved" : "new");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [form, setForm] = useState({
    firstName: "", lastName: "", phone: "", address: "", city: "", pincode: "",
  });
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(undefined);
  const [deliveryTime, setDeliveryTime] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);

  useEffect(() => {
    const loadPaymentConfig = async () => {
      const { data } = await supabase
        .from("store_config")
        .select("value")
        .eq("config_type", "payment_config")
        .eq("is_active", true)
        .maybeSingle();
      if (data?.value) {
        try {
          const parsed = JSON.parse(data.value);
          if (parsed.enabled) setPaymentConfig(parsed);
        } catch { /* ignore */ }
      }
    };
    loadPaymentConfig();
  }, []);

  const applyCoupon = async () => {
    const parsed = couponSchema.safeParse(coupon);
    if (!parsed.success) { toast.error("Enter a valid coupon code"); return; }
    const { data, error } = await supabase.from("coupons").select("*").eq("code", coupon.toUpperCase().trim()).eq("is_active", true).single();
    if (error || !data) { toast.error("Invalid coupon code"); return; }
    if (data.expires_at && new Date(data.expires_at) < new Date()) { toast.error("This coupon has expired"); return; }
    if (data.usage_limit && data.used_count >= data.usage_limit) { toast.error("This coupon has reached its usage limit"); return; }
    if (totalPrice < data.min_order_amount) { toast.error(`Minimum order amount is ₹${data.min_order_amount}`); return; }
    let disc = 0;
    if (data.discount_type === "percentage") { disc = Math.round(totalPrice * (data.discount_value / 100)); if (data.max_discount) disc = Math.min(disc, data.max_discount); } else { disc = data.discount_value; }
    setDiscount(disc);
    toast.success(`Coupon applied! You save ₹${disc}`);
  };

  const deliveryFee = totalPrice >= deliveryConfig.free_delivery_threshold ? 0 : deliveryConfig.delivery_fee;
  const finalTotal = totalPrice - discount + deliveryFee;

  const handlePlaceOrder = async () => {
    if (addressMode === "saved") { if (!selectedAddress) { toast.error("Please select a saved address"); return; } }
    else { const result = addressSchema.safeParse(form); if (!result.success) { toast.error(result.error.errors[0]?.message || "Invalid address fields"); return; } }
    if (!deliveryDate) { toast.error("Please select a delivery date"); return; }
    if (!deliveryTime) { toast.error("Please select a delivery time"); return; }
    if (paymentConfig && !transactionId.trim()) { toast.error("Please enter your Transaction ID"); return; }
    if (!user) { toast.error("Please sign in to place an order"); navigate("/login"); return; }

    setPlacing(true);
    const orderItems = state.items.map((item) => ({ productId: item.product.id, name: item.product.name, slug: item.product.slug, weight: item.weight, quantity: item.quantity, price: item.price, message: item.message, image: item.product.image }));
    const deliveryAddress = addressMode === "saved" && selectedAddress
      ? { name: selectedAddress.full_name, phone: selectedAddress.phone, address: selectedAddress.address_line, city: selectedAddress.city, pincode: selectedAddress.pincode }
      : { name: `${form.firstName} ${form.lastName}`, phone: form.phone, address: form.address, city: form.city, pincode: form.pincode };

    const { data: orderData, error } = await supabase.from("orders").insert({
      user_id: user.id, items: orderItems, delivery_address: deliveryAddress, delivery_slot: `${format(deliveryDate!, "dd MMM yyyy")}, ${deliveryTime}`,
      subtotal: totalPrice, discount, delivery_fee: deliveryFee, total: finalTotal, coupon_code: coupon || null, status: "placed", payment_status: "paid",
      transaction_id: transactionId.trim() || null,
    }).select("id").single();

    setPlacing(false);
    if (error) { toast.error("Failed to place order. Please try again."); return; }

    const orderId = orderData?.id?.slice(0, 8).toUpperCase() || "N/A";
    const itemLines = orderItems.map((item: any) => `• ${item.name} (${item.weight}) x${item.quantity} — ₹${item.price * item.quantity}`).join("\n");
    const addrLine = `${deliveryAddress.name}, ${deliveryAddress.phone}\n${deliveryAddress.address}, ${deliveryAddress.city} - ${deliveryAddress.pincode}`;
    const slot = `${format(deliveryDate!, "dd MMM yyyy")}, ${deliveryTime}`;
    const txnLine = transactionId.trim() ? `\n💳 *Transaction ID:* ${transactionId.trim()}` : "";
    const whatsappMsg = encodeURIComponent(`🎂 *New Order — #${orderId}*\n\n📋 *Items:*\n${itemLines}\n\n📦 *Subtotal:* ₹${totalPrice}\n${discount > 0 ? `🏷️ *Discount:* -₹${discount}\n` : ""}🚚 *Delivery:* ₹${deliveryFee}\n💰 *Total:* ₹${finalTotal}${txnLine}\n\n📍 *Delivery Address:*\n${addrLine}\n\n🕐 *Delivery Slot:* ${slot}\n\nPlease confirm this order. Thank you! 🙏`);
    const whatsappNum = storeInfo.whatsappNumber?.replace(/\D/g, "") || "";
    if (whatsappNum) window.open(`https://wa.me/${whatsappNum}?text=${whatsappMsg}`, "_blank");

    toast.success("Order placed! Please confirm via WhatsApp 🎉");
    dispatch({ type: "CLEAR_CART" });
    navigate("/dashboard");
  };

  if (state.items.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-display font-bold mb-4">Your cart is empty</h1>
        <Link to="/shop" className="text-primary hover:underline">Continue Shopping</Link>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
        <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 active:scale-95 transition-transform">
          <ChevronLeft className="w-4 h-4" /> Continue Shopping
        </Link>
      </motion.div>

      <motion.h1 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-3xl font-display font-bold mb-8">
        Checkout
      </motion.h1>

      {!user && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="p-4 rounded-2xl bg-blush mb-6 flex items-center justify-between">
          <p className="text-sm">Sign in to save your order history and track deliveries.</p>
          <Link to="/login" className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 active:scale-95 transition-all">Sign In</Link>
        </motion.div>
      )}

      <div className="grid md:grid-cols-5 gap-8">
        <motion.div variants={stagger} initial="hidden" animate="show" className="md:col-span-3 space-y-6">
          {/* Address */}
          <motion.div variants={fadeUp} className="p-6 rounded-2xl bg-card shadow-soft">
            <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" /> Delivery Address
            </h3>
            {user && (
              <div className="flex gap-2 mb-4">
                {(["saved", "new"] as const).map(mode => (
                  <motion.button key={mode} whileTap={{ scale: 0.95 }} onClick={() => setAddressMode(mode)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${addressMode === mode ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary text-secondary-foreground hover:bg-primary/10"}`}>
                    {mode === "saved" ? "Saved Addresses" : "New Address"}
                  </motion.button>
                ))}
              </div>
            )}
            <AnimatePresence mode="wait">
              {addressMode === "saved" && user ? (
                <motion.div key="saved" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                  <SavedAddresses mode="select" selectedId={selectedAddressId} onSelect={(addr) => { setSelectedAddressId(addr.id); setSelectedAddress(addr); }} />
                </motion.div>
              ) : (
                <motion.div key="new" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="grid grid-cols-2 gap-3">
                  <input placeholder="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="col-span-1 px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
                  <input placeholder="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="col-span-1 px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
                  <input placeholder="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="col-span-2 px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
                  <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="col-span-2 px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
                  <input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
                  <input placeholder="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} className="px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Delivery Date & Time */}
          <motion.div variants={fadeUp} className="p-6 rounded-2xl bg-card shadow-soft">
            <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Delivery Date & Time
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <motion.button whileTap={{ scale: 0.98 }}
                      className={cn("w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm text-left transition-all",
                        deliveryDate ? "border-primary bg-primary/5 text-foreground font-medium" : "border-border text-muted-foreground hover:border-primary/50")}>
                      <CalendarIcon className="w-4 h-4" />
                      {deliveryDate ? format(deliveryDate, "EEEE, dd MMM yyyy") : "Pick a delivery date"}
                    </motion.button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={deliveryDate} onSelect={setDeliveryDate} disabled={(date) => isBefore(date, startOfDay(new Date())) || isBefore(addDays(new Date(), 14), date)} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Select Time</label>
                <div className="grid grid-cols-3 gap-2">
                  {deliveryConfig.time_slots.map((time) => (
                    <motion.button key={time} onClick={() => setDeliveryTime(time)} whileTap={{ scale: 0.93 }}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${deliveryTime === time ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-border hover:border-primary/50 hover:bg-primary/5"}`}>
                      {time}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Payment QR & Transaction ID */}
          {paymentConfig && (
            <motion.div variants={fadeUp} className="p-6 rounded-2xl bg-card shadow-soft">
              <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" /> Payment
              </h3>
              <div className="space-y-4">
                {/* QR Code Display */}
                {paymentConfig.qrImageUrl && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-3">Scan the QR code below to pay</p>
                    <img
                      src={paymentConfig.qrImageUrl}
                      alt="Payment QR Code"
                      className="w-48 h-48 object-contain mx-auto rounded-xl border border-border bg-white p-2"
                    />
                    {/* Payment Info Lines */}
                    {paymentConfig.infoLines?.filter(l => l.label && l.value).length > 0 && (
                      <div className="mt-3 space-y-1">
                        {paymentConfig.infoLines.filter(l => l.label && l.value).map((line, i) => (
                          <p key={i} className="text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">{line.label}:</span> {line.value}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Transaction ID Input */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Transaction ID / UTR Number</label>
                  <div className="relative">
                    <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      placeholder="Enter your transaction ID after payment"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">Enter the transaction ID from your payment app after scanning the QR</p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Order Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="md:col-span-2">
          <div className="p-6 rounded-2xl bg-card shadow-soft sticky top-24">
            <h3 className="font-display font-semibold text-lg mb-4">Order Summary</h3>
            <div className="space-y-3 mb-4">
              {state.items.map((item, i) => (
                <motion.div key={`${item.product.id}-${item.weight}`} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.product.name} ({item.weight}) × {item.quantity}</span>
                  <span className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</span>
                </motion.div>
              ))}
            </div>

            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input placeholder="Coupon code" value={coupon} onChange={(e) => setCoupon(e.target.value)} className="w-full pl-9 pr-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
              </div>
              <motion.button whileTap={{ scale: 0.93 }} onClick={applyCoupon} className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-primary/10 active:bg-primary/15 transition-colors">Apply</motion.button>
            </div>

            <div className="border-t border-border pt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{totalPrice.toLocaleString()}</span></div>
              <AnimatePresence>
                {discount > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex justify-between" style={{ color: "hsl(142 71% 45%)" }}>
                    <span>Discount</span><span>-₹{discount.toLocaleString()}</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{deliveryFee === 0 ? "Free" : `₹${deliveryFee}`}</span></div>
              <motion.div key={finalTotal} initial={{ scale: 1.05 }} animate={{ scale: 1 }} className="flex justify-between text-lg font-bold border-t border-border pt-3 mt-3">
                <span>Total</span><span>₹{finalTotal.toLocaleString()}</span>
              </motion.div>
            </div>

            {transactionId.trim() && (
              <div className="mt-3 p-2.5 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-xs text-primary font-medium flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" /> Txn ID: {transactionId.trim()}
                </p>
              </div>
            )}

            <div className="mt-4 p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 flex items-start gap-2.5">
              <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
              <p className="text-xs text-green-700 dark:text-green-300 leading-relaxed">After placing, you'll be redirected to <strong>WhatsApp</strong> to confirm your order with us.</p>
            </div>

            <motion.button onClick={handlePlaceOrder} disabled={placing} whileTap={placing ? {} : { scale: 0.97 }} whileHover={placing ? {} : { scale: 1.01 }}
              className="w-full mt-4 py-3.5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50 shadow-card hover:shadow-elevated">
              {placing ? "Placing Order..." : `Place Order — ₹${finalTotal.toLocaleString()}`}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
