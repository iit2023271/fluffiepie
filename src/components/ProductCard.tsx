import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";

interface Props {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: Props) {
  const { dispatch } = useCart();

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Link to={`/product/${product.slug}`} className="group block">
        <div className="relative rounded-2xl overflow-hidden bg-card shadow-soft hover:shadow-card transition-shadow duration-300">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
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
            </div>
            {/* Wishlist */}
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toast.success("Added to wishlist!"); }}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
              aria-label="Add to wishlist"
            >
              <Heart className="w-4 h-4 text-primary" />
            </button>
            {/* Quick add */}
            <button
              onClick={handleAddToCart}
              className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-card"
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
