import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Music } from "lucide-react";
import { MusicianSearch } from "@/components/MusicianSearch";
import { AttendanceStats } from "@/components/AttendanceStats";
import { AttendanceList } from "@/components/AttendanceList";
import { EventManager } from "@/components/EventManager";
import { GroupAttendanceMarker } from "@/components/GroupAttendanceMarker";
import { InstrumentCountMarker } from "@/components/InstrumentCountMarker";
const Index = () => {
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  // No automatic session creation - user must select or create

  // Load attendances for current session
  useEffect(() => {
    if (!currentSession) {
      setStats(null);
      setAttendances([]);
      return;
    }
    
    const loadAttendances = async () => {
      const {
        data,
        error
      } = await supabase.from('attendances').select(`
          *,
          musicians (*)
        `).eq('meeting_session_id', currentSession.id).order('checked_in_at', {
        ascending: false
      });
      if (error) {
        console.error(error);
      } else {
        setAttendances(data || []);
        calculateStats(data || []);
      }
    };
    loadAttendances();

    // Subscribe to realtime changes for INSERT, UPDATE, DELETE
    const channel = supabase
      .channel(`attendances_${currentSession.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'attendances',
        filter: `meeting_session_id=eq.${currentSession.id}`
      }, () => {
        loadAttendances();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'attendances',
        filter: `meeting_session_id=eq.${currentSession.id}`
      }, () => {
        loadAttendances();
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'attendances'
      }, (payload) => {
        // Handle delete - remove from state directly for immediate UI update
        setAttendances(prev => {
          const filtered = prev.filter(att => att.id !== payload.old.id);
          calculateStats(filtered);
          return filtered;
        });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentSession]);
  const calculateStats = (data: any[]) => {
    const instrumentCounts: any = {};
    data.forEach(attendance => {
      // Handle both musician-based and direct instrument counting
      const instrument = attendance.musicians?.instrument || attendance.instrument || 'Desconhecido';
      instrumentCounts[instrument] = (instrumentCounts[instrument] || 0) + 1;
    });
    setStats({
      total: data.length,
      byInstrument: instrumentCounts
    });
  };
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <Music className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold truncate">CCB Contagem Reuniões</h1>
              <p className="text-xs sm:text-sm text-primary-foreground/80 truncate">
                Controle de Presenças - {currentSession?.meeting_name || 'Carregando...'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Event Management and Search */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <EventManager currentSession={currentSession} onSessionChange={setCurrentSession} />
            
            {currentSession && currentSession.tipo_presenca === 'individual' && (
              <MusicianSearch currentSessionId={currentSession?.id} attendances={attendances} />
            )}
            
            {currentSession && currentSession.tipo_presenca === 'em_grupo' && (
              <GroupAttendanceMarker 
                currentSessionId={currentSession.id} 
                attendances={attendances}
                tipoContagem={currentSession.tipo_contagem || 'instrumento'}
              />
            )}
            
            {currentSession && currentSession.tipo_presenca === 'sem_nome' && (
              <InstrumentCountMarker 
                currentSessionId={currentSession.id} 
                attendances={attendances}
                tipoContagem={currentSession.tipo_contagem || 'instrumento'}
              />
            )}
            
            {/* Attendance List */}
            {currentSession && <AttendanceList attendances={attendances} sessionId={currentSession?.id} tipoContagem={currentSession.tipo_contagem || 'instrumento'} />}
          </div>

          {/* Stats Sidebar */}
          <div className="lg:col-span-1">
            <AttendanceStats stats={stats} />
          </div>
        </div>
      </main>
    </div>;
};
export default Index;
