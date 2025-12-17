export interface GIDRecord {
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

export type ProjectPhase = "APS" | "APD" | "PDE" | "EXE" | "EXP";

export const PROJECT_PHASES: ProjectPhase[] = ["APS", "APD", "PDE", "EXE", "EXP"];

const CSV_PATH = "/data/GID_DATABASE.csv";

let cachedData: GIDRecord[] | null = null;

export async function loadGIDData(): Promise<GIDRecord[]> {
  if (cachedData) {
    return cachedData;
  }

  const response = await fetch(CSV_PATH);
  const text = await response.text();
  const records = parseCSV(text);
  cachedData = records;
  return records;
}

function parseCSV(text: string): GIDRecord[] {
  const lines = text.split("\n").filter(line => line.trim());
  if (lines.length === 0) return [];

  // Skip header line (first line)
  const dataLines = lines.slice(1);
  
  return dataLines.map(line => {
    // Parse comma-separated values, handling quoted fields
    const cols = parseCSVLine(line);
    
    // Columns: Element, Categorie, Sous_categorie, Phase, Type de document, Propriété, IFC_Reference, Revit_Param, Nom, IFC Type, Catégorie Revit, Classification, Descriptif
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

export function getUniqueElements(records: GIDRecord[]): string[] {
  const elements = new Set<string>();
  records.forEach(record => {
    if (record.Element) {
      elements.add(record.Element);
    }
  });
  return Array.from(elements).sort();
}

export function filterRecords(
  records: GIDRecord[],
  phase: ProjectPhase,
  element: string
): GIDRecord[] {
  return records.filter(record => {
    const phaseMatch = record.Phase === phase || record.Phase === "Toutes";
    const elementMatch = record.Element === element;
    return phaseMatch && elementMatch;
  });
}

export interface MappingResult {
  revitParam: string;
  ifcReference: string;
  officialRevitParam: string;
  typeDocument: string;
  isMatched: boolean;
  propriete: string;
}

export function generateMapping(
  userParams: string[],
  filteredRecords: GIDRecord[]
): MappingResult[] {
  return userParams.map(param => {
    const normalizedParam = normalizeString(param);
    
    // Try to find a match in the filtered records
    const match = filteredRecords.find(record => {
      const normalizedRevitParam = normalizeString(record.Revit_Param);
      const normalizedPropriete = normalizeString(record.Propriete);
      
      return normalizedRevitParam.includes(normalizedParam) ||
             normalizedParam.includes(normalizedRevitParam) ||
             normalizedPropriete.includes(normalizedParam) ||
             normalizedParam.includes(normalizedPropriete) ||
             similarity(normalizedParam, normalizedRevitParam) > 0.6 ||
             similarity(normalizedParam, normalizedPropriete) > 0.6;
    });
    
    if (match) {
      return {
        revitParam: param,
        ifcReference: match.IFC_Reference,
        officialRevitParam: match.Revit_Param,
        typeDocument: match.TypeDocument,
        isMatched: true,
        propriete: match.Propriete,
      };
    }
    
    return {
      revitParam: param,
      ifcReference: "",
      officialRevitParam: "",
      typeDocument: "",
      isMatched: false,
      propriete: "",
    };
  });
}

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\-\s]+/g, "")
    .trim();
}

function similarity(s1: string, s2: string): number {
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(s1: string, s2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  return matrix[s1.length][s2.length];
}

export function parseUserParams(input: string): string[] {
  return input
    .split(/[,;\n]+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}
