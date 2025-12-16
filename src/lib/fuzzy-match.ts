// Mapping de termes français vers propriétés IFC standard
const FRENCH_TO_IFC: Record<string, string[]> = {
  // Fire
  "feu": ["FireRating"],
  "incendie": ["FireRating"],
  "resistance_feu": ["FireRating"],
  "resistancefeu": ["FireRating"],
  "rf": ["FireRating"],
  
  // Acoustic
  "acoustique": ["AcousticRating"],
  "son": ["AcousticRating"],
  "bruit": ["AcousticRating"],
  
  // External
  "exterieur": ["IsExternal"],
  "externe": ["IsExternal"],
  "ext": ["IsExternal"],
  
  // Load bearing
  "porteur": ["LoadBearing"],
  "charge": ["LoadBearing"],
  "structurel": ["LoadBearing"],
  
  // Thermal
  "thermique": ["ThermalTransmittance"],
  "u_value": ["ThermalTransmittance"],
  "isolation": ["ThermalTransmittance"],
  
  // Security
  "securite": ["SecurityRating"],
  "security": ["SecurityRating"],
  
  // Self closing
  "fermeture": ["SelfClosing"],
  "auto": ["SelfClosing"],
  
  // Dimensions
  "hauteur": ["Height", "NominalHeight"],
  "largeur": ["NominalWidth"],
  "profondeur": ["NominalDepth"],
  "diametre": ["Diameter", "NominalDiameter"],
  
  // Flow
  "debit": ["FlowRate", "AirFlowRate"],
  "flow": ["FlowRate", "AirFlowRate"],
  
  // Pressure
  "pression": ["PressureClass", "PressureRating", "OperatingPressure"],
  
  // Material
  "materiau": ["Material"],
  "material": ["Material"],
  "mat": ["Material"],
  
  // Power
  "puissance": ["Power", "LampPower"],
  "watt": ["Power", "LampPower"],
  
  // Temperature
  "temperature": ["TemperatureRange", "OperationTemperatureRange", "ColorTemperature", "ActivationTemperature"],
  "temp": ["TemperatureRange", "OperationTemperatureRange"],
  
  // Volume
  "volume": ["Volume"],
  "capacite": ["Volume"],
  
  // Voltage
  "tension": ["Voltage", "NominalVoltage"],
  "volt": ["Voltage", "NominalVoltage"],
  
  // Current
  "courant": ["NominalCurrent", "MaxCurrent", "Amperage"],
  "ampere": ["Amperage"],
  
  // Slope
  "pente": ["Slope", "PitchAngle"],
  "angle": ["PitchAngle"],
  
  // Steps
  "marche": ["NumberOfTread"],
  "contremarche": ["NumberOfRiser"],
  
  // Color
  "couleur": ["Color"],
  "color": ["Color"],
  
  // Weight
  "poids": ["Weight", "OperatingWeight"],
  "masse": ["ThermalMass", "Weight"],
  
  // Heat
  "chaleur": ["HeatOutput", "HeatTransferSurfaceArea"],
  
  // Motor
  "moteur": ["MotorType"],
  
  // IP
  "ip": ["IP_Code"],
  "protection": ["IP_Code"],
  
  // Combustible
  "combustible": ["Combustible"],
  
  // Sensitivity
  "sensibilite": ["Sensitivity"],
  
  // Leakage
  "fuite": ["LeakageClass"],
  "etancheite": ["LeakageClass"]
};

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[_\-\s]+/g, "")
    .trim();
}

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

function similarity(a: string, b: string): number {
  const normA = normalize(a);
  const normB = normalize(b);
  
  if (normA === normB) return 1;
  if (normA.includes(normB) || normB.includes(normA)) return 0.9;
  
  const maxLen = Math.max(normA.length, normB.length);
  if (maxLen === 0) return 1;
  
  const distance = levenshteinDistance(normA, normB);
  return 1 - distance / maxLen;
}

export interface MatchResult {
  revitParam: string;
  ifcProperty: string | null;
  pset: string;
  confidence: number;
  isMatched: boolean;
}

export function findBestMatch(
  revitParam: string,
  availableProps: string[],
  pset: string
): MatchResult {
  const normalizedInput = normalize(revitParam);
  
  // 1. Check French dictionary first
  for (const [frenchTerm, ifcProps] of Object.entries(FRENCH_TO_IFC)) {
    if (normalizedInput.includes(frenchTerm) || frenchTerm.includes(normalizedInput)) {
      for (const ifcProp of ifcProps) {
        if (availableProps.includes(ifcProp)) {
          return {
            revitParam,
            ifcProperty: ifcProp,
            pset,
            confidence: 0.95,
            isMatched: true
          };
        }
      }
    }
  }
  
  // 2. Direct fuzzy matching with available props
  let bestMatch: string | null = null;
  let bestScore = 0;
  
  for (const prop of availableProps) {
    const score = similarity(revitParam, prop);
    if (score > bestScore && score > 0.5) {
      bestScore = score;
      bestMatch = prop;
    }
  }
  
  if (bestMatch && bestScore > 0.5) {
    return {
      revitParam,
      ifcProperty: bestMatch,
      pset,
      confidence: bestScore,
      isMatched: true
    };
  }
  
  return {
    revitParam,
    ifcProperty: null,
    pset,
    confidence: 0,
    isMatched: false
  };
}

export function parseRevitParams(input: string): string[] {
  return input
    .split(/[,;\n]+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}
