import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star, Trash2, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ReviewRow {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  created_at: string;
  user_id: string;
  product_id: string;
  order_id: string;
  product_name?: string;
  user_name?: string;
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<ReviewRow | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) { setLoading(false); return; }

    // Fetch product names & user names
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

  const filtered = reviews.filter(r => {
    if (ratingFilter !== "all" && r.rating !== Number(ratingFilter)) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (r.product_name || "").toLowerCase().includes(q) ||
        (r.user_name || "").toLowerCase().includes(q) ||
        (r.title || "").toLowerCase().includes(q) ||
        (r.comment || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Reviews</h1>
        <p className="text-sm text-muted-foreground">Manage customer reviews</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-card shadow-soft">
          <p className="text-xs text-muted-foreground">Total Reviews</p>
          <p className="text-2xl font-bold">{reviews.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-card shadow-soft">
          <p className="text-xs text-muted-foreground">Avg Rating</p>
          <p className="text-2xl font-bold flex items-center gap-1">{avgRating} <Star className="w-4 h-4 fill-accent text-accent" /></p>
        </div>
        <div className="p-4 rounded-2xl bg-card shadow-soft">
          <p className="text-xs text-muted-foreground">5-Star</p>
          <p className="text-2xl font-bold text-green-600">{reviews.filter(r => r.rating === 5).length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-card shadow-soft">
          <p className="text-xs text-muted-foreground">1-Star</p>
          <p className="text-2xl font-bold text-red-500">{reviews.filter(r => r.rating === 1).length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by product, customer, or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-[140px]">
            <Filter className="w-4 h-4 mr-1" />
            <SelectValue placeholder="All ratings" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
            <SelectItem value="4">4 Stars</SelectItem>
            <SelectItem value="3">3 Stars</SelectItem>
            <SelectItem value="2">2 Stars</SelectItem>
            <SelectItem value="1">1 Star</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reviews list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-28 bg-secondary animate-pulse rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No reviews found</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="p-4 rounded-2xl bg-card shadow-soft flex gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? "fill-accent text-accent" : "text-border"}`} />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(r.created_at), "dd MMM yyyy")}
                  </span>
                </div>
                <p className="text-sm font-medium truncate">{r.product_name}</p>
                <p className="text-xs text-muted-foreground mb-1">by {r.user_name}</p>
                {r.title && <p className="text-sm font-medium">{r.title}</p>}
                {r.comment && <p className="text-sm text-muted-foreground line-clamp-2">{r.comment}</p>}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => setDeleteTarget(r)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Review"
        description={`Delete the review by "${deleteTarget?.user_name}" on "${deleteTarget?.product_name}"? This cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
}
