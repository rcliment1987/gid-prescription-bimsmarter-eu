import { useState, useEffect, useMemo } from "react";
import { PrescriptionsTable } from "@/components/PrescriptionsTable";
import { ProjectConfig } from "@/components/ProjectConfig";
import { PhaseComparison } from "@/components/PhaseComparison";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, GitCompare } from "lucide-react";
import {
  loadGIDData,
  getUniqueElements,
  getElementIndex,
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

  // Calculate element counts from the index
  const elementCounts = useMemo(() => {
    const index = getElementIndex();
    const counts: Record<string, number> = {};
    
    if (index) {
      index.forEach((records, element) => {
        counts[element] = records.length;
      });
    }
    
    return counts;
  }, [gidData]); // Recalculate when gidData changes (after load)

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

        <Tabs defaultValue="guide" className="space-y-6">
          <TabsList>
            <TabsTrigger value="guide" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Cahier des Charges
            </TabsTrigger>
            <TabsTrigger value="compare" className="flex items-center gap-2">
              <GitCompare className="h-4 w-4" />
              Comparaison de Phases
            </TabsTrigger>
          </TabsList>

          <TabsContent value="guide" className="space-y-6">
            <ProjectConfig
              projectPhase={projectPhase}
              element={selectedElement}
              elements={elements}
              elementCounts={elementCounts}
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
          </TabsContent>

          <TabsContent value="compare">
            <PhaseComparison
              gidData={gidData}
              elements={elements}
              elementCounts={elementCounts}
              isLoadingElements={isLoadingElements}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
