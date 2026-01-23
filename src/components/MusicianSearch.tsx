import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, Plus, CheckCircle2, Mic, MicOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AddMusicianDialog } from "./AddMusicianDialog";
import { normalizeText } from "@/lib/utils";

interface MusicianSearchProps {
  currentSessionId: string | undefined;
  attendances: any[];
}

export const MusicianSearch = ({ currentSessionId, attendances }: MusicianSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [musicians, setMusicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

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
        setMusicians([]);
      } else {
        setMusicians(data || []);
      }
      setLoading(false);
    };

    const debounce = setTimeout(searchMusicians, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'pt-BR';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchTerm(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        toast.error("Erro ao reconhecer voz");
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleVoiceSearch = () => {
    if (!recognitionRef.current) {
      toast.error("Busca por voz não disponível neste navegador");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      toast.info("Escutando...");
    }
  };

  const isAlreadyPresent = (musicianId: string) => {
    return attendances.some(att => att.musician_id === musicianId);
  };

  const handleCheckIn = async (musician: any) => {
    if (!currentSessionId) {
      toast.error("Sessão não iniciada");
      return;
    }

    if (isAlreadyPresent(musician.id)) {
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
                placeholder="Digite ou fale o nome do músico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              variant={isListening ? "default" : "secondary"}
              size="icon"
              onClick={toggleVoiceSearch}
              title="Buscar por voz"
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
            <Button 
              variant="secondary" 
              size="icon"
              onClick={() => setShowAddDialog(true)}
              title="Adicionar músico"
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
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base break-words">{musician.name}</h3>
                        <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">{musician.instrument}</Badge>
                          {musician.cargo_ministerio && (
                            <Badge variant="outline" className="text-xs">{musician.cargo_ministerio}</Badge>
                          )}
                        </div>
                        {musician.localidade && (
                          <p className="text-xs sm:text-sm text-muted-foreground break-words">{musician.localidade}</p>
                        )}
                        {musician.nivel && (
                          <p className="text-xs text-muted-foreground">{musician.nivel}</p>
                        )}
                      </div>
                      <Button
                        onClick={() => handleCheckIn(musician)}
                        size="sm"
                        className="flex-shrink-0 w-full sm:w-auto text-xs sm:text-sm"
                        variant={isAlreadyPresent(musician.id) ? "secondary" : "default"}
                        disabled={isAlreadyPresent(musician.id)}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        {isAlreadyPresent(musician.id) ? "Já Presente" : "Confirmar"}
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
