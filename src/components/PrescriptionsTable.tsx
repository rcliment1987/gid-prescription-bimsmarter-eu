import { useState, useMemo, useEffect, useCallback } from "react";
import { Download, FileSpreadsheet, ClipboardList, Filter, ChevronDown, Copy, FileText, CheckCircle2, Circle, RotateCcw } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { filterRecords, type GIDRecord, type ProjectPhase } from "@/lib/csv-parser";
import { toast } from "sonner";

interface PrescriptionsTableProps {
  projectPhase: ProjectPhase | null;
  selectedElement: string | null;
  gidData: GIDRecord[];
  isConfigComplete: boolean;
}

// Generate unique ID for each record
const getRecordId = (record: GIDRecord): string => {
  return `${record.Categorie}_${record.Propriete}_${record.IFC_Reference}`.replace(/\s+/g, "_");
};

// LocalStorage key generator
const getStorageKey = (element: string | null, phase: ProjectPhase | null): string => {
  return `checklist_${element?.replace(/\s+/g, "_")}_${phase}`;
};

export function PrescriptionsTable({
  projectPhase,
  selectedElement,
  gidData,
  isConfigComplete,
}: PrescriptionsTableProps) {
  const [categoryFilters, setCategoryFilters] = useState<Record<string, boolean>>({
    "Classe et type IFC": true,
    "Informations alphanumériques": true,
    "Documentation": false,
    "Classification": true,
  });

  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [showUncheckedOnly, setShowUncheckedOnly] = useState(false);

  const filteredRecords = isConfigComplete && projectPhase && selectedElement
    ? filterRecords(gidData, projectPhase, selectedElement)
    : [];

  // Load checked items from localStorage when element/phase changes
  useEffect(() => {
    if (!selectedElement || !projectPhase) return;
    const storageKey = getStorageKey(selectedElement, projectPhase);
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setCheckedItems(new Set(JSON.parse(saved)));
      } catch {
        setCheckedItems(new Set());
      }
    } else {
      setCheckedItems(new Set());
    }
  }, [selectedElement, projectPhase]);

  // Save checked items to localStorage
  useEffect(() => {
    if (!selectedElement || !projectPhase) return;
    const storageKey = getStorageKey(selectedElement, projectPhase);
    localStorage.setItem(storageKey, JSON.stringify([...checkedItems]));
  }, [checkedItems, selectedElement, projectPhase]);

  // Toggle check for a record
  const toggleCheck = useCallback((recordId: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(recordId)) {
        next.delete(recordId);
      } else {
        next.add(recordId);
      }
      return next;
    });
  }, []);

  // Check/uncheck all displayed records
  const toggleAll = useCallback((check: boolean) => {
    if (check) {
      const allIds = filteredRecords.map(r => getRecordId(r));
      setCheckedItems(new Set(allIds));
    } else {
      setCheckedItems(new Set());
    }
  }, [filteredRecords]);

  // Calculate category counts from filtered records
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredRecords.forEach(record => {
      const cat = record.Categorie || "Autre";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [filteredRecords]);

  // Apply category filter for display
  const displayedRecords = useMemo(() => {
    let records = filteredRecords.filter(record => {
      const cat = record.Categorie || "Autre";
      return categoryFilters[cat] !== false;
    });
    
    if (showUncheckedOnly) {
      records = records.filter(record => !checkedItems.has(getRecordId(record)));
    }
    
    return records;
  }, [filteredRecords, categoryFilters, showUncheckedOnly, checkedItems]);

  // Progress calculation
  const progressStats = useMemo(() => {
    const total = filteredRecords.length;
    const checked = filteredRecords.filter(r => checkedItems.has(getRecordId(r))).length;
    const percentage = total > 0 ? Math.round((checked / total) * 100) : 0;
    return { total, checked, percentage };
  }, [filteredRecords, checkedItems]);

  const toggleCategory = (category: string) => {
    setCategoryFilters(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    if (displayedRecords.length === 0) {
      toast.error("Aucune donnée à copier");
      return;
    }

    const headers = ["Catégorie", "Type doc.", "Propriété", "Paramètre IFC", "Paramètre Revit", "Nom", "IFC Type", "Classification", "Description"];
    const text = [
      headers.join("\t"),
      ...displayedRecords.map(record =>
        [
          record.Categorie,
          record.TypeDocument,
          record.Propriete,
          record.IFC_Reference,
          record.Revit_Param,
          record.Nom,
          record.IFC_Type,
          record.Classification,
          record.Descriptif,
        ].join("\t")
      )
    ].join("\n");

    navigator.clipboard.writeText(text);
    toast.success("Copié dans le presse-papier !");
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (displayedRecords.length === 0) {
      toast.error("Aucune donnée à exporter");
      return;
    }

    const headers = ["Catégorie", "Phase", "Type document", "Propriété", "Paramètre IFC", "Paramètre Revit_ENG", "Nom", "IfcExportAs.IfcExportTYPE", "Classification", "Numéro - Description"];
    const csvLines = [headers.join(";")];

    displayedRecords.forEach((record) => {
      const row = [
        `"${record.Categorie}"`,
        `"${record.Phase}"`,
        `"${record.TypeDocument}"`,
        `"${record.Propriete}"`,
        `"${record.IFC_Reference}"`,
        `"${record.Revit_Param}"`,
        `"${record.Nom}"`,
        `"${record.IFC_Type}"`,
        `"${record.Classification}"`,
        `"${record.Descriptif}"`,
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

    toast.success("Fichier CSV téléchargé");
  };

  // Export to Excel
  const exportToExcel = () => {
    if (displayedRecords.length === 0) {
      toast.error("Aucune donnée à exporter");
      return;
    }

    const data = displayedRecords.map(record => ({
      "Catégorie": record.Categorie,
      "Type document": record.TypeDocument,
      "Propriété": record.Propriete,
      "Paramètre IFC": record.IFC_Reference,
      "Paramètre Revit": record.Revit_Param,
      "Nom": record.Nom,
      "IFC Type": record.IFC_Type,
      "Classification": record.Classification,
      "Description": record.Descriptif,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);

    // Set column widths
    worksheet["!cols"] = [
      { wch: 25 }, // Catégorie
      { wch: 15 }, // Type document
      { wch: 30 }, // Propriété
      { wch: 35 }, // Paramètre IFC
      { wch: 30 }, // Paramètre Revit
      { wch: 20 }, // Nom
      { wch: 40 }, // IFC Type
      { wch: 20 }, // Classification
      { wch: 40 }, // Description
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, selectedElement?.substring(0, 31) || "Prescriptions");
    XLSX.writeFile(workbook, `Prescriptions_GID_${selectedElement?.replace(/\s+/g, "_")}_${projectPhase}.xlsx`);

    toast.success("Fichier Excel téléchargé");
  };

  // Export to PDF
  const exportToPDF = () => {
    if (displayedRecords.length === 0) {
      toast.error("Aucune donnée à exporter");
      return;
    }

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    // Header
    doc.setFontSize(18);
    doc.setTextColor(37, 99, 235); // Primary blue
    doc.text("BIMsmarter - Prescriptions GID", 14, 15);

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Élément: ${selectedElement}`, 14, 24);
    doc.text(`Phase: ${projectPhase}`, 14, 30);
    doc.text(`Date: ${new Date().toLocaleDateString("fr-FR")}`, 14, 36);
    doc.text(`${displayedRecords.length} prescriptions`, 200, 30);

    // Table
    autoTable(doc, {
      startY: 42,
      head: [["Catégorie", "Type doc.", "Propriété", "Paramètre IFC", "Paramètre Revit", "Classification"]],
      body: displayedRecords.map(record => [
        record.Categorie,
        record.TypeDocument,
        record.Propriete,
        record.IFC_Reference,
        record.Revit_Param,
        record.Classification,
      ]),
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        // Footer with pagination
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Page ${data.pageNumber} / ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: "center" }
        );
      },
    });

    doc.save(`Prescriptions_GID_${selectedElement?.replace(/\s+/g, "_")}_${projectPhase}.pdf`);

    toast.success("Fichier PDF téléchargé");
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

  // Group displayed records by Categorie
  const groupedRecords = displayedRecords.reduce((acc, record) => {
    const group = record.Categorie || "Autre";
    if (!acc[group]) acc[group] = [];
    acc[group].push(record);
    return acc;
  }, {} as Record<string, GIDRecord[]>);

  // Get all categories for filter UI in specific order
  const categoryOrder = ["Classe et type IFC", "Informations alphanumériques", "Documentation", "Classification"];
  const allCategories = categoryOrder.filter(cat => categoryCounts[cat] !== undefined);

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
              {displayedRecords.length}/{filteredRecords.length} propriétés pour <strong>{selectedElement}</strong> en phase <strong>{projectPhase}</strong>
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exporter
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={copyToClipboard}>
                <Copy className="h-4 w-4 mr-2" />
                Copier dans le presse-papier
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleExportCSV}>
                <FileText className="h-4 w-4 mr-2" />
                Exporter en CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToExcel}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exporter en Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToPDF}>
                <FileText className="h-4 w-4 mr-2" />
                Exporter en PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Progress Bar */}
        <div className="pt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Progression : <strong className="text-foreground">{progressStats.checked}/{progressStats.total}</strong> propriétés complétées
            </span>
            <span className={`font-medium ${progressStats.percentage === 100 ? "text-green-600" : "text-primary"}`}>
              {progressStats.percentage}%
            </span>
          </div>
          <Progress value={progressStats.percentage} className="h-2" />
        </div>

        {/* Checklist Controls */}
        <div className="flex items-center gap-2 pt-3 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleAll(true)}
            disabled={progressStats.checked === progressStats.total}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Tout cocher
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleAll(false)}
            disabled={progressStats.checked === 0}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Réinitialiser
          </Button>
          <label className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-background hover:bg-muted/50 cursor-pointer transition-colors ml-auto">
            <Checkbox
              checked={showUncheckedOnly}
              onCheckedChange={(checked) => setShowUncheckedOnly(!!checked)}
            />
            <span className="text-sm whitespace-nowrap">Afficher non cochées uniquement</span>
          </label>
        </div>
        
        {/* Category Filters */}
        <div className="flex items-center gap-2 pt-3 flex-wrap">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>Filtrer :</span>
          </div>
          {allCategories.map(category => (
            <label
              key={category}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-background hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <Checkbox
                checked={categoryFilters[category] !== false}
                onCheckedChange={() => toggleCategory(category)}
              />
              <span className="text-sm whitespace-nowrap">
                {category} ({categoryCounts[category]})
              </span>
            </label>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {displayedRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Filter className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <h3 className="font-medium">Aucune propriété affichée</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Activez au moins une catégorie pour voir les prescriptions
            </p>
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">✓</TableHead>
                  <TableHead className="min-w-[120px]">Catégorie</TableHead>
                  <TableHead className="min-w-[100px]">Type doc.</TableHead>
                  <TableHead className="min-w-[150px]">Propriété</TableHead>
                  <TableHead className="min-w-[200px]">Paramètre IFC</TableHead>
                  <TableHead className="min-w-[180px]">Paramètre Revit_ENG</TableHead>
                  <TableHead className="min-w-[150px]">Nom</TableHead>
                  <TableHead className="min-w-[250px]">IfcExportAs.IfcExportTYPE</TableHead>
                  <TableHead className="min-w-[150px]">Classification</TableHead>
                  <TableHead className="min-w-[200px]">Numéro - Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(groupedRecords).map(([group, records]) => (
                  records.map((record, index) => {
                    const recordId = getRecordId(record);
                    const isChecked = checkedItems.has(recordId);
                    return (
                      <TableRow 
                        key={`${group}-${index}`}
                        className={isChecked ? "bg-muted/30" : ""}
                      >
                        <TableCell>
                          <button
                            onClick={() => toggleCheck(recordId)}
                            className="flex items-center justify-center w-6 h-6 rounded hover:bg-muted transition-colors"
                          >
                            {isChecked ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground" />
                            )}
                          </button>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs whitespace-nowrap ${isChecked ? "opacity-60" : ""}`}>
                            {record.Categorie}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-sm ${isChecked ? "opacity-60" : ""}`}>
                          {record.TypeDocument && (
                            <Badge variant="secondary" className="text-xs">
                              {record.TypeDocument}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className={`font-medium ${isChecked ? "opacity-60 line-through" : ""}`}>{record.Propriete || "-"}</TableCell>
                        <TableCell className={`font-mono text-xs text-muted-foreground ${isChecked ? "opacity-60" : ""}`}>{record.IFC_Reference || "-"}</TableCell>
                        <TableCell className={`font-mono text-xs ${isChecked ? "opacity-60" : ""}`}>{record.Revit_Param || "-"}</TableCell>
                        <TableCell className={`text-sm ${isChecked ? "opacity-60" : ""}`}>{record.Nom || "-"}</TableCell>
                        <TableCell className={`font-mono text-xs text-muted-foreground ${isChecked ? "opacity-60" : ""}`}>{record.IFC_Type || "-"}</TableCell>
                        <TableCell className={`text-sm ${isChecked ? "opacity-60" : ""}`}>{record.Classification || "-"}</TableCell>
                        <TableCell className={`text-sm ${isChecked ? "opacity-60" : ""}`}>{record.Descriptif || "-"}</TableCell>
                      </TableRow>
                    );
                  })
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
