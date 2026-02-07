import { useState, useEffect, useCallback, useRef } from "react";
import { 
  Loader2, Package, Search, AlertTriangle, Plus, Minus, 
  History, Download, Upload, Filter, RefreshCw, Trash2, FileUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Product {
  id: string;
  sku: string | null;
  size: string;
  description: string | null;
  vendor: string | null;
  type: string;
  price: number;
  availability: string | null;
}

interface InventoryItem {
  id: string;
  product_id: string;
  qty_on_hand: number;
  qty_reserved: number;
  reorder_level: number | null;
  updated_at: string;
  product?: Product;
}

interface InventoryMovement {
  id: string;
  product_id: string;
  delta_qty: number;
  reason: string;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  product?: Product;
}

export function AdminInventory() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [filterVendor, setFilterVendor] = useState<string>("all");

  // Adjustment dialog
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [adjustForm, setAdjustForm] = useState({ delta: 0, reason: "", notes: "" });

  // Receive stock dialog
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false);
  const [receiveProductId, setReceiveProductId] = useState<string>("");
  const [receiveForm, setReceiveForm] = useState({ quantity: 0, notes: "" });

  // Write-off dialog
  const [isWriteOffDialogOpen, setIsWriteOffDialogOpen] = useState(false);
  const [writeOffItem, setWriteOffItem] = useState<InventoryItem | null>(null);
  const [writeOffForm, setWriteOffForm] = useState({ quantity: 0, reason: "", notes: "" });

  // CSV Import
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    
    // Fetch products
    const { data: productsData } = await supabase
      .from("products")
      .select("id, sku, size, description, vendor, type, price, availability")
      .eq("is_active", true)
      .order("size");
    
    setProducts(productsData || []);

    // Fetch inventory
    const { data: inventoryData } = await supabase
      .from("inventory")
      .select("*")
      .order("updated_at", { ascending: false });

    // Merge with product data
    const inventoryWithProducts = (inventoryData || []).map(inv => ({
      ...inv,
      product: productsData?.find(p => p.id === inv.product_id)
    }));

    setInventory(inventoryWithProducts);

    // Fetch recent movements
    const { data: movementsData } = await supabase
      .from("inventory_movements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    const movementsWithProducts = (movementsData || []).map(mov => ({
      ...mov,
      product: productsData?.find(p => p.id === mov.product_id)
    }));

    setMovements(movementsWithProducts);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Initialize inventory for products that don't have it
  const initializeInventory = async () => {
    const existingProductIds = inventory.map(i => i.product_id);
    const missingProducts = products.filter(p => !existingProductIds.includes(p.id));
    
    if (missingProducts.length === 0) {
      toast({ title: "Info", description: "All products already have inventory records" });
      return;
    }

    const newInventory = missingProducts.map(p => ({
      product_id: p.id,
      qty_on_hand: 0,
      qty_reserved: 0,
      reorder_level: 5
    }));

    const { error } = await supabase.from("inventory").insert(newInventory);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Created ${newInventory.length} inventory records` });
      fetchData();
    }
  };

  // Filter inventory
  const filteredInventory = inventory.filter(item => {
    if (!item.product) return false;
    
    const matchesSearch = 
      item.product.size.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product.vendor?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLowStock = !filterLowStock || 
      (item.reorder_level !== null && (item.qty_on_hand - item.qty_reserved) <= item.reorder_level);
    
    const matchesVendor = filterVendor === "all" || item.product.vendor === filterVendor;
    
    return matchesSearch && matchesLowStock && matchesVendor;
  });

  // Get unique vendors
  const vendors = [...new Set(products.map(p => p.vendor).filter(Boolean))];

  // Count low stock items
  const lowStockCount = inventory.filter(i => 
    i.reorder_level !== null && (i.qty_on_hand - i.qty_reserved) <= i.reorder_level
  ).length;

  // Open adjustment dialog
  const openAdjust = (item: InventoryItem) => {
    setAdjustingItem(item);
    setAdjustForm({ delta: 0, reason: "", notes: "" });
    setIsAdjustDialogOpen(true);
  };

  // Handle stock adjustment
  const handleAdjust = async () => {
    if (!adjustingItem || adjustForm.delta === 0 || !adjustForm.reason) {
      toast({ title: "Error", description: "Enter quantity and reason", variant: "destructive" });
      return;
    }

    const newQty = adjustingItem.qty_on_hand + adjustForm.delta;
    if (newQty < 0) {
      toast({ title: "Error", description: "Cannot have negative stock", variant: "destructive" });
      return;
    }

    // Update inventory
    const { error: invError } = await supabase
      .from("inventory")
      .update({ qty_on_hand: newQty })
      .eq("id", adjustingItem.id);

    if (invError) {
      toast({ title: "Error", description: invError.message, variant: "destructive" });
      return;
    }

    // Log movement
    const { error: movError } = await supabase.from("inventory_movements").insert({
      product_id: adjustingItem.product_id,
      delta_qty: adjustForm.delta,
      reason: adjustForm.reason,
      reference_type: "adjustment",
      notes: adjustForm.notes || null,
      created_by: user?.id
    });

    if (movError) {
      console.error("Failed to log movement:", movError);
    }

    toast({ title: "Adjusted", description: `Stock updated by ${adjustForm.delta > 0 ? '+' : ''}${adjustForm.delta}` });
    setIsAdjustDialogOpen(false);
    fetchData();
  };

  // Handle receive stock
  const handleReceive = async () => {
    if (!receiveProductId || receiveForm.quantity <= 0) {
      toast({ title: "Error", description: "Select product and enter quantity", variant: "destructive" });
      return;
    }

    // Check if inventory record exists
    const existingInv = inventory.find(i => i.product_id === receiveProductId);
    
    if (existingInv) {
      // Update existing
      const { error } = await supabase
        .from("inventory")
        .update({ qty_on_hand: existingInv.qty_on_hand + receiveForm.quantity })
        .eq("id", existingInv.id);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
    } else {
      // Create new
      const { error } = await supabase.from("inventory").insert({
        product_id: receiveProductId,
        qty_on_hand: receiveForm.quantity,
        qty_reserved: 0,
        reorder_level: 5
      });

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
    }

    // Log movement
    await supabase.from("inventory_movements").insert({
      product_id: receiveProductId,
      delta_qty: receiveForm.quantity,
      reason: "Stock received",
      reference_type: "manual",
      notes: receiveForm.notes || null,
      created_by: user?.id
    });

    toast({ title: "Received", description: `Added ${receiveForm.quantity} units` });
    setIsReceiveDialogOpen(false);
    setReceiveForm({ quantity: 0, notes: "" });
    setReceiveProductId("");
    fetchData();
  };

  // Export CSV
  const handleExport = () => {
    const headers = ["SKU", "Size", "Vendor", "Type", "Qty On Hand", "Qty Reserved", "Available", "Reorder Level"];
    const rows = filteredInventory.map(i => [
      i.product?.sku || "",
      i.product?.size || "",
      i.product?.vendor || "",
      i.product?.type || "",
      i.qty_on_hand,
      i.qty_reserved,
      i.qty_on_hand - i.qty_reserved,
      i.reorder_level || ""
    ]);

    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Write-off stock
  const openWriteOff = (item: InventoryItem) => {
    setWriteOffItem(item);
    setWriteOffForm({ quantity: 0, reason: "", notes: "" });
    setIsWriteOffDialogOpen(true);
  };

  const handleWriteOff = async () => {
    if (!writeOffItem || writeOffForm.quantity <= 0 || !writeOffForm.reason) {
      toast({ title: "Error", description: "Enter quantity and reason", variant: "destructive" });
      return;
    }

    const available = writeOffItem.qty_on_hand - writeOffItem.qty_reserved;
    if (writeOffForm.quantity > available) {
      toast({ title: "Error", description: "Cannot write off more than available stock", variant: "destructive" });
      return;
    }

    const newQty = writeOffItem.qty_on_hand - writeOffForm.quantity;

    const { error: invError } = await supabase
      .from("inventory")
      .update({ qty_on_hand: newQty })
      .eq("id", writeOffItem.id);

    if (invError) {
      toast({ title: "Error", description: invError.message, variant: "destructive" });
      return;
    }

    await supabase.from("inventory_movements").insert({
      product_id: writeOffItem.product_id,
      delta_qty: -writeOffForm.quantity,
      reason: writeOffForm.reason,
      reference_type: "write_off",
      notes: writeOffForm.notes || null,
      created_by: user?.id
    });

    toast({ title: "Write-off Complete", description: `Removed ${writeOffForm.quantity} units` });
    setIsWriteOffDialogOpen(false);
    fetchData();
  };

  // CSV Import
  const handleImportCSV = async () => {
    if (!importFile) return;
    setIsImporting(true);

    try {
      const text = await importFile.text();
      const lines = text.split("\n").filter(l => l.trim());
      const headers = lines[0].toLowerCase().split(",").map(h => h.trim());
      
      const skuIdx = headers.findIndex(h => h.includes("sku"));
      const qtyIdx = headers.findIndex(h => h.includes("qty") || h.includes("on_hand") || h.includes("quantity"));
      const reorderIdx = headers.findIndex(h => h.includes("reorder"));

      if (skuIdx === -1 || qtyIdx === -1) {
        throw new Error("CSV must have SKU and Qty columns");
      }

      let updated = 0;
      let created = 0;

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map(c => c.trim());
        const sku = cols[skuIdx];
        const qty = parseInt(cols[qtyIdx]) || 0;
        const reorder = reorderIdx >= 0 ? parseInt(cols[reorderIdx]) || null : null;

        if (!sku) continue;

        // Find product by SKU
        const product = products.find(p => p.sku === sku);
        if (!product) continue;

        const existingInv = inventory.find(i => i.product_id === product.id);
        
        if (existingInv) {
          const delta = qty - existingInv.qty_on_hand;
          if (delta !== 0) {
            await supabase.from("inventory").update({ 
              qty_on_hand: qty,
              ...(reorder !== null && { reorder_level: reorder })
            }).eq("id", existingInv.id);

            await supabase.from("inventory_movements").insert({
              product_id: product.id,
              delta_qty: delta,
              reason: "CSV Import adjustment",
              reference_type: "import",
              notes: `Imported from CSV`,
              created_by: user?.id
            });
            updated++;
          }
        } else {
          await supabase.from("inventory").insert({
            product_id: product.id,
            qty_on_hand: qty,
            qty_reserved: 0,
            reorder_level: reorder ?? 5
          });
          created++;
        }
      }

      toast({ title: "Import Complete", description: `Updated ${updated}, Created ${created} records` });
      setIsImportDialogOpen(false);
      setImportFile(null);
      fetchData();
    } catch (err: any) {
      toast({ title: "Import Error", description: err.message, variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  const getAvailability = (item: InventoryItem) => {
    const available = item.qty_on_hand - item.qty_reserved;
    if (available > 0) return { label: "In Stock", variant: "default" as const };
    return { label: item.product?.availability || "On Request", variant: "secondary" as const };
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <>
      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory" className="gap-2">
            <Package className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="movements" className="gap-2">
            <History className="h-4 w-4" />
            Movements
          </TabsTrigger>
          <TabsTrigger value="low-stock" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Low Stock ({lowStockCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <Card className="bento-card">
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Inventory ({filteredInventory.length})
              </CardTitle>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={initializeInventory}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Init Missing
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsImportDialogOpen(true)}>
                  <FileUp className="h-4 w-4 mr-1" />
                  Import CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsReceiveDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Receive Stock
                </Button>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by SKU, size, vendor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterVendor} onValueChange={setFilterVendor}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Vendors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Vendors</SelectItem>
                    {vendors.map(v => (
                      <SelectItem key={v} value={v!}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant={filterLowStock ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setFilterLowStock(!filterLowStock)}
                >
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Low Stock Only
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead className="text-right">On Hand</TableHead>
                      <TableHead className="text-right">Reserved</TableHead>
                      <TableHead className="text-right">Available</TableHead>
                      <TableHead className="text-right">Reorder</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory.map((item) => {
                      const available = item.qty_on_hand - item.qty_reserved;
                      const isLow = item.reorder_level !== null && available <= item.reorder_level;
                      const status = getAvailability(item);
                      
                      return (
                        <TableRow key={item.id} className={isLow ? "bg-destructive/5" : ""}>
                          <TableCell className="font-mono text-sm">{item.product?.sku || "-"}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.product?.size}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {item.product?.description}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{item.product?.vendor || "-"}</TableCell>
                          <TableCell className="text-right font-medium">{item.qty_on_hand}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{item.qty_reserved}</TableCell>
                          <TableCell className="text-right font-bold">{available}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{item.reorder_level ?? "-"}</TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => openAdjust(item)}>
                              Adjust
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredInventory.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                          No inventory records found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements">
          <Card className="bento-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Movements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Change</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((mov) => (
                    <TableRow key={mov.id}>
                      <TableCell className="text-sm">
                        {new Date(mov.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>{mov.product?.size || mov.product_id}</TableCell>
                      <TableCell className="text-right font-mono">
                        <span className={mov.delta_qty > 0 ? "text-green-600" : "text-red-600"}>
                          {mov.delta_qty > 0 ? "+" : ""}{mov.delta_qty}
                        </span>
                      </TableCell>
                      <TableCell>{mov.reason}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{mov.reference_type || "manual"}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                        {mov.notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low-stock">
          <Card className="bento-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Low Stock Items ({lowStockCount})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead className="text-right">Reorder Level</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory
                    .filter(i => i.reorder_level !== null && (i.qty_on_hand - i.qty_reserved) <= i.reorder_level)
                    .map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <p className="font-medium">{item.product?.size}</p>
                          <p className="text-xs text-muted-foreground">{item.product?.sku}</p>
                        </TableCell>
                        <TableCell>{item.product?.vendor}</TableCell>
                        <TableCell className="text-right font-bold text-destructive">
                          {item.qty_on_hand - item.qty_reserved}
                        </TableCell>
                        <TableCell className="text-right">{item.reorder_level}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => openAdjust(item)}>
                            <Plus className="h-3 w-3 mr-1" />
                            Restock
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Adjust Stock Dialog */}
      <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
          </DialogHeader>
          {adjustingItem && (
            <div className="space-y-4">
              <div className="p-3 bg-secondary/50 rounded-lg">
                <p className="font-medium">{adjustingItem.product?.size}</p>
                <p className="text-sm text-muted-foreground">Current: {adjustingItem.qty_on_hand} on hand, {adjustingItem.qty_reserved} reserved</p>
              </div>
              <div>
                <Label>Adjustment (+/-)</Label>
                <div className="flex gap-2 mt-1">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setAdjustForm({ ...adjustForm, delta: adjustForm.delta - 1 })}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={adjustForm.delta}
                    onChange={(e) => setAdjustForm({ ...adjustForm, delta: parseInt(e.target.value) || 0 })}
                    className="text-center"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setAdjustForm({ ...adjustForm, delta: adjustForm.delta + 1 })}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  New quantity: {adjustingItem.qty_on_hand + adjustForm.delta}
                </p>
              </div>
              <div>
                <Label>Reason *</Label>
                <Select value={adjustForm.reason} onValueChange={(v) => setAdjustForm({ ...adjustForm, reason: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Stock count correction">Stock count correction</SelectItem>
                    <SelectItem value="Damaged/Defective">Damaged/Defective</SelectItem>
                    <SelectItem value="Returned to supplier">Returned to supplier</SelectItem>
                    <SelectItem value="Stock received">Stock received</SelectItem>
                    <SelectItem value="Customer return">Customer return</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notes (optional)</Label>
                <Textarea
                  value={adjustForm.notes}
                  onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                  rows={2}
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdjustDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAdjust} disabled={adjustForm.delta === 0 || !adjustForm.reason}>
              Apply Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receive Stock Dialog */}
      <Dialog open={isReceiveDialogOpen} onOpenChange={setIsReceiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Receive Stock</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Product</Label>
              <Select value={receiveProductId} onValueChange={setReceiveProductId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.size} - {p.vendor} ({p.sku || "no SKU"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                min="1"
                value={receiveForm.quantity}
                onChange={(e) => setReceiveForm({ ...receiveForm, quantity: parseInt(e.target.value) || 0 })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                value={receiveForm.notes}
                onChange={(e) => setReceiveForm({ ...receiveForm, notes: e.target.value })}
                placeholder="PO number, supplier info, etc."
                rows={2}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReceiveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleReceive} disabled={!receiveProductId || receiveForm.quantity <= 0}>
              Receive Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
