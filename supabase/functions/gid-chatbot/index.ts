import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) {
      console.error("GROQ_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Service non configuré" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { message, context, history } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build context-aware system prompt
    let systemPrompt = `Tu es un assistant expert en BIM et en standard GID (CRTI-B Luxembourg). 
Tu aides les coordinateurs BIM à comprendre les prescriptions de modélisation Revit pour l'export IFC.

Règles:
- Réponds en français, de manière concise et structurée
- Utilise des listes à puces pour les informations multiples
- Cite les propriétés IFC et Revit quand pertinent
- Si tu ne sais pas, dis-le clairement`;

    if (context?.element) {
      systemPrompt += `\n\nContexte actuel:
- Élément sélectionné: ${context.element}
- Phase projet: ${context.phase || "Non spécifiée"}`;

      if (context.prescriptions?.length > 0) {
        systemPrompt += `\n- Prescriptions (${context.prescriptions.length} premières):`;
        context.prescriptions.forEach((p: any, i: number) => {
          systemPrompt += `\n  ${i + 1}. ${p.propriete} (IFC: ${p.ifc}, Revit: ${p.revit})`;
        });
      }
    }

    // Build messages array
    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []).map((m: any) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    console.log("Calling Groq API with model llama-3.3-70b-versatile");

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes atteinte. Réessayez dans quelques secondes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Erreur du service IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Désolé, je n'ai pas pu générer de réponse.";

    console.log("Groq response received successfully");

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("gid-chatbot error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
