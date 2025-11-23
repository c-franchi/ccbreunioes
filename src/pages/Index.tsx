import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, Users, Music, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { MusicianSearch } from "@/components/MusicianSearch";
import { AttendanceStats } from "@/components/AttendanceStats";
import { AttendanceList } from "@/components/AttendanceList";

const Index = () => {
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Create or get today's session
  useEffect(() => {
    const initSession = async () => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      // Check if session exists for today
      const { data: existing, error: fetchError } = await supabase
        .from('meeting_sessions')
        .select('*')
        .eq('meeting_date', today)
        .single();

      if (existing) {
        setCurrentSession(existing);
      } else {
        // Create new session with date and time
        const dateStr = now.toLocaleDateString('pt-BR');
        const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const { data: newSession, error: createError } = await supabase
          .from('meeting_sessions')
          .insert({
            meeting_date: today,
            meeting_name: `REUNIÃO DE MADEIRA ${dateStr} ${timeStr}`
          })
          .select()
          .single();

        if (createError) {
          toast.error("Erro ao criar sessão");
          console.error(createError);
        } else {
          setCurrentSession(newSession);
        }
      }
    };

    initSession();
  }, []);

  // Load attendances for current session
  useEffect(() => {
    if (!currentSession) return;

    const loadAttendances = async () => {
      const { data, error } = await supabase
        .from('attendances')
        .select(`
          *,
          musicians (*)
        `)
        .eq('meeting_session_id', currentSession.id)
        .order('checked_in_at', { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setAttendances(data || []);
        calculateStats(data || []);
      }
    };

    loadAttendances();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('attendances_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendances',
          filter: `meeting_session_id=eq.${currentSession.id}`
        },
        () => {
          loadAttendances();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentSession]);

  const calculateStats = (data: any[]) => {
    const instrumentCounts: any = {};
    data.forEach(attendance => {
      const instrument = attendance.musicians?.instrument || 'Desconhecido';
      instrumentCounts[instrument] = (instrumentCounts[instrument] || 0) + 1;
    });

    setStats({
      total: data.length,
      byInstrument: instrumentCounts
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Music className="w-8 h-8" />
            <div>
              <h1 className="text-3xl font-bold">CCB Maestro</h1>
              <p className="text-sm text-primary-foreground/80">
                Controle de Presenças - {currentSession?.meeting_name || 'Carregando...'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Search Section */}
          <div className="lg:col-span-2 space-y-6">
            <MusicianSearch currentSessionId={currentSession?.id} />
            
            {/* Attendance List */}
            <AttendanceList 
              attendances={attendances}
              sessionId={currentSession?.id}
            />
          </div>

          {/* Stats Sidebar */}
          <div className="lg:col-span-1">
            <AttendanceStats stats={stats} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
