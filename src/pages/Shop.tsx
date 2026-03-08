import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStoreConfig } from "@/hooks/useStoreConfig";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/ProductCard";
import Pagination from "@/components/Pagination";

const ITEMS_PER_PAGE = 12;

export default function Shop() {
  const [searchParams] = useSearchParams();
  const initialOccasion = searchParams.get("occasion") || "";
  const { data: products = [] } = useProducts();
  const { categories: categoryTypes, flavours, occasions } = useStoreConfig();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedOccasion, setSelectedOccasion] = useState(initialOccasion);
  const [selectedFlavour, setSelectedFlavour] = useState("");
  const [sortBy, setSortBy] = useState("popularity");
  const [showFilters, setShowFilters] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    let result = [...products];
    if (searchQuery) result = result.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    if (selectedCategory) result = result.filter((p) => p.category === selectedCategory);
    if (selectedOccasion) result = result.filter((p) => p.occasion.includes(selectedOccasion));
    if (selectedFlavour) result = result.filter((p) => p.flavour === selectedFlavour);

    switch (sortBy) {
      case "price-low": result.sort((a, b) => a.basePrice - b.basePrice); break;
      case "price-high": result.sort((a, b) => b.basePrice - a.basePrice); break;
      case "rating": result.sort((a, b) => b.rating - a.rating); break;
      default: result.sort((a, b) => b.reviewCount - a.reviewCount);
    }
    return result;
  }, [searchQuery, selectedCategory, selectedOccasion, selectedFlavour, sortBy, products]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedCategory, selectedOccasion, selectedFlavour, sortBy]);

  const hasFilters = selectedCategory || selectedOccasion || selectedFlavour || searchQuery;

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedProducts = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset page when filters change
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedOccasion("");
    setSelectedFlavour("");
    setCurrentPage(1);
  };

  const FilterSection = ({ title, options, selected, onSelect }: { title: string; options: string[]; selected: string; onSelect: (v: string) => void }) => (
    <div className="mb-6">
      <h4 className="text-sm font-semibold mb-3">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onSelect(selected === opt ? "" : opt)}
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
          {selectedOccasion ? `${selectedOccasion} Cakes` : "All Cakes"}
        </h1>
        <p className="text-muted-foreground">{filtered.length} products found</p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6 max-w-lg">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          placeholder="Search cakes by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border text-sm bg-background focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium"
        >
          <SlidersHorizontal className="w-4 h-4" /> Filters
        </button>
        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-primary hover:underline">
            <X className="w-3 h-3" /> Clear filters
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

      <div className="flex gap-8">
        {/* Sidebar filters (desktop) */}
        <aside className="hidden md:block w-56 flex-shrink-0">
          <FilterSection title="Category" options={categoryTypes} selected={selectedCategory} onSelect={setSelectedCategory} />
          <FilterSection title="Occasion" options={occasions} selected={selectedOccasion} onSelect={setSelectedOccasion} />
          <FilterSection title="Flavour" options={flavours} selected={selectedFlavour} onSelect={setSelectedFlavour} />
        </aside>

        {/* Mobile filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden fixed inset-x-0 top-16 bg-background z-40 border-b border-border p-4 overflow-hidden"
            >
              <FilterSection title="Category" options={categoryTypes} selected={selectedCategory} onSelect={setSelectedCategory} />
              <FilterSection title="Occasion" options={occasions} selected={selectedOccasion} onSelect={setSelectedOccasion} />
              <FilterSection title="Flavour" options={flavours} selected={selectedFlavour} onSelect={setSelectedFlavour} />
              <button onClick={() => setShowFilters(false)} className="w-full py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium mt-2">
                Apply Filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product grid */}
        <div className="flex-1">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {paginatedProducts.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
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
    </div>
  );
}
