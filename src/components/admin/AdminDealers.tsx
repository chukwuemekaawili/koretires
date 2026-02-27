import { useState, useEffect } from "react";
import { Loader2, Building2, CheckCircle, XCircle, Clock, Search, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Dealer {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  notes: string | null;
  status: string | null;
  document_url: string | null;
  created_at: string;
}

import { Edit, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function AdminDealers() {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDealer, setEditingDealer] = useState<Dealer | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchDealers();
  }, []);

  const fetchDealers = async () => {
    try {
      const { data, error } = await supabase.from("dealers").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setDealers(data || []);
    } catch (err) {
      toast.error("Failed to load dealers");
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from("dealers").update({ status, approved_at: status === "approved" ? new Date().toISOString() : null }).eq("id", id);
      if (error) throw error;
      toast.success(`Dealer ${status}`);
      fetchDealers();
    } catch (err) {
      toast.error("Failed to update dealer");
    }
  };

  const handleEditChange = (field: keyof Dealer, value: string) => {
    if (editingDealer) {
      setEditingDealer({ ...editingDealer, [field]: value });
    }
  };

  const saveDealer = async () => {
    if (!editingDealer) return;
    setIsSaving(true);
    try {
      const { id, business_name, contact_name, email, phone, address, city, postal_code, notes, status } = editingDealer;
      const { error } = await supabase.from("dealers").update({
        business_name, contact_name, email, phone, address, city, postal_code, notes, status
      }).eq("id", id);

      if (error) throw error;

      toast.success("Dealer updated successfully");
      setEditDialogOpen(false);
      fetchDealers();
    } catch (err) {
      toast.error("Failed to update dealer details");
    } finally {
      setIsSaving(false);
    }
  };

  const openEditDialog = (dealer: Dealer) => {
    setEditingDealer({ ...dealer });
    setEditDialogOpen(true);
  };

  const filtered = dealers.filter((d) => d.business_name.toLowerCase().includes(searchQuery.toLowerCase()) || d.email.toLowerCase().includes(searchQuery.toLowerCase()));

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search dealers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
      </div>
      <Card className="bento-card">
        <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Dealers ({filtered.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Docs</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((dealer) => (
                <TableRow key={dealer.id}>
                  <TableCell className="font-medium">{dealer.business_name}</TableCell>
                  <TableCell><div>{dealer.contact_name}<br /><span className="text-xs text-muted-foreground">{dealer.email}</span></div></TableCell>
                  <TableCell>{dealer.city || "-"}</TableCell>
                  <TableCell>
                    <Badge className={dealer.status === "approved" ? "bg-success" : dealer.status === "rejected" ? "bg-destructive" : "bg-warning"}>
                      {dealer.status || "pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {dealer.document_url ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        asChild
                      >
                        <a href={dealer.document_url} target="_blank" rel="noopener noreferrer" title="View document">
                          <FileText className="h-4 w-4 text-primary" />
                        </a>
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{format(new Date(dealer.created_at), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    {dealer.status === "pending" ? (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => updateStatus(dealer.id, "approved")} title="Approve"><CheckCircle className="h-4 w-4" /></Button>
                        <Button size="sm" variant="destructive" onClick={() => updateStatus(dealer.id, "rejected")} title="Reject"><XCircle className="h-4 w-4" /></Button>
                        <Button size="sm" variant="outline" onClick={() => updateStatus(dealer.id, "cancelled")} title="Cancel">Cancel</Button>
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(dealer)}><Edit className="h-4 w-4" /></Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(dealer)}><Edit className="h-4 w-4" /> Edit</Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Dealer</DialogTitle></DialogHeader>
          {editingDealer && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Business Name</Label>
                  <Input value={editingDealer.business_name} onChange={(e) => handleEditChange("business_name", e.target.value)} />
                </div>
                <div>
                  <Label>Contact Name</Label>
                  <Input value={editingDealer.contact_name} onChange={(e) => handleEditChange("contact_name", e.target.value)} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={editingDealer.email} onChange={(e) => handleEditChange("email", e.target.value)} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={editingDealer.phone} onChange={(e) => handleEditChange("phone", e.target.value)} />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input value={editingDealer.address || ""} onChange={(e) => handleEditChange("address", e.target.value)} />
                </div>
                <div>
                  <Label>City</Label>
                  <Input value={editingDealer.city || ""} onChange={(e) => handleEditChange("city", e.target.value)} />
                </div>
                <div>
                  <Label>Postal Code</Label>
                  <Input value={editingDealer.postal_code || ""} onChange={(e) => handleEditChange("postal_code", e.target.value)} />
                </div>
                <div>
                  <Label>Status</Label>
                  <select
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={editingDealer.status || "pending"}
                    onChange={(e) => handleEditChange("status", e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>Notes / Internal Comments</Label>
                <Textarea rows={3} value={editingDealer.notes || ""} onChange={(e) => handleEditChange("notes", e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                <Button onClick={saveDealer} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
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