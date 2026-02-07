import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

interface PageSection {
  id: string;
  section_key: string;
  section_type: string;
  sort_order: number;
  content_json: Json;
  is_active: boolean;
}

interface PageData {
  id: string;
  slug: string;
  title: string;
  seo_title: string | null;
  seo_description: string | null;
  og_image: string | null;
  sections: PageSection[];
}

export function usePageContent(slug: string) {
  const [page, setPage] = useState<PageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async () => {
    if (!slug) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch page
      const { data: pageData, error: pageError } = await supabase
        .from("pages")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (pageError) {
        if (pageError.code === "PGRST116") {
          // Page not found - not an error, just return null
          setPage(null);
          setIsLoading(false);
          return;
        }
        throw pageError;
      }

      // Fetch sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from("page_sections")
        .select("*")
        .eq("page_id", pageData.id)
        .eq("is_active", true)
        .order("sort_order");

      if (sectionsError) throw sectionsError;

      setPage({
        ...pageData,
        sections: sectionsData || []
      });
    } catch (err: any) {
      console.error("Error fetching page content:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  /**
   * Get a specific section by key
   */
  const getSection = useCallback((sectionKey: string): Json | null => {
    if (!page) return null;
    const section = page.sections.find(s => s.section_key === sectionKey);
    return section?.content_json || null;
  }, [page]);

  /**
   * Get section content with type safety
   */
  const getSectionAs = useCallback(<T,>(
    sectionKey: string,
    defaultValue: T
  ): T => {
    const content = getSection(sectionKey);
    if (!content || typeof content !== 'object' || Array.isArray(content)) {
      return defaultValue;
    }
    return { ...defaultValue, ...(content as object) } as T;
  }, [getSection]);

  /**
   * Check if a section exists
   */
  const hasSection = useCallback((sectionKey: string): boolean => {
    if (!page) return false;
    return page.sections.some(s => s.section_key === sectionKey);
  }, [page]);

  return {
    page,
    isLoading,
    error,
    getSection,
    getSectionAs,
    hasSection,
    refetch: fetchPage
  };
}
