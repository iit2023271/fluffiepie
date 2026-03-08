import { memo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Star, Plus, Minus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

function ProductCard({ product, index = 0, isWishlisted = false, onToggleWishlist }: Props) {
  const { state, dispatch } = useCart();
  const { user } = useAuth();
  const { productTags } = useStoreConfig();
  const isSoldOut = (product.stockQuantity ?? 100) <= 0;

  const defaultWeight = product.weights[0].label;
  const cartItem = state.items.find(
    (i) => i.product.id === product.id && i.weight === defaultWeight
  );
  const cartQty = cartItem?.quantity ?? 0;
  
  const activeTag = product.tags?.[0];
  const tagDef = activeTag ? productTags.find(t => t.name === activeTag) : null;
  const displayTag = tagDef || (product.isBestseller ? { name: "Bestseller", bgColor: "", textColor: "" } : product.isNew ? { name: "New", bgColor: "", textColor: "" } : null);

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSoldOut) {
      toast.error("This product is currently sold out");
      return;
    }
    dispatch({
      type: "ADD_ITEM",
      payload: {
        product,
        quantity: 1,
        weight: defaultWeight,
        price: product.weights[0].price,
      },
    });
    toast.success(`${product.name} added to cart!`);
  }, [product, defaultWeight, isSoldOut, dispatch]);

  const handleIncrement = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch({
      type: "UPDATE_QUANTITY",
      payload: { id: product.id, weight: defaultWeight, quantity: cartQty + 1 },
    });
  }, [product.id, defaultWeight, cartQty, dispatch]);

  const handleDecrement = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartQty <= 1) {
      dispatch({ type: "REMOVE_ITEM", payload: { id: product.id, weight: defaultWeight } });
      toast.success("Removed from cart");
    } else {
      dispatch({
        type: "UPDATE_QUANTITY",
        payload: { id: product.id, weight: defaultWeight, quantity: cartQty - 1 },
      });
    }
  }, [product.id, defaultWeight, cartQty, dispatch]);

  const handleWishlist = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Please sign in to save favorites");
      return;
    }
    onToggleWishlist?.(product.id);
    toast.success(isWishlisted ? "Removed from favorites" : "Added to favorites! ❤️");
  }, [user, product.id, isWishlisted, onToggleWishlist]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.25, ease: "easeOut" } }}
      whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
    >
      <Link to={isSoldOut ? "#" : `/product/${product.slug}`} className="group block" onClick={isSoldOut ? (e: React.MouseEvent) => { e.preventDefault(); toast.error("This product is currently sold out"); } : undefined}>
        <div className="relative rounded-2xl overflow-hidden bg-card shadow-soft hover:shadow-elevated transition-shadow duration-300">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden">
            <motion.img
              src={product.image}
              alt={product.name}
              className={`w-full h-full object-cover ${isSoldOut ? "grayscale opacity-60" : ""}`}
              loading="lazy"
              decoding="async"
              whileHover={{ scale: 1.08 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
            {/* Sold Out Overlay */}
            {isSoldOut && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[2px] z-10"
              >
                <motion.span
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="px-4 py-2 bg-destructive text-destructive-foreground text-sm font-bold rounded-full uppercase tracking-wider shadow-lg"
                >
                  Sold Out
                </motion.span>
              </motion.div>
            )}
            {/* Badge */}
            <div className="absolute top-3 left-3">
              {displayTag && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.6, x: -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ delay: index * 0.06 + 0.2, type: "spring", stiffness: 200 }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                    tagDef?.bgColor
                      ? ""
                      : displayTag.name === "New"
                        ? "bg-accent text-accent-foreground"
                        : "bg-primary text-primary-foreground"
                  }`}
                  style={tagDef?.bgColor ? { backgroundColor: `hsl(${tagDef.bgColor})`, color: `hsl(${tagDef.textColor})` } : undefined}
                >
                  {displayTag.name}
                </motion.span>
              )}
            </div>
            {/* Wishlist */}
            <motion.button
              onClick={handleWishlist}
              whileTap={{ scale: 0.8 }}
              className={`absolute top-3 right-3 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center transition-all active:bg-background ${isWishlisted ? "opacity-100" : "opacity-100 md:opacity-0 md:group-hover:opacity-100"}`}
              aria-label={isWishlisted ? "Remove from favorites" : "Add to favorites"}
            >
              <motion.div
                animate={isWishlisted ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Heart className={`w-4.5 h-4.5 ${isWishlisted ? "fill-destructive text-destructive" : "text-primary"}`} />
              </motion.div>
            </motion.button>

            {/* Cart Control — Add or Quantity Stepper */}
            <div className="absolute bottom-3 right-3 z-10">
              <AnimatePresence mode="wait">
                {cartQty === 0 ? (
                  <motion.button
                    key="add-btn"
                    onClick={handleAddToCart}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    whileTap={{ scale: 0.85 }}
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-card"
                    aria-label="Add to cart"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </motion.button>
                ) : (
                  <motion.div
                    key="qty-stepper"
                    initial={{ scale: 0, opacity: 0, width: 44 }}
                    animate={{ scale: 1, opacity: 1, width: "auto" }}
                    exit={{ scale: 0, opacity: 0, width: 44 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="flex items-center gap-0 bg-primary rounded-full shadow-card overflow-hidden"
                  >
                    <motion.button
                      onClick={handleDecrement}
                      whileTap={{ scale: 0.75 }}
                      className="w-9 h-9 flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
                      aria-label={cartQty <= 1 ? "Remove from cart" : "Decrease quantity"}
                    >
                      {cartQty <= 1 ? (
                        <motion.div
                          initial={{ rotate: 0 }}
                          animate={{ rotate: 0 }}
                          whileTap={{ rotate: -20 }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </motion.div>
                      ) : (
                        <Minus className="w-3.5 h-3.5" />
                      )}
                    </motion.button>
                    <motion.span
                      key={cartQty}
                      initial={{ scale: 1.5, y: -8, opacity: 0 }}
                      animate={{ scale: 1, y: 0, opacity: 1 }}
                      className="text-sm font-bold text-primary-foreground w-6 text-center select-none"
                    >
                      {cartQty}
                    </motion.span>
                    <motion.button
                      onClick={handleIncrement}
                      whileTap={{ scale: 0.75 }}
                      className="w-9 h-9 flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-foreground">₹{product.basePrice}</span>
              {product.originalPrice && product.originalPrice > product.basePrice && (
                <>
                  <span className="text-sm text-muted-foreground line-through">₹{product.originalPrice}</span>
                  <span className="text-xs font-semibold text-green-600">{Math.round(((product.originalPrice - product.basePrice) / product.originalPrice) * 100)}% off</span>
                </>
              )}
              {!(product.originalPrice && product.originalPrice > product.basePrice) && (
                <span className="text-xs text-muted-foreground">onwards</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default memo(ProductCard);