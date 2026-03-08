import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Package, User, LogOut, Clock, CheckCircle, Truck, ChefHat, Search, Shield, Star, MessageSquare } from "lucide-react";
import ReviewForm from "@/components/ReviewForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";

interface Order {
  id: string;
  items: any;
  status: string;
  total: number;
  created_at: string;
  delivery_slot: string | null;
}

interface Profile {
  full_name: string | null;
  phone: string | null;
}

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  placed: { label: "Order Placed", icon: Clock, color: "text-accent" },
  confirmed: { label: "Confirmed", icon: CheckCircle, color: "text-primary" },
  baking: { label: "Baking", icon: ChefHat, color: "text-accent" },
  out_for_delivery: { label: "Out for Delivery", icon: Truck, color: "text-primary" },
  delivered: { label: "Delivered", icon: CheckCircle, color: "text-primary" },
  cancelled: { label: "Cancelled", icon: Clock, color: "text-destructive" },
};

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"orders" | "profile">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<Profile>({ full_name: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [reviewingOrder, setReviewingOrder] = useState<Order | null>(null);
  const [existingReviews, setExistingReviews] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    loadData();
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      setIsAdmin(!!data);
    });
  }, [user, navigate]);

  const loadData = async () => {
    setLoading(true);
    const [ordersRes, profileRes] = await Promise.all([
      supabase.from("orders").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("profiles").select("full_name, phone").eq("user_id", user!.id).single(),
    ]);
    if (ordersRes.data) setOrders(ordersRes.data);
    if (profileRes.data) setProfile(profileRes.data);
    // Load existing reviews by this user
    if (user) {
      const { data: reviews } = await supabase
        .from("reviews")
        .select("product_id, order_id")
        .eq("user_id", user.id);
      if (reviews) {
        setExistingReviews(new Set(reviews.map((r: any) => `${r.product_id}-${r.order_id}`)));
      }
    }
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: profile.full_name, phone: profile.phone })
      .eq("user_id", user!.id);
    if (error) toast.error("Failed to update profile");
    else toast.success("Profile updated!");
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    toast.success("Signed out");
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-secondary rounded w-48 mx-auto" />
          <div className="h-4 bg-secondary rounded w-32 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">
              Hello, {profile.full_name || "there"}! 👋
            </h1>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Shield className="w-4 h-4" /> Admin Panel
              </Link>
            )}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {[
            { key: "orders" as const, icon: Package, label: "My Orders" },
            { key: "profile" as const, icon: User, label: "Profile" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                tab === t.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-primary/10"
              }`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* Orders */}
        {tab === "orders" && (
          <div className="space-y-4">
            {orders.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-2">
                <div className="relative flex-1 min-w-[180px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    placeholder="Search orders..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-border text-sm bg-background focus:outline-none focus:border-primary"
                  />
                </div>
                <select value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-border text-sm bg-background">
                  <option value="">All Statuses</option>
                  <option value="placed">Placed</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="baking">Baking</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            )}
            {orders.length === 0 ? (
              <div className="text-center py-16 rounded-2xl bg-card shadow-soft">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display font-semibold text-lg mb-2">No orders yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Start exploring our delicious cakes!</p>
                <Link to="/shop" className="inline-flex px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90">
                  Browse Cakes
                </Link>
              </div>
            ) : (
              orders
                .filter((order) => {
                  const matchSearch = !orderSearch || order.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
                    (order.items as any[])?.some((item: any) => item.name?.toLowerCase().includes(orderSearch.toLowerCase()));
                  const matchStatus = !orderStatusFilter || order.status === orderStatusFilter;
                  return matchSearch && matchStatus;
                })
                .map((order) => {
                const status = statusConfig[order.status] || statusConfig.placed;
                const StatusIcon = status.icon;
                return (
                  <div key={order.id} className="p-5 rounded-2xl bg-card shadow-soft">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Order #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(order.created_at), "dd MMM yyyy, hh:mm a")}
                        </p>
                      </div>
                      <div className={`flex items-center gap-1.5 ${status.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">{status.label}</span>
                      </div>
                    </div>

                    {/* Order items */}
                    <div className="space-y-2 mb-3">
                      {(order.items as any[]).map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {item.name} ({item.weight}) × {item.quantity}
                          </span>
                          <span className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className="font-semibold">Total: ₹{order.total.toLocaleString()}</span>
                      <div className="flex items-center gap-3">
                        {order.status === "delivered" && (
                          <button
                            onClick={() => setReviewingOrder(order)}
                            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                          >
                            <Star className="w-3.5 h-3.5" /> Write Review
                          </button>
                        )}
                        {/* Status timeline */}
                        <div className="flex items-center gap-1">
                          {["placed", "confirmed", "baking", "out_for_delivery", "delivered"].map((s, i) => {
                            const steps = ["placed", "confirmed", "baking", "out_for_delivery", "delivered"];
                            const currentIndex = steps.indexOf(order.status);
                            const isComplete = i <= currentIndex;
                            return (
                              <div key={s} className="flex items-center">
                                <div className={`w-2 h-2 rounded-full ${isComplete ? "bg-primary" : "bg-border"}`} />
                                {i < 4 && <div className={`w-4 h-0.5 ${isComplete ? "bg-primary" : "bg-border"}`} />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Profile */}
        {tab === "profile" && (
          <div className="p-6 rounded-2xl bg-card shadow-soft max-w-lg">
            <h3 className="font-display font-semibold text-lg mb-6">Edit Profile</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Full Name</label>
                <input
                  type="text"
                  value={profile.full_name || ""}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Email</label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-sm text-muted-foreground"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Phone</label>
                <input
                  type="tel"
                  value={profile.phone || ""}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="Enter your phone number"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
