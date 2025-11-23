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
import { Calendar, Plus, XCircle, FileText, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { generateEventPDF } from "@/utils/generateEventPDF";

interface EventManagerProps {
  currentSession: any;
  onSessionChange: (session: any) => void;
}

export const EventManager = ({ currentSession, onSessionChange }: EventManagerProps) => {
  const [openSessions, setOpenSessions] = useState<any[]>([]);
  const [closedSessions, setClosedSessions] = useState<any[]>([]);
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
    observacao: "",
    hinos_cantados: 0,
    hinos_ensaiados: 0,
    quantidade_organistas: 0
  });
  const [loading, setLoading] = useState(false);
  const [sessionToClose, setSessionToClose] = useState<string | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<any | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    loadOpenSessions();
    loadClosedSessions();
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

  const loadClosedSessions = async () => {
    const { data, error } = await supabase
      .from('meeting_sessions')
      .select('*, attendances(count)')
      .eq('status', 'encerrado')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error(error);
    } else {
      setClosedSessions(data || []);
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
        observacao: "",
        hinos_cantados: 0,
        hinos_ensaiados: 0,
        quantidade_organistas: 0
      });
      setShowCreateDialog(false);
      loadOpenSessions();
      loadClosedSessions();
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

  const handleEditSession = (session: any) => {
    setEditingSession(session);
    setShowEditDialog(true);
  };

  const saveEditedSession = async () => {
    if (!editingSession) return;

    setLoading(true);
    const { error } = await supabase
      .from('meeting_sessions')
      .update({
        anciao: editingSession.anciao,
        regencia_enc_regional_1: editingSession.regencia_enc_regional_1,
        regencia_enc_regional_2: editingSession.regencia_enc_regional_2,
        examinadora: editingSession.examinadora,
        ancioes_presentes: editingSession.ancioes_presentes,
        palavra: editingSession.palavra,
        demais_irmaos: editingSession.demais_irmaos,
        observacao: editingSession.observacao,
        hinos_cantados: editingSession.hinos_cantados,
        hinos_ensaiados: editingSession.hinos_ensaiados,
        quantidade_organistas: editingSession.quantidade_organistas
      })
      .eq('id', editingSession.id);

    if (error) {
      toast.error("Erro ao atualizar evento");
      console.error(error);
    } else {
      toast.success("Evento atualizado com sucesso!");
      setShowEditDialog(false);
      setEditingSession(null);
      loadOpenSessions();
      loadClosedSessions();
      if (currentSession?.id === editingSession.id) {
        onSessionChange({ ...currentSession, ...editingSession });
      }
    }
    setLoading(false);
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
      loadClosedSessions();
      if (currentSession?.id === sessionToClose) {
        onSessionChange(null);
      }
    }
    setSessionToClose(null);
  };

  const deleteEvent = async () => {
    if (!sessionToDelete) return;

    const { error } = await supabase
      .from('meeting_sessions')
      .delete()
      .eq('id', sessionToDelete);

    if (error) {
      toast.error("Erro ao excluir evento");
      console.error(error);
    } else {
      toast.success("Evento excluído com sucesso!");
      loadOpenSessions();
      loadClosedSessions();
      if (currentSession?.id === sessionToDelete) {
        onSessionChange(null);
      }
    }
    setSessionToDelete(null);
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hinos_cantados">Hinos Cantados</Label>
                    <Input
                      id="hinos_cantados"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={newEventData.hinos_cantados}
                      onChange={(e) => setNewEventData({...newEventData, hinos_cantados: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="hinos_ensaiados">Hinos Ensaiados</Label>
                    <Input
                      id="hinos_ensaiados"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={newEventData.hinos_ensaiados}
                      onChange={(e) => setNewEventData({...newEventData, hinos_ensaiados: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="quantidade_organistas">Quantidade de Organistas</Label>
                    <Input
                      id="quantidade_organistas"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={newEventData.quantidade_organistas}
                      onChange={(e) => setNewEventData({...newEventData, quantidade_organistas: parseInt(e.target.value) || 0})}
                    />
                  </div>
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
        {openSessions.length === 0 && closedSessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum evento encontrado</p>
            <p className="text-sm mt-2">Crie um novo evento para começar</p>
          </div>
        ) : (
          <div className="space-y-6">
            {openSessions.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Eventos Ativos</h3>
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
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                          <div 
                            className="flex-1 cursor-pointer min-w-0"
                            onClick={() => onSessionChange(session)}
                          >
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="font-semibold break-words">{session.meeting_name}</p>
                              {isActive && <Badge variant="default">Ativo</Badge>}
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {new Date(session.created_at).toLocaleDateString('pt-BR')} - {new Date(session.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {attendanceCount} presença(s) confirmada(s)
                            </p>
                          </div>
                          <div className="flex gap-2 flex-wrap w-full sm:w-auto">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleGeneratePDF(session)}
                              className="flex-shrink-0 text-xs sm:text-sm"
                            >
                              <FileText className="w-4 h-4 sm:mr-2" />
                              <span className="hidden sm:inline">PDF</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditSession(session)}
                              className="flex-shrink-0 text-xs sm:text-sm"
                            >
                              <Edit className="w-4 h-4 sm:mr-2" />
                              <span className="hidden sm:inline">Editar</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSessionToClose(session.id)}
                              className="flex-shrink-0 text-xs sm:text-sm"
                            >
                              <XCircle className="w-4 h-4 sm:mr-2" />
                              <span className="hidden sm:inline">Encerrar</span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {closedSessions.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Eventos Encerrados</h3>
                {closedSessions.map((session) => {
                  const attendanceCount = session.attendances?.[0]?.count || 0;
                  
                  return (
                    <Card
                      key={session.id}
                      className="opacity-75"
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="font-semibold break-words">{session.meeting_name}</p>
                              <Badge variant="secondary">Encerrado</Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {new Date(session.created_at).toLocaleDateString('pt-BR')} - {new Date(session.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {attendanceCount} presença(s) confirmada(s)
                            </p>
                          </div>
                          <div className="flex gap-2 flex-wrap w-full sm:w-auto">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleGeneratePDF(session)}
                              className="flex-shrink-0 text-xs sm:text-sm"
                            >
                              <FileText className="w-4 h-4 sm:mr-2" />
                              <span className="hidden sm:inline">PDF</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSessionToDelete(session.id)}
                              className="flex-shrink-0 text-xs sm:text-sm text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 sm:mr-2" />
                              <span className="hidden sm:inline">Excluir</span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
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

      <AlertDialog open={!!sessionToDelete} onOpenChange={() => setSessionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este evento? Todos os dados de presença serão perdidos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteEvent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sim, Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Evento</DialogTitle>
          </DialogHeader>
          {editingSession && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_anciao">Ancião</Label>
                  <Input
                    id="edit_anciao"
                    placeholder="Nome do ancião"
                    value={editingSession.anciao || ""}
                    onChange={(e) => setEditingSession({...editingSession, anciao: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_regencia1">Regência Enc. Regional 1</Label>
                  <Input
                    id="edit_regencia1"
                    placeholder="Nome"
                    value={editingSession.regencia_enc_regional_1 || ""}
                    onChange={(e) => setEditingSession({...editingSession, regencia_enc_regional_1: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_regencia2">Regência Enc. Regional 2</Label>
                  <Input
                    id="edit_regencia2"
                    placeholder="Nome"
                    value={editingSession.regencia_enc_regional_2 || ""}
                    onChange={(e) => setEditingSession({...editingSession, regencia_enc_regional_2: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_examinadora">Examinadora</Label>
                  <Input
                    id="edit_examinadora"
                    placeholder="Nome"
                    value={editingSession.examinadora || ""}
                    onChange={(e) => setEditingSession({...editingSession, examinadora: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_ancioes">Anciães Presentes</Label>
                <Input
                  id="edit_ancioes"
                  placeholder="Ex: Silvio Rogério, Samuel Borges"
                  value={editingSession.ancioes_presentes || ""}
                  onChange={(e) => setEditingSession({...editingSession, ancioes_presentes: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_palavra">Palavra</Label>
                <Input
                  id="edit_palavra"
                  placeholder="Ex: Mateus capítulo 28 versos 16 ao 20"
                  value={editingSession.palavra || ""}
                  onChange={(e) => setEditingSession({...editingSession, palavra: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_demais">Demais Irmãos Presentes</Label>
                <Textarea
                  id="edit_demais"
                  placeholder="Ex: Enc. Regionais: Braga, Cristiano..."
                  value={editingSession.demais_irmaos || ""}
                  onChange={(e) => setEditingSession({...editingSession, demais_irmaos: e.target.value})}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_observacao">Observação</Label>
                <Textarea
                  id="edit_observacao"
                  placeholder="Observações gerais"
                  value={editingSession.observacao || ""}
                  onChange={(e) => setEditingSession({...editingSession, observacao: e.target.value})}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_hinos_cantados">Hinos Cantados</Label>
                  <Input
                    id="edit_hinos_cantados"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={editingSession.hinos_cantados || 0}
                    onChange={(e) => setEditingSession({...editingSession, hinos_cantados: parseInt(e.target.value) || 0})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_hinos_ensaiados">Hinos Ensaiados</Label>
                  <Input
                    id="edit_hinos_ensaiados"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={editingSession.hinos_ensaiados || 0}
                    onChange={(e) => setEditingSession({...editingSession, hinos_ensaiados: parseInt(e.target.value) || 0})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_quantidade_organistas">Quantidade de Organistas</Label>
                  <Input
                    id="edit_quantidade_organistas"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={editingSession.quantidade_organistas || 0}
                    onChange={(e) => setEditingSession({...editingSession, quantidade_organistas: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
              
              <Button 
                onClick={saveEditedSession} 
                disabled={loading}
                className="w-full"
              >
                Salvar Alterações
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};
