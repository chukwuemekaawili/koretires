import { useState, useEffect } from "react";
import { Loader2, HelpCircle, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  tags: string[] | null;
  is_active: boolean | null;
  sort_order: number | null;
}

export function AdminFAQs() {
  const { toast } = useToast();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ question: "", answer: "", tags: "", is_active: true, sort_order: 0 });

  const fetchFaqs = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("faq_entries")
      .select("*")
      .order("sort_order", { ascending: true });
    
    if (!error) setFaqs(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const openCreate = () => {
    setEditingFaq(null);
    setFormData({ question: "", answer: "", tags: "", is_active: true, sort_order: faqs.length });
    setIsDialogOpen(true);
  };

  const openEdit = (faq: FAQ) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      tags: faq.tags?.join(", ") || "",
      is_active: faq.is_active ?? true,
      sort_order: faq.sort_order ?? 0,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    const tagsArray = formData.tags.split(",").map(t => t.trim()).filter(Boolean);
    const payload = {
      question: formData.question,
      answer: formData.answer,
      tags: tagsArray.length > 0 ? tagsArray : null,
      is_active: formData.is_active,
      sort_order: formData.sort_order,
    };

    if (editingFaq) {
      const { error } = await supabase.from("faq_entries").update(payload).eq("id", editingFaq.id);
      if (error) {
        toast({ title: "Error", description: "Failed to update FAQ", variant: "destructive" });
      } else {
        toast({ title: "Updated", description: "FAQ updated successfully" });
        setIsDialogOpen(false);
        fetchFaqs();
      }
    } else {
      const { error } = await supabase.from("faq_entries").insert(payload);
      if (error) {
        toast({ title: "Error", description: "Failed to create FAQ", variant: "destructive" });
      } else {
        toast({ title: "Created", description: "FAQ created successfully" });
        setIsDialogOpen(false);
        fetchFaqs();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;
    const { error } = await supabase.from("faq_entries").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete FAQ", variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "FAQ deleted" });
      fetchFaqs();
    }
  };

  const toggleActive = async (faq: FAQ) => {
    const { error } = await supabase
      .from("faq_entries")
      .update({ is_active: !faq.is_active })
      .eq("id", faq.id);
    if (!error) fetchFaqs();
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <>
      <Card className="bento-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            FAQs ({faqs.length})
          </CardTitle>
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add FAQ
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Question</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {faqs.map((faq) => (
                <TableRow key={faq.id}>
                  <TableCell className="w-16">{faq.sort_order}</TableCell>
                  <TableCell className="max-w-md truncate">{faq.question}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {faq.tags?.join(", ") || "-"}
                  </TableCell>
                  <TableCell>
                    <Switch checked={faq.is_active ?? true} onCheckedChange={() => toggleActive(faq)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(faq)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(faq.id)}>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFaq ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Question</Label>
              <Input
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Answer</Label>
              <Textarea
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                rows={4}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Tags (comma separated)</Label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="tires, winter, pricing"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(c) => setFormData({ ...formData, is_active: c })}
                />
                <Label>Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingFaq ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
