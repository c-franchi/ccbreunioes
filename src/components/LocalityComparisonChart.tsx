import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { BarChart3, TrendingUp } from "lucide-react";
import { useState } from "react";
import { LocalityFilters, filterByCargo } from "./LocalityFilters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LocalityData {
  localidade: string;
  total: number;
  present: number;
  percentage: number;
}

interface LocalityComparisonChartProps {
  data: LocalityData[];
  allMusicians: any[];
  presentMusicianIds: Set<string>;
}

export const LocalityComparisonChart = ({
  data,
  allMusicians,
  presentMusicianIds,
}: LocalityComparisonChartProps) => {
  const [selectedCargo, setSelectedCargo] = useState("todos");
  const [selectedLocalidade, setSelectedLocalidade] = useState("todas");

  const localidades = [...new Set(allMusicians.map((m) => m.localidade).filter(Boolean))].sort();

  // Filter data based on selections
  const getFilteredData = (): LocalityData[] => {
    const filteredMusicians = allMusicians.filter((m) => {
      const matchesCargo = filterByCargo(selectedCargo, m.cargo_ministerio);
      const matchesLocalidade = selectedLocalidade === "todas" || m.localidade === selectedLocalidade;
      return matchesCargo && matchesLocalidade;
    });

    // Group by localidade
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
      .sort((a, b) => b.present - a.present);
  };

  const filteredData = getFilteredData();
  const topData = filteredData.slice(0, 15); // Top 15 for chart visibility

  const totalFiltered = filteredData.reduce((sum, d) => sum + d.total, 0);
  const presentFiltered = filteredData.reduce((sum, d) => sum + d.present, 0);
  const overallPercentage = totalFiltered > 0 ? Math.round((presentFiltered / totalFiltered) * 100) : 0;

  // Color scale based on percentage
  const getBarColor = (percentage: number) => {
    if (percentage >= 50) return "hsl(var(--chart-1))";
    if (percentage >= 25) return "hsl(var(--chart-2))";
    return "hsl(var(--chart-3))";
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <BarChart3 className="w-4 h-4 mr-2" />
          Ver Gráfico Detalhado
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Análise Detalhada por Localidade
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filters */}
          <LocalityFilters
            selectedCargo={selectedCargo}
            onCargoChange={setSelectedCargo}
            selectedLocalidade={selectedLocalidade}
            onLocalidadeChange={setSelectedLocalidade}
            localidades={localidades}
          />

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{totalFiltered}</div>
                <div className="text-xs text-muted-foreground">Total Cadastrados</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-primary">{presentFiltered}</div>
                <div className="text-xs text-muted-foreground">Presentes</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{overallPercentage}%</div>
                <div className="text-xs text-muted-foreground">Taxa de Presença</div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Comparativo Total vs. Presentes (Top 15)</CardTitle>
            </CardHeader>
            <CardContent>
              {topData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={topData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis
                      type="category"
                      dataKey="localidade"
                      width={95}
                      tick={{ fontSize: 11 }}
                      className="text-xs"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number, name: string) => [
                        value,
                        name === "total" ? "Total" : "Presentes",
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="total" name="Total" fill="hsl(var(--muted-foreground))" opacity={0.4} />
                    <Bar dataKey="present" name="Presentes">
                      {topData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum dado disponível para os filtros selecionados
                </p>
              )}
            </CardContent>
          </Card>

          {/* Detailed List */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Lista Completa ({filteredData.length} localidades)</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {filteredData.map((item) => (
                    <div
                      key={item.localidade}
                      className="flex items-center justify-between py-1 border-b border-border/50 last:border-0"
                    >
                      <span className="text-sm font-medium truncate flex-1">{item.localidade}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${item.percentage}%`,
                              backgroundColor: getBarColor(item.percentage),
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-20 text-right">
                          {item.present}/{item.total} ({item.percentage}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
