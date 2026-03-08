import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Search, X, Star, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useProducts } from "@/hooks/useProducts";
import type { Product } from "@/data/products";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: products = [] } = useProducts();

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const filtered = useCallback((): Product[] => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.flavour.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.occasion.some((o) => o.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [query, products]);

  const results = filtered();
  const trending = products.filter((p) => p.isBestseller).slice(0, 4);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />

          {/* Search Panel */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="fixed top-0 left-0 right-0 z-[61] bg-background shadow-elevated max-h-[85vh] overflow-hidden flex flex-col"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 md:px-8 py-4 border-b border-border">
              <Search className="w-5 h-5 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search cakes, flavours, occasions..."
                className="flex-1 text-lg bg-transparent outline-none placeholder:text-muted-foreground/60"
                autoComplete="off"
              />
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-secondary transition-colors active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-4 md:px-8">
              {query.trim() ? (
                results.length > 0 ? (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
                      {results.length} result{results.length !== 1 ? "s" : ""}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {results.map((product, i) => (
                        <Link
                          key={product.id}
                          to={`/product/${product.slug}`}
                          onClick={onClose}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/80 transition-colors active:scale-[0.98]"
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-14 h-14 rounded-lg object-cover shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{product.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground">{product.category}</span>
                              <span className="flex items-center gap-0.5 text-xs">
                                <Star className="w-3 h-3 fill-accent text-accent" />
                                {product.rating}
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-primary mt-0.5">₹{product.basePrice}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <Link
                      to={`/shop?search=${encodeURIComponent(query)}`}
                      onClick={onClose}
                      className="block text-center text-sm text-primary font-medium mt-4 py-2 hover:underline"
                    >
                      View all results →
                    </Link>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-lg font-display font-semibold mb-1">No results found</p>
                    <p className="text-sm text-muted-foreground">
                      Try searching for "chocolate", "birthday", or "vanilla"
                    </p>
                  </div>
                )
              ) : (
                /* Trending / suggestions when no query */
                trending.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" /> Trending
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {trending.map((product) => (
                        <Link
                          key={product.id}
                          to={`/product/${product.slug}`}
                          onClick={onClose}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/80 transition-colors active:scale-[0.98]"
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-14 h-14 rounded-lg object-cover shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{product.name}</p>
                            <p className="text-sm font-semibold text-primary mt-0.5">₹{product.basePrice}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
