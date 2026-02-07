import { motion } from "framer-motion";
import { ShoppingBag, Truck, MapPin, Wrench, Package } from "lucide-react";
import { useCart, FulfillmentMethod } from "@/contexts/CartContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import { CheckoutAddon } from "@/hooks/useCheckoutAddons";
import { Separator } from "@/components/ui/separator";

interface OrderSummaryProps {
  selectedAddons: CheckoutAddon[];
  shippingCost?: number | null;
}

const fulfillmentIcons: Record<FulfillmentMethod, React.ReactNode> = {
  pickup: <MapPin className="h-4 w-4" />,
  delivery: <Truck className="h-4 w-4" />,
  installation: <Wrench className="h-4 w-4" />,
  shipping: <Package className="h-4 w-4" />,
};

export function OrderSummary({ selectedAddons, shippingCost }: OrderSummaryProps) {
  const { items, subtotal, fulfillment, itemCount } = useCart();
  const { settings, calculateGst } = useSiteSettings();
  const { companyInfo } = useCompanyInfo();
  
  const city = companyInfo.location.city;

  const fulfillmentLabels: Record<FulfillmentMethod, string> = {
    pickup: "Warehouse Pickup",
    delivery: city ? `Free ${city} Delivery` : "Free Local Delivery",
    installation: "Installation Service",
    shipping: "Shipping (Quote Pending)",
  };

  // Calculate add-ons total
  const perTireAddons = ["Tire Disposal Fee", "Nitrogen Fill", "Wheel Balancing"];
  const addonsSubtotal = selectedAddons.reduce((sum, addon) => {
    const qty = perTireAddons.includes(addon.name) ? itemCount : 1;
    return sum + addon.price * qty;
  }, 0);

  const taxableAddons = selectedAddons.filter((a) => a.is_taxable);
  const taxableAddonsTotal = taxableAddons.reduce((sum, addon) => {
    const qty = perTireAddons.includes(addon.name) ? itemCount : 1;
    return sum + addon.price * qty;
  }, 0);

  const preGstTotal = subtotal + addonsSubtotal + (shippingCost || 0);
  const gstAmount = calculateGst(subtotal + taxableAddonsTotal);
  const total = preGstTotal + gstAmount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bento-card sticky top-24"
    >
      <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
        <ShoppingBag className="h-5 w-5 text-primary" />
        Order Summary
      </h3>

      {/* Cart Items */}
      <div className="space-y-3 mb-4">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {item.size} × {item.quantity}
            </span>
            <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <Separator className="my-4" />

      {/* Subtotal */}
      <div className="flex justify-between text-sm mb-2">
        <span className="text-muted-foreground">Subtotal</span>
        <span>${subtotal.toFixed(2)}</span>
      </div>

      {/* Fulfillment */}
      {fulfillment && (
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground flex items-center gap-1.5">
            {fulfillmentIcons[fulfillment]}
            {fulfillmentLabels[fulfillment]}
          </span>
          <span className="text-success">
            {fulfillment === "shipping" ? "TBD" : "Included"}
          </span>
        </div>
      )}

      {/* Add-ons */}
      {selectedAddons.length > 0 && (
        <>
          <Separator className="my-3" />
          <div className="space-y-2">
            {selectedAddons.map((addon) => {
              const qty = perTireAddons.includes(addon.name) ? itemCount : 1;
              return (
                <div key={addon.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {addon.name} {qty > 1 && `× ${qty}`}
                  </span>
                  <span>${(addon.price * qty).toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Shipping Cost */}
      {fulfillment === "shipping" && shippingCost !== undefined && shippingCost !== null && (
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Shipping</span>
          <span>${shippingCost.toFixed(2)}</span>
        </div>
      )}

      <Separator className="my-4" />

      {/* GST */}
      <div className="flex justify-between text-sm mb-2">
        <span className="text-muted-foreground">GST (5%)</span>
        <span>${gstAmount.toFixed(2)}</span>
      </div>

      {/* Total */}
      <div className="flex justify-between text-lg font-semibold mt-4 pt-4 border-t border-border">
        <span>Total</span>
        <span className="text-primary">${total.toFixed(2)}</span>
      </div>

      {/* Payment Note */}
      <p className="text-xs text-muted-foreground mt-4 text-center">
        Pay in-person on delivery or pickup. Cash or card accepted.
      </p>
    </motion.div>
  );
}
