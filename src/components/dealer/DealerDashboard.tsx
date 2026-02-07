import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building, ArrowRight, Package, FileText, MessageSquare,
  ShoppingCart, Clock, CheckCircle2, AlertCircle, Send, Loader2, Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";

interface Quote {
  id: string;
  created_at: string;
  status: string | null;
  items: Json;
  notes: string | null;
  quoted_total: number | null;
  valid_until: string | null;
}

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  status: string | null;
  total: number;
  subtotal: number;
  gst: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  created_at: string;
  status: string | null;
  total: number;
  due_date: string | null;
  pdf_url: string | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500",
  approved: "bg-green-500/10 text-green-500",
  rejected: "bg-red-500/10 text-red-500",
  confirmed: "bg-blue-500/10 text-blue-500",
  ready: "bg-purple-500/10 text-purple-500",
  completed: "bg-green-500/10 text-green-500",
  cancelled: "bg-muted text-muted-foreground",
  paid: "bg-green-500/10 text-green-500",
  overdue: "bg-red-500/10 text-red-500",
};

export function DealerDashboard() {
  const { user, dealerInfo, isApprovedDealer, signOut } = useAuth();
  const { toast } = useToast();
  const { companyInfo, formatPhone } = useCompanyInfo();
  
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quoteRequestOpen, setQuoteRequestOpen] = useState(false);
  const [quoteNotes, setQuoteNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const phoneDisplay = companyInfo.contact.phone || null;

  useEffect(() => {
    if (dealerInfo?.id) {
      fetchDealerData();
    }
  }, [dealerInfo?.id]);

  const fetchDealerData = async () => {
    if (!dealerInfo?.id) return;
    
    setIsLoading(true);
    try {
      // Fetch quotes
      const { data: quotesData } = await supabase
        .from("dealer_quotes")
        .select("*")
        .eq("dealer_id", dealerInfo.id)
        .order("created_at", { ascending: false });

      // Fetch orders linked to this dealer's user
      const { data: ordersData } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      // Fetch invoices linked to this dealer
      const { data: invoicesData } = await supabase
        .from("invoices")
        .select("*")
        .eq("dealer_id", dealerInfo.id)
        .order("created_at", { ascending: false });

      setQuotes(quotesData || []);
      setOrders(ordersData || []);
      setInvoices(invoicesData || []);
    } catch (error) {
      console.error("Error fetching dealer data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestQuote = async () => {
    if (!dealerInfo?.id) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("dealer_quotes").insert({
        dealer_id: dealerInfo.id,
        notes: quoteNotes || null,
        items: [],
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Quote Requested",
        description: "We'll review your request and get back to you shortly.",
      });
      
      setQuoteRequestOpen(false);
      setQuoteNotes("");
      fetchDealerData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit quote request.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const parseItems = (items: Json): { size: string; quantity: number }[] => {
    if (Array.isArray(items)) {
      return items as { size: string; quantity: number }[];
    }
    return [];
  };

  if (!isApprovedDealer) {
    return (
      <div className="bento-card text-center py-12">
        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="font-display text-xl font-bold mb-2">Pending Approval</h2>
        <p className="text-muted-foreground mb-6">
          Your dealer application is under review. We'll notify you by email once approved.
        </p>
        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 max-w-md mx-auto">
          <p className="text-sm text-yellow-500">
            Pending applications are typically reviewed within 1-2 business days.
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold mb-1">Dealer Dashboard</h1>
          <p className="text-muted-foreground">{dealerInfo?.business_name}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-green-500/10 text-green-500 border-green-500/30">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approved Dealer
          </Badge>
          <Button variant="outline" size="sm" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Link to="/shop" className="bento-card hover:border-primary/50 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Shop Products</h3>
              <p className="text-sm text-muted-foreground">View wholesale pricing</p>
            </div>
            <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </Link>

        <Dialog open={quoteRequestOpen} onOpenChange={setQuoteRequestOpen}>
          <DialogTrigger asChild>
            <button className="bento-card hover:border-primary/50 transition-colors group text-left">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Request Quote</h3>
                  <p className="text-sm text-muted-foreground">Get bulk pricing</p>
                </div>
                <Send className="h-4 w-4 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request a Quote</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="quote-notes">Details</Label>
                <Textarea
                  id="quote-notes"
                  rows={4}
                  placeholder="Describe what you need: tire sizes, quantities, special requirements..."
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Our team will review your request and send you a custom quote within 1 business day.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="hero"
                  className="flex-1"
                  onClick={handleRequestQuote}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Submit Request
                </Button>
                <Button variant="outline" onClick={() => setQuoteRequestOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {phoneDisplay ? (
          <a href={`tel:${formatPhone(phoneDisplay)}`} className="bento-card hover:border-primary/50 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Contact Support</h3>
                <p className="text-sm text-muted-foreground">{phoneDisplay}</p>
              </div>
            </div>
          </a>
        ) : (
          <Link to="/contact" className="bento-card hover:border-primary/50 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Building className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Contact Support</h3>
                <p className="text-sm text-muted-foreground">See Contact page</p>
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="quotes" className="bento-card">
        <TabsList className="mb-6">
          <TabsTrigger value="quotes" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Quotes ({quotes.length})
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <Package className="h-4 w-4" />
            Orders ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-2">
            <FileText className="h-4 w-4" />
            Invoices ({invoices.length})
          </TabsTrigger>
        </TabsList>

        {/* Quotes Tab */}
        <TabsContent value="quotes">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No quote requests yet</p>
              <Button variant="outline" onClick={() => setQuoteRequestOpen(true)}>
                Request Your First Quote
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {quotes.map((quote) => (
                <div key={quote.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/40">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium">Quote Request</span>
                      <Badge className={statusColors[quote.status || "pending"]}>
                        {quote.status || "Pending"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Submitted {formatDate(quote.created_at)}
                      {quote.valid_until && ` • Valid until ${formatDate(quote.valid_until)}`}
                    </p>
                    {quote.notes && (
                      <p className="text-sm text-muted-foreground mt-1 italic">"{quote.notes}"</p>
                    )}
                  </div>
                  {quote.quoted_total !== null && (
                    <div className="text-right">
                      <p className="font-bold text-lg text-primary">${quote.quoted_total.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">Quoted Total</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No orders yet</p>
              <Button variant="outline" asChild>
                <Link to="/shop">Browse Products</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/40">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium font-mono">{order.order_number}</span>
                      <Badge className={statusColors[order.status || "pending"]}>
                        {order.status || "Pending"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Placed {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">${order.total.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      ${order.subtotal.toFixed(2)} + ${order.gst.toFixed(2)} GST
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No invoices yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/40">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium font-mono">{invoice.invoice_number}</span>
                      <Badge className={statusColors[invoice.status || "pending"]}>
                        {invoice.status || "Pending"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Issued {formatDate(invoice.created_at)}
                      {invoice.due_date && ` • Due ${formatDate(invoice.due_date)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-lg">${invoice.total.toFixed(2)}</p>
                    </div>
                    {invoice.pdf_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={invoice.pdf_url} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-4 w-4" />
                          View
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}