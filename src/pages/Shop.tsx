import { useState, useMemo, useEffect, useRef } from "react";
import { useSEO } from "@/hooks/useSEO";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X, Search, Sparkles, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStoreConfig } from "@/hooks/useStoreConfig";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/ProductCard";
import Pagination from "@/components/Pagination";
import { useWishlist } from "@/hooks/useWishlist";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";



const ITEMS_PER_PAGE = 12;

export default function Shop() {
  const [searchParams] = useSearchParams();

  useSEO({
    title: "Shop All Cakes",
    description: "Browse our full collection of handcrafted cakes. Filter by occasion, flavour, and more. Fresh delivery to your doorstep.",
  });
  const initialOccasion = searchParams.get("occasion") || "";
  const initialCategory = searchParams.get("category") || "";
  const initialFlavour = searchParams.get("flavour") || "";
  const { data: products = [] } = useProducts();
  const { filterSections: allFilters, productTags } = useStoreConfig();
  const { isWishlisted, toggle: toggleWishlist } = useWishlist();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    if (initialOccasion) init["occasion"] = initialOccasion;
    if (initialCategory) init["category"] = initialCategory;
    if (initialFlavour) init["flavour"] = initialFlavour;
    return init;
  });
  const [sortBy, setSortBy] = useState("popularity");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTag, setSelectedTag] = useState("");
  const [discountFilter, setDiscountFilter] = useState("");
  const filterScrollRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    let result = [...products];
    if (searchQuery) result = result.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    



    // Tag filter
    if (selectedTag) {
      result = result.filter(p => p.tags && p.tags.includes(selectedTag));
    }

    // Discount filter
    if (discountFilter) {
      const minDiscount = parseInt(discountFilter);
      result = result.filter(p => {
        if (!p.originalPrice || p.originalPrice <= p.basePrice) return false;
        const pct = Math.round(((p.originalPrice - p.basePrice) / p.originalPrice) * 100);
        return pct >= minDiscount;
      });
    }

    const normalize = (value: unknown) => String(value ?? "").trim().toLowerCase();
    for (const [filterType, filterValue] of Object.entries(selectedFilters)) {
      if (!filterValue) continue;
      const normalizedFilter = normalize(filterValue);

      if (filterType === "category") {
        result = result.filter((p) => normalize(p.category) === normalizedFilter);
      } else if (filterType === "occasion") {
        result = result.filter((p) => Array.isArray(p.occasion) && p.occasion.some((o) => normalize(o) === normalizedFilter));
      } else if (filterType === "flavour") {
        result = result.filter((p) => normalize(p.flavour) === normalizedFilter);
      } else {
        result = result.filter((p) => {
          const attrs = (p as any).custom_attributes || {};
          const val = attrs[filterType];
          if (Array.isArray(val)) return val.some((item) => normalize(item) === normalizedFilter);
          return normalize(val) === normalizedFilter;
        });
      }
    }

    switch (sortBy) {
      case "price-low": result.sort((a, b) => a.basePrice - b.basePrice); break;
      case "price-high": result.sort((a, b) => b.basePrice - a.basePrice); break;
      case "rating": result.sort((a, b) => b.rating - a.rating); break;
      default: result.sort((a, b) => b.reviewCount - a.reviewCount);
    }
    return result;
  }, [searchQuery, selectedFilters, sortBy, products, selectedTag, discountFilter]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedFilters, sortBy, selectedTag, discountFilter]);

  const activeFilterCount = Object.values(selectedFilters).filter(v => v).length + (selectedTag ? 1 : 0) + (discountFilter ? 1 : 0);
  const hasFilters = activeFilterCount > 0 || searchQuery;

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedProducts = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedFilters({});
    setSelectedTag("");
    setDiscountFilter("");
    setCurrentPage(1);
  };

  const selectFilter = (type: string, value: string) => {
    setSelectedFilters(prev => ({ ...prev, [type]: prev[type] === value ? "" : value }));
  };

  // Desktop sidebar filter
  const DesktopFilterSection = ({ title, options, selected, onSelect }: { title: string; options: string[]; selected: string; onSelect: (v: string) => void }) => (
    <div className="mb-6">
      <h4 className="text-sm font-semibold mb-3">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selected === opt
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-primary/10"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  // Sidebar filter — polished vertical list
  const FilterSection = ({ title, options, selected, onSelect }: { title: string; options: string[]; selected: string; onSelect: (v: string) => void }) => (
    <div className="py-4">
      <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 px-2 flex items-center gap-1.5">
        <span className="w-1 h-4 rounded-full bg-primary/40" />
        {title}
      </h4>
      <div className="flex flex-col gap-1">
        {options.map((opt) => {
          const isSelected = selected === opt;
          return (
            <button
              key={opt}
              onClick={() => onSelect(opt)}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                isSelected
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : "text-foreground hover:bg-secondary/80 hover:pl-4"
              }`}
            >
              <span className="flex items-center gap-2">
                {isSelected && <Check className="w-3.5 h-3.5" />}
                {opt}
              </span>
              {!isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20 group-hover:bg-primary/40 transition-colors" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto px-4 py-8"
    >
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mb-6"
      >
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
          {selectedFilters["occasion"] ? `${selectedFilters["occasion"]} Cakes` : "All Cakes"}
        </h1>
        <p className="text-muted-foreground">{filtered.length} products found</p>
      </motion.div>

      {/* Search Bar */}
      <div className="relative mb-5 max-w-lg">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          placeholder="Search cakes by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border text-sm bg-background focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Sort chips (scrollable on mobile) */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
        {[
          { value: "popularity", label: "Most Popular" },
          { value: "price-low", label: "Price: Low to High" },
          { value: "price-high", label: "Price: High to Low" },
          { value: "rating", label: "Highest Rated" },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSortBy(opt.value)}
            className={`px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              sortBy === opt.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary text-secondary-foreground hover:bg-primary/10"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 gap-3">
        {/* Filter sheet trigger */}
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-medium bg-card hover:bg-secondary transition-all hover:shadow-sm active:scale-95 group">
              <SlidersHorizontal className="w-4 h-4 group-hover:text-primary transition-colors" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="default" className="ml-1 h-5 min-w-5 px-1.5 flex items-center justify-center text-[10px] rounded-full animate-scale-in">
                  {activeFilterCount}
                </Badge>
              )}
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[320px] p-0 flex flex-col border-r-0 shadow-2xl">
            {/* Header with gradient accent */}
            <div className="relative">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />
              <SheetHeader className="px-5 pt-6 pb-4">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-xl font-display font-bold flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    Filters
                  </SheetTitle>
                  {activeFilterCount > 0 && (
                    <button onClick={clearFilters} className="text-xs text-primary font-semibold hover:underline px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors">
                      Clear all
                    </button>
                  )}
                </div>
                {activeFilterCount > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="h-1.5 flex-1 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${Math.min((activeFilterCount / allFilters.length) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">{activeFilterCount} active</span>
                  </div>
                )}
              </SheetHeader>
            </div>

            <div ref={filterScrollRef} className="flex-1 overflow-y-auto px-4">

              {/* Product Tag Filter */}
              {productTags.length > 0 && (
                <div className="py-4 border-b border-border/50">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 px-2 flex items-center gap-1.5">
                    <span className="w-1 h-4 rounded-full bg-primary/40" />
                    Product Tag
                  </h4>
                  <div className="flex flex-col gap-1">
                    {productTags.map((tag) => {
                      const isSelected = selectedTag === tag.name;
                      return (
                        <button
                          key={tag.name}
                          onClick={() => setSelectedTag(isSelected ? "" : tag.name)}
                          className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                            isSelected
                              ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                              : "text-foreground hover:bg-secondary/80 hover:pl-4"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                              style={!isSelected ? { backgroundColor: `hsl(${tag.bgColor})`, color: `hsl(${tag.textColor})` } : undefined}
                            >
                              {tag.name}
                            </span>
                          </span>
                          {!isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20 group-hover:bg-primary/40 transition-colors" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Discount Filter */}
              <div className="py-4 border-b border-border/50">
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 px-2 flex items-center gap-1.5">
                  <span className="w-1 h-4 rounded-full bg-green-500/40" />
                  Discount
                </h4>
                <div className="flex flex-col gap-1">
                  {[
                    { label: "10% or more", value: "10" },
                    { label: "20% or more", value: "20" },
                    { label: "30% or more", value: "30" },
                    { label: "50% or more", value: "50" },
                  ].map((opt) => {
                    const isSelected = discountFilter === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setDiscountFilter(isSelected ? "" : opt.value)}
                        className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                          isSelected
                            ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                            : "text-foreground hover:bg-secondary/80 hover:pl-4"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                          {opt.label}
                        </span>
                        {!isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20 group-hover:bg-primary/40 transition-colors" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="divide-y divide-border/50">
                {allFilters.map(f => (
                  <FilterSection
                    key={f.type}
                    title={f.label}
                    options={f.values}
                    selected={selectedFilters[f.type] || ""}
                    onSelect={(v) => selectFilter(f.type, v)}
                  />
                ))}
              </div>
            </div>

            {/* Footer with results button */}
            <div className="p-5 border-t border-border bg-card/50 backdrop-blur-sm">
              <SheetClose asChild>
                <button className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                  <Search className="w-4 h-4" />
                  Show {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                </button>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>

        {/* Active filter pills */}
        {hasFilters && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1">
            {Object.entries(selectedFilters).map(([type, value]) =>
              value ? (
                <button
                  key={type}
                  onClick={() => selectFilter(type, value)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium whitespace-nowrap flex-shrink-0"
                >
                  {value} <X className="w-3 h-3" />
                </button>
              ) : null
            )}
            {selectedTag && (
              <button
                onClick={() => setSelectedTag("")}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium whitespace-nowrap flex-shrink-0"
              >
                {selectedTag} <X className="w-3 h-3" />
              </button>
            )}
            {discountFilter && (
              <button
                onClick={() => setDiscountFilter("")}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium whitespace-nowrap flex-shrink-0"
              >
                {discountFilter}%+ off <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-primary hover:underline whitespace-nowrap">
            <X className="w-3 h-3" /> Clear
          </button>
        )}

      </div>

      {/* Product grid — full width now */}
      <div>
        <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          <AnimatePresence mode="popLayout">
            {paginatedProducts.map((product, i) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
              >
                <ProductCard product={product} index={i} isWishlisted={isWishlisted(product.id)} onToggleWishlist={toggleWishlist} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <p className="text-lg font-display text-muted-foreground">No cakes found matching your filters.</p>
            <button onClick={clearFilters} className="mt-4 text-primary hover:underline text-sm">Clear all filters</button>
          </motion.div>
        )}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(p) => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          totalItems={filtered.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </div>
    </motion.div>
  );
}