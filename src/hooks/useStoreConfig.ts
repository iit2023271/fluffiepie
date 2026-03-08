import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ConfigItem {
  id: string;
  config_type: string;
  value: string;
  is_active: boolean;
  sort_order: number;
}

// Built-in section types that map to product columns
export const BUILTIN_FILTER_TYPES = ["category", "flavour", "occasion"];

// Reserved config types that are NOT product filters
const RESERVED_TYPES = ["homepage_config", "email_notification", "store_info", "filter_section", "product_tag", "delivery_settings", "active_theme"];

export interface FilterSection {
  type: string;
  label: string;
  values: string[];
  isBuiltin: boolean;
  isMulti: boolean; // occasion-style multi-select
}

export function useStoreConfig() {
  const [configItems, setConfigItems] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("store_config")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (data) {
      setConfigItems(data as ConfigItem[]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Built-in filters
  const categories = configItems.filter(d => d.config_type === "category").map(d => d.value);
  const flavours = configItems.filter(d => d.config_type === "flavour").map(d => d.value);
  const occasions = configItems.filter(d => d.config_type === "occasion").map(d => d.value);
  const productTags = configItems.filter(d => d.config_type === "product_tag").map(d => d.value);

  // Custom filter section definitions (stored as filter_section type with JSON value)
  const customSectionDefs = configItems
    .filter(d => d.config_type === "filter_section")
    .map(d => {
      try { return JSON.parse(d.value) as { type: string; label: string; isMulti: boolean }; }
      catch { return null; }
    })
    .filter(Boolean) as { type: string; label: string; isMulti: boolean }[];

  // Get all unique config types that are product filters (not reserved)
  const allFilterTypes = new Set<string>();
  configItems.forEach(d => {
    if (!RESERVED_TYPES.includes(d.config_type)) {
      allFilterTypes.add(d.config_type);
    }
  });

  // Build complete filter sections list
  const filterSections: FilterSection[] = [];

  // Built-in sections
  if (categories.length) filterSections.push({ type: "category", label: "Category", values: categories, isBuiltin: true, isMulti: false });
  if (flavours.length) filterSections.push({ type: "flavour", label: "Flavour", values: flavours, isBuiltin: true, isMulti: false });
  if (occasions.length) filterSections.push({ type: "occasion", label: "Occasion", values: occasions, isBuiltin: true, isMulti: true });

  // Custom sections
  for (const def of customSectionDefs) {
    const values = configItems.filter(d => d.config_type === def.type).map(d => d.value);
    if (values.length) {
      filterSections.push({ type: def.type, label: def.label, values, isBuiltin: false, isMulti: def.isMulti });
    }
  }

  return { categories, flavours, occasions, productTags, filterSections, customSectionDefs, loading, reload: load };
}
