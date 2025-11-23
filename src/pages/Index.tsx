import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Music } from "lucide-react";
import { MusicianSearch } from "@/components/MusicianSearch";
import { AttendanceStats } from "@/components/AttendanceStats";
import { AttendanceList } from "@/components/AttendanceList";
import { EventManager } from "@/components/EventManager";

const Index = () => {
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  // No automatic session creation - user must select or create

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
          {/* Event Management and Search */}
          <div className="lg:col-span-2 space-y-6">
            <EventManager 
              currentSession={currentSession}
              onSessionChange={setCurrentSession}
            />
            
            {currentSession && (
              <MusicianSearch 
                currentSessionId={currentSession?.id}
                attendances={attendances}
              />
            )}
            
            {/* Attendance List */}
            {currentSession && (
              <AttendanceList 
                attendances={attendances}
                sessionId={currentSession?.id}
              />
            )}
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
