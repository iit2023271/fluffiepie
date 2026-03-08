import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ThemeColors {
  background: string;
  foreground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  accent: string;
  cream: string;
  blush: string;
  card: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  emoji: string;
  description: string;
  colors: ThemeColors;
  bannerText?: string;
  bannerEmoji?: string;
  bannerBg?: string;
  bannerTextColor?: string;
  isCustom?: boolean;
}

export const DEFAULT_COLORS: ThemeColors = {
  background: "30 33% 97%",
  foreground: "20 25% 15%",
  primary: "350 45% 55%",
  primaryForeground: "30 33% 97%",
  secondary: "30 30% 92%",
  accent: "38 70% 55%",
  cream: "35 40% 95%",
  blush: "350 40% 92%",
  card: "30 30% 98%",
};

export const THEME_PRESETS: ThemeConfig[] = [
  {
    id: "default",
    name: "Default",
    emoji: "🎂",
    description: "Classic warm bakery theme",
    colors: DEFAULT_COLORS,
  },
  {
    id: "christmas",
    name: "Christmas",
    emoji: "🎄",
    description: "Festive red & green holiday vibes",
    colors: {
      background: "140 15% 96%",
      foreground: "150 20% 12%",
      primary: "0 70% 45%",
      primaryForeground: "0 0% 100%",
      secondary: "140 25% 90%",
      accent: "45 80% 50%",
      cream: "140 20% 94%",
      blush: "0 40% 92%",
      card: "140 15% 98%",
    },
    bannerText: "🎅 Merry Christmas! Special holiday cakes available!",
    bannerEmoji: "❄️",
    bannerBg: "0 70% 45%",
    bannerTextColor: "0 0% 100%",
  },
  {
    id: "diwali",
    name: "Diwali",
    emoji: "🪔",
    description: "Rich gold & deep purple festive glow",
    colors: {
      background: "40 30% 96%",
      foreground: "280 30% 12%",
      primary: "280 50% 40%",
      primaryForeground: "40 30% 97%",
      secondary: "40 35% 90%",
      accent: "42 85% 55%",
      cream: "40 35% 94%",
      blush: "280 30% 92%",
      card: "40 25% 98%",
    },
    bannerText: "🪔 Happy Diwali! Celebrate with our festive collection!",
    bannerEmoji: "✨",
    bannerBg: "280 50% 40%",
    bannerTextColor: "40 30% 97%",
  },
  {
    id: "valentines",
    name: "Valentine's Day",
    emoji: "💕",
    description: "Romantic pink & red love theme",
    colors: {
      background: "340 30% 97%",
      foreground: "340 25% 12%",
      primary: "340 65% 50%",
      primaryForeground: "0 0% 100%",
      secondary: "340 30% 92%",
      accent: "350 70% 60%",
      cream: "340 25% 95%",
      blush: "340 50% 92%",
      card: "340 25% 98%",
    },
    bannerText: "💕 Happy Valentine's Day! Gift a cake of love!",
    bannerEmoji: "❤️",
    bannerBg: "340 65% 50%",
    bannerTextColor: "0 0% 100%",
  },
  {
    id: "eid",
    name: "Eid",
    emoji: "🌙",
    description: "Elegant green & gold celebration",
    colors: {
      background: "150 20% 96%",
      foreground: "160 25% 12%",
      primary: "160 50% 35%",
      primaryForeground: "0 0% 100%",
      secondary: "150 25% 91%",
      accent: "42 80% 52%",
      cream: "150 20% 94%",
      blush: "160 25% 92%",
      card: "150 18% 98%",
    },
    bannerText: "🌙 Eid Mubarak! Sweeten your celebration with us!",
    bannerEmoji: "⭐",
    bannerBg: "160 50% 35%",
    bannerTextColor: "0 0% 100%",
  },
  {
    id: "halloween",
    name: "Halloween",
    emoji: "🎃",
    description: "Spooky orange & dark purple",
    colors: {
      background: "30 15% 95%",
      foreground: "270 30% 12%",
      primary: "25 90% 50%",
      primaryForeground: "0 0% 100%",
      secondary: "270 15% 90%",
      accent: "45 85% 55%",
      cream: "30 20% 93%",
      blush: "270 20% 92%",
      card: "30 12% 97%",
    },
    bannerText: "🎃 Happy Halloween! Try our spooky cake designs!",
    bannerEmoji: "👻",
    bannerBg: "25 90% 50%",
    bannerTextColor: "0 0% 100%",
  },
  {
    id: "newyear",
    name: "New Year",
    emoji: "🎆",
    description: "Glamorous black & gold elegance",
    colors: {
      background: "45 15% 96%",
      foreground: "45 10% 10%",
      primary: "45 80% 48%",
      primaryForeground: "45 10% 8%",
      secondary: "45 20% 90%",
      accent: "45 85% 55%",
      cream: "45 20% 94%",
      blush: "45 25% 91%",
      card: "45 15% 98%",
    },
    bannerText: "🎆 Happy New Year! Start fresh with our new collection!",
    bannerEmoji: "🥂",
    bannerBg: "45 10% 10%",
    bannerTextColor: "45 80% 65%",
  },
  {
    id: "holi",
    name: "Holi",
    emoji: "🎨",
    description: "Vibrant multi-color celebration",
    colors: {
      background: "280 20% 97%",
      foreground: "280 25% 12%",
      primary: "280 60% 55%",
      primaryForeground: "0 0% 100%",
      secondary: "180 30% 90%",
      accent: "45 85% 55%",
      cream: "60 30% 94%",
      blush: "320 40% 92%",
      card: "280 15% 98%",
    },
    bannerText: "🎨 Happy Holi! Colorful cakes for a colorful festival!",
    bannerEmoji: "🌈",
    bannerBg: "280 60% 55%",
    bannerTextColor: "0 0% 100%",
  },
];

const CSS_VAR_MAP: Record<keyof ThemeColors, string> = {
  background: "--background",
  foreground: "--foreground",
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  secondary: "--secondary",
  accent: "--accent",
  cream: "--cream",
  blush: "--blush",
  card: "--card",
};

export function applyTheme(colors: ThemeColors) {
  const root = document.documentElement;
  for (const [key, cssVar] of Object.entries(CSS_VAR_MAP)) {
    const value = colors[key as keyof ThemeColors];
    if (value) root.style.setProperty(cssVar, value);
  }
  // Also update related vars
  root.style.setProperty("--card-foreground", colors.foreground);
  root.style.setProperty("--popover", colors.card);
  root.style.setProperty("--popover-foreground", colors.foreground);
  root.style.setProperty("--ring", colors.primary);
}

export function resetTheme() {
  const root = document.documentElement;
  for (const cssVar of Object.values(CSS_VAR_MAP)) {
    root.style.removeProperty(cssVar);
  }
  root.style.removeProperty("--card-foreground");
  root.style.removeProperty("--popover");
  root.style.removeProperty("--popover-foreground");
  root.style.removeProperty("--ring");
}

export interface ActiveThemeData {
  themeId: string;
  customColors?: ThemeColors;
  bannerText?: string;
  bannerEmoji?: string;
  bannerBg?: string;
  bannerTextColor?: string;
}

export function useThemeConfig() {
  const [activeTheme, setActiveTheme] = useState<ActiveThemeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("store_config")
        .select("value")
        .eq("config_type", "active_theme")
        .eq("is_active", true)
        .maybeSingle();

      if (data?.value) {
        try {
          const parsed: ActiveThemeData = JSON.parse(data.value);
          setActiveTheme(parsed);

          // Apply theme
          if (parsed.themeId === "default") {
            resetTheme();
          } else if (parsed.customColors) {
            applyTheme(parsed.customColors);
          } else {
            const preset = THEME_PRESETS.find(t => t.id === parsed.themeId);
            if (preset) applyTheme(preset.colors);
          }
        } catch {
          resetTheme();
        }
      } else {
        resetTheme();
      }
      setLoading(false);
    };
    load();
  }, []);

  return { activeTheme, loading };
}
