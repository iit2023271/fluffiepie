import { useMemo } from "react";
import { useSEO } from "@/hooks/useSEO";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Star, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/ProductCard";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHomepageConfig, BUILTIN_SECTION_IDS } from "@/hooks/useHomepageConfig";
import type { HomepageSection, SectionNavItem } from "@/hooks/useHomepageConfig";

import heroCake from "@/assets/hero-cake.jpg";
import catBirthday from "@/assets/category-birthday.jpg";
import catWedding from "@/assets/category-wedding.jpg";
import catAnniversary from "@/assets/category-anniversary.jpg";
import catCustom from "@/assets/category-custom.jpg";

const categoryImages: Record<string, string> = {
  Birthday: catBirthday,
  Wedding: catWedding,
  Anniversary: catAnniversary,
  Custom: catCustom,
};

// Reusable horizontal scroll carousel component
function HorizontalCarousel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll, { passive: true });
      window.addEventListener("resize", checkScroll);
      return () => {
        el.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [checkScroll]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector(":scope > *")?.clientWidth || 300;
    el.scrollBy({ left: dir === "left" ? -cardWidth - 16 : cardWidth + 16, behavior: "smooth" });
  };

  return (
    <div className="relative group">
      <div
        ref={scrollRef}
        className={`flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide pb-2 ${className}`}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {children}
      </div>
      {/* Navigation arrows */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm border border-border shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm border border-border shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
      {/* Scroll indicators (dots) */}
      <div className="flex justify-center gap-1.5 mt-4 md:hidden">
        <div className={`h-1.5 rounded-full transition-all ${canScrollLeft ? "w-1.5 bg-primary/30" : "w-4 bg-primary"}`} />
        <div className={`h-1.5 rounded-full transition-all ${canScrollLeft && canScrollRight ? "w-4 bg-primary" : "w-1.5 bg-primary/30"}`} />
        <div className={`h-1.5 rounded-full transition-all ${canScrollRight ? "w-1.5 bg-primary/30" : "w-4 bg-primary"}`} />
      </div>
    </div>
  );
}

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  is_active: boolean;
  sort_order: number;
}

function HeroBannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    supabase
      .from("banners")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) setBanners(data as Banner[]);
      });
  }, []);

  const next = useCallback(() => {
    if (banners.length <= 1) return;
    setDirection(1);
    setCurrent((c) => (c + 1) % banners.length);
  }, [banners.length]);

  const prev = useCallback(() => {
    if (banners.length <= 1) return;
    setDirection(-1);
    setCurrent((c) => (c - 1 + banners.length) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, banners.length]);

  if (banners.length === 0) return null;

  const banner = banners[current];
  const variants = {
    enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <div className="relative w-full overflow-hidden rounded-3xl bg-muted shadow-elevated" style={{ minHeight: '200px' }}>
      <div className="relative aspect-[16/9] sm:aspect-[21/9] md:aspect-[3/1] w-full">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={banner.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-0 will-change-transform"
          >
            {banner.image_url ? (
              <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" loading="eager" decoding="async" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-primary/20 to-accent/20" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl md:text-4xl font-display font-bold text-background mb-2"
              >
                {banner.title}
              </motion.h2>
              {banner.subtitle && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="text-sm md:text-lg text-background/80 max-w-lg"
                >
                  {banner.subtitle}
                </motion.p>
              )}
              {banner.link_url && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                  <Link
                    to={banner.link_url}
                    className="inline-flex items-center gap-2 mt-4 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Shop Now <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {banners.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/70 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors z-10">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/70 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors z-10">
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
              className={`h-2 rounded-full transition-[width,background-color] duration-300 ease-out ${i === current ? "w-6 bg-background" : "w-2 bg-background/50"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Index() {
  const { config, loading: configLoading } = useHomepageConfig();
  const { data: allProducts = [] } = useProducts();

  useSEO({
    title: undefined,
    description: "Craving cake? Discover fresh, handcrafted cakes for every celebration. Customize your favorite flavors and get them delivered fresh to your doorstep.",
    type: "website",
  });
  const featured = useMemo(() => {
    const filterBy = config.trending.filterBy || "all";
    let pool = [...allProducts];
    if (filterBy === "tag" && config.trending.filterTag) {
      pool = pool.filter(p => p.tags?.includes(config.trending.filterTag!));
    }
    if (pool.length === 0) pool = [...allProducts];
    return pool.sort((a, b) => b.reviewCount - a.reviewCount).slice(0, config.trending.count);
  }, [allProducts, config.trending]);

  const [reviews, setReviews] = useState<any[]>([]);
  useEffect(() => {
    const loadReviews = async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*, products(name)")
        .gte("rating", 4)
        .not("comment", "is", null)
        .order("created_at", { ascending: false })
        .limit(config.reviews.count);
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(r => r.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);
        const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
        setReviews(data.map(r => ({ ...r, author_name: profileMap.get(r.user_id) || "Customer" })));
      }
    };
    loadReviews();
  }, [config.reviews.count]);

  const isVisible = (id: string) => config.sections.find(s => s.id === id)?.visible ?? true;

  // Get filter items from store_config based on categories.filterType
  const [filterItems, setFilterItems] = useState<string[]>([]);
  useEffect(() => {
    const filterType = config.categories.filterType || "occasion";
    if (filterType === "custom") return; // custom items come from config
    supabase
      .from("store_config")
      .select("value")
      .eq("config_type", filterType)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data) setFilterItems(data.map(d => d.value));
      });
  }, [config.categories.filterType]);

  // Build section renderers
  const sectionRenderers: Record<string, () => React.ReactNode> = {
    banners: () => (
      <section key="banners" className="container mx-auto px-4 pt-6 pb-2">
        <HeroBannerCarousel />
      </section>
    ),
    hero: () => {
      const imgPos = config.hero.imagePosition || "right";
      const heightCls = config.hero.heroHeight === "compact" ? "py-10 md:py-14" : config.hero.heroHeight === "tall" ? "py-20 md:py-32" : "py-16 md:py-24";
      return (
        <section key="hero" className="relative overflow-hidden bg-cream">
          <div className={`container mx-auto px-4 ${heightCls}`}>
            <div className={`grid md:grid-cols-2 gap-10 items-center ${imgPos === "left" ? "md:[direction:rtl] [&>*]:md:[direction:ltr]" : ""}`}>
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
              >
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="inline-block px-4 py-1.5 bg-blush text-primary text-sm font-medium rounded-full mb-6"
                >
                  {config.hero.badge}
                </motion.span>
                <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground leading-tight mb-6">
                  <motion.span initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }} className="block">{config.hero.titleLine1}</motion.span>
                  <motion.span initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.6 }} className="block text-primary">{config.hero.titleLine2}</motion.span>
                </h1>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.5 }} className="text-lg text-muted-foreground mb-8 max-w-md">{config.hero.subtitle}</motion.p>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75, duration: 0.5 }} className="flex flex-wrap gap-4">
                  <Link to={config.hero.ctaPrimaryLink} className="group inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-all shadow-card hover:shadow-elevated hover:scale-[1.02]">
                    {config.hero.ctaPrimaryText} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  {config.hero.ctaSecondaryText && (
                    <Link to={config.hero.ctaSecondaryLink} className="inline-flex items-center gap-2 px-8 py-3.5 bg-background text-foreground rounded-xl font-medium border border-border hover:bg-secondary transition-all hover:scale-[1.02]">{config.hero.ctaSecondaryText}</Link>
                  )}
                </motion.div>
              </motion.div>
              <motion.div initial={{ opacity: 0, scale: 0.85, rotate: -3 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: [0.32, 0.72, 0, 1] }} className="relative">
                <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="relative rounded-3xl overflow-hidden shadow-elevated">
                  <img src={config.hero.heroImage || heroCake} alt="Premium cake" className="w-full" loading="eager" decoding="async" />
                </motion.div>
                <motion.div animate={{ y: [0, -12, 0], x: [0, 5, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} className="absolute -top-4 -right-4 w-20 h-20 bg-accent/20 rounded-full blur-xl" />
                <motion.div animate={{ y: [0, 10, 0], x: [0, -8, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute -bottom-6 -left-6 w-28 h-28 bg-primary/15 rounded-full blur-xl" />
              </motion.div>
            </div>
          </div>
        </section>
      );
    },
    categories: () => {
      const cols = config.categories.columns || 4;
      const aspectCls = config.categories.cardAspect === "square" ? "aspect-square" : config.categories.cardAspect === "landscape" ? "aspect-video" : "aspect-[3/4]";
      const radiusCls = config.categories.cardRadius === "sm" ? "rounded-lg" : config.categories.cardRadius === "md" ? "rounded-xl" : config.categories.cardRadius === "full" ? "rounded-full" : "rounded-2xl";
      const overlayStyle = config.categories.overlayStyle || "gradient";
      const overlayCls = overlayStyle === "solid" ? "bg-foreground/50" : overlayStyle === "none" ? "" : "bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent group-hover:from-foreground/80 transition-all duration-500";
      const filterType = config.categories.filterType || "occasion";
      const maxItems = config.categories.maxItems || 0;
      const isCarousel = config.categories.layout === "carousel";

      // Build display items
      let displayItems: { name: string; image: string; link: string }[];
      if (filterType === "custom") {
        displayItems = (config.categories.items || []).map(item => ({
          name: item.name,
          image: item.image || catCustom,
          link: item.link || "/shop",
        }));
      } else {
        const itemNames = filterItems.length > 0 ? filterItems : Object.keys(categoryImages);
        const paramKey = filterType === "occasion" ? "occasion" : filterType === "category" ? "category" : "flavour";
        displayItems = itemNames.map(name => ({
          name,
          image: categoryImages[name] || catCustom,
          link: `/shop?${paramKey}=${encodeURIComponent(name)}`,
        }));
      }

      if (maxItems > 0) displayItems = displayItems.slice(0, maxItems);

      const renderCard = (item: typeof displayItems[0], i: number) => (
        <motion.div 
          key={item.name + i} 
          initial={{ opacity: 0, y: 40, scale: 0.9 }} 
          whileInView={{ opacity: 1, y: 0, scale: 1 }} 
          viewport={{ once: true }} 
          transition={{ delay: i * 0.12, type: "spring", stiffness: 100 }}
          className={isCarousel ? "flex-shrink-0 w-[280px] md:w-[320px]" : ""}
        >
          <Link to={item.link} className={`group block relative overflow-hidden ${radiusCls} ${aspectCls}`}>
            <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 will-change-transform group-hover:scale-110" loading="lazy" decoding="async" />
            {overlayStyle !== "none" && (
              <div className={`absolute inset-0 ${overlayCls}`} />
            )}
            <motion.div className="absolute bottom-4 left-4" whileHover={{ x: 5 }}>
              <h3 className="text-lg font-display font-bold text-background">{item.name}</h3>
              <span className="text-xs text-background/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300">Shop Now →</span>
            </motion.div>
          </Link>
        </motion.div>
      );

      return (
        <section key="categories" className="container mx-auto px-4 py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">{config.categories.title}</h2>
            <p className="text-muted-foreground">{config.categories.subtitle}</p>
          </motion.div>
          
          {isCarousel ? (
            <HorizontalCarousel>
              {displayItems.map((item, i) => renderCard(item, i))}
            </HorizontalCarousel>
          ) : (
            <div className="grid gap-4 md:gap-6" style={{ gridTemplateColumns: `repeat(${Math.min(cols, 2)}, 1fr)` }} data-desktop-cols={cols}>
              <style>{`@media(min-width:768px){[data-desktop-cols="${cols}"]{grid-template-columns:repeat(${cols},1fr)!important}}`}</style>
              {displayItems.map((item, i) => renderCard(item, i))}
            </div>
          )}
          
          {config.categories.showViewAll && (
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mt-8">
              <Link to={config.categories.viewAllLink || "/shop"} className="inline-flex items-center gap-1 text-primary font-medium text-sm hover:underline group">
                View All <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          )}
        </section>
      );
    },
    trending: () => {
      const trendCols = config.trending.columns || 4;
      const isCarousel = config.trending.layout === "carousel";
      return (
        <section key="trending" className="container mx-auto px-4 py-16 bg-cream rounded-3xl mx-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-display font-bold mb-2">{config.trending.title}</h2>
              <p className="text-muted-foreground">{config.trending.subtitle}</p>
            </div>
            <Link to="/shop" className="hidden md:inline-flex items-center gap-1 text-primary font-medium text-sm hover:underline group">
              View All <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
          
          {isCarousel ? (
            <HorizontalCarousel>
              {featured.map((product, i) => (
                <motion.div key={product.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }} className="flex-shrink-0 w-[260px] md:w-[280px]">
                  <ProductCard product={product} index={i} />
                </motion.div>
              ))}
            </HorizontalCarousel>
          ) : (
            <div className="grid gap-4 md:gap-6" style={{ gridTemplateColumns: `repeat(${Math.min(trendCols, 2)}, 1fr)` }} data-desktop-cols={`t${trendCols}`}>
              <style>{`@media(min-width:768px){[data-desktop-cols="t${trendCols}"]{grid-template-columns:repeat(${trendCols},1fr)!important}}`}</style>
              {featured.map((product, i) => (
                <motion.div key={product.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}>
                  <ProductCard product={product} index={i} />
                </motion.div>
              ))}
            </div>
          )}
          
          <div className="mt-8 text-center md:hidden">
            <Link to="/shop" className="inline-flex items-center gap-1 text-primary font-medium text-sm hover:underline">View All <ArrowRight className="w-4 h-4" /></Link>
          </div>
        </section>
      );
    },
    howItWorks: () => (
      <section key="howItWorks" className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">{config.howItWorks.title}</h2>
          <p className="text-muted-foreground">{config.howItWorks.subtitle}</p>
        </motion.div>
        <div className={`grid md:grid-cols-${config.howItWorks.steps.length} gap-8`}>
          {config.howItWorks.steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, type: "spring", stiffness: 100 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="text-center p-8 rounded-2xl bg-card shadow-soft hover:shadow-elevated transition-shadow cursor-default"
            >
              <motion.div
                whileHover={{ scale: 1.15, rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
                className="w-16 h-16 rounded-2xl bg-blush flex items-center justify-center mx-auto mb-5 text-2xl"
              >
                {step.emoji}
              </motion.div>
              <h3 className="text-lg font-display font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    ),
    reviews: () => {
      const revCols = config.reviews.columns || 3;
      const isCarousel = config.reviews.layout === "carousel";
      
      const renderReviewCard = (r: any, i: number) => {
        const name = r.author_name || "Customer";
        const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
        return (
          <motion.div key={r.id} initial={{ opacity: 0, y: 30, rotateX: 15 }} whileInView={{ opacity: 1, y: 0, rotateX: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15, type: "spring", stiffness: 80 }} whileHover={{ y: -5, scale: 1.02, transition: { duration: 0.25 } }} className={`bg-background rounded-2xl p-6 shadow-soft hover:shadow-elevated transition-shadow ${isCarousel ? "flex-shrink-0 w-[300px] md:w-[350px]" : ""}`}>
            <div className="flex items-center gap-1 mb-3">
              {Array.from({ length: r.rating }).map((_, j) => (
                <motion.div key={j} initial={{ opacity: 0, scale: 0 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 + j * 0.05 }}>
                  <Star className="w-4 h-4 fill-accent text-accent" />
                </motion.div>
              ))}
            </div>
            <p className="text-sm text-foreground mb-4 leading-relaxed">"{r.comment}"</p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">{initials}</div>
              <div>
                <span className="text-sm font-medium">{name}</span>
                {r.products?.name && <p className="text-xs text-muted-foreground">on {r.products.name}</p>}
              </div>
            </div>
          </motion.div>
        );
      };

      return reviews.length > 0 ? (
        <section key="reviews" className="bg-blush py-20 overflow-hidden">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">{config.reviews.title}</h2>
              <p className="text-muted-foreground">{config.reviews.subtitle}</p>
            </motion.div>
            
            {isCarousel ? (
              <HorizontalCarousel>
                {reviews.slice(0, config.reviews.count).map((r, i) => renderReviewCard(r, i))}
              </HorizontalCarousel>
            ) : (
              <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(1, 1fr)` }} data-desktop-cols={`r${revCols}`}>
                <style>{`@media(min-width:768px){[data-desktop-cols="r${revCols}"]{grid-template-columns:repeat(${revCols},1fr)!important}}`}</style>
                {reviews.slice(0, config.reviews.count).map((r, i) => renderReviewCard(r, i))}
              </div>
            )}
          </div>
        </section>
      ) : null;
    },
  };

  // Render a custom section
  const renderCustomSection = (section: HomepageSection) => {
    const data = section.customData;
    if (!data) return null;

    switch (data.type) {
      case "text_block": {
        const textSizeMap: Record<string, string> = { sm: "text-xl md:text-2xl", md: "text-3xl md:text-4xl", lg: "text-4xl md:text-5xl" };
        const bodySizeMap: Record<string, string> = { sm: "text-sm", md: "text-base", lg: "text-lg" };
        const bgMap: Record<string, string> = { none: "", muted: "bg-muted", cream: "bg-cream", blush: "bg-blush" };
        const bgCls = bgMap[data.textBg || "none"];
        return (
          <section key={section.id} className={`${bgCls} ${bgCls ? "py-16" : ""}`}>
            <div className="container mx-auto px-4 py-16">
              <div className={`max-w-3xl ${data.alignment === "center" ? "mx-auto text-center" : data.alignment === "right" ? "ml-auto text-right" : ""}`}>
                {data.heading && <h2 className={`${textSizeMap[data.textSize || "md"]} font-display font-bold mb-4`}>{data.heading}</h2>}
                {data.body && <p className={`text-muted-foreground leading-relaxed whitespace-pre-line ${bodySizeMap[data.textSize || "md"]}`}>{data.body}</p>}
              </div>
            </div>
          </section>
        );
      }

      case "cta_banner": {
        const bgMap: Record<string, string> = {
          primary: "bg-primary text-primary-foreground",
          blush: "bg-blush text-foreground",
          cream: "bg-cream text-foreground",
          muted: "bg-muted text-foreground",
        };
        const heightMap: Record<string, string> = {
          compact: "min-h-[200px] md:min-h-[250px] py-8 md:py-10",
          medium: "min-h-[280px] md:min-h-[350px] py-12 md:py-16",
          tall: "min-h-[380px] md:min-h-[500px] py-16 md:py-20",
          full: "min-h-[60vh] md:min-h-[80vh] py-16 md:py-20",
          custom: "py-12 md:py-16",
        };
        const layoutAlign: Record<string, string> = {
          center: "text-center items-center",
          left: "text-left items-start",
          right: "text-right items-end",
        };
        const height = data.ctaHeight || "medium";
        const layout = data.ctaLayout || "center";
        const imageFit = data.ctaImageFit || "cover";
        const overlayOpacity = data.ctaOverlayOpacity ?? 50;

        return (
          <section key={section.id} className={`relative overflow-hidden flex items-center ${heightMap[height]} ${data.ctaBgImage ? "text-background" : bgMap[data.ctaBg || "primary"]}`} style={height === "custom" && data.ctaCustomHeight ? { minHeight: `${data.ctaCustomHeight}px` } : undefined}>
            {data.ctaBgImage && (
              <>
                <img
                  src={data.ctaBgImage}
                  alt=""
                  className={`absolute inset-0 w-full h-full ${imageFit === "contain" ? "object-contain" : "object-cover"}`}
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0" style={{ backgroundColor: `hsl(var(--foreground) / ${overlayOpacity / 100})` }} />
              </>
            )}
            <div className={`container mx-auto px-4 relative z-10 flex flex-col ${layoutAlign[layout]}`}>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={`max-w-2xl ${layout === "center" ? "mx-auto" : ""}`}>
                {data.ctaTitle && <h2 className="text-2xl md:text-4xl font-display font-bold mb-3">{data.ctaTitle}</h2>}
                {data.ctaSubtitle && <p className="text-sm md:text-lg opacity-80 mb-6 max-w-lg">{data.ctaSubtitle}</p>}
                {data.ctaButtonText && data.ctaButtonLink && (
                  <Link
                    to={data.ctaButtonLink}
                    className={`inline-flex items-center gap-2 px-6 md:px-8 py-3 md:py-3.5 rounded-xl font-medium transition-opacity hover:opacity-90 shadow-card text-sm md:text-base ${
                      data.ctaBgImage ? "bg-background text-foreground" : data.ctaBg === "primary" ? "bg-background text-foreground" : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {data.ctaButtonText} <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </motion.div>
            </div>
          </section>
        );
      }

      case "feature_grid": {
        const fgCols = data.gridColumns || 4;
        return (
          <section key={section.id} className="container mx-auto px-4 py-16">
            <div className="text-center mb-12">
              {data.gridTitle && <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">{data.gridTitle}</h2>}
              {data.gridSubtitle && <p className="text-muted-foreground">{data.gridSubtitle}</p>}
            </div>
            <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${Math.min(fgCols, 2)}, 1fr)` }} data-desktop-cols={`fg${fgCols}`}>
              <style>{`@media(min-width:768px){[data-desktop-cols="fg${fgCols}"]{grid-template-columns:repeat(${fgCols},1fr)!important}}`}</style>
              {(data.features || []).map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center p-6 rounded-2xl bg-card shadow-soft hover:shadow-card transition-shadow">
                  <div className="text-3xl mb-3">{f.emoji}</div>
                  <h3 className="text-sm font-display font-semibold mb-1">{f.title}</h3>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </section>
        );
      }

      case "faq":
        return (
          <section key={section.id} className="container mx-auto px-4 py-16">
            <div className="text-center mb-12">
              {data.faqTitle && <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">{data.faqTitle}</h2>}
              {data.faqSubtitle && <p className="text-muted-foreground">{data.faqSubtitle}</p>}
            </div>
            <div className="max-w-2xl mx-auto space-y-3">
              {(data.faqs || []).map((faq, i) => (
                <FaqItem key={i} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </section>
        );

      case "spacer":
        return <div key={section.id} style={{ height: data.spacerHeight || 60 }} />;

      case "image_gallery": {
        const galCols = data.galleryColumns || 3;
        const galAspect = data.galleryAspect === "portrait" ? "aspect-[3/4]" : data.galleryAspect === "landscape" ? "aspect-video" : "aspect-square";
        const useCarousel = data.galleryLayout === "carousel";
        const galleryImages = data.images || [];
        
        const galleryContent = galleryImages.map((img, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className={`relative rounded-2xl overflow-hidden bg-muted ${galAspect} ${useCarousel ? "shrink-0 w-[280px] md:w-[320px]" : ""}`}>
            {img.url && <img src={img.url} alt={img.caption || ""} className="w-full h-full object-cover" loading="lazy" decoding="async" />}
            {img.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/60 to-transparent p-3">
                <p className="text-xs text-background font-medium">{img.caption}</p>
              </div>
            )}
          </motion.div>
        ));

        return (
          <section key={section.id} className="container mx-auto px-4 py-16">
            <div className="text-center mb-12">
              {data.galleryTitle && <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">{data.galleryTitle}</h2>}
              {data.gallerySubtitle && <p className="text-muted-foreground">{data.gallerySubtitle}</p>}
            </div>
            {galleryImages.length > 0 && (
              useCarousel ? (
                <HorizontalCarousel>{galleryContent}</HorizontalCarousel>
              ) : (
                <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(galCols, 2)}, 1fr)` }} data-desktop-cols={`gal${galCols}`}>
                  <style>{`@media(min-width:768px){[data-desktop-cols="gal${galCols}"]{grid-template-columns:repeat(${galCols},1fr)!important}}`}</style>
                  {galleryContent}
                </div>
              )
            )}
          </section>
        );
      }

      default:
        return null;
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(`section-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      {config.sections
        .filter(s => s.visible)
        .map((s) => {
          // Skip sectionNav and footer — they're handled separately
          if (s.id === "sectionNav") {
            if (!config.sectionNav.enabled) return null;
            const navItems = config.sectionNav.items.filter(item => item.visible);
            if (navItems.length === 0) return null;
            return <SectionNavBar key="sectionNav" items={navItems} onNavigate={scrollToSection} />;
          }
          if (s.id === "footer") return null; // Footer rendered in App.tsx

          return (
            <div key={s.id} id={`section-${s.id}`}>
              {BUILTIN_SECTION_IDS.includes(s.id)
                ? sectionRenderers[s.id]?.()
                : renderCustomSection(s)}
            </div>
          );
        })}
    </div>
  );
}

// FAQ accordion item
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      className="border border-border rounded-2xl overflow-hidden"
      initial={false}
      animate={{ backgroundColor: open ? "hsl(var(--secondary) / 0.3)" : "transparent" }}
    >
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 text-left hover:bg-secondary/30 transition-colors active:scale-[0.99]">
        <span className="text-sm font-semibold pr-4">{question}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0">
              <p className="text-sm text-muted-foreground leading-relaxed">{answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Section navigation bar
function SectionNavBar({
  items,
  onNavigate,
}: {
  items: SectionNavItem[];
  onNavigate: (id: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el?.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, items]);

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 200, behavior: "smooth" });
  };

  if (items.length === 0) return null;

  return (
    <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-4 relative">
        {canScrollLeft && (
          <button
            onClick={() => scroll(-1)}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-background shadow-card flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        <div
          ref={scrollRef}
          className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-2.5 px-6"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {items.map((item) => (
            <button
              key={item.sectionId}
              onClick={() => onNavigate(item.sectionId)}
              className="shrink-0 px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors whitespace-nowrap"
            >
              {item.label}
            </button>
          ))}
        </div>
        {canScrollRight && (
          <button
            onClick={() => scroll(1)}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-background shadow-card flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
