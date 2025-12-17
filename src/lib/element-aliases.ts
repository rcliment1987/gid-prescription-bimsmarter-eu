// Multilingual aliases for BIM elements (FR, EN, DE, LU)
export const ELEMENT_ALIASES: Record<string, string[]> = {
  // Structural elements
  "Mur": ["wall", "wand", "mauer", "cloison", "partition"],
  "Mur rideau": ["curtain wall", "vorhangfassade", "facade rideau", "curtainwall"],
  "Sol": ["floor", "boden", "plancher", "slab", "dalle"],
  "Plafond": ["ceiling", "decke", "faux plafond", "false ceiling"],
  "Toit": ["roof", "dach", "toiture", "couverture"],
  "Escalier": ["stair", "stairs", "treppe", "stufen"],
  "Rampe": ["ramp", "rampe", "auffahrt"],
  "Garde-corps": ["railing", "guardrail", "geländer", "balustrade", "handrail"],
  "Fondation": ["foundation", "fundament", "semelle", "footing"],
  "Poutre": ["beam", "träger", "balken", "linteau"],
  "Poteau": ["column", "säule", "pilier", "stütze"],
  "Dalle": ["slab", "platte", "plancher", "floor slab"],
  
  // Openings
  "Porte": ["door", "tür", "türe", "entrance"],
  "Fenêtre": ["window", "fenster", "glazing", "vitrage"],
  
  // MEP - Electrical
  "Luminaire": ["light", "lighting", "lampe", "leuchte", "fixture", "éclairage"],
  "Appareil électrique": ["electrical device", "elektrisches gerät", "elektro"],
  "Équipement électrique": ["electrical equipment", "elektroausstattung"],
  "Chemin de câbles": ["cable tray", "kabelrinne", "kabelkanal"],
  
  // MEP - HVAC
  "Gaine": ["duct", "kanal", "luftkanal", "conduit"],
  "Bouche d'aération": ["air terminal", "luftauslass", "diffuseur", "grille"],
  "Équipement de génie climatique": ["hvac equipment", "klimaanlage", "cvc"],
  "Accessoire de gaine": ["duct accessory", "kanalzubehör"],
  "Raccord de gaine": ["duct fitting", "kanalformstück"],
  
  // MEP - Plumbing
  "Canalisation": ["pipe", "rohr", "leitung", "tuyau", "conduite"],
  "Accessoire de canalisation": ["pipe accessory", "rohrzubehör"],
  "Raccord de canalisation": ["pipe fitting", "rohrformstück"],
  "Appareil sanitaire": ["plumbing fixture", "sanitär", "sanitaire"],
  "Équipement de plomberie": ["plumbing equipment", "sanitärausstattung"],
  
  // Furniture & Equipment
  "Mobilier": ["furniture", "möbel", "meuble", "einrichtung"],
  "Équipement spécialisé": ["specialty equipment", "spezialausrüstung"],
  "Casework": ["casework", "schrank", "rangement", "storage"],
  
  // Site & Context
  "Terrain": ["site", "gelände", "topographie", "terrain"],
  "Parking": ["parking", "parkplatz", "stationnement"],
  "Végétation": ["planting", "bepflanzung", "plantation", "vegetation"],
  
  // Generic/Other
  "Modèle générique": ["generic model", "generisches modell", "modèle", "model"],
  "Élément de détail": ["detail item", "detailelement"],
  "Annotation": ["annotation", "beschriftung", "note"],
  "Pièce": ["room", "raum", "local", "space", "espace"],
  "Zone": ["zone", "bereich", "area"],
  "Niveau": ["level", "ebene", "étage", "floor"],
  "Quadrillage": ["grid", "raster", "grille", "trame"],
  
  // Finishing
  "Parachèvement des murs": ["wall finish", "wandverkleidung", "finition murale"],
  "Parachèvement des sols": ["floor finish", "bodenbelag", "revêtement sol"],
  "Parachèvement des plafonds": ["ceiling finish", "deckenverkleidung"],
  
  // Fire protection
  "Protection incendie": ["fire protection", "brandschutz", "sprinkler"],
  
  // Structure
  "Ossature": ["structural framing", "tragwerk", "charpente", "frame"],
  "Armature": ["rebar", "bewehrung", "reinforcement", "ferraillage"],
};

// Normalize string for search comparison
function normalizeForSearch(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .trim();
}

// Search elements with alias support
export function searchElements(
  elements: string[],
  searchTerm: string
): string[] {
  if (!searchTerm.trim()) {
    return elements;
  }

  const normalizedSearch = normalizeForSearch(searchTerm);

  return elements.filter((element) => {
    // Check element name
    const normalizedElement = normalizeForSearch(element);
    if (normalizedElement.includes(normalizedSearch)) {
      return true;
    }

    // Check aliases
    const aliases = ELEMENT_ALIASES[element];
    if (aliases) {
      return aliases.some((alias) =>
        normalizeForSearch(alias).includes(normalizedSearch)
      );
    }

    return false;
  });
}
