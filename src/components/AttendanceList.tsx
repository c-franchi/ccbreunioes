import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface AttendanceListProps {
  attendances: any[];
  sessionId: string | undefined;
}

export const AttendanceList = ({ attendances, sessionId }: AttendanceListProps) => {
  const handleRemove = async (attendanceId: string, musicianName: string) => {
    const { error } = await supabase
      .from('attendances')
      .delete()
      .eq('id', attendanceId);

    if (error) {
      toast.error("Erro ao remover presença");
      console.error(error);
    } else {
      toast.success(`Presença removida: ${musicianName}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          Presenças Confirmadas ({attendances.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-[600px] overflow-y-auto">
          {attendances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma presença confirmada ainda</p>
              <p className="text-sm mt-2">
                Use a busca acima para confirmar presenças
              </p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {Array.from({ length: Math.ceil(attendances.length / 4) }, (_, groupIndex) => {
                const groupAttendances = attendances.slice(groupIndex * 4, (groupIndex + 1) * 4);
                const groupNames = groupAttendances.map(a => a.musicians.name.split(' ')[0]).join(', ');
                
                return (
                  <AccordionItem key={`group-${groupIndex}`} value={`group-${groupIndex}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        <span className="font-medium">Grupo {groupIndex + 1}</span>
                        <Badge variant="secondary">{groupAttendances.length}</Badge>
                        <span className="text-sm text-muted-foreground ml-2">
                          {groupNames}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pt-2">
                        {groupAttendances.map((attendance) => {
                          const musician = attendance.musicians;
                          return (
                            <Card key={attendance.id} className="hover:bg-accent/50 transition-colors">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-2">
                                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                                      <h3 className="font-semibold">{musician.name}</h3>
                                    </div>
                                    <div className="flex gap-2 flex-wrap ml-6">
                                      <Badge variant="secondary">{musician.instrument}</Badge>
                                      {musician.cargo_ministerio && (
                                        <Badge variant="outline">{musician.cargo_ministerio}</Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground ml-6">
                                      {musician.localidade}
                                    </p>
                                    <p className="text-xs text-muted-foreground ml-6">
                                      Confirmado às {new Date(attendance.checked_in_at).toLocaleTimeString('pt-BR')}
                                    </p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemove(attendance.id, musician.name)}
                                    className="flex-shrink-0"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
