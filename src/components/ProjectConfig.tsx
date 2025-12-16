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
import {
  IFC_VERSIONS,
  PROJECT_PHASES,
  type IFCVersion,
  type ProjectPhase,
} from "@/lib/csv-parser";

interface ProjectConfigProps {
  ifcVersion: IFCVersion | null;
  projectPhase: ProjectPhase | null;
  element: string | null;
  elements: string[];
  onIfcVersionChange: (version: IFCVersion) => void;
  onProjectPhaseChange: (phase: ProjectPhase) => void;
  onElementChange: (element: string) => void;
  isLoadingElements: boolean;
}

export function ProjectConfig({
  ifcVersion,
  projectPhase,
  element,
  elements,
  onIfcVersionChange,
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* IFC Version */}
          <div className="space-y-2">
            <Label htmlFor="ifc-version">Version IFC *</Label>
            <Select
              value={ifcVersion || ""}
              onValueChange={(v) => onIfcVersionChange(v as IFCVersion)}
            >
              <SelectTrigger id="ifc-version">
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                {IFC_VERSIONS.map((version) => (
                  <SelectItem key={version} value={version}>
                    {version}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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

          {/* Element Category */}
          <div className="space-y-2">
            <Label htmlFor="element">Catégorie d'élément *</Label>
            <Select
              value={element || ""}
              onValueChange={onElementChange}
              disabled={!ifcVersion || isLoadingElements}
            >
              <SelectTrigger id="element">
                <SelectValue
                  placeholder={
                    !ifcVersion
                      ? "Choisir version IFC d'abord"
                      : isLoadingElements
                      ? "Chargement..."
                      : "Sélectionner..."
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {elements.map((el) => (
                  <SelectItem key={el} value={el}>
                    {el}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
