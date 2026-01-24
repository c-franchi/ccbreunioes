import { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { ArrowLeft, TrendingUp, ArrowUpDown, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocalityFilters, filterByCargo } from "@/components/LocalityFilters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { Toggle } from "@/components/ui/toggle";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";

interface LocalityData {
  localidade: string;
  total: number;
  present: number;
  percentage: number;
  region: string;
}

// Helper to extract region from locality name
const extractRegion = (localidade: string): string => {
  const normalized = localidade.toUpperCase().trim();
  
  // Known region patterns
  if (normalized.includes("IBATÉ") || normalized.includes("IBATE")) return "Ibaté";
  if (normalized.includes("AMÉRICO") || normalized.includes("AMERICO")) return "Américo Brasiliense";
  if (normalized.includes("SANTA LÚCIA") || normalized.includes("SANTA LUCIA")) return "Santa Lúcia";
  if (normalized.includes("MATÃO") || normalized.includes("MATAO")) return "Matão";
  if (normalized.includes("RINCÃO") || normalized.includes("RINCAO")) return "Rincão";
  if (normalized.includes("GAVIÃO") || normalized.includes("GAVIAO")) return "Gavião Peixoto";
  if (normalized.includes("MOTUCA")) return "Motuca";
  if (normalized.includes("SANTA EUDÓXIA") || normalized.includes("SANTA EUDOXIA")) return "Santa Eudóxia";
  if (normalized.includes("TRABIJU")) return "Trabiju";
  if (normalized.includes("RIBEIRÃO") || normalized.includes("RIBEIRAO")) return "Ribeirão Bonito";
  if (normalized.includes("BOA ESPERANÇA") || normalized.includes("BOA ESPERANCA")) return "Boa Esperança do Sul";
  if (normalized.includes("DOURADO")) return "Dourado";
  if (normalized.includes("ARARAQUARA")) return "Araraquara";
  
  // Default: use first part of locality name or assume Araraquara
  return "Araraquara";
};

const LocalityAnalysis = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const { allMusicians = [], presentMusicianIds = [] } = location.state || {};
  const presentIds = new Set<string>(presentMusicianIds);

  const [selectedCargo, setSelectedCargo] = useState("todos");
  const [selectedLocalidade, setSelectedLocalidade] = useState("todas");
  const [sortByPresence, setSortByPresence] = useState(true);

  const localidades = [...new Set(allMusicians.map((m: any) => m.localidade).filter(Boolean))].sort() as string[];

  // Filter data based on selections
  const getFilteredData = (): LocalityData[] => {
    const filteredMusicians = allMusicians.filter((m: any) => {
      const matchesCargo = filterByCargo(selectedCargo, m.cargo_ministerio);
      const matchesLocalidade = selectedLocalidade === "todas" || m.localidade === selectedLocalidade;
      return matchesCargo && matchesLocalidade;
    });

    // Group by localidade
    const grouped: Record<string, { total: number; present: number }> = {};

    filteredMusicians.forEach((m: any) => {
      const loc = m.localidade || "Sem Localidade";
      if (!grouped[loc]) {
        grouped[loc] = { total: 0, present: 0 };
      }
      grouped[loc].total++;
      if (presentIds.has(m.id)) {
        grouped[loc].present++;
      }
    });

    return Object.entries(grouped)
      .map(([localidade, stats]) => ({
        localidade,
        total: stats.total,
        present: stats.present,
        percentage: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0,
        region: extractRegion(localidade),
      }))
      .sort((a, b) => a.localidade.localeCompare(b.localidade, 'pt-BR'));
  };

  const filteredData = getFilteredData();
  
  // Sort based on user preference
  const sortedData = [...filteredData].sort((a, b) => {
    if (sortByPresence) {
      return b.present - a.present;
    }
    return a.localidade.localeCompare(b.localidade, 'pt-BR');
  });
  
  const topData = sortedData.slice(0, isMobile ? 12 : 20);

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

  const chartHeight = isMobile ? 400 : 550;
  const nameTruncateLength = isMobile ? 15 : 25;
  const yAxisWidth = isMobile ? 110 : 180;

  const chartData = topData.map((item) => ({
    ...item,
    displayName: truncateName(item.localidade, nameTruncateLength),
  }));

  // Handle case when no data is passed
  if (!allMusicians.length) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Nenhum dado disponível. Volte e selecione uma reunião.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold">Análise por Localidade</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-4 space-y-4">
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
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold">{totalFiltered}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-primary">{presentFiltered}</div>
              <div className="text-xs text-muted-foreground">Presentes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold">{overallPercentage}%</div>
              <div className="text-xs text-muted-foreground">Taxa</div>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">
                Top {isMobile ? 12 : 20} Localidades
              </CardTitle>
              <Toggle
                size="sm"
                pressed={sortByPresence}
                onPressedChange={setSortByPresence}
                aria-label="Alternar ordenação"
              >
                <ArrowUpDown className="h-4 w-4 mr-1" />
                {sortByPresence ? "Presença" : "A-Z"}
              </Toggle>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            {chartData.length > 0 ? (
              <div style={{ height: chartHeight }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={true} vertical={false} />
                    <XAxis 
                      type="number" 
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                      tickCount={5}
                      axisLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="displayName"
                      width={yAxisWidth}
                      tick={{ fontSize: isMobile ? 11 : 13 }}
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
                      wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                      iconSize={12}
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
              <p className="text-center text-muted-foreground py-8">
                Nenhum dado disponível
              </p>
            )}
          </CardContent>
        </Card>

        {/* Detailed List by Region */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">
              Lista por Região ({filteredData.length} localidades)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <RegionAccordion data={sortedData} getBarColor={getBarColor} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

// Component to display localities grouped by region in accordions
interface RegionAccordionProps {
  data: LocalityData[];
  getBarColor: (percentage: number) => string;
}

const RegionAccordion = ({ data, getBarColor }: RegionAccordionProps) => {
  // Group data by region
  const groupedByRegion = useMemo(() => {
    const groups: Record<string, LocalityData[]> = {};
    
    data.forEach((item) => {
      if (!groups[item.region]) {
        groups[item.region] = [];
      }
      groups[item.region].push(item);
    });
    
    // Sort regions alphabetically and calculate totals
    return Object.entries(groups)
      .map(([region, localities]) => {
        const total = localities.reduce((sum, l) => sum + l.total, 0);
        const present = localities.reduce((sum, l) => sum + l.present, 0);
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
        
        return {
          region,
          localities,
          total,
          present,
          percentage,
        };
      })
      .sort((a, b) => a.region.localeCompare(b.region, 'pt-BR'));
  }, [data]);

  if (groupedByRegion.length === 0) {
    return <p className="text-center text-muted-foreground py-4">Nenhuma localidade encontrada</p>;
  }

  return (
    <Accordion type="multiple" className="w-full" defaultValue={groupedByRegion.map(g => g.region)}>
      {groupedByRegion.map((group) => (
        <AccordionItem key={group.region} value={group.region} className="border-b border-border/50">
          <AccordionTrigger className="py-3 hover:no-underline">
            <div className="flex items-center justify-between w-full pr-2">
              <span className="font-semibold text-sm">{group.region}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {group.present}/{group.total}
                </span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {group.percentage}%
                </span>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <div className="space-y-3 pl-1">
              {group.localities.map((item) => (
                <div key={item.localidade} className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium leading-tight">
                      {item.localidade}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {item.present}/{item.total}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={item.percentage} 
                      className="h-2 flex-1"
                      style={{
                        // @ts-ignore - custom CSS property for progress bar color
                        '--progress-color': getBarColor(item.percentage),
                      } as React.CSSProperties}
                    />
                    <span className="text-xs font-medium w-10 text-right" style={{ color: getBarColor(item.percentage) }}>
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default LocalityAnalysis;
