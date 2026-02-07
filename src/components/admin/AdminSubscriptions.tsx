import { useState, useEffect } from "react";
import { Loader2, CreditCard, Plus, Search, Pencil, Eye, Users, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Json } from "@/integrations/supabase/types";

interface SubscriptionPlan {
  id: string;
  name: string;
  tier: string;
  description: string | null;
  price_monthly: number | null;
  price_annually: number | null;
  features: Json;
  for_fleet: boolean | null;
  max_vehicles: number | null;
  is_active: boolean | null;
  created_at: string;
}

interface Subscription {
  id: string;
  plan_id: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  company_name: string | null;
  status: string | null;
  billing_interval: string | null;
  start_date: string | null;
  next_renewal_date: string | null;
  vehicles: Json;
  service_preferences: Json;
  notes: string | null;
  created_at: string;
}

const statusOptions = [
  { value: "pending", label: "Pending", color: "bg-muted" },
  { value: "active", label: "Active", color: "bg-green-500" },
  { value: "paused", label: "Paused", color: "bg-yellow-500" },
  { value: "cancelled", label: "Cancelled", color: "bg-destructive" },
];

const tierOptions = ["basic", "standard", "premium", "enterprise"];

export function AdminSubscriptions() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [planForm, setPlanForm] = useState({
    name: "",
    tier: "standard",
    description: "",
    price_monthly: "",
    price_annually: "",
    features: [""],
    for_fleet: false,
    max_vehicles: "",
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [plansRes, subsRes] = await Promise.all([
        supabase.from("subscription_plans").select("*").order("tier", { ascending: true }),
        supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
      ]);

      if (plansRes.error) throw plansRes.error;
      if (subsRes.error) throw subsRes.error;

      setPlans(plansRes.data || []);
      setSubscriptions(subsRes.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Failed to load subscriptions");
    } finally {
      setIsLoading(false);
    }
  };

  const openPlanDialog = (plan?: SubscriptionPlan) => {
    if (plan) {
      setEditingPlan(plan);
      const features = Array.isArray(plan.features) ? (plan.features as string[]) : [];
      setPlanForm({
        name: plan.name,
        tier: plan.tier,
        description: plan.description || "",
        price_monthly: plan.price_monthly?.toString() || "",
        price_annually: plan.price_annually?.toString() || "",
        features: features.length > 0 ? features : [""],
        for_fleet: plan.for_fleet ?? false,
        max_vehicles: plan.max_vehicles?.toString() || "",
        is_active: plan.is_active ?? true,
      });
    } else {
      setEditingPlan(null);
      setPlanForm({
        name: "",
        tier: "standard",
        description: "",
        price_monthly: "",
        price_annually: "",
        features: [""],
        for_fleet: false,
        max_vehicles: "",
        is_active: true,
      });
    }
    setIsPlanDialogOpen(true);
  };

  const handleSavePlan = async () => {
    if (!planForm.name || !planForm.tier) {
      toast.error("Name and tier are required");
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        name: planForm.name,
        tier: planForm.tier,
        description: planForm.description || null,
        price_monthly: planForm.price_monthly ? parseFloat(planForm.price_monthly) : null,
        price_annually: planForm.price_annually ? parseFloat(planForm.price_annually) : null,
        features: planForm.features.filter(f => f.trim()) as unknown as Json,
        for_fleet: planForm.for_fleet,
        max_vehicles: planForm.max_vehicles ? parseInt(planForm.max_vehicles) : null,
        is_active: planForm.is_active,
      };

      if (editingPlan) {
        const { error } = await supabase.from("subscription_plans").update(data).eq("id", editingPlan.id);
        if (error) throw error;
        toast.success("Plan updated");
      } else {
        const { error } = await supabase.from("subscription_plans").insert(data);
        if (error) throw error;
        toast.success("Plan created");
      }

      setIsPlanDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error("Error saving plan:", err);
      toast.error("Failed to save plan");
    } finally {
      setIsSaving(false);
    }
  };

  const updateSubscriptionStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from("subscriptions").update({ status }).eq("id", id);
      if (error) throw error;
      toast.success("Subscription updated");
      fetchData();
    } catch (err) {
      toast.error("Failed to update subscription");
    }
  };

  const addFeature = () => {
    setPlanForm({ ...planForm, features: [...planForm.features, ""] });
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...planForm.features];
    newFeatures[index] = value;
    setPlanForm({ ...planForm, features: newFeatures });
  };

  const removeFeature = (index: number) => {
    const newFeatures = planForm.features.filter((_, i) => i !== index);
    setPlanForm({ ...planForm, features: newFeatures.length > 0 ? newFeatures : [""] });
  };

  const getPlanName = (planId: string) => {
    return plans.find(p => p.id === planId)?.name || "Unknown Plan";
  };

  const filteredSubscriptions = subscriptions.filter(sub =>
    sub.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.contact_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (sub.company_name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="subscriptions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
        </TabsList>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subscriptions..."
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
                <p className="text-2xl font-bold">{subscriptions.length}</p>
                <p className="text-sm text-muted-foreground">Total Subscriptions</p>
              </CardContent>
            </Card>
            <Card className="bento-card">
              <CardContent className="pt-6">
                <p className="text-2xl font-bold text-green-500">
                  {subscriptions.filter(s => s.status === "active").length}
                </p>
                <p className="text-sm text-muted-foreground">Active</p>
              </CardContent>
            </Card>
            <Card className="bento-card">
              <CardContent className="pt-6">
                <p className="text-2xl font-bold text-yellow-500">
                  {subscriptions.filter(s => s.status === "pending").length}
                </p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </CardContent>
            </Card>
            <Card className="bento-card">
              <CardContent className="pt-6">
                <p className="text-2xl font-bold text-primary">
                  {subscriptions.filter(s => s.company_name).length}
                </p>
                <p className="text-sm text-muted-foreground">Fleet Accounts</p>
              </CardContent>
            </Card>
          </div>

          {/* Subscriptions Table */}
          <Card className="bento-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscriptions ({filteredSubscriptions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Billing</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Next Renewal</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubscriptions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{sub.contact_name}</p>
                            <p className="text-xs text-muted-foreground">{sub.contact_email}</p>
                            {sub.company_name && (
                              <p className="text-xs text-primary">{sub.company_name}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{getPlanName(sub.plan_id)}</Badge>
                        </TableCell>
                        <TableCell className="capitalize">{sub.billing_interval || "monthly"}</TableCell>
                        <TableCell>
                          {sub.start_date ? format(new Date(sub.start_date), "MMM d, yyyy") : "-"}
                        </TableCell>
                        <TableCell>
                          {sub.next_renewal_date ? format(new Date(sub.next_renewal_date), "MMM d, yyyy") : "-"}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={sub.status || "pending"}
                            onValueChange={(v) => updateSubscriptionStatus(sub.id, v)}
                          >
                            <SelectTrigger className="w-28 h-8">
                              <Badge className={statusOptions.find(s => s.value === sub.status)?.color}>
                                {statusOptions.find(s => s.value === sub.status)?.label || sub.status}
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
                          <Button variant="ghost" size="icon" onClick={() => setSelectedSubscription(sub)}>
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
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-6">
          <div className="flex justify-end">
            <Button variant="hero" onClick={() => openPlanDialog()}>
              <Plus className="h-4 w-4" />
              New Plan
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const features = Array.isArray(plan.features) ? (plan.features as string[]) : [];
              return (
                <Card key={plan.id} className={`bento-card ${!plan.is_active ? "opacity-60" : ""}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <Badge variant="secondary" className="mt-1 capitalize">{plan.tier}</Badge>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => openPlanDialog(plan)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {plan.description && (
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    )}
                    
                    <div className="space-y-1">
                      {plan.price_monthly && (
                        <p className="text-2xl font-bold">${plan.price_monthly}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                      )}
                      {plan.price_annually && (
                        <p className="text-sm text-muted-foreground">${plan.price_annually}/year</p>
                      )}
                    </div>

                    {features.length > 0 && (
                      <ul className="text-sm space-y-1">
                        {features.slice(0, 4).map((feature, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            {feature}
                          </li>
                        ))}
                        {features.length > 4 && (
                          <li className="text-muted-foreground">+{features.length - 4} more</li>
                        )}
                      </ul>
                    )}

                    <div className="flex gap-2 pt-2">
                      {plan.for_fleet && <Badge>Fleet</Badge>}
                      {plan.max_vehicles && <Badge variant="secondary">Up to {plan.max_vehicles} vehicles</Badge>}
                      {!plan.is_active && <Badge variant="destructive">Inactive</Badge>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Plan Dialog */}
      <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Edit Plan" : "Create Plan"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="e.g., Premium Plan"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Tier *</Label>
                <Select value={planForm.tier} onValueChange={(v) => setPlanForm({ ...planForm, tier: v })}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tierOptions.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={planForm.description}
                onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                placeholder="Plan description..."
                className="mt-1.5"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Monthly Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={planForm.price_monthly}
                  onChange={(e) => setPlanForm({ ...planForm, price_monthly: e.target.value })}
                  placeholder="0.00"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Annual Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={planForm.price_annually}
                  onChange={(e) => setPlanForm({ ...planForm, price_annually: e.target.value })}
                  placeholder="0.00"
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Features</Label>
                <Button variant="outline" size="sm" onClick={addFeature}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {planForm.features.map((feature, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={feature}
                      onChange={(e) => updateFeature(i, e.target.value)}
                      placeholder="Feature description"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeFeature(i)}>×</Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Max Vehicles (for fleet)</Label>
                <Input
                  type="number"
                  value={planForm.max_vehicles}
                  onChange={(e) => setPlanForm({ ...planForm, max_vehicles: e.target.value })}
                  placeholder="Unlimited"
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="for_fleet"
                  checked={planForm.for_fleet}
                  onCheckedChange={(v) => setPlanForm({ ...planForm, for_fleet: v })}
                />
                <Label htmlFor="for_fleet">Fleet Plan</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={planForm.is_active}
                  onCheckedChange={(v) => setPlanForm({ ...planForm, is_active: v })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="hero" className="flex-1" onClick={handleSavePlan} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editingPlan ? "Update Plan" : "Create Plan"}
              </Button>
              <Button variant="outline" onClick={() => setIsPlanDialogOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Subscription Details Dialog */}
      <Dialog open={!!selectedSubscription} onOpenChange={() => setSelectedSubscription(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Subscription Details</DialogTitle>
          </DialogHeader>
          {selectedSubscription && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Contact</p>
                  <p className="font-medium">{selectedSubscription.contact_name}</p>
                  <p className="text-sm">{selectedSubscription.contact_email}</p>
                  <p className="text-sm">{selectedSubscription.contact_phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <p className="font-medium">{getPlanName(selectedSubscription.plan_id)}</p>
                  <p className="text-sm capitalize">{selectedSubscription.billing_interval || "monthly"} billing</p>
                </div>
              </div>

              {selectedSubscription.company_name && (
                <div>
                  <p className="text-sm text-muted-foreground">Company</p>
                  <p className="font-medium">{selectedSubscription.company_name}</p>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">
                    {selectedSubscription.start_date 
                      ? format(new Date(selectedSubscription.start_date), "MMMM d, yyyy")
                      : "Not started"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Next Renewal</p>
                  <p className="font-medium">
                    {selectedSubscription.next_renewal_date
                      ? format(new Date(selectedSubscription.next_renewal_date), "MMMM d, yyyy")
                      : "N/A"}
                  </p>
                </div>
              </div>

              {Array.isArray(selectedSubscription.vehicles) && (selectedSubscription.vehicles as any[]).length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Vehicles</p>
                  <div className="space-y-2">
                    {(selectedSubscription.vehicles as any[]).map((vehicle, i) => (
                      <div key={i} className="text-sm bg-muted/50 p-2 rounded">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedSubscription.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg mt-1">{selectedSubscription.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}