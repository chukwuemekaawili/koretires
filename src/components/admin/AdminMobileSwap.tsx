import { useState, useEffect } from "react";
import { Loader2, Truck, Search, Eye, Phone, MessageSquare, Image as ImageIcon, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Json } from "@/integrations/supabase/types";

interface ContactLogEntry {
  timestamp: string;
  note: string;
  type: string;
}

interface MobileSwapBooking {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string | null;
  postal_code: string | null;
  preferred_date: string;
  preferred_time_window: string | null;
  vehicle_year: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  tire_size: string | null;
  num_tires: number | null;
  service_type: string | null;
  notes: string | null;
  internal_notes: string | null;
  status: string | null;
  quoted_price: number | null;
  photo_urls: string[] | null;
  contact_log: Json | null;
  created_at: string;
}

const statusOptions = [
  { value: "new", label: "New", color: "bg-primary" },
  { value: "confirmed", label: "Confirmed", color: "bg-success" },
  { value: "scheduled", label: "Scheduled", color: "bg-warning" },
  { value: "in_progress", label: "In Progress", color: "bg-warning" },
  { value: "completed", label: "Completed", color: "bg-success" },
  { value: "cancelled", label: "Cancelled", color: "bg-destructive" },
];

const serviceTypes = [
  { value: "swap", label: "Seasonal Swap" },
  { value: "install", label: "New Tire Install" },
  { value: "rotation", label: "Rotation Only" },
  { value: "repair", label: "Flat Repair" },
];

export function AdminMobileSwap() {
  const [bookings, setBookings] = useState<MobileSwapBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<MobileSwapBooking | null>(null);
  const [internalNotes, setInternalNotes] = useState("");
  const [quotedPrice, setQuotedPrice] = useState("");
  const [contactNote, setContactNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from("mobile_swap_bookings")
        .select("*")
        .order("preferred_date", { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      toast.error("Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  };

  const updateBookingStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("mobile_swap_bookings")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
      toast.success("Booking status updated");
      fetchBookings();
    } catch (err) {
      toast.error("Failed to update booking");
    }
  };

  const saveBookingDetails = async () => {
    if (!selectedBooking) return;
    setIsSaving(true);

    try {
      const updates: any = {
        internal_notes: internalNotes,
        quoted_price: quotedPrice ? parseFloat(quotedPrice) : null,
      };

      // Add contact log entry if there's a new note
      if (contactNote.trim()) {
        const newLog: ContactLogEntry = {
          timestamp: new Date().toISOString(),
          note: contactNote,
          type: "admin_note",
        };
        const existingLog = Array.isArray(selectedBooking.contact_log) ? selectedBooking.contact_log : [];
        updates.contact_log = [...existingLog, newLog];
      }

      const { error } = await supabase
        .from("mobile_swap_bookings")
        .update(updates)
        .eq("id", selectedBooking.id);

      if (error) throw error;
      toast.success("Booking updated");
      setContactNote("");
      fetchBookings();
      
      // Update selected booking
      setSelectedBooking({
        ...selectedBooking,
        ...updates,
      });
    } catch (err) {
      toast.error("Failed to update booking");
    } finally {
      setIsSaving(false);
    }
  };

  const openBookingDetails = (booking: MobileSwapBooking) => {
    setSelectedBooking(booking);
    setInternalNotes(booking.internal_notes || "");
    setQuotedPrice(booking.quoted_price?.toString() || "");
    setContactNote("");
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.address.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || b.status === statusFilter;

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
            placeholder="Search bookings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statusOptions.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statusOptions.slice(0, 4).map((status) => {
          const count = bookings.filter((b) => b.status === status.value).length;
          return (
            <Card key={status.value} className="bento-card">
              <CardContent className="pt-6">
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-sm text-muted-foreground">{status.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bookings Table */}
      <Card className="bento-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Mobile Swap Bookings ({filteredBookings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{booking.name}</p>
                        <p className="text-xs text-muted-foreground">{booking.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-1">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm">{booking.address}</p>
                          <p className="text-xs text-muted-foreground">{booking.city}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm">{format(new Date(booking.preferred_date), "MMM d, yyyy")}</p>
                          {booking.preferred_time_window && (
                            <p className="text-xs text-muted-foreground">{booking.preferred_time_window}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">
                          {booking.vehicle_year} {booking.vehicle_make} {booking.vehicle_model}
                        </p>
                        {booking.tire_size && (
                          <p className="text-xs text-muted-foreground font-mono">{booking.tire_size}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {serviceTypes.find((s) => s.value === booking.service_type)?.label || booking.service_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={booking.status || "new"}
                        onValueChange={(v) => updateBookingStatus(booking.id, v)}
                      >
                        <SelectTrigger className="w-32 h-8">
                          <Badge className={statusOptions.find((s) => s.value === booking.status)?.color}>
                            {statusOptions.find((s) => s.value === booking.status)?.label || booking.status}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openBookingDetails(booking)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <a href={`tel:${booking.phone}`}>
                            <Phone className="h-4 w-4" />
                          </a>
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

      {/* Booking Details Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Booking Details
            </DialogTitle>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Customer</h4>
                  <p className="font-semibold">{selectedBooking.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedBooking.email}</p>
                  <p className="text-sm text-muted-foreground">{selectedBooking.phone}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Location</h4>
                  <p className="text-sm">{selectedBooking.address}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedBooking.city}, {selectedBooking.postal_code}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Service Details */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Service</h4>
                  <p>
                    {serviceTypes.find((s) => s.value === selectedBooking.service_type)?.label ||
                      selectedBooking.service_type}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedBooking.num_tires} tires
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Appointment</h4>
                  <p>{format(new Date(selectedBooking.preferred_date), "EEEE, MMMM d, yyyy")}</p>
                  {selectedBooking.preferred_time_window && (
                    <p className="text-sm text-muted-foreground">{selectedBooking.preferred_time_window}</p>
                  )}
                </div>
              </div>

              {/* Vehicle Info */}
              <div>
                <h4 className="font-medium mb-2">Vehicle</h4>
                <p>
                  {selectedBooking.vehicle_year} {selectedBooking.vehicle_make} {selectedBooking.vehicle_model}
                </p>
                {selectedBooking.tire_size && (
                  <p className="text-sm font-mono text-muted-foreground">Size: {selectedBooking.tire_size}</p>
                )}
              </div>

              {/* Customer Notes */}
              {selectedBooking.notes && (
                <div>
                  <h4 className="font-medium mb-2">Customer Notes</h4>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">{selectedBooking.notes}</p>
                </div>
              )}

              {/* Photos */}
              {selectedBooking.photo_urls && selectedBooking.photo_urls.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Photos ({selectedBooking.photo_urls.length})
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedBooking.photo_urls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt={`Photo ${i + 1}`} className="rounded-lg w-full h-24 object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Admin Section */}
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quoted Price ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={quotedPrice}
                      onChange={(e) => setQuotedPrice(e.target.value)}
                      placeholder="Enter quote"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={selectedBooking.status || "new"}
                      onValueChange={(v) => {
                        updateBookingStatus(selectedBooking.id, v);
                        setSelectedBooking({ ...selectedBooking, status: v });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Internal Notes</Label>
                  <Textarea
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Private notes for staff..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Add Contact Log Entry</Label>
                  <div className="flex gap-2">
                    <Input
                      value={contactNote}
                      onChange={(e) => setContactNote(e.target.value)}
                      placeholder="e.g., Called customer, confirmed appointment"
                    />
                  </div>
                </div>

                {/* Contact Log History */}
                {Array.isArray(selectedBooking.contact_log) && selectedBooking.contact_log.length > 0 && (
                  <div>
                    <Label>Contact History</Label>
                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                      {(selectedBooking.contact_log as unknown as ContactLogEntry[]).map((log, i) => (
                        <div key={i} className="text-sm bg-muted/50 p-2 rounded">
                          <span className="text-muted-foreground">
                            {format(new Date(log.timestamp), "MMM d, h:mm a")}:
                          </span>{" "}
                          {log.note}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button onClick={saveBookingDetails} disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
