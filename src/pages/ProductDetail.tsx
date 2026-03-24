import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ShoppingCart, Heart, Minus, Plus, ChevronLeft, Award, Leaf, Sparkles, X, ChevronRight, ZoomIn } from "lucide-react";
import { useProduct, useProducts } from "@/hooks/useProducts";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import { useSEO } from "@/hooks/useSEO";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useWishlist } from "@/hooks/useWishlist";
import ProductCard from "@/components/ProductCard";
import ProductReviews from "@/components/ProductReviews";
import RecentlyViewed from "@/components/RecentlyViewed";
import ShareButtons from "@/components/ShareButtons";
import { toast } from "sonner";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function ProductDetail() {
  const { slug } = useParams();
  const { data: product, isLoading } = useProduct(slug);
  const { data: allProducts = [] } = useProducts();
  const { dispatch } = useCart();
  const { user } = useAuth();
  const { addViewed } = useRecentlyViewed();
  const { isWishlisted, toggle: toggleWishlist } = useWishlist();
  const isMobile = useIsMobile();

  const [selectedWeight, setSelectedWeight] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Track recently viewed
  useEffect(() => {
    if (product) addViewed(product.id);
  }, [product?.id]);

  // SEO: meta tags + JSON-LD structured data
  const jsonLd = useMemo(() => {
    if (!product) return undefined;
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description,
      image: product.image,
      sku: product.id,
      brand: { "@type": "Brand", name: document.title.split("|").pop()?.trim() || "Store" },
      category: product.category,
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "INR",
        lowPrice: Math.min(...product.weights.map(w => w.price)),
        highPrice: Math.max(...product.weights.map(w => w.price)),
        availability: (product.stockQuantity ?? 100) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        offerCount: product.weights.length,
      },
      aggregateRating: product.reviewCount > 0 ? {
        "@type": "AggregateRating",
        ratingValue: product.rating,
        reviewCount: product.reviewCount,
      } : undefined,
    };
  }, [product]);

  useSEO({
    title: product?.name,
    description: product ? `${product.description.slice(0, 155)}…` : undefined,
    image: product?.image,
    type: "product",
    jsonLd,
  });

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container mx-auto px-4 py-10">
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </motion.div>
    );
  }

  if (!product) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-display font-bold mb-4">Product not found</h1>
        <Link to="/shop" className="text-primary hover:underline">Back to shop</Link>
      </motion.div>
    );
  }

  const isSoldOut = (product.stockQuantity ?? 100) <= 0;
  const currentPrice = product.weights[selectedWeight].price;
  const totalPrice = currentPrice * quantity;
  const allImages = [product.image, ...(product.images || [])].filter(Boolean);

  const handleAddToCart = () => {
    if (isSoldOut) { toast.error("This product is currently sold out"); return; }
    dispatch({ type: "ADD_ITEM", payload: { product, quantity, weight: product.weights[selectedWeight].label, price: currentPrice, message: message || undefined } });
    toast.success(`${product.name} added to cart!`);
  };

  const related = allProducts.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 4);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
        <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 active:scale-95 transition-transform">
          <ChevronLeft className="w-4 h-4" /> Back to Shop
        </Link>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
        {/* Image Gallery with Swipe */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-3"
        >
          <div className="relative rounded-3xl overflow-hidden bg-cream aspect-square group">
            {/* Swipeable image area */}
            <div
              className="w-full h-full touch-pan-y"
              onTouchStart={(e) => {
                const touch = e.touches[0];
                (e.currentTarget as any)._touchStartX = touch.clientX;
                (e.currentTarget as any)._touchStartY = touch.clientY;
              }}
              onTouchEnd={(e) => {
                const startX = (e.currentTarget as any)._touchStartX;
                const startY = (e.currentTarget as any)._touchStartY;
                if (startX == null) return;
                const endX = e.changedTouches[0].clientX;
                const endY = e.changedTouches[0].clientY;
                const diffX = startX - endX;
                const diffY = Math.abs(startY - endY);
                if (Math.abs(diffX) > 50 && diffX > diffY) {
                  if (diffX > 0 && selectedImage < allImages.length - 1) setSelectedImage(selectedImage + 1);
                  else if (diffX < 0 && selectedImage > 0) setSelectedImage(selectedImage - 1);
                } else if (Math.abs(diffX) < 10 && diffY < 10) {
                  setLightboxOpen(true);
                }
              }}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImage}
                  src={allImages[selectedImage] || product.image}
                  alt={product.name}
                  className="w-full h-full object-cover cursor-zoom-in"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.25 }}
                />
              </AnimatePresence>
            </div>

            {/* Navigation arrows (desktop) */}
            {allImages.length > 1 && (
              <>
                {selectedImage > 0 && (
                  <button
                    onClick={() => setSelectedImage(selectedImage - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                {selectedImage < allImages.length - 1 && (
                  <button
                    onClick={() => setSelectedImage(selectedImage + 1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </>
            )}

            {/* Zoom icon */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <ZoomIn className="w-8 h-8 text-background opacity-0 group-hover:opacity-70 transition-opacity drop-shadow-lg" />
            </div>

            {/* Dot indicators */}
            {allImages.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {allImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`rounded-full transition-all duration-300 ${
                      selectedImage === i
                        ? "w-6 h-2 bg-primary"
                        : "w-2 h-2 bg-background/60 hover:bg-background/80"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {allImages.length > 1 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {allImages.map((img, i) => (
                <motion.button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  whileTap={{ scale: 0.9 }}
                  className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                    selectedImage === i ? "border-primary shadow-md" : "border-transparent hover:border-border"
                  }`}
                >
                  <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                </motion.button>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Details */}
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-0">
          <motion.p variants={fadeUp} className="text-sm text-muted-foreground uppercase tracking-wider mb-2">{product.category}</motion.p>
          <motion.h1 variants={fadeUp} className="text-3xl md:text-4xl font-display font-bold mb-3">{product.name}</motion.h1>

          <motion.div variants={fadeUp} className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-accent text-accent" />
              <span className="font-semibold">{product.rating}</span>
            </div>
            <span className="text-sm text-muted-foreground">({product.reviewCount} reviews)</span>
          </motion.div>

          <motion.p variants={fadeUp} className="text-muted-foreground mb-6 leading-relaxed">{product.description}</motion.p>

          {/* Weight selector */}
          <motion.div variants={fadeUp} className="mb-6">
            <h4 className="text-sm font-semibold mb-3">Select Weight</h4>
            <div className="flex gap-3 flex-wrap">
              {product.weights.map((w, i) => (
                <motion.button
                  key={w.label}
                  onClick={() => setSelectedWeight(i)}
                  whileTap={{ scale: 0.93 }}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 active:scale-95 ${
                    selectedWeight === i
                      ? "bg-primary text-primary-foreground border-primary shadow-md"
                      : "border-border hover:border-primary/50 hover:bg-primary/5"
                  }`}
                >
                  {w.label} — ₹{w.price}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Message on cake */}
          <motion.div variants={fadeUp} className="mb-6">
            <h4 className="text-sm font-semibold mb-3">Message on Cake (optional)</h4>
            <input
              type="text"
              placeholder="e.g. Happy Birthday Priya!"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={50}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
            <p className="text-xs text-muted-foreground mt-1">{message.length}/50 characters</p>
          </motion.div>

          {/* Quantity + Price */}
          <motion.div variants={fadeUp} className="flex items-center gap-6 mb-6">
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-secondary active:bg-secondary transition-colors"
              >
                <Minus className="w-4 h-4" />
              </motion.button>
              <motion.span key={quantity} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="w-8 text-center font-bold text-lg">
                {quantity}
              </motion.span>
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-secondary active:bg-secondary transition-colors"
              >
                <Plus className="w-4 h-4" />
              </motion.button>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <motion.p key={totalPrice} initial={{ scale: 1.1 }} animate={{ scale: 1 }} className="text-2xl font-bold">
                  ₹{totalPrice.toLocaleString()}
                </motion.p>
                {product.originalPrice && product.originalPrice > currentPrice && (
                  <p className="text-base text-muted-foreground line-through">₹{(product.originalPrice * quantity).toLocaleString()}</p>
                )}
              </div>
              {quantity > 1 && <p className="text-xs text-muted-foreground">₹{currentPrice} each</p>}
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div variants={fadeUp} className="flex gap-3 mb-8">
            <motion.button
              onClick={handleAddToCart}
              disabled={isSoldOut}
              whileTap={isSoldOut ? {} : { scale: 0.96 }}
              whileHover={isSoldOut ? {} : { scale: 1.02 }}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium transition-all ${isSoldOut ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary text-primary-foreground hover:opacity-90 shadow-card hover:shadow-elevated"}`}
            >
              <ShoppingCart className="w-4 h-4" /> {isSoldOut ? "Sold Out" : "Add to Cart"}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => {
                if (!user) { toast.error("Please sign in to save favorites"); return; }
                if (product) {
                  toggleWishlist(product.id);
                  toast.success(isWishlisted(product.id) ? "Removed from favorites" : "Added to favorites! ❤️");
                }
              }}
              className="w-14 flex items-center justify-center border border-border rounded-xl hover:bg-secondary active:bg-secondary transition-colors"
              aria-label={product && isWishlisted(product.id) ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart className={`w-5 h-5 ${product && isWishlisted(product.id) ? "fill-destructive text-destructive" : "text-primary"}`} />
            </motion.button>
          </motion.div>

          {/* Share + Trust badges */}
          <motion.div variants={fadeUp} className="mb-6">
            <ShareButtons title={product.name} />
          </motion.div>

          <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
            {[
              { icon: Award, text: "Premium Quality" },
              { icon: Sparkles, text: "Handcrafted" },
              { icon: Leaf, text: "100% Fresh" },
            ].map((badge, i) => (
              <motion.div
                key={badge.text}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1, type: "spring", stiffness: 150 }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="flex flex-col items-center gap-1 p-3 rounded-xl bg-secondary/50 text-center"
              >
                <badge.icon className="w-5 h-5 text-primary" />
                <span className="text-xs font-medium">{badge.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Reviews */}
      <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="mt-20">
        <h2 className="text-2xl font-display font-bold mb-8">Customer Reviews</h2>
        <ProductReviews productId={product.id} />
      </motion.section>

      {/* Related */}
      {related.length > 0 && (
        <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="mt-20">
          <h2 className="text-2xl font-display font-bold mb-8">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </motion.section>
      )}

      {/* Recently Viewed */}
      <RecentlyViewed excludeId={product.id} />

      {/* Mobile sticky Add to Cart bar */}
      {isMobile && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.3 }}
          className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border px-4 py-3 flex items-center gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{product.name}</p>
            <p className="text-primary font-bold">₹{totalPrice}</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAddToCart}
            disabled={isSoldOut}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50 shadow-md"
          >
            <ShoppingCart className="w-4 h-4" />
            {isSoldOut ? "Sold Out" : "Add to Cart"}
          </motion.button>
        </motion.div>
      )}

      {/* Bottom padding for sticky bar on mobile */}
      {isMobile && <div className="h-20" />}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <Lightbox images={allImages} initialIndex={selectedImage} onClose={() => setLightboxOpen(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Fullscreen Lightbox with touch gestures ──────────────── */
function Lightbox({ images, initialIndex, onClose }: { images: string[]; initialIndex: number; onClose: () => void }) {
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTouchEnd = useRef(0);
  const pinchStartDist = useRef(0);
  const pinchStartScale = useRef(1);
  const isPinching = useRef(false);
  const panStart = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const prev = useCallback(() => { setIndex(i => (i - 1 + images.length) % images.length); setScale(1); setTranslate({ x: 0, y: 0 }); }, [images.length]);
  const next = useCallback(() => { setIndex(i => (i + 1) % images.length); setScale(1); setTranslate({ x: 0, y: 0 }); }, [images.length]);
  const toggleZoom = useCallback(() => { setScale(s => { const ns = s === 1 ? 2 : 1; if (ns === 1) setTranslate({ x: 0, y: 0 }); return ns; }); }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); if (e.key === "ArrowLeft") prev(); if (e.key === "ArrowRight") next(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, prev, next]);

  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);

  const getTouchDist = (t0: React.Touch, t1: React.Touch) => Math.sqrt((t0.clientX - t1.clientX) ** 2 + (t0.clientY - t1.clientY) ** 2);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) { isPinching.current = true; pinchStartDist.current = getTouchDist(e.touches[0], e.touches[1]); pinchStartScale.current = scale; }
    else if (e.touches.length === 1) { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() }; if (scale > 1) panStart.current = { x: translate.x, y: translate.y }; }
  }, [scale, translate]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 2 && isPinching.current) { const dist = getTouchDist(e.touches[0], e.touches[1]); const ns = Math.min(Math.max(pinchStartScale.current * (dist / pinchStartDist.current), 1), 4); setScale(ns); if (ns <= 1) setTranslate({ x: 0, y: 0 }); }
    else if (e.touches.length === 1 && scale > 1 && panStart.current) { const t = e.touches[0]; setTranslate({ x: panStart.current.x + t.clientX - (touchStart.current?.x ?? 0), y: panStart.current.y + t.clientY - (touchStart.current?.y ?? 0) }); }
  }, [scale]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (isPinching.current && e.touches.length < 2) { isPinching.current = false; if (scale <= 1.1) { setScale(1); setTranslate({ x: 0, y: 0 }); } return; }
    const now = Date.now(); if (now - lastTouchEnd.current < 300) { toggleZoom(); lastTouchEnd.current = 0; return; } lastTouchEnd.current = now;
    if (scale <= 1 && touchStart.current && !isPinching.current) { const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStart.current.x; if (Math.abs(dx) > 50 && Date.now() - touchStart.current.time < 400 && images.length > 1) { if (dx < 0) next(); else prev(); } }
    touchStart.current = null; panStart.current = null;
  }, [scale, toggleZoom, next, prev, images.length]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-50 bg-foreground/90 backdrop-blur-md flex items-center justify-center" onClick={onClose} ref={containerRef}>
      <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} whileTap={{ scale: 0.85 }} onClick={onClose} className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-background/20 hover:bg-background/40 flex items-center justify-center transition-colors">
        <X className="w-5 h-5 text-background" />
      </motion.button>
      {images.length > 1 && <span className="absolute top-5 left-1/2 -translate-x-1/2 text-sm text-background/70 font-medium">{index + 1} / {images.length}</span>}
      {images.length > 1 && <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-3 md:left-6 z-10 w-10 h-10 rounded-full bg-background/20 hover:bg-background/40 items-center justify-center transition-colors hidden md:flex"><ChevronLeft className="w-5 h-5 text-background" /></button>}
      <motion.div key={index} initial={{ opacity: 0, scale: 0.9, x: 40 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9, x: -40 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="max-w-[90vw] max-h-[85vh] flex items-center justify-center touch-none" onClick={(e) => e.stopPropagation()} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        <img src={images[index]} alt={`Image ${index + 1}`} onClick={toggleZoom} className="max-w-full max-h-[85vh] object-contain rounded-lg transition-transform duration-200 select-none" style={{ transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`, cursor: scale > 1 ? "grab" : "zoom-in" }} draggable={false} />
      </motion.div>
      {images.length > 1 && <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-3 md:right-6 z-10 w-10 h-10 rounded-full bg-background/20 hover:bg-background/40 items-center justify-center transition-colors hidden md:flex"><ChevronRight className="w-5 h-5 text-background" /></button>}
    </motion.div>
  );
}