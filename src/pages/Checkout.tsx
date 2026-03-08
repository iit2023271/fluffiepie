import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Tag, MapPin, CalendarIcon, Clock } from "lucide-react";
import { toast } from "sonner";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import SavedAddresses from "@/components/SavedAddresses";

export default function Checkout() {
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

  const applyCoupon = async () => {
    if (!coupon.trim()) { toast.error("Enter a coupon code"); return; }
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", coupon.toUpperCase().trim())
      .eq("is_active", true)
      .single();

    if (error || !data) {
      toast.error("Invalid coupon code");
      return;
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      toast.error("This coupon has expired");
      return;
    }

    if (data.usage_limit && data.used_count >= data.usage_limit) {
      toast.error("This coupon has reached its usage limit");
      return;
    }

    if (totalPrice < data.min_order_amount) {
      toast.error(`Minimum order amount is ₹${data.min_order_amount}`);
      return;
    }

    let disc = 0;
    if (data.discount_type === "percentage") {
      disc = Math.round(totalPrice * (data.discount_value / 100));
      if (data.max_discount) disc = Math.min(disc, data.max_discount);
    } else {
      disc = data.discount_value;
    }

    setDiscount(disc);
    toast.success(`Coupon applied! You save ₹${disc}`);
  };

  const deliveryFee = totalPrice >= 999 ? 0 : 49;
  const finalTotal = totalPrice - discount + deliveryFee;

  const handlePlaceOrder = async () => {
    if (addressMode === "saved") {
      if (!selectedAddress) {
        toast.error("Please select a saved address");
        return;
      }
    } else {
      if (!form.firstName || !form.phone || !form.address || !form.city || !form.pincode) {
        toast.error("Please fill in all address fields");
        return;
      }
    }

    if (!deliveryDate) {
      toast.error("Please select a delivery date");
      return;
    }
    if (!deliveryTime) {
      toast.error("Please select a delivery time");
      return;
    }

    if (!user) {
      toast.error("Please sign in to place an order");
      navigate("/login");
      return;
    }

    setPlacing(true);
    const orderItems = state.items.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      weight: item.weight,
      quantity: item.quantity,
      price: item.price,
      message: item.message,
      image: item.product.image,
    }));

    const deliveryAddress = addressMode === "saved" && selectedAddress
      ? {
          name: selectedAddress.full_name,
          phone: selectedAddress.phone,
          address: selectedAddress.address_line,
          city: selectedAddress.city,
          pincode: selectedAddress.pincode,
        }
      : {
          name: `${form.firstName} ${form.lastName}`,
          phone: form.phone,
          address: form.address,
          city: form.city,
          pincode: form.pincode,
        };

    const customerName = addressMode === "saved" && selectedAddress
      ? selectedAddress.full_name
      : `${form.firstName} ${form.lastName}`.trim();

    const { data: orderData, error } = await supabase.from("orders").insert({
      user_id: user.id,
      items: orderItems,
      delivery_address: deliveryAddress,
      delivery_slot: `${format(deliveryDate!, "dd MMM yyyy")}, ${deliveryTime}`,
      subtotal: totalPrice,
      discount,
      delivery_fee: deliveryFee,
      total: finalTotal,
      coupon_code: coupon || null,
      status: "placed",
      payment_status: "paid",
    }).select("id").single();

    setPlacing(false);
    if (error) {
      toast.error("Failed to place order. Please try again.");
      return;
    }

    // Send order confirmation email
    if (orderData) {
      supabase.functions.invoke("send-order-notification", {
        body: {
          orderId: orderData.id,
          newStatus: "placed",
          customerName,
          orderTotal: finalTotal,
          items: orderItems,
          userId: user.id,
        },
      }).catch(console.error);
    }

    toast.success("Order placed successfully! 🎉");
    dispatch({ type: "CLEAR_CART" });
    navigate("/dashboard");
  };

  if (state.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-display font-bold mb-4">Your cart is empty</h1>
        <Link to="/shop" className="text-primary hover:underline">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ChevronLeft className="w-4 h-4" /> Continue Shopping
      </Link>

      <h1 className="text-3xl font-display font-bold mb-8">Checkout</h1>

      {!user && (
        <div className="p-4 rounded-2xl bg-blush mb-6 flex items-center justify-between">
          <p className="text-sm">Sign in to save your order history and track deliveries.</p>
          <Link to="/login" className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90">
            Sign In
          </Link>
        </div>
      )}

      <div className="grid md:grid-cols-5 gap-8">
        <div className="md:col-span-3 space-y-6">
          <div className="p-6 rounded-2xl bg-card shadow-soft">
            <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" /> Delivery Address
            </h3>

            {user && (
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setAddressMode("saved")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    addressMode === "saved" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-primary/10"
                  }`}
                >
                  Saved Addresses
                </button>
                <button
                  onClick={() => setAddressMode("new")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    addressMode === "new" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-primary/10"
                  }`}
                >
                  New Address
                </button>
              </div>
            )}

            {addressMode === "saved" && user ? (
              <SavedAddresses
                mode="select"
                selectedId={selectedAddressId}
                onSelect={(addr) => {
                  setSelectedAddressId(addr.id);
                  setSelectedAddress(addr);
                }}
              />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="col-span-1 px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:border-primary" />
                <input placeholder="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="col-span-1 px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:border-primary" />
                <input placeholder="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="col-span-2 px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:border-primary" />
                <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="col-span-2 px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:border-primary" />
                <input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:border-primary" />
                <input placeholder="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} className="px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:border-primary" />
              </div>
            )}
          </div>

          <div className="p-6 rounded-2xl bg-card shadow-soft">
            <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Delivery Date & Time
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className={cn(
                        "w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm text-left transition-colors",
                        deliveryDate ? "border-primary bg-primary/5 text-foreground font-medium" : "border-border text-muted-foreground hover:border-primary/50"
                      )}
                    >
                      <CalendarIcon className="w-4 h-4" />
                      {deliveryDate ? format(deliveryDate, "EEEE, dd MMM yyyy") : "Pick a delivery date"}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={deliveryDate}
                      onSelect={setDeliveryDate}
                      disabled={(date) => isBefore(date, startOfDay(new Date())) || isBefore(addDays(new Date(), 14), date)}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Select Time</label>
                <div className="grid grid-cols-3 gap-2">
                  {["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM"].map((time) => (
                    <button
                      key={time}
                      onClick={() => setDeliveryTime(time)}
                      className={`px-3 py-2 rounded-xl border text-xs transition-colors ${
                        deliveryTime === time ? "border-primary bg-primary/10 text-primary font-medium" : "border-border hover:border-primary/50"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="p-6 rounded-2xl bg-card shadow-soft sticky top-24">
            <h3 className="font-display font-semibold text-lg mb-4">Order Summary</h3>
            <div className="space-y-3 mb-4">
              {state.items.map((item) => (
                <div key={`${item.product.id}-${item.weight}`} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.product.name} ({item.weight}) × {item.quantity}
                  </span>
                  <span className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  placeholder="Coupon code"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <button onClick={applyCoupon} className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-primary/10">
                Apply
              </button>
            </div>
            

            <div className="border-t border-border pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{totalPrice.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between" style={{ color: "hsl(142 71% 45%)" }}>
                  <span>Discount</span>
                  <span>-₹{discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span>{deliveryFee === 0 ? "Free" : `₹${deliveryFee}`}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-border pt-3 mt-3">
                <span>Total</span>
                <span>₹{finalTotal.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={placing}
              className="w-full mt-6 py-3.5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {placing ? "Placing Order..." : `Place Order — ₹${finalTotal.toLocaleString()}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
