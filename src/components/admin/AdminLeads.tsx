import { useState, useEffect } from "react";
import { Loader2, Users, Search, Eye, Phone, Mail, Calendar, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Lead {
  id: string;
  source_channel: string;
  lead_type: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  assigned_to: string | null;
  next_action_at: string | null;
  internal_notes: string | null;
  tire_size: string | null;
  vehicle_year: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  budget: string | null;
  notes: string | null;
  conversation_id: string | null;
  created_at: string;
}

interface Conversation {
  id: string;
  messages: any;
  intent: string | null;
  channel: string;
}

const statusColors: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-500",
  contacted: "bg-purple-500/10 text-purple-500",
  qualified: "bg-yellow-500/10 text-yellow-500",
  won: "bg-green-500/10 text-green-500",
  lost: "bg-red-500/10 text-red-500",
};

export function AdminLeads() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loadingConvo, setLoadingConvo] = useState(false);

  const fetchLeads = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("ai_leads")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching leads:", error);
    } else {
      setLeads(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchConversation = async (conversationId: string) => {
    setLoadingConvo(true);
    const { data, error } = await supabase
      .from("ai_conversations")
      .select("*")
      .eq("id", conversationId)
      .single();
    
    if (!error && data) {
      setConversation(data);
    }
    setLoadingConvo(false);
  };

  const updateLead = async (leadId: string, updates: Partial<Lead>) => {
    const { error } = await supabase
      .from("ai_leads")
      .update(updates)
      .eq("id", leadId);
    
    if (error) {
      toast({ title: "Error", description: "Failed to update lead", variant: "destructive" });
    } else {
      toast({ title: "Updated", description: "Lead updated successfully" });
      fetchLeads();
      if (selectedLead?.id === leadId) {
        setSelectedLead({ ...selectedLead, ...updates });
      }
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      (lead.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.phone?.includes(searchTerm));
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openLeadDetail = (lead: Lead) => {
    setSelectedLead(lead);
    if (lead.conversation_id) {
      fetchConversation(lead.conversation_id);
    } else {
      setConversation(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Card className="bento-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            AI Leads ({leads.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Vehicle/Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No leads found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{lead.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{lead.email || lead.phone || "-"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {lead.lead_type.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {lead.source_channel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {lead.tire_size || (lead.vehicle_year && `${lead.vehicle_year} ${lead.vehicle_make}`) || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[lead.status] || "bg-muted"}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(lead.created_at), "MMM d, HH:mm")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openLeadDetail(lead)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Select
                          value={lead.status}
                          onValueChange={(v) => updateLead(lead.id, { status: v })}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="qualified">Qualified</SelectItem>
                            <SelectItem value="won">Won</SelectItem>
                            <SelectItem value="lost">Lost</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Lead Detail Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
          </DialogHeader>
          
          {selectedLead && (
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Name:</strong> {selectedLead.name || "Unknown"}</p>
                    {selectedLead.email && (
                      <p className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <a href={`mailto:${selectedLead.email}`} className="text-primary hover:underline">
                          {selectedLead.email}
                        </a>
                      </p>
                    )}
                    {selectedLead.phone && (
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <a href={`tel:${selectedLead.phone}`} className="text-primary hover:underline">
                          {selectedLead.phone}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium">Lead Info</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Type:</strong> {selectedLead.lead_type.replace(/_/g, " ")}</p>
                    <p><strong>Channel:</strong> {selectedLead.source_channel}</p>
                    <p><strong>Created:</strong> {format(new Date(selectedLead.created_at), "PPpp")}</p>
                    {selectedLead.tire_size && <p><strong>Tire Size:</strong> {selectedLead.tire_size}</p>}
                    {selectedLead.vehicle_year && (
                      <p><strong>Vehicle:</strong> {selectedLead.vehicle_year} {selectedLead.vehicle_make} {selectedLead.vehicle_model}</p>
                    )}
                    {selectedLead.budget && <p><strong>Budget:</strong> {selectedLead.budget}</p>}
                  </div>
                </div>
              </div>

              {/* Status & Actions */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select
                    value={selectedLead.status}
                    onValueChange={(v) => updateLead(selectedLead.id, { status: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="won">Won</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Next Action Date</Label>
                  <Input
                    type="datetime-local"
                    value={selectedLead.next_action_at?.slice(0, 16) || ""}
                    onChange={(e) => updateLead(selectedLead.id, { next_action_at: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label>Internal Notes</Label>
                <Textarea
                  value={selectedLead.internal_notes || ""}
                  onChange={(e) => updateLead(selectedLead.id, { internal_notes: e.target.value })}
                  placeholder="Add internal notes..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              {/* Conversation Transcript */}
              {selectedLead.conversation_id && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Conversation Transcript
                  </h4>
                  {loadingConvo ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : conversation ? (
                    <div className="bg-secondary/50 rounded-lg p-4 max-h-60 overflow-y-auto space-y-3">
                      {(conversation.messages as any[])?.map((msg, i) => (
                        <div key={i} className={`text-sm ${msg.role === "user" ? "text-primary" : "text-muted-foreground"}`}>
                          <strong>{msg.role === "user" ? "Customer" : "AI"}:</strong> {msg.content}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No transcript available</p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
