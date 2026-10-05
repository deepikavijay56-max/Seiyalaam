// Setup type definitions for Deno runtime
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY is not configured in Supabase Edge Function secrets.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, payload } = await req.json();

    if (action === 'analyze-image') {
      const { mimeType, base64, knownCatalog } = payload;
      const prompt = `You are an expert electronics repair technician and e-waste recycling engineer.
Inspect this photo carefully and detect all electronic parts, microcontrollers, motors, sensors, displays, batteries, wiring, or components visible.
Here is our official catalog of recognized components:
${JSON.stringify(knownCatalog || [])}

Return STRICT JSON ONLY, adhering to this schema:
{
  "detected": [
    {
      "name": "string (match official catalog name if possible)",
      "quantity": 1,
      "condition": "tested" | "untested" | "partial" | "faulty",
      "confidence": 0.0 to 1.0
    }
  ]
}`;

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { inline_data: { mime_type: mimeType || 'image/jpeg', data: base64 } }
              ]
            }
          ],
          generationConfig: { temperature: 0.2 }
        })
      });

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      return new Response(JSON.stringify({ rawText }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'generate-ideas') {
      const { prompt } = payload;
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7 }
        })
      });

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      return new Response(JSON.stringify({ rawText }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal Server Error';
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
