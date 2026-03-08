import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export function useWishlist() {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setWishlistIds(new Set()); setLoading(false); return; }
    supabase
      .from("wishlists")
      .select("product_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setWishlistIds(new Set(data.map((w: any) => w.product_id)));
        setLoading(false);
      });
  }, [user]);

  const toggle = useCallback(async (productId: string) => {
    if (!user) return false;
    const isWishlisted = wishlistIds.has(productId);
    if (isWishlisted) {
      setWishlistIds(prev => { const next = new Set(prev); next.delete(productId); return next; });
      await supabase.from("wishlists").delete().eq("user_id", user.id).eq("product_id", productId);
    } else {
      setWishlistIds(prev => new Set([...prev, productId]));
      await supabase.from("wishlists").insert({ user_id: user.id, product_id: productId });
    }
    return !isWishlisted;
  }, [user, wishlistIds]);

  const isWishlisted = useCallback((productId: string) => wishlistIds.has(productId), [wishlistIds]);

  return { wishlistIds, isWishlisted, toggle, loading, count: wishlistIds.size };
}
