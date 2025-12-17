import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching elements list');

    // Fetch CSV data
    const csvResponse = await fetch(CSV_URL);
    if (!csvResponse.ok) {
      throw new Error(`Failed to fetch CSV data: ${csvResponse.status}`);
    }
    const csvText = await csvResponse.text();

    // Parse to extract unique elements
    const lines = csvText.split("\n").filter(line => line.trim());
    const dataLines = lines.slice(1);
    
    const elements = new Set<string>();
    dataLines.forEach(line => {
      const cols = parseCSVLine(line);
      const element = cols[0]?.trim();
      if (element) {
        elements.add(element);
      }
    });

    const sortedElements = Array.from(elements).sort((a, b) => 
      a.localeCompare(b, 'fr', { sensitivity: 'base' })
    );

    console.log(`Found ${sortedElements.length} unique elements`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        count: sortedElements.length,
        elements: sortedElements.map(el => ({
          name: el,
          value: el.toLowerCase()
        }))
      },
      meta: {
        api_version: "1.0",
        generated_at: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in get-elements:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
