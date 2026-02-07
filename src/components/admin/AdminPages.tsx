import { useState, useEffect } from "react";
import { Loader2, FileText, Plus, Pencil, Trash2, ChevronDown, ChevronRight, Eye, Copy, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";

interface PageSection {
  id: string;
  page_id: string;
  section_key: string;
  section_type: string;
  sort_order: number | null;
  content_json: Json;
  is_active: boolean | null;
}

interface Page {
  id: string;
  slug: string;
  title: string;
  seo_title: string | null;
  seo_description: string | null;
  og_image: string | null;
  canonical_url: string | null;
  noindex: boolean | null;
  is_active: boolean | null;
  sections?: PageSection[];
}

// Section type templates with example JSON
const sectionTemplates: Record<string, { label: string; example: object }> = {
  hero: { 
    label: "Hero", 
    example: { headline: "Page Title", body: "Description text...", cta_primary: "Get Started", cta_secondary: "Learn More" }
  },
  rich_text: { 
    label: "Rich Text", 
    example: { title: "Section Title", body: "Your content here. Supports basic text." }
  },
  bullets: { 
    label: "Bullets List", 
    example: { title: "Key Points", items: ["First point", "Second point", "Third point"] }
  },
  cards: { 
    label: "Cards Grid", 
    example: { title: "Our Services", cards: [{ title: "Card 1", description: "Description", icon: "shield" }] }
  },
  stats: { 
    label: "Stats Row", 
    example: { items: [{ value: "10+", label: "Years Experience" }, { value: "5000+", label: "Happy Customers" }] }
  },
  faq: { 
    label: "FAQ", 
    example: { title: "Frequently Asked", items: [{ question: "How does it work?", answer: "Answer here..." }] }
  },
  cta: { 
    label: "Call to Action", 
    example: { headline: "Ready to Start?", body: "Contact us today", buttons: [{ label: "Contact", href: "/contact" }] }
  },
  content: { 
    label: "Generic Content", 
    example: { title: "", body: "" }
  },
};

export function AdminPages() {
  const { toast } = useToast();
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedPage, setExpandedPage] = useState<string | null>(null);
  
  const [isPageDialogOpen, setIsPageDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [pageForm, setPageForm] = useState({ 
    slug: "", title: "", seo_title: "", seo_description: "", og_image: "", 
    canonical_url: "", noindex: false, is_active: true 
  });
  
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<PageSection | null>(null);
  const [sectionPageId, setSectionPageId] = useState<string | null>(null);
  const [sectionForm, setSectionForm] = useState({ 
    section_key: "", section_type: "content", sort_order: 0, content_json: "{}", is_active: true 
  });
  const [sectionEditMode, setSectionEditMode] = useState<"visual" | "json">("visual");
  
  // Visual form state for common templates
  const [visualForm, setVisualForm] = useState<Record<string, any>>({});

  const fetchPages = async () => {
    setIsLoading(true);
    const { data: pagesData, error: pagesError } = await supabase
      .from("pages")
      .select("*")
      .order("title");
    
    if (pagesError) {
      toast({ title: "Error", description: "Failed to load pages", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const { data: sectionsData } = await supabase
      .from("page_sections")
      .select("*")
      .order("sort_order");

    const pagesWithSections = (pagesData || []).map(page => ({
      ...page,
      sections: (sectionsData || []).filter(s => s.page_id === page.id)
    })) as Page[];

    setPages(pagesWithSections);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const openCreatePage = () => {
    setEditingPage(null);
    setPageForm({ 
      slug: "", title: "", seo_title: "", seo_description: "", og_image: "", 
      canonical_url: "", noindex: false, is_active: true 
    });
    setIsPageDialogOpen(true);
  };

  const openEditPage = (page: Page) => {
    setEditingPage(page);
    setPageForm({
      slug: page.slug,
      title: page.title,
      seo_title: page.seo_title || "",
      seo_description: page.seo_description || "",
      og_image: page.og_image || "",
      canonical_url: page.canonical_url || "",
      noindex: page.noindex ?? false,
      is_active: page.is_active ?? true,
    });
    setIsPageDialogOpen(true);
  };

  const handleSavePage = async () => {
    const payload = {
      slug: pageForm.slug,
      title: pageForm.title,
      seo_title: pageForm.seo_title || null,
      seo_description: pageForm.seo_description || null,
      og_image: pageForm.og_image || null,
      canonical_url: pageForm.canonical_url || null,
      noindex: pageForm.noindex,
      is_active: pageForm.is_active,
    };

    if (editingPage) {
      const { error } = await supabase.from("pages").update(payload).eq("id", editingPage.id);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Updated", description: "Page updated successfully" });
        setIsPageDialogOpen(false);
        fetchPages();
      }
    } else {
      const { error } = await supabase.from("pages").insert(payload);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Created", description: "Page created successfully" });
        setIsPageDialogOpen(false);
        fetchPages();
      }
    }
  };

  const handleDeletePage = async (id: string) => {
    if (!confirm("Delete this page and all its sections?")) return;
    const { error } = await supabase.from("pages").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete page", variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Page deleted" });
      fetchPages();
    }
  };

  const openCreateSection = (pageId: string) => {
    setEditingSection(null);
    setSectionPageId(pageId);
    const page = pages.find(p => p.id === pageId);
    setSectionForm({ 
      section_key: "", 
      section_type: "content", 
      sort_order: (page?.sections?.length || 0) + 1, 
      content_json: "{}", 
      is_active: true 
    });
    setIsSectionDialogOpen(true);
  };

  const openEditSection = (section: PageSection) => {
    setEditingSection(section);
    setSectionPageId(section.page_id);
    setSectionForm({
      section_key: section.section_key,
      section_type: section.section_type,
      sort_order: section.sort_order ?? 0,
      content_json: JSON.stringify(section.content_json, null, 2),
      is_active: section.is_active ?? true,
    });
    setIsSectionDialogOpen(true);
  };

  const handleSaveSection = async () => {
    let parsedContent: Json;
    try {
      parsedContent = JSON.parse(sectionForm.content_json) as Json;
    } catch {
      toast({ title: "Error", description: "Invalid JSON in content", variant: "destructive" });
      return;
    }

    const payload = {
      page_id: sectionPageId!,
      section_key: sectionForm.section_key,
      section_type: sectionForm.section_type,
      sort_order: sectionForm.sort_order,
      content_json: parsedContent,
      is_active: sectionForm.is_active,
    };

    if (editingSection) {
      const { error } = await supabase.from("page_sections").update(payload).eq("id", editingSection.id);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Updated", description: "Section updated" });
        setIsSectionDialogOpen(false);
        fetchPages();
      }
    } else {
      const { error } = await supabase.from("page_sections").insert(payload);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Created", description: "Section created" });
        setIsSectionDialogOpen(false);
        fetchPages();
      }
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm("Delete this section?")) return;
    const { error } = await supabase.from("page_sections").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete section", variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Section deleted" });
      fetchPages();
    }
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
            Pages CMS ({pages.length})
          </CardTitle>
          <Button onClick={openCreatePage} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Page
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {pages.map((page) => (
            <Collapsible
              key={page.id}
              open={expandedPage === page.id}
              onOpenChange={() => setExpandedPage(expandedPage === page.id ? null : page.id)}
            >
              <div className="border rounded-lg">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-secondary/50">
                    <div className="flex items-center gap-3">
                      {expandedPage === page.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <span className="font-medium">{page.title}</span>
                      <Badge variant="outline" className="text-xs">/{page.slug}</Badge>
                      <Badge variant={page.is_active ? "default" : "secondary"} className="text-xs">
                        {page.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">{page.sections?.length || 0} sections</Badge>
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" asChild>
                        <a href={`/${page.slug === 'home' ? '' : page.slug}`} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditPage(page)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeletePage(page.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border-t p-3 bg-secondary/20">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-muted-foreground">Sections</span>
                      <Button size="sm" variant="outline" onClick={() => openCreateSection(page.id)}>
                        <Plus className="h-3 w-3 mr-1" />
                        Add Section
                      </Button>
                    </div>
                    {page.sections && page.sections.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">Order</TableHead>
                            <TableHead>Key</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Active</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {page.sections.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map((section) => (
                            <TableRow key={section.id}>
                              <TableCell>{section.sort_order}</TableCell>
                              <TableCell className="font-mono text-sm">{section.section_key}</TableCell>
                              <TableCell><Badge variant="outline">{section.section_type}</Badge></TableCell>
                              <TableCell>
                                <Badge variant={section.is_active ? "default" : "secondary"}>
                                  {section.is_active ? "Yes" : "No"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="icon" onClick={() => openEditSection(section)}>
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleDeleteSection(section.id)}>
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4 text-center">No sections yet</p>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </CardContent>
      </Card>

      {/* Page Dialog */}
      <Dialog open={isPageDialogOpen} onOpenChange={setIsPageDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPage ? "Edit Page" : "Add Page"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Slug</Label>
                <Input
                  value={pageForm.slug}
                  onChange={(e) => setPageForm({ ...pageForm, slug: e.target.value })}
                  placeholder="about-us"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Title</Label>
                <Input
                  value={pageForm.title}
                  onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })}
                  placeholder="About Us"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>SEO Title</Label>
              <Input
                value={pageForm.seo_title}
                onChange={(e) => setPageForm({ ...pageForm, seo_title: e.target.value })}
                placeholder="About Us | Kore Tires"
                className="mt-1"
              />
            </div>
            <div>
              <Label>SEO Description</Label>
              <Textarea
                value={pageForm.seo_description}
                onChange={(e) => setPageForm({ ...pageForm, seo_description: e.target.value })}
                rows={2}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>OG Image URL</Label>
                <Input
                  value={pageForm.og_image}
                  onChange={(e) => setPageForm({ ...pageForm, og_image: e.target.value })}
                  placeholder="https://..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Canonical URL (optional)</Label>
                <Input
                  value={pageForm.canonical_url}
                  onChange={(e) => setPageForm({ ...pageForm, canonical_url: e.target.value })}
                  placeholder="https://..."
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={pageForm.is_active}
                  onCheckedChange={(c) => setPageForm({ ...pageForm, is_active: c })}
                />
                <Label>Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={pageForm.noindex}
                  onCheckedChange={(c) => setPageForm({ ...pageForm, noindex: c })}
                />
                <Label>No Index</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPageDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePage}>{editingPage ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Section Dialog with Templates */}
      <Dialog open={isSectionDialogOpen} onOpenChange={setIsSectionDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSection ? "Edit Section" : "Add Section"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label>Section Key</Label>
                <Input
                  value={sectionForm.section_key}
                  onChange={(e) => setSectionForm({ ...sectionForm, section_key: e.target.value })}
                  placeholder="hero"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select 
                  value={sectionForm.section_type} 
                  onValueChange={(v) => setSectionForm({ ...sectionForm, section_type: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(sectionTemplates).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={sectionForm.sort_order}
                  onChange={(e) => setSectionForm({ ...sectionForm, sort_order: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
              <div className="flex items-end pb-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const template = sectionTemplates[sectionForm.section_type];
                    if (template) {
                      setSectionForm({ 
                        ...sectionForm, 
                        content_json: JSON.stringify(template.example, null, 2) 
                      });
                    }
                  }}
                >
                  <Wand2 className="h-4 w-4 mr-1" />
                  Template
                </Button>
              </div>
            </div>

            {/* Template hint */}
            {sectionTemplates[sectionForm.section_type] && (
              <div className="text-xs text-muted-foreground p-2 bg-secondary/50 rounded">
                <strong>{sectionTemplates[sectionForm.section_type].label}</strong>: 
                {" "}Expected fields: {Object.keys(sectionTemplates[sectionForm.section_type].example).join(", ")}
              </div>
            )}

            <div>
              <Label>Content (JSON)</Label>
              <Textarea
                value={sectionForm.content_json}
                onChange={(e) => setSectionForm({ ...sectionForm, content_json: e.target.value })}
                rows={14}
                className="mt-1 font-mono text-sm"
                placeholder='{"headline": "Welcome", "body": "..."}'
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={sectionForm.is_active}
                onCheckedChange={(c) => setSectionForm({ ...sectionForm, is_active: c })}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSectionDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSection}>{editingSection ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
