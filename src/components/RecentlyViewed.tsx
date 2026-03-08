import { useProducts } from "@/hooks/useProducts";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import ProductCard from "@/components/ProductCard";
import { Clock } from "lucide-react";

interface Props {
  excludeId?: string;
}

export default function RecentlyViewed({ excludeId }: Props) {
  const { viewedIds } = useRecentlyViewed();
  const { data: products = [] } = useProducts();

  const recentProducts = viewedIds
    .filter((id) => id !== excludeId)
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean)
    .slice(0, 6);

  if (recentProducts.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
        <Clock className="w-5 h-5 text-primary" />
        Recently Viewed
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {recentProducts.map((product, i) => (
          <ProductCard key={product!.id} product={product!} index={i} />
        ))}
      </div>
    </section>
  );
}
