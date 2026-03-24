import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SocialLink {
  platform: string;
  url: string;
}

export interface StoreInfo {
  storeName: string;
  phone: string;
  phone2: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  mapUrl: string;
  openingHours: string;
  whatsappNumber: string;
  socialLinks: SocialLink[];
}

export const DEFAULT_STORE_INFO: StoreInfo = {
  storeName: "",
  phone: "",
  phone2: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  mapUrl: "",
  openingHours: "",
  whatsappNumber: "",
  socialLinks: [],
};

export function useStoreInfo() {
  const [storeInfo, setStoreInfo] = useState<StoreInfo>(DEFAULT_STORE_INFO);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("store_config")
        .select("value")
        .eq("config_type", "store_info")
        .eq("is_active", true)
        .maybeSingle();
      if (data?.value) {
        try {
          setStoreInfo({ ...DEFAULT_STORE_INFO, ...JSON.parse(data.value) });
        } catch { /* use defaults */ }
      }
      setLoading(false);
    };
    load();
  }, []);

  return { storeInfo, loading };
}
