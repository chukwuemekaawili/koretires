import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface GstSettings {
  rate: number;
  display_mode: "before_tax" | "inclusive";
  enabled: boolean;
}

interface ShippingSettings {
  free_delivery_zones: string[];
  request_mode: boolean;
}

interface DealerCheckoutSettings {
  mode: "direct_order" | "quote_request";
  direct_order_enabled: boolean;
}

interface ServicesSettings {
  booking_mode: "date_only" | "date_time";
  time_slots_enabled: boolean;
}

interface SiteSettings {
  gst: GstSettings;
  shipping: ShippingSettings;
  dealer_checkout: DealerCheckoutSettings;
  services: ServicesSettings;
}

const defaultSettings: SiteSettings = {
  gst: { rate: 5, display_mode: "before_tax", enabled: true },
  shipping: { free_delivery_zones: ["Edmonton"], request_mode: true },
  dealer_checkout: { mode: "quote_request", direct_order_enabled: false },
  services: { booking_mode: "date_only", time_slots_enabled: false },
};

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value");

      if (error) throw error;

      const newSettings = { ...defaultSettings };
      data?.forEach((item) => {
        const key = item.key as keyof SiteSettings;
        if (key in newSettings) {
          newSettings[key] = item.value as any;
        }
      });

      setSettings(newSettings);
    } catch (err) {
      console.error("Error fetching site settings:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const calculateGst = useCallback(
    (subtotal: number): number => {
      if (!settings.gst.enabled) return 0;
      return subtotal * (settings.gst.rate / 100);
    },
    [settings.gst]
  );

  const formatPrice = useCallback(
    (price: number, includeGst = false): number => {
      if (includeGst && settings.gst.enabled) {
        return price * (1 + settings.gst.rate / 100);
      }
      return price;
    },
    [settings.gst]
  );

  return {
    settings,
    isLoading,
    calculateGst,
    formatPrice,
    refetch: fetchSettings,
  };
}
