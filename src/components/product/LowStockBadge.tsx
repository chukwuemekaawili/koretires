import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LowStockBadgeProps {
  qtyOnHand: number;
  qtyReserved: number;
  threshold?: number;
  className?: string;
}

const LOW_STOCK_THRESHOLD = 4;

export function LowStockBadge({ 
  qtyOnHand, 
  qtyReserved, 
  threshold = LOW_STOCK_THRESHOLD,
  className = ""
}: LowStockBadgeProps) {
  const available = qtyOnHand - qtyReserved;
  
  if (available <= 0) {
    return (
      <Badge variant="destructive" className={`gap-1 ${className}`}>
        <AlertTriangle className="h-3 w-3" />
        Out of Stock
      </Badge>
    );
  }
  
  if (available < threshold) {
    return (
      <Badge variant="secondary" className={`gap-1 bg-amber-500/20 text-amber-400 border-amber-500/30 ${className}`}>
        <AlertTriangle className="h-3 w-3" />
        Low Stock: only {available} left
      </Badge>
    );
  }
  
  return null;
}

// Helper hook to check low stock status
export function useLowStockStatus(qtyOnHand: number, qtyReserved: number, threshold = LOW_STOCK_THRESHOLD) {
  const available = qtyOnHand - qtyReserved;
  return {
    available,
    isLowStock: available > 0 && available < threshold,
    isOutOfStock: available <= 0,
    showBadge: available < threshold
  };
}