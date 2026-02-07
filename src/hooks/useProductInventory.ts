import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface InventoryData {
  product_id: string;
  qty_on_hand: number;
  qty_reserved: number;
}

interface ProductInventoryMap {
  [productId: string]: {
    qtyOnHand: number;
    qtyReserved: number;
    available: number;
    isLowStock: boolean;
    isOutOfStock: boolean;
  };
}

const LOW_STOCK_THRESHOLD = 4;

export function useProductInventory(productIds: string[]) {
  const [inventoryMap, setInventoryMap] = useState<ProductInventoryMap>({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchInventory = useCallback(async () => {
    if (productIds.length === 0) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("inventory")
        .select("product_id, qty_on_hand, qty_reserved")
        .in("product_id", productIds);

      if (error) throw error;

      const map: ProductInventoryMap = {};
      (data || []).forEach((inv: InventoryData) => {
        const available = inv.qty_on_hand - inv.qty_reserved;
        map[inv.product_id] = {
          qtyOnHand: inv.qty_on_hand,
          qtyReserved: inv.qty_reserved,
          available,
          isLowStock: available > 0 && available < LOW_STOCK_THRESHOLD,
          isOutOfStock: available <= 0
        };
      });

      setInventoryMap(map);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setIsLoading(false);
    }
  }, [productIds.join(",")]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const getInventory = useCallback((productId: string) => {
    return inventoryMap[productId] || {
      qtyOnHand: 0,
      qtyReserved: 0,
      available: 0,
      isLowStock: false,
      isOutOfStock: false
    };
  }, [inventoryMap]);

  return { inventoryMap, getInventory, isLoading, refetch: fetchInventory };
}

// Single product inventory hook
export function useSingleProductInventory(productId: string | undefined) {
  const [inventory, setInventory] = useState<{
    qtyOnHand: number;
    qtyReserved: number;
    available: number;
    isLowStock: boolean;
    isOutOfStock: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!productId) return;

    const fetchInventory = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("inventory")
          .select("qty_on_hand, qty_reserved")
          .eq("product_id", productId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          const available = data.qty_on_hand - data.qty_reserved;
          setInventory({
            qtyOnHand: data.qty_on_hand,
            qtyReserved: data.qty_reserved,
            available,
            isLowStock: available > 0 && available < LOW_STOCK_THRESHOLD,
            isOutOfStock: available <= 0
          });
        } else {
          // No inventory record means unlimited stock (legacy products)
          setInventory(null);
        }
      } catch (error) {
        console.error("Error fetching inventory:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventory();
  }, [productId]);

  return { inventory, isLoading };
}