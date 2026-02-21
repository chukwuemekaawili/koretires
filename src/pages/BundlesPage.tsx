import { useState, useEffect } from "react";
import { Loader2, Package, Tag, ShoppingCart } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

interface Bundle {
    id: string;
    name: string;
    description: string | null;
    price: number;
    status: string;
    image_url: string | null;
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

export default function BundlesPage() {
    const [bundles, setBundles] = useState<Bundle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { addItem } = useCart();
    const { toast } = useToast();

    useEffect(() => {
        fetchBundles();
    }, []);

    const fetchBundles = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('bundles')
                .select(`
          *,
          bundle_items (
            *,
            products (vendor, size, description),
            service_catalog (name)
          )
        `)
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBundles(data || []);
        } catch (error) {
            console.error('Error fetching bundles:', error);
            toast({
                title: "Error",
                description: "Failed to load bundle deals.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddBundleToCart = (bundle: Bundle) => {
        // We add the bundle itself as a single cart item
        addItem({
            product_id: `bundle_${bundle.id}`,
            size: bundle.name,
            description: bundle.description || "Special Bundle Deal",
            vendor: "KoreTires",
            type: "bundle",
            price: bundle.price,
            quantity: 1,
            availability: "In Stock"
        });

        toast({
            title: "Added to cart",
            description: `${bundle.name} has been added to your cart.`,
        });
    };

    return (
        <Layout>
            <div className="bg-primary/5 border-b border-border">
                <div className="container mx-auto px-4 py-12 text-center">
                    <Badge variant="outline" className="mb-4 bg-primary/10 text-primary border-primary/20">Special Offers</Badge>
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
                        Bundle Deals
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Save more with our curated packages of tires and services. Complete solutions at an unbeatable price.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : bundles.length === 0 ? (
                    <div className="text-center py-20">
                        <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                        <h3 className="text-2xl font-bold mb-2">No active bundles</h3>
                        <p className="text-muted-foreground">Check back later for new special offers and packages.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {bundles.map(bundle => (
                            <div key={bundle.id} className="classic-card overflow-hidden flex flex-col group">
                                {/* Header */}
                                <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 border-b border-border">
                                    <div className="flex justify-between items-start gap-4 mb-4">
                                        <h3 className="text-2xl font-bold">{bundle.name}</h3>
                                        <Badge variant="secondary" className="bg-background">Save</Badge>
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="text-4xl font-extrabold text-primary">${bundle.price}</span>
                                    </div>
                                    {bundle.description && (
                                        <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
                                            {bundle.description}
                                        </p>
                                    )}
                                </div>

                                {/* Items */}
                                <div className="p-6 flex-1 bg-card">
                                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Package Includes</h4>
                                    <ul className="space-y-4">
                                        {bundle.bundle_items.map(item => (
                                            <li key={item.id} className="flex gap-4">
                                                <div className="bg-secondary p-2 rounded-lg h-fit flex-shrink-0">
                                                    {item.item_type === 'product' ? <Package className="w-5 h-5 text-primary" /> : <Tag className="w-5 h-5 text-amber-500" />}
                                                </div>
                                                <div>
                                                    {item.item_type === 'product' ? (
                                                        <>
                                                            <p className="font-bold text-foreground">{item.quantity}× {item.products?.size}</p>
                                                            <p className="text-sm text-muted-foreground mt-0.5">{item.products?.vendor}</p>
                                                        </>
                                                    ) : (
                                                        <p className="font-bold text-foreground mt-1">{item.quantity}× {item.service_catalog?.name}</p>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Footer Action */}
                                <div className="p-6 border-t border-border bg-muted/20">
                                    <Button
                                        className="w-full text-lg py-6"
                                        onClick={() => handleAddBundleToCart(bundle)}
                                    >
                                        <ShoppingCart className="w-5 h-5 mr-2" />
                                        Add Bundle to Cart
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}
