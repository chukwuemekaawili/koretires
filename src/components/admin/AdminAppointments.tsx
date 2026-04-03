import { useState, useEffect } from "react";
import { Loader2, Calendar as CalendarIcon, Clock, CheckCircle, XCircle, Trash2, MapPin, Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ServiceBooking {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    service_type: string;
    vehicle_info: string | null;
    preferred_date: string | null;
    preferred_time: string | null;
    notes: string | null;
    status: string;
    created_at: string;
}

const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
    confirmed: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
    completed: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
    cancelled: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
};

export function AdminAppointments() {
    const { toast } = useToast();
    const [bookings, setBookings] = useState<ServiceBooking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    // Reply dialog state
    const [replyDialogOpen, setReplyDialogOpen] = useState(false);
    const [replyBooking, setReplyBooking] = useState<ServiceBooking | null>(null);
    const [replyMessage, setReplyMessage] = useState("");
    const [isSendingReply, setIsSendingReply] = useState(false);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const { data, error } = await supabase
                .from('service_bookings')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBookings(data || []);
        } catch (error) {
            console.error('Error fetching bookings:', error);
            toast({
                title: "Error",
                description: "Failed to load service appointments.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const sendNotification = async (type: string, booking: ServiceBooking, extraData: Record<string, unknown> = {}) => {
        if (!booking.email) return;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            await supabase.functions.invoke('send-notification', {
                body: {
                    type,
                    recipientEmail: booking.email,
                    recipientName: booking.name,
                    data: {
                        serviceType: booking.service_type.replace('_', ' '),
                        preferredDate: booking.preferred_date || 'To be confirmed',
                        preferredTime: booking.preferred_time || '',
                        ...extraData,
                    },
                },
                headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
            });
        } catch (err) {
            console.warn('Notification send failed (non-critical):', err);
        }
    };

    const updateStatus = async (id: string, newStatus: string) => {
        setUpdatingId(id);
        try {
            const { error } = await supabase
                .from('service_bookings')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            setBookings(prev =>
                prev.map(b => b.id === id ? { ...b, status: newStatus } : b)
            );

            // Send confirmation email when status becomes "confirmed"
            if (newStatus === 'confirmed') {
                const booking = bookings.find(b => b.id === id);
                if (booking) {
                    sendNotification('appointment_confirmed', booking).catch(console.error);
                }
            }

            toast({
                title: "Status Updated",
                description: `Appointment marked as ${newStatus}.`,
            });
        } catch (error) {
            console.error('Error updating status:', error);
            toast({
                title: "Error",
                description: "Failed to update appointment status.",
                variant: "destructive"
            });
        } finally {
            setUpdatingId(null);
        }
    };

    const deleteBooking = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this appointment?")) return;

        setUpdatingId(id);
        try {
            const { error } = await supabase
                .from('service_bookings')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setBookings(prev => prev.filter(b => b.id !== id));
            toast({
                title: "Appointment Deleted",
                description: "The appointment has been removed.",
            });
        } catch (error) {
            console.error('Error deleting booking:', error);
            toast({
                title: "Error",
                description: "Failed to delete appointment.",
                variant: "destructive"
            });
        } finally {
            setUpdatingId(null);
        }
    };

    const openReplyDialog = (booking: ServiceBooking) => {
        setReplyBooking(booking);
        setReplyMessage("");
        setReplyDialogOpen(true);
    };

    const handleSendReply = async () => {
        if (!replyBooking || !replyMessage.trim()) return;
        setIsSendingReply(true);
        try {
            await sendNotification('appointment_reply', replyBooking, { replyMessage: replyMessage.trim() });
            toast({
                title: "Reply Sent",
                description: `Message sent to ${replyBooking.name}.`,
            });
            setReplyDialogOpen(false);
            setReplyMessage("");
        } catch (err) {
            toast({
                title: "Error",
                description: "Failed to send reply.",
                variant: "destructive"
            });
        } finally {
            setIsSendingReply(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Service Appointments</h2>
                    <p className="text-muted-foreground">
                        Manage customer service bookings and schedules.
                    </p>
                </div>
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden">
                {bookings.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>No appointments found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Customer Details</th>
                                    <th className="px-6 py-4 font-medium">Service Info</th>
                                    <th className="px-6 py-4 font-medium">Schedule</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {bookings.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-foreground">{booking.name}</div>
                                            <div className="text-muted-foreground">{booking.phone}</div>
                                            {booking.email && <div className="text-muted-foreground text-xs">{booking.email}</div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium capitalize">{booking.service_type.replace('_', ' ')}</div>
                                            {booking.vehicle_info && (
                                                <div className="text-muted-foreground text-xs flex items-center gap-1 mt-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {booking.vehicle_info}
                                                </div>
                                            )}
                                            {booking.notes && (
                                                <div className="text-muted-foreground text-xs italic mt-1 line-clamp-1 max-w-[200px]" title={booking.notes}>
                                                    "{booking.notes}"
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {booking.preferred_date ? (
                                                <div className="flex items-center gap-1 text-foreground">
                                                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                                    {format(new Date(booking.preferred_date + 'T12:00:00'), 'MMM d, yyyy')}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground italic">No Date</span>
                                            )}
                                            {booking.preferred_time && (
                                                <div className="flex items-center gap-1 text-muted-foreground text-xs mt-1">
                                                    <Clock className="h-3 w-3" />
                                                    {booking.preferred_time}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className={statusColors[booking.status]}>
                                                {booking.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right space-y-2">
                                            <Select
                                                disabled={updatingId === booking.id}
                                                value={booking.status}
                                                onValueChange={(val) => updateStatus(booking.id, val)}
                                            >
                                                <SelectTrigger className="w-[130px] ml-auto h-8 text-xs">
                                                    <SelectValue placeholder="Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pending">Pending</SelectItem>
                                                    <SelectItem value="confirmed">Confirmed</SelectItem>
                                                    <SelectItem value="completed">Completed</SelectItem>
                                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {booking.email && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 px-2 w-full"
                                                    onClick={() => openReplyDialog(booking)}
                                                    disabled={updatingId === booking.id}
                                                >
                                                    <MessageSquare className="h-4 w-4 mr-1" />
                                                    Reply
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2 w-full"
                                                onClick={() => deleteBooking(booking.id)}
                                                disabled={updatingId === booking.id}
                                            >
                                                <Trash2 className="h-4 w-4 mr-1" />
                                                Delete
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Reply Dialog */}
            <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reply to {replyBooking?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        {replyBooking && (
                            <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                                <p><span className="font-medium text-foreground">Service:</span> {replyBooking.service_type.replace('_', ' ')}</p>
                                <p><span className="font-medium text-foreground">Email:</span> {replyBooking.email}</p>
                                {replyBooking.preferred_date && (
                                    <p><span className="font-medium text-foreground">Requested:</span> {format(new Date(replyBooking.preferred_date + 'T12:00:00'), 'MMM d, yyyy')}{replyBooking.preferred_time ? ` at ${replyBooking.preferred_time}` : ''}</p>
                                )}
                            </div>
                        )}
                        <div>
                            <Label htmlFor="reply-msg">Your Message</Label>
                            <Textarea
                                id="reply-msg"
                                rows={4}
                                placeholder="Type your reply to the customer..."
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                                className="mt-1.5"
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="hero"
                                className="flex-1"
                                onClick={handleSendReply}
                                disabled={isSendingReply || !replyMessage.trim()}
                            >
                                {isSendingReply ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                                Send Reply
                            </Button>
                            <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
