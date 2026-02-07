import { useState, useEffect } from "react";
import { Loader2, ClipboardList, Search, Eye, Filter, Calendar, User, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, subDays } from "date-fns";
import type { Json } from "@/integrations/supabase/types";

interface AuditLogEntry {
  id: string;
  table_name: string;
  action: string;
  record_id: string | null;
  user_id: string | null;
  old_values: Json;
  new_values: Json;
  ip_address: string | null;
  created_at: string;
}

const actionColors: Record<string, string> = {
  INSERT: "bg-green-500",
  UPDATE: "bg-primary",
  DELETE: "bg-destructive",
};

const tableNames = [
  "products",
  "orders",
  "invoices",
  "dealers",
  "checkout_addons",
  "subscriptions",
  "subscription_plans",
  "mobile_swap_bookings",
  "site_settings",
  "company_info",
];

export function AdminAuditLog() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tableFilter, setTableFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);
  const [dateRange, setDateRange] = useState("7");

  useEffect(() => {
    fetchEntries();
  }, [dateRange]);

  const fetchEntries = async () => {
    setIsLoading(true);
    try {
      const fromDate = subDays(new Date(), parseInt(dateRange)).toISOString();
      
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .gte("created_at", fromDate)
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;
      setEntries(data || []);
    } catch (err) {
      console.error("Error fetching audit log:", err);
      toast.error("Failed to load audit log");
    } finally {
      setIsLoading(false);
    }
  };

  const formatChanges = (oldValues: Json, newValues: Json): { field: string; old: string; new: string }[] => {
    const changes: { field: string; old: string; new: string }[] = [];
    
    const oldObj = (typeof oldValues === "object" && oldValues !== null && !Array.isArray(oldValues)) 
      ? oldValues as Record<string, Json> 
      : {};
    const newObj = (typeof newValues === "object" && newValues !== null && !Array.isArray(newValues)) 
      ? newValues as Record<string, Json> 
      : {};

    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
    
    allKeys.forEach(key => {
      const oldVal = oldObj[key];
      const newVal = newObj[key];
      
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes.push({
          field: key,
          old: oldVal !== undefined ? JSON.stringify(oldVal) : "-",
          new: newVal !== undefined ? JSON.stringify(newVal) : "-",
        });
      }
    });

    return changes;
  };

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch = 
      entry.table_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.record_id || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTable = tableFilter === "all" || entry.table_name === tableFilter;
    const matchesAction = actionFilter === "all" || entry.action === actionFilter;
    return matchesSearch && matchesTable && matchesAction;
  });

  const actionCounts = {
    INSERT: entries.filter(e => e.action === "INSERT").length,
    UPDATE: entries.filter(e => e.action === "UPDATE").length,
    DELETE: entries.filter(e => e.action === "DELETE").length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by table or record ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={tableFilter} onValueChange={setTableFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Table" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tables</SelectItem>
            {tableNames.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="INSERT">Insert</SelectItem>
            <SelectItem value="UPDATE">Update</SelectItem>
            <SelectItem value="DELETE">Delete</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-36">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Last 24 hours</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bento-card">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{entries.length}</p>
            <p className="text-sm text-muted-foreground">Total Changes</p>
          </CardContent>
        </Card>
        <Card className="bento-card">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-green-500">{actionCounts.INSERT}</p>
            <p className="text-sm text-muted-foreground">Inserts</p>
          </CardContent>
        </Card>
        <Card className="bento-card">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-primary">{actionCounts.UPDATE}</p>
            <p className="text-sm text-muted-foreground">Updates</p>
          </CardContent>
        </Card>
        <Card className="bento-card">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-destructive">{actionCounts.DELETE}</p>
            <p className="text-sm text-muted-foreground">Deletes</p>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log Table */}
      <Card className="bento-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Audit Log ({filteredEntries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12">
              <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No audit log entries found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Changes to products, orders, and settings will appear here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Record ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="whitespace-nowrap">
                        <div>
                          <p className="text-sm">{format(new Date(entry.created_at), "MMM d, yyyy")}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(entry.created_at), "h:mm:ss a")}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {entry.table_name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={actionColors[entry.action] || "bg-muted"}>
                          {entry.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs max-w-[100px] truncate">
                        {entry.record_id || "-"}
                      </TableCell>
                      <TableCell className="font-mono text-xs max-w-[100px] truncate">
                        {entry.user_id ? entry.user_id.slice(0, 8) + "..." : "System"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {entry.ip_address || "-"}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedEntry(entry)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Audit Log Details
            </DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-6">
              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Timestamp</p>
                  <p className="font-medium">{format(new Date(selectedEntry.created_at), "MMMM d, yyyy h:mm:ss a")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Action</p>
                  <Badge className={actionColors[selectedEntry.action] || "bg-muted"}>
                    {selectedEntry.action}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Table</p>
                  <p className="font-mono">{selectedEntry.table_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Record ID</p>
                  <p className="font-mono text-xs break-all">{selectedEntry.record_id || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">User ID</p>
                  <p className="font-mono text-xs break-all">{selectedEntry.user_id || "System"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">IP Address</p>
                  <p className="font-mono">{selectedEntry.ip_address || "-"}</p>
                </div>
              </div>

              <Separator />

              {/* Changes */}
              {selectedEntry.action === "UPDATE" && (
                <div>
                  <h4 className="font-semibold mb-3">Changes</h4>
                  <div className="space-y-2">
                    {formatChanges(selectedEntry.old_values, selectedEntry.new_values).map((change, i) => (
                      <div key={i} className="bg-muted/50 p-3 rounded-lg">
                        <p className="font-medium text-sm mb-1">{change.field}</p>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="text-muted-foreground mb-1">Old Value</p>
                            <pre className="bg-background p-2 rounded overflow-x-auto">{change.old}</pre>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">New Value</p>
                            <pre className="bg-background p-2 rounded overflow-x-auto">{change.new}</pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedEntry.action === "INSERT" && selectedEntry.new_values && (
                <div>
                  <h4 className="font-semibold mb-3">Created Record</h4>
                  <pre className="bg-muted/50 p-4 rounded-lg overflow-x-auto text-xs">
                    {JSON.stringify(selectedEntry.new_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedEntry.action === "DELETE" && selectedEntry.old_values && (
                <div>
                  <h4 className="font-semibold mb-3">Deleted Record</h4>
                  <pre className="bg-muted/50 p-4 rounded-lg overflow-x-auto text-xs">
                    {JSON.stringify(selectedEntry.old_values, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}