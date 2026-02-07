import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CheckoutAddon {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_taxable: boolean;
  category: string;
  sort_order: number;
}

export function useCheckoutAddons() {
  const [addons, setAddons] = useState<CheckoutAddon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAddons = async () => {
      try {
        const { data, error } = await supabase
          .from("checkout_addons")
          .select("*")
          .eq("is_active", true)
          .order("sort_order");

        if (error) throw error;
        setAddons(data || []);
      } catch (err) {
        console.error("Error fetching checkout addons:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAddons();
  }, []);

  return { addons, isLoading };
}
