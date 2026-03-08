import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface HomepageSection {
  id: string;
  visible: boolean;
}

export interface HeroConfig {
  badge: string;
  titleLine1: string;
  titleLine2: string;
  subtitle: string;
  ctaPrimaryText: string;
  ctaPrimaryLink: string;
  ctaSecondaryText: string;
  ctaSecondaryLink: string;
}

export interface CategoriesConfig {
  title: string;
  subtitle: string;
}

export interface TrendingConfig {
  title: string;
  subtitle: string;
  count: number;
}

export interface HowItWorksConfig {
  title: string;
  subtitle: string;
  steps: { emoji: string; title: string; desc: string }[];
}

export interface ReviewsConfig {
  title: string;
  subtitle: string;
  count: number;
}

export interface HomepageConfig {
  sections: HomepageSection[];
  hero: HeroConfig;
  categories: CategoriesConfig;
  trending: TrendingConfig;
  howItWorks: HowItWorksConfig;
  reviews: ReviewsConfig;
}

export const DEFAULT_HOMEPAGE_CONFIG: HomepageConfig = {
  sections: [
    { id: "banners", visible: true },
    { id: "hero", visible: true },
    { id: "categories", visible: true },
    { id: "trending", visible: true },
    { id: "howItWorks", visible: true },
    { id: "reviews", visible: true },
  ],
  hero: {
    badge: "🎂 Freshly Baked, Daily",
    titleLine1: "Cakes That Make",
    titleLine2: "Moments Magic",
    subtitle: "Handcrafted premium cakes for every celebration. Order online and get it delivered fresh to your doorstep.",
    ctaPrimaryText: "Order Now",
    ctaPrimaryLink: "/shop",
    ctaSecondaryText: "Custom Cake",
    ctaSecondaryLink: "/shop?occasion=Custom",
  },
  categories: {
    title: "Shop by Occasion",
    subtitle: "Find the perfect cake for your celebration",
  },
  trending: {
    title: "Trending Cakes",
    subtitle: "Our most loved creations",
    count: 4,
  },
  howItWorks: {
    title: "How It Works",
    subtitle: "Three simple steps to your dream cake",
    steps: [
      { emoji: "🎨", title: "Choose & Customize", desc: "Pick your cake and personalize it" },
      { emoji: "🧁", title: "We Bake Fresh", desc: "Handcrafted by expert bakers" },
      { emoji: "🚚", title: "Delivered to You", desc: "Right on time, every time" },
    ],
  },
  reviews: {
    title: "What Our Customers Say",
    subtitle: "Real reviews from real cake lovers",
    count: 3,
  },
};

export const SECTION_LABELS: Record<string, string> = {
  banners: "Banner Carousel",
  hero: "Hero Section",
  categories: "Shop by Occasion",
  trending: "Trending Products",
  howItWorks: "How It Works",
  reviews: "Customer Reviews",
};

export function useHomepageConfig() {
  const [config, setConfig] = useState<HomepageConfig>(DEFAULT_HOMEPAGE_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("store_config")
        .select("value")
        .eq("config_type", "homepage_config")
        .eq("is_active", true)
        .maybeSingle();
      if (data?.value) {
        try {
          const parsed = JSON.parse(data.value);
          // Merge with defaults to ensure new fields are present
          setConfig({
            ...DEFAULT_HOMEPAGE_CONFIG,
            ...parsed,
            hero: { ...DEFAULT_HOMEPAGE_CONFIG.hero, ...(parsed.hero || {}) },
            categories: { ...DEFAULT_HOMEPAGE_CONFIG.categories, ...(parsed.categories || {}) },
            trending: { ...DEFAULT_HOMEPAGE_CONFIG.trending, ...(parsed.trending || {}) },
            howItWorks: { ...DEFAULT_HOMEPAGE_CONFIG.howItWorks, ...(parsed.howItWorks || {}) },
            reviews: { ...DEFAULT_HOMEPAGE_CONFIG.reviews, ...(parsed.reviews || {}) },
            sections: parsed.sections || DEFAULT_HOMEPAGE_CONFIG.sections,
          });
        } catch { /* use defaults */ }
      }
      setLoading(false);
    };
    load();
  }, []);

  return { config, loading };
}
