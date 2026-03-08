import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, Paintbrush, RotateCcw, Sparkles, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  THEME_PRESETS,
  DEFAULT_COLORS,
  applyTheme,
  resetTheme,
  type ThemeConfig,
  type ThemeColors,
  type ActiveThemeData,
} from "@/hooks/useThemeConfig";

function hslToHex(hsl: string): string {
  const parts = hsl.trim().split(/\s+/);
  if (parts.length < 3) return "#cccccc";
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string): string {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16); g = parseInt(hex[2] + hex[2], 16); b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16); g = parseInt(hex.substring(3, 5), 16); b = parseInt(hex.substring(5, 7), 16);
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export default function AdminThemes() {
  const [activeThemeId, setActiveThemeId] = useState("default");
  const [customColors, setCustomColors] = useState<ThemeColors>({ ...DEFAULT_COLORS });
  const [bannerEnabled, setBannerEnabled] = useState(false);
  const [bannerText, setBannerText] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const { data } = await supabase
      .from("store_config")
      .select("value")
      .eq("config_type", "active_theme")
      .eq("is_active", true)
      .maybeSingle();

    if (data?.value) {
      try {
        const parsed: ActiveThemeData = JSON.parse(data.value);
        setActiveThemeId(parsed.themeId);
        if (parsed.customColors) setCustomColors(parsed.customColors);
        else {
          const preset = THEME_PRESETS.find(t => t.id === parsed.themeId);
          if (preset) setCustomColors({ ...preset.colors });
        }
        if (parsed.bannerText) {
          setBannerEnabled(true);
          setBannerText(parsed.bannerText);
        }
      } catch { /* use defaults */ }
    }
    setLoading(false);
  };

  const selectPreset = (preset: ThemeConfig) => {
    setActiveThemeId(preset.id);
    setCustomColors({ ...preset.colors });
    if (preset.bannerText) {
      setBannerEnabled(true);
      setBannerText(preset.bannerText);
    } else {
      setBannerEnabled(false);
      setBannerText("");
    }
    // Live preview
    if (preset.id === "default") resetTheme();
    else applyTheme(preset.colors);
    setPreviewingId(preset.id);
  };

  const previewCustomColors = () => {
    applyTheme(customColors);
    setPreviewingId("custom-preview");
  };

  const saveTheme = async () => {
    setSaving(true);
    const preset = THEME_PRESETS.find(t => t.id === activeThemeId);
    const themeData: ActiveThemeData = {
      themeId: activeThemeId,
      customColors: customColors,
      bannerText: bannerEnabled ? bannerText : undefined,
      bannerEmoji: preset?.bannerEmoji,
      bannerBg: preset?.bannerBg || customColors.primary,
      bannerTextColor: preset?.bannerTextColor || customColors.primaryForeground,
    };

    // Check if config row exists
    const { data: existing, error: fetchErr } = await supabase
      .from("store_config")
      .select("id")
      .eq("config_type", "active_theme")
      .maybeSingle();

    if (fetchErr) {
      console.error("Theme fetch error:", fetchErr);
      toast.error("Failed to save theme");
      setSaving(false);
      return;
    }

    let saveError;
    if (existing) {
      const { error } = await supabase
        .from("store_config")
        .update({ value: JSON.stringify(themeData), is_active: true })
        .eq("id", existing.id);
      saveError = error;
    } else {
      const { error } = await supabase
        .from("store_config")
        .insert({ config_type: "active_theme", value: JSON.stringify(themeData), is_active: true });
      saveError = error;
    }

    if (saveError) {
      console.error("Theme save error:", saveError);
      toast.error("Failed to save theme: " + saveError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setPreviewingId(null);
    toast.success("Theme saved! Changes are live.");
  };

  const resetToDefault = async () => {
    setActiveThemeId("default");
    setCustomColors({ ...DEFAULT_COLORS });
    setBannerEnabled(false);
    setBannerText("");
    resetTheme();

    const { data: existing } = await supabase
      .from("store_config")
      .select("id")
      .eq("config_type", "active_theme")
      .maybeSingle();

    if (existing) {
      await supabase
        .from("store_config")
        .update({ value: JSON.stringify({ themeId: "default" }), is_active: true })
        .eq("id", existing.id);
    }
    toast.success("Reset to default theme");
  };

  const colorFields: { key: keyof ThemeColors; label: string }[] = [
    { key: "primary", label: "Primary Color" },
    { key: "accent", label: "Accent Color" },
    { key: "background", label: "Background" },
    { key: "foreground", label: "Text Color" },
    { key: "secondary", label: "Secondary" },
    { key: "cream", label: "Cream Section" },
    { key: "blush", label: "Blush Section" },
    { key: "card", label: "Card Background" },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-secondary animate-pulse rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Paintbrush className="w-6 h-6" /> Themes & Festivals
          </h1>
          <p className="text-sm text-muted-foreground">Change your store's look for festivals, events, or seasons</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetToDefault}>
            <RotateCcw className="w-4 h-4 mr-1" /> Reset Default
          </Button>
          <Button size="sm" onClick={saveTheme} disabled={saving}>
            <Check className="w-4 h-4 mr-1" /> {saving ? "Saving..." : "Save & Apply"}
          </Button>
        </div>
      </div>

      {/* Theme Presets */}
      <div>
        <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5" /> Festival Presets
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {THEME_PRESETS.map((preset) => {
            const isActive = activeThemeId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => selectPreset(preset)}
                className={`relative p-4 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] ${
                  isActive
                    ? "border-primary shadow-card"
                    : "border-border hover:border-primary/40"
                }`}
              >
                {isActive && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </div>
                )}
                <div className="text-2xl mb-2">{preset.emoji}</div>
                <p className="text-sm font-semibold">{preset.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{preset.description}</p>
                {/* Color preview dots */}
                <div className="flex gap-1 mt-3">
                  {["primary", "accent", "secondary", "cream"].map((c) => (
                    <div
                      key={c}
                      className="w-4 h-4 rounded-full border border-border"
                      style={{ backgroundColor: `hsl(${preset.colors[c as keyof ThemeColors]})` }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Color Overrides */}
      <div className="rounded-2xl bg-card border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-semibold">🎨 Fine-Tune Colors</h2>
          <Button variant="outline" size="sm" onClick={previewCustomColors}>
            <Eye className="w-4 h-4 mr-1" /> Preview
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-5">Adjust individual colors. Changes preview instantly when you click "Preview".</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {colorFields.map(({ key, label }) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-xs">{label}</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={hslToHex(customColors[key])}
                  onChange={(e) => {
                    setCustomColors(prev => ({
                      ...prev,
                      [key]: hexToHsl(e.target.value),
                    }));
                  }}
                  className="w-8 h-8 rounded-lg border border-border cursor-pointer"
                />
                <div
                  className="flex-1 h-8 rounded-lg border border-border"
                  style={{ backgroundColor: `hsl(${customColors[key]})` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Festival Banner */}
      <div className="rounded-2xl bg-card border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-semibold">📢 Festival Announcement Banner</h2>
          <Switch checked={bannerEnabled} onCheckedChange={setBannerEnabled} />
        </div>
        {bannerEnabled && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Banner Message</Label>
              <Input
                value={bannerText}
                onChange={(e) => setBannerText(e.target.value)}
                placeholder="🎄 Merry Christmas! Special holiday cakes available!"
                maxLength={120}
              />
            </div>
            {/* Banner preview */}
            {bannerText && (
              <div className="mt-3">
                <Label className="text-xs mb-2 block">Preview</Label>
                <div
                  className="py-2.5 px-4 rounded-xl text-center text-sm font-medium"
                  style={{
                    backgroundColor: `hsl(${
                      THEME_PRESETS.find(t => t.id === activeThemeId)?.bannerBg || customColors.primary
                    })`,
                    color: `hsl(${
                      THEME_PRESETS.find(t => t.id === activeThemeId)?.bannerTextColor || customColors.primaryForeground
                    })`,
                  }}
                >
                  {bannerText}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="rounded-2xl bg-secondary/50 border border-border p-5">
        <h3 className="text-sm font-semibold mb-2">💡 Tips</h3>
        <ul className="text-xs text-muted-foreground space-y-1.5">
          <li>• Select a festival preset for instant theme change</li>
          <li>• Fine-tune colors using the color pickers</li>
          <li>• Enable the announcement banner for special promotions</li>
          <li>• Click <strong>Save & Apply</strong> to make changes live for all visitors</li>
          <li>• Use <strong>Reset Default</strong> to go back to the original theme</li>
        </ul>
      </div>
    </div>
  );
}
