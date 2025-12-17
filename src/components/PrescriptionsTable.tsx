import { Download, FileSpreadsheet, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { filterRecords, type GIDRecord, type ProjectPhase } from "@/lib/csv-parser";
import { toast } from "sonner";

interface PrescriptionsTableProps {
  projectPhase: ProjectPhase | null;
  selectedElement: string | null;
  gidData: GIDRecord[];
  isConfigComplete: boolean;
}

export function PrescriptionsTable({
  projectPhase,
  selectedElement,
  gidData,
  isConfigComplete,
}: PrescriptionsTableProps) {
  const filteredRecords = isConfigComplete && projectPhase && selectedElement
    ? filterRecords(gidData, projectPhase, selectedElement)
    : [];

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      toast.error("Aucune donnée à exporter");
      return;
    }

    // CSV Header
    const headers = ["Catégorie", "Sous-catégorie", "Phase", "Type document", "Propriété", "IFC_Reference", "Revit_Param", "Nom", "IFC Type", "Catégorie Revit"];
    const csvLines = [headers.join(";")];

    // CSV Data
    filteredRecords.forEach((record) => {
      const row = [
        `"${record.Categorie}"`,
        `"${record.Sous_categorie}"`,
        `"${record.Phase}"`,
        `"${record.TypeDocument}"`,
        `"${record.Propriete}"`,
        `"${record.IFC_Reference}"`,
        `"${record.Revit_Param}"`,
        `"${record.Nom}"`,
        `"${record.IFC_Type}"`,
        `"${record.Categorie_Revit}"`,
      ];
      csvLines.push(row.join(";"));
    });

    const content = csvLines.join("\n");
    const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `Prescriptions_GID_${selectedElement?.replace(/\s+/g, "_")}_${projectPhase}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Fiche de prescriptions téléchargée");
  };

  // Empty state when config is not complete
  if (!isConfigComplete) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">Configurez votre projet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            Sélectionnez la phase et la catégorie d'élément pour afficher le cahier des charges GID
          </p>
        </CardContent>
      </Card>
    );
  }

  // No results found
  if (filteredRecords.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <FileSpreadsheet className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <h3 className="font-medium">Aucune prescription trouvée</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Aucune propriété GID n'est définie pour cette combinaison phase/catégorie
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group records by Categorie
  const groupedRecords = filteredRecords.reduce((acc, record) => {
    const group = record.Categorie || "Autre";
    if (!acc[group]) acc[group] = [];
    acc[group].push(record);
    return acc;
  }, {} as Record<string, GIDRecord[]>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Cahier des Charges GID
            </CardTitle>
            <CardDescription>
              {filteredRecords.length} propriétés pour <strong>{selectedElement}</strong> en phase <strong>{projectPhase}</strong>
            </CardDescription>
          </div>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Télécharger la Fiche (.CSV)
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">Catégorie</TableHead>
                <TableHead className="min-w-[120px]">Sous-catégorie</TableHead>
                <TableHead className="min-w-[100px]">Type doc.</TableHead>
                <TableHead className="min-w-[150px]">Propriété</TableHead>
                <TableHead className="min-w-[200px]">IFC_Reference</TableHead>
                <TableHead className="min-w-[150px]">Revit_Param</TableHead>
                <TableHead className="min-w-[150px]">Nom</TableHead>
                <TableHead className="min-w-[200px]">IFC Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(groupedRecords).map(([group, records]) => (
                records.map((record, index) => (
                  <TableRow key={`${group}-${index}`}>
                    <TableCell>
                      <Badge variant="outline" className="text-xs whitespace-nowrap">
                        {record.Categorie}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{record.Sous_categorie || "-"}</TableCell>
                    <TableCell className="text-sm">
                      {record.TypeDocument && (
                        <Badge variant="secondary" className="text-xs">
                          {record.TypeDocument}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{record.Propriete || "-"}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{record.IFC_Reference || "-"}</TableCell>
                    <TableCell className="font-mono text-xs">{record.Revit_Param || "-"}</TableCell>
                    <TableCell className="text-sm">{record.Nom || "-"}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{record.IFC_Type || "-"}</TableCell>
                  </TableRow>
                ))
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
