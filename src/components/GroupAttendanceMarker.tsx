import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface GroupAttendanceMarkerProps {
  currentSessionId: string;
  attendances: any[];
  tipoContagem: string;
}

const INSTRUMENT_GROUPS = {
  Cordas: ['Violino', 'Viola', 'Violoncelo'],
  Madeiras: [
    'Flauta', 'Oboé', "Oboé D'Amore", 'Corne Inglês',
    'Clarinete', 'Clarinete Alto', 'Clarinete Baixo', 'Fagote',
    'Saxofone Soprano', 'Saxofone Alto', 'Saxofone Tenor', 'Saxofone Baritono'
  ],
  Metais: [
    'Trompete / Cornet', 'Flugelhom', 'Trompa',
    'Trombone / Trombonito', 'Baritono', 'Eufônio', 'Tuba', 'Acordeon'
  ],
  Outros: ['Não Incluído no MOD']
};

export const GroupAttendanceMarker = ({ 
  currentSessionId, 
  attendances,
  tipoContagem 
}: GroupAttendanceMarkerProps) => {
  const [musicians, setMusicians] = useState<any[]>([]);
  const [selectedMusicians, setSelectedMusicians] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMusicians();
  }, []);

  const loadMusicians = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('musicians')
      .select('*')
      .order('instrument')
      .order('name');

    if (error) {
      console.error(error);
      toast.error("Erro ao carregar músicos");
    } else {
      setMusicians(data || []);
    }
    setLoading(false);
  };

  const isAlreadyPresent = (musicianId: string) => {
    return attendances.some(att => att.musician_id === musicianId);
  };

  const toggleMusician = (musicianId: string) => {
    const newSelected = new Set(selectedMusicians);
    if (newSelected.has(musicianId)) {
      newSelected.delete(musicianId);
    } else {
      newSelected.add(musicianId);
    }
    setSelectedMusicians(newSelected);
  };

  const handleConfirmSelected = async () => {
    if (selectedMusicians.size === 0) {
      toast.info("Selecione pelo menos um músico");
      return;
    }

    const attendancesToInsert = Array.from(selectedMusicians)
      .filter(id => !isAlreadyPresent(id))
      .map(id => ({
        musician_id: id,
        meeting_session_id: currentSessionId,
        present: true
      }));

    if (attendancesToInsert.length === 0) {
      toast.info("Todos os músicos selecionados já estão presentes");
      setSelectedMusicians(new Set());
      return;
    }

    const { error } = await supabase
      .from('attendances')
      .insert(attendancesToInsert);

    if (error) {
      toast.error("Erro ao confirmar presenças");
      console.error(error);
    } else {
      toast.success(`${attendancesToInsert.length} presenças confirmadas`);
      setSelectedMusicians(new Set());
    }
  };

  const groupMusiciansByGroup = () => {
    if (tipoContagem === 'naipe') {
      const grouped: Record<string, any[]> = {};
      musicians.forEach(musician => {
        for (const [group, instruments] of Object.entries(INSTRUMENT_GROUPS)) {
          if (instruments.some(inst => 
            musician.instrument.toLowerCase().includes(inst.toLowerCase())
          )) {
            if (!grouped[group]) grouped[group] = [];
            grouped[group].push(musician);
            break;
          }
        }
      });
      return grouped;
    } else {
      const grouped: Record<string, any[]> = {};
      musicians.forEach(musician => {
        const instrument = musician.instrument || 'Outros';
        if (!grouped[instrument]) grouped[instrument] = [];
        grouped[instrument].push(musician);
      });
      return grouped;
    }
  };

  const groupedMusicians = groupMusiciansByGroup();

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Carregando músicos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            Marcar Presença em Grupo {tipoContagem === 'naipe' ? '(Por Naipe)' : '(Por Instrumento)'}
          </CardTitle>
          {selectedMusicians.size > 0 && (
            <Button onClick={handleConfirmSelected}>
              Confirmar {selectedMusicians.size} Selecionados
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-[600px] overflow-y-auto">
          <Accordion type="multiple" className="w-full">
            {Object.entries(groupedMusicians).map(([group, groupMusicians]) => (
              <AccordionItem key={group} value={group}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{group}</span>
                    <Badge variant="secondary">{groupMusicians.length}</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-2">
                    {groupMusicians.map((musician) => {
                      const alreadyPresent = isAlreadyPresent(musician.id);
                      const isSelected = selectedMusicians.has(musician.id);
                      
                      return (
                        <div
                          key={musician.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border ${
                            alreadyPresent 
                              ? 'bg-muted/50 border-muted' 
                              : isSelected 
                                ? 'bg-primary/10 border-primary' 
                                : 'bg-background border-border hover:bg-accent/50'
                          } transition-colors`}
                        >
                          <Checkbox
                            checked={isSelected}
                            disabled={alreadyPresent}
                            onCheckedChange={() => toggleMusician(musician.id)}
                          />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${alreadyPresent ? 'text-muted-foreground' : ''}`}>
                                {musician.name}
                              </span>
                              {alreadyPresent && (
                                <Badge variant="secondary" className="text-xs">
                                  Já Presente
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {musician.instrument}
                              </Badge>
                              {musician.localidade && (
                                <span className="text-xs text-muted-foreground">
                                  {musician.localidade}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </CardContent>
    </Card>
  );
};
