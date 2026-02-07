import { useState, useEffect } from "react";
import { Loader2, Plus, Search, Pencil, Trash2, GripVertical, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Addon {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  is_taxable: boolean | null;
  is_active: boolean | null;
  sort_order: number | null;
  created_at: string;
}

const categoryOptions = [
  { value: "installation", label: "Installation" },
  { value: "protection", label: "Protection" },
  { value: "convenience", label: "Convenience" },
  { value: "warranty", label: "Warranty" },
  { value: "general", label: "General" },
];

export function AdminAddons() {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "general",
    is_taxable: true,
    is_active: true,
    sort_order: 0,
  });

  useEffect(() => {
    fetchAddons();
  }, []);

  const fetchAddons = async () => {
    try {
      const { data, error } = await supabase
        .from("checkout_addons")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setAddons(data || []);
    } catch (err) {
      console.error("Error fetching addons:", err);
      toast.error("Failed to load add-ons");
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (addon: Addon) => {
    setEditingAddon(addon);
    setFormData({
      name: addon.name,
      description: addon.description || "",
      price: addon.price.toString(),
      category: addon.category || "general",
      is_taxable: addon.is_taxable ?? true,
      is_active: addon.is_active ?? true,
      sort_order: addon.sort_order || 0,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingAddon(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "general",
      is_taxable: true,
      is_active: true,
      sort_order: addons.length,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      toast.error("Name and price are required");
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        category: formData.category,
        is_taxable: formData.is_taxable,
        is_active: formData.is_active,
        sort_order: formData.sort_order,
      };

      if (editingAddon) {
        const { error } = await supabase
          .from("checkout_addons")
          .update(data)
          .eq("id", editingAddon.id);
        if (error) throw error;
        toast.success("Add-on updated");
      } else {
        const { error } = await supabase.from("checkout_addons").insert(data);
        if (error) throw error;
        toast.success("Add-on created");
      }

      setIsDialogOpen(false);
      fetchAddons();
    } catch (err) {
      console.error("Error saving addon:", err);
      toast.error("Failed to save add-on");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("checkout_addons").delete().eq("id", id);
      if (error) throw error;
      toast.success("Add-on deleted");
      fetchAddons();
    } catch (err) {
      toast.error("Failed to delete add-on");
    }
  };

  const toggleActive = async (addon: Addon) => {
    try {
      const { error } = await supabase
        .from("checkout_addons")
        .update({ is_active: !addon.is_active })
        .eq("id", addon.id);
      if (error) throw error;
      fetchAddons();
    } catch (err) {
      toast.error("Failed to update add-on");
    }
  };

  const filteredAddons = addons.filter((addon) =>
    addon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (addon.description || "").toLowerCase().includes(searchQuery.toLowerCase())
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search add-ons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="hero" onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          Add New
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bento-card">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{addons.length}</p>
            <p className="text-sm text-muted-foreground">Total Add-ons</p>
          </CardContent>
        </Card>
        <Card className="bento-card">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-green-500">
              {addons.filter(a => a.is_active).length}
            </p>
            <p className="text-sm text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card className="bento-card">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-primary">
              {addons.filter(a => a.is_taxable).length}
            </p>
            <p className="text-sm text-muted-foreground">Taxable</p>
          </CardContent>
        </Card>
        <Card className="bento-card">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">
              {categoryOptions.filter(c => addons.some(a => a.category === c.value)).length}
            </p>
            <p className="text-sm text-muted-foreground">Categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Add-ons Table */}
      <Card className="bento-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Checkout Add-ons ({filteredAddons.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Taxable</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAddons.map((addon, index) => (
                  <TableRow key={addon.id}>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <GripVertical className="h-4 w-4" />
                        {addon.sort_order ?? index}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{addon.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {addon.description || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {addon.category || "general"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">${addon.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={addon.is_taxable ? "default" : "secondary"}>
                        {addon.is_taxable ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={addon.is_active ?? true}
                        onCheckedChange={() => toggleActive(addon)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(addon)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Add-on?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{addon.name}". This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(addon.id)} className="bg-destructive text-destructive-foreground">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAddon ? "Edit Add-on" : "Create Add-on"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Tire Disposal Fee"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description..."
                className="mt-1.5"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price ($) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_taxable"
                  checked={formData.is_taxable}
                  onCheckedChange={(v) => setFormData({ ...formData, is_taxable: v })}
                />
                <Label htmlFor="is_taxable">Taxable (GST)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="hero" className="flex-1" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editingAddon ? "Update Add-on" : "Create Add-on"}
              </Button>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}