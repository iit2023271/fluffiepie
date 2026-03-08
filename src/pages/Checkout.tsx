import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { Link } from "react-router-dom";
import { ChevronLeft, Tag, MapPin } from "lucide-react";
import { toast } from "sonner";

export default function Checkout() {
  const { state, totalPrice, dispatch } = useCart();
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);

  const applyCoupon = () => {
    if (coupon.toUpperCase() === "SWEET10") {
      setDiscount(Math.round(totalPrice * 0.1));
      toast.success("Coupon applied! 10% off");
    } else {
      toast.error("Invalid coupon code");
    }
  };

  const deliveryFee = totalPrice >= 999 ? 0 : 49;
  const finalTotal = totalPrice - discount + deliveryFee;

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

      <div className="grid md:grid-cols-5 gap-8">
        {/* Form */}
        <div className="md:col-span-3 space-y-6">
          <div className="p-6 rounded-2xl bg-card shadow-soft">
            <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" /> Delivery Address
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="First Name" className="col-span-1 px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:border-primary" />
              <input placeholder="Last Name" className="col-span-1 px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:border-primary" />
              <input placeholder="Phone Number" className="col-span-2 px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:border-primary" />
              <input placeholder="Address" className="col-span-2 px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:border-primary" />
              <input placeholder="City" className="px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:border-primary" />
              <input placeholder="Pincode" className="px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:border-primary" />
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-card shadow-soft">
            <h3 className="font-display font-semibold text-lg mb-4">Delivery Slot</h3>
            <div className="grid grid-cols-3 gap-2">
              {["Today", "Tomorrow", "Day After"].map((day) => (
                <button key={day} className="px-3 py-2 rounded-xl border border-border text-sm hover:border-primary hover:bg-primary/5 transition-colors">
                  {day}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {["9AM - 12PM", "12PM - 4PM", "4PM - 8PM"].map((slot) => (
                <button key={slot} className="px-3 py-2 rounded-xl border border-border text-xs hover:border-primary hover:bg-primary/5 transition-colors">
                  {slot}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
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

            {/* Coupon */}
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
            <p className="text-xs text-muted-foreground mb-4">Try: SWEET10</p>

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
              onClick={() => {
                toast.success("Order placed successfully! 🎉");
                dispatch({ type: "CLEAR_CART" });
              }}
              className="w-full mt-6 py-3.5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              Place Order — ₹{finalTotal.toLocaleString()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
