import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddMusicianDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const INSTRUMENTS = [
  "FLAUTA",
  "CLARINETE",
  "SAXOFONE ALTO",
  "SAXOFONE TENOR",
  "TROMPETE",
  "TROMBONE",
  "BOMBARDINO",
  "TROMPA",
  "TUBA"
];

const CARGOS = [
  "MÚSICO",
  "INSTRUTOR",
  "ENCARREGADO LOCAL",
  "SECRETÁRIO (A) DA MÚSICA"
];

const NIVEIS = [
  "OFICIALIZADO(A)",
  "RJM",
  "CULTO OFICIAL",
  "ENSAIO"
];

export const AddMusicianDialog = ({ open, onOpenChange }: AddMusicianDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    instrument: "",
    localidade: "",
    cargo_ministerio: "MÚSICO",
    nivel: "ENSAIO"
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.instrument) {
      toast.error("Preencha nome e instrumento");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('musicians')
      .insert([formData]);

    if (error) {
      toast.error("Erro ao adicionar músico");
      console.error(error);
    } else {
      toast.success("Músico adicionado com sucesso!");
      setFormData({
        name: "",
        instrument: "",
        localidade: "",
        cargo_ministerio: "MÚSICO",
        nivel: "ENSAIO"
      });
      onOpenChange(false);
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Músico</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
              placeholder="Digite o nome completo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instrument">Instrumento *</Label>
            <Select 
              value={formData.instrument}
              onValueChange={(value) => setFormData({ ...formData, instrument: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o instrumento" />
              </SelectTrigger>
              <SelectContent>
                {INSTRUMENTS.map((inst) => (
                  <SelectItem key={inst} value={inst}>{inst}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="localidade">Localidade</Label>
            <Input
              id="localidade"
              value={formData.localidade}
              onChange={(e) => setFormData({ ...formData, localidade: e.target.value.toUpperCase() })}
              placeholder="Ex: JARDIM SÃO JOSÉ - CENTRAL"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cargo">Cargo/Ministério</Label>
            <Select 
              value={formData.cargo_ministerio}
              onValueChange={(value) => setFormData({ ...formData, cargo_ministerio: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CARGOS.map((cargo) => (
                  <SelectItem key={cargo} value={cargo}>{cargo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nivel">Nível</Label>
            <Select 
              value={formData.nivel}
              onValueChange={(value) => setFormData({ ...formData, nivel: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NIVEIS.map((nivel) => (
                  <SelectItem key={nivel} value={nivel}>{nivel}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Adicionando..." : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
