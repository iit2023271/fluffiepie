import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DeliveryConfig {
  delivery_fee: number;
  free_delivery_threshold: number;
  time_slots: string[];
}

const DEFAULT_CONFIG: DeliveryConfig = {
  delivery_fee: 49,
  free_delivery_threshold: 999,
  time_slots: ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM"],
};

export function useDeliveryConfig() {
  const [config, setConfig] = useState<DeliveryConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("store_config")
      .select("*")
      .eq("config_type", "delivery_settings")
      .eq("is_active", true)
      .single()
      .then(({ data }) => {
        if (data) {
          try {
            setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(data.value) });
          } catch {}
        }
        setLoading(false);
      });
  }, []);

  return { config, loading };
}

export { DEFAULT_CONFIG as DEFAULT_DELIVERY_CONFIG };
