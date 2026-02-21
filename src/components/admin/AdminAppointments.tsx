import { useState, useEffect } from "react";
import { Loader2, Calendar as CalendarIcon, Clock, CheckCircle, XCircle, Trash2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
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
        </div>
    );
}
