import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, X, Trash2, Tag, Layers, Palette, Calendar, Pencil } from "lucide-react";
import { toast } from "sonner";

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

const configSections = [
  { type: "category", label: "Categories", icon: Layers, description: "Product categories like Classic, Premium, etc." },
  { type: "flavour", label: "Flavours", icon: Palette, description: "Available cake flavours" },
  { type: "occasion", label: "Occasions", icon: Calendar, description: "Special occasions for cakes" },
];

const emptyCoupon = {
  code: "", discount_type: "percentage", discount_value: 10, min_order_amount: 0,
  max_discount: null as number | null, is_active: true, usage_limit: null as number | null,
  expires_at: "",
};

export default function AdminSettings() {
  const [configItems, setConfigItems] = useState<ConfigItem[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [newValues, setNewValues] = useState<Record<string, string>>({ category: "", flavour: "", occasion: "" });
  const [activeSection, setActiveSection] = useState<"config" | "coupons">("config");
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponForm, setCouponForm] = useState(emptyCoupon);
  const [editingCoupon, setEditingCoupon] = useState<string | null>(null);
  const [savingCoupon, setSavingCoupon] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [configRes, couponRes] = await Promise.all([
      supabase.from("store_config").select("*").order("sort_order", { ascending: true }),
      supabase.from("coupons").select("*").order("created_at", { ascending: false }),
    ]);
    if (configRes.data) setConfigItems(configRes.data as ConfigItem[]);
    if (couponRes.data) setCoupons(couponRes.data as Coupon[]);
    setLoading(false);
  };

  const addConfigItem = async (type: string) => {
    const val = newValues[type]?.trim();
    if (!val) { toast.error("Enter a value"); return; }
    const maxOrder = configItems.filter(c => c.config_type === type).reduce((m, c) => Math.max(m, c.sort_order), 0);
    const { error } = await supabase.from("store_config").insert({
      config_type: type, value: val, sort_order: maxOrder + 1,
    });
    if (error) {
      if (error.code === "23505") toast.error("Already exists");
      else toast.error("Failed to add");
      return;
    }
    toast.success(`${val} added!`);
    setNewValues(prev => ({ ...prev, [type]: "" }));
    loadAll();
  };

  const toggleConfig = async (id: string, active: boolean) => {
    const { error } = await supabase.from("store_config").update({ is_active: !active }).eq("id", id);
    if (error) toast.error("Failed to update");
    else loadAll();
  };

  const deleteConfig = async (id: string, value: string) => {
    if (!confirm(`Delete "${value}"? Products using this will keep their existing value.`)) return;
    const { error } = await supabase.from("store_config").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Deleted"); loadAll(); }
  };

  const openCouponCreate = () => {
    setEditingCoupon(null);
    setCouponForm(emptyCoupon);
    setShowCouponForm(true);
  };

  const openCouponEdit = (c: Coupon) => {
    setEditingCoupon(c.id);
    setCouponForm({
      code: c.code,
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      min_order_amount: c.min_order_amount,
      max_discount: c.max_discount,
      is_active: c.is_active,
      usage_limit: c.usage_limit,
      expires_at: c.expires_at ? c.expires_at.split("T")[0] : "",
    });
    setShowCouponForm(true);
  };

  const saveCoupon = async () => {
    if (!couponForm.code.trim()) { toast.error("Coupon code is required"); return; }
    setSavingCoupon(true);

    const payload: any = {
      code: couponForm.code.toUpperCase().trim(),
      discount_type: couponForm.discount_type,
      discount_value: couponForm.discount_value,
      min_order_amount: couponForm.min_order_amount,
      max_discount: couponForm.max_discount || null,
      is_active: couponForm.is_active,
      usage_limit: couponForm.usage_limit || null,
      expires_at: couponForm.expires_at ? new Date(couponForm.expires_at).toISOString() : null,
    };

    if (editingCoupon) {
      const { error } = await supabase.from("coupons").update(payload).eq("id", editingCoupon);
      if (error) toast.error("Failed to update coupon");
      else toast.success("Coupon updated!");
    } else {
      const { error } = await supabase.from("coupons").insert(payload);
      if (error) {
        if (error.code === "23505") toast.error("Coupon code already exists");
        else toast.error("Failed to create coupon");
      } else toast.success("Coupon created!");
    }

    setSavingCoupon(false);
    setShowCouponForm(false);
    loadAll();
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Coupon deleted"); loadAll(); }
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

      {/* Sub-tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveSection("config")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeSection === "config" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-primary/10"
          }`}
        >
          Store Config
        </button>
        <button
          onClick={() => setActiveSection("coupons")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
            activeSection === "coupons" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-primary/10"
          }`}
        >
          <Tag className="w-4 h-4" /> Coupons
        </button>
      </div>

      {activeSection === "config" && (
        <div className="space-y-6">
          {configSections.map((section) => {
            const items = configItems.filter(c => c.config_type === section.type);
            return (
              <div key={section.type} className="bg-card rounded-2xl p-6 shadow-soft">
                <div className="flex items-center gap-3 mb-1">
                  <section.icon className="w-5 h-5 text-primary" />
                  <h3 className="font-display font-semibold text-lg">{section.label}</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-4">{section.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        item.is_active
                          ? "border-primary/30 bg-primary/5 text-foreground"
                          : "border-border bg-secondary/50 text-muted-foreground line-through"
                      }`}
                    >
                      <span>{item.value}</span>
                      <button
                        onClick={() => toggleConfig(item.id, item.is_active)}
                        className={`w-4 h-4 rounded-full border-2 transition-colors ${
                          item.is_active ? "border-primary bg-primary" : "border-muted-foreground"
                        }`}
                        title={item.is_active ? "Deactivate" : "Activate"}
                      />
                      <button onClick={() => deleteConfig(item.id, item.value)} className="text-muted-foreground hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {items.length === 0 && <p className="text-sm text-muted-foreground">No items yet.</p>}
                </div>

                <div className="flex gap-2">
                  <input
                    placeholder={`Add new ${section.type}...`}
                    value={newValues[section.type] || ""}
                    onChange={(e) => setNewValues(prev => ({ ...prev, [section.type]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && addConfigItem(section.type)}
                    className="flex-1 max-w-xs px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary"
                  />
                  <button
                    onClick={() => addConfigItem(section.type)}
                    className="flex items-center gap-1 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeSection === "coupons" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">{coupons.length} coupon(s)</p>
            <button onClick={openCouponCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90">
              <Plus className="w-4 h-4" /> New Coupon
            </button>
          </div>

          {/* Coupon Form Modal */}
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
                    <input value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                      placeholder="e.g. SWEET20"
                      className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary uppercase" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1 block">Discount Type</label>
                      <select value={couponForm.discount_type} onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border text-sm bg-background">
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount (₹)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">
                        Discount Value {couponForm.discount_type === "percentage" ? "(%)" : "(₹)"}
                      </label>
                      <input type="number" value={couponForm.discount_value}
                        onChange={(e) => setCouponForm({ ...couponForm, discount_value: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1 block">Min Order Amount (₹)</label>
                      <input type="number" value={couponForm.min_order_amount}
                        onChange={(e) => setCouponForm({ ...couponForm, min_order_amount: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Max Discount (₹)</label>
                      <input type="number" value={couponForm.max_discount ?? ""}
                        onChange={(e) => setCouponForm({ ...couponForm, max_discount: e.target.value ? parseInt(e.target.value) : null })}
                        placeholder="No limit"
                        className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1 block">Usage Limit</label>
                      <input type="number" value={couponForm.usage_limit ?? ""}
                        onChange={(e) => setCouponForm({ ...couponForm, usage_limit: e.target.value ? parseInt(e.target.value) : null })}
                        placeholder="Unlimited"
                        className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Expires At</label>
                      <input type="date" value={couponForm.expires_at}
                        onChange={(e) => setCouponForm({ ...couponForm, expires_at: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary" />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={couponForm.is_active}
                      onChange={(e) => setCouponForm({ ...couponForm, is_active: e.target.checked })} className="rounded" />
                    Active
                  </label>

                  <div className="flex gap-3 pt-4">
                    <button onClick={saveCoupon} disabled={savingCoupon}
                      className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50">
                      {savingCoupon ? "Saving..." : editingCoupon ? "Update Coupon" : "Create Coupon"}
                    </button>
                    <button onClick={() => setShowCouponForm(false)}
                      className="px-6 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-secondary">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Coupons List */}
          <div className="space-y-3">
            {coupons.map((c) => (
              <div key={c.id} className="bg-card rounded-2xl p-5 shadow-soft">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-lg">{c.code}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        c.is_active ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                      }`}>
                        {c.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {c.discount_type === "percentage" ? `${c.discount_value}% off` : `₹${c.discount_value} off`}
                      {c.max_discount && ` (max ₹${c.max_discount})`}
                      {c.min_order_amount > 0 && ` • Min order ₹${c.min_order_amount}`}
                    </p>
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                      {c.usage_limit && <span>Used: {c.used_count}/{c.usage_limit}</span>}
                      {c.expires_at && <span>Expires: {new Date(c.expires_at).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openCouponEdit(c)} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteCoupon(c.id)} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {coupons.length === 0 && <p className="text-center py-10 text-sm text-muted-foreground">No coupons yet.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
