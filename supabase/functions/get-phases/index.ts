import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PHASES = [
  {
    code: "APS",
    name: "Avant-Projet Sommaire",
    description: "Phase initiale de conception avec les éléments de base"
  },
  {
    code: "APD",
    name: "Avant-Projet Définitif",
    description: "Phase de conception détaillée avec les éléments structurels"
  },
  {
    code: "PDE",
    name: "Projet Définitif d'Exécution",
    description: "Phase de développement avec tous les détails techniques"
  },
  {
    code: "EXE",
    name: "Exécution",
    description: "Phase de construction avec les informations de chantier"
  },
  {
    code: "EXP",
    name: "Exploitation",
    description: "Phase d'exploitation avec les données de maintenance"
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Returning phases list');

    return new Response(JSON.stringify({
      success: true,
      data: {
        count: PHASES.length,
        phases: PHASES
      },
      meta: {
        api_version: "1.0",
        generated_at: new Date().toISOString(),
        note: "Les phases suivent la progression du projet BIM selon le standard GID Luxembourg"
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in get-phases:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
