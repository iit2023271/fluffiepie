import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminProducts from "@/components/admin/AdminProducts";
import AdminOrders from "@/components/admin/AdminOrders";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminSettings from "@/components/admin/AdminSettings";
import AdminKitchen from "@/components/admin/AdminKitchen";
import AdminHomepage from "@/components/admin/AdminHomepage";
import AdminReviews from "@/components/admin/AdminReviews";
import AdminThemes from "@/components/admin/AdminThemes";
import AdminMessages from "@/components/admin/AdminMessages";
import { LayoutDashboard, Package, ShoppingCart, Users, LogOut, ChevronLeft, Settings, ChefHat, Home, MessageSquare, Palette, Inbox } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const tabs = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "homepage", label: "Homepage", icon: Home },
  { key: "products", label: "Products", icon: Package },
  { key: "orders", label: "Orders", icon: ShoppingCart },
  { key: "kitchen", label: "Kitchen", icon: ChefHat },
  { key: "users", label: "Customers", icon: Users },
  { key: "reviews", label: "Reviews", icon: MessageSquare },
  { key: "messages", label: "Messages", icon: Inbox },
  { key: "themes", label: "Themes", icon: Palette },
  { key: "settings", label: "Settings", icon: Settings },
] as const;

type TabKey = typeof tabs[number]["key"];

export default function AdminPanel() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }

    const checkAdmin = async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!data) {
        toast.error("Access denied. Admin only.");
        navigate("/");
        return;
      }
      setIsAdmin(true);
      setChecking(false);
    };
    checkAdmin();
  }, [user, authLoading, navigate]);

  if (authLoading || checking || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Checking access...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="flex">
        <aside className="w-64 bg-card border-r border-border min-h-screen p-4 hidden md:flex flex-col">
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4">
              <ChevronLeft className="w-3 h-3" /> Back to Store
            </Link>
            <h2 className="text-lg font-display font-bold">Admin Panel</h2>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>

          <nav className="flex-1 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </nav>

          <button
            onClick={() => { signOut(); navigate("/"); }}
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </aside>

        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-40 safe-area-bottom">
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-shrink-0 flex flex-col items-center justify-center gap-0.5 min-w-[4.5rem] py-2.5 px-2 text-[10px] font-medium transition-colors active:scale-95 ${
                  activeTab === tab.key
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                  activeTab === tab.key ? "bg-primary/10" : ""
                }`}>
                  <tab.icon className="w-[18px] h-[18px]" />
                </div>
                <span className="truncate max-w-[4rem]">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
          {activeTab === "dashboard" && <AdminDashboard />}
          {activeTab === "homepage" && <AdminHomepage />}
          {activeTab === "products" && <AdminProducts />}
          {activeTab === "orders" && <AdminOrders />}
          {activeTab === "kitchen" && <AdminKitchen />}
          {activeTab === "users" && <AdminUsers />}
          {activeTab === "reviews" && <AdminReviews />}
          {activeTab === "messages" && <AdminMessages />}
          {activeTab === "themes" && <AdminThemes />}
          {activeTab === "settings" && <AdminSettings />}
        </main>
      </div>
    </div>
  );
}
