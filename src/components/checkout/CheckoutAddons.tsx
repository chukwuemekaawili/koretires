import { motion } from "framer-motion";
import { Check, Plus, Info } from "lucide-react";
import { CheckoutAddon } from "@/hooks/useCheckoutAddons";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CheckoutAddonsProps {
  addons: CheckoutAddon[];
  selectedAddons: string[];
  onToggleAddon: (addonId: string) => void;
  tireQuantity: number;
}

export function CheckoutAddons({
  addons,
  selectedAddons,
  onToggleAddon,
  tireQuantity,
}: CheckoutAddonsProps) {
  const groupedAddons = addons.reduce((acc, addon) => {
    const category = addon.category || "general";
    if (!acc[category]) acc[category] = [];
    acc[category].push(addon);
    return acc;
  }, {} as Record<string, CheckoutAddon[]>);

  const categoryLabels: Record<string, string> = {
    required: "Required",
    service: "Installation Services",
    parts: "Parts & Accessories",
    warranty: "Protection Plans",
    general: "Add-ons",
  };

  const calculateAddonPrice = (addon: CheckoutAddon) => {
    // Some add-ons are per-tire, others are flat
    const perTireAddons = ["Tire Disposal Fee", "Nitrogen Fill", "Wheel Balancing"];
    if (perTireAddons.includes(addon.name)) {
      return addon.price * tireQuantity;
    }
    return addon.price;
  };

  return (
    <div className="space-y-6">
      <h3 className="font-display text-lg font-semibold">Optional Add-ons</h3>

      {Object.entries(groupedAddons).map(([category, categoryAddons]) => (
        <div key={category} className="space-y-3">
          <p className="text-sm text-muted-foreground font-medium">
            {categoryLabels[category] || category}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {categoryAddons.map((addon) => {
              const isSelected = selectedAddons.includes(addon.id);
              const totalPrice = calculateAddonPrice(addon);

              return (
                <motion.button
                  key={addon.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => onToggleAddon(addon.id)}
                  className={cn(
                    "relative flex items-start gap-3 p-4 rounded-xl border text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  )}
                >
                  <div
                    className={cn(
                      "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                      isSelected
                        ? "bg-primary border-primary"
                        : "border-muted-foreground"
                    )}
                  >
                    {isSelected ? (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    ) : (
                      <Plus className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{addon.name}</span>
                      {addon.description && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs text-xs">{addon.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">
                        ${addon.price.toFixed(2)}
                        {["Tire Disposal Fee", "Nitrogen Fill", "Wheel Balancing"].includes(
                          addon.name
                        ) && (
                          <span className="text-xs"> × {tireQuantity}</span>
                        )}
                      </span>
                      {totalPrice !== addon.price && (
                        <span className="text-sm font-medium text-primary">
                          = ${totalPrice.toFixed(2)}
                        </span>
                      )}
                      {!addon.is_taxable && (
                        <span className="text-xs text-muted-foreground">(No GST)</span>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
