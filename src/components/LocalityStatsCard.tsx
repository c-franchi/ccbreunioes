import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LocalityComparisonChart } from "./LocalityComparisonChart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { filterByCargo } from "./LocalityFilters";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LocalityStatsCardProps {
  currentSessionId: string | null;
  attendances: any[];
}

interface LocalityData {
  localidade: string;
  total: number;
  present: number;
  percentage: number;
}

const CARGO_OPTIONS = [
  { value: "todos", label: "Todos os Cargos" },
  { value: "instrutores", label: "Instrutores" },
  { value: "encarregados_locais", label: "Enc. Locais" },
  { value: "encarregados_regionais", label: "Enc. Regionais" },
  { value: "organistas", label: "Organistas" },
  { value: "examinadoras", label: "Examinadoras" },
  { value: "musicos", label: "Músicos" },
];

export const LocalityStatsCard = ({ currentSessionId, attendances }: LocalityStatsCardProps) => {
  const [allMusicians, setAllMusicians] = useState<any[]>([]);
  const [selectedCargo, setSelectedCargo] = useState("todos");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMusicians = async () => {
      setLoading(true);
      // Fetch all musicians - using multiple requests to bypass 1000 limit
      let allData: any[] = [];
      let hasMore = true;
      let offset = 0;
      const pageSize = 1000;
      
      while (hasMore) {
        const { data, error } = await supabase
          .from("musicians")
          .select("id, name, localidade, cargo_ministerio, instrument")
          .range(offset, offset + pageSize - 1);
        
        if (error) {
          console.error("Error loading musicians:", error);
          break;
        }
        
        if (data && data.length > 0) {
          allData = [...allData, ...data];
          offset += pageSize;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      setAllMusicians(allData);
      setLoading(false);
    };

    loadMusicians();
  }, []);

  // Get present musician IDs from attendances
  const presentMusicianIds = new Set(
    attendances.filter((a) => a.musician_id).map((a) => a.musician_id)
  );

  // Calculate stats by localidade with cargo filter
  const calculateLocalityStats = (): LocalityData[] => {
    const filteredMusicians = allMusicians.filter((m) =>
      filterByCargo(selectedCargo, m.cargo_ministerio)
    );

    const grouped: Record<string, { total: number; present: number }> = {};

    filteredMusicians.forEach((m) => {
      const loc = m.localidade || "Sem Localidade";
      if (!grouped[loc]) {
        grouped[loc] = { total: 0, present: 0 };
      }
      grouped[loc].total++;
      if (presentMusicianIds.has(m.id)) {
        grouped[loc].present++;
      }
    });

    return Object.entries(grouped)
      .map(([localidade, stats]) => ({
        localidade,
        total: stats.total,
        present: stats.present,
        percentage: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0,
      }))
      .filter((item) => item.present > 0) // Only show localities with attendances
      .sort((a, b) => a.localidade.localeCompare(b.localidade, 'pt-BR')); // Alphabetical order
  };

  const localityStats = calculateLocalityStats();
  const allLocalityStats = calculateLocalityStatsAll();

  function calculateLocalityStatsAll(): LocalityData[] {
    const filteredMusicians = allMusicians.filter((m) =>
      filterByCargo(selectedCargo, m.cargo_ministerio)
    );

    const grouped: Record<string, { total: number; present: number }> = {};

    filteredMusicians.forEach((m) => {
      const loc = m.localidade || "Sem Localidade";
      if (!grouped[loc]) {
        grouped[loc] = { total: 0, present: 0 };
      }
      grouped[loc].total++;
      if (presentMusicianIds.has(m.id)) {
        grouped[loc].present++;
      }
    });

    return Object.entries(grouped)
      .map(([localidade, stats]) => ({
        localidade,
        total: stats.total,
        present: stats.present,
        percentage: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0,
      }))
      .sort((a, b) => a.localidade.localeCompare(b.localidade, 'pt-BR')); // Alphabetical order
  }

  // Color based on percentage
  const getProgressColor = (percentage: number) => {
    if (percentage >= 50) return "bg-chart-1";
    if (percentage >= 25) return "bg-chart-2";
    return "bg-chart-3";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Por Localidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  if (!currentSessionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Por Localidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Selecione uma reunião para ver estatísticas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Por Localidade
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Cargo Filter */}
        <Select value={selectedCargo} onValueChange={setSelectedCargo}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filtrar por cargo" />
          </SelectTrigger>
          <SelectContent>
            {CARGO_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Locality List */}
        {localityStats.length > 0 ? (
          <ScrollArea className="h-[200px]">
            <div className="space-y-3 pr-3">
              {localityStats.slice(0, 10).map((item) => (
                <div key={item.localidade} className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium truncate max-w-[140px]" title={item.localidade}>
                      {item.localidade}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {item.present}/{item.total} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getProgressColor(item.percentage)}`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
              {localityStats.length > 10 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  +{localityStats.length - 10} localidades com presença
                </p>
              )}
            </div>
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma presença registrada ainda
          </p>
        )}

        {/* Chart Button */}
        <LocalityComparisonChart
          data={allLocalityStats}
          allMusicians={allMusicians}
          presentMusicianIds={presentMusicianIds}
        />
      </CardContent>
    </Card>
  );
};
