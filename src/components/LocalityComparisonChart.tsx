import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { BarChart3, TrendingUp } from "lucide-react";
import { useState } from "react";
import { LocalityFilters, filterByCargo } from "./LocalityFilters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";

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
      .sort((a, b) => b.present - a.present);
  };

  const filteredData = getFilteredData();
  const topData = filteredData.slice(0, isMobile ? 8 : 15); // Show fewer on mobile

  const totalFiltered = filteredData.reduce((sum, d) => sum + d.total, 0);
  const presentFiltered = filteredData.reduce((sum, d) => sum + d.present, 0);
  const overallPercentage = totalFiltered > 0 ? Math.round((presentFiltered / totalFiltered) * 100) : 0;

  // Color scale based on percentage
  const getBarColor = (percentage: number) => {
    if (percentage >= 50) return "hsl(var(--chart-1))";
    if (percentage >= 25) return "hsl(var(--chart-2))";
    return "hsl(var(--chart-3))";
  };

  // Truncate locality name for mobile
  const truncateName = (name: string, maxLength: number) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + "...";
  };

  // Prepare chart data with truncated names for mobile
  const chartData = topData.map((item) => ({
    ...item,
    displayName: isMobile ? truncateName(item.localidade, 12) : item.localidade,
  }));

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <BarChart3 className="w-4 h-4 mr-2" />
          Ver Gráfico Detalhado
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] p-3 sm:p-6 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            Análise por Localidade
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-80px)]">
          <div className="space-y-3 sm:space-y-4 pr-2">
            {/* Filters */}
            <LocalityFilters
              selectedCargo={selectedCargo}
              onCargoChange={setSelectedCargo}
              selectedLocalidade={selectedLocalidade}
              onLocalidadeChange={setSelectedLocalidade}
              localidades={localidades}
            />

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <Card>
                <CardContent className="p-2 sm:pt-4 sm:p-4">
                  <div className="text-lg sm:text-2xl font-bold">{totalFiltered}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">Total</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-2 sm:pt-4 sm:p-4">
                  <div className="text-lg sm:text-2xl font-bold text-primary">{presentFiltered}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">Presentes</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-2 sm:pt-4 sm:p-4">
                  <div className="text-lg sm:text-2xl font-bold">{overallPercentage}%</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">Taxa</div>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            <Card>
              <CardHeader className="p-2 sm:pb-2 sm:p-4">
                <CardTitle className="text-xs sm:text-sm">
                  Comparativo (Top {isMobile ? 8 : 15})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-4">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={isMobile ? 280 : 350}>
                    <BarChart
                      data={chartData}
                      layout="vertical"
                      margin={isMobile 
                        ? { top: 5, right: 10, left: 5, bottom: 5 }
                        : { top: 5, right: 30, left: 100, bottom: 5 }
                      }
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        type="number" 
                        tick={{ fontSize: isMobile ? 9 : 11 }}
                      />
                      <YAxis
                        type="category"
                        dataKey="displayName"
                        width={isMobile ? 75 : 95}
                        tick={{ fontSize: isMobile ? 9 : 11 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: isMobile ? "11px" : "12px",
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
                        wrapperStyle={{ fontSize: isMobile ? "10px" : "12px" }}
                        iconSize={isMobile ? 8 : 14}
                      />
                      <Bar dataKey="total" name="Total" fill="hsl(var(--muted-foreground))" opacity={0.4} />
                      <Bar dataKey="present" name="Presentes">
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    Nenhum dado disponível
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Detailed List */}
            <Card>
              <CardHeader className="p-2 sm:pb-2 sm:p-4">
                <CardTitle className="text-xs sm:text-sm">
                  Lista Completa ({filteredData.length} localidades)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-4">
                <div className="space-y-2 max-h-[150px] sm:max-h-[200px] overflow-y-auto">
                  {filteredData.map((item) => (
                    <div
                      key={item.localidade}
                      className="flex items-center justify-between py-1 border-b border-border/50 last:border-0 gap-2"
                    >
                      <span className="text-xs sm:text-sm font-medium truncate flex-1 min-w-0">
                        {item.localidade}
                      </span>
                      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        <div className="w-12 sm:w-24 bg-muted rounded-full h-1.5 sm:h-2">
                          <div
                            className="h-1.5 sm:h-2 rounded-full transition-all"
                            style={{
                              width: `${item.percentage}%`,
                              backgroundColor: getBarColor(item.percentage),
                            }}
                          />
                        </div>
                        <span className="text-[10px] sm:text-sm text-muted-foreground w-16 sm:w-20 text-right">
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
