import { useState, useEffect } from "react";
import { Loader2, Star, CheckCircle, XCircle, Trash2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Review {
    id: string;
    customer_name: string;
    rating: number;
    comment: string | null;
    status: string;
    created_at: string;
    product_id: string | null;
    product_name?: string;
}

export function AdminReviews() {
    const { toast } = useToast();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            // Fetch reviews and join with products table to get the product name
            const { data, error } = await supabase
                .from('reviews')
                .select(`
          *,
          products(size, vendor, description)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Transform data to match interface
            const formattedReviews = (data || []).map(r => ({
                ...r,
                product_name: r.products ? `${r.products.vendor} ${r.products.size}` : 'General / Unknown',
            }));

            setReviews(formattedReviews);
        } catch (error) {
            console.error('Error fetching reviews:', error);
            toast({
                title: "Error",
                description: "Failed to load reviews.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const updateStatus = async (id: string, newStatus: string) => {
        setUpdatingId(id);
        try {
            const { error } = await supabase
                .from('reviews')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            setReviews(prev =>
                prev.map(r => r.id === id ? { ...r, status: newStatus } : r)
            );

            toast({
                title: "Review Updated",
                description: `Review has been marked as ${newStatus}.`,
            });
        } catch (error) {
            console.error('Error updating status:', error);
            toast({
                title: "Error",
                description: "Failed to update review status.",
                variant: "destructive"
            });
        } finally {
            setUpdatingId(null);
        }
    };

    const deleteReview = async (id: string) => {
        if (!window.confirm("Are you sure you want to permanently delete this review?")) return;

        setUpdatingId(id);
        try {
            const { error } = await supabase
                .from('reviews')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setReviews(prev => prev.filter(r => r.id !== id));
            toast({
                title: "Review Deleted",
                description: "The review has been permanently removed.",
            });
        } catch (error) {
            console.error('Error deleting review:', error);
            toast({
                title: "Error",
                description: "Failed to delete review.",
                variant: "destructive"
            });
        } finally {
            setUpdatingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Customer Reviews</h2>
                    <p className="text-muted-foreground">
                        Monitor and moderate reviews submitted by customers. 4+ star reviews are auto-approved.
                    </p>
                </div>
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden">
                {reviews.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>No reviews have been submitted yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Customer & Product</th>
                                    <th className="px-6 py-4 font-medium">Rating</th>
                                    <th className="px-6 py-4 font-medium">Comment</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {reviews.map((review) => (
                                    <tr key={review.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-foreground">{review.customer_name}</div>
                                            <div className="text-muted-foreground text-xs mt-1">
                                                {review.product_name}
                                            </div>
                                            <div className="text-muted-foreground text-[10px] mt-1">
                                                {format(new Date(review.created_at), 'MMM d, yyyy - h:mm a')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <span className="font-bold mr-2 text-foreground">{review.rating}</span>
                                                <div className="flex">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`w-3 h-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-muted text-muted'}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            {review.comment ? (
                                                <p className="line-clamp-2 text-muted-foreground italic" title={review.comment}>
                                                    "{review.comment}"
                                                </p>
                                            ) : (
                                                <span className="text-muted-foreground/50">No comment</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge
                                                variant="outline"
                                                className={
                                                    review.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                                                        review.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                                                            'bg-yellow-500/10 text-yellow-500'
                                                }
                                            >
                                                {review.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right space-y-2">
                                            <Select
                                                disabled={updatingId === review.id}
                                                value={review.status}
                                                onValueChange={(val) => updateStatus(review.id, val)}
                                            >
                                                <SelectTrigger className="w-[120px] ml-auto h-8 text-xs">
                                                    <SelectValue placeholder="Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pending">Pending</SelectItem>
                                                    <SelectItem value="approved">Approved</SelectItem>
                                                    <SelectItem value="rejected">Rejected</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
                                                onClick={() => deleteReview(review.id)}
                                                disabled={updatingId === review.id}
                                            >
                                                <Trash2 className="h-4 w-4 mr-1" />
                                                Delete
                                            </Button>
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
