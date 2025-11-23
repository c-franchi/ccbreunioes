import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SessionSelectorProps {
  currentSession: any;
  onSessionSelect: (session: any) => void;
}

export const SessionSelector = ({ currentSession, onSessionSelect }: SessionSelectorProps) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTodaySessions();
  }, []);

  const loadTodaySessions = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('meeting_sessions')
      .select('*')
      .eq('meeting_date', today)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setSessions(data || []);
    }
    setLoading(false);
  };

  if (sessions.length <= 1) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="w-5 h-5" />
          Sessões de Hoje
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sessions.map((session) => (
            <Card
              key={session.id}
              className={`cursor-pointer transition-colors ${
                currentSession?.id === session.id
                  ? 'bg-primary/10 border-primary'
                  : 'hover:bg-accent/50'
              }`}
              onClick={() => onSessionSelect(session)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold">{session.meeting_name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {new Date(session.created_at).toLocaleTimeString('pt-BR')}
                    </p>
                  </div>
                  {currentSession?.id === session.id && (
                    <Badge variant="default">Atual</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
