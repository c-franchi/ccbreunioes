import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ALL_INSTRUMENTS } from "@/constants/instruments";

interface EditMusicianDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  musician: {
    id: string;
    name: string;
    instrument: string;
    localidade?: string | null;
    cargo_ministerio?: string | null;
    nivel?: string | null;
  } | null;
  onUpdated?: () => void;
}

const CARGOS = [
  "ORGANISTA",
  "INSTRUTOR",
  "ENCARREGADO LOCAL",
  "ENCARREGADO REGIONAL",
  "EXAMINADORA",
];

const NIVEIS = [
  "OFICIALIZADO(A)",
  "AUTORIZADO(A)",
  "EM TESTE",
  "APRENDIZ",
];

export const EditMusicianDialog = ({
  open,
  onOpenChange,
  musician,
  onUpdated,
}: EditMusicianDialogProps) => {
  const [name, setName] = useState("");
  const [instrument, setInstrument] = useState("");
  const [localidade, setLocalidade] = useState("");
  const [cargo, setCargo] = useState("");
  const [nivel, setNivel] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (musician) {
      setName(musician.name || "");
      setInstrument(musician.instrument || "");
      setLocalidade(musician.localidade || "");
      setCargo(musician.cargo_ministerio || "");
      setNivel(musician.nivel || "");
    }
  }, [musician]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!musician) return;
    
    if (!name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    if (!instrument) {
      toast.error("Instrumento é obrigatório");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("musicians")
      .update({
        name: name.trim(),
        instrument,
        localidade: localidade.trim() || null,
        cargo_ministerio: cargo || null,
        nivel: nivel || null,
      })
      .eq("id", musician.id);

    setLoading(false);

    if (error) {
      toast.error("Erro ao atualizar músico");
      console.error(error);
    } else {
      toast.success("Músico atualizado com sucesso!");
      onOpenChange(false);
      onUpdated?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5" />
            Editar Músico
          </DialogTitle>
          <DialogDescription>
            Atualize as informações do músico abaixo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nome</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do músico"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-instrument">Instrumento</Label>
            <Select value={instrument} onValueChange={setInstrument}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o instrumento" />
              </SelectTrigger>
              <SelectContent>
                {ALL_INSTRUMENTS.map((inst) => (
                  <SelectItem key={inst} value={inst}>
                    {inst}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-localidade">Localidade</Label>
            <Input
              id="edit-localidade"
              value={localidade}
              onChange={(e) => setLocalidade(e.target.value)}
              placeholder="Ex: JARDIM PAULISTANO"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-cargo">Cargo no Ministério</Label>
            <Select value={cargo || "none"} onValueChange={(val) => setCargo(val === "none" ? "" : val)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cargo (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {CARGOS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-nivel">Nível</Label>
            <Select value={nivel || "none"} onValueChange={(val) => setNivel(val === "none" ? "" : val)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o nível (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {NIVEIS.map((n) => (
                  <SelectItem key={n} value={n}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
