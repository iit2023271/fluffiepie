import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star, Trash2, Search, Calendar as CalendarIcon, X, SortAsc, SortDesc, RefreshCw, Home } from "lucide-react";
import { toast } from "sonner";
import { format, isToday, isYesterday, startOfDay, endOfDay } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface ReviewRow {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  created_at: string;
  user_id: string;
  product_id: string;
  order_id: string;
  is_featured: boolean;
  product_name?: string;
  user_name?: string;
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [productFilter, setProductFilter] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");
  const [deleteTarget, setDeleteTarget] = useState<ReviewRow | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) { setLoading(false); return; }

    const productIds = [...new Set(data.map(r => r.product_id))];
    const userIds = [...new Set(data.map(r => r.user_id))];

    const [{ data: products }, { data: profiles }] = await Promise.all([
      supabase.from("products").select("id, name").in("id", productIds),
      supabase.from("profiles").select("user_id, full_name").in("user_id", userIds),
    ]);

    const productMap = new Map(products?.map(p => [p.id, p.name]) || []);
    const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

    setReviews(data.map(r => ({
      ...r,
      product_name: productMap.get(r.product_id) || "Unknown Product",
      user_name: profileMap.get(r.user_id) || "Anonymous",
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("reviews").delete().eq("id", deleteTarget.id);
    if (error) {
      toast.error("Failed to delete review");
      return;
    }
    toast.success("Review deleted");
    setDeleteTarget(null);
    load();
  };

  const toggleFeatured = async (review: ReviewRow) => {
    const { error } = await supabase.from("reviews").update({ is_featured: !review.is_featured }).eq("id", review.id);
    if (error) { toast.error("Failed to update"); return; }
    toast.success(review.is_featured ? "Removed from homepage" : "Added to homepage");
    setReviews(prev => prev.map(r => r.id === review.id ? { ...r, is_featured: !r.is_featured } : r));
  };

  // Unique product names for filter
  const productNames = useMemo(() => {
    const names = [...new Set(reviews.map(r => r.product_name || ""))].filter(Boolean).sort();
    return names;
  }, [reviews]);

  const filtered = useMemo(() => {
    let result = reviews.filter(r => {
      if (ratingFilter !== null && r.rating !== ratingFilter) return false;
      if (productFilter && r.product_name !== productFilter) return false;
      if (dateFrom) {
        const d = new Date(r.created_at);
        if (d < startOfDay(dateFrom)) return false;
      }
      if (dateTo) {
        const d = new Date(r.created_at);
        if (d > endOfDay(dateTo)) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        return (
          (r.product_name || "").toLowerCase().includes(q) ||
          (r.user_name || "").toLowerCase().includes(q) ||
          (r.title || "").toLowerCase().includes(q) ||
          (r.comment || "").toLowerCase().includes(q) ||
          r.order_id.toLowerCase().includes(q)
        );
      }
      return true;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "oldest": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "highest": return b.rating - a.rating || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "lowest": return a.rating - b.rating || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return result;
  }, [reviews, search, ratingFilter, productFilter, dateFrom, dateTo, sortBy]);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  const hasDateFilter = dateFrom || dateTo;
  const hasAnyFilter = search || ratingFilter !== null || productFilter || hasDateFilter;
  const clearAllFilters = () => {
    setSearch("");
    setRatingFilter(null);
    setProductFilter("");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const formatReviewDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isToday(d)) return `Today, ${format(d, "hh:mm a")}`;
    if (isYesterday(d)) return `Yesterday, ${format(d, "hh:mm a")}`;
    return format(d, "dd MMM yyyy");
  };

  // Rating distribution
  const ratingDist = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    reviews.forEach(r => { if (r.rating >= 1 && r.rating <= 5) dist[r.rating - 1]++; });
    return dist;
  }, [reviews]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Reviews</h1>
          <p className="text-sm text-muted-foreground">Manage customer reviews</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Refresh">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-card border border-border">
          <p className="text-xs text-muted-foreground">Total Reviews</p>
          <p className="text-2xl font-bold">{reviews.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-border">
          <p className="text-xs text-muted-foreground">Avg Rating</p>
          <p className="text-2xl font-bold flex items-center gap-1">{avgRating} <Star className="w-4 h-4 fill-accent text-accent" /></p>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-border col-span-2">
          <p className="text-xs text-muted-foreground mb-2">Rating Distribution</p>
          <div className="space-y-1">
            {[5, 4, 3, 2, 1].map(star => {
              const count = ratingDist[star - 1];
              const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              return (
                <button key={star} onClick={() => setRatingFilter(ratingFilter === star ? null : star)}
                  className={`w-full flex items-center gap-2 text-xs py-0.5 rounded transition-colors ${ratingFilter === star ? "bg-primary/10" : "hover:bg-secondary"}`}>
                  <span className="w-3 text-right font-medium">{star}</span>
                  <Star className="w-3 h-3 fill-accent text-accent" />
                  <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                    <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-6 text-right text-muted-foreground">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Rating pills */}
        <div className="flex gap-1">
          <button onClick={() => setRatingFilter(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${ratingFilter === null ? "bg-foreground text-background" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
            All
          </button>
          {[5, 4, 3, 2, 1].map(star => (
            <button key={star} onClick={() => setRatingFilter(ratingFilter === star ? null : star)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-0.5 ${ratingFilter === star ? "bg-accent/20 text-accent-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
              {star}<Star className="w-2.5 h-2.5 fill-accent text-accent" />
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-border" />

        {/* Product filter */}
        {productNames.length > 1 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={productFilter ? "default" : "outline"} size="sm" className="text-xs rounded-xl gap-1 h-8">
                🎂 {productFilter || "All Products"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2 max-h-60 overflow-y-auto" align="start">
              <button onClick={() => setProductFilter("")}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${!productFilter ? "bg-primary/10 text-primary" : "hover:bg-secondary"}`}>
                All Products
              </button>
              {productNames.map(name => (
                <button key={name} onClick={() => setProductFilter(productFilter === name ? "" : name)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium truncate transition-colors ${productFilter === name ? "bg-primary/10 text-primary" : "hover:bg-secondary"}`}>
                  {name}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        )}

        {/* Date range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant={dateFrom ? "default" : "outline"} size="sm" className={cn("gap-1.5 text-xs rounded-xl h-8", !dateFrom && "text-muted-foreground")}>
              <CalendarIcon className="w-3.5 h-3.5" />
              {dateFrom ? format(dateFrom, "dd MMM") : "From"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant={dateTo ? "default" : "outline"} size="sm" className={cn("gap-1.5 text-xs rounded-xl h-8", !dateTo && "text-muted-foreground")}>
              <CalendarIcon className="w-3.5 h-3.5" />
              {dateTo ? format(dateTo, "dd MMM") : "To"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className={cn("p-3 pointer-events-auto")} />
          </PopoverContent>
        </Popover>

        {/* Sort */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs rounded-xl gap-1 h-8">
              {sortBy === "newest" || sortBy === "oldest" ? <SortDesc className="w-3.5 h-3.5" /> : <SortAsc className="w-3.5 h-3.5" />}
              {sortBy === "newest" ? "Newest" : sortBy === "oldest" ? "Oldest" : sortBy === "highest" ? "Highest" : "Lowest"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-1" align="end">
            {(["newest", "oldest", "highest", "lowest"] as const).map(s => (
              <button key={s} onClick={() => setSortBy(s)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${sortBy === s ? "bg-primary/10 text-primary" : "hover:bg-secondary"}`}>
                {s === "newest" ? "📅 Newest First" : s === "oldest" ? "📅 Oldest First" : s === "highest" ? "⭐ Highest First" : "⭐ Lowest First"}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {hasAnyFilter && (
          <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground rounded-xl h-8" onClick={clearAllFilters}>
            <X className="w-3.5 h-3.5" /> Clear all
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search product, customer, comment, order ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Results count */}
      {hasAnyFilter && (
        <p className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {reviews.length} reviews
        </p>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-28 bg-secondary animate-pulse rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold mb-1">No reviews found</p>
          <p className="text-sm text-muted-foreground">
            {hasAnyFilter ? "Try adjusting your filters." : "Reviews will appear here when customers submit them."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="p-4 rounded-2xl bg-card border border-border flex gap-4 hover:shadow-md transition-shadow">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? "fill-accent text-accent" : "text-border"}`} />
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {formatReviewDate(r.created_at)}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground ml-auto hidden sm:inline">
                    #{r.order_id.slice(0, 8)}
                  </span>
                </div>
                <p className="text-sm font-semibold truncate">{r.product_name}</p>
                <p className="text-xs text-muted-foreground mb-1">by {r.user_name}</p>
                {r.title && <p className="text-sm font-medium">{r.title}</p>}
                {r.comment && <p className="text-sm text-muted-foreground line-clamp-2">{r.comment}</p>}
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <Button
                  variant={r.is_featured ? "default" : "outline"}
                  size="icon"
                  className={`active:scale-95 ${r.is_featured ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary"}`}
                  onClick={() => toggleFeatured(r)}
                  title={r.is_featured ? "Remove from homepage" : "Show on homepage"}
                >
                  <Home className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive active:scale-95"
                  onClick={() => setDeleteTarget(r)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Review"
        description={`Delete the review by "${deleteTarget?.user_name}" on "${deleteTarget?.product_name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
}
