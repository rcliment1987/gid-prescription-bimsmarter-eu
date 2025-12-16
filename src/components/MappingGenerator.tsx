import { useState } from "react";
import { FileText, Download, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  filterRecords,
  generateMapping,
  parseUserParams,
  type GIDRecord,
  type IFCVersion,
  type MappingResult,
  type ProjectPhase,
} from "@/lib/csv-parser";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MappingGeneratorProps {
  ifcVersion: IFCVersion | null;
  projectPhase: ProjectPhase | null;
  selectedElement: string | null;
  gidData: GIDRecord[];
  isConfigComplete: boolean;
}

export function MappingGenerator({
  ifcVersion,
  projectPhase,
  selectedElement,
  gidData,
  isConfigComplete,
}: MappingGeneratorProps) {
  const [revitParams, setRevitParams] = useState("");
  const [mappingResults, setMappingResults] = useState<MappingResult[]>([]);
  const [filteredRecordsCount, setFilteredRecordsCount] = useState(0);

  const handleGenerateMapping = () => {
    if (!isConfigComplete || !projectPhase || !selectedElement) {
      toast.error("Veuillez compléter la configuration du projet");
      return;
    }

    if (!revitParams.trim()) {
      toast.error("Veuillez entrer des paramètres Revit");
      return;
    }

    // Filter records by phase and element
    const filteredRecords = filterRecords(gidData, projectPhase, selectedElement);
    setFilteredRecordsCount(filteredRecords.length);

    if (filteredRecords.length === 0) {
      toast.warning("Aucune propriété GID trouvée pour cette configuration");
      setMappingResults([]);
      return;
    }

    // Parse user params and generate mapping
    const userParams = parseUserParams(revitParams);
    const results = generateMapping(userParams, filteredRecords);

    setMappingResults(results);

    const matched = results.filter((r) => r.isMatched).length;
    toast.success(`Mapping généré: ${matched}/${results.length} correspondances trouvées`);
  };

  const handleExport = () => {
    if (mappingResults.length === 0) {
      toast.error("Aucun mapping à exporter");
      return;
    }

    // Format: Pset_Name [TAB] Ifc_Property_Name [TAB] Revit_Parameter_Name
    // Using IFC_Reference as Pset_Name and officialRevitParam
    const lines = mappingResults
      .filter((r) => r.isMatched)
      .map((r) => {
        // Extract Pset from IFC_Reference (e.g., "Pset_WallCommon.FireRating" -> "Pset_WallCommon")
        const parts = r.ifcReference.split(".");
        const pset = parts.length > 1 ? parts[0] : r.ifcReference;
        return `${pset}\t${r.ifcReference}\t${r.revitParam}`;
      });

    const content = lines.join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `mapping_${selectedElement?.replace(/\s+/g, "_") || "export"}_${ifcVersion?.replace(/\s+/g, "")}_${projectPhase}_GID.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Fichier de mapping téléchargé");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Paramètres Revit (Source)
          </CardTitle>
          <CardDescription>
            Collez vos paramètres Revit, séparés par des virgules, points-virgules ou retours à la ligne
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Ex: Hauteur_Sous_Plafond, Matériau, Resistance_Feu, Is_Externe..."
            value={revitParams}
            onChange={(e) => setRevitParams(e.target.value)}
            className="min-h-[120px] font-mono text-sm"
          />
          <Button onClick={handleGenerateMapping} disabled={!isConfigComplete} className="w-full sm:w-auto">
            Générer le Mapping
          </Button>
          {!isConfigComplete && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" />
              Complétez d'abord la configuration du projet ci-dessus
            </p>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {mappingResults.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-base">Résultats du Mapping</CardTitle>
                <CardDescription>
                  {mappingResults.filter((r) => r.isMatched).length} correspondances sur {mappingResults.length} paramètres
                  <span className="text-xs ml-2">({filteredRecordsCount} propriétés GID filtrées)</span>
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Télécharger .TXT
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Paramètre Revit</TableHead>
                    <TableHead className="min-w-[200px]">Référence IFC</TableHead>
                    <TableHead className="min-w-[200px]">Revit Param Officiel</TableHead>
                    <TableHead className="min-w-[80px] text-center">Requis</TableHead>
                    <TableHead className="w-[60px] text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappingResults.map((result, index) => (
                    <TableRow key={index} className={cn(!result.isMatched && "bg-amber-50 dark:bg-amber-950/20")}>
                      <TableCell className="font-mono text-sm">{result.revitParam}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {result.ifcReference || <span className="text-muted-foreground italic">Non trouvé</span>}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {result.officialRevitParam || <span className="text-muted-foreground italic">-</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        {result.requis && (
                          <Badge variant={result.requis === "Oui" ? "default" : "secondary"} className="text-xs">
                            {result.requis}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {result.isMatched ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 inline-block" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-500 inline-block" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {mappingResults.some((r) => !r.isMatched) && (
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                Les paramètres non mappés ne seront pas inclus dans l'export
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isConfigComplete && mappingResults.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">Configurez votre projet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Sélectionnez la version IFC, la phase et la catégorie d'élément pour commencer
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Building2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </svg>
  );
}
