import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, Paintbrush, RotateCcw, Sparkles, Eye, Plus, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

const EMOJI_OPTIONS = ["🎉", "🎊", "🌺", "🏮", "🧧", "🎗️", "🕌", "⛪", "🛕", "🎋", "🎑", "🌻", "🍂", "☀️", "🌧️", "❄️", "🎓", "👶", "💐", "🎁"];

export default function AdminThemes() {
  const [activeThemeId, setActiveThemeId] = useState("default");
  const [customColors, setCustomColors] = useState<ThemeColors>({ ...DEFAULT_COLORS });
  const [bannerEnabled, setBannerEnabled] = useState(false);
  const [bannerText, setBannerText] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [customPresets, setCustomPresets] = useState<(ThemeConfig & { dbId?: string })[]>([]);
  const [showNewPreset, setShowNewPreset] = useState(false);
  const [deletePresetConfirm, setDeletePresetConfirm] = useState<{ open: boolean; preset: (ThemeConfig & { dbId?: string }) | null }>({ open: false, preset: null });
  const [newPreset, setNewPreset] = useState({
    name: "", emoji: "🎉", description: "", bannerText: "",
    colors: { ...DEFAULT_COLORS },
  });

  useEffect(() => {
    loadConfig();
    loadCustomPresets();
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

  const loadCustomPresets = async () => {
    const { data } = await supabase
      .from("store_config")
      .select("id, value")
      .eq("config_type", "custom_theme_preset")
      .eq("is_active", true)
      .order("sort_order");

    if (data) {
      const presets = data.map(row => {
        try {
          const parsed = JSON.parse(row.value);
          return { ...parsed, dbId: row.id, isCustom: true };
        } catch { return null; }
      }).filter(Boolean) as (ThemeConfig & { dbId: string })[];
      setCustomPresets(presets);
    }
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
    if (preset.id === "default") resetTheme();
    else applyTheme(preset.colors);
    setPreviewingId(preset.id);
  };

  const previewCustomColors = () => {
    applyTheme(customColors);
    setPreviewingId("custom-preview");
  };

  const allPresets = [...THEME_PRESETS, ...customPresets];

  const saveTheme = async () => {
    setSaving(true);
    const preset = allPresets.find(t => t.id === activeThemeId);
    const themeData: ActiveThemeData = {
      themeId: activeThemeId,
      customColors,
      bannerText: bannerEnabled ? bannerText : undefined,
      bannerEmoji: preset?.bannerEmoji,
      bannerBg: preset?.bannerBg || customColors.primary,
      bannerTextColor: preset?.bannerTextColor || customColors.primaryForeground,
    };

    const { data: existing, error: fetchErr } = await supabase
      .from("store_config").select("id").eq("config_type", "active_theme").maybeSingle();

    if (fetchErr) { toast.error("Failed to save theme"); setSaving(false); return; }

    const saveOp = existing
      ? supabase.from("store_config").update({ value: JSON.stringify(themeData), is_active: true }).eq("id", existing.id)
      : supabase.from("store_config").insert({ config_type: "active_theme", value: JSON.stringify(themeData), is_active: true });

    const { error } = await saveOp;
    if (error) { toast.error("Failed to save theme"); setSaving(false); return; }

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
      .from("store_config").select("id").eq("config_type", "active_theme").maybeSingle();

    if (existing) {
      await supabase.from("store_config")
        .update({ value: JSON.stringify({ themeId: "default" }), is_active: true })
        .eq("id", existing.id);
    }
    toast.success("Reset to default theme");
  };

  const saveNewPreset = async () => {
    if (!newPreset.name.trim()) { toast.error("Please enter a preset name"); return; }

    const presetData: ThemeConfig = {
      id: `custom-${Date.now()}`,
      name: newPreset.name,
      emoji: newPreset.emoji,
      description: newPreset.description || `Custom ${newPreset.name} theme`,
      colors: newPreset.colors,
      bannerText: newPreset.bannerText || undefined,
      bannerBg: newPreset.colors.primary,
      bannerTextColor: newPreset.colors.primaryForeground,
      isCustom: true,
    };

    const { error } = await supabase.from("store_config").insert({
      config_type: "custom_theme_preset",
      value: JSON.stringify(presetData),
      is_active: true,
      sort_order: customPresets.length,
    });

    if (error) { toast.error("Failed to save preset"); return; }
    toast.success(`"${newPreset.name}" preset created!`);
    setShowNewPreset(false);
    setNewPreset({ name: "", emoji: "🎉", description: "", bannerText: "", colors: { ...DEFAULT_COLORS } });
    loadCustomPresets();
  };

  const deleteCustomPreset = async (preset: ThemeConfig & { dbId?: string }) => {
    if (!preset.dbId) return;
    const { error } = await supabase.from("store_config").delete().eq("id", preset.dbId);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success(`"${preset.name}" deleted`);
    if (activeThemeId === preset.id) selectPreset(THEME_PRESETS[0]);
    loadCustomPresets();
  };

  const colorFields: { key: keyof ThemeColors; label: string }[] = [
    { key: "primary", label: "Primary" },
    { key: "accent", label: "Accent" },
    { key: "background", label: "Background" },
    { key: "foreground", label: "Text" },
    { key: "secondary", label: "Secondary" },
    { key: "cream", label: "Cream" },
    { key: "blush", label: "Blush" },
    { key: "card", label: "Card" },
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
            <RotateCcw className="w-4 h-4 mr-1" /> Reset
          </Button>
          <Button size="sm" onClick={saveTheme} disabled={saving}>
            <Check className="w-4 h-4 mr-1" /> {saving ? "Saving..." : "Save & Apply"}
          </Button>
        </div>
      </div>

      {/* Presets Grid */}
      <div>
        <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5" /> Festival Presets
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {allPresets.map((preset: any) => {
            const isActive = activeThemeId === preset.id;
            return (
              <div key={preset.id} className="relative group">
                <button
                  onClick={() => selectPreset(preset)}
                  className={`w-full relative p-4 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
                    isActive ? "border-primary shadow-card" : "border-border hover:border-primary/40"
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                  <div className="text-2xl mb-2">{preset.emoji}</div>
                  <p className="text-sm font-semibold">{preset.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{preset.description}</p>
                  {preset.isCustom && (
                    <span className="inline-block mt-1.5 text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">Custom</span>
                  )}
                  <div className="flex gap-1 mt-2">
                    {(["primary", "accent", "secondary", "cream"] as const).map(c => (
                      <div key={c} className="w-4 h-4 rounded-full border border-border"
                        style={{ backgroundColor: `hsl(${preset.colors[c]})` }} />
                    ))}
                  </div>
                </button>
                {preset.isCustom && (
                  <button onClick={() => setDeletePresetConfirm({ open: true, preset })}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md active:scale-90"
                    title="Delete preset">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Add new */}
          <button onClick={() => setShowNewPreset(true)}
            className="p-4 rounded-2xl border-2 border-dashed border-border text-center hover:border-primary/40 transition-all hover:bg-secondary/50 active:scale-[0.98] flex flex-col items-center justify-center gap-2 min-h-[130px]">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs font-semibold text-muted-foreground">Add Preset</p>
          </button>
        </div>
      </div>

      {/* Fine-Tune Colors */}
      <div className="rounded-2xl bg-card border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-semibold">🎨 Fine-Tune Colors</h2>
          <Button variant="outline" size="sm" onClick={previewCustomColors}>
            <Eye className="w-4 h-4 mr-1" /> Preview
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {colorFields.map(({ key, label }) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-xs">{label}</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={hslToHex(customColors[key])}
                  onChange={e => setCustomColors(prev => ({ ...prev, [key]: hexToHsl(e.target.value) }))}
                  className="w-8 h-8 rounded-lg border border-border cursor-pointer" />
                <div className="flex-1 h-8 rounded-lg border border-border"
                  style={{ backgroundColor: `hsl(${customColors[key]})` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Banner */}
      <div className="rounded-2xl bg-card border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-semibold">📢 Announcement Banner</h2>
          <Switch checked={bannerEnabled} onCheckedChange={setBannerEnabled} />
        </div>
        {bannerEnabled && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Banner Message</Label>
              <Input value={bannerText} onChange={e => setBannerText(e.target.value)}
                placeholder="🎄 Merry Christmas! Special holiday cakes available!" maxLength={120} />
            </div>
            {bannerText && (
              <div className="mt-3">
                <Label className="text-xs mb-2 block">Preview</Label>
                <div className="py-2.5 px-4 rounded-xl text-center text-sm font-medium"
                  style={{
                    backgroundColor: `hsl(${allPresets.find(t => t.id === activeThemeId)?.bannerBg || customColors.primary})`,
                    color: `hsl(${allPresets.find(t => t.id === activeThemeId)?.bannerTextColor || customColors.primaryForeground})`,
                  }}>
                  {bannerText}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="rounded-2xl bg-secondary/50 border border-border p-5">
        <h3 className="text-sm font-semibold mb-2">💡 Tips</h3>
        <ul className="text-xs text-muted-foreground space-y-1.5">
          <li>• Select a festival preset for instant theme change</li>
          <li>• Create your own custom presets with <strong>+ Add Preset</strong></li>
          <li>• Fine-tune colors using the color pickers</li>
          <li>• Click <strong>Save & Apply</strong> to make changes live</li>
        </ul>
      </div>

      {/* New Preset Dialog */}
      <Dialog open={showNewPreset} onOpenChange={setShowNewPreset}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-display">Create Festival Preset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs">Preset Name</Label>
              <Input value={newPreset.name} onChange={e => setNewPreset(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Navratri, Easter, Summer Sale" />
            </div>

            <div>
              <Label className="text-xs">Icon</Label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {EMOJI_OPTIONS.map(e => (
                  <button key={e} onClick={() => setNewPreset(p => ({ ...p, emoji: e }))}
                    className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all active:scale-90 ${
                      newPreset.emoji === e ? "bg-primary/15 ring-2 ring-primary" : "bg-secondary hover:bg-secondary/80"
                    }`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs">Description</Label>
              <Input value={newPreset.description} onChange={e => setNewPreset(p => ({ ...p, description: e.target.value }))}
                placeholder="Short description" />
            </div>

            <div>
              <Label className="text-xs">Banner Text (optional)</Label>
              <Input value={newPreset.bannerText} onChange={e => setNewPreset(p => ({ ...p, bannerText: e.target.value }))}
                placeholder="🎉 Special offer! Order now!" />
            </div>

            <div>
              <Label className="text-xs mb-2 block">Colors</Label>
              <div className="grid grid-cols-2 gap-3">
                {colorFields.map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    <input type="color" value={hslToHex(newPreset.colors[key])}
                      onChange={e => setNewPreset(p => ({ ...p, colors: { ...p.colors, [key]: hexToHsl(e.target.value) } }))}
                      className="w-7 h-7 rounded-lg border border-border cursor-pointer shrink-0" />
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div>
              <Label className="text-xs mb-1 block">Preview</Label>
              <div className="rounded-xl overflow-hidden border border-border">
                <div className="p-3 text-sm font-medium text-center"
                  style={{ backgroundColor: `hsl(${newPreset.colors.primary})`, color: `hsl(${newPreset.colors.primaryForeground || "0 0% 100%"})` }}>
                  {newPreset.emoji} {newPreset.name || "Preview"}
                </div>
                <div className="p-3 flex gap-1.5" style={{ backgroundColor: `hsl(${newPreset.colors.background})` }}>
                  {(["primary", "accent", "secondary", "cream", "blush"] as const).map(c => (
                    <div key={c} className="w-6 h-6 rounded-full border" style={{ backgroundColor: `hsl(${newPreset.colors[c]})` }} />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowNewPreset(false)}>Cancel</Button>
              <Button className="flex-1" onClick={saveNewPreset}>
                <Plus className="w-4 h-4 mr-1" /> Create Preset
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deletePresetConfirm.open}
        onOpenChange={(open) => setDeletePresetConfirm(prev => ({ ...prev, open }))}
        title="Delete Theme Preset"
        description={`Are you sure you want to delete "${deletePresetConfirm.preset?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => { if (deletePresetConfirm.preset) deleteCustomPreset(deletePresetConfirm.preset); setDeletePresetConfirm({ open: false, preset: null }); }}
      />
    </div>
  );
}
