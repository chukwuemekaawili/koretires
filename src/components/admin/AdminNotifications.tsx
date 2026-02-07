import { useState, useEffect } from "react";
import { Loader2, Bell, RefreshCw, Eye, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Notification {
  id: string;
  type: string;
  to_email: string;
  subject: string;
  status: string;
  error: string | null;
  payload: any;
  created_at: string | null;
  sent_at: string | null;
}

const statusColors: Record<string, string> = {
  queued: "bg-yellow-500/10 text-yellow-500",
  sent: "bg-green-500/10 text-green-500",
  failed: "bg-red-500/10 text-red-500",
  pending: "bg-blue-500/10 text-blue-500",
};

export function AdminNotifications() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);

  const fetchNotifications = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    
    if (!error) setNotifications(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const retryNotification = async (notification: Notification) => {
    setRetrying(notification.id);
    
    try {
      const { error } = await supabase.functions.invoke("send-notification", {
        body: {
          type: notification.type,
          to: notification.to_email,
          subject: notification.subject,
          payload: notification.payload,
          retry: true,
        },
      });

      if (error) throw error;
      
      toast({ title: "Retry Sent", description: "Notification retry initiated" });
      fetchNotifications();
    } catch (err) {
      toast({ title: "Retry Failed", description: "Failed to retry notification", variant: "destructive" });
    } finally {
      setRetrying(null);
    }
  };

  const filteredNotifications = statusFilter === "all" 
    ? notifications 
    : notifications.filter(n => n.status === statusFilter);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <>
      <Card className="bento-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications ({notifications.length})
          </CardTitle>
          <Button variant="outline" size="sm" onClick={fetchNotifications}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filter */}
          <div className="mb-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="queued">Queued</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNotifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No notifications found
                  </TableCell>
                </TableRow>
              ) : (
                filteredNotifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell>
                      <Badge variant="outline">{notification.type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{notification.to_email}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm">{notification.subject}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[notification.status] || "bg-muted"}>
                        {notification.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {notification.created_at && format(new Date(notification.created_at), "MMM d, HH:mm")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedNotification(notification)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(notification.status === "failed" || notification.status === "queued") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => retryNotification(notification)}
                            disabled={retrying === notification.id}
                          >
                            {retrying === notification.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RotateCcw className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Notification Detail */}
      <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Notification Details</DialogTitle>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Type:</strong> {selectedNotification.type}</div>
                <div><strong>Status:</strong> {selectedNotification.status}</div>
                <div><strong>To:</strong> {selectedNotification.to_email}</div>
                <div><strong>Created:</strong> {selectedNotification.created_at && format(new Date(selectedNotification.created_at), "PPpp")}</div>
                {selectedNotification.sent_at && (
                  <div><strong>Sent:</strong> {format(new Date(selectedNotification.sent_at), "PPpp")}</div>
                )}
              </div>
              
              <div>
                <strong>Subject:</strong>
                <p className="text-muted-foreground">{selectedNotification.subject}</p>
              </div>

              {selectedNotification.error && (
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <strong className="text-destructive">Error:</strong>
                  <p className="text-sm text-destructive">{selectedNotification.error}</p>
                </div>
              )}

              <div>
                <strong>Payload:</strong>
                <pre className="mt-2 p-3 bg-secondary rounded-lg text-xs overflow-auto max-h-60">
                  {JSON.stringify(selectedNotification.payload, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
