import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LocalityFiltersProps {
  selectedCargo: string;
  onCargoChange: (value: string) => void;
  selectedLocalidade: string;
  onLocalidadeChange: (value: string) => void;
  localidades: string[];
  selectedCidade?: string;
  onCidadeChange?: (value: string) => void;
  cidades?: string[];
}

const CARGO_OPTIONS = [
  { value: "todos", label: "Todos os Cargos" },
  { value: "instrutores", label: "Instrutores" },
  { value: "encarregados_locais", label: "Encarregados Locais" },
  { value: "encarregados_regionais", label: "Encarregados Regionais" },
  { value: "organistas", label: "Organistas" },
  { value: "examinadoras", label: "Examinadoras" },
  { value: "musicos", label: "Músicos" },
];

export const LocalityFilters = ({
  selectedCargo,
  onCargoChange,
  selectedLocalidade,
  onLocalidadeChange,
  localidades,
  selectedCidade,
  onCidadeChange,
  cidades,
}: LocalityFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
      <Select value={selectedCargo} onValueChange={onCargoChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
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

      {cidades && onCidadeChange && (
        <Select value={selectedCidade} onValueChange={onCidadeChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrar por cidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as Cidades</SelectItem>
            {cidades.map((cidade) => (
              <SelectItem key={cidade} value={cidade}>
                {cidade}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select value={selectedLocalidade} onValueChange={onLocalidadeChange}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Filtrar por localidade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas as Localidades</SelectItem>
          {localidades.map((loc) => (
            <SelectItem key={loc} value={loc}>
              {loc}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

// Helper function to filter musicians by cargo
export const filterByCargo = (cargo: string, cargoMinisterio: string | null): boolean => {
  if (cargo === "todos") return true;
  if (!cargoMinisterio) return cargo === "musicos";

  const cargoUpper = cargoMinisterio.toUpperCase();

  switch (cargo) {
    case "instrutores":
      return cargoUpper.includes("INSTRUTOR");
    case "encarregados_locais":
      return cargoUpper.includes("ENCARREGADO LOCAL") || cargoUpper === "ENC. LOCAL";
    case "encarregados_regionais":
      return cargoUpper.includes("ENCARREGADO REGIONAL") || cargoUpper === "ENC. REGIONAL";
    case "organistas":
      return cargoUpper.includes("ORGANISTA");
    case "examinadoras":
      return cargoUpper.includes("EXAMINADORA");
    case "musicos":
      return !cargoUpper.includes("INSTRUTOR") && 
             !cargoUpper.includes("ENCARREGADO") &&
             !cargoUpper.includes("ORGANISTA") &&
             !cargoUpper.includes("EXAMINADORA");
    default:
      return true;
  }
};
