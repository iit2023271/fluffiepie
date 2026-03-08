import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Truck, Palette, Gift, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/ProductCard";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

import heroCake from "@/assets/hero-cake.jpg";
import catBirthday from "@/assets/category-birthday.jpg";
import catWedding from "@/assets/category-wedding.jpg";
import catAnniversary from "@/assets/category-anniversary.jpg";
import catCustom from "@/assets/category-custom.jpg";

const categoryImages = [
  { name: "Birthday", slug: "Birthday", image: catBirthday },
  { name: "Wedding", slug: "Wedding", image: catWedding },
  { name: "Anniversary", slug: "Anniversary", image: catAnniversary },
  { name: "Custom", slug: "Custom", image: catCustom },
];

const steps = [
  { icon: Palette, title: "Choose & Customize", desc: "Pick your cake and personalize it" },
  { icon: Gift, title: "We Bake Fresh", desc: "Handcrafted by expert bakers" },
  { icon: Truck, title: "Delivered to You", desc: "Right on time, every time" },
];


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
    <div className="relative w-full overflow-hidden rounded-3xl bg-muted shadow-elevated">
      <div className="relative aspect-[21/9] md:aspect-[3/1] w-full">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={banner.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            {banner.image_url ? (
              <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
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
  const { data: allProducts = [] } = useProducts();
  const featured = allProducts.filter((p) => p.isBestseller || p.isNew).slice(0, 4);

  const [reviews, setReviews] = useState<any[]>([]);
  useEffect(() => {
    const loadReviews = async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*, profiles!reviews_user_id_fkey(full_name), products!reviews_product_id_fkey(name)")
        .gte("rating", 4)
        .not("comment", "is", null)
        .order("created_at", { ascending: false })
        .limit(6);
      if (data) setReviews(data);
    };
    loadReviews();
  }, []);

  return (
    <div>
      {/* Banner Carousel */}
      <section className="container mx-auto px-4 pt-6 pb-2">
        <HeroBannerCarousel />
      </section>

      {/* Hero */}
      <section className="relative overflow-hidden bg-cream">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <span className="inline-block px-4 py-1.5 bg-blush text-primary text-sm font-medium rounded-full mb-6">
                🎂 Freshly Baked, Daily
              </span>
              <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground leading-tight mb-6">
                Cakes That Make
                <br />
                <span className="text-primary">Moments Magic</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-md">
                Handcrafted premium cakes for every celebration. Order online and get it delivered fresh to your doorstep.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity shadow-card"
                >
                  Order Now <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/shop?occasion=Custom"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-background text-foreground rounded-xl font-medium border border-border hover:bg-secondary transition-colors"
                >
                  Custom Cake
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-elevated">
                <img src={heroCake} alt="Premium chocolate cake with berries and gold leaf" className="w-full" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">Shop by Occasion</h2>
          <p className="text-muted-foreground">Find the perfect cake for your celebration</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categoryImages.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                to={`/shop?occasion=${cat.slug}`}
                className="group block relative rounded-2xl overflow-hidden aspect-[3/4]"
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <h3 className="text-lg font-display font-bold text-background">{cat.name}</h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4 py-16 bg-cream rounded-3xl mx-4">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-display font-bold mb-2">Trending Cakes</h2>
            <p className="text-muted-foreground">Our most loved creations</p>
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

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">How It Works</h2>
          <p className="text-muted-foreground">Three simple steps to your dream cake</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="text-center p-8 rounded-2xl bg-card shadow-soft hover:shadow-card transition-shadow"
            >
              <div className="w-16 h-16 rounded-2xl bg-blush flex items-center justify-center mx-auto mb-5">
                <step.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-display font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {reviews.length > 0 && (
        <section className="bg-blush py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">What Our Customers Say</h2>
              <p className="text-muted-foreground">Real reviews from real cake lovers</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {reviews.slice(0, 3).map((r, i) => {
                const name = r.profiles?.full_name || "Customer";
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
      )}
    </div>
  );
}
