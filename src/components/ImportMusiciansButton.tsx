import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import musiciansData from "@/data/musicians.json";
import { Loader2, Upload, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const ImportMusiciansButton = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<{success: boolean; inserted?: number; error?: string} | null>(null);

  const handleImport = async () => {
    if (isImporting) return;
    
    const confirmed = window.confirm(
      `Isso irá APAGAR todos os músicos existentes e importar ${musiciansData.musicians.length} novos músicos do JSON. Continuar?`
    );
    
    if (!confirmed) return;
    
    setIsImporting(true);
    setProgress("Limpando banco e importando...");
    setResult(null);
    
    try {
      console.log(`Starting import of ${musiciansData.musicians.length} musicians...`);
      
      const response = await supabase.functions.invoke('import-musicians', {
        body: {
          musicians: musiciansData.musicians,
          clearFirst: true
        }
      });

      if (response.error) {
        console.error('Import error:', response.error);
        setResult({ success: false, error: response.error.message });
        toast.error(`Erro na importação: ${response.error.message}`);
      } else {
        console.log('Import result:', response.data);
        setResult({ success: true, inserted: response.data.inserted });
        toast.success(`Importação concluída! ${response.data.inserted} músicos inseridos.`);
      }
    } catch (error) {
      console.error('Import failed:', error);
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      setResult({ success: false, error: message });
      toast.error(`Falha na importação: ${message}`);
    } finally {
      setIsImporting(false);
      setProgress("");
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-card">
      <h3 className="font-semibold mb-2">Importação de Músicos</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Total de Músicos: {musiciansData.musicians.length} músicos
      </p>
      
      <Button 
        onClick={handleImport} 
        disabled={isImporting}
        variant={result?.success ? "outline" : "default"}
        className="w-full"
      >
        {isImporting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {progress}
          </>
        ) : result?.success ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            Importado: {result.inserted} músicos
          </>
        ) : result?.error ? (
          <>
            <AlertCircle className="mr-2 h-4 w-4" />
            Erro - Clique para tentar novamente
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Limpar Banco e Importar Músicos
          </>
        )}
      </Button>
      
      {result?.error && (
        <p className="text-sm text-destructive mt-2">{result.error}</p>
      )}
    </div>
  );
};
