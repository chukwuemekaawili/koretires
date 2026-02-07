import { useState, useEffect } from "react";
import { Loader2, FileText, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Policy {
  id: string;
  key: string;
  title: string;
  content: string;
  category: string | null;
  is_active: boolean | null;
}

const categories = ["legal", "shipping", "returns", "warranty", "payment", "general"];

export function AdminPolicies() {
  const { toast } = useToast();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ key: "", title: "", content: "", category: "general", is_active: true });

  const fetchPolicies = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("policies")
      .select("*")
      .order("category", { ascending: true });
    
    if (!error) setPolicies(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const openCreate = () => {
    setEditingPolicy(null);
    setFormData({ key: "", title: "", content: "", category: "general", is_active: true });
    setIsDialogOpen(true);
  };

  const openEdit = (policy: Policy) => {
    setEditingPolicy(policy);
    setFormData({
      key: policy.key,
      title: policy.title,
      content: policy.content,
      category: policy.category || "general",
      is_active: policy.is_active ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      key: formData.key,
      title: formData.title,
      content: formData.content,
      category: formData.category,
      is_active: formData.is_active,
    };

    if (editingPolicy) {
      const { error } = await supabase.from("policies").update(payload).eq("id", editingPolicy.id);
      if (error) {
        toast({ title: "Error", description: "Failed to update policy", variant: "destructive" });
      } else {
        toast({ title: "Updated", description: "Policy updated successfully" });
        setIsDialogOpen(false);
        fetchPolicies();
      }
    } else {
      const { error } = await supabase.from("policies").insert(payload);
      if (error) {
        toast({ title: "Error", description: "Failed to create policy", variant: "destructive" });
      } else {
        toast({ title: "Created", description: "Policy created successfully" });
        setIsDialogOpen(false);
        fetchPolicies();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this policy?")) return;
    const { error } = await supabase.from("policies").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete policy", variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Policy deleted" });
      fetchPolicies();
    }
  };

  const toggleActive = async (policy: Policy) => {
    const { error } = await supabase
      .from("policies")
      .update({ is_active: !policy.is_active })
      .eq("id", policy.id);
    if (!error) fetchPolicies();
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <>
      <Card className="bento-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Policies ({policies.length})
          </CardTitle>
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Policy
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.map((policy) => (
                <TableRow key={policy.id}>
                  <TableCell className="font-mono text-xs">{policy.key}</TableCell>
                  <TableCell>{policy.title}</TableCell>
                  <TableCell className="capitalize">{policy.category}</TableCell>
                  <TableCell>
                    <Switch checked={policy.is_active ?? true} onCheckedChange={() => toggleActive(policy)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(policy)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(policy.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPolicy ? "Edit Policy" : "Add Policy"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Key (unique identifier)</Label>
                <Input
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  placeholder="e.g., return_policy"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={8}
                className="mt-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(c) => setFormData({ ...formData, is_active: c })}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingPolicy ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
