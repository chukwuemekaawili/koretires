import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Package, FileText, Calendar, User, Clock, 
  Phone, ArrowRight, Loader2, CheckCircle, Search, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Order {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  gst: number;
  total: number;
  fulfillment_method: string;
  created_at: string;
}

interface ServiceBooking {
  id: string;
  service_type: string;
  status: string;
  preferred_date: string | null;
  preferred_time: string | null;
  created_at: string;
}

interface MobileSwapBooking {
  id: string;
  service_type: string;
  status: string;
  preferred_date: string;
  preferred_time_window: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500",
  confirmed: "bg-blue-500/10 text-blue-500",
  ready: "bg-green-500/10 text-green-500",
  completed: "bg-green-500/10 text-green-500",
  cancelled: "bg-red-500/10 text-red-500",
  new: "bg-yellow-500/10 text-yellow-500",
  scheduled: "bg-blue-500/10 text-blue-500",
  paid: "bg-green-500/10 text-green-500",
  draft: "bg-muted text-muted-foreground",
};

// Rate limiting for claim attempts
const CLAIM_RATE_LIMIT = 5;
const CLAIM_RATE_WINDOW = 60000; // 1 minute

export default function CustomerDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { companyInfo } = useCompanyInfo();
  const { toast } = useToast();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [serviceBookings, setServiceBookings] = useState<ServiceBooking[]>([]);
  const [mobileSwapBookings, setMobileSwapBookings] = useState<MobileSwapBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Claim order state
  const [claimOrderNumber, setClaimOrderNumber] = useState("");
  const [claimContact, setClaimContact] = useState("");
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimAttempts, setClaimAttempts] = useState<number[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch orders (including claimed orders)
      const [ordersRes, claimedRes, serviceRes, mobileRes] = await Promise.all([
        supabase
          .from("orders")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("claimed_orders")
          .select("order_id")
          .eq("user_id", user.id),
        supabase
          .from("service_bookings")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("mobile_swap_bookings")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      let allOrders = ordersRes.data || [];
      
      // Fetch claimed orders
      if (claimedRes.data && claimedRes.data.length > 0) {
        const claimedOrderIds = claimedRes.data.map(c => c.order_id);
        const { data: claimedOrders } = await supabase
          .from("orders")
          .select("*")
          .in("id", claimedOrderIds);
        
        if (claimedOrders) {
          // Merge without duplicates
          const existingIds = new Set(allOrders.map(o => o.id));
          const uniqueClaimedOrders = claimedOrders.filter(o => !existingIds.has(o.id));
          allOrders = [...allOrders, ...uniqueClaimedOrders].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        }
      }

      setOrders(allOrders);
      setServiceBookings(serviceRes.data || []);
      setMobileSwapBookings(mobileRes.data || []);
    } catch (err) {
      console.error("Error fetching customer data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Rate limiting check
    const now = Date.now();
    const recentAttempts = claimAttempts.filter(t => now - t < CLAIM_RATE_WINDOW);
    if (recentAttempts.length >= CLAIM_RATE_LIMIT) {
      toast({
        title: "Too many attempts",
        description: "Please wait a minute before trying again.",
        variant: "destructive",
      });
      return;
    }

    setClaimAttempts([...recentAttempts, now]);
    setIsClaiming(true);

    try {
      // Find the order by order number
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("id, customer_id, user_id")
        .eq("order_number", claimOrderNumber.trim().toUpperCase())
        .maybeSingle();

      if (orderError || !orderData) {
        toast({
          title: "Order not found",
          description: "Please check your order number and try again.",
          variant: "destructive",
        });
        setIsClaiming(false);
        return;
      }

      // Check if already claimed or owned
      if (orderData.user_id === user.id) {
        toast({
          title: "Already linked",
          description: "This order is already linked to your account.",
        });
        setIsClaiming(false);
        return;
      }

      // Check if already claimed by someone
      const { data: existingClaim } = await supabase
        .from("claimed_orders")
        .select("id")
        .eq("order_id", orderData.id)
        .maybeSingle();

      if (existingClaim) {
        toast({
          title: "Order already claimed",
          description: "This order has already been claimed by another account.",
          variant: "destructive",
        });
        setIsClaiming(false);
        return;
      }

      // Verify contact matches customer
      if (orderData.customer_id) {
        const { data: customer } = await supabase
          .from("customers")
          .select("email, phone")
          .eq("id", orderData.customer_id)
          .maybeSingle();

        if (customer) {
          const contactLower = claimContact.trim().toLowerCase();
          const emailMatch = customer.email?.toLowerCase() === contactLower;
          const phoneMatch = customer.phone?.replace(/\D/g, "") === claimContact.replace(/\D/g, "");

          if (!emailMatch && !phoneMatch) {
            toast({
              title: "Verification failed",
              description: "The email or phone doesn't match the order's contact information.",
              variant: "destructive",
            });
            setIsClaiming(false);
            return;
          }
        }
      }

      // Create claim record
      const { error: claimError } = await supabase
        .from("claimed_orders")
        .insert({
          order_id: orderData.id,
          user_id: user.id,
          verification_method: claimContact.includes("@") ? "email" : "phone",
        });

      if (claimError) {
        console.error("Claim error:", claimError);
        toast({
          title: "Failed to claim order",
          description: "An error occurred. Please try again.",
          variant: "destructive",
        });
        setIsClaiming(false);
        return;
      }

      toast({
        title: "Order claimed!",
        description: "The order has been linked to your account.",
      });

      setClaimOrderNumber("");
      setClaimContact("");
      fetchData();
    } catch (err) {
      console.error("Error claiming order:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsClaiming(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container py-24 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/dealers" replace />;
  }

  const allBookings = [
    ...serviceBookings.map(b => ({ ...b, type: "service" as const })),
    ...mobileSwapBookings.map(b => ({ ...b, type: "mobile" as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <Layout>
      <div className="container py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl font-bold mb-2">My Account</h1>
          <p className="text-muted-foreground">
            View your orders, bookings, and account information.
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bento-card text-center"
          >
            <Package className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{orders.length}</p>
            <p className="text-sm text-muted-foreground">Orders</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bento-card text-center"
          >
            <Calendar className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{allBookings.length}</p>
            <p className="text-sm text-muted-foreground">Bookings</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bento-card text-center"
          >
            <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {orders.filter(o => o.status === "completed").length}
            </p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bento-card text-center"
          >
            <Clock className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {orders.filter(o => o.status === "pending" || o.status === "confirmed").length}
            </p>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </motion.div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="orders" className="space-y-6">
            <TabsList>
              <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
              <TabsTrigger value="bookings">Bookings ({allBookings.length})</TabsTrigger>
              <TabsTrigger value="claim">Claim Order</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
            </TabsList>

            {/* Orders Tab */}
            <TabsContent value="orders">
              {orders.length === 0 ? (
                <div className="bento-card text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No orders yet</h3>
                  <p className="text-muted-foreground mb-4">Browse our tire selection and place your first order.</p>
                  <Button variant="hero" asChild>
                    <Link to="/shop">Shop Tires</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bento-card"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{order.order_number}</h3>
                            <Badge className={statusColors[order.status] || "bg-muted"}>
                              {order.status}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span>{format(new Date(order.created_at), "MMM d, yyyy")}</span>
                            <span className="capitalize">{order.fulfillment_method}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-primary">${Number(order.total).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">incl. GST</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Bookings Tab */}
            <TabsContent value="bookings">
              {allBookings.length === 0 ? (
                <div className="bento-card text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No bookings yet</h3>
                  <p className="text-muted-foreground mb-4">Book a service or mobile tire swap.</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <Button variant="hero" asChild>
                      <Link to="/services">Book Service</Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to="/mobile-swap">Mobile Swap</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {allBookings.map((booking) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bento-card"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold capitalize">{booking.service_type.replace(/_/g, " ")}</h3>
                            <Badge className={statusColors[booking.status] || "bg-muted"}>
                              {booking.status}
                            </Badge>
                            <Badge variant="outline">
                              {booking.type === "mobile" ? "Mobile" : "In-Store"}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span>Requested: {format(new Date(booking.created_at), "MMM d, yyyy")}</span>
                            {booking.preferred_date && (
                              <span>Preferred: {format(new Date(booking.preferred_date), "MMM d, yyyy")}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Claim Order Tab */}
            <TabsContent value="claim">
              <div className="max-w-lg mx-auto">
                <div className="bento-card">
                  <div className="flex items-center gap-3 mb-4">
                    <Search className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Claim a Guest Order</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    If you placed an order as a guest, you can link it to your account by entering your order number 
                    and the email or phone you used at checkout.
                  </p>

                  <form onSubmit={handleClaimOrder} className="space-y-4">
                    <div>
                      <Label htmlFor="orderNumber">Order Number</Label>
                      <Input
                        id="orderNumber"
                        value={claimOrderNumber}
                        onChange={(e) => setClaimOrderNumber(e.target.value)}
                        placeholder="e.g., KT-20250119-1234"
                        className="mt-1.5"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact">Email or Phone (used at checkout)</Label>
                      <Input
                        id="contact"
                        value={claimContact}
                        onChange={(e) => setClaimContact(e.target.value)}
                        placeholder="email@example.com or 780-555-1234"
                        className="mt-1.5"
                        required
                      />
                    </div>
                    <Button type="submit" variant="hero" className="w-full" disabled={isClaiming}>
                      {isClaiming ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4" />
                          Claim Order
                        </>
                      )}
                    </Button>
                  </form>

                  <div className="mt-6 p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                    <div className="flex gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <p>
                        For security, we verify that the email or phone matches what was used when placing the order.
                        If you're having trouble, please contact us.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Account Tab */}
            <TabsContent value="account">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bento-card">
                  <div className="flex items-center gap-3 mb-4">
                    <User className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Account Details</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p>{user.email}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Member Since</p>
                      <p>{format(new Date(user.created_at), "MMMM yyyy")}</p>
                    </div>
                  </div>
                </div>

                <div className="bento-card">
                  <div className="flex items-center gap-3 mb-4">
                    <Phone className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Need Help?</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Questions about your orders or bookings? We're here to help.
                  </p>
                  <div className="space-y-2">
                    <Button variant="hero" className="w-full" asChild>
                      <a href={`tel:${companyInfo.contact.phone}`}>
                        <Phone className="h-4 w-4" />
                        Call {companyInfo.contact.phone}
                      </a>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/contact">
                        Contact Support
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
}
