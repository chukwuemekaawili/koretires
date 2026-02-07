import { useState, useEffect, useMemo } from "react";
import { 
  Loader2, Users, Search, Filter, Calendar, Car, 
  ShoppingBag, Mail, Phone, MapPin, Eye, Download,
  ChevronDown, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, subDays, subMonths, isAfter, isBefore, parseISO } from "date-fns";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string | null;
  postal_code: string | null;
  created_at: string;
  updated_at: string;
  notes: string | null;
}

interface OrderSummary {
  customer_id: string;
  total_orders: number;
  total_spent: number;
  last_order_date: string | null;
  first_order_date: string | null;
}

interface OrderItem {
  vendor: string | null;
  size: string;
  description: string | null;
}

interface CustomerWithStats extends Customer {
  orderStats?: OrderSummary;
  vehicleInfo?: string[];
  tireSizes?: string[];
}

const DATE_PRESETS = [
  { label: "Last 7 days", value: "7d", fn: () => subDays(new Date(), 7) },
  { label: "Last 30 days", value: "30d", fn: () => subDays(new Date(), 30) },
  { label: "Last 90 days", value: "90d", fn: () => subDays(new Date(), 90) },
  { label: "Last 6 months", value: "6m", fn: () => subMonths(new Date(), 6) },
  { label: "Last year", value: "1y", fn: () => subMonths(new Date(), 12) },
  { label: "All time", value: "all", fn: () => null },
];

const ORDER_COUNT_FILTERS = [
  { label: "Any", value: "any" },
  { label: "No orders", value: "0" },
  { label: "1+ orders", value: "1+" },
  { label: "3+ orders", value: "3+" },
  { label: "5+ orders", value: "5+" },
];

export function AdminCustomers() {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithStats | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  
  // Filters
  const [datePreset, setDatePreset] = useState("all");
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>();
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>();
  const [orderCountFilter, setOrderCountFilter] = useState("any");
  const [cityFilter, setCityFilter] = useState("all");
  const [tireSizeFilter, setTireSizeFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("all");

  // Derived data for filter options
  const [allCities, setAllCities] = useState<string[]>([]);
  const [allVendors, setAllVendors] = useState<string[]>([]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      // Fetch customers
      const { data: customersData, error: customersError } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (customersError) throw customersError;

      // Fetch all orders with items for stats
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(`
          id,
          customer_id,
          total,
          created_at,
          order_items(vendor, size, description)
        `)
        .not("customer_id", "is", null);

      if (ordersError) throw ordersError;

      // Build order stats per customer
      const orderStatsByCustomer: Record<string, OrderSummary> = {};
      const vehicleInfoByCustomer: Record<string, Set<string>> = {};
      const tireSizesByCustomer: Record<string, Set<string>> = {};
      const vendorsSet = new Set<string>();

      ordersData?.forEach((order: any) => {
        const cid = order.customer_id;
        if (!cid) return;

        if (!orderStatsByCustomer[cid]) {
          orderStatsByCustomer[cid] = {
            customer_id: cid,
            total_orders: 0,
            total_spent: 0,
            last_order_date: null,
            first_order_date: null,
          };
        }

        orderStatsByCustomer[cid].total_orders++;
        orderStatsByCustomer[cid].total_spent += Number(order.total) || 0;

        const orderDate = order.created_at;
        if (!orderStatsByCustomer[cid].last_order_date || orderDate > orderStatsByCustomer[cid].last_order_date!) {
          orderStatsByCustomer[cid].last_order_date = orderDate;
        }
        if (!orderStatsByCustomer[cid].first_order_date || orderDate < orderStatsByCustomer[cid].first_order_date!) {
          orderStatsByCustomer[cid].first_order_date = orderDate;
        }

        // Extract vehicle/tire info from items
        if (!vehicleInfoByCustomer[cid]) vehicleInfoByCustomer[cid] = new Set();
        if (!tireSizesByCustomer[cid]) tireSizesByCustomer[cid] = new Set();

        order.order_items?.forEach((item: OrderItem) => {
          if (item.vendor) {
            vehicleInfoByCustomer[cid].add(item.vendor);
            vendorsSet.add(item.vendor);
          }
          if (item.size) {
            tireSizesByCustomer[cid].add(item.size);
          }
        });
      });

      // Merge customers with stats
      const enrichedCustomers: CustomerWithStats[] = (customersData || []).map((c) => ({
        ...c,
        orderStats: orderStatsByCustomer[c.id],
        vehicleInfo: Array.from(vehicleInfoByCustomer[c.id] || []),
        tireSizes: Array.from(tireSizesByCustomer[c.id] || []),
      }));

      setCustomers(enrichedCustomers);

      // Extract unique cities
      const cities = [...new Set(customersData?.map(c => c.city).filter(Boolean) as string[])];
      setAllCities(cities.sort());
      setAllVendors(Array.from(vendorsSet).sort());

    } catch (err) {
      console.error("Error fetching customers:", err);
      toast.error("Failed to load customers");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomerOrders = async (customerId: string) => {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items(*)
      `)
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (!error) {
      setCustomerOrders(data || []);
    }
  };

  const handleViewCustomer = (customer: CustomerWithStats) => {
    setSelectedCustomer(customer);
    fetchCustomerOrders(customer.id);
  };

  // Apply filters
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      // Search filter
      const matchesSearch =
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery);

      if (!matchesSearch) return false;

      // City filter
      if (cityFilter !== "all" && customer.city !== cityFilter) return false;

      // Order count filter
      const orderCount = customer.orderStats?.total_orders || 0;
      if (orderCountFilter === "0" && orderCount !== 0) return false;
      if (orderCountFilter === "1+" && orderCount < 1) return false;
      if (orderCountFilter === "3+" && orderCount < 3) return false;
      if (orderCountFilter === "5+" && orderCount < 5) return false;

      // Date filter (last purchase date)
      if (datePreset !== "all" && customer.orderStats?.last_order_date) {
        const preset = DATE_PRESETS.find(p => p.value === datePreset);
        if (preset && preset.fn()) {
          const cutoffDate = preset.fn()!;
          const lastOrderDate = parseISO(customer.orderStats.last_order_date);
          if (isBefore(lastOrderDate, cutoffDate)) return false;
        }
      } else if (customDateFrom || customDateTo) {
        const lastOrderDate = customer.orderStats?.last_order_date 
          ? parseISO(customer.orderStats.last_order_date) 
          : null;
        if (!lastOrderDate) return false;
        if (customDateFrom && isBefore(lastOrderDate, customDateFrom)) return false;
        if (customDateTo && isAfter(lastOrderDate, customDateTo)) return false;
      }

      // Tire size filter
      if (tireSizeFilter && customer.tireSizes) {
        const matchesSize = customer.tireSizes.some(size => 
          size.toLowerCase().includes(tireSizeFilter.toLowerCase())
        );
        if (!matchesSize) return false;
      }

      // Vendor filter
      if (vendorFilter !== "all" && customer.vehicleInfo) {
        if (!customer.vehicleInfo.includes(vendorFilter)) return false;
      }

      return true;
    });
  }, [customers, searchQuery, cityFilter, orderCountFilter, datePreset, customDateFrom, customDateTo, tireSizeFilter, vendorFilter]);

  // Stats
  const stats = useMemo(() => {
    const totalCustomers = filteredCustomers.length;
    const withOrders = filteredCustomers.filter(c => (c.orderStats?.total_orders || 0) > 0).length;
    const totalRevenue = filteredCustomers.reduce((sum, c) => sum + (c.orderStats?.total_spent || 0), 0);
    const avgOrderValue = withOrders > 0 
      ? totalRevenue / filteredCustomers.reduce((sum, c) => sum + (c.orderStats?.total_orders || 0), 0)
      : 0;
    
    return { totalCustomers, withOrders, totalRevenue, avgOrderValue };
  }, [filteredCustomers]);

  const clearFilters = () => {
    setSearchQuery("");
    setDatePreset("all");
    setCustomDateFrom(undefined);
    setCustomDateTo(undefined);
    setOrderCountFilter("any");
    setCityFilter("all");
    setTireSizeFilter("");
    setVendorFilter("all");
  };

  const hasActiveFilters = searchQuery || datePreset !== "all" || customDateFrom || customDateTo || 
    orderCountFilter !== "any" || cityFilter !== "all" || tireSizeFilter || vendorFilter !== "all";

  const exportCSV = () => {
    const headers = ["Name", "Email", "Phone", "City", "Orders", "Total Spent", "Last Order", "Tire Sizes", "Brands"];
    const rows = filteredCustomers.map(c => [
      c.name,
      c.email,
      c.phone,
      c.city || "",
      c.orderStats?.total_orders || 0,
      c.orderStats?.total_spent?.toFixed(2) || "0",
      c.orderStats?.last_order_date ? format(parseISO(c.orderStats.last_order_date), "yyyy-MM-dd") : "",
      c.tireSizes?.join("; ") || "",
      c.vehicleInfo?.join("; ") || "",
    ]);

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredCustomers.length} customers`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bento-card">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-sm text-muted-foreground">Matching Customers</p>
          </CardContent>
        </Card>
        <Card className="bento-card">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.withOrders}</div>
            <p className="text-sm text-muted-foreground">With Orders</p>
          </CardContent>
        </Card>
        <Card className="bento-card">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>
        <Card className="bento-card">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">${stats.avgOrderValue.toFixed(0)}</div>
            <p className="text-sm text-muted-foreground">Avg Order Value</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bento-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Customer Segmentation</CardTitle>
            </div>
            <div className="flex gap-2">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="h-4 w-4 mr-1" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Search */}
            <div className="relative xl:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, email, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Last Purchase Date */}
            <Select value={datePreset} onValueChange={setDatePreset}>
              <SelectTrigger>
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Last purchase" />
              </SelectTrigger>
              <SelectContent>
                {DATE_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Order Count */}
            <Select value={orderCountFilter} onValueChange={setOrderCountFilter}>
              <SelectTrigger>
                <ShoppingBag className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Order count" />
              </SelectTrigger>
              <SelectContent>
                {ORDER_COUNT_FILTERS.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* City */}
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger>
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {allCities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Brand/Vendor */}
            <Select value={vendorFilter} onValueChange={setVendorFilter}>
              <SelectTrigger>
                <Car className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {allVendors.map((vendor) => (
                  <SelectItem key={vendor} value={vendor}>
                    {vendor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tire Size Filter */}
          <div className="mt-4">
            <div className="relative max-w-xs">
              <Input
                placeholder="Filter by tire size (e.g. 225/65R17)"
                value={tireSizeFilter}
                onChange={(e) => setTireSizeFilter(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Table */}
      <Card className="bento-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customers ({filteredCustomers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Last Order</TableHead>
                  <TableHead>Tire Sizes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No customers match the current filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.slice(0, 100).map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{customer.city || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={customer.orderStats?.total_orders ? "default" : "secondary"}>
                          {customer.orderStats?.total_orders || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        ${(customer.orderStats?.total_spent || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {customer.orderStats?.last_order_date 
                          ? format(parseISO(customer.orderStats.last_order_date), "MMM d, yyyy")
                          : "-"
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {customer.tireSizes?.slice(0, 2).map((size) => (
                            <Badge key={size} variant="outline" className="text-xs">
                              {size}
                            </Badge>
                          ))}
                          {(customer.tireSizes?.length || 0) > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{customer.tireSizes!.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewCustomer(customer)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {filteredCustomers.length > 100 && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              Showing first 100 of {filteredCustomers.length} customers. Use filters to narrow results.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Customer Detail Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {selectedCustomer?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p>{selectedCustomer.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p>{selectedCustomer.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">City</label>
                  <p>{selectedCustomer.city || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Customer Since</label>
                  <p>{format(parseISO(selectedCustomer.created_at), "MMM d, yyyy")}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <div className="text-2xl font-bold">
                      {selectedCustomer.orderStats?.total_orders || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Orders</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <div className="text-2xl font-bold">
                      ${(selectedCustomer.orderStats?.total_spent || 0).toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Spent</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <div className="text-2xl font-bold">
                      {selectedCustomer.tireSizes?.length || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Tire Sizes</p>
                  </CardContent>
                </Card>
              </div>

              {/* Tire Sizes */}
              {selectedCustomer.tireSizes && selectedCustomer.tireSizes.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Tire Sizes Purchased</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedCustomer.tireSizes.map((size) => (
                      <Badge key={size} variant="secondary">{size}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Brands */}
              {selectedCustomer.vehicleInfo && selectedCustomer.vehicleInfo.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Brands Purchased</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedCustomer.vehicleInfo.map((brand) => (
                      <Badge key={brand} variant="outline">{brand}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Order History */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Order History</label>
                {customerOrders.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No orders found</p>
                ) : (
                  <div className="space-y-2">
                    {customerOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                        <div>
                          <p className="font-medium">{order.order_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(order.created_at), "MMM d, yyyy")}
                            {" · "}
                            {order.order_items?.length || 0} items
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${Number(order.total).toLocaleString()}</p>
                          <Badge variant={order.status === "completed" ? "default" : "secondary"}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedCustomer.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Notes</label>
                  <p className="text-sm">{selectedCustomer.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}