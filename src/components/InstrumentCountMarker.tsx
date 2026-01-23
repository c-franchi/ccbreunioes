import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { INSTRUMENT_GROUPS, ALL_INSTRUMENTS } from "@/constants/instruments";

interface InstrumentCountMarkerProps {
  currentSessionId: string;
  attendances: any[];
  tipoContagem: string;
}

export const InstrumentCountMarker = ({ 
  currentSessionId, 
  attendances,
  tipoContagem 
}: InstrumentCountMarkerProps) => {
  const [instrumentCounts, setInstrumentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCounts();
  }, [attendances]);

  const loadCounts = () => {
    const counts: Record<string, number> = {};
    attendances.forEach(att => {
      if (att.instrument && !att.musician_id) {
        counts[att.instrument] = (counts[att.instrument] || 0) + 1;
      }
    });
    setInstrumentCounts(counts);
  };

  const handleIncrement = async (instrument: string) => {
    setLoading(true);
    const { error } = await supabase
      .from('attendances')
      .insert({
        meeting_session_id: currentSessionId,
        instrument: instrument,
        present: true,
        musician_id: null
      });

    if (error) {
      toast.error("Erro ao adicionar instrumento");
      console.error(error);
    } else {
      toast.success(`${instrument} adicionado`);
    }
    setLoading(false);
  };

  const handleDecrement = async (instrument: string) => {
    const count = instrumentCounts[instrument] || 0;
    if (count === 0) return;

    setLoading(true);
    // Remove apenas uma entrada deste instrumento
    const attendanceToRemove = attendances.find(
      att => att.instrument === instrument && !att.musician_id
    );

    if (attendanceToRemove) {
      const { error } = await supabase
        .from('attendances')
        .delete()
        .eq('id', attendanceToRemove.id);

      if (error) {
        toast.error("Erro ao remover instrumento");
        console.error(error);
      } else {
        toast.success(`${instrument} removido`);
      }
    }
    setLoading(false);
  };

  const groupInstruments = () => {
    if (tipoContagem === 'naipe') {
      return INSTRUMENT_GROUPS;
    } else {
      const grouped: Record<string, string[]> = {};
      ALL_INSTRUMENTS.forEach(inst => {
        grouped[inst] = [inst];
      });
      return grouped;
    }
  };

  const grouped = groupInstruments();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Contagem de Instrumentos {tipoContagem === 'naipe' ? '(Por Naipe)' : '(Por Instrumento)'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-[600px] overflow-y-auto">
          <Accordion type="multiple" className="w-full">
            {Object.entries(grouped).map(([group, instruments]) => (
              <AccordionItem key={group} value={group}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{group}</span>
                    <Badge variant="secondary">
                      {instruments.reduce((sum, inst) => sum + (instrumentCounts[inst] || 0), 0)}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-2">
                    {instruments.map((instrument) => {
                      const count = instrumentCounts[instrument] || 0;
                      
                      return (
                        <div
                          key={instrument}
                          className="flex items-center justify-between p-3 rounded-lg border bg-background hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{instrument}</span>
                            {count > 0 && (
                              <Badge variant="default">{count}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDecrement(instrument)}
                              disabled={count === 0 || loading}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleIncrement(instrument)}
                              disabled={loading}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
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
