import { useState, useEffect } from "react";
import { Loader2, MessageSquare, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export function AdminConversations() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("ai_conversations").select("*").order("created_at", { ascending: false }).limit(100);
      setConversations(data || []);
      setIsLoading(false);
    };
    fetch();
  }, []);

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <Card className="bento-card">
      <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" />AI Conversations ({conversations.length})</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Intent</TableHead>
              <TableHead>Messages</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conversations.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-xs">{c.session_id?.slice(0, 20)}...</TableCell>
                <TableCell><Badge variant="secondary">{c.channel}</Badge></TableCell>
                <TableCell>{c.intent || "-"}</TableCell>
                <TableCell>{(c.messages as any[])?.length || 0}</TableCell>
                <TableCell>{format(new Date(c.created_at), "MMM d, HH:mm")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}