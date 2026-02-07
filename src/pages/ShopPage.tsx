import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { 
  Search, Filter, X, ShoppingCart, 
  Snowflake, Sun, CloudRain, Package, Tag, AlertTriangle
} from "lucide-react";

// Tire images by type
import tileWinter from "@/assets/tile-winter-tires.jpg";
import tileAllSeason from "@/assets/tile-all-season-tires.jpg";
import tilePerformance from "@/assets/tile-performance-tires.jpg";
import tileTruck from "@/assets/tile-truck-commercial-tires.jpg";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Layout } from "@/components/layout/Layout";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useProductInventory } from "@/hooks/useProductInventory";

interface Product {
  id: string;
  size: string;
  description: string | null;
  vendor: string | null;
  type: string;
  price: number;
  wholesale_price: number | null;
  availability: string | null;
  features: string[] | null;
  image_url: string | null;
}

interface InventoryInfo {
  available: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
}

const widthOptions = ["185", "195", "205", "215", "225", "235", "245", "255", "265", "275", "285"];
const aspectOptions = ["35", "40", "45", "50", "55", "60", "65", "70", "75"];
const rimOptions = ["15", "16", "17", "18", "19", "20", "22"];

const typeIcons: Record<string, typeof Sun> = {
  all_season: Sun,
  winter: Snowflake,
  all_weather: CloudRain,
  summer: Sun,
};

const typeLabels: Record<string, string> = {
  all_season: "All Season",
  winter: "Winter",
  all_weather: "All Weather",
  summer: "Summer",
};

const typeImages: Record<string, string> = {
  all_season: tileAllSeason,
  winter: tileWinter,
  all_weather: tilePerformance,
  summer: tileTruck,
};

function ProductCard({ product, showWholesale, inventory }: { product: Product; showWholesale: boolean; inventory?: InventoryInfo }) {
  const TypeIcon = typeIcons[product.type] || Package;
  const { addItem } = useCart();
  const { toast } = useToast();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const priceToUse = showWholesale && product.wholesale_price ? product.wholesale_price : product.price;
    
    addItem({
      product_id: product.id,
      size: product.size,
      description: product.description || "",
      vendor: product.vendor || "",
      type: product.type,
      price: priceToUse,
      quantity: 1,
      availability: product.availability || "In Stock",
    });
    toast({
      title: "Added to cart",
      description: `${product.size} ${product.description}`,
    });
  };
  
  return (
    <div className="classic-card overflow-hidden group">
      <Link to={`/product/${product.id}`} className="block">
        {/* Product image */}
        <div className="aspect-square bg-muted flex items-center justify-center relative overflow-hidden">
          <img 
            src={product.image_url || typeImages[product.type] || tileAllSeason} 
            alt={`${product.size} ${product.description}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Wholesale badge */}
          {showWholesale && product.wholesale_price && (
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium">
              <Tag className="h-3 w-3" />
              Dealer Price
            </div>
          )}
          
          {/* Low stock / Out of stock badge */}
          {inventory?.isOutOfStock && (
            <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-md bg-destructive text-destructive-foreground text-xs font-medium">
              <AlertTriangle className="h-3 w-3" />
              Out of Stock
            </div>
          )}
          {inventory?.isLowStock && !inventory?.isOutOfStock && (
            <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-md bg-warning text-warning-foreground text-xs font-medium">
              <AlertTriangle className="h-3 w-3" />
              Low Stock: {inventory.available} left
            </div>
          )}
        </div>

        <div className="p-4">
          {/* Availability badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`status-dot ${
              inventory?.isOutOfStock 
                ? 'bg-destructive' 
                : inventory?.isLowStock 
                  ? 'bg-warning' 
                  : 'status-success'
            }`} />
            <span className="text-xs text-muted-foreground">
              {inventory?.isOutOfStock 
                ? 'Out of Stock' 
                : inventory?.isLowStock 
                  ? `Low Stock (${inventory.available} left)` 
                  : product.availability || 'In Stock'}
            </span>
          </div>

          {/* Size */}
          <h3 className="font-bold text-lg mb-1">{product.size}</h3>
          
          {/* Description */}
          <p className="text-sm text-muted-foreground mb-2">{product.description}</p>

          {/* Type & Vendor */}
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary" className="text-xs">
              {typeLabels[product.type] || product.type}
            </Badge>
            <span className="text-xs text-muted-foreground">{product.vendor}</span>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <div>
              {showWholesale && product.wholesale_price ? (
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-primary">${product.wholesale_price}</span>
                  <span className="text-sm text-muted-foreground line-through">${product.price}/tire</span>
                </div>
              ) : (
                <>
                  <span className="text-2xl font-bold text-primary">${product.price}</span>
                  <span className="text-sm text-muted-foreground">/tire</span>
                </>
              )}
            </div>
            <Button variant="default" size="sm" onClick={handleAddToCart} disabled={inventory?.isOutOfStock}>
              <ShoppingCart className="h-4 w-4" />
              {inventory?.isOutOfStock ? 'Notify' : 'Add'}
            </Button>
          </div>
        </div>
      </Link>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="classic-card overflow-hidden">
      <Skeleton className="aspect-square" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  );
}

function FilterSidebar({ 
  width, setWidth, 
  aspect, setAspect, 
  rim, setRim, 
  type, setType,
  onClear
}: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3">Tire Size</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Width</label>
            <Select value={width || "all"} onValueChange={(v) => setWidth(v === "all" ? "" : v)}>
              <SelectTrigger className="bg-muted">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                {widthOptions.map((w) => (
                  <SelectItem key={w} value={w}>{w}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Aspect Ratio</label>
            <Select value={aspect || "all"} onValueChange={(v) => setAspect(v === "all" ? "" : v)}>
              <SelectTrigger className="bg-muted">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                {aspectOptions.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Rim Size</label>
            <Select value={rim || "all"} onValueChange={(v) => setRim(v === "all" ? "" : v)}>
              <SelectTrigger className="bg-muted">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                {rimOptions.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Tire Type</h3>
        <div className="space-y-2">
          {Object.entries(typeLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setType(type === key ? "" : key)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                type === key 
                  ? "bg-primary/10 text-primary border border-primary/30" 
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              {(() => { const Icon = typeIcons[key]; return <Icon className="h-4 w-4" />; })()}
              {label}
            </button>
          ))}
        </div>
      </div>

      <Button variant="outline" className="w-full" onClick={onClear}>
        <X className="h-4 w-4" />
        Clear Filters
      </Button>
    </div>
  );
}

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isApprovedDealer } = useAuth();

  const width = searchParams.get("width") || "";
  const aspect = searchParams.get("aspect") || "";
  const rim = searchParams.get("rim") || "";
  const type = searchParams.get("type") || "";
  const search = searchParams.get("q") || "";

  // Fetch products from Supabase using secure RPC
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.rpc("get_products_public");
        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const productIds = useMemo(() => products.map(p => p.id), [products]);
  const { getInventory } = useProductInventory(productIds);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Parse tire size format: handles "235/60R18", "LT275/70R18", "P225/45R17", "LT33x12.50R17", etc.
        const sizeUpper = product.size.toUpperCase();
        
        // Extract width - look for 3-digit number before "/" or "X"
        if (width) {
          const widthMatch = sizeUpper.match(/(\d{3})(?:\/|X)/);
          const productWidth = widthMatch ? widthMatch[1] : null;
          if (productWidth !== width) return false;
        }
        
        // Extract aspect ratio - number after "/" and before "R" or another "/"
        if (aspect) {
          const aspectMatch = sizeUpper.match(/\/(\d{2,3})(?:\.5)?(?:R|\/)/);
          const productAspect = aspectMatch ? aspectMatch[1] : null;
          if (productAspect !== aspect) return false;
        }
        
        // Extract rim size - number after "R" or final "/" (supports both 265/70R17 and 265/70/17)
        if (rim) {
          const rimMatch = sizeUpper.match(/(?:R|\/)(\d{2})$/);
          const productRim = rimMatch ? rimMatch[1] : null;
          if (productRim !== rim) return false;
        }
        
        if (type && product.type !== type) return false;
        if (search && !product.size.toLowerCase().includes(search.toLowerCase()) && 
            !(product.description || "").toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      // Sort: in-stock products first, then out-of-stock
      .sort((a, b) => {
        const aInStock = a.price > 0 && a.availability !== "Not in Stock";
        const bInStock = b.price > 0 && b.availability !== "Not in Stock";
        if (aInStock && !bInStock) return -1;
        if (!aInStock && bInStock) return 1;
        return 0;
      });
  }, [products, width, aspect, rim, type, search]);

  const hasActiveFilters = width || aspect || rim || type || search;

  return (
    <Layout>
      <div className="section-gray min-h-screen">
        <div className="container py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Shop Tires</h1>
                <p className="text-muted-foreground">
                  Quality tires at competitive prices. Free Edmonton delivery.
                </p>
              </div>
              {isApprovedDealer && (
                <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-md bg-primary/10 border border-primary/30">
                  <Tag className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-primary">Dealer Pricing Active</span>
                </div>
              )}
            </div>
          </div>

          {/* Search bar */}
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by size (e.g., 205/55/16)"
                value={search}
                onChange={(e) => updateFilter("q", e.target.value)}
                className="pl-10 bg-card"
              />
            </div>
            
            {/* Mobile filter button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>Filter Tires</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterSidebar
                    width={width}
                    setWidth={(v: string) => updateFilter("width", v)}
                    aspect={aspect}
                    setAspect={(v: string) => updateFilter("aspect", v)}
                    rim={rim}
                    setRim={(v: string) => updateFilter("rim", v)}
                    type={type}
                    setType={(v: string) => updateFilter("type", v)}
                    onClear={clearFilters}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Dealer pricing notice on mobile */}
          {isApprovedDealer && (
            <div className="md:hidden flex items-center gap-2 px-4 py-2 rounded-md bg-primary/10 border border-primary/30 mb-6">
              <Tag className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Dealer Pricing Active</span>
            </div>
          )}

          {/* Active filters */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {width && (
                <Badge variant="secondary" className="gap-1">
                  Width: {width}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter("width", "")} />
                </Badge>
              )}
              {aspect && (
                <Badge variant="secondary" className="gap-1">
                  Aspect: {aspect}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter("aspect", "")} />
                </Badge>
              )}
              {rim && (
                <Badge variant="secondary" className="gap-1">
                  Rim: {rim}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter("rim", "")} />
                </Badge>
              )}
              {type && (
                <Badge variant="secondary" className="gap-1">
                  {typeLabels[type] || type}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter("type", "")} />
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear all
              </Button>
            </div>
          )}

          <div className="flex gap-8">
            {/* Desktop sidebar */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24 classic-card p-5">
                <FilterSidebar
                  width={width}
                  setWidth={(v: string) => updateFilter("width", v)}
                  aspect={aspect}
                  setAspect={(v: string) => updateFilter("aspect", v)}
                  rim={rim}
                  setRim={(v: string) => updateFilter("rim", v)}
                  type={type}
                  setType={(v: string) => updateFilter("type", v)}
                  onClear={clearFilters}
                />
              </div>
            </aside>

            {/* Product grid */}
            <div className="flex-1">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <ProductSkeleton key={i} />
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="classic-card p-12 text-center">
                  <h3 className="text-xl font-bold mb-2">No tires found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your filters or search terms.
                  </p>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear all filters
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    {filteredProducts.length} tire{filteredProducts.length !== 1 ? 's' : ''} found
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        showWholesale={isApprovedDealer}
                        inventory={getInventory(product.id)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
