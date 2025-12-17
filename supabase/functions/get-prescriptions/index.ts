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

// Cache for CSV data and valid elements
let cachedRecords: GIDRecord[] | null = null;
let validElements: Set<string> | null = null;
let lastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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

// Simple Levenshtein distance for fuzzy matching
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

function findSimilarElements(input: string, elements: Set<string>, maxSuggestions = 3): string[] {
  const inputLower = input.toLowerCase();
  const suggestions: { element: string; distance: number }[] = [];
  
  elements.forEach(element => {
    const elementLower = element.toLowerCase();
    const distance = levenshteinDistance(inputLower, elementLower);
    
    // Only consider elements with reasonable similarity
    if (distance <= Math.max(3, inputLower.length / 2)) {
      suggestions.push({ element, distance });
    }
  });
  
  return suggestions
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxSuggestions)
    .map(s => s.element);
}

async function fetchAndCacheRecords(): Promise<GIDRecord[]> {
  const now = Date.now();
  
  if (cachedRecords && (now - lastFetch) < CACHE_DURATION) {
    return cachedRecords;
  }
  
  console.log("Fetching CSV data (cache miss or expired)");
  const csvResponse = await fetch(CSV_URL);
  if (!csvResponse.ok) {
    throw new Error(`Failed to fetch CSV data: ${csvResponse.status}`);
  }
  
  const csvText = await csvResponse.text();
  cachedRecords = parseCSV(csvText);
  
  // Build valid elements set
  validElements = new Set(cachedRecords.map(r => r.Element));
  lastFetch = now;
  
  console.log(`Cached ${cachedRecords.length} records with ${validElements.size} unique elements`);
  return cachedRecords;
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

    // Fetch and cache CSV data
    const records = await fetchAndCacheRecords();

    // Validate element exists
    const normalizedElement = element.toLowerCase();
    const exactMatch = Array.from(validElements!).find(
      e => e.toLowerCase() === normalizedElement
    );

    if (!exactMatch) {
      const suggestions = findSimilarElements(element, validElements!);
      const suggestionText = suggestions.length > 0 
        ? ` Vouliez-vous dire : ${suggestions.join(', ')} ?`
        : " Consultez /get-elements pour la liste complète.";
      
      return new Response(JSON.stringify({
        success: false,
        error: `Element '${element}' introuvable.${suggestionText}`,
        suggestions: suggestions.length > 0 ? suggestions : undefined
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const normalizedPhase = phase.toUpperCase();

    // Filter by element and phase
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
        element: exactMatch,
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
