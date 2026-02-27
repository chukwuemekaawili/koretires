import { useState, useEffect, useRef } from "react";
import { Loader2, FileText, Plus, Search, Download, Printer, Eye, DollarSign, Calendar, User, Building, Send, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Json } from "@/integrations/supabase/types";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  type: string | null;
  status: string | null;
  subtotal: number;
  gst: number;
  total: number;
  line_items: Json;
  notes: string | null;
  due_date: string | null;
  paid_at: string | null;
  order_id: string | null;
  customer_id: string | null;
  dealer_id: string | null;
  created_at: string;
}

interface Order {
  id: string;
  order_number: string;
  subtotal: number;
  gst: number;
  total: number;
  customer_id: string | null;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface Dealer {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
}

interface Product {
  id: string;
  size: string;
  pattern: string | null;
  description: string | null;
  price: number;
  dealer_price: number | null;
}

const statusOptions = [
  { value: "draft", label: "Draft", color: "bg-muted" },
  { value: "sent", label: "Sent", color: "bg-primary" },
  { value: "paid", label: "Paid", color: "bg-green-500" },
  { value: "overdue", label: "Overdue", color: "bg-destructive" },
  { value: "cancelled", label: "Cancelled", color: "bg-muted" },
];

export function AdminInvoices() {
  const { companyInfo, formatPhone, getFullAddress } = useCompanyInfo();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Form state for new invoice
  const [formData, setFormData] = useState({
    type: "retail",
    order_id: "",
    customer_id: "",
    dealer_id: "",
    guest_name: "",
    guest_email: "",
    guest_phone: "",
    due_date: "",
    notes: "",
    apply_ab_levy: false,
    line_items: [{ description: "", quantity: 1, unit_price: 0, total: 0 }] as LineItem[],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invoicesRes, ordersRes, customersRes, dealersRes, productsRes] = await Promise.all([
        supabase.from("invoices").select("*").order("created_at", { ascending: false }),
        supabase.from("orders").select("id, order_number, subtotal, gst, total, customer_id").order("created_at", { ascending: false }).limit(50),
        supabase.from("customers").select("id, name, email, phone").limit(100),
        supabase.from("dealers").select("id, business_name, contact_name, email").eq("status", "approved"),
        supabase.from("products").select("id, size, pattern, description, price, dealer_price").eq("is_active", true).order("size", { ascending: true }),
      ]);

      if (invoicesRes.error) throw invoicesRes.error;
      setInvoices(invoicesRes.data || []);
      setOrders(ordersRes.data || []);
      setCustomers(customersRes.data || []);
      setDealers(dealersRes.data || []);
      setProducts(productsRes.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Failed to load invoices");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotals = (items: LineItem[], applyAbLevy = false) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const totalTires = items.reduce((sum, item) => sum + item.quantity, 0);
    const abLevy = applyAbLevy ? totalTires * 4.00 : 0;

    // GST applies to subtotal + abLevy
    const gst = (subtotal + abLevy) * 0.05;
    return { subtotal, gst, abLevy, total: subtotal + abLevy + gst };
  };

  const updateLineItem = (index: number, field: keyof LineItem | 'product_id', value: string | number) => {
    const newItems = [...formData.line_items];

    if (field === 'product_id') {
      const selectedProduct = products.find(p => p.id === value);
      if (selectedProduct) {
        newItems[index].description = `${selectedProduct.size} ${selectedProduct.pattern || ''} ${selectedProduct.description || ''}`.trim();
        const priceToUse = formData.type === 'dealer' && selectedProduct.dealer_price ? selectedProduct.dealer_price : selectedProduct.price;
        newItems[index].unit_price = priceToUse;
        newItems[index].total = newItems[index].quantity * priceToUse;
      }
    } else {
      (newItems[index] as any)[field] = value;
      // Recalculate total for this line
      if (field === "quantity" || field === "unit_price") {
        newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
      }
    }

    setFormData({ ...formData, line_items: newItems });
  };

  const addLineItem = () => {
    setFormData({
      ...formData,
      line_items: [...formData.line_items, { description: "", quantity: 1, unit_price: 0, total: 0 }],
    });
  };

  const removeLineItem = (index: number) => {
    const newItems = formData.line_items.filter((_, i) => i !== index);
    setFormData({ ...formData, line_items: newItems.length > 0 ? newItems : [{ description: "", quantity: 1, unit_price: 0, total: 0 }] });
  };

  const createFromOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    setFormData({
      ...formData,
      order_id: orderId,
      customer_id: order.customer_id || "",
      line_items: [{
        description: `Order ${order.order_number}`,
        quantity: 1,
        unit_price: order.subtotal,
        total: order.subtotal,
      }],
    });
  };

  const handleCreate = async () => {
    setIsSaving(true);
    try {
      const { subtotal, gst, abLevy, total } = calculateTotals(formData.line_items, formData.apply_ab_levy);

      // Generate a temporary invoice number (will be replaced by trigger if exists)
      const tempInvoiceNumber = `INV-${Date.now()}`;

      // If guest email is provided, subscribe them to the newsletter
      if (formData.guest_email) {
        await supabase.from("newsletter_subscribers").upsert({
          email: formData.guest_email.toLowerCase(),
          name: formData.guest_name || null,
          source: "invoice_capture"
        }, { onConflict: "email" });
      }

      const { error } = await supabase.from("invoices").insert({
        invoice_number: tempInvoiceNumber,
        type: formData.type,
        order_id: formData.order_id || null,
        customer_id: formData.customer_id || null,
        dealer_id: formData.dealer_id || null,
        due_date: formData.due_date || null,
        notes: formData.notes || null,
        line_items: formData.line_items as unknown as Json,
        subtotal,
        gst,
        ab_levy: abLevy,
        total,
        status: "draft",
        guest_phone: formData.guest_phone || null,
      });

      if (error) throw error;
      toast.success("Invoice created");
      setIsCreateOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error("Error creating invoice:", err);
      toast.error("Failed to create invoice");
    } finally {
      setIsSaving(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const updates: any = { status };
      if (status === "paid") {
        updates.paid_at = new Date().toISOString();
      }

      const { error } = await supabase.from("invoices").update(updates).eq("id", id);
      if (error) throw error;
      toast.success("Invoice status updated");
      fetchData();
    } catch (err) {
      toast.error("Failed to update invoice");
    }
  };

  const resetForm = () => {
    setFormData({
      type: "retail",
      order_id: "",
      customer_id: "",
      dealer_id: "",
      guest_name: "",
      guest_email: "",
      guest_phone: "",
      due_date: "",
      notes: "",
      apply_ab_levy: false,
      line_items: [{ description: "", quantity: 1, unit_price: 0, total: 0 }],
    });
  };

  // Send invoice email
  const handleSendInvoice = async (invoice: Invoice) => {
    // Get recipient email based on invoice type
    let recipientEmail = "";
    let recipientName = "";

    if (invoice.customer_id) {
      const customer = customers.find(c => c.id === invoice.customer_id);
      if (customer) {
        recipientEmail = customer.email;
        recipientName = customer.name;
      }
    } else if (invoice.dealer_id) {
      const dealer = dealers.find(d => d.id === invoice.dealer_id);
      if (dealer) {
        recipientEmail = dealer.email;
        recipientName = dealer.business_name;
      }
    }

    if (!recipientEmail) {
      toast.error("No recipient email found for this invoice");
      return;
    }

    setIsSending(true);
    try {
      // Queue notification via database
      const { error } = await supabase.from("notifications").insert({
        type: "invoice",
        to_email: recipientEmail,
        subject: `Invoice ${invoice.invoice_number} from Kore Tires`,
        payload: {
          invoice_number: invoice.invoice_number,
          recipient_name: recipientName,
          total: invoice.total,
          due_date: invoice.due_date,
          line_items: invoice.line_items,
        },
        status: "queued"
      });

      if (error) throw error;

      // Update invoice status to sent if it was draft
      if (invoice.status === "draft") {
        await supabase.from("invoices").update({ status: "sent" }).eq("id", invoice.id);
      }

      // Log to audit
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("audit_log").insert({
        table_name: "invoices",
        action: "INVOICE_SENT",
        record_id: invoice.id,
        new_values: { sent_to: recipientEmail, sent_at: new Date().toISOString() },
        user_id: user?.id
      });

      toast.success(`Invoice sent to ${recipientEmail}`);
      fetchData();
    } catch (err) {
      console.error("Failed to send invoice:", err);
      toast.error("Failed to send invoice");
    } finally {
      setIsSending(false);
    }
  };
  const handlePrint = () => {
    if (!printRef.current) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups for printing");
      return;
    }

    const styles = `
      <style>
        body { font-family: system-ui, sans-serif; margin: 40px; color: #333; }
        .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .logo { font-size: 24px; font-weight: bold; }
        .invoice-details { text-align: right; }
        .invoice-number { font-size: 20px; font-weight: bold; }
        .section { margin-bottom: 30px; }
        .section-title { font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { text-align: left; padding: 10px; border-bottom: 1px solid #eee; }
        th { background: #f5f5f5; font-weight: 600; }
        .text-right { text-align: right; }
        .totals { margin-left: auto; width: 300px; }
        .totals td { padding: 8px 0; }
        .total-row { font-weight: bold; font-size: 18px; border-top: 2px solid #333; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        @media print { body { margin: 20px; } }
      </style>
    `;

    const invoiceData = selectedInvoice;
    if (!invoiceData) return;

    const lineItems = Array.isArray(invoiceData.line_items) ? invoiceData.line_items as unknown as LineItem[] : [];

    let billToDetails = "";
    if (invoiceData.type === "dealer" && invoiceData.dealer_id) {
      const dealer = dealers.find(d => d.id === invoiceData.dealer_id);
      if (dealer) {
        billToDetails = `
          <div><strong>${dealer.business_name}</strong></div>
          <div>Contact: ${dealer.contact_name}</div>
          <div>Email: ${dealer.email}</div>
          ${(dealer as any).phone ? `<div>Phone: ${(dealer as any).phone}</div>` : ""}
        `;
      }
    } else if (invoiceData.customer_id) {
      const customer = customers.find(c => c.id === invoiceData.customer_id);
      if (customer) {
        billToDetails = `
          <div><strong>${customer.name}</strong></div>
          <div>Email: ${customer.email}</div>
          ${customer.phone ? `<div>Phone: ${customer.phone}</div>` : ""}
        `;
      }
    } else {
      billToDetails = `
        <div><strong>${(invoiceData as any).guest_name || "Guest Details"}</strong></div>
        ${(invoiceData as any).guest_email ? `<div>Email: ${(invoiceData as any).guest_email}</div>` : ""}
        ${(invoiceData as any).guest_phone ? `<div>Phone: ${(invoiceData as any).guest_phone}</div>` : ""}
      `;
    }

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoiceData.invoice_number}</title>
        ${styles}
      </head>
      <body>
        <div class="header">
          <div class="logo">KORE TIRES</div>
          <div class="invoice-details">
            <div class="invoice-number">${invoiceData.invoice_number}</div>
            <div>Date: ${format(new Date(invoiceData.created_at), "MMMM d, yyyy")}</div>
            ${invoiceData.due_date ? `<div>Due: ${format(new Date(invoiceData.due_date), "MMMM d, yyyy")}</div>` : ""}
          </div>
        </div>

        <div class="section">
          <div class="section-title">Bill To</div>
          ${billToDetails}
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Unit Price</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${lineItems.map(item => `
              <tr>
                <td>${item.description}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">$${item.unit_price.toFixed(2)}</td>
                <td class="text-right">$${item.total.toFixed(2)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <table class="totals">
          <tr>
            <td>Subtotal:</td>
            <td class="text-right">$${invoiceData.subtotal.toFixed(2)}</td>
          </tr>
          ${(invoiceData as any).ab_levy && (invoiceData as any).ab_levy > 0 ? `
          <tr>
            <td>Alberta Tire Levy:</td>
            <td class="text-right">$${Number((invoiceData as any).ab_levy).toFixed(2)}</td>
          </tr>
          ` : ""}
          <tr>
            <td>GST (5%):</td>
            <td class="text-right">$${invoiceData.gst.toFixed(2)}</td>
          </tr>
          <tr class="total-row">
            <td>Total:</td>
            <td class="text-right">$${invoiceData.total.toFixed(2)}</td>
          </tr>
        </table>

        ${invoiceData.notes ? `<div class="section"><div class="section-title">Notes</div><p>${invoiceData.notes}</p></div>` : ""}

        <div class="footer">
          <p>Kore Tires${getFullAddress() ? ` | ${getFullAddress()}` : ''}${companyInfo.contact.phone ? ` | Tel: ${companyInfo.contact.phone}` : ''}</p>
          <p>Thank you for your business!</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch = inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totals = calculateTotals(formData.line_items, formData.apply_ab_levy);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {statusOptions.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="hero">
                <Plus className="h-4 w-4" />
                New Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Invoice</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Invoice type and links */}
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="dealer">Dealer</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>From Order</Label>
                    <Select value={formData.order_id} onValueChange={createFromOrder}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select order..." />
                      </SelectTrigger>
                      <SelectContent>
                        {orders.map((o) => (
                          <SelectItem key={o.id} value={o.id}>
                            {o.order_number} (${o.total.toFixed(2)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Customer/Dealer selection */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {formData.type !== "dealer" ? (
                    <>
                      <div>
                        <Label>Customer (Registered)</Label>
                        <Select value={formData.customer_id} onValueChange={(v) => setFormData({ ...formData, customer_id: v })}>
                          <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder="Select existing customer..." />
                          </SelectTrigger>
                          <SelectContent>
                            {customers.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.name} ({c.email})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {!formData.customer_id && (
                        <div className="space-y-3">
                          <Label>Guest Name</Label>
                          <Input
                            value={formData.guest_name}
                            onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                            placeholder="For new customers"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label>Email</Label>
                              <Input
                                type="email"
                                value={formData.guest_email}
                                onChange={(e) => setFormData({ ...formData, guest_email: e.target.value })}
                                placeholder="For marketing"
                              />
                            </div>
                            <div>
                              <Label>Phone</Label>
                              <Input
                                type="tel"
                                value={formData.guest_phone || ""}
                                onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
                                placeholder="Optional"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div>
                      <Label>Dealer</Label>
                      <Select value={formData.dealer_id} onValueChange={(v) => setFormData({ ...formData, dealer_id: v })}>
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select dealer..." />
                        </SelectTrigger>
                        <SelectContent>
                          {dealers.map((d) => (
                            <SelectItem key={d.id} value={d.id}>{d.business_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Line items */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-base font-semibold">Line Items</Label>
                    <Button variant="outline" size="sm" onClick={addLineItem}>
                      <Plus className="h-4 w-4" />
                      Add Item
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {formData.line_items.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-12 mb-2">
                          <Label className="text-xs">Quick Add Tire</Label>
                          <Select onValueChange={(v) => updateLineItem(index, 'product_id', v)}>
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Select a tire..." />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map(p => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.size} {p.pattern} - ${p.price}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-5">
                          <Label className="text-xs">Description</Label>
                          <Input
                            value={item.description}
                            onChange={(e) => updateLineItem(index, "description", e.target.value)}
                            placeholder="Item description"
                            className="mt-1"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Qty</Label>
                          <Input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updateLineItem(index, "quantity", parseInt(e.target.value) || 1)}
                            className="mt-1"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Unit Price</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => updateLineItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                            className="mt-1"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Total</Label>
                          <p className="mt-1 py-2 px-3 bg-muted rounded-md font-medium">${item.total.toFixed(2)}</p>
                        </div>
                        <div className="col-span-1">
                          <Button variant="ghost" size="icon" onClick={() => removeLineItem(index)} className="h-9 w-9">
                            ×
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="ab_levy"
                      checked={formData.apply_ab_levy}
                      onChange={(e) => setFormData({ ...formData, apply_ab_levy: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="ab_levy" className="font-normal">Apply Alberta Tire Levy ($4/tire)</Label>
                  </div>
                </div>

                {/* Totals */}
                <div className="flex justify-end">
                  <div className="w-64 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span>${totals.subtotal.toFixed(2)}</span>
                    </div>
                    {formData.apply_ab_levy && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Alberta Levy:</span>
                        <span>${totals.abLevy.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">GST (5%):</span>
                      <span>${totals.gst.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-base">
                      <span>Total:</span>
                      <span>${totals.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes..."
                    className="mt-1.5"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button variant="hero" className="flex-1" onClick={handleCreate} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                    Create Invoice
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bento-card">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{invoices.length}</p>
            <p className="text-sm text-muted-foreground">Total Invoices</p>
          </CardContent>
        </Card>
        <Card className="bento-card">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-green-500">
              ${invoices.filter(i => i.status === "paid").reduce((sum, i) => sum + i.total, 0).toFixed(0)}
            </p>
            <p className="text-sm text-muted-foreground">Paid</p>
          </CardContent>
        </Card>
        <Card className="bento-card">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-primary">
              ${invoices.filter(i => i.status === "sent").reduce((sum, i) => sum + i.total, 0).toFixed(0)}
            </p>
            <p className="text-sm text-muted-foreground">Outstanding</p>
          </CardContent>
        </Card>
        <Card className="bento-card">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-destructive">
              {invoices.filter(i => i.status === "overdue").length}
            </p>
            <p className="text-sm text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card className="bento-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoices ({filteredInvoices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">{invoice.type}</Badge>
                    </TableCell>
                    <TableCell>{format(new Date(invoice.created_at), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      {invoice.due_date ? format(new Date(invoice.due_date), "MMM d, yyyy") : "-"}
                    </TableCell>
                    <TableCell className="font-semibold">${invoice.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Select
                        value={invoice.status || "draft"}
                        onValueChange={(v) => updateStatus(invoice.id, v)}
                      >
                        <SelectTrigger className="w-28 h-8">
                          <Badge className={statusOptions.find(s => s.value === invoice.status)?.color}>
                            {statusOptions.find(s => s.value === invoice.status)?.label || invoice.status}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedInvoice(invoice);
                          }}
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setTimeout(handlePrint, 100);
                          }}
                          title="Print"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSendInvoice(invoice)}
                          disabled={isSending}
                          title="Send Email"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Preview Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Invoice {selectedInvoice?.invoice_number}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                {selectedInvoice && (
                  <Button
                    variant="hero"
                    size="sm"
                    onClick={() => handleSendInvoice(selectedInvoice)}
                    disabled={isSending}
                  >
                    {isSending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    Send Email
                  </Button>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div ref={printRef} className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">{format(new Date(selectedInvoice.created_at), "MMMM d, yyyy")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Due Date</p>
                  <p className="font-medium">
                    {selectedInvoice.due_date ? format(new Date(selectedInvoice.due_date), "MMMM d, yyyy") : "N/A"}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(selectedInvoice.line_items) ? selectedInvoice.line_items as unknown as LineItem[] : []).map((item, i) => (
                      <TableRow key={i}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">${item.unit_price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${item.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end">
                <div className="w-64 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>${selectedInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST (5%):</span>
                    <span>${selectedInvoice.gst.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total:</span>
                    <span>${selectedInvoice.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}