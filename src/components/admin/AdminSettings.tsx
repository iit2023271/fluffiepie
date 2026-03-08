import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, X, Trash2, Tag, Layers, Palette, Calendar, Pencil, Upload, Image, Eye, EyeOff, BarChart3, Crop, Mail, Bell, BellOff, Send, CheckCircle2, AlertCircle, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import ImageCropper from "@/components/admin/ImageCropper";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { DEFAULT_STORE_INFO, type StoreInfo } from "@/hooks/useStoreInfo";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import ImageCropper from "@/components/admin/ImageCropper";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

interface ConfigItem {
  id: string;
  config_type: string;
  value: string;
  is_active: boolean;
  sort_order: number;
}

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number;
  max_discount: number | null;
  is_active: boolean;
  usage_limit: number | null;
  used_count: number;
  expires_at: string | null;
}

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  is_active: boolean;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
}

const configSections = [
  { type: "category", label: "Categories", icon: Layers, description: "Product categories like Classic, Premium, etc." },
  { type: "flavour", label: "Flavours", icon: Palette, description: "Available cake flavours" },
  { type: "occasion", label: "Occasions", icon: Calendar, description: "Special occasions for cakes" },
];

const emptyCoupon = {
  code: "", discount_type: "percentage", discount_value: 10, min_order_amount: 0,
  max_discount: null as number | null, is_active: true, usage_limit: null as number | null, expires_at: "",
};

const emptyBanner = {
  title: "", subtitle: "", image_url: null as string | null, link_url: "",
  is_active: true, sort_order: 0, starts_at: "", ends_at: "",
};

export default function AdminSettings() {
  const [configItems, setConfigItems] = useState<ConfigItem[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [newValues, setNewValues] = useState<Record<string, string>>({ category: "", flavour: "", occasion: "" });
  const [activeSection, setActiveSection] = useState<"config" | "coupons" | "banners" | "notifications">("config");
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponForm, setCouponForm] = useState(emptyCoupon);
  const [editingCoupon, setEditingCoupon] = useState<string | null>(null);
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [bannerForm, setBannerForm] = useState(emptyBanner);
  const [editingBanner, setEditingBanner] = useState<string | null>(null);
  const [savingBanner, setSavingBanner] = useState(false);
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [bannerCropSrc, setBannerCropSrc] = useState<string | null>(null);
  const [showBannerCropper, setShowBannerCropper] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [emailSettings, setEmailSettings] = useState<Record<string, boolean>>({
    placed: true, confirmed: true, baking: true, out_for_delivery: true, delivered: true, cancelled: true,
  });
  const [savingEmail, setSavingEmail] = useState(false);
  const [testingEmail, setTestingEmail] = useState<string | null>(null);

  // Confirm dialog state
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; type: "config" | "coupon" | "banner"; id: string; name: string }>({ open: false, type: "config", id: "", name: "" });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [configRes, couponRes, bannerRes, ordersRes] = await Promise.all([
      supabase.from("store_config").select("*").order("sort_order", { ascending: true }),
      supabase.from("coupons").select("*").order("created_at", { ascending: false }),
      supabase.from("banners").select("*").order("sort_order", { ascending: true }),
      supabase.from("orders").select("coupon_code, discount, total").not("coupon_code", "is", null),
    ]);
    if (configRes.data) {
      setConfigItems(configRes.data as ConfigItem[]);
      const emailConfigs = (configRes.data as ConfigItem[]).filter(c => c.config_type === "email_notification");
      if (emailConfigs.length > 0) {
        const settings: Record<string, boolean> = {};
        emailConfigs.forEach(c => { settings[c.value] = c.is_active; });
        setEmailSettings(prev => ({ ...prev, ...settings }));
      }
    }
    if (couponRes.data) setCoupons(couponRes.data as Coupon[]);
    if (bannerRes.data) setBanners(bannerRes.data as Banner[]);
    if (ordersRes.data) setOrders(ordersRes.data);
    setLoading(false);
  };

  const addConfigItem = async (type: string) => {
    const val = newValues[type]?.trim();
    if (!val) { toast.error("Enter a value"); return; }
    const maxOrder = configItems.filter(c => c.config_type === type).reduce((m, c) => Math.max(m, c.sort_order), 0);
    const { error } = await supabase.from("store_config").insert({ config_type: type, value: val, sort_order: maxOrder + 1 });
    if (error) { error.code === "23505" ? toast.error("Already exists") : toast.error("Failed to add"); return; }
    toast.success(`${val} added!`);
    setNewValues(prev => ({ ...prev, [type]: "" }));
    loadAll();
  };

  const toggleConfig = async (id: string, active: boolean) => {
    const { error } = await supabase.from("store_config").update({ is_active: !active }).eq("id", id);
    if (error) toast.error("Failed to update");
    else loadAll();
  };

  const deleteConfig = async (id: string) => {
    const { error } = await supabase.from("store_config").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Deleted"); loadAll(); }
  };

  // Coupon functions
  const openCouponCreate = () => { setEditingCoupon(null); setCouponForm(emptyCoupon); setShowCouponForm(true); };
  const openCouponEdit = (c: Coupon) => {
    setEditingCoupon(c.id);
    setCouponForm({ code: c.code, discount_type: c.discount_type, discount_value: c.discount_value, min_order_amount: c.min_order_amount, max_discount: c.max_discount, is_active: c.is_active, usage_limit: c.usage_limit, expires_at: c.expires_at ? c.expires_at.split("T")[0] : "" });
    setShowCouponForm(true);
  };

  const saveCoupon = async () => {
    if (!couponForm.code.trim()) { toast.error("Code is required"); return; }
    setSavingCoupon(true);
    const payload: any = { code: couponForm.code.toUpperCase().trim(), discount_type: couponForm.discount_type, discount_value: couponForm.discount_value, min_order_amount: couponForm.min_order_amount, max_discount: couponForm.max_discount || null, is_active: couponForm.is_active, usage_limit: couponForm.usage_limit || null, expires_at: couponForm.expires_at ? new Date(couponForm.expires_at).toISOString() : null };
    if (editingCoupon) {
      const { error } = await supabase.from("coupons").update(payload).eq("id", editingCoupon);
      error ? toast.error("Failed to update") : toast.success("Coupon updated!");
    } else {
      const { error } = await supabase.from("coupons").insert(payload);
      error ? (error.code === "23505" ? toast.error("Code already exists") : toast.error("Failed")) : toast.success("Coupon created!");
    }
    setSavingCoupon(false); setShowCouponForm(false); loadAll();
  };

  const deleteCoupon = async (id: string) => {
    await supabase.from("coupons").delete().eq("id", id);
    toast.success("Deleted"); loadAll();
  };

  // Banner functions
  const openBannerCreate = () => { setEditingBanner(null); setBannerForm(emptyBanner); setBannerImage(null); setShowBannerForm(true); };
  const openBannerEdit = (b: Banner) => {
    setEditingBanner(b.id);
    setBannerForm({ title: b.title, subtitle: b.subtitle || "", image_url: b.image_url, link_url: b.link_url || "", is_active: b.is_active, sort_order: b.sort_order, starts_at: b.starts_at ? b.starts_at.split("T")[0] : "", ends_at: b.ends_at ? b.ends_at.split("T")[0] : "" });
    setBannerImage(null); setShowBannerForm(true);
  };

  const saveBanner = async () => {
    if (!bannerForm.title.trim()) { toast.error("Title is required"); return; }
    setSavingBanner(true);
    let imageUrl = bannerForm.image_url;
    if (bannerImage) {
      const ext = bannerImage.name.split(".").pop();
      const path = `banners/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, bannerImage);
      if (!error) {
        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        imageUrl = data.publicUrl;
      }
    }
    const payload: any = { title: bannerForm.title, subtitle: bannerForm.subtitle || null, image_url: imageUrl, link_url: bannerForm.link_url || null, is_active: bannerForm.is_active, sort_order: bannerForm.sort_order, starts_at: bannerForm.starts_at ? new Date(bannerForm.starts_at).toISOString() : null, ends_at: bannerForm.ends_at ? new Date(bannerForm.ends_at).toISOString() : null };
    if (editingBanner) {
      const { error } = await supabase.from("banners").update(payload).eq("id", editingBanner);
      error ? toast.error("Failed") : toast.success("Banner updated!");
    } else {
      const { error } = await supabase.from("banners").insert(payload);
      error ? toast.error("Failed") : toast.success("Banner created!");
    }
    setSavingBanner(false); setShowBannerForm(false); loadAll();
  };

  const deleteBanner = async (id: string) => {
    await supabase.from("banners").delete().eq("id", id);
    toast.success("Deleted"); loadAll();
  };

  const toggleBanner = async (id: string, active: boolean) => {
    await supabase.from("banners").update({ is_active: !active }).eq("id", id);
    loadAll();
  };

  // Email notification settings
  const EMAIL_STATUS_CONFIG: Record<string, { label: string; emoji: string; description: string }> = {
    placed: { label: "Order Placed", emoji: "📦", description: "When a customer places a new order" },
    confirmed: { label: "Order Confirmed", emoji: "✅", description: "When you confirm an order" },
    baking: { label: "Being Prepared", emoji: "🧁", description: "When the order starts preparation" },
    out_for_delivery: { label: "Out for Delivery", emoji: "🚚", description: "When the order is dispatched" },
    delivered: { label: "Delivered", emoji: "✔️", description: "When the order is delivered" },
    cancelled: { label: "Cancelled", emoji: "❌", description: "When an order is cancelled" },
  };

  const toggleEmailStatus = async (status: string) => {
    const newValue = !emailSettings[status];
    setEmailSettings(prev => ({ ...prev, [status]: newValue }));
    const existing = configItems.find(c => c.config_type === "email_notification" && c.value === status);
    if (existing) {
      await supabase.from("store_config").update({ is_active: newValue }).eq("id", existing.id);
    } else {
      await supabase.from("store_config").insert({ config_type: "email_notification", value: status, is_active: newValue, sort_order: 0 });
    }
    toast.success(`${EMAIL_STATUS_CONFIG[status]?.label} email ${newValue ? "enabled" : "disabled"}`);
    loadAll();
  };

  const sendTestEmail = async (status: string) => {
    setTestingEmail(status);
    try {
      const { data, error } = await supabase.functions.invoke("send-order-notification", {
        body: {
          orderId: "test-00000000",
          newStatus: status,
          customerName: "Test Customer",
          orderTotal: 999,
          items: [{ name: "Test Cake", weight: "1kg", quantity: 1, price: 999 }],
          isTest: true,
        },
      });
      if (error) throw error;
      if (data?.success) toast.success("Test email sent! Check your inbox.");
      else toast.error(data?.error || "Failed to send test email");
    } catch (e: any) {
      toast.error("Failed to send test email");
    }
    setTestingEmail(null);
  };

  // Coupon analytics
  const couponStats = coupons.map(c => {
    const couponOrders = orders.filter(o => o.coupon_code === c.code);
    const totalRevenue = couponOrders.reduce((s, o) => s + (o.total || 0), 0);
    const totalDiscount = couponOrders.reduce((s, o) => s + (o.discount || 0), 0);
    return { ...c, orderCount: couponOrders.length, totalRevenue, totalDiscount };
  });

  const handleDeleteConfirm = () => {
    if (deleteConfirm.type === "config") deleteConfig(deleteConfirm.id);
    else if (deleteConfirm.type === "coupon") deleteCoupon(deleteConfirm.id);
    else if (deleteConfirm.type === "banner") deleteBanner(deleteConfirm.id);
    setDeleteConfirm({ open: false, type: "config", id: "", name: "" });
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-display font-bold mb-6">Settings</h1>
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-secondary rounded-xl animate-pulse" />)}</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-6">Settings</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: "config" as const, label: "Store Config", icon: Layers },
          { key: "coupons" as const, label: "Coupons", icon: Tag },
          { key: "banners" as const, label: "Banners", icon: Image },
          { key: "notifications" as const, label: "Notifications", icon: Bell },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveSection(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${activeSection === tab.key ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-primary/10"}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Store Config */}
      {activeSection === "config" && (
        <div className="space-y-6">
          {configSections.map(section => {
            const items = configItems.filter(c => c.config_type === section.type);
            return (
              <div key={section.type} className="bg-card rounded-2xl p-6 shadow-soft">
                <div className="flex items-center gap-3 mb-1">
                  <section.icon className="w-5 h-5 text-primary" />
                  <h3 className="font-display font-semibold text-lg">{section.label}</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-4">{section.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {items.map(item => (
                    <div key={item.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition-colors ${item.is_active ? "border-primary/30 bg-primary/5 text-foreground" : "border-border bg-secondary/50 text-muted-foreground line-through"}`}>
                      <span>{item.value}</span>
                      <button onClick={() => toggleConfig(item.id, item.is_active)} className={`w-4 h-4 rounded-full border-2 transition-colors ${item.is_active ? "border-primary bg-primary" : "border-muted-foreground"}`} />
                      <button onClick={() => setDeleteConfirm({ open: true, type: "config", id: item.id, name: item.value })} className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                  {items.length === 0 && <p className="text-sm text-muted-foreground">No items yet.</p>}
                </div>
                <div className="flex gap-2">
                  <input placeholder={`Add new ${section.type}...`} value={newValues[section.type] || ""}
                    onChange={(e) => setNewValues(prev => ({ ...prev, [section.type]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && addConfigItem(section.type)}
                    className="flex-1 max-w-xs px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary bg-background" />
                  <button onClick={() => addConfigItem(section.type)} className="flex items-center gap-1 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90">
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Coupons */}
      {activeSection === "coupons" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">{coupons.length} coupon(s)</p>
            <button onClick={openCouponCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90">
              <Plus className="w-4 h-4" /> New Coupon
            </button>
          </div>

          {showCouponForm && (
            <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50 flex items-start justify-center pt-10 px-4 overflow-y-auto">
              <div className="bg-card rounded-2xl shadow-elevated w-full max-w-lg p-6 mb-10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-display font-bold">{editingCoupon ? "Edit Coupon" : "New Coupon"}</h2>
                  <button onClick={() => setShowCouponForm(false)} className="p-2 hover:bg-secondary rounded-full"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium mb-1 block">Coupon Code *</label>
                    <input value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} placeholder="e.g. SWEET20"
                      className="w-full px-3 py-2 rounded-xl border border-border text-sm uppercase bg-background" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1 block">Type</label>
                      <select value={couponForm.discount_type} onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-border text-sm bg-background">
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed (₹)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Value</label>
                      <input type="number" value={couponForm.discount_value} onChange={(e) => setCouponForm({ ...couponForm, discount_value: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-xl border border-border text-sm bg-background" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1 block">Min Order (₹)</label>
                      <input type="number" value={couponForm.min_order_amount} onChange={(e) => setCouponForm({ ...couponForm, min_order_amount: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-xl border border-border text-sm bg-background" />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Max Discount (₹)</label>
                      <input type="number" value={couponForm.max_discount ?? ""} onChange={(e) => setCouponForm({ ...couponForm, max_discount: e.target.value ? parseInt(e.target.value) : null })} placeholder="No limit"
                        className="w-full px-3 py-2 rounded-xl border border-border text-sm bg-background" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1 block">Usage Limit</label>
                      <input type="number" value={couponForm.usage_limit ?? ""} onChange={(e) => setCouponForm({ ...couponForm, usage_limit: e.target.value ? parseInt(e.target.value) : null })} placeholder="Unlimited"
                        className="w-full px-3 py-2 rounded-xl border border-border text-sm bg-background" />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Expires At</label>
                      <input type="date" value={couponForm.expires_at} onChange={(e) => setCouponForm({ ...couponForm, expires_at: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border text-sm bg-background" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={couponForm.is_active} onChange={(e) => setCouponForm({ ...couponForm, is_active: e.target.checked })} className="rounded" />
                    Active
                  </label>
                  <div className="flex gap-3 pt-4">
                    <button onClick={saveCoupon} disabled={savingCoupon} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50">
                      {savingCoupon ? "Saving..." : editingCoupon ? "Update" : "Create"}
                    </button>
                    <button onClick={() => setShowCouponForm(false)} className="px-6 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-secondary">Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {couponStats.map(c => (
              <div key={c.id} className="bg-card rounded-2xl p-5 shadow-soft">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-lg">{c.code}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.is_active ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                        {c.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {c.discount_type === "percentage" ? `${c.discount_value}% off` : `₹${c.discount_value} off`}
                      {c.max_discount && ` (max ₹${c.max_discount})`}
                      {c.min_order_amount > 0 && ` · Min ₹${c.min_order_amount}`}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      {c.usage_limit && <span>Used: {c.used_count}/{c.usage_limit}</span>}
                      {c.expires_at && <span>Expires: {new Date(c.expires_at).toLocaleDateString()}</span>}
                      <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> {c.orderCount} orders · ₹{c.totalRevenue.toLocaleString()} revenue · ₹{c.totalDiscount.toLocaleString()} discounted</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openCouponEdit(c)} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteConfirm({ open: true, type: "coupon", id: c.id, name: c.code })} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Banners */}
      {activeSection === "banners" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">{banners.length} banner(s)</p>
            <button onClick={openBannerCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90">
              <Plus className="w-4 h-4" /> New Banner
            </button>
          </div>

          {showBannerForm && (
            <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50 flex items-start justify-center pt-10 px-4 overflow-y-auto">
              <div className="bg-card rounded-2xl shadow-elevated w-full max-w-lg p-6 mb-10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-display font-bold">{editingBanner ? "Edit Banner" : "New Banner"}</h2>
                  <button onClick={() => setShowBannerForm(false)} className="p-2 hover:bg-secondary rounded-full"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium mb-1 block">Title *</label>
                    <input value={bannerForm.title} onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border text-sm bg-background" />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Subtitle</label>
                    <input value={bannerForm.subtitle} onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border text-sm bg-background" />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Banner Image</label>
                    <div className="flex items-center gap-3">
                      {(bannerForm.image_url || bannerImage) && (
                        <img src={bannerImage ? URL.createObjectURL(bannerImage) : bannerForm.image_url!} alt="" className="w-24 h-12 rounded-lg object-cover" />
                      )}
                      <label className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm cursor-pointer hover:bg-secondary">
                        <Upload className="w-4 h-4" /> Upload
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setBannerCropSrc(URL.createObjectURL(file));
                            setShowBannerCropper(true);
                          }
                        }} />
                      </label>
                      {bannerImage && (
                        <button onClick={() => { setBannerCropSrc(URL.createObjectURL(bannerImage)); setShowBannerCropper(true); }} className="flex items-center gap-1 px-3 py-2 border border-border rounded-xl text-sm hover:bg-secondary">
                          <Crop className="w-4 h-4" /> Crop
                        </button>
                      )}
                    </div>
                    <ImageCropper
                      open={showBannerCropper}
                      imageSrc={bannerCropSrc || ""}
                      aspect={3}
                      onClose={() => setShowBannerCropper(false)}
                      onCropComplete={(blob) => {
                        const file = new File([blob], `banner-${Date.now()}.jpg`, { type: "image/jpeg" });
                        setBannerImage(file);
                        setShowBannerCropper(false);
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Link URL</label>
                    <input value={bannerForm.link_url} onChange={(e) => setBannerForm({ ...bannerForm, link_url: e.target.value })} placeholder="/shop or https://..."
                      className="w-full px-3 py-2 rounded-xl border border-border text-sm bg-background" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1 block">Sort Order</label>
                      <input type="number" value={bannerForm.sort_order} onChange={(e) => setBannerForm({ ...bannerForm, sort_order: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-xl border border-border text-sm bg-background" />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Starts At</label>
                      <input type="date" value={bannerForm.starts_at} onChange={(e) => setBannerForm({ ...bannerForm, starts_at: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border text-sm bg-background" />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Ends At</label>
                      <input type="date" value={bannerForm.ends_at} onChange={(e) => setBannerForm({ ...bannerForm, ends_at: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border text-sm bg-background" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={bannerForm.is_active} onChange={(e) => setBannerForm({ ...bannerForm, is_active: e.target.checked })} className="rounded" />
                    Active
                  </label>
                  <div className="flex gap-3 pt-4">
                    <button onClick={saveBanner} disabled={savingBanner} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50">
                      {savingBanner ? "Saving..." : editingBanner ? "Update" : "Create"}
                    </button>
                    <button onClick={() => setShowBannerForm(false)} className="px-6 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-secondary">Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {banners.map(b => (
              <div key={b.id} className="bg-card rounded-2xl shadow-soft overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  {b.image_url ? (
                    <img src={b.image_url} alt={b.title} className="w-24 h-14 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-24 h-14 rounded-lg bg-secondary flex items-center justify-center shrink-0"><Image className="w-6 h-6 text-muted-foreground" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-sm truncate">{b.title}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${b.is_active ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                        {b.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {b.subtitle && <p className="text-xs text-muted-foreground truncate">{b.subtitle}</p>}
                    <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                      {b.link_url && <span>→ {b.link_url}</span>}
                      {b.starts_at && <span>From: {format(new Date(b.starts_at), "dd MMM")}</span>}
                      {b.ends_at && <span>Until: {format(new Date(b.ends_at), "dd MMM")}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => toggleBanner(b.id, b.is_active)} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground">
                      {b.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={() => openBannerEdit(b)} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteConfirm({ open: true, type: "banner", id: b.id, name: b.title })} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
            {banners.length === 0 && <p className="text-center py-8 text-sm text-muted-foreground">No banners yet. Create one to promote offers!</p>}
          </div>
        </div>
      )}

      {/* Notifications */}
      {activeSection === "notifications" && (
        <div className="space-y-6">
          <div className="bg-card rounded-2xl p-6 shadow-soft">
            <div className="flex items-center gap-3 mb-1">
              <Mail className="w-5 h-5 text-primary" />
              <h3 className="font-display font-semibold text-lg">📧 Email Notifications</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Control which order status updates trigger an email to the customer. When enabled, customers receive a beautifully formatted email whenever the order status changes.
            </p>

            <div className="bg-muted/30 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">How it works</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    When you change an order's status (e.g., from "Placed" to "Baking"), if that status is enabled below, the customer gets an email with the update, order details, and items summary.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {Object.entries(EMAIL_STATUS_CONFIG).map(([status, cfg]) => {
                const isEnabled = emailSettings[status] !== false;
                return (
                  <div key={status} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isEnabled ? "border-primary/20 bg-primary/5" : "border-border bg-card"}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{cfg.emoji}</span>
                      <div>
                        <p className="text-sm font-semibold">{cfg.label}</p>
                        <p className="text-xs text-muted-foreground">{cfg.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => sendTestEmail(status)}
                        disabled={testingEmail === status}
                        className="px-3 py-1.5 rounded-lg text-xs border border-border hover:bg-secondary transition-colors disabled:opacity-50 flex items-center gap-1.5"
                        title="Send test email to your admin email"
                      >
                        <Send className="w-3 h-3" />
                        {testingEmail === status ? "Sending..." : "Test"}
                      </button>
                      <button
                        onClick={() => toggleEmailStatus(status)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${isEnabled ? "bg-primary" : "bg-muted-foreground/30"}`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Shared Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, open }))}
        title={`Delete ${deleteConfirm.type === "config" ? "Config Item" : deleteConfirm.type === "coupon" ? "Coupon" : "Banner"}`}
        description={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
