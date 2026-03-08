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
      <div className="relative aspect-[21/9] md:aspect-[3/1] w-full">
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
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
              className={`w-2 h-2 rounded-full transition-all ${i === current ? "bg-background w-6" : "bg-background/50"}`}
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
  const featured = allProducts.filter((p) => p.isBestseller || p.isNew).slice(0, config.trending.count);

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

  // Get categories from store_config
  const [occasions, setOccasions] = useState<string[]>([]);
  useEffect(() => {
    supabase
      .from("store_config")
      .select("value")
      .eq("config_type", "occasion")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data) setOccasions(data.map(d => d.value));
      });
  }, []);

  // Build section renderers
  const sectionRenderers: Record<string, () => React.ReactNode> = {
    banners: () => (
      <section key="banners" className="container mx-auto px-4 pt-6 pb-2">
        <HeroBannerCarousel />
      </section>
    ),
    hero: () => (
      <section key="hero" className="relative overflow-hidden bg-cream">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            >
              <span className="inline-block px-4 py-1.5 bg-blush text-primary text-sm font-medium rounded-full mb-6">
                {config.hero.badge}
              </span>
              <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground leading-tight mb-6">
                {config.hero.titleLine1}
                <br />
                <span className="text-primary">{config.hero.titleLine2}</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-md">
                {config.hero.subtitle}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to={config.hero.ctaPrimaryLink}
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity shadow-card"
                >
                  {config.hero.ctaPrimaryText} <ArrowRight className="w-4 h-4" />
                </Link>
                {config.hero.ctaSecondaryText && (
                  <Link
                    to={config.hero.ctaSecondaryLink}
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-background text-foreground rounded-xl font-medium border border-border hover:bg-secondary transition-colors"
                  >
                    {config.hero.ctaSecondaryText}
                  </Link>
                )}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-elevated">
                <img src={config.hero.heroImage || heroCake} alt="Premium cake" className="w-full" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    ),
    categories: () => {
      const displayOccasions = occasions.length > 0 ? occasions.filter(o => categoryImages[o]) : Object.keys(categoryImages);
      return (
        <section key="categories" className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">{config.categories.title}</h2>
            <p className="text-muted-foreground">{config.categories.subtitle}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {displayOccasions.slice(0, 4).map((name, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  to={`/shop?occasion=${name}`}
                  className="group block relative rounded-2xl overflow-hidden aspect-[3/4]"
                >
                  <img
                    src={categoryImages[name] || catCustom}
                    alt={name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <h3 className="text-lg font-display font-bold text-background">{name}</h3>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      );
    },
    trending: () => (
      <section key="trending" className="container mx-auto px-4 py-16 bg-cream rounded-3xl mx-4">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-display font-bold mb-2">{config.trending.title}</h2>
            <p className="text-muted-foreground">{config.trending.subtitle}</p>
          </div>
          <Link
            to="/shop"
            className="hidden md:inline-flex items-center gap-1 text-primary font-medium text-sm hover:underline"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {featured.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
        <div className="mt-8 text-center md:hidden">
          <Link to="/shop" className="inline-flex items-center gap-1 text-primary font-medium text-sm hover:underline">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    ),
    howItWorks: () => (
      <section key="howItWorks" className="container mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">{config.howItWorks.title}</h2>
          <p className="text-muted-foreground">{config.howItWorks.subtitle}</p>
        </div>
        <div className={`grid md:grid-cols-${config.howItWorks.steps.length} gap-8`}>
          {config.howItWorks.steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="text-center p-8 rounded-2xl bg-card shadow-soft hover:shadow-card transition-shadow"
            >
              <div className="w-16 h-16 rounded-2xl bg-blush flex items-center justify-center mx-auto mb-5 text-2xl">
                {step.emoji}
              </div>
              <h3 className="text-lg font-display font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    ),
    reviews: () =>
      reviews.length > 0 ? (
        <section key="reviews" className="bg-blush py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">{config.reviews.title}</h2>
              <p className="text-muted-foreground">{config.reviews.subtitle}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {reviews.slice(0, config.reviews.count).map((r, i) => {
                const name = r.author_name || "Customer";
                const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-background rounded-2xl p-6 shadow-soft"
                  >
                    <div className="flex items-center gap-1 mb-3">
                      {Array.from({ length: r.rating }).map((_, j) => (
                        <Star key={j} className="w-4 h-4 fill-accent text-accent" />
                      ))}
                    </div>
                    <p className="text-sm text-foreground mb-4 leading-relaxed">"{r.comment}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                        {initials}
                      </div>
                      <div>
                        <span className="text-sm font-medium">{name}</span>
                        {r.products?.name && <p className="text-xs text-muted-foreground">on {r.products.name}</p>}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null,
  };

  // Render a custom section
  const renderCustomSection = (section: HomepageSection) => {
    const data = section.customData;
    if (!data) return null;

    switch (data.type) {
      case "text_block":
        return (
          <section key={section.id} className="container mx-auto px-4 py-16">
            <div className={`max-w-3xl ${data.alignment === "center" ? "mx-auto text-center" : data.alignment === "right" ? "ml-auto text-right" : ""}`}>
              {data.heading && <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">{data.heading}</h2>}
              {data.body && <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{data.body}</p>}
            </div>
          </section>
        );

      case "cta_banner": {
        const bgMap: Record<string, string> = {
          primary: "bg-primary text-primary-foreground",
          blush: "bg-blush text-foreground",
          cream: "bg-cream text-foreground",
          muted: "bg-muted text-foreground",
        };
        return (
          <section key={section.id} className={`relative py-16 overflow-hidden ${data.ctaBgImage ? "text-background" : bgMap[data.ctaBg || "primary"]}`}>
            {data.ctaBgImage && (
              <>
                <img src={data.ctaBgImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-foreground/50" />
              </>
            )}
            <div className="container mx-auto px-4 text-center relative z-10">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                {data.ctaTitle && <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">{data.ctaTitle}</h2>}
                {data.ctaSubtitle && <p className="text-lg opacity-80 mb-6 max-w-lg mx-auto">{data.ctaSubtitle}</p>}
                {data.ctaButtonText && data.ctaButtonLink && (
                  <Link
                    to={data.ctaButtonLink}
                    className={`inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-medium transition-opacity hover:opacity-90 shadow-card ${
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

      case "feature_grid":
        return (
          <section key={section.id} className="container mx-auto px-4 py-16">
            <div className="text-center mb-12">
              {data.gridTitle && <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">{data.gridTitle}</h2>}
              {data.gridSubtitle && <p className="text-muted-foreground">{data.gridSubtitle}</p>}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {(data.features || []).map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center p-6 rounded-2xl bg-card shadow-soft hover:shadow-card transition-shadow"
                >
                  <div className="text-3xl mb-3">{f.emoji}</div>
                  <h3 className="text-sm font-display font-semibold mb-1">{f.title}</h3>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </section>
        );

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

      case "image_gallery":
        return (
          <section key={section.id} className="container mx-auto px-4 py-16">
            <div className="text-center mb-12">
              {data.galleryTitle && <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">{data.galleryTitle}</h2>}
              {data.gallerySubtitle && <p className="text-muted-foreground">{data.gallerySubtitle}</p>}
            </div>
            {(data.images || []).length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {(data.images || []).map((img, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="relative rounded-2xl overflow-hidden bg-muted aspect-square"
                  >
                    {img.url && <img src={img.url} alt={img.caption || ""} className="w-full h-full object-cover" />}
                    {img.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/60 to-transparent p-3">
                        <p className="text-xs text-background font-medium">{img.caption}</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        );

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
    <div className="border border-border rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 text-left hover:bg-secondary/30 transition-colors">
        <span className="text-sm font-semibold pr-4">{question}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 pt-0">
          <p className="text-sm text-muted-foreground leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
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
