import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, X, Upload, Search, AlertTriangle, Package, Crop, Download } from "lucide-react";
import { format } from "date-fns";
import Pagination from "@/components/Pagination";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { useStoreConfig, BUILTIN_FILTER_TYPES } from "@/hooks/useStoreConfig";
import { Badge } from "@/components/ui/badge";
import ImageCropper from "@/components/admin/ImageCropper";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

const ITEMS_PER_PAGE = 10;

type Product = Tables<"products">;

const emptyProduct = {
  name: "", slug: "", description: "", category: "", occasion: [] as string[],
  flavour: "", base_price: 0, weights: [{ label: "500g", price: 0 }] as { label: string; price: number }[],
  is_new: false, is_bestseller: false, is_active: true, image_url: null as string | null,
  images: [] as string[],
  stock_quantity: 100, low_stock_threshold: 10, sku: "",
  custom_attributes: {} as Record<string, string | string[]>,
};

export default function AdminProducts() {
  const { categories: categoryOptions, flavours: flavourOptions, occasions: occasionOptions, filterSections, customSectionDefs } = useStoreConfig();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pendingAdditionalFiles, setPendingAdditionalFiles] = useState<File[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [cropTarget, setCropTarget] = useState<"main" | "additional">("main");
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: "", name: "" });

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
    setPendingAdditionalFiles([]);
    setShowForm(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product.id);
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description,
      category: product.category || "",
      occasion: product.occasion || [],
      flavour: product.flavour || "",
      base_price: product.base_price,
      weights: (product.weights as any) || [{ label: "500g", price: 0 }],
      is_new: product.is_new,
      is_bestseller: product.is_bestseller,
      is_active: product.is_active,
      image_url: product.image_url,
      images: (product as any).images || [],
      stock_quantity: (product as any).stock_quantity ?? 100,
      low_stock_threshold: (product as any).low_stock_threshold ?? 10,
      sku: (product as any).sku || "",
      custom_attributes: ((product as any).custom_attributes as Record<string, string | string[]>) || {},
    });
    setImageFile(null);
    setPendingAdditionalFiles([]);
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

  const uploadSingleFile = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) { toast.error("Additional image upload failed"); return null; }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleAddAdditionalImage = (file: File) => {
    setCropSrc(URL.createObjectURL(file));
    setCropTarget("additional");
    setShowCropper(true);
  };

  const removeAdditionalImage = (index: number) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  };

  const handleSave = async () => {
    if (!form.name || !form.slug) { toast.error("Name and slug are required"); return; }
    setSaving(true);
    const imageUrl = await uploadImage();

    // Upload any pending additional image files
    const newImageUrls: string[] = [];
    for (const file of pendingAdditionalFiles) {
      const url = await uploadSingleFile(file);
      if (url) newImageUrls.push(url);
    }
    const allImages = [...form.images, ...newImageUrls];

    const payload: any = {
      name: form.name, slug: form.slug, description: form.description, category: form.category || "",
      occasion: form.occasion, flavour: form.flavour || "", base_price: form.base_price,
      weights: form.weights as any, is_new: form.is_new, is_bestseller: form.is_bestseller,
      is_active: form.is_active, image_url: imageUrl, images: allImages,
      stock_quantity: form.stock_quantity, low_stock_threshold: form.low_stock_threshold,
      sku: form.sku || null, custom_attributes: form.custom_attributes,
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
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Product deleted"); loadProducts(); }
  };

  const updateStock = async (id: string, newStock: number) => {
    const { error } = await supabase.from("products").update({ stock_quantity: newStock } as any).eq("id", id);
    if (error) toast.error("Failed to update stock");
    else {
      toast.success("Stock updated");
      setProducts(prev => prev.map(p => p.id === id ? { ...p, stock_quantity: newStock } as any : p));
    }
  };

  const toggleOccasion = (occ: string) => {
    setForm(f => ({ ...f, occasion: f.occasion.includes(occ) ? f.occasion.filter(o => o !== occ) : [...f.occasion, occ] }));
  };

  const updateWeight = (index: number, field: "label" | "price", value: string | number) => {
    setForm(f => { const w = [...f.weights]; w[index] = { ...w[index], [field]: value }; return { ...f, weights: w }; });
  };

  const addWeight = () => setForm(f => ({ ...f, weights: [...f.weights, { label: "", price: 0 }] }));
  const removeWeight = (i: number) => setForm(f => ({ ...f, weights: f.weights.filter((_, idx) => idx !== i) }));

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || ((p as any).sku || "").toLowerCase().includes(search.toLowerCase());
      const matchCategory = !categoryFilter || p.category === categoryFilter;
      const matchStatus = !statusFilter ||
        (statusFilter === "active" && p.is_active) ||
        (statusFilter === "inactive" && !p.is_active) ||
        (statusFilter === "bestseller" && p.is_bestseller) ||
        (statusFilter === "new" && p.is_new) ||
        (statusFilter === "low_stock" && (p as any).stock_quantity < (p as any).low_stock_threshold) ||
        (statusFilter === "out_of_stock" && (p as any).stock_quantity === 0);
      return matchSearch && matchCategory && matchStatus;
    });
  }, [products, search, categoryFilter, statusFilter]);

  useEffect(() => { setCurrentPage(1); }, [search, categoryFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const lowStockCount = products.filter(p => (p as any).stock_quantity < (p as any).low_stock_threshold).length;
  const outOfStockCount = products.filter(p => (p as any).stock_quantity === 0).length;

  const exportProductsCSV = () => {
    const rows = [["Name", "SKU", "Category", "Flavour", "Base Price", "Stock", "Status", "Bestseller", "New", "Rating", "Reviews"]];
    filtered.forEach(p => {
      rows.push([p.name, (p as any).sku || "", p.category, p.flavour, String(p.base_price), String((p as any).stock_quantity), p.is_active ? "Active" : "Inactive", p.is_bestseller ? "Yes" : "No", p.is_new ? "Yes" : "No", String(p.rating), String(p.review_count)]);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `products-${format(new Date(), "yyyy-MM-dd")}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Products exported!");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-display font-bold">Products</h1>
        <div className="flex items-center gap-2">
          <button onClick={exportProductsCSV} className="flex items-center gap-2 px-3 py-2 border border-border rounded-xl text-xs font-medium hover:bg-secondary transition-colors">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Stock alerts */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="flex gap-3 mb-4">
          {outOfStockCount > 0 && (
            <button onClick={() => setStatusFilter("out_of_stock")} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-destructive/10 border border-destructive/20 text-sm">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="font-medium text-destructive">{outOfStockCount} out of stock</span>
            </button>
          )}
          {lowStockCount > 0 && (
            <button onClick={() => setStatusFilter("low_stock")} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-accent/10 border border-accent/20 text-sm">
              <Package className="w-4 h-4 text-accent" />
              <span className="font-medium">{lowStockCount} low stock</span>
            </button>
          )}
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input placeholder="Search by name or SKU..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary bg-background" />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-border text-sm bg-background">
          <option value="">All Categories</option>
          {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-border text-sm bg-background">
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="bestseller">Bestseller</option>
          <option value="new">New</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">Product Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: editing ? form.slug : generateSlug(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary bg-background" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Slug *</label>
                  <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary bg-background" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary resize-none bg-background" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Main Image</label>
                <div className="flex items-center gap-3">
                  {(form.image_url || imageFile) && <img src={imageFile ? URL.createObjectURL(imageFile) : form.image_url!} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />}
                  <label className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm cursor-pointer hover:bg-secondary">
                    <Upload className="w-4 h-4" /> Upload Main Image
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setCropSrc(URL.createObjectURL(file));
                        setCropTarget("main");
                        setShowCropper(true);
                      }
                    }} />
                  </label>
                  {imageFile && (
                    <button onClick={() => { setCropSrc(URL.createObjectURL(imageFile)); setCropTarget("main"); setShowCropper(true); }} className="flex items-center gap-1 px-3 py-2 border border-border rounded-xl text-sm hover:bg-secondary">
                      <Crop className="w-4 h-4" /> Crop
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Additional Images</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.images.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt={`Additional ${i + 1}`} className="w-16 h-16 rounded-lg object-cover" />
                      <button onClick={() => removeAdditionalImage(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {pendingAdditionalFiles.map((file, i) => (
                    <div key={`pending-${i}`} className="relative group">
                      <img src={URL.createObjectURL(file)} alt={`Pending ${i + 1}`} className="w-16 h-16 rounded-lg object-cover opacity-70" />
                      <button onClick={() => setPendingAdditionalFiles(f => f.filter((_, idx) => idx !== i))} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <label className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm cursor-pointer hover:bg-secondary">
                  <Plus className="w-4 h-4" /> Add Image
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleAddAdditionalImage(file);
                    }
                  }} />
                </label>
                <p className="text-xs text-muted-foreground mt-1">Add multiple angles or close-up shots</p>
              </div>
                <ImageCropper
                  open={showCropper}
                  imageSrc={cropSrc || ""}
                  aspect={1}
                  onClose={() => setShowCropper(false)}
                  onCropComplete={(blob) => {
                    const file = new File([blob], `product-${Date.now()}.jpg`, { type: "image/jpeg" });
                    if (cropTarget === "main") {
                      setImageFile(file);
                    } else {
                      setPendingAdditionalFiles(prev => [...prev, file]);
                    }
                    setShowCropper(false);
                  }}
                />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-border text-sm bg-background">
                    <option value="">None</option>
                    {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Flavour</label>
                  <select value={form.flavour} onChange={(e) => setForm({ ...form, flavour: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-border text-sm bg-background">
                    <option value="">None</option>
                    {flavourOptions.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Base Price (₹)</label>
                  <input type="number" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary bg-background" />
                </div>
              </div>

              {/* SKU & Stock */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">SKU</label>
                  <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="e.g. CAKE-001"
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary bg-background" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Stock Quantity</label>
                  <input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary bg-background" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Low Stock Alert</label>
                  <input type="number" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary bg-background" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">Occasions</label>
                <div className="flex flex-wrap gap-2">
                  {occasionOptions.map(occ => (
                    <button key={occ} type="button" onClick={() => toggleOccasion(occ)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${form.occasion.includes(occ) ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                      {occ}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom filter sections */}
              {customSectionDefs.map(def => {
                const sectionValues = filterSections.find(s => s.type === def.type)?.values || [];
                if (!sectionValues.length) return null;
                const currentVal = form.custom_attributes[def.type];

                if (def.isMulti) {
                  const selected = Array.isArray(currentVal) ? currentVal : [];
                  return (
                    <div key={def.type}>
                      <label className="text-xs font-medium mb-1 block">{def.label}</label>
                      <div className="flex flex-wrap gap-2">
                        {sectionValues.map(val => (
                          <button key={val} type="button" onClick={() => {
                            const newSel = selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val];
                            setForm(f => ({ ...f, custom_attributes: { ...f.custom_attributes, [def.type]: newSel } }));
                          }}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${selected.includes(val) ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div key={def.type}>
                      <label className="text-xs font-medium mb-1 block">{def.label}</label>
                      <select value={(currentVal as string) || ""} onChange={(e) => setForm(f => ({ ...f, custom_attributes: { ...f.custom_attributes, [def.type]: e.target.value } }))}
                        className="w-full max-w-xs px-3 py-2 rounded-xl border border-border text-sm bg-background">
                        <option value="">None</option>
                        {sectionValues.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  );
                }
              })}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium">Weight Variants</label>
                  <button type="button" onClick={addWeight} className="text-xs text-primary hover:underline">+ Add variant</button>
                </div>
                <div className="space-y-2">
                  {form.weights.map((w, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input placeholder="e.g. 500g" value={w.label} onChange={(e) => updateWeight(i, "label", e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary bg-background" />
                      <input type="number" placeholder="Price" value={w.price} onChange={(e) => updateWeight(i, "price", parseInt(e.target.value) || 0)}
                        className="w-24 px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-primary bg-background" />
                      {form.weights.length > 1 && <button onClick={() => removeWeight(i)} className="p-1 text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-6">
                {[
                  { key: "is_active", label: "Active" },
                  { key: "is_new", label: "New" },
                  { key: "is_bestseller", label: "Bestseller" },
                ].map(toggle => (
                  <label key={toggle.key} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={(form as any)[toggle.key]} onChange={(e) => setForm({ ...form, [toggle.key]: e.target.checked })} className="rounded" />
                    {toggle.label}
                  </label>
                ))}
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50">
                  {saving ? "Saving..." : editing ? "Update Product" : "Create Product"}
                </button>
                <button onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-secondary rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="bg-card rounded-2xl shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Product</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Category</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Price</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Stock</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((product) => {
                  const stock = (product as any).stock_quantity ?? 0;
                  const threshold = (product as any).low_stock_threshold ?? 10;
                  const isLow = stock > 0 && stock < threshold;
                  const isOut = stock === 0;

                  return (
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
                            <p className="text-xs text-muted-foreground">{product.flavour}{(product as any).sku ? ` · ${(product as any).sku}` : ""}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{product.category}</td>
                      <td className="px-4 py-3 text-sm font-medium">₹{product.base_price}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <input type="number" value={stock} onChange={(e) => updateStock(product.id, parseInt(e.target.value) || 0)}
                            className={`w-16 px-2 py-1 rounded-lg border text-xs text-center ${isOut ? "border-destructive bg-destructive/5" : isLow ? "border-accent bg-accent/5" : "border-border"}`} />
                          {isOut && <AlertTriangle className="w-3.5 h-3.5 text-destructive" />}
                          {isLow && !isOut && <AlertTriangle className="w-3.5 h-3.5 text-accent" />}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex gap-1">
                          {product.is_active ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">Active</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-muted-foreground">Inactive</span>
                          )}
                          {product.is_bestseller && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent/10 text-accent">Best</span>}
                          {product.is_new && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">New</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(product)} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteConfirm({ open: true, id: product.id, name: product.name })} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-border">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filtered.length} itemsPerPage={ITEMS_PER_PAGE} />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, open }))}
        title="Delete Product"
        description={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => { handleDelete(deleteConfirm.id); setDeleteConfirm({ open: false, id: "", name: "" }); }}
      />
    </div>
  );
}
