import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { products as mockProducts } from "@/data/products";
import type { Product } from "@/data/products";

// Map DB products to our Product interface, falling back to mock images
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
        // Fallback to mock data
        return mockProducts;
      }

      return data.map((p) => {
        // Find matching mock product for local image fallback
        const mock = mockProducts.find((m) => m.slug === p.slug);
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          category: p.category,
          occasion: p.occasion || [],
          flavour: p.flavour,
          image: p.image_url || mock?.image || "",
          basePrice: p.base_price,
          rating: Number(p.rating),
          reviewCount: p.review_count,
          weights: (p.weights as any) || [],
          isNew: p.is_new,
          isBestseller: p.is_bestseller,
        };
      });
    },
    staleTime: 1000 * 60 * 5,
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
        // Fallback to mock
        return mockProducts.find((m) => m.slug === slug) || null;
      }

      const mock = mockProducts.find((m) => m.slug === data.slug);
      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        category: data.category,
        occasion: data.occasion || [],
        flavour: data.flavour,
        image: data.image_url || mock?.image || "",
        basePrice: data.base_price,
        rating: Number(data.rating),
        reviewCount: data.review_count,
        weights: (data.weights as any) || [],
        isNew: data.is_new,
        isBestseller: data.is_bestseller,
      };
    },
    enabled: !!slug,
  });
}
