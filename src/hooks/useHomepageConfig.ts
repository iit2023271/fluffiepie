import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// ─── Custom Section Types ───
export type CustomSectionType = "text_block" | "cta_banner" | "feature_grid" | "faq" | "spacer" | "image_gallery";

export interface CustomSectionData {
  type: CustomSectionType;
  // text_block
  heading?: string;
  body?: string;
  alignment?: "left" | "center" | "right";
  // cta_banner
  ctaTitle?: string;
  ctaSubtitle?: string;
  ctaButtonText?: string;
  ctaButtonLink?: string;
  ctaBg?: "primary" | "blush" | "cream" | "muted";
  ctaBgImage?: string;
  ctaHeight?: "compact" | "medium" | "tall" | "full";
  ctaImageFit?: "cover" | "contain";
  ctaLayout?: "center" | "left" | "right";
  ctaOverlayOpacity?: number;
  // feature_grid
  gridTitle?: string;
  gridSubtitle?: string;
  features?: { emoji: string; title: string; desc: string }[];
  // faq
  faqTitle?: string;
  faqSubtitle?: string;
  faqs?: { question: string; answer: string }[];
  // spacer
  spacerHeight?: number;
  // image_gallery
  galleryTitle?: string;
  gallerySubtitle?: string;
  galleryColumns?: number;
  galleryAspect?: "square" | "portrait" | "landscape";
  images?: { url: string; caption: string }[];
  // text_block extras
  textSize?: "sm" | "md" | "lg";
  textBg?: "none" | "muted" | "cream" | "blush";
  // feature_grid extras
  gridColumns?: number;
}

export interface HomepageSection {
  id: string;
  visible: boolean;
  label?: string; // custom label for custom sections
  customType?: CustomSectionType;
  customData?: CustomSectionData;
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
  heroImage?: string;
  imagePosition?: "left" | "right";
  heroHeight?: "compact" | "default" | "tall";
}

export interface CategoriesConfig {
  title: string;
  subtitle: string;
  columns?: number;
  cardAspect?: "portrait" | "square" | "landscape";
}

export interface TrendingConfig {
  title: string;
  subtitle: string;
  count: number;
  columns?: number;
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
  columns?: number;
}

export interface SectionNavItem {
  sectionId: string;
  label: string;
  visible: boolean;
}

export interface SectionNavConfig {
  enabled: boolean;
  items: SectionNavItem[];
}

export interface FooterLink {
  label: string;
  url: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export interface FooterConfig {
  brandDescription: string;
  columns: FooterColumn[];
  newsletterEnabled: boolean;
  newsletterTitle: string;
  newsletterSubtitle: string;
  copyrightText: string;
}

export interface HomepageConfig {
  sections: HomepageSection[];
  hero: HeroConfig;
  categories: CategoriesConfig;
  trending: TrendingConfig;
  howItWorks: HowItWorksConfig;
  reviews: ReviewsConfig;
  sectionNav: SectionNavConfig;
  footer: FooterConfig;
}

export const BUILTIN_SECTION_IDS = ["banners", "hero", "categories", "trending", "howItWorks", "reviews", "sectionNav", "footer"];

export const DEFAULT_HOMEPAGE_CONFIG: HomepageConfig = {
  sections: [
    { id: "banners", visible: true },
    { id: "sectionNav", visible: true },
    { id: "hero", visible: true },
    { id: "categories", visible: true },
    { id: "trending", visible: true },
    { id: "howItWorks", visible: true },
    { id: "reviews", visible: true },
    { id: "footer", visible: true },
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
  sectionNav: {
    enabled: true,
    items: [
      { sectionId: "categories", label: "Occasions", visible: true },
      { sectionId: "trending", label: "Trending", visible: true },
      { sectionId: "howItWorks", label: "How It Works", visible: true },
      { sectionId: "reviews", label: "Reviews", visible: true },
    ],
  },
  footer: {
    brandDescription: "Handcrafted with love. Delivering happiness, one slice at a time. Premium cakes for every occasion.",
    columns: [
      {
        title: "Quick Links",
        links: [
          { label: "Shop All", url: "/shop" },
          { label: "Birthday Cakes", url: "/shop?occasion=Birthday" },
          { label: "Wedding Cakes", url: "/shop?occasion=Wedding" },
          { label: "Custom Orders", url: "/shop?occasion=Custom" },
        ],
      },
      {
        title: "Support",
        links: [
          { label: "Contact Us", url: "#" },
          { label: "FAQs", url: "#" },
          { label: "Shipping Info", url: "#" },
          { label: "Returns", url: "#" },
        ],
      },
    ],
    newsletterEnabled: true,
    newsletterTitle: "Newsletter",
    newsletterSubtitle: "Get fresh updates & sweet deals.",
    copyrightText: "© 2026 FluffiePie. All rights reserved.",
  },
};

export const SECTION_LABELS: Record<string, string> = {
  banners: "Banner Carousel",
  hero: "Hero Section",
  categories: "Shop by Occasion",
  trending: "Trending Products",
  howItWorks: "How It Works",
  reviews: "Customer Reviews",
  sectionNav: "Section Navigation Bar",
  footer: "Footer",
};

export const CUSTOM_TYPE_LABELS: Record<CustomSectionType, { label: string; emoji: string; desc: string }> = {
  text_block: { label: "Text Block", emoji: "📝", desc: "Heading + body text" },
  cta_banner: { label: "CTA Banner", emoji: "📣", desc: "Call-to-action with button" },
  feature_grid: { label: "Feature Grid", emoji: "🔲", desc: "Grid of features with icons" },
  faq: { label: "FAQ Section", emoji: "❓", desc: "Frequently asked questions" },
  spacer: { label: "Spacer", emoji: "↕️", desc: "Empty space divider" },
  image_gallery: { label: "Image Gallery", emoji: "🖼️", desc: "Grid of images with captions" },
};

export function getDefaultCustomData(type: CustomSectionType): CustomSectionData {
  switch (type) {
    case "text_block":
      return { type, heading: "Our Story", body: "Tell your customers about your bakery, values, or anything special.", alignment: "center" };
    case "cta_banner":
      return { type, ctaTitle: "Special Offer!", ctaSubtitle: "Get 20% off on your first order", ctaButtonText: "Shop Now", ctaButtonLink: "/shop", ctaBg: "primary" };
    case "feature_grid":
      return { type, gridTitle: "Why Choose Us", gridSubtitle: "What makes us special", features: [
        { emoji: "🎂", title: "Fresh Daily", desc: "Baked every morning" },
        { emoji: "💯", title: "Premium Quality", desc: "Only the best ingredients" },
        { emoji: "🚚", title: "Fast Delivery", desc: "Same day delivery" },
        { emoji: "💝", title: "Made with Love", desc: "Every cake is special" },
      ]};
    case "faq":
      return { type, faqTitle: "Frequently Asked Questions", faqSubtitle: "Got questions? We've got answers", faqs: [
        { question: "How do I place an order?", answer: "Simply browse our collection, pick your cake, choose the size and place your order." },
        { question: "Do you deliver same day?", answer: "Yes! Orders placed before 2 PM qualify for same day delivery." },
      ]};
    case "spacer":
      return { type, spacerHeight: 60 };
    case "image_gallery":
      return { type, galleryTitle: "Our Creations", gallerySubtitle: "Browse our latest masterpieces", images: [] };
  }
}

export function normalizeHomepageSections(sections?: HomepageSection[]): HomepageSection[] {
  const base = sections?.length ? sections : DEFAULT_HOMEPAGE_CONFIG.sections;
  const normalized: HomepageSection[] = [];
  const seen = new Set<string>();

  for (const section of base) {
    if (!seen.has(section.id)) {
      normalized.push(section);
      seen.add(section.id);
    }
  }

  for (const section of DEFAULT_HOMEPAGE_CONFIG.sections) {
    if (!seen.has(section.id)) {
      normalized.push(section);
      seen.add(section.id);
    }
  }

  return normalized;
}

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
          setConfig({
            ...DEFAULT_HOMEPAGE_CONFIG,
            ...parsed,
            hero: { ...DEFAULT_HOMEPAGE_CONFIG.hero, ...(parsed.hero || {}) },
            categories: { ...DEFAULT_HOMEPAGE_CONFIG.categories, ...(parsed.categories || {}) },
            trending: { ...DEFAULT_HOMEPAGE_CONFIG.trending, ...(parsed.trending || {}) },
            howItWorks: { ...DEFAULT_HOMEPAGE_CONFIG.howItWorks, ...(parsed.howItWorks || {}) },
            reviews: { ...DEFAULT_HOMEPAGE_CONFIG.reviews, ...(parsed.reviews || {}) },
            sectionNav: { ...DEFAULT_HOMEPAGE_CONFIG.sectionNav, ...(parsed.sectionNav || {}), items: parsed.sectionNav?.items || DEFAULT_HOMEPAGE_CONFIG.sectionNav.items },
            footer: { ...DEFAULT_HOMEPAGE_CONFIG.footer, ...(parsed.footer || {}), columns: parsed.footer?.columns || DEFAULT_HOMEPAGE_CONFIG.footer.columns },
            sections: normalizeHomepageSections(parsed.sections),
          });
        } catch { /* use defaults */ }
      }
      setLoading(false);
    };
    load();
  }, []);

  return { config, loading };
}
