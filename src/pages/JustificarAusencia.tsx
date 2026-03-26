import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Music, CheckCircle, XCircle, Clock } from "lucide-react";

const CARGOS_ENCARREGADOS = [
  "Encarregado Regional",
  "Encarregado Local",
  "Secretário (a) da Música",
  "Examinadora de Organistas",
];

const MOTIVOS = ["Enfermidade", "Viagens", "Trabalho", "Particular"];

const JustificarAusencia = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [musicians, setMusicians] = useState<any[]>([]);
  
  const [selectedCargo, setSelectedCargo] = useState("");
  const [selectedMusician, setSelectedMusician] = useState("");
  const [selectedMotivo, setSelectedMotivo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    loadEvent();
    loadMusicians();
  }, [eventId]);

  const loadEvent = async () => {
    if (!eventId) {
      setError("Evento não encontrado");
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("justification_events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle();
      
      if (error) {
        console.error("Error loading event:", error);
        setError("Evento não encontrado");
        setLoading(false);
        return;
      }

      if (!data) {
        setError("Evento não encontrado");
        setLoading(false);
        return;
      }

      const now = new Date();
      const opens = new Date(data.opens_at);
      const closes = new Date(data.closes_at);

      if (now < opens) {
        setError(`Este formulário abrirá em ${format(opens, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`);
        setEvent(data);
        setLoading(false);
        return;
      }

      if (now > closes) {
        setError("O prazo para justificativas foi encerrado");
        setEvent(data);
        setLoading(false);
        return;
      }

      setEvent(data);
      setLoading(false);
    } catch (err) {
      console.error("Exception loading event:", err);
      setError("Erro ao carregar evento");
      setLoading(false);
    }
  };

  const loadMusicians = async () => {
    try {
      const { data } = await supabase
        .from("musicians")
        .select("*")
        .in("cargo_ministerio", CARGOS_ENCARREGADOS.map(c => c.toUpperCase()))
        .order("name");
      
      if (data) setMusicians(data);
    } catch (err) {
      console.error("Error loading musicians:", err);
    }
  };

  // Filter musicians by selected cargo
  const filteredMusicians = useMemo(() => {
    if (!selectedCargo) return [];
    return musicians.filter(
      (m) => m.cargo_ministerio?.toUpperCase() === selectedCargo.toUpperCase()
    );
  }, [selectedCargo, musicians]);

  // Group filtered musicians by localidade
  const musiciansByLocalidade = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    filteredMusicians.forEach((m) => {
      const loc = m.localidade || "Sem Localidade";
      if (!grouped[loc]) grouped[loc] = [];
      grouped[loc].push(m);
    });
    return grouped;
  }, [filteredMusicians]);

  const selectedMusicianData = musicians.find((m) => m.id === selectedMusician);

  const handleSubmit = async () => {
    if (!selectedMusician || !selectedMotivo || !selectedCargo) {
      toast.error("Preencha todos os campos");
      return;
    }

    setSubmitting(true);
    const musicianData = musicians.find((m) => m.id === selectedMusician);

    const { error } = await supabase.from("absence_justifications").insert({
      event_id: eventId,
      musician_id: selectedMusician,
      cargo: selectedCargo,
      localidade: musicianData?.localidade || "",
      motivo: selectedMotivo,
    });

    if (error) {
      if (error.code === "23505") {
        toast.error("Você já enviou uma justificativa para este evento");
      } else {
        toast.error("Erro ao enviar justificativa");
        console.error(error);
      }
    } else {
      setSubmitted(true);
      toast.success("Justificativa enviada com sucesso!");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6 space-y-4">
            <CheckCircle className="w-16 h-16 text-primary mx-auto" />
            <h2 className="text-xl font-bold">Justificativa Enviada!</h2>
            <p className="text-muted-foreground text-sm">
              Sua justificativa de ausência foi registrada com sucesso.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6 space-y-4">
            <XCircle className="w-16 h-16 text-destructive mx-auto" />
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6 space-y-4">
            <Clock className="w-16 h-16 text-accent-foreground mx-auto" />
            <h2 className="text-lg font-bold">{event.title}</h2>
            <p className="text-sm text-muted-foreground">
              Reunião: {format(new Date(event.meeting_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })} às {event.meeting_time?.slice(0, 5)}
            </p>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Music className="w-7 h-7" />
            <div>
              <h1 className="text-lg font-bold">Justificativa de Ausência</h1>
              <p className="text-xs text-primary-foreground/80">
                Reunião Bimestral de Encarregados - Microrregião Araraquara
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Reunião: {format(new Date(event.meeting_date + "T12:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} às {event.meeting_time?.slice(0, 5)}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Prazo: até {format(new Date(event.closes_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cargo Selection */}
            <div className="space-y-2">
              <Label>Cargo / Ministério</Label>
              <Select value={selectedCargo} onValueChange={(v) => { setSelectedCargo(v); setSelectedMusician(""); }}>
                <SelectTrigger><SelectValue placeholder="Selecione o cargo" /></SelectTrigger>
                <SelectContent>
                  {CARGOS_ENCARREGADOS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Musician Selection (grouped by localidade) */}
            {selectedCargo && (
              <div className="space-y-2">
                <Label>Localidade / Nome</Label>
                <Select value={selectedMusician} onValueChange={setSelectedMusician}>
                  <SelectTrigger><SelectValue placeholder="Selecione seu nome" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(musiciansByLocalidade)
                      .sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
                      .map(([localidade, musicians]) => (
                        <div key={localidade}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                            {localidade}
                          </div>
                          {musicians.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name} - {m.localidade}
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    {filteredMusicians.length === 0 && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        Nenhum músico encontrado para este cargo
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Motivo */}
            {selectedMusician && (
              <div className="space-y-2">
                <Label>Motivo da Ausência</Label>
                <Select value={selectedMotivo} onValueChange={setSelectedMotivo}>
                  <SelectTrigger><SelectValue placeholder="Selecione o motivo" /></SelectTrigger>
                  <SelectContent>
                    {MOTIVOS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Summary & Submit */}
            {selectedMotivo && selectedMusicianData && (
              <div className="bg-muted p-3 rounded-md space-y-1 text-sm">
                <p><strong>Nome:</strong> {selectedMusicianData.name}</p>
                <p><strong>Cargo:</strong> {selectedCargo}</p>
                <p><strong>Localidade:</strong> {selectedMusicianData.localidade}</p>
                <p><strong>Motivo:</strong> <Badge variant="secondary">{selectedMotivo}</Badge></p>
              </div>
            )}

            <Button 
              onClick={handleSubmit} 
              disabled={!selectedMusician || !selectedMotivo || !selectedCargo || submitting}
              className="w-full"
            >
              {submitting ? "Enviando..." : "Enviar Justificativa"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default JustificarAusencia;
