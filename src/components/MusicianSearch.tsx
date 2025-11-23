import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, Plus, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AddMusicianDialog } from "./AddMusicianDialog";

interface MusicianSearchProps {
  currentSessionId: string | undefined;
}

export const MusicianSearch = ({ currentSessionId }: MusicianSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [musicians, setMusicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    if (searchTerm.length < 2) {
      setMusicians([]);
      return;
    }

    const searchMusicians = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('musicians')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .limit(10);

      if (error) {
        console.error(error);
      } else {
        setMusicians(data || []);
      }
      setLoading(false);
    };

    const debounce = setTimeout(searchMusicians, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const handleCheckIn = async (musician: any) => {
    if (!currentSessionId) {
      toast.error("Sessão não iniciada");
      return;
    }

    // Check if already checked in
    const { data: existing } = await supabase
      .from('attendances')
      .select('*')
      .eq('musician_id', musician.id)
      .eq('meeting_session_id', currentSessionId)
      .single();

    if (existing) {
      toast.info(`${musician.name} já teve presença confirmada!`);
      return;
    }

    const { error } = await supabase
      .from('attendances')
      .insert({
        musician_id: musician.id,
        meeting_session_id: currentSessionId,
        present: true
      });

    if (error) {
      toast.error("Erro ao confirmar presença");
      console.error(error);
    } else {
      toast.success(`Presença confirmada: ${musician.name}`);
      setSearchTerm("");
      setMusicians([]);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Digite o nome do músico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              variant="secondary" 
              size="icon"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          {/* Search Results */}
          {musicians.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {musicians.map((musician) => (
                <Card 
                  key={musician.id}
                  className="hover:bg-accent/50 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <h3 className="font-semibold">{musician.name}</h3>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="secondary">{musician.instrument}</Badge>
                          {musician.cargo_ministerio && (
                            <Badge variant="outline">{musician.cargo_ministerio}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{musician.localidade}</p>
                        <p className="text-xs text-muted-foreground">{musician.nivel}</p>
                      </div>
                      <Button
                        onClick={() => handleCheckIn(musician)}
                        size="sm"
                        className="flex-shrink-0"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Confirmar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {searchTerm.length >= 2 && musicians.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum músico encontrado</p>
              <Button 
                variant="link" 
                onClick={() => setShowAddDialog(true)}
                className="mt-2"
              >
                Adicionar novo músico
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      <AddMusicianDialog 
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
    </Card>
  );
};
