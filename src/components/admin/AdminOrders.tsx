import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Eye,
  MoreHorizontal,
  ShoppingCart,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Package,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Order {
  id: string;
  order_number: string;
  status: string;
  fulfillment_method: string;
  subtotal: number;
  gst: number;
  total: number;
  notes: string | null;
  needs_stock_confirmation: boolean | null;
  created_at: string;
  customer_id: string | null;
  customer?: {
    name: string;
    email: string;
    phone: string;
    address: string | null;
    city: string | null;
  };
}

interface OrderItem {
  id: string;
  size: string;
  vendor: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface OrderAddon {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const statusOptions = [
  { value: "pending", label: "Pending", color: "bg-warning" },
  { value: "confirmed", label: "Confirmed", color: "bg-primary" },
  { value: "processing", label: "Processing", color: "bg-primary" },
  { value: "shipped", label: "Shipped", color: "bg-success" },
  { value: "delivered", label: "Delivered", color: "bg-success" },
  { value: "cancelled", label: "Cancelled", color: "bg-destructive" },
];

const fulfillmentLabels: Record<string, string> = {
  pickup: "Warehouse Pickup",
  delivery: "Local Delivery",
  installation: "Installation Service",
  shipping: "Shipping Request",
};

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderAddons, setOrderAddons] = useState<OrderAddon[]>([]);

  useEffect(() => {
    fetchOrders();

    // Subscribe to real-time changes
    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            toast.success("New order received!");
            fetchOrders();
          } else if (payload.eventType === "UPDATE") {
            // Only toast if status changed externally, otherwise just silent refresh
            fetchOrders();
          } else if (payload.eventType === "DELETE") {
            fetchOrders();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          customer:customers(name, email, phone, address, city)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      toast.error("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrderDetails = async (order: Order) => {
    setSelectedOrder(order);

    try {
      const [itemsRes, addonsRes] = await Promise.all([
        supabase.from("order_items").select("*").eq("order_id", order.id),
        supabase.from("order_addons").select("*").eq("order_id", order.id),
      ]);

      setOrderItems(itemsRes.data || []);
      setOrderAddons(addonsRes.data || []);
    } catch (err) {
      console.error("Error fetching order details:", err);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus as any })
        .eq("id", orderId);

      if (error) throw error;
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch (err) {
      console.error("Error updating order:", err);
      toast.error("Failed to update order");
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statusOptions.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <Card className="bento-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Orders ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Fulfillment</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} className={order.needs_stock_confirmation ? "bg-warning/10" : ""}>
                    <TableCell className="font-mono font-medium">
                      <div className="flex items-center gap-2">
                        {order.order_number}
                        {order.needs_stock_confirmation && (
                          <span title="Needs stock confirmation">
                            <AlertTriangle className="h-4 w-4 text-warning" />
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.customer?.name || "Guest"}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.customer?.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="secondary">
                          {fulfillmentLabels[order.fulfillment_method] || order.fulfillment_method}
                        </Badge>
                        {order.needs_stock_confirmation && (
                          <Badge variant="outline" className="text-warning border-warning text-xs">
                            Stock TBD
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${order.total.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={(value) => updateOrderStatus(order.id, value)}
                      >
                        <SelectTrigger className="w-32 h-8">
                          <Badge
                            className={
                              statusOptions.find((s) => s.value === order.status)?.color
                            }
                          >
                            {statusOptions.find((s) => s.value === order.status)?.label}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(order.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => fetchOrderDetails(order)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Order {selectedOrder?.order_number}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Customer</h4>
                  <p>{selectedOrder.customer?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrder.customer?.email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrder.customer?.phone}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Delivery Address</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrder.customer?.address || "N/A"}
                    {selectedOrder.customer?.city && `, ${selectedOrder.customer.city}`}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Order Items */}
              <div>
                <h4 className="font-medium mb-3">Items</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.size}</p>
                            <p className="text-xs text-muted-foreground">{item.vendor}</p>
                          </div>
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>${item.unit_price.toFixed(2)}</TableCell>
                        <TableCell>${item.total_price.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Add-ons */}
              {orderAddons.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Add-ons</h4>
                  <div className="space-y-2">
                    {orderAddons.map((addon) => (
                      <div key={addon.id} className="flex justify-between text-sm">
                        <span>
                          {addon.name} × {addon.quantity}
                        </span>
                        <span>${(addon.price * addon.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST</span>
                  <span>${selectedOrder.gst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>

              {selectedOrder.notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Notes</h4>
                    <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
