import { supabase } from "@/integrations/supabase/client";
import musiciansData from "@/data/musicians.json";

export async function importAllMusicians(clearFirst: boolean = true): Promise<{
  success: boolean;
  inserted?: number;
  total?: number;
  errors?: string[];
  error?: string;
}> {
  try {
    console.log(`Starting import of ${musiciansData.musicians.length} musicians...`);
    
    const response = await supabase.functions.invoke('import-musicians', {
      body: {
        musicians: musiciansData.musicians,
        clearFirst
      }
    });

    if (response.error) {
      console.error('Import error:', response.error);
      return { success: false, error: response.error.message };
    }

    console.log('Import result:', response.data);
    return response.data;
  } catch (error) {
    console.error('Import failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
