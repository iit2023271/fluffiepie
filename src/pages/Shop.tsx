import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X, Search, Sparkles, Check } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";

const ITEMS_PER_PAGE = 12;

export default function Shop() {
  const [searchParams] = useSearchParams();
  const initialOccasion = searchParams.get("occasion") || "";
  const { data: products = [] } = useProducts();
  const { filterSections: allFilters } = useStoreConfig();
  const { isWishlisted, toggle: toggleWishlist } = useWishlist();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    if (initialOccasion) init["occasion"] = initialOccasion;
    return init;
  });
  const [sortBy, setSortBy] = useState("popularity");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    let result = [...products];
    if (searchQuery) result = result.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
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
  }, [searchQuery, selectedFilters, sortBy, products]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedFilters, sortBy]);

  const activeFilterCount = Object.values(selectedFilters).filter(v => v).length;
  const hasFilters = activeFilterCount > 0 || searchQuery;

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedProducts = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedFilters({});
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

  // Mobile sidebar filter — vertical list like Bakingo/real apps
  const MobileFilterSection = ({ title, options, selected, onSelect }: { title: string; options: string[]; selected: string; onSelect: (v: string) => void }) => (
    <div className="py-3">
      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">{title}</h4>
      <div className="flex flex-col gap-0.5">
        {options.map((opt) => {
          const isSelected = selected === opt;
          return (
            <button
              key={opt}
              onClick={() => onSelect(opt)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all ${
                isSelected
                  ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                  : "text-foreground hover:bg-secondary"
              }`}
            >
              <span>{opt}</span>
              {isSelected && (
                <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
          {selectedFilters["occasion"] ? `${selectedFilters["occasion"]} Cakes` : "All Cakes"}
        </h1>
        <p className="text-muted-foreground">{filtered.length} products found</p>
      </div>

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

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 gap-3">
        {/* Filter sheet trigger — visible on ALL screen sizes */}
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium bg-card hover:bg-secondary transition-colors">
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="default" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full">
                  {activeFilterCount}
                </Badge>
              )}
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] p-0 flex flex-col">
            <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-lg font-display font-bold flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4" /> Filters
                </SheetTitle>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="text-xs text-primary font-medium hover:underline">
                    Clear all
                  </button>
                )}
              </div>
              {activeFilterCount > 0 && (
                <p className="text-xs text-muted-foreground mt-1">{activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active</p>
              )}
            </SheetHeader>

            <ScrollArea className="flex-1 px-4">
              <div className="py-2 divide-y divide-border">
                {allFilters.map(f => (
                  <MobileFilterSection
                    key={f.type}
                    title={f.label}
                    options={f.values}
                    selected={selectedFilters[f.type] || ""}
                    onSelect={(v) => selectFilter(f.type, v)}
                  />
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-border">
              <SheetClose asChild>
                <button className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
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
          </div>
        )}

        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-primary hover:underline whitespace-nowrap">
            <X className="w-3 h-3" /> Clear
          </button>
        )}

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="ml-auto px-3 py-2 rounded-xl border border-border text-sm bg-background"
        >
          <option value="popularity">Most Popular</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>

      {/* Product grid — full width now */}
      <div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {paginatedProducts.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} isWishlisted={isWishlisted(product.id)} onToggleWishlist={toggleWishlist} />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-lg font-display text-muted-foreground">No cakes found matching your filters.</p>
            <button onClick={clearFilters} className="mt-4 text-primary hover:underline text-sm">Clear all filters</button>
          </div>
        )}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(p) => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          totalItems={filtered.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </div>
    </div>
  );
}