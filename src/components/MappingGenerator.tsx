import { useState } from "react";
import { FileText, Download, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GID_DB, type ElementKey } from "@/lib/gid-database";
import { findBestMatch, parseRevitParams, type MatchResult } from "@/lib/fuzzy-match";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MappingGeneratorProps {
  selectedCategory: ElementKey | null;
}

export function MappingGenerator({ selectedCategory }: MappingGeneratorProps) {
  const [revitParams, setRevitParams] = useState("");
  const [mappingResults, setMappingResults] = useState<MatchResult[]>([]);
  
  const elementData = selectedCategory ? GID_DB.elements[selectedCategory] : null;
  
  const handleGenerateMapping = () => {
    if (!selectedCategory || !elementData) {
      toast.error("Veuillez sélectionner une catégorie d'élément");
      return;
    }
    
    if (!revitParams.trim()) {
      toast.error("Veuillez entrer des paramètres Revit");
      return;
    }
    
    const params = parseRevitParams(revitParams);
    const results = params.map(param => 
      findBestMatch(param, elementData.props as unknown as string[], elementData.pset)
    );
    
    setMappingResults(results);
    
    const matched = results.filter(r => r.isMatched).length;
    toast.success(`Mapping généré: ${matched}/${results.length} correspondances trouvées`);
  };
  
  const handleExport = () => {
    if (mappingResults.length === 0) {
      toast.error("Aucun mapping à exporter");
      return;
    }
    
    const lines = mappingResults
      .filter(r => r.isMatched)
      .map(r => `${r.pset}\t${r.ifcProperty}\t${r.revitParam}`);
    
    const content = lines.join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `mapping_${selectedCategory?.replace(/\s+/g, "_") || "export"}_GID.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Fichier de mapping téléchargé");
  };
  
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Générateur de Mapping IFC</h1>
        <p className="text-muted-foreground">
          Mappez vos paramètres Revit vers les propriétés IFC standard GID
        </p>
      </div>
      
      {/* Selected Category Info */}
      {selectedCategory && elementData && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{selectedCategory}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{elementData.ifc}</Badge>
                  <ArrowRight className="h-3 w-3" />
                  <Badge variant="secondary">{elementData.pset}</Badge>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">Propriétés GID disponibles:</p>
            <div className="flex flex-wrap gap-1.5">
              {elementData.props.map(prop => (
                <Badge key={prop} variant="outline" className="text-xs">
                  {prop}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
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
          <Button 
            onClick={handleGenerateMapping}
            disabled={!selectedCategory}
            className="w-full sm:w-auto"
          >
            Générer le Mapping
          </Button>
        </CardContent>
      </Card>
      
      {/* Results Section */}
      {mappingResults.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Résultats du Mapping</CardTitle>
                <CardDescription>
                  {mappingResults.filter(r => r.isMatched).length} correspondances sur {mappingResults.length} paramètres
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Télécharger .TXT
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30%]">Paramètre Revit</TableHead>
                    <TableHead className="w-[30%]">Propriété IFC GID</TableHead>
                    <TableHead className="w-[30%]">Pset Cible</TableHead>
                    <TableHead className="w-[10%] text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappingResults.map((result, index) => (
                    <TableRow 
                      key={index}
                      className={cn(!result.isMatched && "bg-destructive/5")}
                    >
                      <TableCell className="font-mono text-sm">
                        {result.revitParam}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {result.ifcProperty || (
                          <span className="text-muted-foreground italic">Non mappé</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {result.isMatched ? result.pset : "-"}
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
            
            {mappingResults.some(r => !r.isMatched) && (
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                Les paramètres non mappés ne seront pas inclus dans l'export
              </p>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Empty State */}
      {!selectedCategory && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">Sélectionnez une catégorie</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Choisissez un type d'élément dans la barre latérale pour commencer
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
