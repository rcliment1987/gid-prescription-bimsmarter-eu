export const GID_DB = {
  elements: {
    // --- ARCHITECTURE ---
    "Mur": { ifc: "IfcWall", pset: "Pset_WallCommon", props: ["FireRating", "AcousticRating", "IsExternal", "LoadBearing", "ThermalTransmittance"] },
    "Mur rideau": { ifc: "IfcCurtainWall", pset: "Pset_CurtainWallCommon", props: ["FireRating", "AcousticRating", "IsExternal"] },
    "Porte": { ifc: "IfcDoor", pset: "Pset_DoorCommon", props: ["FireRating", "SecurityRating", "IsExternal", "SelfClosing", "AcousticRating"] },
    "Fenêtre": { ifc: "IfcWindow", pset: "Pset_WindowCommon", props: ["FireRating", "SecurityRating", "IsExternal", "ThermalTransmittance"] },
    "Dalle": { ifc: "IfcSlab", pset: "Pset_SlabCommon", props: ["LoadBearing", "FireRating", "PitchAngle", "IsExternal"] },
    "Faux-plafond": { ifc: "IfcCovering", pset: "Pset_CoveringCommon", props: ["FireRating", "AcousticRating", "Combustible"] },
    "Toiture": { ifc: "IfcRoof", pset: "Pset_RoofCommon", props: ["FireRating", "IsExternal", "ThermalTransmittance"] },
    "Escalier": { ifc: "IfcStair", pset: "Pset_StairCommon", props: ["FireRating", "NumberOfRiser", "NumberOfTread"] },
    "Garde-corps": { ifc: "IfcRailing", pset: "Pset_RailingCommon", props: ["Height", "Diameter"] },
    "Rampe": { ifc: "IfcRamp", pset: "Pset_RampCommon", props: ["LoadBearing", "Slope"] },
    "Mobilier": { ifc: "IfcFurnishingElement", pset: "Pset_FurnitureTypeCommon", props: ["NominalHeight", "NominalWidth", "NominalDepth"] },

    // --- STRUCTURE ---
    "Poutre": { ifc: "IfcBeam", pset: "Pset_BeamCommon", props: ["LoadBearing", "FireRating", "Span"] },
    "Colonne": { ifc: "IfcColumn", pset: "Pset_ColumnCommon", props: ["LoadBearing", "FireRating"] },
    "Semelle de fondation": { ifc: "IfcFooting", pset: "Pset_FootingCommon", props: ["LoadBearing", "SoilType"] },
    "Pieu": { ifc: "IfcPile", pset: "Pset_PileCommon", props: ["LoadBearing", "PileLength"] },

    // --- CVC / HVAC ---
    "Gaine de ventilation": { ifc: "IfcDuctSegment", pset: "Pset_DuctSegmentTypeCommon", props: ["PressureClass", "Shape", "AirFlowRate"] },
    "Raccord de gaine": { ifc: "IfcDuctFitting", pset: "Pset_DuctFittingTypeCommon", props: ["PressureClass", "Shape"] },
    "Ventilateur": { ifc: "IfcFan", pset: "Pset_FanTypeCommon", props: ["MotorType", "OperationTemperatureRange"] },
    "Clapet": { ifc: "IfcDamper", pset: "Pset_DamperTypeCommon", props: ["FireRating", "LeakageClass"] },
    "Silencieux": { ifc: "IfcDuctSilencer", pset: "Pset_DuctSilencerTypeCommon", props: ["AirFlowRate", "TemperatureRange"] },
    "Filtre": { ifc: "IfcFilter", pset: "Pset_FilterTypeCommon", props: ["Weight", "FlowRate"] },
    "Chaudière": { ifc: "IfcBoiler", pset: "Pset_BoilerTypeCommon", props: ["HeatTransferSurfaceArea", "OperatingPressure"] },
    "Pompe": { ifc: "IfcPump", pset: "Pset_PumpTypeCommon", props: ["FlowRate", "Head", "Power", "MotorType"] },
    "Radiateur": { ifc: "IfcSpaceHeater", pset: "Pset_SpaceHeaterTypeCommon", props: ["HeatOutput", "ThermalMass"] },

    // --- PLOMBERIE / SANITAIRE ---
    "Tuyau": { ifc: "IfcPipeSegment", pset: "Pset_PipeSegmentTypeCommon", props: ["PressureRating", "Material", "NominalDiameter", "Color"] },
    "Raccord tuyau": { ifc: "IfcPipeFitting", pset: "Pset_PipeFittingTypeCommon", props: ["PressureRating", "Material"] },
    "Equipement sanitaire": { ifc: "IfcSanitaryTerminal", pset: "Pset_SanitaryTerminalTypeCommon", props: ["Material", "Mounting", "Color"] },
    "Réservoir": { ifc: "IfcTank", pset: "Pset_TankTypeCommon", props: ["Volume", "OperatingWeight"] },
    "Vanne": { ifc: "IfcValve", pset: "Pset_ValveTypeCommon", props: ["ValvePattern", "ValveOperation", "Size"] },

    // --- ELECTRICITÉ & INCENDIE ---
    "Chemin de câbles": { ifc: "IfcCableCarrierSegment", pset: "Pset_CableCarrierSegmentTypeCommon", props: ["Material", "NominalWidth", "NominalHeight"] },
    "Tableau électrique": { ifc: "IfcElectricDistributionPoint", pset: "Pset_ElectricDistributionPointCommon", props: ["NominalCurrent", "NominalVoltage", "IP_Code"] },
    "Prise électrique": { ifc: "IfcOutlet", pset: "Pset_OutletTypeCommon", props: ["NumberOfSockets", "Amperage", "Voltage"] },
    "Interrupteur": { ifc: "IfcSwitchingDevice", pset: "Pset_SwitchingDeviceTypeCommon", props: ["NumberOfGangs", "MaxCurrent"] },
    "Luminaire": { ifc: "IfcLightFixture", pset: "Pset_LightFixtureTypeCommon", props: ["LightSourceType", "LampPower", "ColorTemperature"] },
    "Détecteur incendie": { ifc: "IfcFireSuppressionTerminal", pset: "Pset_FireSuppressionTerminalTypeCommon", props: ["ActivationTemperature", "Sensitivity"] },
    "Sprinkler": { ifc: "IfcFireSuppressionTerminal", pset: "Pset_FireSuppressionTerminalTypeCommon", props: ["ActivationTemperature", "SprinklerType"] },
    "Actionneur": { ifc: "IfcActuator", pset: "Pset_ActuatorTypeCommon", props: ["ManualOverride", "FailPosition"] }
  }
} as const;

export type ElementKey = keyof typeof GID_DB.elements;
export type ElementData = typeof GID_DB.elements[ElementKey];

export const ELEMENT_CATEGORIES = Object.keys(GID_DB.elements) as ElementKey[];

// Groupes de catégories pour une meilleure organisation
export const CATEGORY_GROUPS = {
  "Architecture": ["Mur", "Mur rideau", "Porte", "Fenêtre", "Dalle", "Faux-plafond", "Toiture", "Escalier", "Garde-corps", "Rampe", "Mobilier"],
  "Structure": ["Poutre", "Colonne", "Semelle de fondation", "Pieu"],
  "CVC / HVAC": ["Gaine de ventilation", "Raccord de gaine", "Ventilateur", "Clapet", "Silencieux", "Filtre", "Chaudière", "Pompe", "Radiateur"],
  "Plomberie / Sanitaire": ["Tuyau", "Raccord tuyau", "Equipement sanitaire", "Réservoir", "Vanne"],
  "Électricité & Incendie": ["Chemin de câbles", "Tableau électrique", "Prise électrique", "Interrupteur", "Luminaire", "Détecteur incendie", "Sprinkler", "Actionneur"]
} as const;
