import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import tireAllSeason from "@/assets/tire-all-season.jpg";
import tireWinter from "@/assets/tire-winter.jpg";
import tireSummer from "@/assets/tire-summer.jpg";
import tireAllWeather from "@/assets/tire-all-weather.jpg";

const typeImages: Record<string, string> = {
    all_season: tireAllSeason,
    winter: tireWinter,
    all_weather: tireAllWeather,
    summer: tireSummer,
};

const typeLabels: Record<string, string> = {
    all_season: "All Season",
    winter: "Winter",
    all_weather: "All Weather",
    summer: "Summer",
};

interface CompareItem {
    id: string;
    vendor: string | null;
    size: string;
    pattern: string | null;
    description: string | null;
    price: number;
    type: string;
    features: string[] | null;
    image_url: string | null;
}

interface TireCompareProps {
    products: CompareItem[];
    onRemove: (id: string) => void;
    onAddToCart: (product: CompareItem) => void;
    onClose: () => void;
}

export function TireCompare({ products, onRemove, onAddToCart, onClose }: TireCompareProps) {
    if (products.length === 0) return null;

    // Find all unique features across the compared products
    const allFeatures = Array.from(
        new Set(
            products.flatMap(p => p.features || [])
        )
    );

    return (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
            <div className="bg-card w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-xl border border-border flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-border flex justify-between items-center bg-muted/30">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold">Compare Tires</h2>
                        <p className="text-sm text-muted-foreground">{products.length} of 3 items selected</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Content */}
                <ScrollArea className="flex-1 overflow-x-auto">
                    <div className="p-4 sm:p-6 min-w-[600px]">
                        <div className="grid grid-cols-4 gap-6">

                            {/* Feature Labels Column */}
                            <div className="pt-[220px] space-y-6 hidden sm:block">
                                <div className="font-semibold text-muted-foreground text-sm uppercase tracking-wider py-2 border-b border-border">Details</div>
                                <div className="font-semibold text-muted-foreground text-sm uppercase tracking-wider py-2 border-b border-border mt-12">Features</div>
                                {allFeatures.map((f, i) => (
                                    <div key={i} className="text-sm py-2 border-b border-border/50 truncate" title={f}>{f}</div>
                                ))}
                            </div>

                            {/* Product Columns */}
                            {products.map((product) => (
                                <div key={product.id} className="col-span-1 relative flex flex-col">
                                    {/* Remove button */}
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-sm z-10"
                                        onClick={() => onRemove(product.id)}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>

                                    {/* Header/Image */}
                                    <div className="h-[200px] mb-4 flex flex-col">
                                        <div className="h-28 bg-muted rounded-xl mb-3 overflow-hidden">
                                            <img
                                                src={product.image_url || typeImages[product.type] || tireAllSeason}
                                                alt={product.size}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <Badge variant="outline" className="w-fit mb-2">{typeLabels[product.type] || product.type}</Badge>
                                        <div className="font-bold line-clamp-2 leading-tight flex-1">
                                            {product.vendor} {product.pattern} <br />
                                            <span className="text-muted-foreground font-normal text-sm">{product.size}</span>
                                        </div>
                                    </div>

                                    {/* Details Block */}
                                    <div className="space-y-6 flex-1 flex flex-col">
                                        <div className="py-2 border-b border-border">
                                            <div className="text-xl font-bold text-primary">${product.price}</div>
                                        </div>

                                        <div className="py-2 border-b border-border sm:hidden font-semibold text-muted-foreground text-sm">Features</div>

                                        {allFeatures.map((feature, i) => (
                                            <div key={i} className="py-2 border-b border-border/50 flex items-center justify-center sm:justify-start min-h-[40px]">
                                                {(product.features || []).includes(feature) ? (
                                                    <Check className="h-5 w-5 text-green-500" />
                                                ) : (
                                                    <span className="text-muted-foreground/30">-</span>
                                                )}
                                                <span className="sm:hidden ml-2 text-sm">{feature}</span>
                                            </div>
                                        ))}

                                        <div className="mt-auto pt-6">
                                            <Button className="w-full" onClick={() => onAddToCart(product)}>
                                                Add to Cart
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Empty placeholder column if < 3 products */}
                            {Array.from({ length: 3 - products.length }).map((_, i) => (
                                <div key={`empty-${i}`} className="col-span-1 border-2 border-dashed border-border rounded-xl flex items-center justify-center bg-muted/10 h-full min-h-[200px]">
                                    <p className="text-muted-foreground text-sm text-center px-4">
                                        Select another tire to compare
                                    </p>
                                </div>
                            ))}

                        </div>
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
