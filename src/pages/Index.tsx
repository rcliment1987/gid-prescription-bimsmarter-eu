import { useState, useEffect } from "react";
import { PrescriptionsTable } from "@/components/PrescriptionsTable";
import { ProjectConfig } from "@/components/ProjectConfig";
import {
  loadGIDData,
  getUniqueElements,
  type ProjectPhase,
  type GIDRecord,
} from "@/lib/csv-parser";

const Index = () => {
  const [projectPhase, setProjectPhase] = useState<ProjectPhase | null>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [elements, setElements] = useState<string[]>([]);
  const [gidData, setGidData] = useState<GIDRecord[]>([]);
  const [isLoadingElements, setIsLoadingElements] = useState(true);

  // Load elements on mount
  useEffect(() => {
    setIsLoadingElements(true);
    loadGIDData()
      .then((data) => {
        setGidData(data);
        const uniqueElements = getUniqueElements(data);
        setElements(uniqueElements);
      })
      .finally(() => setIsLoadingElements(false));
  }, []);

  const handleProjectPhaseChange = (phase: ProjectPhase) => {
    setProjectPhase(phase);
  };

  const handleElementChange = (element: string) => {
    setSelectedElement(element);
  };

  const isConfigComplete = projectPhase && selectedElement;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">BIMsmarter</span>
          <span className="text-sm text-muted-foreground">| Guide de Prescriptions GID</span>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Guide de Prescriptions GID</h1>
          <p className="text-muted-foreground">
            Consultez les propriétés à renseigner dans Revit selon le standard GID (CRTI-B Luxembourg)
          </p>
        </div>

        <ProjectConfig
          projectPhase={projectPhase}
          element={selectedElement}
          elements={elements}
          onProjectPhaseChange={handleProjectPhaseChange}
          onElementChange={handleElementChange}
          isLoadingElements={isLoadingElements}
        />

        <PrescriptionsTable
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
