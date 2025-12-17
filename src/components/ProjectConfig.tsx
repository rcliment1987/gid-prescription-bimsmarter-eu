import { Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROJECT_PHASES, type ProjectPhase } from "@/lib/csv-parser";
import { ElementCombobox } from "@/components/ElementCombobox";

interface ProjectConfigProps {
  projectPhase: ProjectPhase | null;
  element: string | null;
  elements: string[];
  elementCounts: Record<string, number>;
  onProjectPhaseChange: (phase: ProjectPhase) => void;
  onElementChange: (element: string) => void;
  isLoadingElements: boolean;
}

export function ProjectConfig({
  projectPhase,
  element,
  elements,
  elementCounts,
  onProjectPhaseChange,
  onElementChange,
  isLoadingElements,
}: ProjectConfigProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Configuration du Projet
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Project Phase */}
          <div className="space-y-2">
            <Label htmlFor="project-phase">Phase du Projet *</Label>
            <Select
              value={projectPhase || ""}
              onValueChange={(v) => onProjectPhaseChange(v as ProjectPhase)}
            >
              <SelectTrigger id="project-phase">
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_PHASES.map((phase) => (
                  <SelectItem key={phase} value={phase}>
                    {phase}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Element Category with Combobox */}
          <div className="space-y-2">
            <Label>Catégorie d'élément *</Label>
            <ElementCombobox
              elements={elements}
              value={element}
              onChange={onElementChange}
              elementCounts={elementCounts}
              disabled={isLoadingElements}
              placeholder="Rechercher un élément..."
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
