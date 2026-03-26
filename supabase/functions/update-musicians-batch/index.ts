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
      return new Response(JSON.stringify({ error: 'musicians array required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let updated = 0;
    let inserted = 0;
    const errors: string[] = [];

    for (const m of musicians) {
      // Try to find existing by name (case-insensitive)
      const { data: existing } = await supabase
        .from('musicians')
        .select('id, instrument, localidade, cargo_ministerio, nivel')
        .ilike('name', m.name)
        .limit(1);

      if (existing && existing.length > 0) {
        const rec = existing[0];
        // Update if any field changed
        if (rec.instrument !== m.instrument || rec.localidade !== m.localidade || 
            rec.cargo_ministerio !== m.cargo_ministerio || rec.nivel !== m.nivel) {
          const { error } = await supabase
            .from('musicians')
            .update({ 
              instrument: m.instrument, 
              localidade: m.localidade, 
              cargo_ministerio: m.cargo_ministerio, 
              nivel: m.nivel 
            })
            .eq('id', rec.id);
          if (error) errors.push(`Update ${m.name}: ${error.message}`);
          else updated++;
        }
      } else {
        // Insert new
        const { error } = await supabase
          .from('musicians')
          .insert({ 
            name: m.name, 
            instrument: m.instrument, 
            localidade: m.localidade, 
            cargo_ministerio: m.cargo_ministerio, 
            nivel: m.nivel 
          });
        if (error) errors.push(`Insert ${m.name}: ${error.message}`);
        else inserted++;
      }
    }

    return new Response(JSON.stringify({ success: true, updated, inserted, errors: errors.length > 0 ? errors : undefined }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
