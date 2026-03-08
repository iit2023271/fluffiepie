import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { GripVertical, Eye, EyeOff, Save, RotateCcw, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import {
  HomepageConfig,
  DEFAULT_HOMEPAGE_CONFIG,
  SECTION_LABELS,
} from "@/hooks/useHomepageConfig";
import type { HomepageSection } from "@/hooks/useHomepageConfig";

export default function AdminHomepage() {
  const [config, setConfig] = useState<HomepageConfig>(DEFAULT_HOMEPAGE_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [existingId, setExistingId] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("store_config")
      .select("*")
      .eq("config_type", "homepage_config")
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
          sections: parsed.sections || DEFAULT_HOMEPAGE_CONFIG.sections,
        });
        setExistingId(data.id);
      } catch { /* use defaults */ }
    }
    setLoading(false);
  };

  const saveConfig = async () => {
    setSaving(true);
    const value = JSON.stringify(config);
    if (existingId) {
      const { error } = await supabase
        .from("store_config")
        .update({ value })
        .eq("id", existingId);
      if (error) toast.error("Failed to save");
      else toast.success("Homepage saved! Changes are live.");
    } else {
      const { data, error } = await supabase
        .from("store_config")
        .insert({ config_type: "homepage_config", value, is_active: true })
        .select()
        .single();
      if (error) toast.error("Failed to save");
      else {
        toast.success("Homepage saved! Changes are live.");
        if (data) setExistingId(data.id);
      }
    }
    setSaving(false);
  };

  const resetToDefaults = () => {
    setConfig(DEFAULT_HOMEPAGE_CONFIG);
    toast.info("Reset to defaults — click Save to apply.");
  };

  const toggleSection = (id: string) => {
    setConfig(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === id ? { ...s, visible: !s.visible } : s
      ),
    }));
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= config.sections.length) return;
    setConfig(prev => {
      const arr = [...prev.sections];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return { ...prev, sections: arr };
    });
  };

  const updateHero = (field: string, value: string) => {
    setConfig(prev => ({ ...prev, hero: { ...prev.hero, [field]: value } }));
  };

  const updateCategories = (field: string, value: string) => {
    setConfig(prev => ({ ...prev, categories: { ...prev.categories, [field]: value } }));
  };

  const updateTrending = (field: string, value: string | number) => {
    setConfig(prev => ({ ...prev, trending: { ...prev.trending, [field]: value } }));
  };

  const updateHowItWorks = (field: string, value: string) => {
    setConfig(prev => ({ ...prev, howItWorks: { ...prev.howItWorks, [field]: value } }));
  };

  const updateStep = (idx: number, field: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      howItWorks: {
        ...prev.howItWorks,
        steps: prev.howItWorks.steps.map((s, i) =>
          i === idx ? { ...s, [field]: value } : s
        ),
      },
    }));
  };

  const addStep = () => {
    setConfig(prev => ({
      ...prev,
      howItWorks: {
        ...prev.howItWorks,
        steps: [...prev.howItWorks.steps, { emoji: "⭐", title: "New Step", desc: "Description" }],
      },
    }));
  };

  const removeStep = (idx: number) => {
    setConfig(prev => ({
      ...prev,
      howItWorks: {
        ...prev.howItWorks,
        steps: prev.howItWorks.steps.filter((_, i) => i !== idx),
      },
    }));
  };

  const updateReviews = (field: string, value: string | number) => {
    setConfig(prev => ({ ...prev, reviews: { ...prev.reviews, [field]: value } }));
  };

  const toggleExpand = (id: string) => {
    setExpandedSection(prev => prev === id ? null : id);
  };

  const isSectionVisible = (id: string) => config.sections.find(s => s.id === id)?.visible ?? true;

  if (loading) return <div className="animate-pulse text-muted-foreground p-8">Loading homepage config...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Homepage Designer</h1>
          <p className="text-sm text-muted-foreground">Customize every section of your storefront</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={resetToDefaults} className="gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </Button>
          <Button size="sm" onClick={saveConfig} disabled={saving} className="gap-1.5">
            <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save & Publish"}
          </Button>
        </div>
      </div>

      {/* Section Order & Visibility */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground">Section Order & Visibility</h2>
        <div className="space-y-2">
          {config.sections.map((section, idx) => (
            <div
              key={section.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                section.visible ? "bg-background border-border" : "bg-muted/30 border-transparent opacity-60"
              }`}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => moveSection(idx, -1)}
                  disabled={idx === 0}
                  className="p-1 rounded hover:bg-secondary disabled:opacity-30"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => moveSection(idx, 1)}
                  disabled={idx === config.sections.length - 1}
                  className="p-1 rounded hover:bg-secondary disabled:opacity-30"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="flex-1 text-sm font-medium">{SECTION_LABELS[section.id] || section.id}</span>
              <div className="flex items-center gap-2">
                {section.visible ? (
                  <Eye className="w-4 h-4 text-primary" />
                ) : (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                )}
                <Switch
                  checked={section.visible}
                  onCheckedChange={() => toggleSection(section.id)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section Editors */}
      <div className="space-y-3">
        {/* Hero Editor */}
        <SectionEditor
          id="hero"
          label="Hero Section"
          expanded={expandedSection === "hero"}
          onToggle={() => toggleExpand("hero")}
          visible={isSectionVisible("hero")}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Badge Text</Label>
              <Input value={config.hero.badge} onChange={e => updateHero("badge", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Title Line 1</Label>
              <Input value={config.hero.titleLine1} onChange={e => updateHero("titleLine1", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Title Line 2 (highlighted)</Label>
              <Input value={config.hero.titleLine2} onChange={e => updateHero("titleLine2", e.target.value)} className="mt-1" />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs">Subtitle</Label>
              <Textarea value={config.hero.subtitle} onChange={e => updateHero("subtitle", e.target.value)} className="mt-1" rows={2} />
            </div>
            <div>
              <Label className="text-xs">Primary CTA Text</Label>
              <Input value={config.hero.ctaPrimaryText} onChange={e => updateHero("ctaPrimaryText", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Primary CTA Link</Label>
              <Input value={config.hero.ctaPrimaryLink} onChange={e => updateHero("ctaPrimaryLink", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Secondary CTA Text</Label>
              <Input value={config.hero.ctaSecondaryText} onChange={e => updateHero("ctaSecondaryText", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Secondary CTA Link</Label>
              <Input value={config.hero.ctaSecondaryLink} onChange={e => updateHero("ctaSecondaryLink", e.target.value)} className="mt-1" />
            </div>
          </div>
        </SectionEditor>

        {/* Categories Editor */}
        <SectionEditor
          id="categories"
          label="Shop by Occasion"
          expanded={expandedSection === "categories"}
          onToggle={() => toggleExpand("categories")}
          visible={isSectionVisible("categories")}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Section Title</Label>
              <Input value={config.categories.title} onChange={e => updateCategories("title", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Section Subtitle</Label>
              <Input value={config.categories.subtitle} onChange={e => updateCategories("subtitle", e.target.value)} className="mt-1" />
            </div>
          </div>
        </SectionEditor>

        {/* Trending Editor */}
        <SectionEditor
          id="trending"
          label="Trending Products"
          expanded={expandedSection === "trending"}
          onToggle={() => toggleExpand("trending")}
          visible={isSectionVisible("trending")}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Section Title</Label>
              <Input value={config.trending.title} onChange={e => updateTrending("title", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Section Subtitle</Label>
              <Input value={config.trending.subtitle} onChange={e => updateTrending("subtitle", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Products to Show</Label>
              <Input type="number" min={2} max={12} value={config.trending.count} onChange={e => updateTrending("count", parseInt(e.target.value) || 4)} className="mt-1" />
            </div>
          </div>
        </SectionEditor>

        {/* How It Works Editor */}
        <SectionEditor
          id="howItWorks"
          label="How It Works"
          expanded={expandedSection === "howItWorks"}
          onToggle={() => toggleExpand("howItWorks")}
          visible={isSectionVisible("howItWorks")}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Section Title</Label>
                <Input value={config.howItWorks.title} onChange={e => updateHowItWorks("title", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Section Subtitle</Label>
                <Input value={config.howItWorks.subtitle} onChange={e => updateHowItWorks("subtitle", e.target.value)} className="mt-1" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wider">Steps</Label>
                <Button variant="outline" size="sm" onClick={addStep} className="gap-1 text-xs h-7">
                  <Plus className="w-3 h-3" /> Add Step
                </Button>
              </div>
              {config.howItWorks.steps.map((step, idx) => (
                <div key={idx} className="grid grid-cols-[60px_1fr_1fr_auto] gap-2 items-end p-3 rounded-xl bg-muted/30 border border-border">
                  <div>
                    <Label className="text-[10px]">Emoji</Label>
                    <Input value={step.emoji} onChange={e => updateStep(idx, "emoji", e.target.value)} className="mt-1 text-center" />
                  </div>
                  <div>
                    <Label className="text-[10px]">Title</Label>
                    <Input value={step.title} onChange={e => updateStep(idx, "title", e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-[10px]">Description</Label>
                    <Input value={step.desc} onChange={e => updateStep(idx, "desc", e.target.value)} className="mt-1" />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStep(idx)}
                    disabled={config.howItWorks.steps.length <= 1}
                    className="text-destructive hover:text-destructive h-9 px-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </SectionEditor>

        {/* Reviews Editor */}
        <SectionEditor
          id="reviews"
          label="Customer Reviews"
          expanded={expandedSection === "reviews"}
          onToggle={() => toggleExpand("reviews")}
          visible={isSectionVisible("reviews")}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Section Title</Label>
              <Input value={config.reviews.title} onChange={e => updateReviews("title", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Section Subtitle</Label>
              <Input value={config.reviews.subtitle} onChange={e => updateReviews("subtitle", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Reviews to Show</Label>
              <Input type="number" min={1} max={9} value={config.reviews.count} onChange={e => updateReviews("count", parseInt(e.target.value) || 3)} className="mt-1" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Reviews are automatically pulled from your database (4+ stars with comments).</p>
        </SectionEditor>
      </div>
    </div>
  );
}

function SectionEditor({
  id,
  label,
  expanded,
  onToggle,
  visible,
  children,
}: {
  id: string;
  label: string;
  expanded: boolean;
  onToggle: () => void;
  visible: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`bg-card rounded-2xl border transition-colors ${visible ? "border-border" : "border-transparent opacity-50"}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">{label}</span>
          {!visible && (
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-md">Hidden</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="px-4 pb-5 border-t border-border pt-4">
          {children}
        </div>
      )}
    </div>
  );
}
