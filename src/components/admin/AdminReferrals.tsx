import { useState, useEffect } from "react";
import { Loader2, Plus, Edit, Trash2, Tag, ArrowRightLeft, DollarSign, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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

interface ReferralCode {
    id: string;
    code: string;
    referrer_name: string;
    referrer_email: string | null;
    reward_amount: number;
    discount_amount: number;
    status: string;
    created_at: string;
}

interface Redemption {
    id: string;
    code_id: string;
    referred_email: string;
    order_id: string | null;
    reward_status: string;
    created_at: string;
    referral_codes?: {
        code: string;
        referrer_name: string;
        reward_amount: number;
    };
}

export function AdminReferrals() {
    const { toast } = useToast();
    const [codes, setCodes] = useState<ReferralCode[]>([]);
    const [redemptions, setRedemptions] = useState<Redemption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'codes' | 'redemptions'>('codes');

    // Form State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        referrer_name: '',
        referrer_email: '',
        reward_amount: '50',
        discount_amount: '50',
        status: 'active'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [codesRes, redemptionsRes] = await Promise.all([
                supabase.from('referral_codes').select('*').order('created_at', { ascending: false }),
                supabase.from('referral_redemptions').select(`
          *,
          referral_codes(code, referrer_name, reward_amount)
        `).order('created_at', { ascending: false })
            ]);

            if (codesRes.error) throw codesRes.error;
            if (redemptionsRes.error) throw redemptionsRes.error;

            setCodes(codesRes.data || []);
            setRedemptions(redemptionsRes.data || []);
        } catch (error) {
            console.error('Error fetching referral data:', error);
            toast({
                title: "Error",
                description: "Failed to load referral program data.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const { data, error } = await supabase
                .from('referral_codes')
                .insert({
                    code: formData.code.toUpperCase().replace(/\s+/g, ''),
                    referrer_name: formData.referrer_name,
                    referrer_email: formData.referrer_email || null,
                    reward_amount: parseFloat(formData.reward_amount),
                    discount_amount: parseFloat(formData.discount_amount),
                    status: formData.status
                })
                .select()
                .single();

            if (error) {
                if (error.code === '23505') {
                    throw new Error('This referral code already exists. Please choose a unique code.');
                }
                throw error;
            }

            setCodes([data, ...codes]);
            setIsDialogOpen(false);
            setFormData({
                code: '',
                referrer_name: '',
                referrer_email: '',
                reward_amount: '50',
                discount_amount: '50',
                status: 'active'
            });
            toast({
                title: "Code Created",
                description: `Referral code ${data.code} has been created successfully.`,
            });
        } catch (error: any) {
            console.error('Error creating referral code:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to create referral code.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateCodeStatus = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('referral_codes')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            setCodes(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
            toast({ title: "Updated", description: "Referral code status updated." });
        } catch (error) {
            console.error('Error updating status:', error);
            toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
        }
    };

    const updateRedemptionStatus = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('referral_redemptions')
                .update({ reward_status: newStatus })
                .eq('id', id);

            if (error) throw error;

            setRedemptions(prev => prev.map(r => r.id === id ? { ...r, reward_status: newStatus } : r));
            toast({ title: "Updated", description: "Reward status updated." });
        } catch (error) {
            console.error('Error updating status:', error);
            toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
        }
    };

    const deleteCode = async (id: string) => {
        if (!window.confirm("Are you sure? This cannot be undone if the code hasn't been used yet.")) return;

        try {
            const { error } = await supabase
                .from('referral_codes')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setCodes(prev => prev.filter(c => c.id !== id));
            toast({ title: "Deleted", description: "Referral code deleted." });
        } catch (error) {
            console.error('Error deleting code:', error);
            toast({ title: "Error", description: "Failed to delete code. It may have existing redemptions.", variant: "destructive" });
        }
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
                    <h2 className="text-2xl font-bold tracking-tight">Referral Program</h2>
                    <p className="text-muted-foreground">Manage referral codes and track rewards payouts.</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Generate Code
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Referral Code</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateCode} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">Referral Code (e.g. JOHN50)</Label>
                                <Input
                                    id="code"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    placeholder="FRIEND50"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="referrer_name">Referrer Name</Label>
                                    <Input
                                        id="referrer_name"
                                        value={formData.referrer_name}
                                        onChange={e => setFormData({ ...formData, referrer_name: e.target.value })}
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="referrer_email">Referrer Email (optional)</Label>
                                    <Input
                                        id="referrer_email"
                                        type="email"
                                        value={formData.referrer_email}
                                        onChange={e => setFormData({ ...formData, referrer_email: e.target.value })}
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="discount_amount">Discount for New Customer ($)</Label>
                                    <Input
                                        id="discount_amount"
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={formData.discount_amount}
                                        onChange={e => setFormData({ ...formData, discount_amount: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reward_amount">Reward for Referrer ($)</Label>
                                    <Input
                                        id="reward_amount"
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={formData.reward_amount}
                                        onChange={e => setFormData({ ...formData, reward_amount: e.target.value })}
                                        required
                                    />
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
                                Create Code
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex border-b border-border">
                <button
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'codes' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    onClick={() => setActiveTab('codes')}
                >
                    Referral Codes ({codes.length})
                </button>
                <button
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'redemptions' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    onClick={() => setActiveTab('redemptions')}
                >
                    Redemptions & Tracking ({redemptions.length})
                </button>
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden">
                {activeTab === 'codes' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Code</th>
                                    <th className="px-6 py-4 font-medium">Referrer</th>
                                    <th className="px-6 py-4 font-medium">Values</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium">Created</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {codes.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                            No referral codes generated yet.
                                        </td>
                                    </tr>
                                )}
                                {codes.map((code) => {
                                    const usesCount = redemptions.filter(r => r.code_id === code.id).length;
                                    return (
                                        <tr key={code.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4 font-mono font-bold text-primary">
                                                {code.code}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-foreground">{code.referrer_name}</div>
                                                <div className="text-muted-foreground text-xs mt-1">{code.referrer_email || 'No email provided'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col space-y-1 text-xs">
                                                    <span className="flex items-center gap-1 text-green-500 font-medium">
                                                        <Tag className="w-3 h-3" /> New Customer: ${code.discount_amount} off
                                                    </span>
                                                    <span className="flex items-center gap-1 text-amber-500 font-medium">
                                                        <DollarSign className="w-3 h-3" /> Referrer Reward: ${code.reward_amount}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Select
                                                    value={code.status}
                                                    onValueChange={(val) => updateCodeStatus(code.id, val)}
                                                >
                                                    <SelectTrigger className={`w-[110px] h-8 text-xs ${code.status === 'active' ? 'text-green-500 bg-green-500/10 border-green-500/20' : 'text-muted-foreground'}`}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="active">Active</SelectItem>
                                                        <SelectItem value="inactive">Inactive</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground text-xs">
                                                {format(new Date(code.created_at), 'MMM d, yyyy')}
                                                <br />
                                                <span className="font-medium text-foreground">{usesCount} uses</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => deleteCode(code.id)}
                                                    disabled={usesCount > 0}
                                                    title={usesCount > 0 ? "Cannot delete code with existing redemptions" : "Delete code"}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'redemptions' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Referred Customer</th>
                                    <th className="px-6 py-4 font-medium">Code Info</th>
                                    <th className="px-6 py-4 font-medium">Date</th>
                                    <th className="px-6 py-4 font-medium">Reward Payout Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {redemptions.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                                            No codes have been redeemed yet.
                                        </td>
                                    </tr>
                                )}
                                {redemptions.map((redemption) => (
                                    <tr key={redemption.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-foreground">{redemption.referred_email}</div>
                                            {redemption.order_id && (
                                                <div className="text-muted-foreground text-xs mt-1 font-mono">
                                                    Order: {redemption.order_id.substring(0, 8)}...
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-primary font-mono">{redemption.referral_codes?.code}</div>
                                            <div className="text-muted-foreground text-xs mt-1">
                                                Referred by: {redemption.referral_codes?.referrer_name}
                                            </div>
                                            <div className="text-amber-500 font-bold text-xs mt-1">
                                                Owes: ${redemption.referral_codes?.reward_amount}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground text-xs">
                                            {format(new Date(redemption.created_at), 'MMM d, yyyy - h:mm a')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Select
                                                value={redemption.reward_status}
                                                onValueChange={(val) => updateRedemptionStatus(redemption.id, val)}
                                            >
                                                <SelectTrigger className={`w-[130px] h-8 text-xs ${redemption.reward_status === 'paid' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                        redemption.reward_status === 'cancelled' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                                                            'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                    }`}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pending">Pending Payment</SelectItem>
                                                    <SelectItem value="paid">Paid (Sent eTransfer)</SelectItem>
                                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
