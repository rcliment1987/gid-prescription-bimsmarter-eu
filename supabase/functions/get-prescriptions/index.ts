import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GIDRecord {
  Element: string;
  Categorie: string;
  Sous_categorie: string;
  Phase: string;
  TypeDocument: string;
  Propriete: string;
  IFC_Reference: string;
  Revit_Param: string;
  Nom: string;
  IFC_Type: string;
  Categorie_Revit: string;
  Classification: string;
  Descriptif: string;
}

const CSV_URL = "https://xdzsqiemmiplxckfcsar.lovableproject.com/data/GID_DATABASE.csv";

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(text: string): GIDRecord[] {
  const lines = text.split("\n").filter(line => line.trim());
  if (lines.length === 0) return [];

  const dataLines = lines.slice(1);
  
  return dataLines.map(line => {
    const cols = parseCSVLine(line);
    return {
      Element: cols[0]?.trim() || "",
      Categorie: cols[1]?.trim() || "",
      Sous_categorie: cols[2]?.trim() || "",
      Phase: cols[3]?.trim() || "",
      TypeDocument: cols[4]?.trim() || "",
      Propriete: cols[5]?.trim() || "",
      IFC_Reference: cols[6]?.trim() || "",
      Revit_Param: cols[7]?.trim() || "",
      Nom: cols[8]?.trim() || "",
      IFC_Type: cols[9]?.trim() || "",
      Categorie_Revit: cols[10]?.trim() || "",
      Classification: cols[11]?.trim() || "",
      Descriptif: cols[12]?.trim() || "",
    };
  }).filter(record => record.Element);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const element = url.searchParams.get('element');
    const phase = url.searchParams.get('phase');

    if (!element || !phase) {
      return new Response(JSON.stringify({
        success: false,
        error: "Missing required parameters: 'element' and 'phase' are required",
        usage: {
          endpoint: "/get-prescriptions",
          parameters: {
            element: "string (required) - Element category (e.g., 'Mur', 'Dalle', 'Fenêtre')",
            phase: "string (required) - Project phase (APS, APD, PDE, EXE, EXP)"
          },
          example: "/get-prescriptions?element=Mur&phase=PDE"
        }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const validPhases = ["APS", "APD", "PDE", "EXE", "EXP"];
    if (!validPhases.includes(phase.toUpperCase())) {
      return new Response(JSON.stringify({
        success: false,
        error: `Invalid phase '${phase}'. Valid phases are: ${validPhases.join(', ')}`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Fetching prescriptions for element: ${element}, phase: ${phase}`);

    // Fetch CSV data
    const csvResponse = await fetch(CSV_URL);
    if (!csvResponse.ok) {
      throw new Error(`Failed to fetch CSV data: ${csvResponse.status}`);
    }
    const csvText = await csvResponse.text();
    const records = parseCSV(csvText);

    console.log(`Parsed ${records.length} total records`);

    // Filter by element and phase
    const normalizedElement = element.toLowerCase();
    const normalizedPhase = phase.toUpperCase();

    const filteredRecords = records.filter(record => {
      const elementMatch = record.Element.toLowerCase() === normalizedElement;
      const phaseMatch = record.Phase === normalizedPhase || record.Phase === "Toutes";
      return elementMatch && phaseMatch;
    });

    console.log(`Found ${filteredRecords.length} matching records`);

    // Transform to API response format
    const prescriptions = filteredRecords.map((record, index) => ({
      id: `${record.Element.toLowerCase().replace(/\s+/g, '_')}_${index}`,
      categorie: record.Categorie,
      sous_categorie: record.Sous_categorie,
      type_document: record.TypeDocument,
      propriete: record.Propriete,
      ifc_reference: record.IFC_Reference,
      revit_param: record.Revit_Param,
      nom_ifc: record.Nom,
      ifc_type: record.IFC_Type,
      classification: record.Classification,
      descriptif: record.Descriptif
    }));

    return new Response(JSON.stringify({
      success: true,
      data: {
        element: element,
        phase: normalizedPhase,
        count: prescriptions.length,
        prescriptions: prescriptions
      },
      meta: {
        api_version: "1.0",
        generated_at: new Date().toISOString(),
        source: "GID CRTI-B Luxembourg"
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in get-prescriptions:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
