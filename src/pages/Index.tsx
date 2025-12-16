import { useState, useEffect } from "react";
import { MappingGenerator } from "@/components/MappingGenerator";
import { ProjectConfig } from "@/components/ProjectConfig";
import {
  loadGIDData,
  getUniqueElements,
  type IFCVersion,
  type ProjectPhase,
  type GIDRecord,
} from "@/lib/csv-parser";

const Index = () => {
  const [ifcVersion, setIfcVersion] = useState<IFCVersion | null>(null);
  const [projectPhase, setProjectPhase] = useState<ProjectPhase | null>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [elements, setElements] = useState<string[]>([]);
  const [gidData, setGidData] = useState<GIDRecord[]>([]);
  const [isLoadingElements, setIsLoadingElements] = useState(false);

  // Load elements when IFC version changes
  useEffect(() => {
    if (!ifcVersion) {
      setElements([]);
      setSelectedElement(null);
      return;
    }

    setIsLoadingElements(true);
    loadGIDData(ifcVersion)
      .then((data) => {
        setGidData(data);
        const uniqueElements = getUniqueElements(data);
        setElements(uniqueElements);
        setSelectedElement(null);
      })
      .finally(() => setIsLoadingElements(false));
  }, [ifcVersion]);

  const handleIfcVersionChange = (version: IFCVersion) => {
    setIfcVersion(version);
    setSelectedElement(null);
  };

  const handleProjectPhaseChange = (phase: ProjectPhase) => {
    setProjectPhase(phase);
  };

  const handleElementChange = (element: string) => {
    setSelectedElement(element);
  };

  const isConfigComplete = ifcVersion && projectPhase && selectedElement;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">BIMsmarter</span>
          <span className="text-sm text-muted-foreground">| GID Mapping Tool</span>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Générateur de Mapping IFC</h1>
          <p className="text-muted-foreground">
            Mappez vos paramètres Revit vers les propriétés IFC standard GID (CRTI-B Luxembourg)
          </p>
        </div>

        <ProjectConfig
          ifcVersion={ifcVersion}
          projectPhase={projectPhase}
          element={selectedElement}
          elements={elements}
          onIfcVersionChange={handleIfcVersionChange}
          onProjectPhaseChange={handleProjectPhaseChange}
          onElementChange={handleElementChange}
          isLoadingElements={isLoadingElements}
        />

        <MappingGenerator
          ifcVersion={ifcVersion}
          projectPhase={projectPhase}
          selectedElement={selectedElement}
          gidData={gidData}
          isConfigComplete={!!isConfigComplete}
        />
      </main>
    </div>
  );
};

export default Index;
