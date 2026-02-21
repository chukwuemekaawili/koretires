import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShoppingCart, Users, Building, Truck, Calendar,
  Loader2, AlertCircle, RefreshCw, MessageSquare,
  HelpCircle, Wrench, FileText, Bell, Package,
  Settings, Mail, History, CreditCard, Layers, Boxes, UserCircle, Tag, BarChart3, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Admin components
import { AdminOrders } from "@/components/admin/AdminOrders";
import { AdminDealers } from "@/components/admin/AdminDealers";
import { AdminProducts } from "@/components/admin/AdminProducts";
import { AdminAddons } from "@/components/admin/AdminAddons";
import { AdminMobileSwap } from "@/components/admin/AdminMobileSwap";
import { AdminSubscriptions } from "@/components/admin/AdminSubscriptions";
import { AdminConversations } from "@/components/admin/AdminConversations";
import { AdminLeads } from "@/components/admin/AdminLeads";
import { AdminFAQs } from "@/components/admin/AdminFAQs";
import { AdminServices } from "@/components/admin/AdminServices";
import { AdminPolicies } from "@/components/admin/AdminPolicies";
import { AdminNotifications } from "@/components/admin/AdminNotifications";
import { AdminInvoices } from "@/components/admin/AdminInvoices";
import { AdminNewsletter } from "@/components/admin/AdminNewsletter";
import { AdminAuditLog } from "@/components/admin/AdminAuditLog";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { AdminPages } from "@/components/admin/AdminPages";
import { AdminInventory } from "@/components/admin/AdminInventory";
import { AdminCustomers } from "@/components/admin/AdminCustomers";
import { AdminPromoCodes } from "@/components/admin/AdminPromoCodes";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";
import { AdminAppointments } from "@/components/admin/AdminAppointments";
import { AdminReviews } from "@/components/admin/AdminReviews";
import { AdminReferrals } from "@/components/admin/AdminReferrals";
import { AdminBundles } from "@/components/admin/AdminBundles";

interface Stats {
  orders: number;
  dealers: number;
  leads: number;
  notifications: number;
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [stats, setStats] = useState<Stats>({ orders: 0, dealers: 0, leads: 0, notifications: 0 });
  const [loading, setLoading] = useState(true);

  // Check if user is admin
  useEffect(() => {
    async function checkAdminRole() {
      if (!user) {
        setCheckingAdmin(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["admin", "staff"])
        .maybeSingle();

      if (error) {
        console.error("Error checking admin role:", error);
        setIsAdmin(false);
      } else {
        setIsAdmin(!!data);
      }
      setCheckingAdmin(false);
    }

    if (!authLoading) {
      checkAdminRole();
    }
  }, [user, authLoading]);

  // Fetch stats
  const fetchStats = async () => {
    setLoading(true);
    try {
      const [ordersRes, dealersRes, leadsRes, notificationsRes] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("dealers").select("id", { count: "exact", head: true }),
        supabase.from("ai_leads").select("id", { count: "exact", head: true }),
        supabase.from("notifications").select("id", { count: "exact", head: true }).eq("status", "queued"),
      ]);

      setStats({
        orders: ordersRes.count || 0,
        dealers: dealersRes.count || 0,
        leads: leadsRes.count || 0,
        notifications: notificationsRes.count || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  // Loading & auth checks
  if (authLoading || checkingAdmin) {
    return (
      <Layout>
        <div className="container py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">Please sign in to access the admin dashboard.</p>
          <Button variant="hero" onClick={() => navigate("/admin/login")}>
            Sign In
          </Button>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">Admin Access Required</h1>
          <p className="text-muted-foreground mb-6">You don't have permission to access this page.</p>
          <Button variant="outline" onClick={() => navigate("/")}>
            Go Home
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage orders, leads, content, and settings</p>
          </div>
          <Button variant="outline" onClick={fetchStats} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bento-card"
          >
            <ShoppingCart className="h-8 w-8 text-primary mb-2" />
            <p className="text-2xl font-bold">{stats.orders}</p>
            <p className="text-sm text-muted-foreground">Total Orders</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bento-card"
          >
            <Building className="h-8 w-8 text-primary mb-2" />
            <p className="text-2xl font-bold">{stats.dealers}</p>
            <p className="text-sm text-muted-foreground">Dealers</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bento-card"
          >
            <Users className="h-8 w-8 text-primary mb-2" />
            <p className="text-2xl font-bold">{stats.leads}</p>
            <p className="text-sm text-muted-foreground">AI Leads</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bento-card"
          >
            <Bell className="h-8 w-8 text-yellow-500 mb-2" />
            <p className="text-2xl font-bold">{stats.notifications}</p>
            <p className="text-sm text-muted-foreground">Pending Notifications</p>
          </motion.div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-1 bg-secondary/50 p-1">
            <TabsTrigger value="analytics" className="gap-1.5">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-1.5">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Orders</span>
            </TabsTrigger>
            <TabsTrigger value="leads" className="gap-1.5">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">AI Leads</span>
            </TabsTrigger>
            <TabsTrigger value="conversations" className="gap-1.5">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Conversations</span>
            </TabsTrigger>
            <TabsTrigger value="dealers" className="gap-1.5">
              <Building className="h-4 w-4" />
              <span className="hidden sm:inline">Dealers</span>
            </TabsTrigger>
            <TabsTrigger value="customers" className="gap-1.5">
              <UserCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Customers</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-1.5">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Products</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="gap-1.5">
              <Boxes className="h-4 w-4" />
              <span className="hidden sm:inline">Inventory</span>
            </TabsTrigger>
            <TabsTrigger value="addons" className="gap-1.5">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Add-ons</span>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="gap-1.5">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Invoices</span>
            </TabsTrigger>
            <TabsTrigger value="mobileswap" className="gap-1.5">
              <Truck className="h-4 w-4" />
              <span className="hidden sm:inline">Mobile Swap</span>
            </TabsTrigger>
            <TabsTrigger value="appointments" className="gap-1.5">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Appointments</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-1.5">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">Reviews</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-1.5">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Subscriptions</span>
            </TabsTrigger>
            <TabsTrigger value="faqs" className="gap-1.5">
              <HelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">FAQs</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="gap-1.5">
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">Services</span>
            </TabsTrigger>
            <TabsTrigger value="policies" className="gap-1.5">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Policies</span>
            </TabsTrigger>
            <TabsTrigger value="newsletter" className="gap-1.5">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Newsletter</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="auditlog" className="gap-1.5">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Audit Log</span>
            </TabsTrigger>
            <TabsTrigger value="pages" className="gap-1.5">
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">Pages</span>
            </TabsTrigger>
            <TabsTrigger value="promocodes" className="gap-1.5">
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">Promo Codes</span>
            </TabsTrigger>
            <TabsTrigger value="referrals" className="gap-1.5">
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">Referrals</span>
            </TabsTrigger>
            <TabsTrigger value="bundles" className="gap-1.5">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Bundle Deals</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics"><AdminAnalytics /></TabsContent>
          <TabsContent value="orders"><AdminOrders /></TabsContent>
          <TabsContent value="leads"><AdminLeads /></TabsContent>
          <TabsContent value="conversations"><AdminConversations /></TabsContent>
          <TabsContent value="dealers"><AdminDealers /></TabsContent>
          <TabsContent value="customers"><AdminCustomers /></TabsContent>
          <TabsContent value="products"><AdminProducts /></TabsContent>
          <TabsContent value="inventory"><AdminInventory /></TabsContent>
          <TabsContent value="addons"><AdminAddons /></TabsContent>
          <TabsContent value="invoices"><AdminInvoices /></TabsContent>
          <TabsContent value="mobileswap"><AdminMobileSwap /></TabsContent>
          <TabsContent value="appointments"><AdminAppointments /></TabsContent>
          <TabsContent value="reviews"><AdminReviews /></TabsContent>
          <TabsContent value="subscriptions"><AdminSubscriptions /></TabsContent>
          <TabsContent value="faqs"><AdminFAQs /></TabsContent>
          <TabsContent value="services"><AdminServices /></TabsContent>
          <TabsContent value="policies"><AdminPolicies /></TabsContent>
          <TabsContent value="newsletter"><AdminNewsletter /></TabsContent>
          <TabsContent value="notifications"><AdminNotifications /></TabsContent>
          <TabsContent value="auditlog"><AdminAuditLog /></TabsContent>
          <TabsContent value="pages"><AdminPages /></TabsContent>
          <TabsContent value="promocodes"><AdminPromoCodes /></TabsContent>
          <TabsContent value="referrals"><AdminReferrals /></TabsContent>
          <TabsContent value="bundles"><AdminBundles /></TabsContent>
          <TabsContent value="settings"><AdminSettings /></TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}