import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Trash2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { INSTRUMENT_GROUPS } from "@/constants/instruments";
import { EditMusicianDialog } from "./EditMusicianDialog";

interface AttendanceListProps {
  attendances: any[];
  sessionId: string | undefined;
  tipoContagem?: string;
}

export const AttendanceList = ({ attendances, sessionId, tipoContagem = 'instrumento' }: AttendanceListProps) => {
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [editMusician, setEditMusician] = useState<any | null>(null);

  const handleRemove = async () => {
    if (!deleteConfirm) return;

    const { error } = await supabase
      .from('attendances')
      .delete()
      .eq('id', deleteConfirm.id);

    if (error) {
      toast.error("Erro ao remover presença");
      console.error(error);
    } else {
      toast.success(`Presença removida: ${deleteConfirm.name}`);
    }
    setDeleteConfirm(null);
  };

  const groupAttendancesByNaipe = () => {
    const grouped: Record<string, any[]> = {};
    
    attendances.forEach(attendance => {
      const instrument = attendance.instrument || attendance.musicians?.instrument || 'Outros';
      
      let naipeFound = false;
      for (const [naipe, instruments] of Object.entries(INSTRUMENT_GROUPS)) {
        if (instruments.some(inst => instrument.toLowerCase().includes(inst.toLowerCase()))) {
          if (!grouped[naipe]) grouped[naipe] = [];
          grouped[naipe].push(attendance);
          naipeFound = true;
          break;
        }
      }
      
      if (!naipeFound) {
        if (!grouped['Outros']) grouped['Outros'] = [];
        grouped['Outros'].push(attendance);
      }
    });
    
    return grouped;
  };

  return (
    <>
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
              <Accordion type="multiple" className="w-full">
                {Object.entries(groupAttendancesByNaipe()).map(([naipe, naipeAttendances]) => (
                  <AccordionItem key={naipe} value={naipe}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        <span className="font-medium">{naipe}</span>
                        <Badge variant="secondary">{naipeAttendances.length}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pt-2">
                        {naipeAttendances.map((attendance) => {
                          const isCount = !attendance.musician_id && attendance.instrument;
                          const musician = attendance.musicians;
                          const displayName = isCount ? attendance.instrument : musician?.name;
                          const instrument = isCount ? attendance.instrument : musician?.instrument;
                          
                          return (
                            <Card key={attendance.id} className="hover:bg-accent/50 transition-colors">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-2">
                                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                                      <h3 className="font-semibold">{displayName}</h3>
                                    </div>
                                    {!isCount && (
                                      <>
                                        <div className="flex gap-2 flex-wrap ml-6">
                                          <Badge variant="secondary">{instrument}</Badge>
                                          {musician?.cargo_ministerio && (
                                            <Badge variant="outline">{musician.cargo_ministerio}</Badge>
                                          )}
                                        </div>
                                        <p className="text-sm text-muted-foreground ml-6">
                                          {musician?.localidade}
                                        </p>
                                      </>
                                    )}
                                    <p className="text-xs text-muted-foreground ml-6">
                                      Confirmado às {new Date(attendance.checked_in_at).toLocaleTimeString('pt-BR')}
                                    </p>
                                  </div>
                                  <div className="flex gap-1 flex-shrink-0">
                                    {!isCount && musician && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setEditMusician(musician)}
                                        title="Editar músico"
                                      >
                                        <Pencil className="w-4 h-4" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setDeleteConfirm({ id: attendance.id, name: displayName })}
                                      title="Remover presença"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a presença de <strong>{deleteConfirm?.name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Musician Dialog */}
      <EditMusicianDialog
        open={!!editMusician}
        onOpenChange={(open) => !open && setEditMusician(null)}
        musician={editMusician}
      />
    </>
  );
};
