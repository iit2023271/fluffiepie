import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { MapPin, Plus, Trash2, Edit2, Check, Home, Briefcase, Star } from "lucide-react";

interface Address {
  id: string;
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
  pincode: string;
  label: string;
  is_default: boolean;
}

interface SavedAddressesProps {
  mode?: "manage" | "select";
  onSelect?: (address: Address) => void;
  selectedId?: string | null;
}

const labelIcons: Record<string, any> = {
  Home: Home,
  Work: Briefcase,
  Other: MapPin,
};

export default function SavedAddresses({ mode = "manage", onSelect, selectedId }: SavedAddressesProps) {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: "", phone: "", address_line: "", city: "", pincode: "", label: "Home", is_default: false,
  });

  useEffect(() => {
    if (user) loadAddresses();
  }, [user]);

  const loadAddresses = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user!.id)
      .order("is_default", { ascending: false });
    if (data) setAddresses(data);
    setLoading(false);
  };

  const resetForm = () => {
    setForm({ full_name: "", phone: "", address_line: "", city: "", pincode: "", label: "Home", is_default: false });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.full_name || !form.phone || !form.address_line || !form.city || !form.pincode) {
      toast.error("Please fill all fields");
      return;
    }

    // If setting as default, unset others first
    if (form.is_default) {
      await supabase.from("addresses").update({ is_default: false }).eq("user_id", user!.id);
    }

    if (editingId) {
      const { error } = await supabase.from("addresses").update({ ...form }).eq("id", editingId);
      if (error) { toast.error("Failed to update address"); return; }
      toast.success("Address updated");
    } else {
      const { error } = await supabase.from("addresses").insert({ ...form, user_id: user!.id });
      if (error) { toast.error("Failed to save address"); return; }
      toast.success("Address saved");
    }

    resetForm();
    loadAddresses();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("addresses").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Address deleted");
    loadAddresses();
  };

  const startEdit = (addr: Address) => {
    setForm({
      full_name: addr.full_name,
      phone: addr.phone,
      address_line: addr.address_line,
      city: addr.city,
      pincode: addr.pincode,
      label: addr.label,
      is_default: addr.is_default,
    });
    setEditingId(addr.id);
    setShowForm(true);
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-secondary" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {addresses.length === 0 && !showForm && (
        <p className="text-sm text-muted-foreground text-center py-4">No saved addresses yet</p>
      )}

      {addresses.map((addr) => {
        const LabelIcon = labelIcons[addr.label] || MapPin;
        const isSelected = mode === "select" && selectedId === addr.id;

        return (
          <div
            key={addr.id}
            onClick={() => mode === "select" && onSelect?.(addr)}
            className={`p-4 rounded-xl border transition-colors ${
              isSelected
                ? "border-primary bg-primary/5"
                : mode === "select"
                ? "border-border hover:border-primary/50 cursor-pointer"
                : "border-border"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {mode === "select" && (
                  <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? "border-primary bg-primary" : "border-border"
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <LabelIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase">{addr.label}</span>
                    {addr.is_default && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">Default</span>
                    )}
                  </div>
                  <p className="text-sm font-medium">{addr.full_name}</p>
                  <p className="text-sm text-muted-foreground">{addr.address_line}, {addr.city} - {addr.pincode}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{addr.phone}</p>
                </div>
              </div>
              {mode === "manage" && (
                <div className="flex items-center gap-1">
                  <button onClick={() => startEdit(addr)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                    <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button onClick={() => handleDelete(addr.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {showForm && (
        <div className="p-4 rounded-xl border border-border space-y-3">
          <div className="flex gap-2">
            {["Home", "Work", "Other"].map((lbl) => (
              <button
                key={lbl}
                onClick={() => setForm({ ...form, label: lbl })}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  form.label === lbl ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-primary/10"
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Full Name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="col-span-2 px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary" />
            <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="col-span-2 px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary" />
            <input placeholder="Address" value={form.address_line} onChange={(e) => setForm({ ...form, address_line: e.target.value })}
              className="col-span-2 px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary" />
            <input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary" />
            <input placeholder="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })}
              className="px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
              className="rounded border-border" />
            Set as default address
          </label>
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90">
              {editingId ? "Update" : "Save"}
            </button>
            <button onClick={resetForm} className="px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => { resetForm(); setShowForm(true); }}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors ${showForm ? "hidden" : ""}`}
      >
        <Plus className="w-4 h-4" /> Add New Address
      </button>
    </div>
  );
}
