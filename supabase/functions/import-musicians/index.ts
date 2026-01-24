import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { musicians, clearFirst } = await req.json();

    // If clearFirst is true, delete all existing data
    if (clearFirst) {
      console.log('Clearing existing data...');
      
      // First delete attendances (has reference to musicians)
      const { error: attendanceError } = await supabase
        .from('attendances')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (attendanceError) {
        console.error('Error clearing attendances:', attendanceError);
      } else {
        console.log('Attendances cleared successfully');
      }
      
      // Then delete musicians
      const { error: musiciansError } = await supabase
        .from('musicians')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (musiciansError) {
        console.error('Error clearing musicians:', musiciansError);
      } else {
        console.log('Musicians cleared successfully');
      }
    }

    if (!musicians || !Array.isArray(musicians)) {
      return new Response(
        JSON.stringify({ error: 'Musicians array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting import of ${musicians.length} musicians...`);

    // Insert musicians in batches (no deduplication since we cleared)
    const batchSize = 100;
    let totalInserted = 0;
    const errors: string[] = [];
    
    for (let i = 0; i < musicians.length; i += batchSize) {
      const batch = musicians.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(musicians.length / batchSize);
      
      console.log(`Processing batch ${batchNum}/${totalBatches} (${batch.length} musicians)`);
      
      const { data, error } = await supabase
        .from('musicians')
        .insert(batch)
        .select();
      
      if (error) {
        console.error(`Batch ${batchNum} error:`, error);
        errors.push(`Batch ${batchNum}: ${error.message}`);
      } else if (data) {
        totalInserted += data.length;
        console.log(`Batch ${batchNum} complete: ${data.length} inserted, total: ${totalInserted}`);
      }
    }

    console.log(`Import complete. Total inserted: ${totalInserted}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        inserted: totalInserted,
        total: musicians.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});