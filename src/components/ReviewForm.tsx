import { useState } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface ReviewFormProps {
  productId: string;
  productName: string;
  orderId: string;
  userId: string;
  onSubmitted: () => void;
}

export default function ReviewForm({ productId, productName, orderId, userId, onSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      user_id: userId,
      product_id: productId,
      order_id: orderId,
      rating,
      title: title.trim() || null,
      comment: comment.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      console.error("Review submit error:", error.code, error.message, error.details, error.hint);
      if (error.code === "23505") {
        toast.error("You've already reviewed this product for this order");
      } else if (error.code === "42501") {
        toast.error("Permission denied. Please log in again.");
      } else if (error.code === "23503") {
        toast.error("Invalid product or order reference");
      } else {
        toast.error("Failed to submit review: " + error.message);
      }
      return;
    }
    toast.success("Review submitted!");
    onSubmitted();
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{productName}</p>
      {/* Star rating */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setRating(s)}
            onMouseEnter={() => setHoveredRating(s)}
            onMouseLeave={() => setHoveredRating(0)}
            className="p-0.5"
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                s <= (hoveredRating || rating)
                  ? "fill-accent text-accent"
                  : "text-border"
              }`}
            />
          </button>
        ))}
      </div>
      <Input
        placeholder="Review title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={100}
      />
      <Textarea
        placeholder="Share your experience..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={500}
        rows={3}
      />
      <Button onClick={handleSubmit} disabled={submitting || rating === 0} size="sm">
        {submitting ? "Submitting..." : "Submit Review"}
      </Button>
    </div>
  );
}
