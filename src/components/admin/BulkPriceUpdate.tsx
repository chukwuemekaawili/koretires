import { useState, useEffect, useCallback } from "react";
import {
  ArrowUpDown,
  Calculator,
  Check,
  Filter,
  Loader2,
  TrendingDown,
  TrendingUp,
  X,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  size: string;
  vendor: string | null;
  type: string;
  price: number;
  wholesale_price: number | null;
  availability: string | null;
  sku: string | null;
  category_id: string | null;
  category_name?: string;
  is_active?: boolean | null;
}

interface PreviewRow {
  product: Product;
  newRetail: number;
  newWholesale: number | null;
  retailDelta: number;
  retailPctChange: number;
  wholesaleDelta: number | null;
  wholesalePctChange: number | null;
}

type PriceOperation = "set" | "increase_pct" | "decrease_pct" | "increase_fixed" | "decrease_fixed";

const operationOptions: { value: PriceOperation; label: string }[] = [
  { value: "set", label: "Set to fixed value" },
  { value: "increase_pct", label: "Increase by %" },
  { value: "decrease_pct", label: "Decrease by %" },
  { value: "increase_fixed", label: "Increase by $" },
  { value: "decrease_fixed", label: "Decrease by $" },
];

const tireTypes = [
  { value: "", label: "All Types" },
  { value: "all_season", label: "All Season" },
  { value: "winter", label: "Winter" },
  { value: "all_weather", label: "All Weather" },
  { value: "summer", label: "Summer" },
];

const availabilityOptions = [
  { value: "", label: "All Availability" },
  { value: "In Stock", label: "In Stock" },
  { value: "Available within 24 hours", label: "Available within 24 hours" },
  { value: "Available within 48 hours", label: "Available within 48 hours" },
  { value: "Special Order", label: "Special Order" },
  { value: "Out of Stock", label: "Out of Stock" },
];

const PAGE_SIZE = 50;

interface BulkPriceUpdateProps {
  onComplete?: () => void;
}

export function BulkPriceUpdate({ onComplete }: BulkPriceUpdateProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"filter" | "preview" | "confirm">("filter");
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Filter options from DB
  const [vendors, setVendors] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Filters
  const [filterVendor, setFilterVendor] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterAvailability, setFilterAvailability] = useState("");
  const [filterSizeContains, setFilterSizeContains] = useState("");

  // Price operation
  const [retailOperation, setRetailOperation] = useState<PriceOperation>("increase_pct");
  const [retailValue, setRetailValue] = useState("");
  const [updateWholesale, setUpdateWholesale] = useState(false);
  const [wholesaleOperation, setWholesaleOperation] = useState<PriceOperation>("increase_pct");
  const [wholesaleValue, setWholesaleValue] = useState("");
  const [setWholesaleEvenIfBlank, setSetWholesaleEvenIfBlank] = useState(false);

  // Preview
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);
  const [confirmText, setConfirmText] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  // Rollback
  const [lastBatchId, setLastBatchId] = useState<string | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);

  // Fetch vendors and categories for filters (use admin RPC for products)
  useEffect(() => {
    const fetchFilterOptions = async () => {
      const [vendorsRes, categoriesRes] = await Promise.all([
        supabase.rpc("get_products_admin"),
        supabase.from("product_categories").select("id, name, slug").eq("is_active", true).order("sort_order")
      ]);
      
      if (vendorsRes.data) {
        const unique = [...new Set(vendorsRes.data.map((d: { vendor: string | null }) => d.vendor).filter(Boolean))] as string[];
        setVendors(unique.sort());
      }
      if (categoriesRes.data) {
        setCategories(categoriesRes.data);
      }
    };
    fetchFilterOptions();
  }, []);

  const calculateNewPrice = useCallback(
    (currentPrice: number, operation: PriceOperation, value: number): number => {
      switch (operation) {
        case "set":
          return value;
        case "increase_pct":
          return currentPrice * (1 + value / 100);
        case "decrease_pct":
          return currentPrice * (1 - value / 100);
        case "increase_fixed":
          return currentPrice + value;
        case "decrease_fixed":
          return Math.max(0, currentPrice - value);
        default:
          return currentPrice;
      }
    },
    []
  );

  const generatePreview = async () => {
    if (!retailValue) {
      toast.error("Please enter a retail price value");
      return;
    }

    setIsLoading(true);
    try {
      // Use admin RPC to get products with wholesale_price
      const { data: allProducts, error } = await supabase.rpc("get_products_admin");
      if (error) throw error;

      // Filter in-memory since RPC returns all products
      let filteredData = (allProducts || []).filter((p: Product) => p.is_active !== false);
      
      if (filterVendor) filteredData = filteredData.filter((p: Product) => p.vendor === filterVendor);
      if (filterCategory) filteredData = filteredData.filter((p: Product) => p.category_id === filterCategory);
      if (filterType) filteredData = filteredData.filter((p: Product) => p.type === filterType);
      if (filterAvailability) filteredData = filteredData.filter((p: Product) => p.availability === filterAvailability);
      if (filterSizeContains) filteredData = filteredData.filter((p: Product) => p.size?.toLowerCase().includes(filterSizeContains.toLowerCase()));

      const data = filteredData;

      const retailVal = parseFloat(retailValue);
      const wholesaleVal = updateWholesale && wholesaleValue ? parseFloat(wholesaleValue) : null;

      // Map category names
      const categoryMap = new Map(categories.map(c => [c.id, c.name]));

      const preview: PreviewRow[] = (data || []).map((product) => {
        const newRetail = Math.round(calculateNewPrice(product.price, retailOperation, retailVal) * 100) / 100;
        const retailDelta = newRetail - product.price;
        const retailPctChange = product.price > 0 ? ((retailDelta / product.price) * 100) : 0;

        let newWholesale: number | null = null;
        let wholesaleDelta: number | null = null;
        let wholesalePctChange: number | null = null;

        if (updateWholesale && wholesaleVal !== null) {
          if (product.wholesale_price || setWholesaleEvenIfBlank) {
            const baseWholesale = product.wholesale_price || product.price * 0.7; // Default to 70% of retail if setting blank
            newWholesale = Math.round(calculateNewPrice(baseWholesale, wholesaleOperation, wholesaleVal) * 100) / 100;
            wholesaleDelta = newWholesale - (product.wholesale_price || 0);
            wholesalePctChange = (product.wholesale_price || 0) > 0 
              ? ((wholesaleDelta / product.wholesale_price!) * 100) 
              : 100;
          }
        }

        return {
          product: {
            ...product,
            category_name: product.category_id ? categoryMap.get(product.category_id) : undefined
          },
          newRetail,
          newWholesale,
          retailDelta,
          retailPctChange,
          wholesaleDelta,
          wholesalePctChange,
        };
      });

      setPreviewData(preview);
      setCurrentPage(0);
      setStep("preview");
    } catch (err) {
      console.error("Error generating preview:", err);
      toast.error("Failed to generate preview");
    } finally {
      setIsLoading(false);
    }
  };

  const applyChanges = async () => {
    if (confirmText !== "CONFIRM") {
      toast.error("Please type CONFIRM to proceed");
      return;
    }

    setIsApplying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const batchId = crypto.randomUUID();

      // Batch updates for performance
      const updates = previewData.map((row) => ({
        id: row.product.id,
        price: row.newRetail,
        ...(row.newWholesale !== null && { wholesale_price: row.newWholesale }),
      }));

      // Update products in chunks of 50
      for (let i = 0; i < updates.length; i += 50) {
        const chunk = updates.slice(i, i + 50);
        
        for (const update of chunk) {
          const { error: updateError } = await supabase
            .from("products")
            .update({ 
              price: update.price,
              ...(update.wholesale_price !== undefined && { wholesale_price: update.wholesale_price })
            })
            .eq("id", update.id);

          if (updateError) throw updateError;
        }
      }

      // Log audit entries in batch
      const auditEntries = previewData.map((row) => ({
        table_name: "products",
        action: "BULK_PRICE_UPDATE",
        record_id: row.product.id,
        old_values: {
          price: row.product.price,
          wholesale_price: row.product.wholesale_price,
          batch_id: batchId,
        },
        new_values: {
          price: row.newRetail,
          wholesale_price: row.newWholesale ?? row.product.wholesale_price,
          batch_id: batchId,
          retail_operation: retailOperation,
          retail_value: parseFloat(retailValue),
          wholesale_operation: updateWholesale ? wholesaleOperation : null,
          wholesale_value: updateWholesale && wholesaleValue ? parseFloat(wholesaleValue) : null,
        },
        user_id: user.id,
      }));

      // Insert audit logs in chunks
      for (let i = 0; i < auditEntries.length; i += 50) {
        const chunk = auditEntries.slice(i, i + 50);
        await supabase.from("audit_log").insert(chunk);
      }

      setLastBatchId(batchId);
      toast.success(`Updated prices for ${previewData.length} products`, {
        description: "Changes have been logged to audit trail.",
        action: {
          label: "Undo",
          onClick: () => handleRollback(batchId),
        },
      });
      setIsOpen(false);
      resetState();
      onComplete?.();
    } catch (err) {
      console.error("Error applying changes:", err);
      toast.error("Failed to apply price changes");
    } finally {
      setIsApplying(false);
    }
  };

  const handleRollback = async (batchId: string) => {
    setIsRollingBack(true);
    try {
      // Fetch audit entries for this batch
      const { data: auditData, error: auditError } = await supabase
        .from("audit_log")
        .select("record_id, old_values")
        .eq("action", "BULK_PRICE_UPDATE")
        .contains("old_values", { batch_id: batchId });

      if (auditError) throw auditError;
      if (!auditData || auditData.length === 0) {
        toast.error("No records found to rollback");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      // Rollback each product
      for (const entry of auditData) {
        const oldValues = entry.old_values as { price?: number; wholesale_price?: number | null };
        
        await supabase
          .from("products")
          .update({
            price: oldValues.price,
            wholesale_price: oldValues.wholesale_price,
          })
          .eq("id", entry.record_id);
      }

      // Log rollback to audit
      await supabase.from("audit_log").insert({
        table_name: "products",
        action: "BULK_PRICE_ROLLBACK",
        record_id: null,
        old_values: { batch_id: batchId },
        new_values: { rolled_back_count: auditData.length },
        user_id: user?.id,
      });

      toast.success(`Rolled back ${auditData.length} product prices`);
      onComplete?.();
    } catch (err) {
      console.error("Rollback error:", err);
      toast.error("Failed to rollback changes");
    } finally {
      setIsRollingBack(false);
    }
  };

  const resetState = () => {
    setStep("filter");
    setFilterVendor("");
    setFilterCategory("");
    setFilterType("");
    setFilterAvailability("");
    setFilterSizeContains("");
    setRetailOperation("increase_pct");
    setRetailValue("");
    setUpdateWholesale(false);
    setWholesaleOperation("increase_pct");
    setWholesaleValue("");
    setSetWholesaleEvenIfBlank(false);
    setPreviewData([]);
    setConfirmText("");
    setCurrentPage(0);
  };

  const totalRetailChange = previewData.reduce((sum, r) => sum + r.retailDelta, 0);
  const avgRetailPctChange = previewData.length > 0
    ? previewData.reduce((sum, r) => sum + r.retailPctChange, 0) / previewData.length
    : 0;

  const totalWholesaleChange = previewData.reduce((sum, r) => sum + (r.wholesaleDelta || 0), 0);

  // Pagination
  const totalPages = Math.ceil(previewData.length / PAGE_SIZE);
  const paginatedData = previewData.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        <Calculator className="h-4 w-4 mr-2" />
        Bulk Price Update
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) resetState();
        setIsOpen(open);
      }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Bulk Price Update
              {step === "preview" && (
                <Badge variant="secondary" className="ml-2">
                  {previewData.length} products
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {step === "filter" && "Filter products and set the price adjustment"}
              {step === "preview" && "Review changes before applying"}
              {step === "confirm" && "Type CONFIRM to apply changes"}
            </DialogDescription>
          </DialogHeader>

          {step === "filter" && (
            <div className="space-y-6">
              {/* Filters */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filter Products
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Vendor</Label>
                      <Select value={filterVendor} onValueChange={setFilterVendor}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Vendors" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Vendors</SelectItem>
                          {vendors.map((v) => (
                            <SelectItem key={v} value={v}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={filterCategory} onValueChange={setFilterCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Categories</SelectItem>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                          {tireTypes.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Availability</Label>
                      <Select value={filterAvailability} onValueChange={setFilterAvailability}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Availability" />
                        </SelectTrigger>
                        <SelectContent>
                          {availabilityOptions.map((a) => (
                            <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 col-span-2 md:col-span-1">
                      <Label>Size Contains</Label>
                      <Input
                        placeholder="e.g., 225, R17, 55"
                        value={filterSizeContains}
                        onChange={(e) => setFilterSizeContains(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">Filter by size pattern</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Retail Price Operation */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    Retail Price Adjustment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Operation</Label>
                      <Select value={retailOperation} onValueChange={(v) => setRetailOperation(v as PriceOperation)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {operationOptions.map((op) => (
                            <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Value {retailOperation.includes("pct") ? "(%)" : "($)"}
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={retailValue}
                        onChange={(e) => setRetailValue(e.target.value)}
                        placeholder={retailOperation.includes("pct") ? "e.g., 7" : "e.g., 20"}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Wholesale Option */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>Wholesale Price Adjustment (Optional)</span>
                    <Switch
                      checked={updateWholesale}
                      onCheckedChange={setUpdateWholesale}
                    />
                  </CardTitle>
                </CardHeader>
                {updateWholesale && (
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Operation</Label>
                        <Select value={wholesaleOperation} onValueChange={(v) => setWholesaleOperation(v as PriceOperation)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {operationOptions.map((op) => (
                              <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Value {wholesaleOperation.includes("pct") ? "(%)" : "($)"}
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={wholesaleValue}
                          onChange={(e) => setWholesaleValue(e.target.value)}
                          placeholder={wholesaleOperation.includes("pct") ? "e.g., 7" : "e.g., 15"}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="set-wholesale-blank"
                        checked={setWholesaleEvenIfBlank}
                        onCheckedChange={setSetWholesaleEvenIfBlank}
                      />
                      <Label htmlFor="set-wholesale-blank" className="text-sm">
                        Set wholesale price even if currently blank (defaults to 70% of retail)
                      </Label>
                    </div>
                  </CardContent>
                )}
              </Card>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={generatePreview} disabled={isLoading}>
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Preview Changes
                </Button>
              </div>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{previewData.length}</div>
                    <div className="text-sm text-muted-foreground">Products</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className={`text-2xl font-bold flex items-center gap-1 ${totalRetailChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {totalRetailChange >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                      ${Math.abs(totalRetailChange).toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Retail Δ</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className={`text-2xl font-bold ${avgRetailPctChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {avgRetailPctChange >= 0 ? "+" : ""}{avgRetailPctChange.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Avg Retail Change</div>
                  </CardContent>
                </Card>
                {updateWholesale && (
                  <Card>
                    <CardContent className="pt-4">
                      <div className={`text-2xl font-bold ${totalWholesaleChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                        ${Math.abs(totalWholesaleChange).toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Wholesale Δ</div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Preview Table */}
              <div className="border rounded-lg">
                <div className="max-h-[350px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead>Size</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Old Retail</TableHead>
                        <TableHead className="text-right">New Retail</TableHead>
                        <TableHead className="text-right">Δ</TableHead>
                        {updateWholesale && (
                          <>
                            <TableHead className="text-right">Old Wholesale</TableHead>
                            <TableHead className="text-right">New Wholesale</TableHead>
                          </>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.map((row) => (
                        <TableRow key={row.product.id}>
                          <TableCell className="font-medium">{row.product.size}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">{row.product.sku || "-"}</TableCell>
                          <TableCell>{row.product.vendor || "-"}</TableCell>
                          <TableCell className="text-xs">{row.product.category_name || "-"}</TableCell>
                          <TableCell className="text-right">${row.product.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">${row.newRetail.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={row.retailDelta >= 0 ? "default" : "destructive"} className={row.retailDelta >= 0 ? "bg-green-600" : ""}>
                              {row.retailDelta >= 0 ? "+" : ""}{row.retailPctChange.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          {updateWholesale && (
                            <>
                              <TableCell className="text-right text-muted-foreground">
                                {row.product.wholesale_price ? `$${row.product.wholesale_price.toFixed(2)}` : "-"}
                              </TableCell>
                              <TableCell className="text-right">
                                {row.newWholesale ? `$${row.newWholesale.toFixed(2)}` : "-"}
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {currentPage * PAGE_SIZE + 1}-{Math.min((currentPage + 1) * PAGE_SIZE, previewData.length)} of {previewData.length}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm py-2 px-3">
                      Page {currentPage + 1} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={currentPage >= totalPages - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep("filter")}>
                  Back
                </Button>
                <Button onClick={() => setStep("confirm")} variant="destructive">
                  Proceed to Confirm
                </Button>
              </div>
            </div>
          )}

          {step === "confirm" && (
            <div className="space-y-6">
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <h3 className="font-semibold text-destructive mb-2">⚠️ This action can be undone</h3>
                <p className="text-sm text-muted-foreground">
                  You are about to update prices for <strong>{previewData.length} products</strong>.
                  All changes will be logged to the audit trail. You can undo this batch after applying.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Type "CONFIRM" to proceed</Label>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  placeholder="Type CONFIRM"
                  className="font-mono"
                />
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep("preview")}>
                  Back
                </Button>
                <Button
                  onClick={applyChanges}
                  disabled={confirmText !== "CONFIRM" || isApplying}
                  variant="destructive"
                >
                  {isApplying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Check className="h-4 w-4 mr-2" />
                  Apply Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rollback button for last batch */}
      {lastBatchId && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleRollback(lastBatchId)}
          disabled={isRollingBack}
          className="ml-2"
        >
          {isRollingBack ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <RotateCcw className="h-4 w-4 mr-1" />
          )}
          Undo Last
        </Button>
      )}
    </>
  );
}
