import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { format, addMonths, setDate, getDay, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Calendar, Link2, Copy, FileText, LogOut, ArrowLeft, Trash2, Eye, UserPlus, ChevronDown, User } from "lucide-react";
import { generateAbsenceReportPDF } from "@/utils/generateAbsenceReportPDF";

// Calculate 4th Saturday of a given month
const getFourthSaturday = (year: number, month: number): Date => {
  const first = startOfMonth(new Date(year, month, 1));
  let satCount = 0;
  let day = new Date(first);
  while (satCount < 4) {
    if (getDay(day) === 6) satCount++;
    if (satCount < 4) day.setDate(day.getDate() + 1);
  }
  return day;
};

// Get next upcoming 4th Saturdays of odd months (Jan=0, Mar=2, May=4, Jul=6, Sep=8, Nov=10)
const getUpcomingMeetingDates = (): Date[] => {
  const dates: Date[] = [];
  const now = new Date();
  const oddMonths = [0, 2, 4, 6, 8, 10]; // 0-indexed
  
  for (let yearOffset = 0; yearOffset <= 1; yearOffset++) {
    const year = now.getFullYear() + yearOffset;
    for (const month of oddMonths) {
      const d = getFourthSaturday(year, month);
      if (d >= new Date(now.getFullYear(), now.getMonth(), 1)) {
        dates.push(d);
      }
    }
  }
  return dates.slice(0, 6);
};

const AdminJustificativas = () => {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [creating, setCreating] = useState(false);
  const [viewingEvent, setViewingEvent] = useState<any>(null);
  const [justifications, setJustifications] = useState<any[]>([]);
  const [loadingJustifications, setLoadingJustifications] = useState(false);

  const meetingDates = getUpcomingMeetingDates();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      autoGenerateEvents().then(() => loadEvents());
    }
  }, [user, isAdmin]);

  const autoGenerateEvents = async () => {
    const dates = getUpcomingMeetingDates();
    for (const d of dates) {
      const dateStr = format(d, "yyyy-MM-dd");
      // Check if event already exists for this date
      const { data: existing } = await supabase
        .from("justification_events")
        .select("id")
        .eq("meeting_date", dateStr)
        .maybeSingle();
      if (existing) continue;

      const opensAt = new Date(d);
      opensAt.setDate(opensAt.getDate() - 2);
      opensAt.setHours(0, 0, 0, 0);
      const closesAt = new Date(d);
      closesAt.setHours(15, 30, 0, 0);

      await supabase.from("justification_events").insert({
        title: `Justificativas Ausência - Reunião Bimestral ${format(d, "MMMM/yyyy", { locale: ptBR })}`,
        meeting_date: dateStr,
        meeting_time: "15:00",
        opens_at: opensAt.toISOString(),
        closes_at: closesAt.toISOString(),
        created_by: user?.id,
      });
    }
  };

  const loadEvents = async () => {
    const { data, error } = await supabase
      .from("justification_events")
      .select("*")
      .order("meeting_date", { ascending: true });
    if (!error) setEvents(data || []);
  };

  const createEvent = async () => {
    if (!selectedDate) {
      toast.error("Selecione a data da reunião");
      return;
    }
    setCreating(true);
    
    // Opens 2 days before at 00:00
    const opensAt = new Date(selectedDate);
    opensAt.setDate(opensAt.getDate() - 2);
    opensAt.setHours(0, 0, 0, 0);
    
    // Closes at 15:30 on meeting day
    const closesAt = new Date(selectedDate);
    closesAt.setHours(15, 30, 0, 0);

    const { error } = await supabase.from("justification_events").insert({
      title: "Justificativas Ausência - Reunião Bimestral de Encarregados Microrregião Araraquara",
      meeting_date: format(selectedDate, "yyyy-MM-dd"),
      meeting_time: "15:00",
      opens_at: opensAt.toISOString(),
      closes_at: closesAt.toISOString(),
      created_by: user?.id,
    });

    if (error) {
      toast.error("Erro ao criar evento");
      console.error(error);
    } else {
      toast.success("Evento criado!");
      setShowCreate(false);
      setSelectedDate(undefined);
      loadEvents();
    }
    setCreating(false);
  };

  const deleteEvent = async (eventId: string) => {
    const { error } = await supabase.from("justification_events").delete().eq("id", eventId);
    if (!error) {
      toast.success("Evento excluído");
      loadEvents();
    }
  };

  const copyLink = (eventId: string) => {
    const link = `${window.location.origin}/justificar/${eventId}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado para a área de transferência!");
  };

  const shareWhatsApp = (eventId: string, title: string) => {
    const link = `${window.location.origin}/justificar/${eventId}`;
    const message = `📋 *${title}*\n\nJustifique sua ausência pelo link abaixo:\n${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const viewJustifications = async (event: any) => {
    setViewingEvent(event);
    setLoadingJustifications(true);
    const { data, error } = await supabase
      .from("absence_justifications")
      .select("*, musicians(name, instrument, localidade)")
      .eq("event_id", event.id)
      .order("created_at", { ascending: true });
    if (!error) setJustifications(data || []);
    setLoadingJustifications(false);
  };

  const handleGenerateReport = () => {
    if (!viewingEvent || justifications.length === 0) {
      toast.error("Nenhuma justificativa para gerar relatório");
      return;
    }
    generateAbsenceReportPDF(viewingEvent, justifications);
    toast.success("Relatório gerado!");
  };

  const getEventStatus = (event: any) => {
    const now = new Date();
    const opens = new Date(event.opens_at);
    const closes = new Date(event.closes_at);
    if (now < opens) return { label: "Aguardando", variant: "secondary" as const };
    if (now >= opens && now <= closes) return { label: "Aberto", variant: "default" as const };
    return { label: "Encerrado", variant: "outline" as const };
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (!isAdmin) return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4">
      <p className="text-muted-foreground">Acesso restrito a administradores</p>
      <Button variant="outline" onClick={() => navigate("/")}>Voltar</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="text-primary-foreground hover:bg-primary-foreground/20">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Justificativas de Ausência</h1>
              <p className="text-sm text-primary-foreground/80">Painel Administrativo</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {user?.email === "neifranchi@gmail.com" && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")} className="text-primary-foreground hover:bg-primary-foreground/20 text-xs sm:text-sm" title="Gerenciar Administradores">
                <UserPlus className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Admins</span>
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => navigate("/perfil")} className="text-primary-foreground hover:bg-primary-foreground/20" title="Perfil">
              <User className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => { signOut(); navigate("/"); }} className="text-primary-foreground hover:bg-primary-foreground/20" title="Sair">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Create Event */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Eventos de Justificativa
              </CardTitle>
              <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="w-4 h-4 mr-2" />Novo Evento</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Evento de Justificativa</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Reunião Bimestral de Encarregados - Microrregião Araraquara
                    </p>
                    <div className="space-y-2">
                      <Label>Selecione a data da reunião (4º Sábado)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {meetingDates.map((d) => (
                          <Button
                            key={d.toISOString()}
                            variant={selectedDate?.toDateString() === d.toDateString() ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedDate(d)}
                            className="text-xs"
                          >
                            {format(d, "dd/MM/yyyy", { locale: ptBR })}
                          </Button>
                        ))}
                      </div>
                    </div>
                    {selectedDate && (
                      <div className="bg-muted p-3 rounded-md text-sm space-y-1">
                        <p><strong>Data:</strong> {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                        <p><strong>Horário:</strong> 15:00</p>
                        <p><strong>Abre para justificativas:</strong> {format(new Date(selectedDate.getTime() - 2 * 24 * 60 * 60 * 1000), "dd/MM/yyyy")} às 00:00</p>
                        <p><strong>Fecha:</strong> {format(selectedDate, "dd/MM/yyyy")} às 15:30</p>
                      </div>
                    )}
                    <Button onClick={createEvent} disabled={creating || !selectedDate} className="w-full">
                      {creating ? "Criando..." : "Criar Evento"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Nenhum evento criado</p>
            ) : (
              <div className="space-y-3">
                {/* Open events shown first, prominently */}
                {events.filter(e => getEventStatus(e).label === "Aberto").map((event) => {
                  const status = getEventStatus(event);
                  return (
                    <div key={event.id} className="border-2 border-primary rounded-lg p-4 space-y-2 bg-primary/5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(event.meeting_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })} às {event.meeting_time?.slice(0, 5)}
                          </p>
                        </div>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" variant="outline" onClick={() => copyLink(event.id)}>
                          <Copy className="w-3 h-3 mr-1" />Link
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => viewJustifications(event)}>
                          <Eye className="w-3 h-3 mr-1" />Ver Justificativas
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteEvent(event.id)}>
                          <Trash2 className="w-3 h-3 mr-1" />Excluir
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {/* Remaining events in accordion */}
                {events.filter(e => getEventStatus(e).label !== "Aberto").length > 0 && (
                  <Accordion type="single" collapsible>
                    <AccordionItem value="other-events" className="border-none">
                      <AccordionTrigger className="text-sm font-medium text-muted-foreground hover:no-underline py-2">
                        Demais eventos ({events.filter(e => getEventStatus(e).label !== "Aberto").length})
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2">
                          {events.filter(e => getEventStatus(e).label !== "Aberto").map((event) => {
                            const status = getEventStatus(event);
                            return (
                              <div key={event.id} className="border rounded-lg p-4 space-y-2">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="font-medium text-sm">{event.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {format(new Date(event.meeting_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })} às {event.meeting_time?.slice(0, 5)}
                                    </p>
                                  </div>
                                  <Badge variant={status.variant}>{status.label}</Badge>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                  <Button size="sm" variant="outline" onClick={() => copyLink(event.id)}>
                                    <Copy className="w-3 h-3 mr-1" />Link
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => viewJustifications(event)}>
                                    <Eye className="w-3 h-3 mr-1" />Ver Justificativas
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => deleteEvent(event.id)}>
                                    <Trash2 className="w-3 h-3 mr-1" />Excluir
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Justifications */}
        {viewingEvent && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Justificativas Recebidas</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {viewingEvent.title} - {format(new Date(viewingEvent.meeting_date + "T12:00:00"), "dd/MM/yyyy")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleGenerateReport}>
                    <FileText className="w-4 h-4 mr-1" />Gerar Relatório
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingJustifications ? (
                <p className="text-center py-4 text-muted-foreground">Carregando...</p>
              ) : justifications.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">Nenhuma justificativa recebida</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{justifications.length} justificativa(s)</p>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-3 py-2 text-left">Nome</th>
                          <th className="px-3 py-2 text-left">Cargo</th>
                          <th className="px-3 py-2 text-left">Localidade</th>
                          <th className="px-3 py-2 text-left">Motivo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {justifications.map((j) => (
                          <tr key={j.id} className="border-t">
                            <td className="px-3 py-2">{j.musicians?.name || "—"}</td>
                            <td className="px-3 py-2">{j.cargo}</td>
                            <td className="px-3 py-2">{j.localidade}</td>
                            <td className="px-3 py-2">
                              <Badge variant="secondary">{j.motivo}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default AdminJustificativas;
