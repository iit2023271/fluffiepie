import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, X, Upload, Search } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

const emptyProduct = {
  name: "", slug: "", description: "", category: "Classic", occasion: [] as string[],
  flavour: "Vanilla", base_price: 0, weights: [{ label: "500g", price: 0 }] as { label: string; price: number }[],
  is_new: false, is_bestseller: false, is_active: true, image_url: null as string | null,
};

const categoryOptions = ["Classic", "Premium", "Chocolate", "Fruit"];
const occasionOptions = ["Birthday", "Wedding", "Anniversary", "Custom"];
const flavourOptions = ["Chocolate", "Vanilla", "Red Velvet", "Butterscotch", "Strawberry", "Mango", "Blueberry", "Pineapple"];

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const openCreate = () => {
    setEditing(null);
    setForm(emptyProduct);
    setImageFile(null);
    setShowForm(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product.id);
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description,
      category: product.category,
      occasion: product.occasion || [],
      flavour: product.flavour,
      base_price: product.base_price,
      weights: (product.weights as any) || [{ label: "500g", price: 0 }],
      is_new: product.is_new,
      is_bestseller: product.is_bestseller,
      is_active: product.is_active,
      image_url: product.image_url,
    });
    setImageFile(null);
    setShowForm(true);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return form.image_url;
    const ext = imageFile.name.split(".").pop();
    const path = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, imageFile);
    if (error) { toast.error("Image upload failed"); return form.image_url; }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!form.name || !form.slug) { toast.error("Name and slug are required"); return; }
    setSaving(true);

    const imageUrl = await uploadImage();

    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description,
      category: form.category,
      occasion: form.occasion,
      flavour: form.flavour,
      base_price: form.base_price,
      weights: form.weights as any,
      is_new: form.is_new,
      is_bestseller: form.is_bestseller,
      is_active: form.is_active,
      image_url: imageUrl,
    };

    if (editing) {
      const { error } = await supabase.from("products").update(payload).eq("id", editing);
      if (error) toast.error("Failed to update product");
      else toast.success("Product updated!");
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) toast.error(error.message);
      else toast.success("Product created!");
    }

    setSaving(false);
    setShowForm(false);
    loadProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Product deleted"); loadProducts(); }
  };

  const toggleOccasion = (occ: string) => {
    setForm((f) => ({
      ...f,
      occasion: f.occasion.includes(occ) ? f.occasion.filter((o) => o !== occ) : [...f.occasion, occ],
    }));
  };

  const updateWeight = (index: number, field: "label" | "price", value: string | number) => {
    setForm((f) => {
      const weights = [...f.weights];
      weights[index] = { ...weights[index], [field]: value };
      return { ...f, weights };
    });
  };

  const addWeight = () => setForm((f) => ({ ...f, weights: [...f.weights, { label: "", price: 0 }] }));
  const removeWeight = (i: number) => setForm((f) => ({ ...f, weights: f.weights.filter((_, idx) => idx !== i) }));

  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !categoryFilter || p.category === categoryFilter;
    const matchStatus = !statusFilter || 
      (statusFilter === "active" && p.is_active) || 
      (statusFilter === "inactive" && !p.is_active) ||
      (statusFilter === "bestseller" && p.is_bestseller) ||
      (statusFilter === "new" && p.is_new);
    return matchSearch && matchCategory && matchStatus;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold">Products</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary"
        />
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50 flex items-start justify-center pt-10 px-4 overflow-y-auto">
          <div className="bg-card rounded-2xl shadow-elevated w-full max-w-2xl p-6 mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-bold">{editing ? "Edit Product" : "New Product"}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-secondary rounded-full"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              {/* Name & Slug */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">Product Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: editing ? form.slug : generateSlug(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Slug *</label>
                  <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium mb-1 block">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary resize-none" />
              </div>

              {/* Image */}
              <div>
                <label className="text-xs font-medium mb-1 block">Product Image</label>
                <div className="flex items-center gap-3">
                  {(form.image_url || imageFile) && (
                    <img src={imageFile ? URL.createObjectURL(imageFile) : form.image_url!} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
                  )}
                  <label className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm cursor-pointer hover:bg-secondary">
                    <Upload className="w-4 h-4" /> Upload Image
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
              </div>

              {/* Category, Flavour, Price */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm bg-background">
                    {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Flavour</label>
                  <select value={form.flavour} onChange={(e) => setForm({ ...form, flavour: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm bg-background">
                    {flavourOptions.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Base Price (₹)</label>
                  <input type="number" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>

              {/* Occasions */}
              <div>
                <label className="text-xs font-medium mb-1 block">Occasions</label>
                <div className="flex flex-wrap gap-2">
                  {occasionOptions.map((occ) => (
                    <button key={occ} type="button" onClick={() => toggleOccasion(occ)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        form.occasion.includes(occ) ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                      }`}>
                      {occ}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weights */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium">Weight Variants</label>
                  <button type="button" onClick={addWeight} className="text-xs text-primary hover:underline">+ Add variant</button>
                </div>
                <div className="space-y-2">
                  {form.weights.map((w, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input placeholder="e.g. 500g" value={w.label} onChange={(e) => updateWeight(i, "label", e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary" />
                      <input type="number" placeholder="Price" value={w.price} onChange={(e) => updateWeight(i, "price", parseInt(e.target.value) || 0)}
                        className="w-24 px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary" />
                      {form.weights.length > 1 && (
                        <button onClick={() => removeWeight(i)} className="p-1 text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.is_new} onChange={(e) => setForm({ ...form, is_new: e.target.checked })} className="rounded" />
                  New
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.is_bestseller} onChange={(e) => setForm({ ...form, is_bestseller: e.target.checked })} className="rounded" />
                  Bestseller
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50">
                  {saving ? "Saving..." : editing ? "Update Product" : "Create Product"}
                </button>
                <button onClick={() => setShowForm(false)}
                  className="px-6 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-secondary">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-16 bg-secondary rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="bg-card rounded-2xl shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Product</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Category</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Price</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-xs text-muted-foreground">🧁</div>
                        )}
                        <div>
                          <p className="text-sm font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.flavour}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{product.category}</td>
                    <td className="px-4 py-3 text-sm font-medium">₹{product.base_price}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex gap-1">
                        {product.is_active ? (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">Active</span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-destructive/10 text-destructive">Inactive</span>
                        )}
                        {product.is_bestseller && <span className="px-2 py-0.5 text-xs rounded-full bg-accent/10 text-accent">Best</span>}
                        {product.is_new && <span className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground">New</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(product)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">No products found.</div>
          )}
        </div>
      )}
    </div>
  );
}
