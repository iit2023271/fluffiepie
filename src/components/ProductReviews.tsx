import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Star, User } from "lucide-react";
import { format } from "date-fns";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  created_at: string;
  profiles: { full_name: string | null } | null;
}

export default function ProductReviews({ productId }: { productId: string }) {
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

      // Fetch profile names for reviewers
      const userIds = [...new Set(data.map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) || []);

      return data.map((r) => ({
        ...r,
        profiles: { full_name: profileMap.get(r.user_id) || null },
      }));
    },
  });

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

  // Rating distribution
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
              <Star
                key={s}
                className={`w-4 h-4 ${s <= Math.round(avgRating) ? "fill-accent text-accent" : "text-border"}`}
              />
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
                <div
                  className="h-full bg-accent rounded-full transition-all"
                  style={{ width: `${reviews.length ? (count / reviews.length) * 100 : 0}%` }}
                />
              </div>
              <span className="w-6 text-xs text-muted-foreground text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Individual reviews */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="p-4 rounded-xl bg-card shadow-soft">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {review.profiles?.full_name || "Anonymous"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(review.created_at), "dd MMM yyyy")}
                  </p>
                </div>
              </div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${s <= review.rating ? "fill-accent text-accent" : "text-border"}`}
                  />
                ))}
              </div>
            </div>
            {review.title && <p className="font-medium text-sm mb-1">{review.title}</p>}
            {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
