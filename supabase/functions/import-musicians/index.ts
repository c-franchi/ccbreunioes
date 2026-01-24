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

    const { musicians } = await req.json();

    if (!musicians || !Array.isArray(musicians)) {
      return new Response(
        JSON.stringify({ error: 'Musicians array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check existing musicians to avoid duplicates
    const names = musicians.map((m: { name: string }) => m.name.toUpperCase().trim());
    
    const { data: existingMusicians } = await supabase
      .from('musicians')
      .select('name')
      .in('name', names);
    
    const existingNames = new Set((existingMusicians || []).map(m => m.name.toUpperCase().trim()));
    
    // Filter out existing musicians
    const newMusicians = musicians.filter((m: { name: string }) => 
      !existingNames.has(m.name.toUpperCase().trim())
    );

    if (newMusicians.length === 0) {
      return new Response(
        JSON.stringify({ success: true, inserted: 0, message: 'All musicians already exist' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert new musicians in batches
    const batchSize = 50;
    let totalInserted = 0;
    const errors: string[] = [];
    
    for (let i = 0; i < newMusicians.length; i += batchSize) {
      const batch = newMusicians.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('musicians')
        .insert(batch)
        .select();
      
      if (error) {
        console.error('Batch insert error:', error);
        errors.push(error.message);
      } else if (data) {
        totalInserted += data.length;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        inserted: totalInserted,
        attempted: newMusicians.length,
        skipped: musicians.length - newMusicians.length,
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
