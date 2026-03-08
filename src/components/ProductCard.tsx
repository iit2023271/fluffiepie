import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Product } from "@/data/products";
import { useStoreConfig } from "@/hooks/useStoreConfig";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface Props {
  product: Product;
  index?: number;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
}

export default function ProductCard({ product, index = 0, isWishlisted = false, onToggleWishlist }: Props) {
  const { dispatch } = useCart();
  const { user } = useAuth();
  const { productTags } = useStoreConfig();
  
  // Get the product's active tag and its color
  const activeTag = product.tags?.[0];
  const tagDef = activeTag ? productTags.find(t => t.name === activeTag) : null;
  // Fallback for legacy is_bestseller/is_new
  const displayTag = tagDef || (product.isBestseller ? { name: "Bestseller", bgColor: "", textColor: "" } : product.isNew ? { name: "New", bgColor: "", textColor: "" } : null);
  const isLegacyTag = !tagDef && displayTag;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch({
      type: "ADD_ITEM",
      payload: {
        product,
        quantity: 1,
        weight: product.weights[0].label,
        price: product.weights[0].price,
      },
    });
    toast.success(`${product.name} added to cart!`);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Please sign in to save favorites");
      return;
    }
    onToggleWishlist?.(product.id);
    toast.success(isWishlisted ? "Removed from favorites" : "Added to favorites! ❤️");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link to={`/product/${product.slug}`} className="group block">
        <div className="relative rounded-2xl overflow-hidden bg-card shadow-soft hover:shadow-card transition-shadow duration-300">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 will-change-transform group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {product.isBestseller && (
                <span className="px-2.5 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                  Bestseller
                </span>
              )}
              {product.isNew && (
                <span className="px-2.5 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded-full">
                  New
                </span>
              )}
              {product.tags?.filter(t => t !== "Bestseller" && t !== "New").map(tag => (
                <span key={tag} className="px-2.5 py-1 bg-secondary text-secondary-foreground text-xs font-semibold rounded-full">
                  {tag}
                </span>
              ))}
            </div>
            {/* Wishlist */}
            <button
              onClick={handleWishlist}
              className={`absolute top-3 right-3 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center transition-opacity active:scale-95 ${isWishlisted ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
              aria-label={isWishlisted ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? "fill-destructive text-destructive" : "text-primary"}`} />
            </button>
            {/* Quick add */}
            <button
              onClick={handleAddToCart}
              className="absolute bottom-3 right-3 w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all active:scale-90 shadow-card"
              aria-label="Add to cart"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{product.category}</p>
            <h3 className="font-display font-semibold text-foreground leading-tight mb-2 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <div className="flex items-center gap-1.5 mb-2">
              <Star className="w-3.5 h-3.5 fill-accent text-accent" />
              <span className="text-sm font-medium">{product.rating}</span>
              <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-foreground">₹{product.basePrice}</span>
              <span className="text-xs text-muted-foreground">onwards</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
