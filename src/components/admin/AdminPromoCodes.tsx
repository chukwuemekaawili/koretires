import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Tag, ToggleLeft, ToggleRight, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface PromoCode {
    id: string;
    code: string;
    description: string | null;
    discount_type: string;
    discount_value: number;
    min_order_value: number;
    max_uses: number | null;
    used_count: number;
    valid_from: string | null;
    valid_until: string | null;
    is_active: boolean;
    created_at: string;
}

const initialForm = {
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: "",
    min_order_value: "",
    max_uses: "",
    valid_from: "",
    valid_until: "",
    is_active: true,
};

export function AdminPromoCodes() {
    const [codes, setCodes] = useState<PromoCode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
    const [formData, setFormData] = useState(initialForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => { fetchCodes(); }, []);

    const fetchCodes = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("promo_codes")
                .select("*")
                .order("created_at", { ascending: false });
            if (error) throw error;
            setCodes(data || []);
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: "Failed to load promo codes", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                code: formData.code.toUpperCase().trim(),
                description: formData.description || null,
                discount_type: formData.discount_type,
                discount_value: parseFloat(formData.discount_value),
                min_order_value: formData.min_order_value ? parseFloat(formData.min_order_value) : 0,
                max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
                valid_from: formData.valid_from || null,
                valid_until: formData.valid_until || null,
                is_active: formData.is_active,
            };

            if (editingCode) {
                const { error } = await supabase.from("promo_codes").update(payload).eq("id", editingCode.id);
                if (error) throw error;
                toast({ title: "Updated", description: `Promo code ${payload.code} updated` });
            } else {
                const { error } = await supabase.from("promo_codes").insert(payload);
                if (error) throw error;
                toast({ title: "Created", description: `Promo code ${payload.code} created` });
            }
            setIsDialogOpen(false);
            setEditingCode(null);
            setFormData(initialForm);
            fetchCodes();
        } catch (err: any) {
            console.error(err);
            toast({ title: "Error", description: err.message || "Failed to save", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (code: PromoCode) => {
        setEditingCode(code);
        setFormData({
            code: code.code,
            description: code.description || "",
            discount_type: code.discount_type,
            discount_value: code.discount_value.toString(),
            min_order_value: code.min_order_value?.toString() || "",
            max_uses: code.max_uses?.toString() || "",
            valid_from: code.valid_from ? code.valid_from.slice(0, 10) : "",
            valid_until: code.valid_until ? code.valid_until.slice(0, 10) : "",
            is_active: code.is_active,
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this promo code?")) return;
        try {
            const { error } = await supabase.from("promo_codes").delete().eq("id", id);
            if (error) throw error;
            toast({ title: "Deleted" });
            fetchCodes();
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
        }
    };

    const toggleActive = async (code: PromoCode) => {
        try {
            const { error } = await supabase.from("promo_codes").update({ is_active: !code.is_active }).eq("id", code.id);
            if (error) throw error;
            fetchCodes();
        } catch (err) {
            console.error(err);
        }
    };

    const copyCode = (code: string, id: string) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold">Promo Codes</h2>
                    <p className="text-sm text-muted-foreground">Create discount codes for your customers</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) { setEditingCode(null); setFormData(initialForm); }
                }}>
                    <DialogTrigger asChild>
                        <Button><Plus className="h-4 w-4 mr-2" /> New Code</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{editingCode ? "Edit Promo Code" : "Create Promo Code"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Code *</Label>
                                    <Input
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        placeholder="WINTER20"
                                        className="mt-1 uppercase"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Description</Label>
                                    <Input
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Winter sale discount"
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Discount Type</Label>
                                    <Select value={formData.discount_type} onValueChange={(v) => setFormData({ ...formData, discount_type: v })}>
                                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                                            <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Discount Value *</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.discount_value}
                                        onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                                        placeholder={formData.discount_type === "percentage" ? "20" : "50"}
                                        className="mt-1"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Min. Order Value ($)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.min_order_value}
                                        onChange={(e) => setFormData({ ...formData, min_order_value: e.target.value })}
                                        placeholder="0"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label>Max Uses</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={formData.max_uses}
                                        onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                                        placeholder="Unlimited"
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Valid From</Label>
                                    <Input
                                        type="date"
                                        value={formData.valid_from}
                                        onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label>Valid Until</Label>
                                    <Input
                                        type="date"
                                        value={formData.valid_until}
                                        onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Switch
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                />
                                <Label>Active</Label>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                                    {isSubmitting ? "Saving..." : editingCode ? "Update" : "Create"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : codes.length === 0 ? (
                <div className="text-center py-12 bento-card">
                    <Tag className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                    <h3 className="font-semibold mb-1">No promo codes yet</h3>
                    <p className="text-sm text-muted-foreground">Create your first discount code to boost sales.</p>
                </div>
            ) : (
                <div className="bento-card overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Discount</TableHead>
                                <TableHead>Min Order</TableHead>
                                <TableHead>Usage</TableHead>
                                <TableHead>Valid</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {codes.map((code) => (
                                <TableRow key={code.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold">{code.code}</span>
                                            <button onClick={() => copyCode(code.code, code.id)} className="text-muted-foreground hover:text-foreground">
                                                {copiedId === code.id ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                                            </button>
                                        </div>
                                        {code.description && <p className="text-xs text-muted-foreground">{code.description}</p>}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">
                                            {code.discount_type === "percentage" ? `${code.discount_value}%` : `$${code.discount_value}`}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {code.min_order_value > 0 ? `$${code.min_order_value}` : "—"}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {code.used_count}{code.max_uses ? ` / ${code.max_uses}` : ""}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {code.valid_from ? format(new Date(code.valid_from), "MMM d") : "—"} → {code.valid_until ? format(new Date(code.valid_until), "MMM d") : "∞"}
                                    </TableCell>
                                    <TableCell>
                                        <button onClick={() => toggleActive(code)}>
                                            {code.is_active ? (
                                                <Badge className="bg-green-500/10 text-green-500 border-green-500/30 cursor-pointer">Active</Badge>
                                            ) : (
                                                <Badge variant="secondary" className="cursor-pointer">Inactive</Badge>
                                            )}
                                        </button>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(code)}>
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(code.id)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
