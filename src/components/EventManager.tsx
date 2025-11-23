import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Plus, XCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { generateEventPDF } from "@/utils/generateEventPDF";

interface EventManagerProps {
  currentSession: any;
  onSessionChange: (session: any) => void;
}

export const EventManager = ({ currentSession, onSessionChange }: EventManagerProps) => {
  const [openSessions, setOpenSessions] = useState<any[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newEventName, setNewEventName] = useState("");
  const [newEventData, setNewEventData] = useState({
    anciao: "",
    regencia_enc_regional_1: "",
    regencia_enc_regional_2: "",
    examinadora: "",
    ancioes_presentes: "",
    palavra: "",
    demais_irmaos: "",
    observacao: ""
  });
  const [loading, setLoading] = useState(false);
  const [sessionToClose, setSessionToClose] = useState<string | null>(null);

  useEffect(() => {
    loadOpenSessions();
  }, []);

  const loadOpenSessions = async () => {
    const { data, error } = await supabase
      .from('meeting_sessions')
      .select('*, attendances(count)')
      .eq('status', 'aberto')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setOpenSessions(data || []);
    }
  };

  const createNewEvent = async () => {
    if (!newEventName.trim()) {
      toast.error("Digite um nome para o evento");
      return;
    }

    setLoading(true);
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const eventName = newEventName.trim();

    const { data, error } = await supabase
      .from('meeting_sessions')
      .insert({
        meeting_date: today,
        meeting_name: eventName,
        status: 'aberto',
        ...newEventData
      })
      .select()
      .single();

    if (error) {
      toast.error("Erro ao criar evento");
      console.error(error);
    } else {
      toast.success("Evento criado com sucesso!");
      onSessionChange(data);
      setNewEventName("");
      setNewEventData({
        anciao: "",
        regencia_enc_regional_1: "",
        regencia_enc_regional_2: "",
        examinadora: "",
        ancioes_presentes: "",
        palavra: "",
        demais_irmaos: "",
        observacao: ""
      });
      setShowCreateDialog(false);
      loadOpenSessions();
    }
    setLoading(false);
  };

  const handleGeneratePDF = async (session: any) => {
    const { data: attendances, error } = await supabase
      .from('attendances')
      .select('*, musician:musicians(*)')
      .eq('meeting_session_id', session.id);

    if (error) {
      toast.error("Erro ao carregar dados para o relatório");
      console.error(error);
      return;
    }

    generateEventPDF(session, attendances || []);
    toast.success("Relatório PDF gerado com sucesso!");
  };

  const closeEvent = async () => {
    if (!sessionToClose) return;

    const { error } = await supabase
      .from('meeting_sessions')
      .update({ status: 'encerrado' })
      .eq('id', sessionToClose);

    if (error) {
      toast.error("Erro ao encerrar evento");
      console.error(error);
    } else {
      toast.success("Evento encerrado com sucesso!");
      loadOpenSessions();
      if (currentSession?.id === sessionToClose) {
        onSessionChange(null);
      }
    }
    setSessionToClose(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Eventos
          </CardTitle>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Novo Evento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Evento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="eventName">Nome do Evento *</Label>
                  <Input
                    id="eventName"
                    placeholder="Ex: ENSAIO REGIONAL - RINCÃO - SP"
                    value={newEventName}
                    onChange={(e) => setNewEventName(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="anciao">Ancião</Label>
                    <Input
                      id="anciao"
                      placeholder="Nome do ancião"
                      value={newEventData.anciao}
                      onChange={(e) => setNewEventData({...newEventData, anciao: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="regencia1">Regência Enc. Regional 1</Label>
                    <Input
                      id="regencia1"
                      placeholder="Nome"
                      value={newEventData.regencia_enc_regional_1}
                      onChange={(e) => setNewEventData({...newEventData, regencia_enc_regional_1: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="regencia2">Regência Enc. Regional 2</Label>
                    <Input
                      id="regencia2"
                      placeholder="Nome"
                      value={newEventData.regencia_enc_regional_2}
                      onChange={(e) => setNewEventData({...newEventData, regencia_enc_regional_2: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="examinadora">Examinadora</Label>
                    <Input
                      id="examinadora"
                      placeholder="Nome"
                      value={newEventData.examinadora}
                      onChange={(e) => setNewEventData({...newEventData, examinadora: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ancioes">Anciães Presentes</Label>
                  <Input
                    id="ancioes"
                    placeholder="Ex: Silvio Rogério, Samuel Borges"
                    value={newEventData.ancioes_presentes}
                    onChange={(e) => setNewEventData({...newEventData, ancioes_presentes: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="palavra">Palavra</Label>
                  <Input
                    id="palavra"
                    placeholder="Ex: Mateus capítulo 28 versos 16 ao 20"
                    value={newEventData.palavra}
                    onChange={(e) => setNewEventData({...newEventData, palavra: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="demais">Demais Irmãos Presentes</Label>
                  <Textarea
                    id="demais"
                    placeholder="Ex: Enc. Regionais: Braga, Cristiano..."
                    value={newEventData.demais_irmaos}
                    onChange={(e) => setNewEventData({...newEventData, demais_irmaos: e.target.value})}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="observacao">Observação</Label>
                  <Textarea
                    id="observacao"
                    placeholder="Observações gerais"
                    value={newEventData.observacao}
                    onChange={(e) => setNewEventData({...newEventData, observacao: e.target.value})}
                    rows={2}
                  />
                </div>
                
                <Button 
                  onClick={createNewEvent} 
                  disabled={loading}
                  className="w-full"
                >
                  Criar Evento
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {openSessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum evento aberto</p>
            <p className="text-sm mt-2">Crie um novo evento para começar</p>
          </div>
        ) : (
          <div className="space-y-2">
            {openSessions.map((session) => {
              const attendanceCount = session.attendances?.[0]?.count || 0;
              const isActive = currentSession?.id === session.id;
              
              return (
                <Card
                  key={session.id}
                  className={`transition-colors ${
                    isActive
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-accent/50'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => onSessionChange(session)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{session.meeting_name}</p>
                          {isActive && <Badge variant="default">Ativo</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(session.created_at).toLocaleDateString('pt-BR')} - {new Date(session.created_at).toLocaleTimeString('pt-BR')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {attendanceCount} presença(s) confirmada(s)
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleGeneratePDF(session)}
                          className="flex-shrink-0"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          PDF
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSessionToClose(session.id)}
                          className="flex-shrink-0"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Encerrar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!sessionToClose} onOpenChange={() => setSessionToClose(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Encerramento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja encerrar este evento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={closeEvent}>
              Sim, Encerrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
