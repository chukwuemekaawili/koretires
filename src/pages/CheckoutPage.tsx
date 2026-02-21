import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Check, Store, Wrench, Truck, Package,
  Phone, Mail, MessageCircle, Shield, Clock, MapPin, Loader2, AlertTriangle, Tag, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Layout } from "@/components/layout/Layout";
import { useCart, type FulfillmentMethod, type CustomerInfo } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import { useInventory } from "@/hooks/useInventory";

const steps = [
  { id: 1, title: "Cart Summary" },
  { id: 2, title: "Fulfillment" },
  { id: 3, title: "Your Info" },
  { id: 4, title: "Confirm" },
];

const fulfillmentOptions = [
  {
    id: "pickup" as FulfillmentMethod,
    icon: Store,
    title: "In-Store Pickup",
    description: "Pick up at our Edmonton location",
    detail: "Ready same day for in-stock items",
    price: "Free",
  },
  {
    id: "installation" as FulfillmentMethod,
    icon: Wrench,
    title: "Installation Request",
    description: "Professional installation by our technicians",
    detail: "We'll schedule a convenient time",
    price: "Quoted separately",
  },
  {
    id: "delivery" as FulfillmentMethod,
    icon: Truck,
    title: "Edmonton Delivery",
    description: "Free delivery within Edmonton city limits",
    detail: "Usually within 1-2 business days",
    price: "Free",
  },
  {
    id: "shipping" as FulfillmentMethod,
    icon: Package,
    title: "Shipping Request",
    description: "Ship anywhere in Alberta/Canada",
    detail: "Cost confirmed before dispatch",
    price: "TBD",
  },
];

const contactMethods = [
  { id: "call", icon: Phone, label: "Phone Call" },
  { id: "whatsapp", icon: MessageCircle, label: "WhatsApp" },
  { id: "email", icon: Mail, label: "Email" },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { companyInfo, formatPhone, getFullAddress, getFormattedHours } = useCompanyInfo();
  const { checkAvailability, reserveStock } = useInventory();
  const {
    items, subtotal, fulfillment, setFulfillment,
    customerInfo, setCustomerInfo, clearCart
  } = useCart();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stockWarnings, setStockWarnings] = useState<{ productId: string; message: string }[]>([]);
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<{
    id: string; code: string; discount_type: string; discount_value: number; discount_amount: number; is_referral?: boolean;
  } | null>(null);
  const [promoError, setPromoError] = useState("");

  const phoneDisplay = companyInfo.contact.phone || null;
  const addressDisplay = getFullAddress() || null;
  const hoursDisplay = getFormattedHours() || null;

  // Check stock availability on mount
  useEffect(() => {
    const checkStock = async () => {
      const inventoryChecks = items.map(item => ({
        productId: item.product_id,
        quantity: item.quantity
      }));

      const results = await checkAvailability(inventoryChecks);
      const warnings = results
        .filter(r => !r.isAvailable)
        .map(r => ({
          productId: r.productId,
          message: `${r.availabilityLabel} - We'll confirm availability`
        }));

      setStockWarnings(warnings);
    };

    if (items.length > 0) {
      checkStock();
    }
  }, [items, checkAvailability]);

  // Get guest ID from localStorage
  const getGuestId = () => {
    try {
      const stored = localStorage.getItem("kore_cart");
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.guestId;
      }
    } catch (e) {
      console.error("Failed to get guest ID:", e);
    }
    return null;
  };

  // Form state
  const [formData, setFormData] = useState<CustomerInfo>({
    name: customerInfo?.name || "",
    email: customerInfo?.email || "",
    phone: customerInfo?.phone || "",
    preferredContact: customerInfo?.preferredContact || "call",
    address: customerInfo?.address || "",
    city: customerInfo?.city || "",
    postalCode: customerInfo?.postalCode || "",
    notes: customerInfo?.notes || "",
  });

  // Redirect if cart is empty
  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="font-display text-2xl font-bold mb-4">Your cart is empty</h1>
          <Button variant="hero" asChild>
            <Link to="/shop">Browse Tires</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const totalTires = items.reduce((sum, item) => sum + item.quantity, 0);
  const tireRecyclingLevy = totalTires * 5;
  const discountAmount = appliedPromo?.discount_amount || 0;
  const gst = (subtotal - discountAmount + tireRecyclingLevy) * 0.05;
  const total = subtotal - discountAmount + tireRecyclingLevy + gst;
  const needsAddress = fulfillment === "delivery" || fulfillment === "shipping";

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      // 1. Check Promo Codes
      const { data, error } = await supabase.rpc("validate_promo_code", {
        p_code: promoCode.trim(),
        p_subtotal: subtotal,
      });
      if (error && error.code !== 'P0001') throw error; // Ignore custom RAISE EXCEPTION for now

      const result = data?.[0];
      if (result && result.is_valid) {
        setAppliedPromo({
          id: result.id,
          code: result.code,
          discount_type: result.discount_type,
          discount_value: result.discount_value,
          discount_amount: result.discount_amount,
          is_referral: false
        });
        setPromoError("");
        setPromoLoading(false);
        return;
      }

      // 2. If invalid promo, check Referral Codes
      const { data: refData, error: refError } = await supabase
        .from('referral_codes')
        .select('*')
        .ilike('code', promoCode.trim())
        .eq('status', 'active')
        .single();

      if (refData) {
        setAppliedPromo({
          id: refData.id,
          code: refData.code,
          discount_type: 'fixed',
          discount_value: refData.discount_amount,
          discount_amount: refData.discount_amount,
          is_referral: true
        });
        setPromoError("");
      } else {
        setPromoError(result?.error_message || "Invalid code");
        setAppliedPromo(null);
      }
    } catch (err: any) {
      setPromoError("Failed to validate code");
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoCode("");
    setPromoError("");
  };

  const handleNext = () => {
    if (currentStep === 3) {
      // Validate form before moving to confirmation
      if (!formData.name || !formData.email || !formData.phone) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }
      if (needsAddress && (!formData.address || !formData.city)) {
        toast({
          title: "Missing Address",
          description: "Please provide your delivery address.",
          variant: "destructive",
        });
        return;
      }
      setCustomerInfo(formData);
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmitOrder = async () => {
    setIsSubmitting(true);

    try {
      const guestId = getGuestId();

      // 1. Create customer record
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .insert({
          user_id: user?.id || null,
          guest_id: user ? null : guestId,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          preferred_contact: formData.preferredContact,
          address: formData.address || null,
          city: formData.city || null,
          postal_code: formData.postalCode || null,
          notes: formData.notes || null,
        })
        .select("id")
        .single();

      if (customerError) throw customerError;

      // 2. Create order
      const orderNumber = `KT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert([{
          order_number: orderNumber,
          user_id: user?.id || null,
          guest_id: user ? null : guestId,
          customer_id: customerData.id,
          fulfillment_method: fulfillment,
          subtotal: subtotal,
          tire_recycling_levy: tireRecyclingLevy,
          gst: gst,
          total: total,
          payment_method: "pay_on_delivery",
          notes: formData.notes || null,
          promo_code_id: (appliedPromo && !appliedPromo.is_referral) ? appliedPromo.id : null,
          discount_amount: discountAmount,
        }])
        .select("id, order_number")
        .single();

      if (orderError) throw orderError;

      // 3. Create order items
      const orderItems = items.map((item) => ({
        order_id: orderData.id,
        product_id: item.product_id.startsWith("cart_") ? null : item.product_id,
        size: item.size,
        description: item.description,
        vendor: item.vendor,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 3.5 Record referral redemption if applicable
      if (appliedPromo?.is_referral) {
        await supabase.from("referral_redemptions").insert({
          code_id: appliedPromo.id,
          referred_email: formData.email,
          order_id: orderData.id,
          reward_status: 'pending'
        });
      }

      // 4. Reserve stock (soft - allows ordering even if not available)
      const inventoryChecks = items
        .filter(item => !item.product_id.startsWith("cart_"))
        .map(item => ({
          productId: item.product_id,
          quantity: item.quantity
        }));

      if (inventoryChecks.length > 0) {
        const reservationResult = await reserveStock(
          orderData.id,
          inventoryChecks,
          user?.id
        );

        // If stock confirmation needed, order was already flagged
        if (reservationResult.needsStockConfirmation) {
          toast({
            title: "Order Placed - Confirmation Pending",
            description: `Order #${orderData.order_number} received. We'll confirm stock availability and contact you shortly.`,
          });
        } else {
          toast({
            title: "Order Placed Successfully!",
            description: `Order #${orderData.order_number} - We'll contact you shortly.`,
          });
        }
      } else {
        toast({
          title: "Order Placed Successfully!",
          description: `Order #${orderData.order_number} - We'll contact you shortly.`,
        });
      }

      // Schedule Google Review request (7 days later)
      try {
        const { scheduleReviewRequest } = await import("@/utils/reviewAutomation");
        await scheduleReviewRequest({
          orderId: orderData.id,
          customerEmail: formData.email,
          customerName: formData.name,
          orderNumber: orderData.order_number,
        });
      } catch (error) {
        console.error("Failed to schedule review request:", error);
        // Don't fail the order if review scheduling fails
      }

      // Signal AI Concierge to auto-open with order context
      localStorage.setItem('openAIChatWithContext', orderData.order_number);

      // Trigger Order Notification (Customer + Admin Reflection)
      try {
        await supabase.functions.invoke("send-notification", {
          body: {
            type: "order_confirmation",
            recipientEmail: formData.email,
            recipientName: formData.name,
            data: {
              orderNumber: orderData.order_number,
              total: total.toFixed(2),
              fulfillmentMethod: fulfillment === "pickup" ? "In-Store Pickup" :
                fulfillment === "installation" ? "Installation" :
                  fulfillment === "delivery" ? "Delivery" : "shipping",
              preferredContact: formData.preferredContact,
              recipientPhone: formData.phone,
            }
          }
        });
      } catch (notifyError) {
        console.error("Failed to send notification:", notifyError);
        // Don't block flow, just log
      }

      navigate("/order-confirmation", {
        state: { orderNumber: orderData.order_number }
      });

    } catch (error: any) {
      console.error("Order submission error:", error);
      toast({
        title: "Order Failed",
        description: error.message || "There was an error placing your order. Please try again or call us.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/cart">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Reserve Your Tires</h1>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-2 mb-12 overflow-x-auto pb-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                disabled={step.id > currentStep}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${step.id === currentStep
                  ? "bg-primary text-primary-foreground"
                  : step.id < currentStep
                    ? "bg-primary/20 text-primary cursor-pointer hover:bg-primary/30"
                    : "bg-secondary text-muted-foreground"
                  }`}
              >
                {step.id < currentStep ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs">
                    {step.id}
                  </span>
                )}
                <span className="hidden sm:inline">{step.title}</span>
              </button>
              {index < steps.length - 1 && (
                <div className="w-8 h-0.5 bg-border mx-1" />
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {/* Step 1: Cart Summary */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h2 className="font-display text-xl font-semibold mb-4">Review Your Items</h2>
                  {items.map((item) => (
                    <div key={item.id} className="bento-card flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{item.size}</p>
                        <p className="text-sm text-muted-foreground">{item.description} • {item.vendor}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${item.price * item.quantity}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Step 2: Fulfillment */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h2 className="font-display text-xl font-semibold mb-4">Choose Fulfillment Method</h2>
                  <RadioGroup
                    value={fulfillment}
                    onValueChange={(v) => setFulfillment(v as FulfillmentMethod)}
                    className="space-y-3"
                  >
                    {fulfillmentOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <div
                          key={option.id}
                          className={`flex items-start gap-4 p-4 rounded-xl border transition-colors cursor-pointer ${fulfillment === option.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-border/80 bg-card"
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
                            <p className="text-xs text-muted-foreground mt-1">{option.detail}</p>
                          </div>
                          <span className="text-sm font-medium text-primary">{option.price}</span>
                        </div>
                      );
                    })}
                  </RadioGroup>

                  {fulfillment === "shipping" && (
                    <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm">
                      <p className="text-amber-200">
                        <strong>Note:</strong> Shipping cost will be confirmed by our team before dispatch. We'll contact you with the final amount.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 3: Customer Info */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="font-display text-xl font-semibold mb-4">Your Information</h2>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1.5 bg-secondary/50"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="mt-1.5 bg-secondary/50"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="mt-1.5 bg-secondary/50"
                      required
                    />
                  </div>

                  <div>
                    <Label className="mb-3 block">Preferred Contact Method *</Label>
                    <div className="flex flex-wrap gap-3">
                      {contactMethods.map((method) => {
                        const Icon = method.icon;
                        return (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, preferredContact: method.id as any })}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${formData.preferredContact === method.id
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-secondary/50 text-muted-foreground hover:bg-secondary"
                              }`}
                          >
                            <Icon className="h-4 w-4" />
                            {method.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {needsAddress && (
                    <>
                      <Separator />
                      <h3 className="font-medium">Delivery Address</h3>
                      <div>
                        <Label htmlFor="address">Street Address *</Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="mt-1.5 bg-secondary/50"
                          required
                        />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city">City *</Label>
                          <Input
                            id="city"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="mt-1.5 bg-secondary/50"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="postalCode">Postal Code</Label>
                          <Input
                            id="postalCode"
                            value={formData.postalCode}
                            onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                            className="mt-1.5 bg-secondary/50"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <Label htmlFor="notes">Order Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="mt-1.5 bg-secondary/50"
                      placeholder="Any special instructions..."
                      rows={3}
                    />
                  </div>
                </motion.div>
              )}

              {/* Step 4: Confirmation */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="font-display text-xl font-semibold mb-4">Confirm Your Order</h2>

                  {/* Order items */}
                  <div className="bento-card">
                    <h3 className="font-medium mb-3">Items ({items.length})</h3>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>{item.size} × {item.quantity}</span>
                          <span>${item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fulfillment */}
                  <div className="bento-card">
                    <h3 className="font-medium mb-3">Fulfillment</h3>
                    <div className="flex items-center gap-3">
                      {(() => {
                        const option = fulfillmentOptions.find((o) => o.id === fulfillment);
                        const Icon = option?.icon || Package;
                        return (
                          <>
                            <Icon className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium">{option?.title}</p>
                              <p className="text-sm text-muted-foreground">{option?.description}</p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Customer info */}
                  <div className="bento-card">
                    <h3 className="font-medium mb-3">Contact Information</h3>
                    <div className="space-y-1 text-sm">
                      <p>{formData.name}</p>
                      <p className="text-muted-foreground">{formData.email}</p>
                      <p className="text-muted-foreground">{formData.phone}</p>
                      {needsAddress && formData.address && (
                        <p className="text-muted-foreground mt-2">
                          {formData.address}, {formData.city} {formData.postalCode}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Payment method */}
                  <div className="bento-card">
                    <h3 className="font-medium mb-3">Payment Method</h3>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <Shield className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Pay on Delivery / Pickup</p>
                      </div>
                    </div>
                  </div>

                  {/* Online payments coming soon */}
                  <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-secondary/50 border border-border/50">
                    <p className="text-sm text-muted-foreground">
                      💳 Secure online card payments coming soon
                    </p>
                  </div>

                  {/* Terms */}
                  <p className="text-sm text-muted-foreground">
                    By placing this order, you agree to our{" "}
                    <Link to="/warranty" className="text-primary hover:underline">
                      warranty & returns policy
                    </Link>
                    . Your order will be confirmed via your preferred contact method.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="flex gap-3 mt-8">
              {currentStep > 1 && (
                <Button variant="outline" size="lg" onClick={handleBack} disabled={isSubmitting}>
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
              {currentStep < 4 ? (
                <Button variant="hero" size="lg" className="flex-1" onClick={handleNext}>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="hero"
                  size="lg"
                  className="flex-1"
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    "Place Order – Pay on Delivery"
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Order summary sidebar */}
          <div className="lg:col-span-1">
            <div className="bento-card sticky top-32">
              <h2 className="font-display font-semibold text-lg mb-4">Order Summary</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Alta. Tire Recycling Levy ({totalTires} × $5)</span>
                  <span>${tireRecyclingLevy.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-500">
                    <span>Discount ({appliedPromo?.code})</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST (5%)</span>
                  <span>${gst.toFixed(2)}</span>
                </div>
                {fulfillment === "delivery" && (
                  <div className="flex justify-between text-green-500">
                    <span>Edmonton Delivery</span>
                    <span>Free</span>
                  </div>
                )}
                {fulfillment === "shipping" && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span>TBD</span>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-primary">${total.toFixed(2)}</span>
              </div>

              {/* Promo Code Input */}
              <div className="mt-4 pt-4 border-t border-border">
                {appliedPromo ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-green-500">{appliedPromo.code}</p>
                        <p className="text-xs text-muted-foreground">
                          {appliedPromo.discount_type === 'percentage' ? `${appliedPromo.discount_value}% off` : `$${appliedPromo.discount_value} off`}
                        </p>
                      </div>
                    </div>
                    <button onClick={removePromo} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-sm">Promo Code</Label>
                    <div className="flex gap-2">
                      <Input
                        value={promoCode}
                        onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(""); }}
                        placeholder="WINTER20"
                        className="uppercase text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleApplyPromo}
                        disabled={promoLoading || !promoCode.trim()}
                      >
                        {promoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                      </Button>
                    </div>
                    {promoError && <p className="text-xs text-destructive">{promoError}</p>}
                  </div>
                )}
              </div>

              {fulfillment === "shipping" && (
                <p className="text-xs text-muted-foreground mt-2">
                  + shipping (to be confirmed)
                </p>
              )}

              {/* Store info */}
              <div className="mt-6 pt-6 border-t border-border space-y-3 text-sm">
                {addressDisplay && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Kore Tires</p>
                      <p className="text-muted-foreground">{addressDisplay}</p>
                    </div>
                  </div>
                )}
                {hoursDisplay && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">{hoursDisplay}</span>
                  </div>
                )}
                {phoneDisplay && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-primary" />
                    <a href={`tel:${formatPhone(phoneDisplay)}`} className="text-primary hover:underline">
                      {phoneDisplay}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
