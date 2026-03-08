import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, ShoppingCart, Heart, Minus, Plus, ChevronLeft, Truck, Shield, Clock } from "lucide-react";
import { useProduct, useProducts } from "@/hooks/useProducts";
import { useCart } from "@/context/CartContext";
import ProductCard from "@/components/ProductCard";
import ProductReviews from "@/components/ProductReviews";
import { toast } from "sonner";

export default function ProductDetail() {
  const { slug } = useParams();
  const { data: product, isLoading } = useProduct(slug);
  const { data: allProducts = [] } = useProducts();
  const { dispatch } = useCart();

  const [selectedWeight, setSelectedWeight] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-display font-bold mb-4">Product not found</h1>
        <Link to="/shop" className="text-primary hover:underline">Back to shop</Link>
      </div>
    );
  }

  const currentPrice = product.weights[selectedWeight].price;
  const totalPrice = currentPrice * quantity;

  // Build all images array: main image + additional images
  const allImages = [product.image, ...(product.images || [])].filter(Boolean);

  const handleAddToCart = () => {
    dispatch({
      type: "ADD_ITEM",
      payload: {
        product,
        quantity,
        weight: product.weights[selectedWeight].label,
        price: currentPrice,
        message: message || undefined,
      },
    });
    toast.success(`${product.name} added to cart!`);
  };

  const related = allProducts.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 4);

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ChevronLeft className="w-4 h-4" /> Back to Shop
      </Link>

      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
        {/* Image Gallery */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-3"
        >
          <div className="relative rounded-3xl overflow-hidden bg-cream aspect-square">
            <img
              src={allImages[selectedImage] || product.image}
              alt={product.name}
              className="w-full h-full object-cover transition-all duration-300"
            />
            {product.isBestseller && (
              <span className="absolute top-4 left-4 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                Bestseller
              </span>
            )}
          </div>
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 transition-colors ${
                    selectedImage === i ? "border-primary" : "border-transparent hover:border-border"
                  }`}
                >
                  <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Details */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">{product.category}</p>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-3">{product.name}</h1>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-accent text-accent" />
              <span className="font-semibold">{product.rating}</span>
            </div>
            <span className="text-sm text-muted-foreground">({product.reviewCount} reviews)</span>
          </div>

          <p className="text-muted-foreground mb-6 leading-relaxed">{product.description}</p>

          {/* Weight selector */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold mb-3">Select Weight</h4>
            <div className="flex gap-3">
              {product.weights.map((w, i) => (
                <button
                  key={w.label}
                  onClick={() => setSelectedWeight(i)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                    selectedWeight === i
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {w.label} — ₹{w.price}
                </button>
              ))}
            </div>
          </div>

          {/* Message on cake */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold mb-3">Message on Cake (optional)</h4>
            <input
              type="text"
              placeholder="e.g. Happy Birthday Priya!"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={50}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors"
            />
            <p className="text-xs text-muted-foreground mt-1">{message.length}/50 characters</p>
          </div>

          {/* Quantity + Price */}
          <div className="flex items-center gap-6 mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-secondary"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-secondary"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div>
              <p className="text-2xl font-bold">₹{totalPrice.toLocaleString()}</p>
              {quantity > 1 && <p className="text-xs text-muted-foreground">₹{currentPrice} each</p>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mb-8">
            <button
              onClick={handleAddToCart}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              <ShoppingCart className="w-4 h-4" /> Add to Cart
            </button>
            <button
              onClick={() => toast.success("Added to wishlist!")}
              className="w-14 flex items-center justify-center border border-border rounded-xl hover:bg-secondary transition-colors"
              aria-label="Add to wishlist"
            >
              <Heart className="w-5 h-5 text-primary" />
            </button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Truck, text: "Free Delivery" },
              { icon: Clock, text: "Same Day" },
              { icon: Shield, text: "100% Fresh" },
            ].map((badge) => (
              <div key={badge.text} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-secondary/50 text-center">
                <badge.icon className="w-5 h-5 text-primary" />
                <span className="text-xs font-medium">{badge.text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Reviews */}
      <section className="mt-20">
        <h2 className="text-2xl font-display font-bold mb-8">Customer Reviews</h2>
        <ProductReviews productId={product.id} />
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="text-2xl font-display font-bold mb-8">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
