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
  city: string | null;
  status: string | null;
  document_url: string | null;
  created_at: string;
}

export function AdminDealers() {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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
                    {dealer.status === "pending" && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => updateStatus(dealer.id, "approved")}><CheckCircle className="h-4 w-4" /></Button>
                        <Button size="sm" variant="destructive" onClick={() => updateStatus(dealer.id, "rejected")}><XCircle className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}