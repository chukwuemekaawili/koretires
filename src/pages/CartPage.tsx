import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShoppingCart, Trash2, Plus, Minus, ArrowRight,
  Package, Phone, Shield, Truck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Layout } from "@/components/layout/Layout";
import { useCart } from "@/contexts/CartContext";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";

export default function CartPage() {
  const { items, itemCount, subtotal, removeItem, updateQuantity } = useCart();
  const { companyInfo, formatPhone } = useCompanyInfo();

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-lg mx-auto text-center"
          >
            <div className="inline-flex p-6 rounded-full bg-secondary mb-6">
              <ShoppingCart className="h-12 w-12 text-muted-foreground" />
            </div>
            <h1 className="font-display text-3xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8">
              Browse our selection of quality tires and find the perfect fit for your vehicle.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="hero" size="lg" asChild>
                <Link to="/shop">
                  Browse Tires
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              {companyInfo.contact.phone && (
                <Button variant="outline" size="lg" asChild>
                  <a href={`tel:${formatPhone(companyInfo.contact.phone)}`}>
                    <Phone className="h-5 w-5" />
                    Call for Help
                  </a>
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  const totalTires = items.reduce((sum, item) => sum + item.quantity, 0);
  const tireRecyclingLevy = totalTires * 5;
  const gst = (subtotal + tireRecyclingLevy) * 0.05;
  const total = subtotal + tireRecyclingLevy + gst;

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-8">
          Your Cart ({itemCount} item{itemCount !== 1 ? "s" : ""})
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bento-card"
              >
                <div className="flex gap-4">
                  {/* Product image placeholder */}
                  <div className="w-24 h-24 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Link
                          to={`/product/${item.product_id}`}
                          className="font-display font-semibold text-lg hover:text-primary transition-colors"
                        >
                          {item.size}
                        </Link>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.vendor}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      {/* Quantity controls */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-primary">${item.price * item.quantity}</p>
                        <p className="text-xs text-muted-foreground">${item.price}/tire</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="bento-card sticky top-32">
              <h2 className="font-display font-semibold text-xl mb-4">Order Summary</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST (5%)</span>
                  <span>${gst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between font-semibold text-lg mb-6">
                <span>Estimated Total</span>
                <span className="text-primary">${total.toFixed(2)}</span>
              </div>

              <Button variant="hero" size="lg" className="w-full mb-4" asChild>
                <Link to="/checkout">
                  Reserve Your Tires
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>

              <Button variant="outline" className="w-full" asChild>
                <Link to="/shop">Continue Shopping</Link>
              </Button>

              {/* Trust badges */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>Pay in-person on delivery – inspect before paying</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Truck className="h-4 w-4 text-primary" />
                  <span>Free {companyInfo.location.city || "Edmonton"} delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
