import { useState, useEffect } from "react";
import { Loader2, Plus, Trash2, Package, Tag, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Bundle {
    id: string;
    name: string;
    description: string | null;
    price: number;
    status: string;
    image_url: string | null;
    created_at: string;
    bundle_items: BundleItem[];
}

interface BundleItem {
    id: string;
    bundle_id: string;
    item_type: 'product' | 'service';
    product_id: string | null;
    service_catalog_id: string | null;
    quantity: number;
    products?: { vendor: string, size: string, description: string };
    service_catalog?: { name: string };
}

export function AdminBundles() {
    const { toast } = useToast();
    const [bundles, setBundles] = useState<Bundle[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Form State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        status: 'active',
    });

    // Selected Items for New Bundle
    const [selectedItems, setSelectedItems] = useState<{
        item_type: 'product' | 'service';
        id: string;
        quantity: number;
    }[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [bundlesRes, productsRes, servicesRes] = await Promise.all([
                supabase.from('bundles').select(`
          *,
          bundle_items (
            *,
            products (vendor, size, description),
            service_catalog (name)
          )
        `).order('created_at', { ascending: false }),
                supabase.from('products').select('id, size, vendor, description'),
                supabase.from('service_catalog').select('id, name')
            ]);

            if (bundlesRes.error) throw bundlesRes.error;

            setBundles(bundlesRes.data || []);
            setProducts(productsRes.data || []);
            setServices(servicesRes.data || []);
        } catch (error) {
            console.error('Error fetching bundles:', error);
            toast({
                title: "Error",
                description: "Failed to load bundles.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateBundle = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedItems.length === 0) {
            toast({ title: "Error", description: "Please add at least one item to the bundle.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Create Bundle
            const { data: bundleData, error: bundleError } = await supabase
                .from('bundles')
                .insert({
                    name: formData.name,
                    description: formData.description,
                    price: parseFloat(formData.price),
                    status: formData.status
                })
                .select()
                .single();

            if (bundleError) throw bundleError;

            // 2. Create Bundle Items
            const itemsToInsert = selectedItems.map(item => ({
                bundle_id: bundleData.id,
                item_type: item.item_type,
                product_id: item.item_type === 'product' ? item.id : null,
                service_catalog_id: item.item_type === 'service' ? item.id : null,
                quantity: item.quantity
            }));

            const { error: itemsError } = await supabase
                .from('bundle_items')
                .insert(itemsToInsert);

            if (itemsError) throw itemsError;

            toast({
                title: "Bundle Created",
                description: "The bundle deal has been successfully published.",
            });
            setIsDialogOpen(false);

            // Reset form
            setFormData({ name: '', description: '', price: '', status: 'active' });
            setSelectedItems([]);

            // Refresh
            fetchData();
        } catch (error: any) {
            console.error('Error creating bundle:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to create bundle.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateBundleStatus = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('bundles')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            setBundles(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
            toast({ title: "Updated", description: "Bundle status updated." });
        } catch (error) {
            console.error('Error updating status:', error);
            toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
        }
    };

    const deleteBundle = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this bundle? This will also remove its items.")) return;

        try {
            const { error } = await supabase
                .from('bundles')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setBundles(prev => prev.filter(b => b.id !== id));
            toast({ title: "Deleted", description: "Bundle deal deleted." });
        } catch (error) {
            console.error('Error deleting bundle:', error);
            toast({ title: "Error", description: "Failed to delete bundle.", variant: "destructive" });
        }
    };

    const addItemToForm = (type: 'product' | 'service', id: string) => {
        if (!id) return;
        if (selectedItems.some(item => item.id === id)) {
            // Increase quantity
            setSelectedItems(prev => prev.map(i => i.id === id ? { ...i, quantity: i.quantity + 1 } : i));
        } else {
            setSelectedItems([...selectedItems, { item_type: type, id, quantity: 1 }]);
        }
    };

    const removeFormItem = (id: string) => {
        setSelectedItems(prev => prev.filter(i => i.id !== id));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Bundle Deals</h2>
                    <p className="text-muted-foreground">Create special packages of tires and services.</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Bundle
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create New Bundle Deal</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateBundle} className="space-y-6">

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2 sm:col-span-1">
                                    <Label htmlFor="name">Bundle Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Winter Ready Package"
                                        required
                                    />
                                </div>
                                <div className="space-y-2 col-span-2 sm:col-span-1">
                                    <Label htmlFor="price">Total Bundle Price ($)</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Includes 4 winter tires plus at-home installation."
                                />
                            </div>

                            <div className="space-y-4 border border-border p-4 rounded-xl bg-muted/20">
                                <h4 className="font-medium">Items in this Bundle</h4>

                                {selectedItems.length > 0 ? (
                                    <ul className="space-y-2 mb-4">
                                        {selectedItems.map((item, idx) => {
                                            const name = item.item_type === 'product'
                                                ? products.find(p => p.id === item.id)?.size + ' ' + products.find(p => p.id === item.id)?.vendor
                                                : services.find(s => s.id === item.id)?.name;

                                            return (
                                                <li key={idx} className="flex items-center justify-between text-sm bg-background p-2 rounded border border-border">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary">{item.item_type}</Badge>
                                                        <span>{name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="font-medium text-primary">Qty: {item.quantity}</span>
                                                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeFormItem(item.id)}>
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic mb-4">No items added yet. Search below to add.</p>
                                )}

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs mb-1 block">Add Tire to Bundle</Label>
                                        <Select onValueChange={(val) => addItemToForm('product', val)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a tire..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {products.map(p => (
                                                    <SelectItem key={p.id} value={p.id}>
                                                        {p.size} - {p.vendor}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="text-xs mb-1 block">Add Service to Bundle</Label>
                                        <Select onValueChange={(val) => addItemToForm('service', val)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a service..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {services.map(s => (
                                                    <SelectItem key={s.id} value={s.id}>
                                                        {s.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(val) => setFormData({ ...formData, status: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Publish Bundle
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {bundles.length === 0 ? (
                    <div className="col-span-full p-8 text-center text-muted-foreground bg-card rounded-xl border border-border">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>No bundle deals created yet.</p>
                    </div>
                ) : (
                    bundles.map((bundle) => (
                        <div key={bundle.id} className="bg-card rounded-xl border border-border overflow-hidden flex flex-col">
                            <div className="p-5 border-b border-border bg-muted/10">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg">{bundle.name}</h3>
                                    <Badge
                                        variant="outline"
                                        className={bundle.status === 'active' ? 'bg-green-500/10 text-green-500' : 'text-muted-foreground'}
                                    >
                                        {bundle.status}
                                    </Badge>
                                </div>
                                <div className="text-2xl font-bold text-primary mb-2">${bundle.price}</div>
                                {bundle.description && <p className="text-sm text-muted-foreground">{bundle.description}</p>}
                                <p className="text-xs text-muted-foreground mt-3">Created {format(new Date(bundle.created_at), 'MMM d, yyyy')}</p>
                            </div>

                            <div className="p-5 flex-1">
                                <h4 className="text-sm font-semibold mb-3 uppercase tracking-wider text-muted-foreground">Includes</h4>
                                <ul className="space-y-3">
                                    {bundle.bundle_items.map(item => (
                                        <li key={item.id} className="flex gap-3 text-sm">
                                            <div className="bg-secondary p-1.5 rounded h-fit">
                                                {item.item_type === 'product' ? <Package className="w-4 h-4 text-primary" /> : <Tag className="w-4 h-4 text-amber-500" />}
                                            </div>
                                            <div>
                                                {item.item_type === 'product' ? (
                                                    <>
                                                        <p className="font-medium text-foreground">{item.quantity}× {item.products?.size}</p>
                                                        <p className="text-xs text-muted-foreground">{item.products?.vendor}</p>
                                                    </>
                                                ) : (
                                                    <p className="font-medium text-foreground">{item.quantity}× {item.service_catalog?.name}</p>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="p-4 border-t border-border bg-muted/10 flex justify-between gap-2">
                                <Select
                                    value={bundle.status}
                                    onValueChange={(val) => updateBundleStatus(bundle.id, val)}
                                >
                                    <SelectTrigger className="h-8 text-xs w-[120px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8"
                                    onClick={() => deleteBundle(bundle.id)}
                                >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Delete
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
