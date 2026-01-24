import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { BarChart3, TrendingUp, ArrowUpDown } from "lucide-react";
import { useState } from "react";
import { LocalityFilters, filterByCargo } from "./LocalityFilters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { Toggle } from "@/components/ui/toggle";

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
  const [sortByPresence, setSortByPresence] = useState(true);
  const isMobile = useIsMobile();

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
      .sort((a, b) => a.localidade.localeCompare(b.localidade, 'pt-BR')); // Alphabetical order
  };

  const filteredData = getFilteredData();
  
  // Sort based on user preference
  const sortedData = [...filteredData].sort((a, b) => {
    if (sortByPresence) {
      return b.present - a.present; // By presence count (descending)
    }
    return a.localidade.localeCompare(b.localidade, 'pt-BR'); // Alphabetical
  });
  
  const topData = sortedData.slice(0, isMobile ? 10 : 15);

  const totalFiltered = filteredData.reduce((sum, d) => sum + d.total, 0);
  const presentFiltered = filteredData.reduce((sum, d) => sum + d.present, 0);
  const overallPercentage = totalFiltered > 0 ? Math.round((presentFiltered / totalFiltered) * 100) : 0;

  // Color scale based on percentage
  const getBarColor = (percentage: number) => {
    if (percentage >= 50) return "hsl(var(--chart-1))";
    if (percentage >= 25) return "hsl(var(--chart-2))";
    return "hsl(var(--chart-3))";
  };

  // Truncate locality name for display
  const truncateName = (name: string, maxLength: number) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength - 1) + "…";
  };

  // Prepare chart data with truncated names
  const chartData = topData.map((item) => ({
    ...item,
    displayName: truncateName(item.localidade, isMobile ? 10 : 18),
  }));

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <BarChart3 className="w-4 h-4 mr-2" />
          Ver Gráfico Detalhado
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-md sm:max-w-lg max-h-[90vh] p-3 overflow-hidden">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-4 h-4" />
            Análise por Localidade
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-80px)]">
          <div className="space-y-3 pr-3">
            {/* Filters */}
            <LocalityFilters
              selectedCargo={selectedCargo}
              onCargoChange={setSelectedCargo}
              selectedLocalidade={selectedLocalidade}
              onLocalidadeChange={setSelectedLocalidade}
              localidades={localidades}
            />

            {/* Summary Cards - 2 columns first row, full width second */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Card>
                  <CardContent className="p-3 text-center">
                    <div className="text-xl font-bold">{totalFiltered}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <div className="text-xl font-bold text-primary">{presentFiltered}</div>
                    <div className="text-xs text-muted-foreground">Presentes</div>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-xl font-bold">{overallPercentage}%</div>
                  <div className="text-xs text-muted-foreground">Taxa de Presença</div>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            <Card>
              <CardHeader className="p-3 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm">
                    Top {isMobile ? 10 : 15} - {sortByPresence ? "Por Presença" : "Alfabética"}
                  </CardTitle>
                  <Toggle
                    size="sm"
                    pressed={sortByPresence}
                    onPressedChange={setSortByPresence}
                    aria-label="Alternar ordenação"
                    className="h-7 px-2"
                  >
                    <ArrowUpDown className="h-3 w-3 mr-1" />
                    <span className="text-[10px]">{sortByPresence ? "Presença" : "A-Z"}</span>
                  </Toggle>
                </div>
              </CardHeader>
              <CardContent className="p-2">
                {chartData.length > 0 ? (
                  <div className="w-full overflow-hidden" style={{ height: isMobile ? 250 : 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 5, right: 10, left: 0, bottom: 15 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={true} vertical={false} />
                        <XAxis 
                          type="number" 
                          tick={{ fontSize: 10 }}
                          tickCount={4}
                          axisLine={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="displayName"
                          width={isMobile ? 85 : 120}
                          tick={{ fontSize: isMobile ? 8 : 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            borderColor: "hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          formatter={(value: number, name: string) => [
                            value,
                            name === "total" ? "Total" : "Presentes",
                          ]}
                          labelFormatter={(label) => {
                            const item = chartData.find((d) => d.displayName === label);
                            return item?.localidade || label;
                          }}
                        />
                        <Legend 
                          wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                          iconSize={10}
                        />
                        <Bar dataKey="total" name="Total" fill="hsl(var(--muted-foreground))" opacity={0.3} radius={[0, 4, 4, 0]} />
                        <Bar dataKey="present" name="Presentes" radius={[0, 4, 4, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    Nenhum dado disponível
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Detailed List */}
            <Card>
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-sm">
                  Lista Completa ({filteredData.length} localidades)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {sortedData.map((item) => (
                    <div
                      key={item.localidade}
                      className="flex items-center justify-between py-1 border-b border-border/50 last:border-0 gap-2"
                    >
                      <span className="text-xs sm:text-sm font-medium truncate flex-1 min-w-0">
                        {item.localidade}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-16 sm:w-24 bg-muted rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${item.percentage}%`,
                              backgroundColor: getBarColor(item.percentage),
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-14 sm:w-20 text-right">
                          {item.present}/{item.total}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
