import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { PrescriptionsTable } from "@/components/PrescriptionsTable";
import { ProjectConfig } from "@/components/ProjectConfig";
import { PhaseComparison } from "@/components/PhaseComparison";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ClipboardList, GitCompare, Code2, History, Star, X } from "lucide-react";
import {
  loadGIDData,
  getUniqueElements,
  getElementIndex,
  type ProjectPhase,
  type GIDRecord,
} from "@/lib/csv-parser";
import { useSearchHistory } from "@/hooks/use-search-history";
import { useFavorites } from "@/hooks/use-favorites";
import { toast } from "sonner";
import bimSmarterLogo from "@/assets/bimsmarter-logo.jpg";

const Index = () => {
  const [projectPhase, setProjectPhase] = useState<ProjectPhase | null>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [elements, setElements] = useState<string[]>([]);
  const [gidData, setGidData] = useState<GIDRecord[]>([]);
  const [isLoadingElements, setIsLoadingElements] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const { history, addToHistory } = useSearchHistory();
  const { favorites, isFavorite, toggleFavorite, removeFavorite } = useFavorites();

  // Load elements on mount with progress tracking
  useEffect(() => {
    setIsLoadingElements(true);
    setLoadingProgress(10);
    
    loadGIDData()
      .then((data) => {
        setLoadingProgress(60);
        setGidData(data);
        setLoadingProgress(80);
        const uniqueElements = getUniqueElements(data);
        setElements(uniqueElements);
        setLoadingProgress(100);
      })
      .finally(() => {
        setTimeout(() => setIsLoadingElements(false), 300);
      });
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
  }, [gidData]);

  const handleProjectPhaseChange = (phase: ProjectPhase) => {
    setProjectPhase(phase);
    if (selectedElement) {
      addToHistory(selectedElement, phase);
    }
  };

  const handleElementChange = (element: string) => {
    setSelectedElement(element);
    if (projectPhase) {
      addToHistory(element, projectPhase);
    }
  };

  const handleHistorySelect = (element: string, phase: string) => {
    setSelectedElement(element);
    setProjectPhase(phase as ProjectPhase);
  };

  const handleFavoriteSelect = (element: string, phase: string) => {
    setSelectedElement(element);
    setProjectPhase(phase as ProjectPhase);
  };

  const handleToggleFavorite = () => {
    if (!selectedElement || !projectPhase) return;
    
    const added = toggleFavorite(selectedElement, projectPhase);
    if (added === true) {
      toast.success("Ajouté aux favoris");
    } else if (added === false) {
      toast.info("Retiré des favoris");
    }
  };

  const isConfigComplete = projectPhase && selectedElement;
  const currentIsFavorite = selectedElement && projectPhase && isFavorite(selectedElement, projectPhase);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
        <div className="flex items-center gap-3">
          <img src={bimSmarterLogo} alt="BIMsmarter" className="h-8 w-auto rounded" />
          <span className="text-sm text-muted-foreground">| Guide de Prescriptions GID</span>
        </div>
        <Link to="/api-docs">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Code2 className="h-4 w-4" />
            API & Scripts
          </Button>
        </Link>
      </header>

      <main className="flex-1 p-6 space-y-6">
        {/* Loading Progress */}
        {isLoadingElements && loadingProgress < 100 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Chargement des données GID...</span>
              <span>{loadingProgress}%</span>
            </div>
            <Progress value={loadingProgress} className="h-2" />
          </div>
        )}

        <div>
          <h1 className="text-2xl font-bold tracking-tight">Guide de Prescriptions GID</h1>
          <p className="text-muted-foreground">
            Consultez les propriétés à renseigner dans Revit selon le standard GID (CRTI-B Luxembourg)
          </p>
        </div>

        {/* Favorites Section */}
        {favorites.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-muted-foreground">Favoris :</span>
            {favorites.map((fav) => (
              <Badge
                key={`${fav.element}-${fav.phase}`}
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80 flex items-center gap-1"
                onClick={() => handleFavoriteSelect(fav.element, fav.phase)}
              >
                {fav.element} - {fav.phase}
                <X
                  className="h-3 w-3 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFavorite(fav.element, fav.phase);
                    toast.info("Favori supprimé");
                  }}
                />
              </Badge>
            ))}
          </div>
        )}

        {/* Search History Section */}
        {history.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <History className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Récent :</span>
            {history.map((item) => (
              <Badge
                key={`${item.element}-${item.phase}-${item.timestamp}`}
                variant="outline"
                className="cursor-pointer hover:bg-accent"
                onClick={() => handleHistorySelect(item.element, item.phase)}
              >
                {item.element} - {item.phase}
              </Badge>
            ))}
          </div>
        )}

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
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <ProjectConfig
                  projectPhase={projectPhase}
                  element={selectedElement}
                  elements={elements}
                  elementCounts={elementCounts}
                  onProjectPhaseChange={handleProjectPhaseChange}
                  onElementChange={handleElementChange}
                  isLoadingElements={isLoadingElements}
                />
              </div>
              {isConfigComplete && (
                <Button
                  variant={currentIsFavorite ? "default" : "outline"}
                  size="icon"
                  onClick={handleToggleFavorite}
                  className="mt-[68px]"
                  title={currentIsFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                >
                  <Star className={`h-4 w-4 ${currentIsFavorite ? "fill-current" : ""}`} />
                </Button>
              )}
            </div>

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
