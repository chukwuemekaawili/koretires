import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Upload,
  Download,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Package,
  Loader2,
} from "lucide-react";
import { BulkPriceUpdate } from "./BulkPriceUpdate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Product {
  id: string;
  size: string;
  vendor: string | null;
  description: string | null;
  type: string;
  price: number;
  wholesale_price: number | null;
  availability: string | null;
  is_active: boolean | null;
  features: string[] | null;
  sku: string | null;
  quantity: number | null;
  image_url: string | null;
  created_at: string;
}

const tireTypes = [
  { value: "all_season", label: "All Season" },
  { value: "winter", label: "Winter" },
  { value: "all_weather", label: "All Weather" },
  { value: "summer", label: "Summer" },
];

const availabilityOptions = [
  "In Stock",
  "Available within 24 hours",
  "Available within 48 hours",
  "Special Order",
  "Out of Stock",
];

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    size: "",
    vendor: "",
    description: "",
    type: "all_season",
    price: "",
    wholesale_price: "",
    availability: "In Stock",
    is_active: true,
    features: "",
    sku: "",
    quantity: "",
    image_url: "",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      // Use admin RPC to get products with wholesale_price (only admins can call this)
      const { data, error } = await supabase.rpc("get_products_admin");

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error("Error fetching products:", err);
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: data.publicUrl });
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Error uploading image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const productData = {
        size: formData.size,
        vendor: formData.vendor || null,
        description: formData.description || null,
        type: formData.type as any,
        price: parseFloat(formData.price),
        wholesale_price: formData.wholesale_price ? parseFloat(formData.wholesale_price) : null,
        availability: formData.availability,
        is_active: formData.is_active,
        features: formData.features ? formData.features.split(",").map((f) => f.trim()) : null,
        sku: formData.sku || null,
        quantity: formData.quantity ? parseInt(formData.quantity) : null,
        image_url: formData.image_url || null,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id);

        if (error) throw error;
        toast.success("Product updated");
      } else {
        const { error } = await supabase.from("products").insert(productData);

        if (error) throw error;
        toast.success("Product created");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (err) {
      console.error("Error saving product:", err);
      toast.error("Failed to save product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      size: product.size,
      vendor: product.vendor || "",
      description: product.description || "",
      type: product.type,
      price: product.price.toString(),
      wholesale_price: product.wholesale_price?.toString() || "",
      availability: product.availability || "In Stock",
      is_active: product.is_active ?? true,
      features: product.features?.join(", ") || "",
      sku: product.sku || "",
      quantity: product.quantity?.toString() || "",
      image_url: product.image_url || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      toast.success("Product deleted");
      fetchProducts();
    } catch (err) {
      console.error("Error deleting product:", err);
      toast.error("Failed to delete product");
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      size: "",
      vendor: "",
      description: "",
      type: "all_season",
      price: "",
      wholesale_price: "",
      availability: "In Stock",
      is_active: true,
      features: "",
      sku: "",
      quantity: "",
      image_url: "",
    });
  };

  const handleExport = () => {
    const csvContent = [
      ["Size", "Vendor", "Type", "Price", "Wholesale Price", "Availability", "SKU", "Quantity", "Features"].join(","),
      ...products.map((p) =>
        [
          p.size,
          p.vendor || "",
          p.type,
          p.price,
          p.wholesale_price || "",
          p.availability || "",
          p.sku || "",
          p.quantity || "",
          p.features?.join("; ") || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `products-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split("\n").slice(1); // Skip header
        const products = lines
          .filter((line) => line.trim())
          .map((line) => {
            const [size, vendor, type, price, wholesale_price, availability, sku, quantity, features] =
              line.split(",").map((s) => s.trim());
            return {
              size,
              vendor: vendor || null,
              type: type as any || "all_season",
              price: parseFloat(price) || 0,
              wholesale_price: wholesale_price ? parseFloat(wholesale_price) : null,
              availability: availability || "In Stock",
              sku: sku || null,
              quantity: quantity ? parseInt(quantity) : null,
              features: features ? features.split(";").map((f) => f.trim()) : null,
              is_active: true,
            };
          });

        const { error } = await supabase.from("products").insert(products);
        if (error) throw error;

        toast.success(`Imported ${products.length} products`);
        setShowImportDialog(false);
        fetchProducts();
      } catch (err) {
        console.error("Import error:", err);
        toast.error("Failed to import products");
      }
    };
    reader.readAsText(file);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.size.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.vendor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <BulkPriceUpdate onComplete={fetchProducts} />
          <Button variant="outline" onClick={() => setShowImportDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="size">Size *</Label>
                    <Input
                      id="size"
                      value={formData.size}
                      onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                      placeholder="e.g., 225/65R17"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vendor">Vendor/Brand</Label>
                    <Input
                      id="vendor"
                      value={formData.vendor}
                      onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                      placeholder="e.g., Michelin"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">Product Image</Label>
                  <div className="flex items-center gap-4">
                    {formData.image_url && (
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="h-16 w-16 object-cover rounded-md border"
                      />
                    )}
                    <div className="flex-1">
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                      />
                      {isUploading && <p className="text-xs text-muted-foreground mt-1">Uploading...</p>}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tireTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="availability">Availability</Label>
                    <Select
                      value={formData.availability}
                      onValueChange={(value) => setFormData({ ...formData, availability: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availabilityOptions.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wholesale_price">Wholesale Price</Label>
                    <Input
                      id="wholesale_price"
                      type="number"
                      step="0.01"
                      value={formData.wholesale_price}
                      onChange={(e) => setFormData({ ...formData, wholesale_price: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span>Active</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="features">Features (comma separated)</Label>
                  <Input
                    id="features"
                    value={formData.features}
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                    placeholder="e.g., All-season traction, Long tread life, Quiet ride"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingProduct ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Products from CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file with columns: Size, Vendor, Type, Price, Wholesale Price, Availability, SKU, Quantity, Features
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleImport}
            />
            <div className="text-sm text-muted-foreground">
              <p>Expected format:</p>
              <code className="block bg-muted p-2 rounded text-xs mt-2">
                Size,Vendor,Type,Price,Wholesale Price,Availability,SKU,Quantity,Features
                <br />
                225/65R17,Kore,all_season,129.99,99.99,In Stock,KT-001,100,All-season; Long life
              </code>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Products Table */}
      <Card className="bento-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Products ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Image</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Wholesale</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.size}
                          className="h-10 w-10 object-cover rounded-md"
                        />
                      ) : (
                        <div className="h-10 w-10 bg-secondary rounded-md flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{product.size}</TableCell>
                    <TableCell>{product.vendor || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {tireTypes.find((t) => t.value === product.type)?.label || product.type}
                      </Badge>
                    </TableCell>
                    <TableCell>${product.price.toFixed(2)}</TableCell>
                    <TableCell>
                      {product.wholesale_price ? `$${product.wholesale_price.toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={product.availability === "In Stock" ? "default" : "secondary"}
                        className={product.availability === "In Stock" ? "bg-success" : ""}
                      >
                        {product.availability || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>{product.quantity ?? "-"}</TableCell>
                    <TableCell>
                      {product.is_active ? (
                        <Badge variant="default" className="bg-success">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(product)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(product.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card >
    </div >
  );
}
