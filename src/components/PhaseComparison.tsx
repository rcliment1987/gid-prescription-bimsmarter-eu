import { useState, useMemo } from "react";
import { ArrowRight, CheckCircle2, Plus, Minus, GitCompare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { filterRecords, PROJECT_PHASES, type GIDRecord, type ProjectPhase } from "@/lib/csv-parser";
import { ElementCombobox } from "@/components/ElementCombobox";

interface PhaseComparisonProps {
  gidData: GIDRecord[];
  elements: string[];
  elementCounts: Record<string, number>;
  isLoadingElements: boolean;
}

// Generate unique ID for comparison
const getPropertyId = (record: GIDRecord): string => {
  return `${record.Categorie}_${record.Propriete}_${record.IFC_Reference}`;
};

export function PhaseComparison({
  gidData,
  elements,
  elementCounts,
  isLoadingElements,
}: PhaseComparisonProps) {
  const [phase1, setPhase1] = useState<ProjectPhase | null>(null);
  const [phase2, setPhase2] = useState<ProjectPhase | null>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  // Get records for each phase
  const records1 = useMemo(() => {
    if (!phase1 || !selectedElement) return [];
    return filterRecords(gidData, phase1, selectedElement);
  }, [gidData, phase1, selectedElement]);

  const records2 = useMemo(() => {
    if (!phase2 || !selectedElement) return [];
    return filterRecords(gidData, phase2, selectedElement);
  }, [gidData, phase2, selectedElement]);

  // Compare phases
  const comparison = useMemo(() => {
    const ids1 = new Set(records1.map(getPropertyId));
    const ids2 = new Set(records2.map(getPropertyId));

    const common: GIDRecord[] = [];
    const newInPhase2: GIDRecord[] = [];
    const removedInPhase2: GIDRecord[] = [];

    // Find common and removed (in phase1 but not in phase2)
    records1.forEach(record => {
      const id = getPropertyId(record);
      if (ids2.has(id)) {
        common.push(record);
      } else {
        removedInPhase2.push(record);
      }
    });

    // Find new (in phase2 but not in phase1)
    records2.forEach(record => {
      const id = getPropertyId(record);
      if (!ids1.has(id)) {
        newInPhase2.push(record);
      }
    });

    return { common, newInPhase2, removedInPhase2 };
  }, [records1, records2]);

  const isConfigComplete = phase1 && phase2 && selectedElement && phase1 !== phase2;

  // Group records by category for display
  const groupByCategory = (records: GIDRecord[]) => {
    return records.reduce((acc, record) => {
      const cat = record.Categorie || "Autre";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(record);
      return acc;
    }, {} as Record<string, GIDRecord[]>);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitCompare className="h-5 w-5" />
          Comparaison de Phases
        </CardTitle>
        <CardDescription>
          Comparez les propriétés requises entre deux phases du projet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Catégorie d'élément</Label>
            <ElementCombobox
              elements={elements}
              elementCounts={elementCounts}
              value={selectedElement}
              onChange={setSelectedElement}
              disabled={isLoadingElements}
            />
          </div>

          <div className="space-y-2">
            <Label>Phase 1</Label>
            <Select
              value={phase1 || ""}
              onValueChange={(value) => setPhase1(value as ProjectPhase)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_PHASES.map((phase) => (
                  <SelectItem key={phase} value={phase} disabled={phase === phase2}>
                    {phase}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Phase 2</Label>
            <Select
              value={phase2 || ""}
              onValueChange={(value) => setPhase2(value as ProjectPhase)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_PHASES.map((phase) => (
                  <SelectItem key={phase} value={phase} disabled={phase === phase1}>
                    {phase}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Comparison Arrow */}
        {phase1 && phase2 && (
          <div className="flex items-center justify-center gap-4 py-2">
            <Badge variant="outline" className="text-base px-4 py-1">{phase1}</Badge>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            <Badge variant="outline" className="text-base px-4 py-1">{phase2}</Badge>
          </div>
        )}

        {/* Empty state */}
        {!isConfigComplete && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <GitCompare className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">Configurez la comparaison</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Sélectionnez un élément et deux phases différentes pour voir l'évolution des exigences
            </p>
          </div>
        )}

        {/* Comparison Results */}
        {isConfigComplete && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Propriétés communes</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">{comparison.common.length}</p>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Plus className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Nouvelles en {phase2}</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">{comparison.newInPhase2.length}</p>
                </CardContent>
              </Card>

              <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-900 dark:bg-orange-950/20">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Minus className="h-5 w-5 text-orange-600" />
                    <span className="font-medium">Retirées en {phase2}</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">{comparison.removedInPhase2.length}</p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Lists */}
            <Accordion type="multiple" defaultValue={["new", "common"]} className="space-y-2">
              {/* New properties */}
              {comparison.newInPhase2.length > 0 && (
                <AccordionItem value="new" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4 text-blue-600" />
                      <span>Nouvelles propriétés en {phase2}</span>
                      <Badge variant="secondary">{comparison.newInPhase2.length}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      {Object.entries(groupByCategory(comparison.newInPhase2)).map(([category, records]) => (
                        <div key={category}>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">{category}</h4>
                          <div className="space-y-1">
                            {records.map((record, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 p-2 rounded bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900"
                              >
                                <Plus className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                <span className="font-medium">{record.Propriete}</span>
                                {record.IFC_Reference && (
                                  <span className="text-xs text-muted-foreground font-mono">
                                    ({record.IFC_Reference})
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Removed properties */}
              {comparison.removedInPhase2.length > 0 && (
                <AccordionItem value="removed" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Minus className="h-4 w-4 text-orange-600" />
                      <span>Propriétés retirées en {phase2}</span>
                      <Badge variant="secondary">{comparison.removedInPhase2.length}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      {Object.entries(groupByCategory(comparison.removedInPhase2)).map(([category, records]) => (
                        <div key={category}>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">{category}</h4>
                          <div className="space-y-1">
                            {records.map((record, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 p-2 rounded bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900"
                              >
                                <Minus className="h-4 w-4 text-orange-600 flex-shrink-0" />
                                <span className="font-medium line-through opacity-70">{record.Propriete}</span>
                                {record.IFC_Reference && (
                                  <span className="text-xs text-muted-foreground font-mono">
                                    ({record.IFC_Reference})
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Common properties */}
              {comparison.common.length > 0 && (
                <AccordionItem value="common" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Propriétés communes</span>
                      <Badge variant="secondary">{comparison.common.length}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      {Object.entries(groupByCategory(comparison.common)).map(([category, records]) => (
                        <div key={category}>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">{category}</h4>
                          <div className="space-y-1">
                            {records.map((record, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 p-2 rounded bg-green-50/50 dark:bg-green-950/20 border border-green-100 dark:border-green-900"
                              >
                                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                <span className="font-medium">{record.Propriete}</span>
                                {record.IFC_Reference && (
                                  <span className="text-xs text-muted-foreground font-mono">
                                    ({record.IFC_Reference})
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>

            {/* No changes */}
            {comparison.newInPhase2.length === 0 && comparison.removedInPhase2.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p>Aucune différence entre {phase1} et {phase2} pour cet élément</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
