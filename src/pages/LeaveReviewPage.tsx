import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Star, MessageSquare, Loader2, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export default function LeaveReviewPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { settings } = useSiteSettings();

    const productId = searchParams.get("product_id");
    const [productData, setProductData] = useState<any>(null);

    const [rating, setRating] = useState<number>(0);
    const [hoveredRating, setHoveredRating] = useState<number>(0);
    const [name, setName] = useState(user?.user_metadata?.full_name || "");
    const [comment, setComment] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submittedStatus, setSubmittedStatus] = useState<"none" | "high" | "low">("none");

    // Fetch product info if a product ID was passed
    useEffect(() => {
        if (productId) {
            supabase.from("products").select("id, size, vendor, image_url").eq("id", productId).single()
                .then(({ data }) => setProductData(data));
        }
    }, [productId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) return;

        setIsSubmitting(true);
        try {
            // 1. Save to Supabase
            const { error } = await supabase.from("reviews").insert({
                product_id: productId || null,
                customer_id: user?.id || null,
                customer_name: name || "Anonymous",
                rating,
                comment,
                status: rating >= 4 ? 'approved' : 'pending' // Auto-approve 4 and 5 stars
            });

            if (error) throw error;

            // 2. Smart Routing: Determine next step
            if (rating >= 4) {
                setSubmittedStatus("high");
            } else {
                setSubmittedStatus("low");
            }

        } catch (error) {
            console.error("Failed to submit review:", error);
            alert("Failed to submit your review. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submittedStatus === "high") {
        // Has a Google Review Link?
        const googleLink = settings.company.google_review_link || "https://g.page/r/your-google-link/review";

        return (
            <Layout>
                <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
                    <div className="max-w-md w-full bg-card p-8 text-center rounded-xl shadow-sm border border-border">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold mb-4">You're Awesome! 🎉</h2>
                        <p className="text-muted-foreground mb-8 text-lg">
                            We're thrilled you had a 5-star experience with KoreTires! As a small local business, online reviews mean the world to us.
                            Would you take 10 seconds to paste your review on Google?
                        </p>

                        {(comment.length > 5) && (
                            <div className="bg-muted p-4 rounded-lg mb-6 text-left relative">
                                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 block">Your Review</span>
                                <p className="text-sm italic">"{comment}"</p>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="absolute top-2 right-2 h-7 text-xs"
                                    onClick={() => navigator.clipboard.writeText(comment)}
                                >
                                    Copy
                                </Button>
                            </div>
                        )}

                        <Button size="lg" className="w-full text-base mb-4" asChild>
                            <a href={googleLink} target="_blank" rel="noopener noreferrer">
                                Post to Google Reviews
                                <ExternalLink className="ml-2 w-4 h-4" />
                            </a>
                        </Button>

                        <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => navigate("/")}>
                            No thanks, return home
                        </Button>
                    </div>
                </div>
            </Layout>
        );
    }

    if (submittedStatus === "low") {
        return (
            <Layout>
                <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
                    <div className="max-w-md w-full bg-card p-8 text-center rounded-xl shadow-sm border border-border">
                        <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-yellow-500" />
                        </div>
                        <h2 className="text-2xl font-bold mb-4">We're So Sorry!</h2>
                        <p className="text-muted-foreground mb-8">
                            We completely missed the mark, and we want to make it right.
                            Management has been notified immediately and will be reaching out to you shortly to resolve this.
                        </p>
                        <Button variant="default" className="w-full" onClick={() => navigate("/")}>
                            Return to Home
                        </Button>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="min-h-screen py-16 section-gray">
                <div className="container max-w-2xl px-4 mx-auto">

                    <div className="text-center mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold mb-3">How did we do?</h1>
                        <p className="text-muted-foreground text-lg">
                            Rate your experience with KoreTires
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 sm:p-10 shadow-sm border border-border">

                        {productData && (
                            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg mb-8">
                                {productData.image_url ? (
                                    <img src={productData.image_url} alt={productData.size} className="w-16 h-16 object-cover rounded-md" />
                                ) : (
                                    <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                                        <MessageSquare className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{productData.vendor}</p>
                                    <p className="font-bold">{productData.size}</p>
                                </div>
                            </div>
                        )}

                        {/* Star Rating */}
                        <div className="flex flex-col items-center justify-center mb-10">
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        className="p-1 sm:p-2 transition-transform hover:scale-110 focus:outline-none"
                                        onMouseEnter={() => setHoveredRating(star)}
                                        onMouseLeave={() => setHoveredRating(0)}
                                        onClick={() => setRating(star)}
                                    >
                                        <Star
                                            className={`w-10 h-10 sm:w-14 sm:h-14 transition-colors ${(hoveredRating || rating) >= star
                                                    ? 'fill-yellow-400 text-yellow-400'
                                                    : 'fill-muted text-muted-foreground/30'
                                                }`}
                                        />
                                    </button>
                                ))}
                            </div>
                            <p className="text-sm font-medium text-muted-foreground mt-4 h-5">
                                {rating === 1 && "Terrible"}
                                {rating === 2 && "Poor"}
                                {rating === 3 && "Average"}
                                {rating === 4 && "Good"}
                                {rating === 5 && "Excellent!"}
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <Label htmlFor="name" className="text-base font-medium">Your Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="John Doe"
                                    className="mt-2"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="comment" className="text-base font-medium">Please share the details of your experience</Label>
                                <Textarea
                                    id="comment"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="What did you like or dislike?"
                                    className="mt-2 min-h-[120px]"
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                size="lg"
                                className="w-full text-lg h-14"
                                disabled={rating === 0 || isSubmitting}
                            >
                                {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                                {isSubmitting ? "Submitting..." : "Submit Review"}
                            </Button>
                        </div>

                    </form>

                </div>
            </div>
        </Layout>
    );
}
