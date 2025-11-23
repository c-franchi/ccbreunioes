import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Music } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AttendanceStatsProps {
  stats: {
    total: number;
    byInstrument: Record<string, number>;
  } | null;
}

export const AttendanceStats = ({ stats }: AttendanceStatsProps) => {
  if (!stats || stats.total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Estatísticas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma presença confirmada ainda
          </p>
        </CardContent>
      </Card>
    );
  }

  const sortedInstruments = Object.entries(stats.byInstrument)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="space-y-4">
      {/* Total */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="pt-6">
          <div className="text-center">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-90" />
            <div className="text-4xl font-bold">{stats.total}</div>
            <div className="text-sm opacity-90">Músicos Presentes</div>
          </div>
        </CardContent>
      </Card>

      {/* By Instrument */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Por Instrumento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedInstruments.map(([instrument, count]) => (
              <div key={instrument} className="flex items-center justify-between">
                <span className="text-sm font-medium">{instrument}</span>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
            {sortedInstruments.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma presença confirmada ainda
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
