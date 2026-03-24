import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/data/products";

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error || !data || data.length === 0) {
        return [];
      }

      return data.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        category: p.category,
        occasion: p.occasion || [],
        flavour: p.flavour,
        image: p.image_url || "",
        images: (p as any).images || [],
        basePrice: p.base_price,
        originalPrice: (p as any).original_price || null,
        rating: Number(p.rating),
        reviewCount: p.review_count,
        weights: (p.weights as any) || [],
        isNew: p.is_new,
        isBestseller: p.is_bestseller,
        tags: (p as any).tags || [],
        stockQuantity: p.stock_quantity ?? 100,
        custom_attributes: (p as any).custom_attributes || {},
      }));
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useProduct(slug: string | undefined) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async (): Promise<Product | null> => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        category: data.category,
        occasion: data.occasion || [],
        flavour: data.flavour,
        image: data.image_url || "",
        images: (data as any).images || [],
        basePrice: data.base_price,
        originalPrice: (data as any).original_price || null,
        rating: Number(data.rating),
        reviewCount: data.review_count,
        weights: (data.weights as any) || [],
        isNew: data.is_new,
        isBestseller: data.is_bestseller,
        tags: (data as any).tags || [],
        stockQuantity: data.stock_quantity ?? 100,
        custom_attributes: (data as any).custom_attributes || {},
      };
    },
    enabled: !!slug,
  });
}
