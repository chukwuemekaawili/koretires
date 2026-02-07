import { useState, useEffect } from "react";
import { Loader2, Mail, Star, Search, Trash2, Send, Users, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface NewsletterSubscriber {
  id: string;
  email: string;
  name: string | null;
  source: string | null;
  is_active: boolean | null;
  created_at: string;
  unsubscribed_at: string | null;
}

interface ReviewRequest {
  id: string;
  email: string;
  phone: string | null;
  customer_id: string | null;
  order_id: string | null;
  review_url: string | null;
  status: string | null;
  sent_at: string | null;
  clicked_at: string | null;
  created_at: string;
}

const reviewStatusOptions = [
  { value: "pending", label: "Pending", color: "bg-muted" },
  { value: "sent", label: "Sent", color: "bg-primary" },
  { value: "clicked", label: "Clicked", color: "bg-green-500" },
  { value: "completed", label: "Completed", color: "bg-green-600" },
];

export function AdminNewsletter() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [reviewRequests, setReviewRequests] = useState<ReviewRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subsRes, reviewsRes] = await Promise.all([
        supabase.from("newsletter_subscribers").select("*").order("created_at", { ascending: false }),
        supabase.from("review_requests").select("*").order("created_at", { ascending: false }),
      ]);

      if (subsRes.error) throw subsRes.error;
      if (reviewsRes.error) throw reviewsRes.error;

      setSubscribers(subsRes.data || []);
      setReviewRequests(reviewsRes.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSubscriberActive = async (subscriber: NewsletterSubscriber) => {
    try {
      const updates: any = { is_active: !subscriber.is_active };
      if (!subscriber.is_active === false) {
        updates.unsubscribed_at = new Date().toISOString();
      } else {
        updates.unsubscribed_at = null;
      }

      const { error } = await supabase
        .from("newsletter_subscribers")
        .update(updates)
        .eq("id", subscriber.id);

      if (error) throw error;
      toast.success(subscriber.is_active ? "Subscriber deactivated" : "Subscriber reactivated");
      fetchData();
    } catch (err) {
      toast.error("Failed to update subscriber");
    }
  };

  const deleteSubscriber = async (id: string) => {
    try {
      const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);
      if (error) throw error;
      toast.success("Subscriber removed");
      fetchData();
    } catch (err) {
      toast.error("Failed to remove subscriber");
    }
  };

  const updateReviewStatus = async (id: string, status: string) => {
    try {
      const updates: any = { status };
      if (status === "sent") {
        updates.sent_at = new Date().toISOString();
      } else if (status === "clicked") {
        updates.clicked_at = new Date().toISOString();
      }

      const { error } = await supabase.from("review_requests").update(updates).eq("id", id);
      if (error) throw error;
      toast.success("Review request updated");
      fetchData();
    } catch (err) {
      toast.error("Failed to update review request");
    }
  };

  const createReviewRequest = async (email: string) => {
    try {
      const { error } = await supabase.from("review_requests").insert({
        email,
        review_url: "https://g.page/r/YOUR_GOOGLE_REVIEW_LINK/review", // Replace with actual review URL
        status: "pending",
      });

      if (error) throw error;
      toast.success("Review request created");
      fetchData();
    } catch (err) {
      toast.error("Failed to create review request");
    }
  };

  const filteredSubscribers = subscribers.filter(sub =>
    sub.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (sub.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredReviews = reviewRequests.filter(req => {
    const matchesSearch = req.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeSubscribers = subscribers.filter(s => s.is_active).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="newsletter" className="space-y-6">
        <TabsList>
          <TabsTrigger value="newsletter">Newsletter ({subscribers.length})</TabsTrigger>
          <TabsTrigger value="reviews">Review Requests ({reviewRequests.length})</TabsTrigger>
        </TabsList>

        {/* Newsletter Tab */}
        <TabsContent value="newsletter" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subscribers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bento-card">
              <CardContent className="pt-6">
                <p className="text-2xl font-bold">{subscribers.length}</p>
                <p className="text-sm text-muted-foreground">Total Subscribers</p>
              </CardContent>
            </Card>
            <Card className="bento-card">
              <CardContent className="pt-6">
                <p className="text-2xl font-bold text-green-500">{activeSubscribers}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </CardContent>
            </Card>
            <Card className="bento-card">
              <CardContent className="pt-6">
                <p className="text-2xl font-bold text-muted-foreground">
                  {subscribers.length - activeSubscribers}
                </p>
                <p className="text-sm text-muted-foreground">Unsubscribed</p>
              </CardContent>
            </Card>
            <Card className="bento-card">
              <CardContent className="pt-6">
                <p className="text-2xl font-bold">
                  {subscribers.filter(s => {
                    const date = new Date(s.created_at);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return date > weekAgo;
                  }).length}
                </p>
                <p className="text-sm text-muted-foreground">This Week</p>
              </CardContent>
            </Card>
          </div>

          {/* Subscribers Table */}
          <Card className="bento-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Newsletter Subscribers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Subscribed</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubscribers.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">{sub.email}</TableCell>
                        <TableCell>{sub.name || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">{sub.source || "website"}</Badge>
                        </TableCell>
                        <TableCell>{format(new Date(sub.created_at), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          <Badge className={sub.is_active ? "bg-green-500" : "bg-muted"}>
                            {sub.is_active ? "Active" : "Unsubscribed"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => toggleSubscriberActive(sub)}
                            >
                              {sub.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => createReviewRequest(sub.email)}
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove Subscriber?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently remove {sub.email} from the newsletter list.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteSubscriber(sub.id)} className="bg-destructive text-destructive-foreground">
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search review requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {reviewStatusOptions.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bento-card">
              <CardContent className="pt-6">
                <p className="text-2xl font-bold">{reviewRequests.length}</p>
                <p className="text-sm text-muted-foreground">Total Requests</p>
              </CardContent>
            </Card>
            <Card className="bento-card">
              <CardContent className="pt-6">
                <p className="text-2xl font-bold text-primary">
                  {reviewRequests.filter(r => r.status === "sent").length}
                </p>
                <p className="text-sm text-muted-foreground">Sent</p>
              </CardContent>
            </Card>
            <Card className="bento-card">
              <CardContent className="pt-6">
                <p className="text-2xl font-bold text-green-500">
                  {reviewRequests.filter(r => r.status === "clicked" || r.status === "completed").length}
                </p>
                <p className="text-sm text-muted-foreground">Clicked/Completed</p>
              </CardContent>
            </Card>
            <Card className="bento-card">
              <CardContent className="pt-6">
                <p className="text-2xl font-bold text-yellow-500">
                  {reviewRequests.filter(r => r.status === "pending").length}
                </p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </CardContent>
            </Card>
          </div>

          {/* Review Requests Table */}
          <Card className="bento-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Review Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Clicked</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReviews.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell className="font-medium">{req.email}</TableCell>
                        <TableCell>{req.phone || "-"}</TableCell>
                        <TableCell>{format(new Date(req.created_at), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          {req.sent_at ? format(new Date(req.sent_at), "MMM d") : "-"}
                        </TableCell>
                        <TableCell>
                          {req.clicked_at ? format(new Date(req.clicked_at), "MMM d") : "-"}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={req.status || "pending"}
                            onValueChange={(v) => updateReviewStatus(req.id, v)}
                          >
                            <SelectTrigger className="w-28 h-8">
                              <Badge className={reviewStatusOptions.find(s => s.value === req.status)?.color}>
                                {reviewStatusOptions.find(s => s.value === req.status)?.label || req.status}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              {reviewStatusOptions.map((s) => (
                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => updateReviewStatus(req.id, "sent")}
                            disabled={req.status !== "pending"}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}