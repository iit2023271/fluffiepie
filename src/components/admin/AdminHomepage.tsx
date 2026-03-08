import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GripVertical, Eye, EyeOff, Save, RotateCcw, ChevronDown, ChevronUp, Plus, Trash2, Copy, Type, Megaphone, Grid3X3, HelpCircle, Minus, Image, Upload, Crop } from "lucide-react";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import ImageCropper from "@/components/admin/ImageCropper";
import {
  HomepageConfig,
  DEFAULT_HOMEPAGE_CONFIG,
  SECTION_LABELS,
  BUILTIN_SECTION_IDS,
  CUSTOM_TYPE_LABELS,
  getDefaultCustomData,
} from "@/hooks/useHomepageConfig";
import type { HomepageSection, CustomSectionType, CustomSectionData, FooterColumn } from "@/hooks/useHomepageConfig";

const CUSTOM_TYPE_ICONS: Record<CustomSectionType, typeof Type> = {
  text_block: Type,
  cta_banner: Megaphone,
  feature_grid: Grid3X3,
  faq: HelpCircle,
  spacer: Minus,
  image_gallery: Image,
};

export default function AdminHomepage() {
  const [config, setConfig] = useState<HomepageConfig>(DEFAULT_HOMEPAGE_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; sectionId: string; label: string }>({ open: false, sectionId: "", label: "" });

  useEffect(() => { loadConfig(); }, []);

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
      } catch { /* defaults */ }
    }
    setLoading(false);
  };

  const saveConfig = async () => {
    setSaving(true);
    const value = JSON.stringify(config);
    if (existingId) {
      const { error } = await supabase.from("store_config").update({ value }).eq("id", existingId);
      if (error) toast.error("Failed to save");
      else toast.success("Homepage saved! Changes are live.");
    } else {
      const { data, error } = await supabase.from("store_config").insert({ config_type: "homepage_config", value, is_active: true }).select().single();
      if (error) toast.error("Failed to save");
      else { toast.success("Homepage saved!"); if (data) setExistingId(data.id); }
    }
    setSaving(false);
  };

  const resetToDefaults = () => {
    setConfig(DEFAULT_HOMEPAGE_CONFIG);
    toast.info("Reset to defaults — click Save to apply.");
  };

  const toggleSection = (id: string) => {
    setConfig(prev => ({ ...prev, sections: prev.sections.map(s => s.id === id ? { ...s, visible: !s.visible } : s) }));
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

  const addCustomSection = (type: CustomSectionType) => {
    const id = `custom_${Date.now()}`;
    const data = getDefaultCustomData(type);
    const label = CUSTOM_TYPE_LABELS[type].label;
    setConfig(prev => ({
      ...prev,
      sections: [...prev.sections, { id, visible: true, label, customType: type, customData: data }],
    }));
    setShowAddSection(false);
    setExpandedSection(id);
    toast.success(`Added "${label}" section`);
  };

  const duplicateSection = (section: HomepageSection) => {
    if (BUILTIN_SECTION_IDS.includes(section.id)) return;
    const newId = `custom_${Date.now()}`;
    const idx = config.sections.findIndex(s => s.id === section.id);
    setConfig(prev => {
      const arr = [...prev.sections];
      arr.splice(idx + 1, 0, { ...section, id: newId, label: (section.label || "Copy") + " (copy)" });
      return { ...prev, sections: arr };
    });
    toast.success("Section duplicated");
  };

  const deleteCustomSection = (id: string) => {
    if (BUILTIN_SECTION_IDS.includes(id)) return;
    setConfig(prev => ({ ...prev, sections: prev.sections.filter(s => s.id !== id) }));
    if (expandedSection === id) setExpandedSection(null);
    toast.success("Section deleted");
  };

  const updateCustomData = (sectionId: string, updates: Partial<CustomSectionData>) => {
    setConfig(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId ? { ...s, customData: { ...s.customData!, ...updates } } : s
      ),
    }));
  };

  const updateSectionLabel = (sectionId: string, label: string) => {
    setConfig(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === sectionId ? { ...s, label } : s),
    }));
  };

  // Built-in section updaters
  const updateHero = (field: string, value: string) => setConfig(prev => ({ ...prev, hero: { ...prev.hero, [field]: value } }));
  const updateCategories = (field: string, value: string) => setConfig(prev => ({ ...prev, categories: { ...prev.categories, [field]: value } }));
  const updateTrending = (field: string, value: string | number) => setConfig(prev => ({ ...prev, trending: { ...prev.trending, [field]: value } }));
  const updateHowItWorks = (field: string, value: string) => setConfig(prev => ({ ...prev, howItWorks: { ...prev.howItWorks, [field]: value } }));
  const updateStep = (idx: number, field: string, value: string) => {
    setConfig(prev => ({ ...prev, howItWorks: { ...prev.howItWorks, steps: prev.howItWorks.steps.map((s, i) => i === idx ? { ...s, [field]: value } : s) } }));
  };
  const addStep = () => setConfig(prev => ({ ...prev, howItWorks: { ...prev.howItWorks, steps: [...prev.howItWorks.steps, { emoji: "⭐", title: "New Step", desc: "Description" }] } }));
  const removeStep = (idx: number) => setConfig(prev => ({ ...prev, howItWorks: { ...prev.howItWorks, steps: prev.howItWorks.steps.filter((_, i) => i !== idx) } }));
  const updateReviews = (field: string, value: string | number) => setConfig(prev => ({ ...prev, reviews: { ...prev.reviews, [field]: value } }));
  const updateFooter = (field: string, value: any) => setConfig(prev => ({ ...prev, footer: { ...prev.footer, [field]: value } }));
  const updateFooterColumn = (colIdx: number, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      footer: { ...prev.footer, columns: prev.footer.columns.map((c, i) => i === colIdx ? { ...c, [field]: value } : c) },
    }));
  };
  const updateFooterLink = (colIdx: number, linkIdx: number, field: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      footer: {
        ...prev.footer,
        columns: prev.footer.columns.map((c, ci) =>
          ci === colIdx ? { ...c, links: c.links.map((l, li) => li === linkIdx ? { ...l, [field]: value } : l) } : c
        ),
      },
    }));
  };
  const addFooterColumn = () => setConfig(prev => ({ ...prev, footer: { ...prev.footer, columns: [...prev.footer.columns, { title: "New Column", links: [{ label: "Link", url: "#" }] }] } }));
  const removeFooterColumn = (idx: number) => setConfig(prev => ({ ...prev, footer: { ...prev.footer, columns: prev.footer.columns.filter((_, i) => i !== idx) } }));
  const addFooterLink = (colIdx: number) => {
    setConfig(prev => ({
      ...prev,
      footer: { ...prev.footer, columns: prev.footer.columns.map((c, i) => i === colIdx ? { ...c, links: [...c.links, { label: "New Link", url: "#" }] } : c) },
    }));
  };
  const removeFooterLink = (colIdx: number, linkIdx: number) => {
    setConfig(prev => ({
      ...prev,
      footer: { ...prev.footer, columns: prev.footer.columns.map((c, ci) => ci === colIdx ? { ...c, links: c.links.filter((_, li) => li !== linkIdx) } : c) },
    }));
  };

  const toggleExpand = (id: string) => setExpandedSection(prev => prev === id ? null : id);
  const isSectionVisible = (id: string) => config.sections.find(s => s.id === id)?.visible ?? true;
  const isBuiltin = (id: string) => BUILTIN_SECTION_IDS.includes(id);

  const getSectionLabel = (section: HomepageSection) => {
    if (isBuiltin(section.id)) return SECTION_LABELS[section.id] || section.id;
    return section.label || CUSTOM_TYPE_LABELS[section.customType!]?.label || "Custom Section";
  };

  const getSectionTypeTag = (section: HomepageSection) => {
    if (isBuiltin(section.id)) return null;
    const info = CUSTOM_TYPE_LABELS[section.customType!];
    return info ? `${info.emoji} ${info.label}` : null;
  };

  if (loading) return <div className="animate-pulse text-muted-foreground p-8">Loading homepage config...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">Homepage Designer</h1>
          <p className="text-sm text-muted-foreground">{config.sections.length} sections · {config.sections.filter(s => s.visible).length} visible</p>
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Sections</h2>
          <Button variant="outline" size="sm" onClick={() => setShowAddSection(!showAddSection)} className="gap-1.5 text-xs h-8">
            <Plus className="w-3.5 h-3.5" /> Add Section
          </Button>
        </div>

        {/* Add Section Picker */}
        {showAddSection && (
          <div className="mb-4 p-4 rounded-xl border border-dashed border-primary/40 bg-primary/5">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Choose section type</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {(Object.keys(CUSTOM_TYPE_LABELS) as CustomSectionType[]).map(type => {
                const info = CUSTOM_TYPE_LABELS[type];
                const Icon = CUSTOM_TYPE_ICONS[type];
                return (
                  <button
                    key={type}
                    onClick={() => addCustomSection(type)}
                    className="flex items-start gap-3 p-3 rounded-xl border border-border bg-background hover:border-primary hover:shadow-sm transition-all text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{info.emoji} {info.label}</p>
                      <p className="text-[10px] text-muted-foreground">{info.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-2">
          {config.sections.map((section, idx) => (
            <div
              key={section.id}
              className={`flex items-center gap-2 p-3 rounded-xl border transition-colors ${
                section.visible ? "bg-background border-border" : "bg-muted/30 border-transparent opacity-60"
              }`}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex items-center gap-0.5 shrink-0">
                <button onClick={() => moveSection(idx, -1)} disabled={idx === 0} className="p-1 rounded hover:bg-secondary disabled:opacity-30">
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => moveSection(idx, 1)} disabled={idx === config.sections.length - 1} className="p-1 rounded hover:bg-secondary disabled:opacity-30">
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium truncate block">{getSectionLabel(section)}</span>
                {getSectionTypeTag(section) && (
                  <span className="text-[10px] text-muted-foreground">{getSectionTypeTag(section)}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {!isBuiltin(section.id) && (
                  <>
                    <button onClick={() => duplicateSection(section)} className="p-1.5 rounded-lg hover:bg-secondary" title="Duplicate">
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ open: true, sectionId: section.id, label: getSectionLabel(section) })}
                      className="p-1.5 rounded-lg hover:bg-destructive/10" title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </>
                )}
                {section.visible ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                <Switch checked={section.visible} onCheckedChange={() => toggleSection(section.id)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section Editors — rendered in config.sections order */}
      <div className="space-y-3">
        {config.sections.map(section => {
          if (section.id === "banners") return null;

          if (section.id === "sectionNav") return (
            <SectionEditor key="sectionNav" id="sectionNav" label="Section Navigation Bar" expanded={expandedSection === "sectionNav"} onToggle={() => toggleExpand("sectionNav")} visible={isSectionVisible("sectionNav")}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-semibold">Enable Navigation Bar</Label>
                    <p className="text-[10px] text-muted-foreground">Sticky bar with quick links to sections</p>
                  </div>
                  <Switch checked={config.sectionNav.enabled} onCheckedChange={v => setConfig(prev => ({ ...prev, sectionNav: { ...prev.sectionNav, enabled: v } }))} />
                </div>
                {config.sectionNav.enabled && (
                  <>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold uppercase tracking-wider">Nav Items</Label>
                      <Button variant="outline" size="sm" onClick={() => {
                        const existing = config.sectionNav.items.map(i => i.sectionId);
                        const available = config.sections.filter(s => !existing.includes(s.id) && s.id !== "banners" && s.id !== "hero" && s.id !== "sectionNav" && s.id !== "footer");
                        if (available.length === 0) { toast.info("All sections are already in the nav"); return; }
                        const s = available[0];
                        const label = isBuiltin(s.id) ? (SECTION_LABELS[s.id] || s.id) : (s.label || "Section");
                        setConfig(prev => ({ ...prev, sectionNav: { ...prev.sectionNav, items: [...prev.sectionNav.items, { sectionId: s.id, label, visible: true }] } }));
                      }} className="gap-1 text-xs h-7"><Plus className="w-3 h-3" /> Add</Button>
                    </div>
                    <div className="space-y-2">
                      {config.sectionNav.items.map((item, idx) => (
                        <div key={item.sectionId} className={`flex items-center gap-2 p-3 rounded-xl border transition-colors ${item.visible ? "bg-background border-border" : "bg-muted/30 border-transparent opacity-60"}`}>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button onClick={() => {
                              if (idx === 0) return;
                              setConfig(prev => {
                                const arr = [...prev.sectionNav.items];
                                [arr[idx], arr[idx - 1]] = [arr[idx - 1], arr[idx]];
                                return { ...prev, sectionNav: { ...prev.sectionNav, items: arr } };
                              });
                            }} disabled={idx === 0} className="p-1 rounded hover:bg-secondary disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5" /></button>
                            <button onClick={() => {
                              if (idx === config.sectionNav.items.length - 1) return;
                              setConfig(prev => {
                                const arr = [...prev.sectionNav.items];
                                [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
                                return { ...prev, sectionNav: { ...prev.sectionNav, items: arr } };
                              });
                            }} disabled={idx === config.sectionNav.items.length - 1} className="p-1 rounded hover:bg-secondary disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
                          </div>
                          <Input
                            value={item.label}
                            onChange={e => {
                              setConfig(prev => ({
                                ...prev,
                                sectionNav: {
                                  ...prev.sectionNav,
                                  items: prev.sectionNav.items.map((it, i) => i === idx ? { ...it, label: e.target.value } : it),
                                },
                              }));
                            }}
                            className="flex-1 h-8 text-sm"
                            placeholder="Nav label"
                          />
                          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md shrink-0 whitespace-nowrap">
                            → {isBuiltin(item.sectionId) ? SECTION_LABELS[item.sectionId] : config.sections.find(s => s.id === item.sectionId)?.label || item.sectionId}
                          </span>
                          <Switch
                            checked={item.visible}
                            onCheckedChange={v => {
                              setConfig(prev => ({
                                ...prev,
                                sectionNav: {
                                  ...prev.sectionNav,
                                  items: prev.sectionNav.items.map((it, i) => i === idx ? { ...it, visible: v } : it),
                                },
                              }));
                            }}
                          />
                          <button
                            onClick={() => setConfig(prev => ({ ...prev, sectionNav: { ...prev.sectionNav, items: prev.sectionNav.items.filter((_, i) => i !== idx) } }))}
                            className="p-1 rounded hover:bg-destructive/10"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Rename labels, reorder items, or toggle visibility. Items link to their respective homepage sections.</p>
                  </>
                )}
              </div>
            </SectionEditor>
          );

          if (section.id === "hero") return (
            <SectionEditor key="hero" id="hero" label="Hero Section" expanded={expandedSection === "hero"} onToggle={() => toggleExpand("hero")} visible={isSectionVisible("hero")}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label className="text-xs">Badge Text</Label><Input value={config.hero.badge} onChange={e => updateHero("badge", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Title Line 1</Label><Input value={config.hero.titleLine1} onChange={e => updateHero("titleLine1", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Title Line 2 (highlighted)</Label><Input value={config.hero.titleLine2} onChange={e => updateHero("titleLine2", e.target.value)} className="mt-1" /></div>
                <div className="md:col-span-2"><Label className="text-xs">Subtitle</Label><Textarea value={config.hero.subtitle} onChange={e => updateHero("subtitle", e.target.value)} className="mt-1" rows={2} /></div>
                <div><Label className="text-xs">Primary CTA Text</Label><Input value={config.hero.ctaPrimaryText} onChange={e => updateHero("ctaPrimaryText", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Primary CTA Link</Label><Input value={config.hero.ctaPrimaryLink} onChange={e => updateHero("ctaPrimaryLink", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Secondary CTA Text</Label><Input value={config.hero.ctaSecondaryText} onChange={e => updateHero("ctaSecondaryText", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Secondary CTA Link</Label><Input value={config.hero.ctaSecondaryLink} onChange={e => updateHero("ctaSecondaryLink", e.target.value)} className="mt-1" /></div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Hero Image</Label>
                  <div className="mt-1 flex items-center gap-3">
                    {config.hero.heroImage && (
                      <img src={config.hero.heroImage} alt="Hero preview" className="w-20 h-20 rounded-xl object-cover border border-border" />
                    )}
                    <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-border bg-muted/30 hover:bg-muted/60 cursor-pointer transition-colors text-sm text-muted-foreground">
                      <Upload className="w-4 h-4" /> Upload Image
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const ext = file.name.split(".").pop();
                        const path = `hero/hero-image-${Date.now()}.${ext}`;
                        const { error } = await supabase.storage.from("homepage-assets").upload(path, file, { upsert: true });
                        if (error) { toast.error("Upload failed"); return; }
                        const { data: urlData } = supabase.storage.from("homepage-assets").getPublicUrl(path);
                        updateHero("heroImage", urlData.publicUrl);
                        toast.success("Image uploaded!");
                      }} />
                    </label>
                    {config.hero.heroImage && (
                      <button onClick={() => updateHero("heroImage", "")} className="text-xs text-destructive hover:underline">Remove</button>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Leave empty to use the default cake image</p>
                </div>
              </div>
            </SectionEditor>
          );

          if (section.id === "categories") return (
            <SectionEditor key="categories" id="categories" label="Shop by Occasion" expanded={expandedSection === "categories"} onToggle={() => toggleExpand("categories")} visible={isSectionVisible("categories")}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label className="text-xs">Section Title</Label><Input value={config.categories.title} onChange={e => updateCategories("title", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Section Subtitle</Label><Input value={config.categories.subtitle} onChange={e => updateCategories("subtitle", e.target.value)} className="mt-1" /></div>
              </div>
            </SectionEditor>
          );

          if (section.id === "trending") return (
            <SectionEditor key="trending" id="trending" label="Trending Products" expanded={expandedSection === "trending"} onToggle={() => toggleExpand("trending")} visible={isSectionVisible("trending")}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label className="text-xs">Section Title</Label><Input value={config.trending.title} onChange={e => updateTrending("title", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Section Subtitle</Label><Input value={config.trending.subtitle} onChange={e => updateTrending("subtitle", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Products to Show</Label><Input type="number" min={2} max={12} value={config.trending.count} onChange={e => updateTrending("count", parseInt(e.target.value) || 4)} className="mt-1" /></div>
              </div>
            </SectionEditor>
          );

          if (section.id === "howItWorks") return (
            <SectionEditor key="howItWorks" id="howItWorks" label="How It Works" expanded={expandedSection === "howItWorks"} onToggle={() => toggleExpand("howItWorks")} visible={isSectionVisible("howItWorks")}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label className="text-xs">Section Title</Label><Input value={config.howItWorks.title} onChange={e => updateHowItWorks("title", e.target.value)} className="mt-1" /></div>
                  <div><Label className="text-xs">Section Subtitle</Label><Input value={config.howItWorks.subtitle} onChange={e => updateHowItWorks("subtitle", e.target.value)} className="mt-1" /></div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between"><Label className="text-xs font-semibold uppercase tracking-wider">Steps</Label><Button variant="outline" size="sm" onClick={addStep} className="gap-1 text-xs h-7"><Plus className="w-3 h-3" /> Add Step</Button></div>
                  {config.howItWorks.steps.map((step, idx) => (
                    <div key={idx} className="grid grid-cols-[60px_1fr_1fr_auto] gap-2 items-end p-3 rounded-xl bg-muted/30 border border-border">
                      <div><Label className="text-[10px]">Emoji</Label><Input value={step.emoji} onChange={e => updateStep(idx, "emoji", e.target.value)} className="mt-1 text-center" /></div>
                      <div><Label className="text-[10px]">Title</Label><Input value={step.title} onChange={e => updateStep(idx, "title", e.target.value)} className="mt-1" /></div>
                      <div><Label className="text-[10px]">Description</Label><Input value={step.desc} onChange={e => updateStep(idx, "desc", e.target.value)} className="mt-1" /></div>
                      <Button variant="ghost" size="sm" onClick={() => removeStep(idx)} disabled={config.howItWorks.steps.length <= 1} className="text-destructive hover:text-destructive h-9 px-2"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  ))}
                </div>
              </div>
            </SectionEditor>
          );

          if (section.id === "reviews") return (
            <SectionEditor key="reviews" id="reviews" label="Customer Reviews" expanded={expandedSection === "reviews"} onToggle={() => toggleExpand("reviews")} visible={isSectionVisible("reviews")}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label className="text-xs">Section Title</Label><Input value={config.reviews.title} onChange={e => updateReviews("title", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Section Subtitle</Label><Input value={config.reviews.subtitle} onChange={e => updateReviews("subtitle", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Reviews to Show</Label><Input type="number" min={1} max={9} value={config.reviews.count} onChange={e => updateReviews("count", parseInt(e.target.value) || 3)} className="mt-1" /></div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">Reviews are automatically pulled from your database (4+ stars with comments).</p>
            </SectionEditor>
          );

          if (section.id === "footer") return (
            <SectionEditor key="footer" id="footer" label="Footer" expanded={expandedSection === "footer"} onToggle={() => toggleExpand("footer")} visible={isSectionVisible("footer")}>
              <div className="space-y-5">
                <div>
                  <Label className="text-xs">Brand Description</Label>
                  <Textarea value={config.footer.brandDescription} onChange={e => updateFooter("brandDescription", e.target.value)} className="mt-1" rows={2} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-xs font-semibold uppercase tracking-wider">Link Columns</Label>
                    <Button variant="outline" size="sm" onClick={addFooterColumn} className="gap-1 text-xs h-7" disabled={config.footer.columns.length >= 4}>
                      <Plus className="w-3 h-3" /> Add Column
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {config.footer.columns.map((col, colIdx) => (
                      <div key={colIdx} className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                        <div className="flex items-center gap-2">
                          <Input value={col.title} onChange={e => updateFooterColumn(colIdx, "title", e.target.value)} className="flex-1 h-8 text-sm font-semibold" placeholder="Column title" />
                          <Button variant="ghost" size="sm" onClick={() => removeFooterColumn(colIdx)} disabled={config.footer.columns.length <= 1} className="text-destructive hover:text-destructive h-8 px-2">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        {col.links.map((link, linkIdx) => (
                          <div key={linkIdx} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                            <Input value={link.label} onChange={e => updateFooterLink(colIdx, linkIdx, "label", e.target.value)} className="h-7 text-xs" placeholder="Label" />
                            <Input value={link.url} onChange={e => updateFooterLink(colIdx, linkIdx, "url", e.target.value)} className="h-7 text-xs" placeholder="/path or URL" />
                            <button onClick={() => removeFooterLink(colIdx, linkIdx)} disabled={col.links.length <= 1} className="p-1 rounded hover:bg-destructive/10 disabled:opacity-30">
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </button>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={() => addFooterLink(colIdx)} className="gap-1 text-xs h-6 w-full">
                          <Plus className="w-3 h-3" /> Add Link
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                  <div>
                    <Label className="text-xs font-semibold">Newsletter Section</Label>
                    <p className="text-[10px] text-muted-foreground">Email signup in footer</p>
                  </div>
                  <Switch checked={config.footer.newsletterEnabled} onCheckedChange={v => updateFooter("newsletterEnabled", v)} />
                </div>
                {config.footer.newsletterEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label className="text-xs">Newsletter Title</Label><Input value={config.footer.newsletterTitle} onChange={e => updateFooter("newsletterTitle", e.target.value)} className="mt-1" /></div>
                    <div><Label className="text-xs">Newsletter Subtitle</Label><Input value={config.footer.newsletterSubtitle} onChange={e => updateFooter("newsletterSubtitle", e.target.value)} className="mt-1" /></div>
                  </div>
                )}
                <div>
                  <Label className="text-xs">Copyright Text</Label>
                  <Input value={config.footer.copyrightText} onChange={e => updateFooter("copyrightText", e.target.value)} className="mt-1" />
                </div>
              </div>
            </SectionEditor>
          );

          // Custom sections
          if (!isBuiltin(section.id)) return (
            <SectionEditor
              key={section.id}
              id={section.id}
              label={getSectionLabel(section)}
              expanded={expandedSection === section.id}
              onToggle={() => toggleExpand(section.id)}
              visible={section.visible}
              typeTag={getSectionTypeTag(section) || undefined}
              isCustom
              onDelete={() => setDeleteConfirm({ open: true, sectionId: section.id, label: getSectionLabel(section) })}
            >
            {/* Section Name */}
            <div className="mb-4">
              <Label className="text-xs">Section Name (internal)</Label>
              <Input value={section.label || ""} onChange={e => updateSectionLabel(section.id, e.target.value)} className="mt-1" placeholder="My Section" />
            </div>

            {/* Type-specific editors */}
            {section.customType === "text_block" && (
              <TextBlockEditor data={section.customData!} onChange={(u) => updateCustomData(section.id, u)} />
            )}
            {section.customType === "cta_banner" && (
              <CtaBannerEditor data={section.customData!} onChange={(u) => updateCustomData(section.id, u)} />
            )}
            {section.customType === "feature_grid" && (
              <FeatureGridEditor data={section.customData!} onChange={(u) => updateCustomData(section.id, u)} />
            )}
            {section.customType === "faq" && (
              <FaqEditor data={section.customData!} onChange={(u) => updateCustomData(section.id, u)} />
            )}
            {section.customType === "spacer" && (
              <SpacerEditor data={section.customData!} onChange={(u) => updateCustomData(section.id, u)} />
            )}
            {section.customType === "image_gallery" && (
              <ImageGalleryEditor data={section.customData!} onChange={(u) => updateCustomData(section.id, u)} />
            )}
          </SectionEditor>
          );

          return null;
        })}

        {/* Footer Editor */}
        <SectionEditor id="footer" label="Footer" expanded={expandedSection === "footer"} onToggle={() => toggleExpand("footer")} visible={true}>
          <div className="space-y-5">
            <div>
              <Label className="text-xs">Brand Description</Label>
              <Textarea value={config.footer.brandDescription} onChange={e => updateFooter("brandDescription", e.target.value)} className="mt-1" rows={2} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-xs font-semibold uppercase tracking-wider">Link Columns</Label>
                <Button variant="outline" size="sm" onClick={addFooterColumn} className="gap-1 text-xs h-7" disabled={config.footer.columns.length >= 4}>
                  <Plus className="w-3 h-3" /> Add Column
                </Button>
              </div>
              <div className="space-y-4">
                {config.footer.columns.map((col, colIdx) => (
                  <div key={colIdx} className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                    <div className="flex items-center gap-2">
                      <Input value={col.title} onChange={e => updateFooterColumn(colIdx, "title", e.target.value)} className="flex-1 h-8 text-sm font-semibold" placeholder="Column title" />
                      <Button variant="ghost" size="sm" onClick={() => removeFooterColumn(colIdx)} disabled={config.footer.columns.length <= 1} className="text-destructive hover:text-destructive h-8 px-2">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    {col.links.map((link, linkIdx) => (
                      <div key={linkIdx} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                        <Input value={link.label} onChange={e => updateFooterLink(colIdx, linkIdx, "label", e.target.value)} className="h-7 text-xs" placeholder="Label" />
                        <Input value={link.url} onChange={e => updateFooterLink(colIdx, linkIdx, "url", e.target.value)} className="h-7 text-xs" placeholder="/path or URL" />
                        <button onClick={() => removeFooterLink(colIdx, linkIdx)} disabled={col.links.length <= 1} className="p-1 rounded hover:bg-destructive/10 disabled:opacity-30">
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => addFooterLink(colIdx)} className="gap-1 text-xs h-6 w-full">
                      <Plus className="w-3 h-3" /> Add Link
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-border">
              <div>
                <Label className="text-xs font-semibold">Newsletter Section</Label>
                <p className="text-[10px] text-muted-foreground">Email signup in footer</p>
              </div>
              <Switch checked={config.footer.newsletterEnabled} onCheckedChange={v => updateFooter("newsletterEnabled", v)} />
            </div>
            {config.footer.newsletterEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label className="text-xs">Newsletter Title</Label><Input value={config.footer.newsletterTitle} onChange={e => updateFooter("newsletterTitle", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Newsletter Subtitle</Label><Input value={config.footer.newsletterSubtitle} onChange={e => updateFooter("newsletterSubtitle", e.target.value)} className="mt-1" /></div>
              </div>
            )}
            <div>
              <Label className="text-xs">Copyright Text</Label>
              <Input value={config.footer.copyrightText} onChange={e => updateFooter("copyrightText", e.target.value)} className="mt-1" />
            </div>
          </div>
        </SectionEditor>
      </div>

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, open }))}
        title="Delete Section"
        description={`Are you sure you want to delete "${deleteConfirm.label}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => { deleteCustomSection(deleteConfirm.sectionId); setDeleteConfirm({ open: false, sectionId: "", label: "" }); }}
      />
    </div>
  );
}

// ─── Type-specific editors ───

function TextBlockEditor({ data, onChange }: { data: CustomSectionData; onChange: (u: Partial<CustomSectionData>) => void }) {
  return (
    <div className="space-y-4">
      <div><Label className="text-xs">Heading</Label><Input value={data.heading || ""} onChange={e => onChange({ heading: e.target.value })} className="mt-1" /></div>
      <div><Label className="text-xs">Body</Label><Textarea value={data.body || ""} onChange={e => onChange({ body: e.target.value })} className="mt-1" rows={4} /></div>
      <div>
        <Label className="text-xs">Alignment</Label>
        <Select value={data.alignment || "center"} onValueChange={v => onChange({ alignment: v as "left" | "center" | "right" })}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="left">Left</SelectItem><SelectItem value="center">Center</SelectItem><SelectItem value="right">Right</SelectItem></SelectContent>
        </Select>
      </div>
    </div>
  );
}

function CtaBannerEditor({ data, onChange }: { data: CustomSectionData; onChange: (u: Partial<CustomSectionData>) => void }) {
  const [uploading, setUploading] = useState(false);
  const [cropState, setCropState] = useState<{ open: boolean; src: string }>({ open: false, src: "" });

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `cta/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("homepage-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("homepage-assets").getPublicUrl(path);
      onChange({ ctaBgImage: urlData.publicUrl });
      toast.success("Background image uploaded");
    } catch (e: any) {
      toast.error("Upload failed: " + (e.message || "Unknown error"));
    }
    setUploading(false);
  };

  const handleCropComplete = async (blob: Blob) => {
    setCropState({ open: false, src: "" });
    setUploading(true);
    try {
      const path = `cta/${Date.now()}_cropped.jpg`;
      const { error } = await supabase.storage.from("homepage-assets").upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("homepage-assets").getPublicUrl(path);
      onChange({ ctaBgImage: urlData.publicUrl });
      toast.success("Cropped background saved");
    } catch (e: any) {
      toast.error("Upload failed: " + (e.message || "Unknown error"));
    }
    setUploading(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label className="text-xs">Title</Label><Input value={data.ctaTitle || ""} onChange={e => onChange({ ctaTitle: e.target.value })} className="mt-1" /></div>
        <div><Label className="text-xs">Subtitle</Label><Input value={data.ctaSubtitle || ""} onChange={e => onChange({ ctaSubtitle: e.target.value })} className="mt-1" /></div>
        <div><Label className="text-xs">Button Text</Label><Input value={data.ctaButtonText || ""} onChange={e => onChange({ ctaButtonText: e.target.value })} className="mt-1" /></div>
        <div><Label className="text-xs">Button Link</Label><Input value={data.ctaButtonLink || ""} onChange={e => onChange({ ctaButtonLink: e.target.value })} className="mt-1" /></div>
        <div>
          <Label className="text-xs">Background Color</Label>
          <Select value={data.ctaBg || "primary"} onValueChange={v => onChange({ ctaBg: v as any })}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="primary">Primary (Pink)</SelectItem>
              <SelectItem value="blush">Blush</SelectItem>
              <SelectItem value="cream">Cream</SelectItem>
              <SelectItem value="muted">Muted Gray</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Background Image (optional) */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider">Background Image (optional)</Label>
        <p className="text-[10px] text-muted-foreground">Overrides the background color when set.</p>
        {data.ctaBgImage && (
          <div className="relative w-full h-32 rounded-xl overflow-hidden bg-muted">
            <img src={data.ctaBgImage} alt="CTA background" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center gap-2">
              <button
                onClick={() => setCropState({ open: true, src: data.ctaBgImage! })}
                className="px-3 py-1.5 bg-background/90 rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-background transition-colors"
              >
                <Crop className="w-3 h-3" /> Crop
              </button>
              <button
                onClick={() => onChange({ ctaBgImage: undefined })}
                className="px-3 py-1.5 bg-destructive/90 text-destructive-foreground rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-destructive transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Remove
              </button>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3">
          <Input
            value={data.ctaBgImage || ""}
            onChange={e => onChange({ ctaBgImage: e.target.value || undefined })}
            placeholder="https://... or upload"
            className="flex-1"
          />
          <label className="inline-flex items-center gap-1.5 text-xs text-primary font-medium cursor-pointer hover:underline whitespace-nowrap">
            <Upload className="w-3 h-3" />
            {uploading ? "Uploading..." : "Upload"}
            <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = ""; }} />
          </label>
        </div>
      </div>

      <ImageCropper
        open={cropState.open}
        imageSrc={cropState.src}
        aspect={21 / 9}
        onCropComplete={handleCropComplete}
        onClose={() => setCropState({ open: false, src: "" })}
      />
    </div>
  );
}

function FeatureGridEditor({ data, onChange }: { data: CustomSectionData; onChange: (u: Partial<CustomSectionData>) => void }) {
  const features = data.features || [];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label className="text-xs">Section Title</Label><Input value={data.gridTitle || ""} onChange={e => onChange({ gridTitle: e.target.value })} className="mt-1" /></div>
        <div><Label className="text-xs">Section Subtitle</Label><Input value={data.gridSubtitle || ""} onChange={e => onChange({ gridSubtitle: e.target.value })} className="mt-1" /></div>
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold uppercase tracking-wider">Features</Label>
        <Button variant="outline" size="sm" onClick={() => onChange({ features: [...features, { emoji: "⭐", title: "Feature", desc: "Description" }] })} className="gap-1 text-xs h-7"><Plus className="w-3 h-3" /> Add</Button>
      </div>
      {features.map((f, idx) => (
        <div key={idx} className="grid grid-cols-[60px_1fr_1fr_auto] gap-2 items-end p-3 rounded-xl bg-muted/30 border border-border">
          <div><Label className="text-[10px]">Emoji</Label><Input value={f.emoji} onChange={e => { const arr = [...features]; arr[idx] = { ...arr[idx], emoji: e.target.value }; onChange({ features: arr }); }} className="mt-1 text-center" /></div>
          <div><Label className="text-[10px]">Title</Label><Input value={f.title} onChange={e => { const arr = [...features]; arr[idx] = { ...arr[idx], title: e.target.value }; onChange({ features: arr }); }} className="mt-1" /></div>
          <div><Label className="text-[10px]">Description</Label><Input value={f.desc} onChange={e => { const arr = [...features]; arr[idx] = { ...arr[idx], desc: e.target.value }; onChange({ features: arr }); }} className="mt-1" /></div>
          <Button variant="ghost" size="sm" onClick={() => onChange({ features: features.filter((_, i) => i !== idx) })} disabled={features.length <= 1} className="text-destructive hover:text-destructive h-9 px-2"><Trash2 className="w-3.5 h-3.5" /></Button>
        </div>
      ))}
    </div>
  );
}

function FaqEditor({ data, onChange }: { data: CustomSectionData; onChange: (u: Partial<CustomSectionData>) => void }) {
  const faqs = data.faqs || [];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label className="text-xs">Section Title</Label><Input value={data.faqTitle || ""} onChange={e => onChange({ faqTitle: e.target.value })} className="mt-1" /></div>
        <div><Label className="text-xs">Section Subtitle</Label><Input value={data.faqSubtitle || ""} onChange={e => onChange({ faqSubtitle: e.target.value })} className="mt-1" /></div>
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold uppercase tracking-wider">Questions</Label>
        <Button variant="outline" size="sm" onClick={() => onChange({ faqs: [...faqs, { question: "New question?", answer: "Answer here." }] })} className="gap-1 text-xs h-7"><Plus className="w-3 h-3" /> Add</Button>
      </div>
      {faqs.map((faq, idx) => (
        <div key={idx} className="p-3 rounded-xl bg-muted/30 border border-border space-y-2">
          <div className="flex items-start gap-2">
            <div className="flex-1"><Label className="text-[10px]">Question</Label><Input value={faq.question} onChange={e => { const arr = [...faqs]; arr[idx] = { ...arr[idx], question: e.target.value }; onChange({ faqs: arr }); }} className="mt-1" /></div>
            <Button variant="ghost" size="sm" onClick={() => onChange({ faqs: faqs.filter((_, i) => i !== idx) })} disabled={faqs.length <= 1} className="text-destructive hover:text-destructive h-9 px-2 mt-4"><Trash2 className="w-3.5 h-3.5" /></Button>
          </div>
          <div><Label className="text-[10px]">Answer</Label><Textarea value={faq.answer} onChange={e => { const arr = [...faqs]; arr[idx] = { ...arr[idx], answer: e.target.value }; onChange({ faqs: arr }); }} className="mt-1" rows={2} /></div>
        </div>
      ))}
    </div>
  );
}

function SpacerEditor({ data, onChange }: { data: CustomSectionData; onChange: (u: Partial<CustomSectionData>) => void }) {
  return (
    <div>
      <Label className="text-xs">Height (px)</Label>
      <Input type="number" min={10} max={200} value={data.spacerHeight || 60} onChange={e => onChange({ spacerHeight: parseInt(e.target.value) || 60 })} className="mt-1 w-32" />
      <div className="mt-3 bg-muted/30 border border-dashed border-border rounded-xl flex items-center justify-center text-xs text-muted-foreground" style={{ height: data.spacerHeight || 60 }}>
        ↕ {data.spacerHeight || 60}px spacer
      </div>
    </div>
  );
}

function ImageGalleryEditor({ data, onChange }: { data: CustomSectionData; onChange: (u: Partial<CustomSectionData>) => void }) {
  const images = data.images || [];
  const [uploading, setUploading] = useState<number | null>(null);
  const [cropState, setCropState] = useState<{ open: boolean; idx: number; src: string }>({ open: false, idx: -1, src: "" });

  const handleFileUpload = async (idx: number, file: File) => {
    setUploading(idx);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `gallery/${Date.now()}_${idx}.${ext}`;
      const { error } = await supabase.storage.from("homepage-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("homepage-assets").getPublicUrl(path);
      const arr = [...images];
      arr[idx] = { ...arr[idx], url: urlData.publicUrl };
      onChange({ images: arr });
      toast.success("Image uploaded");
    } catch (e: any) {
      toast.error("Upload failed: " + (e.message || "Unknown error"));
    }
    setUploading(null);
  };

  const handleCropComplete = async (blob: Blob) => {
    const idx = cropState.idx;
    setCropState({ open: false, idx: -1, src: "" });
    setUploading(idx);
    try {
      const path = `gallery/${Date.now()}_cropped_${idx}.jpg`;
      const { error } = await supabase.storage.from("homepage-assets").upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("homepage-assets").getPublicUrl(path);
      const arr = [...images];
      arr[idx] = { ...arr[idx], url: urlData.publicUrl };
      onChange({ images: arr });
      toast.success("Cropped image saved");
    } catch (e: any) {
      toast.error("Upload failed: " + (e.message || "Unknown error"));
    }
    setUploading(null);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label className="text-xs">Section Title</Label><Input value={data.galleryTitle || ""} onChange={e => onChange({ galleryTitle: e.target.value })} className="mt-1" /></div>
        <div><Label className="text-xs">Section Subtitle</Label><Input value={data.gallerySubtitle || ""} onChange={e => onChange({ gallerySubtitle: e.target.value })} className="mt-1" /></div>
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold uppercase tracking-wider">Images</Label>
        <Button variant="outline" size="sm" onClick={() => onChange({ images: [...images, { url: "", caption: "" }] })} className="gap-1 text-xs h-7"><Plus className="w-3 h-3" /> Add</Button>
      </div>
      {images.map((img, idx) => (
        <div key={idx} className="p-3 rounded-xl bg-muted/30 border border-border space-y-2">
          <div className="flex items-start gap-3">
            {/* Image Preview */}
            <div className="w-20 h-20 rounded-lg bg-muted overflow-hidden shrink-0 flex items-center justify-center">
              {img.url ? (
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Image className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div><Label className="text-[10px]">Image URL</Label><Input value={img.url} onChange={e => { const arr = [...images]; arr[idx] = { ...arr[idx], url: e.target.value }; onChange({ images: arr }); }} className="mt-1" placeholder="https://... or upload below" /></div>
              <div><Label className="text-[10px]">Caption (optional)</Label><Input value={img.caption} onChange={e => { const arr = [...images]; arr[idx] = { ...arr[idx], caption: e.target.value }; onChange({ images: arr }); }} className="mt-1" /></div>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <label className="inline-flex items-center gap-1.5 text-xs text-primary font-medium cursor-pointer hover:underline">
              <Upload className="w-3 h-3" />
              {uploading === idx ? "Uploading..." : "Upload Image"}
              <input type="file" accept="image/*" className="hidden" disabled={uploading === idx} onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(idx, f); e.target.value = ""; }} />
            </label>
            {img.url && (
              <button
                onClick={() => setCropState({ open: true, idx, src: img.url })}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium hover:text-foreground transition-colors"
              >
                <Crop className="w-3 h-3" /> Crop
              </button>
            )}
            <div className="flex-1" />
            <Button variant="ghost" size="sm" onClick={() => onChange({ images: images.filter((_, i) => i !== idx) })} className="text-destructive hover:text-destructive h-7 px-2"><Trash2 className="w-3.5 h-3.5" /></Button>
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground">Upload images or paste URLs. Crop is optional.</p>

      <ImageCropper
        open={cropState.open}
        imageSrc={cropState.src}
        aspect={1}
        onCropComplete={handleCropComplete}
        onClose={() => setCropState({ open: false, idx: -1, src: "" })}
      />
    </div>
  );
}

// ─── Section Editor Shell ───

function SectionEditor({
  id, label, expanded, onToggle, visible, children, typeTag, isCustom, onDelete,
}: {
  id: string; label: string; expanded: boolean; onToggle: () => void; visible: boolean; children: React.ReactNode;
  typeTag?: string; isCustom?: boolean; onDelete?: () => void;
}) {
  return (
    <div className={`bg-card rounded-2xl border transition-colors ${visible ? "border-border" : "border-transparent opacity-50"}`}>
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 text-left">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-semibold truncate">{label}</span>
          {typeTag && <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md shrink-0">{typeTag}</span>}
          {!visible && <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-md shrink-0">Hidden</span>}
          {isCustom && <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-md shrink-0">Custom</span>}
        </div>
        <div className="flex items-center gap-2">
          {isCustom && onDelete && (
            <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-1 rounded hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
          )}
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </button>
      {expanded && <div className="px-4 pb-5 border-t border-border pt-4">{children}</div>}
    </div>
  );
}
