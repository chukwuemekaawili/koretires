import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, ShoppingCart, Phone, Truck, Store, Wrench, 
  Package, Shield, Check, Info, Loader2, Tag, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Layout } from "@/components/layout/Layout";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import { useSingleProductInventory } from "@/hooks/useProductInventory";
import { LowStockBadge } from "@/components/product/LowStockBadge";
import { supabase } from "@/integrations/supabase/client";
import { TireSizeVisualizer } from "@/components/tire/TireSizeVisualizer";

// Tire images by type
import tireAllSeason from "@/assets/tire-all-season.jpg";
import tireWinter from "@/assets/tire-winter.jpg";
import tireSummer from "@/assets/tire-summer.jpg";
import tireAllWeather from "@/assets/tire-all-weather.jpg";

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

const fulfillmentOptions = [
  {
    id: "pickup",
    icon: Store,
    title: "In-Store Pickup",
    description: "Ready today at our location",
    price: "Free",
  },
  {
    id: "installation",
    icon: Wrench,
    title: "Installation Request",
    description: "Professional installation by our technicians",
    price: "Quoted separately",
  },
  {
    id: "delivery",
    icon: Truck,
    title: "Local Delivery",
    description: "Free delivery within city limits",
    price: "Free",
  },
  {
    id: "shipping",
    icon: Package,
    title: "Shipping Request",
    description: "Shipping cost confirmed after order",
    price: "TBD",
  },
];

const typeLabels: Record<string, string> = {
  all_season: "All Season",
  winter: "Winter",
  all_weather: "All Weather",
  summer: "Summer",
};

const typeImages: Record<string, string> = {
  all_season: tireAllSeason,
  winter: tireWinter,
  all_weather: tireAllWeather,
  summer: tireSummer,
};

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, setFulfillment: setCartFulfillment } = useCart();
  const { isApprovedDealer } = useAuth();
  const { toast } = useToast();
  const { companyInfo, formatPhone } = useCompanyInfo();
  const [quantity, setQuantity] = useState(4);
  const [fulfillment, setFulfillment] = useState("delivery");
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch inventory for low stock badge
  const { inventory } = useSingleProductInventory(id);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        // Use RPC function to securely fetch product (wholesale_price is NULL for non-approved dealers)
        const { data, error } = await supabase.rpc("get_products_public", { p_product_id: id });

        if (error) throw error;
        // RPC returns an array, get the first item
        setProduct(data && data.length > 0 ? data[0] : null);
      } catch (error) {
        console.error("Error fetching product:", error);
        toast({
          title: "Error",
          description: "Could not load product details.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id, toast]);

  const showWholesale = isApprovedDealer && product?.wholesale_price;
  const displayPrice = showWholesale ? product.wholesale_price! : (product?.price || 0);

  const handleAddToCart = () => {
    if (!product) return;
    
    addItem({
      product_id: product.id,
      size: product.size,
      description: product.description || "",
      vendor: product.vendor || "",
      type: product.type,
      price: displayPrice,
      quantity,
      availability: product.availability || "In Stock",
    });
    setCartFulfillment(fulfillment as any);
    toast({
      title: "Added to cart",
      description: `${quantity} × ${product.size} ${product.description}`,
    });
    navigate("/cart");
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <Skeleton className="h-6 w-40 mb-6" />
          <div className="grid lg:grid-cols-2 gap-12">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">Product Not Found</h1>
          <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist or has been removed.</p>
          <Button variant="hero" asChild>
            <Link to="/shop">Browse All Tires</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/shop" className="hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Shop
          </Link>
          <span>/</span>
          <span>{product.size}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product image and visualizer */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-secondary to-secondary/50 border border-border/40 overflow-hidden relative">
              <img 
                src={product.image_url || typeImages[product.type] || tireAllSeason} 
                alt={`${product.size} ${product.description}`}
                className="w-full h-full object-cover"
              />
              
              {/* Dealer badge */}
              {showWholesale && (
                <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground font-medium">
                  <Tag className="h-4 w-4" />
                  Dealer Price
                </div>
              )}
            </div>

            {/* Tire Size Visualizer */}
            <TireSizeVisualizer selectedSize={product.size} />
          </motion.div>

          {/* Product details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {/* Availability with low stock badge */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {inventory ? (
                <>
                  {inventory.isOutOfStock ? (
                    <>
                      <span className="status-dot bg-destructive" />
                      <span className="text-sm font-medium text-destructive">Out of Stock</span>
                    </>
                  ) : inventory.isLowStock ? (
                    <>
                      <span className="status-dot bg-amber-500" />
                      <span className="text-sm font-medium text-amber-500">Low Stock: {inventory.available} left</span>
                    </>
                  ) : (
                    <>
                      <span className="status-dot status-in-stock" />
                      <span className="text-sm font-medium text-green-500">{product.availability || 'In Stock'}</span>
                    </>
                  )}
                </>
              ) : (
                <>
                  <span className={`status-dot ${product.availability === 'In Stock' ? 'status-in-stock' : 'status-available-24h'}`} />
                  <span className="text-sm font-medium text-green-500">{product.availability || 'In Stock'}</span>
                </>
              )}
            </div>

            {/* Title */}
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              {product.size} {product.description}
            </h1>
            
            {/* Meta */}
            <div className="flex items-center gap-3 mb-6">
              <Badge variant="secondary">{typeLabels[product.type] || product.type}</Badge>
              <span className="text-muted-foreground">{product.vendor}</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-bold text-primary">${displayPrice}</span>
              <span className="text-muted-foreground">/tire</span>
              {showWholesale && (
                <span className="text-lg text-muted-foreground line-through ml-2">${product.price}</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              {showWholesale ? "Dealer pricing applied. " : ""}Price before tax. GST calculated at reservation.
            </p>

            {/* Pay on delivery messaging */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20 mb-6">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-sm">Pay In-Person on Delivery</p>
                <p className="text-xs text-muted-foreground">
                  Inspect your tires before you pay. Cash or card accepted in-person.
                </p>
              </div>
            </div>

            {/* Quantity selector */}
            <div className="mb-6">
              <Label className="text-sm font-medium mb-3 block">Quantity</Label>
              <div className="flex items-center gap-3">
                {[1, 2, 4].map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuantity(q)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      quantity === q
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {q} tire{q !== 1 ? "s" : ""}
                  </button>
                ))}
                <span className="text-sm text-muted-foreground ml-2">
                  Total: <span className="font-semibold text-foreground">${displayPrice * quantity}</span>
                </span>
              </div>
            </div>

            {/* Fulfillment options */}
            <div className="mb-6">
              <Label className="text-sm font-medium mb-3 block">Fulfillment</Label>
              <RadioGroup value={fulfillment} onValueChange={setFulfillment} className="space-y-3">
                {fulfillmentOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <div
                      key={option.id}
                      className={`flex items-start gap-4 p-4 rounded-xl border transition-colors cursor-pointer ${
                        fulfillment === option.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-border/80 bg-secondary/30"
                      }`}
                      onClick={() => setFulfillment(option.id)}
                    >
                      <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                      <Icon className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <Label htmlFor={option.id} className="font-medium cursor-pointer">
                          {option.title}
                        </Label>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                      <span className="text-sm font-medium text-primary">{option.price}</span>
                    </div>
                  );
                })}
              </RadioGroup>
              
              {fulfillment === "shipping" && (
                <p className="text-sm text-muted-foreground mt-3 flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  Shipping cost will be confirmed by our team after you place your order. We'll contact you before dispatch.
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Button variant="hero" size="xl" className="flex-1" onClick={handleAddToCart}>
                <ShoppingCart className="h-5 w-5" />
                Add to Cart
              </Button>
              {companyInfo.contact.phone && (
                <Button variant="outline" size="xl" asChild>
                  <a href={`tel:${formatPhone(companyInfo.contact.phone)}`}>
                    <Phone className="h-5 w-5" />
                    Call to Order
                  </a>
                </Button>
              )}
            </div>

            {/* Online payments notice */}
            <p className="text-sm text-muted-foreground text-center mb-6">
              Online payments coming soon. Pay in-person on delivery/pickup.
            </p>

            <Separator className="my-6" />

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <>
                <div>
                  <h3 className="font-display font-semibold mb-4">Features</h3>
                  <ul className="space-y-2">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <Separator className="my-6" />
              </>
            )}

            {/* Warranty */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/50">
              <Shield className="h-6 w-6 text-primary" />
              <div>
                <h4 className="font-medium mb-1">Warranty Coverage</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  50,000 km or 1 year limited warranty against manufacturing defects.
                </p>
                <Link to="/warranty" className="text-sm text-primary hover:underline">
                  View full warranty & returns policy →
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
