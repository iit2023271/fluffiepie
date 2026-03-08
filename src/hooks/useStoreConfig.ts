import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ConfigItem {
  id: string;
  config_type: string;
  value: string;
  is_active: boolean;
  sort_order: number;
}

export function useStoreConfig() {
  const [categories, setCategories] = useState<string[]>([]);
  const [flavours, setFlavours] = useState<string[]>([]);
  const [occasions, setOccasions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("store_config")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (data) {
      setCategories(data.filter((d: ConfigItem) => d.config_type === "category").map((d: ConfigItem) => d.value));
      setFlavours(data.filter((d: ConfigItem) => d.config_type === "flavour").map((d: ConfigItem) => d.value));
      setOccasions(data.filter((d: ConfigItem) => d.config_type === "occasion").map((d: ConfigItem) => d.value));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return { categories, flavours, occasions, loading, reload: load };
}
