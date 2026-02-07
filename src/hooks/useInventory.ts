import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface InventoryCheck {
  productId: string;
  quantity: number;
}

interface InventoryCheckResult {
  productId: string;
  requestedQty: number;
  availableQty: number;
  isAvailable: boolean;
  availabilityLabel: string;
}

interface ReservationResult {
  success: boolean;
  reservedItems: { productId: string; reservedQty: number }[];
  needsStockConfirmation: boolean;
}

export function useInventory() {
  /**
   * Check availability for multiple products
   * Returns availability status for each item
   */
  const checkAvailability = useCallback(async (items: InventoryCheck[]): Promise<InventoryCheckResult[]> => {
    if (items.length === 0) return [];

    const productIds = items.map(i => i.productId);
    
    // Fetch inventory for all products
    const { data: inventoryData } = await supabase
      .from("inventory")
      .select("product_id, qty_on_hand, qty_reserved")
      .in("product_id", productIds);

    // Fetch products for availability labels
    const { data: productsData } = await supabase
      .from("products")
      .select("id, availability")
      .in("id", productIds);

    const inventoryMap = new Map(inventoryData?.map(i => [i.product_id, i]) || []);
    const productMap = new Map(productsData?.map(p => [p.id, p]) || []);

    return items.map(item => {
      const inv = inventoryMap.get(item.productId);
      const product = productMap.get(item.productId);
      
      const qtyOnHand = inv?.qty_on_hand || 0;
      const qtyReserved = inv?.qty_reserved || 0;
      const availableQty = qtyOnHand - qtyReserved;
      const isAvailable = availableQty >= item.quantity;

      return {
        productId: item.productId,
        requestedQty: item.quantity,
        availableQty: Math.max(0, availableQty),
        isAvailable,
        availabilityLabel: isAvailable 
          ? "In Stock" 
          : product?.availability || "Available within 24 hours"
      };
    });
  }, []);

  /**
   * Reserve stock for an order (SOFT - allows ordering even if not available)
   * Returns whether the order needs stock confirmation
   */
  const reserveStock = useCallback(async (
    orderId: string,
    items: InventoryCheck[],
    userId?: string
  ): Promise<ReservationResult> => {
    const reservedItems: { productId: string; reservedQty: number }[] = [];
    let needsStockConfirmation = false;

    for (const item of items) {
      // Get current inventory
      const { data: inv } = await supabase
        .from("inventory")
        .select("*")
        .eq("product_id", item.productId)
        .single();

      if (!inv) {
        // No inventory record - needs confirmation
        needsStockConfirmation = true;
        continue;
      }

      const available = inv.qty_on_hand - inv.qty_reserved;
      
      if (available >= item.quantity) {
        // Reserve full quantity
        const newReserved = inv.qty_reserved + item.quantity;
        await supabase
          .from("inventory")
          .update({ qty_reserved: newReserved })
          .eq("id", inv.id);

        // Log movement
        await supabase.from("inventory_movements").insert({
          product_id: item.productId,
          delta_qty: 0, // No change to on-hand
          reason: `Reserved for order`,
          reference_type: "order",
          reference_id: orderId,
          notes: `Reserved ${item.quantity} units`,
          created_by: userId
        });

        reservedItems.push({ productId: item.productId, reservedQty: item.quantity });
      } else if (available > 0) {
        // Reserve what's available, flag for confirmation
        const newReserved = inv.qty_reserved + available;
        await supabase
          .from("inventory")
          .update({ qty_reserved: newReserved })
          .eq("id", inv.id);

        await supabase.from("inventory_movements").insert({
          product_id: item.productId,
          delta_qty: 0,
          reason: `Partial reservation for order`,
          reference_type: "order",
          reference_id: orderId,
          notes: `Reserved ${available} of ${item.quantity} units`,
          created_by: userId
        });

        reservedItems.push({ productId: item.productId, reservedQty: available });
        needsStockConfirmation = true;
      } else {
        // No stock available - flag for confirmation
        needsStockConfirmation = true;
      }
    }

    // Update order if needs confirmation
    if (needsStockConfirmation) {
      await supabase
        .from("orders")
        .update({ needs_stock_confirmation: true })
        .eq("id", orderId);
    }

    return { success: true, reservedItems, needsStockConfirmation };
  }, []);

  /**
   * Release reserved stock (e.g., on order cancellation)
   */
  const releaseReservation = useCallback(async (
    orderId: string,
    items: InventoryCheck[],
    userId?: string
  ): Promise<boolean> => {
    for (const item of items) {
      const { data: inv } = await supabase
        .from("inventory")
        .select("*")
        .eq("product_id", item.productId)
        .single();

      if (inv && inv.qty_reserved >= item.quantity) {
        const newReserved = Math.max(0, inv.qty_reserved - item.quantity);
        await supabase
          .from("inventory")
          .update({ qty_reserved: newReserved })
          .eq("id", inv.id);

        await supabase.from("inventory_movements").insert({
          product_id: item.productId,
          delta_qty: 0,
          reason: `Reservation released - order cancelled`,
          reference_type: "cancel",
          reference_id: orderId,
          notes: `Released ${item.quantity} units`,
          created_by: userId
        });
      }
    }
    return true;
  }, []);

  /**
   * Fulfill order - decrement actual stock
   */
  const fulfillOrder = useCallback(async (
    orderId: string,
    items: InventoryCheck[],
    userId?: string
  ): Promise<boolean> => {
    for (const item of items) {
      const { data: inv } = await supabase
        .from("inventory")
        .select("*")
        .eq("product_id", item.productId)
        .single();

      if (inv) {
        // Decrease on-hand and reserved
        const wasReserved = Math.min(inv.qty_reserved, item.quantity);
        const newOnHand = Math.max(0, inv.qty_on_hand - item.quantity);
        const newReserved = Math.max(0, inv.qty_reserved - wasReserved);

        await supabase
          .from("inventory")
          .update({ qty_on_hand: newOnHand, qty_reserved: newReserved })
          .eq("id", inv.id);

        await supabase.from("inventory_movements").insert({
          product_id: item.productId,
          delta_qty: -item.quantity,
          reason: `Order fulfilled`,
          reference_type: "fulfillment",
          reference_id: orderId,
          notes: `Shipped/delivered ${item.quantity} units`,
          created_by: userId
        });
      }
    }
    return true;
  }, []);

  /**
   * Get availability label for a single product
   */
  const getAvailabilityLabel = useCallback(async (productId: string): Promise<string> => {
    const { data: inv } = await supabase
      .from("inventory")
      .select("qty_on_hand, qty_reserved")
      .eq("product_id", productId)
      .single();

    if (inv) {
      const available = inv.qty_on_hand - inv.qty_reserved;
      if (available > 0) return "In Stock";
    }

    // Fall back to product's availability label
    const { data: product } = await supabase
      .from("products")
      .select("availability")
      .eq("id", productId)
      .single();

    return product?.availability || "Available within 24 hours";
  }, []);

  return {
    checkAvailability,
    reserveStock,
    releaseReservation,
    fulfillOrder,
    getAvailabilityLabel
  };
}
