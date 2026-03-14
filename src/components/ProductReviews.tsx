import { useState, useEffect } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Star, User, Pencil, Trash2, X, Check } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  created_at: string;
  user_id: string;
  profiles: { full_name: string | null } | null;
}

export default function ProductReviews({ productId }: { productId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editTitle, setEditTitle] = useState("");
  const [editComment, setEditComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, rating, title, comment, created_at, user_id")
        .eq("product_id", productId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error || !data) return [];

      const userIds = [...new Set(data.map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) || []);

      return data.map((r) => ({
        ...r,
        profiles: { full_name: profileMap.get(r.user_id) || null },
      })) as Review[];
    },
  });

  // Realtime subscription for review changes
  useEffect(() => {
    const channel = supabase
      .channel(`reviews-${productId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reviews', filter: `product_id=eq.${productId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [productId, queryClient]);

  const startEdit = (review: Review) => {
    setEditingId(review.id);
    setEditRating(review.rating);
    setEditTitle(review.title || "");
    setEditComment(review.comment || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async () => {
    if (!editingId || editRating === 0) return;
    setSaving(true);
    const { error } = await supabase.from("reviews").update({
      rating: editRating,
      title: editTitle.trim() || null,
      comment: editComment.trim() || null,
    }).eq("id", editingId);
    setSaving(false);
    if (error) { toast.error("Failed to update review"); return; }
    toast.success("Review updated!");
    setEditingId(null);
    queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("reviews").delete().eq("id", deleteTarget.id);
    if (error) { toast.error("Failed to delete review"); return; }
    toast.success("Review deleted");
    setDeleteTarget(null);
    queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-secondary animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8 text-sm">
        No reviews yet. Be the first to review this product!
      </p>
    );
  }

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-start gap-8 p-5 rounded-2xl bg-card shadow-soft">
        <div className="text-center">
          <p className="text-4xl font-bold">{avgRating.toFixed(1)}</p>
          <div className="flex gap-0.5 my-1 justify-center">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={`w-4 h-4 ${s <= Math.round(avgRating) ? "fill-accent text-accent" : "text-border"}`} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{reviews.length} reviews</p>
        </div>
        <div className="flex-1 space-y-1.5">
          {distribution.map(({ star, count }) => (
            <div key={star} className="flex items-center gap-2 text-sm">
              <span className="w-3 text-muted-foreground">{star}</span>
              <Star className="w-3 h-3 fill-accent text-accent" />
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${reviews.length ? (count / reviews.length) * 100 : 0}%` }} />
              </div>
              <span className="w-6 text-xs text-muted-foreground text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Individual reviews */}
      <div className="space-y-4">
        {reviews.map((review) => {
          const isOwn = user?.id === review.user_id;
          const isEditing = editingId === review.id;

          return (
            <div key={review.id} className="p-4 rounded-xl bg-card shadow-soft">
              {isEditing ? (
                <div className="space-y-3">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} type="button" onClick={() => setEditRating(s)} className="p-0.5">
                        <Star className={`w-5 h-5 transition-colors ${s <= editRating ? "fill-accent text-accent" : "text-border"}`} />
                      </button>
                    ))}
                  </div>
                  <Input placeholder="Review title (optional)" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} maxLength={100} />
                  <Textarea placeholder="Your review..." value={editComment} onChange={(e) => setEditComment(e.target.value)} maxLength={500} rows={3} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveEdit} disabled={saving || editRating === 0} className="gap-1">
                      <Check className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEdit} className="gap-1">
                      <X className="w-3.5 h-3.5" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{review.profiles?.full_name || "Anonymous"}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(review.created_at), "dd MMM yyyy")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? "fill-accent text-accent" : "text-border"}`} />
                        ))}
                      </div>
                      {isOwn && (
                        <div className="flex gap-1 ml-2">
                          <button onClick={() => startEdit(review)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground" title="Edit">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteTarget(review)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {review.title && <p className="font-medium text-sm mb-1">{review.title}</p>}
                  {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                </>
              )}
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Review"
        description="Are you sure you want to delete your review? This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
}
