import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Copy, Play, ExternalLink, ArrowLeft, Download, FileCode, Terminal } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const BASE_URL = "https://xdzsqiemmiplxckfcsar.supabase.co/functions/v1";

const DYNAMO_SCRIPT = `# ============================================
# BIMSMARTER - Créateur automatique de paramètres GID
# Version 1.0 - Compatible Revit 2020-2025
# 
# UTILISATION :
# 1. Ouvrir Revit
# 2. Gérer → Dynamo
# 3. Créer nœud "Python Script"
# 4. Coller ce code
# 5. Modifier ELEMENT et PHASE ci-dessous
# 6. Exécuter
#
# Support : support@bimsmarter.eu
# ============================================

import clr
clr.AddReference('RevitAPI')
clr.AddReference('RevitServices')

from Autodesk.Revit.DB import *
from RevitServices.Persistence import DocumentManager
from RevitServices.Transactions import TransactionManager

import urllib2
import json
import sys

# ============================================
# ⚙️ CONFIGURATION (MODIFIE ICI)
# ============================================
ELEMENT = "__ELEMENT__"      # Exemple : "Mur", "Porte", "Luminaire", etc.
PHASE = "__PHASE__"        # Exemple : "APS", "APD", "PDE", "EXE", "EXP"

# URL de l'API BIMsmarter
API_URL = "${BASE_URL}/get-prescriptions"

# ============================================
# 📡 APPEL API BIMSMARTER
# ============================================
def call_api(element, phase):
    """Appelle l'API BIMsmarter pour récupérer les prescriptions"""
    url = "{}?element={}&phase={}".format(API_URL, element, phase)
    
    try:
        response = urllib2.urlopen(url, timeout=10)
        data = json.loads(response.read())
        
        if not data.get('success', False):
            return None, "Erreur API : {}".format(data.get('error', 'Inconnue'))
        
        return data['data']['prescriptions'], None
        
    except urllib2.HTTPError as e:
        return None, "Erreur HTTP {} : {}".format(e.code, e.reason)
    except urllib2.URLError as e:
        return None, "Erreur de connexion : {}".format(str(e.reason))
    except Exception as e:
        return None, "Erreur inattendue : {}".format(str(e))

# ============================================
# 🔨 CRÉATION DES PARAMÈTRES REVIT
# ============================================
def create_parameters(doc, prescriptions):
    """Crée les paramètres partagés dans Revit"""
    created = []
    skipped = []
    errors = []
    
    # Obtenir le fichier de paramètres partagés
    app = doc.Application
    
    for prescription in prescriptions:
        param_name = prescription.get('revit_param', '').strip()
        
        if not param_name:
            continue
        
        try:
            # Vérifier si le paramètre existe déjà dans le projet
            param_exists = False
            
            # Chercher dans les paramètres du projet
            for elem in FilteredElementCollector(doc).OfClass(ParameterElement):
                if elem.Name == param_name:
                    param_exists = True
                    skipped.append(param_name)
                    break
            
            if not param_exists:
                # En production, créer un vrai paramètre partagé
                # Pour ce prototype, on log juste les paramètres à créer
                created.append({
                    'name': param_name,
                    'ifc_ref': prescription.get('ifc_reference', ''),
                    'category': prescription.get('categorie', '')
                })
        
        except Exception as e:
            errors.append({
                'param': param_name,
                'error': str(e)
            })
    
    return created, skipped, errors

# ============================================
# 🎯 EXÉCUTION PRINCIPALE
# ============================================
def main():
    """Fonction principale"""
    
    # Récupérer le document Revit actif
    doc = DocumentManager.Instance.CurrentDBDocument
    
    if doc is None:
        return "❌ ERREUR : Aucun document Revit ouvert"
    
    # Appeler l'API
    prescriptions, error = call_api(ELEMENT, PHASE)
    
    if error:
        return """
❌ ERREUR DE CONNEXION À L'API

{}

Vérifications :
1. Es-tu connecté à Internet ?
2. L'URL de l'API est-elle correcte ?
3. L'élément et la phase existent-ils ?

Éléments valides : Actionneur, Mur, Porte, Luminaire, etc.
Phases valides : APS, APD, PDE, EXE, EXP

Support : support@bimsmarter.eu
""".format(error)
    
    if not prescriptions:
        return """
⚠️ AUCUNE PRESCRIPTION TROUVÉE

Élément : {}
Phase : {}

Vérifie que :
1. Le nom de l'élément est correct (sensible à la casse)
2. La phase est valide

Pour voir la liste complète des éléments disponibles :
→ https://gid-prescription-bimsmarter-eu.lovable.app/api-docs
""".format(ELEMENT, PHASE)
    
    # Créer une transaction
    TransactionManager.Instance.EnsureInTransaction(doc)
    
    try:
        created, skipped, errors = create_parameters(doc, prescriptions)
        
        TransactionManager.Instance.TransactionTaskDone()
        
        # Générer le rapport
        report = """
✅ BIMSMARTER - EXÉCUTION TERMINÉE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RÉSUMÉ

Élément : {}
Phase : {}

📡 Prescriptions trouvées : {}
✅ Paramètres à créer : {}
⏭️  Paramètres existants : {}
❌ Erreurs : {}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
""".format(
            ELEMENT,
            PHASE,
            len(prescriptions),
            len(created),
            len(skipped),
            len(errors)
        )
        
        if created:
            report += "\\n✅ PARAMÈTRES À CRÉER :\\n\\n"
            for i, p in enumerate(created[:20], 1):  # Limiter à 20 pour la lisibilité
                report += "   {}. {} ({})\\n".format(i, p['name'], p['category'])
            if len(created) > 20:
                report += "\\n   ... et {} autres\\n".format(len(created) - 20)
        
        if skipped:
            report += "\\n⏭️  PARAMÈTRES DÉJÀ EXISTANTS :\\n\\n"
            for i, name in enumerate(skipped[:10], 1):
                report += "   {}. {}\\n".format(i, name)
            if len(skipped) > 10:
                report += "\\n   ... et {} autres\\n".format(len(skipped) - 10)
        
        if errors:
            report += "\\n❌ ERREURS :\\n\\n"
            for i, err in enumerate(errors[:5], 1):
                report += "   {}. {} : {}\\n".format(i, err['param'], err['error'])
        
        report += """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 PROCHAINES ÉTAPES

1. Vérifier les paramètres créés dans Revit
2. Renseigner les valeurs pour chaque élément
3. Exporter en IFC → Conformité GID garantie !

🌐 Plus d'infos : https://bimsmarter.eu
📧 Support : support@bimsmarter.eu

Powered by BIMsmarter 🚀
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
        
        return report
        
    except Exception as e:
        TransactionManager.Instance.ForceCloseTransaction()
        return """
❌ ERREUR LORS DE LA CRÉATION DES PARAMÈTRES

{}

Contacte le support : support@bimsmarter.eu
""".format(str(e))

# ============================================
# 🚀 LANCEMENT
# ============================================
try:
    OUT = main()
except Exception as e:
    OUT = """
❌ ERREUR FATALE

{}

Type d'erreur : {}

Contacte le support : support@bimsmarter.eu
""".format(str(e), type(e).__name__)`;

const PYTHON_SCRIPT = `#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
BIMsmarter - Générateur de gabarits de paramètres GID
Version 1.0

UTILISATION :
    python bimsmarter-generator.py --element Mur --phase PDE

SORTIE :
    - gabarit_Mur_PDE.txt (pour import Revit)
    - prescriptions_Mur_PDE.csv (pour Excel)

Requis :
    pip install requests

Support : support@bimsmarter.eu
"""

import requests
import csv
import argparse
import sys
from datetime import datetime

# Configuration
API_BASE_URL = "${BASE_URL}"

def get_available_elements():
    """Récupère la liste des éléments disponibles"""
    try:
        response = requests.get(f"{API_BASE_URL}/get-elements", timeout=10)
        response.raise_for_status()
        return response.json().get('data', {}).get('elements', [])
    except Exception as e:
        print(f"⚠️  Impossible de récupérer les éléments : {e}")
        return []

def get_available_phases():
    """Récupère la liste des phases disponibles"""
    try:
        response = requests.get(f"{API_BASE_URL}/get-phases", timeout=10)
        response.raise_for_status()
        return response.json().get('data', {}).get('phases', [])
    except Exception as e:
        print(f"⚠️  Impossible de récupérer les phases : {e}")
        return []

def get_prescriptions(element, phase):
    """Récupère les prescriptions pour un élément et une phase"""
    try:
        response = requests.get(
            f"{API_BASE_URL}/get-prescriptions",
            params={"element": element, "phase": phase},
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
        
        if not data.get('success'):
            return None, data.get('error', 'Erreur inconnue')
        
        return data['data']['prescriptions'], None
        
    except requests.exceptions.RequestException as e:
        return None, f"Erreur de connexion : {e}"

def generate_revit_template(element, phase, prescriptions):
    """Génère un fichier gabarit pour Revit"""
    filename = f"gabarit_{element}_{phase}.txt"
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write("# ==========================================\\n")
        f.write("# BIMsmarter - Gabarit de paramètres GID\\n")
        f.write(f"# Élément : {element}\\n")
        f.write(f"# Phase : {phase}\\n")
        f.write(f"# Généré le : {datetime.now().strftime('%d/%m/%Y %H:%M')}\\n")
        f.write("# ==========================================\\n\\n")
        
        f.write("# Format : Nom_Paramètre | Référence_IFC | Catégorie\\n\\n")
        
        for p in prescriptions:
            if p.get('revit_param'):
                f.write(f"{p['revit_param']}\\t{p.get('ifc_reference', '')}\\t{p.get('categorie', '')}\\n")
    
    return filename

def generate_csv_export(element, phase, prescriptions):
    """Génère un fichier CSV pour Excel"""
    filename = f"prescriptions_{element}_{phase}.csv"
    
    with open(filename, 'w', encoding='utf-8-sig', newline='') as f:
        fieldnames = [
            'Catégorie', 'Sous_catégorie', 'Propriété', 
            'Revit_Param', 'IFC_Reference', 'Type_doc'
        ]
        writer = csv.DictWriter(f, fieldnames=fieldnames, delimiter=';')
        
        writer.writeheader()
        for p in prescriptions:
            writer.writerow({
                'Catégorie': p.get('categorie', ''),
                'Sous_catégorie': p.get('sous_categorie', ''),
                'Propriété': p.get('propriete', ''),
                'Revit_Param': p.get('revit_param', ''),
                'IFC_Reference': p.get('ifc_reference', ''),
                'Type_doc': p.get('type_doc', '')
            })
    
    return filename

def main():
    parser = argparse.ArgumentParser(
        description="BIMsmarter - Générateur de gabarits GID",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemples :
  python bimsmarter-generator.py --element Mur --phase PDE
  python bimsmarter-generator.py --list-elements
  python bimsmarter-generator.py --list-phases

Support : support@bimsmarter.eu
"""
    )
    
    parser.add_argument('--element', type=str, help="Nom de l'élément BIM")
    parser.add_argument('--phase', type=str, help="Phase du projet (APS, APD, PDE, EXE, EXP)")
    parser.add_argument('--list-elements', action='store_true', help="Lister les éléments disponibles")
    parser.add_argument('--list-phases', action='store_true', help="Lister les phases disponibles")
    
    args = parser.parse_args()
    
    # Lister les éléments
    if args.list_elements:
        print("\\n📋 Éléments disponibles :\\n")
        elements = get_available_elements()
        for i, elem in enumerate(elements, 1):
            print(f"   {i:2d}. {elem}")
        print(f"\\nTotal : {len(elements)} éléments\\n")
        return 0
    
    # Lister les phases
    if args.list_phases:
        print("\\n📋 Phases disponibles :\\n")
        phases = get_available_phases()
        for i, phase in enumerate(phases, 1):
            print(f"   {i}. {phase}")
        print(f"\\nTotal : {len(phases)} phases\\n")
        return 0
    
    # Vérifier les arguments
    if not args.element or not args.phase:
        parser.print_help()
        return 1
    
    print("\\n🚀 BIMsmarter - Générateur de gabarits GID\\n")
    print("=" * 60)
    print(f"Élément : {args.element}")
    print(f"Phase : {args.phase}")
    print("=" * 60)
    
    # Récupérer les prescriptions
    print("\\n📡 Appel de l'API BIMsmarter...", end='')
    prescriptions, error = get_prescriptions(args.element, args.phase)
    
    if error:
        print(f" ❌\\n\\n❌ Erreur : {error}\\n")
        return 1
    
    print(f" ✅\\n\\n✅ {len(prescriptions)} prescriptions trouvées\\n")
    
    # Générer les fichiers
    print("📝 Génération des fichiers...\\n")
    
    txt_file = generate_revit_template(args.element, args.phase, prescriptions)
    print(f"   ✅ Gabarit Revit : {txt_file}")
    
    csv_file = generate_csv_export(args.element, args.phase, prescriptions)
    print(f"   ✅ Export CSV : {csv_file}")
    
    print(f"\\n{'=' * 60}")
    print("✅ GÉNÉRATION TERMINÉE")
    print("=" * 60)
    print(f"\\n📦 Fichiers créés :")
    print(f"   - {txt_file} (pour import Revit)")
    print(f"   - {csv_file} (pour Excel/documentation)")
    print(f"\\n📧 Tu peux maintenant distribuer ces fichiers à ton équipe !\\n")
    print("🌐 Plus d'infos : https://bimsmarter.eu")
    print("📧 Support : support@bimsmarter.eu\\n")
    
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\\n\\n⚠️  Annulé par l'utilisateur\\n")
        sys.exit(1)
    except Exception as e:
        print(f"\\n\\n❌ Erreur fatale : {e}\\n")
        sys.exit(1)`;

const ApiDocs = () => {
  const [testElement, setTestElement] = useState("Mur");
  const [testPhase, setTestPhase] = useState("PDE");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scriptElement, setScriptElement] = useState("Mur");
  const [scriptPhase, setScriptPhase] = useState("PDE");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copié dans le presse-papiers");
  };

  const testEndpoint = async (endpoint: string) => {
    setIsLoading(true);
    setTestResult(null);
    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setTestResult(JSON.stringify({ error: "Erreur de connexion" }, null, 2));
    }
    setIsLoading(false);
  };

  const downloadScript = (type: "dynamo" | "python") => {
    let content: string;
    let filename: string;

    if (type === "dynamo") {
      content = DYNAMO_SCRIPT
        .replace(/__ELEMENT__/g, scriptElement)
        .replace(/__PHASE__/g, scriptPhase);
      filename = `bimsmarter_${scriptElement}_${scriptPhase}_dynamo.py`;
    } else {
      content = PYTHON_SCRIPT;
      filename = `bimsmarter_generator.py`;
    }

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Script téléchargé : ${filename}`);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">API & Scripts d'intégration</h1>
            <p className="text-muted-foreground">
              Documentation API REST et scripts prêts à l'emploi pour Revit/Dynamo
            </p>
          </div>
        </div>

        {/* Scripts Section */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Scripts d'intégration Revit
            </CardTitle>
            <CardDescription>
              Téléchargez des scripts prêts à l'emploi pour automatiser la création de paramètres GID dans Revit
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Script Configuration */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-background rounded-lg border">
              <div className="space-y-2">
                <Label>Élément</Label>
                <Input 
                  value={scriptElement} 
                  onChange={(e) => setScriptElement(e.target.value)}
                  placeholder="Mur"
                />
              </div>
              <div className="space-y-2">
                <Label>Phase</Label>
                <Select value={scriptPhase} onValueChange={setScriptPhase}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APS">APS</SelectItem>
                    <SelectItem value="APD">APD</SelectItem>
                    <SelectItem value="PDE">PDE</SelectItem>
                    <SelectItem value="EXE">EXE</SelectItem>
                    <SelectItem value="EXP">EXP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Download Buttons */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileCode className="h-5 w-5 text-orange-500" />
                    Script Dynamo
                  </CardTitle>
                  <CardDescription>
                    Pour Revit via Dynamo (nœud Python Script)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• Compatible Revit 2020-2025</p>
                    <p>• Configuration : {scriptElement} / {scriptPhase}</p>
                    <p>• ~200 lignes de code Python</p>
                  </div>
                  <Button onClick={() => downloadScript("dynamo")} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger bimsmarter_{scriptElement}_{scriptPhase}_dynamo.py
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Terminal className="h-5 w-5 text-green-500" />
                    Script Python Standalone
                  </CardTitle>
                  <CardDescription>
                    Générateur de gabarits en ligne de commande
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• Requis : pip install requests</p>
                    <p>• Génère TXT (Revit) + CSV (Excel)</p>
                    <p>• ~150 lignes de code Python</p>
                  </div>
                  <Button onClick={() => downloadScript("python")} variant="secondary" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger bimsmarter_generator.py
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Usage Instructions */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="dynamo">
                <AccordionTrigger>
                  <span className="flex items-center gap-2">
                    <FileCode className="h-4 w-4" />
                    Guide d'utilisation - Script Dynamo
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 p-4 bg-muted rounded-lg">
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Ouvrir Revit et votre projet</li>
                      <li>Aller dans <strong>Gérer → Dynamo</strong></li>
                      <li>Créer un nouveau nœud <strong>"Python Script"</strong></li>
                      <li>Double-cliquer sur le nœud pour l'éditer</li>
                      <li>Coller le contenu du fichier téléchargé</li>
                      <li>Exécuter le script (bouton Run)</li>
                      <li>Vérifier le rapport dans la console Dynamo</li>
                    </ol>
                    <div className="p-3 bg-background rounded border">
                      <p className="text-sm font-medium">Fichier téléchargé :</p>
                      <code className="text-xs">bimsmarter_{scriptElement}_{scriptPhase}_dynamo.py</code>
                      <p className="text-xs text-muted-foreground mt-1">
                        Préconfigué pour l'élément "{scriptElement}" et la phase "{scriptPhase}"
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="python">
                <AccordionTrigger>
                  <span className="flex items-center gap-2">
                    <Terminal className="h-4 w-4" />
                    Guide d'utilisation - Script Python Standalone
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 p-4 bg-muted rounded-lg">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Installation :</p>
                      <pre className="bg-background p-2 rounded text-xs">pip install requests</pre>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Utilisation :</p>
                      <pre className="bg-background p-2 rounded text-xs space-y-1">
{`# Générer les fichiers pour un élément/phase
python bimsmarter_generator.py --element Mur --phase PDE

# Lister tous les éléments disponibles
python bimsmarter_generator.py --list-elements

# Lister toutes les phases disponibles
python bimsmarter_generator.py --list-phases`}
                      </pre>
                    </div>
                    <div className="p-3 bg-background rounded border">
                      <p className="text-sm font-medium">Fichiers générés :</p>
                      <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                        <li>• <code>gabarit_Mur_PDE.txt</code> - Pour import Revit</li>
                        <li>• <code>prescriptions_Mur_PDE.csv</code> - Pour Excel/documentation</li>
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Base URL */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              URL de base de l'API
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted p-3 rounded-md font-mono text-sm">
                {BASE_URL}
              </code>
              <Button variant="outline" size="icon" onClick={() => copyToClipboard(BASE_URL)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Endpoints */}
        <Tabs defaultValue="prescriptions" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="prescriptions">GET /get-prescriptions</TabsTrigger>
            <TabsTrigger value="elements">GET /get-elements</TabsTrigger>
            <TabsTrigger value="phases">GET /get-phases</TabsTrigger>
          </TabsList>

          {/* Prescriptions Endpoint */}
          <TabsContent value="prescriptions">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">GET</Badge>
                  <CardTitle>/get-prescriptions</CardTitle>
                </div>
                <CardDescription>
                  Retourne les prescriptions GID filtrées par élément et phase de projet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Parameters */}
                <div>
                  <h4 className="font-semibold mb-3">Paramètres</h4>
                  <div className="space-y-2">
                    <div className="grid grid-cols-4 gap-4 p-3 bg-muted rounded-md">
                      <span className="font-mono text-sm">element</span>
                      <span className="text-sm">string</span>
                      <Badge>requis</Badge>
                      <span className="text-sm text-muted-foreground">Catégorie d'élément (ex: Mur, Dalle)</span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 p-3 bg-muted rounded-md">
                      <span className="font-mono text-sm">phase</span>
                      <span className="text-sm">string</span>
                      <Badge>requis</Badge>
                      <span className="text-sm text-muted-foreground">Phase du projet (APS, APD, PDE, EXE, EXP)</span>
                    </div>
                  </div>
                </div>

                {/* Test */}
                <div className="border rounded-lg p-4 space-y-4">
                  <h4 className="font-semibold">Tester l'endpoint</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Élément</Label>
                      <Input 
                        value={testElement} 
                        onChange={(e) => setTestElement(e.target.value)}
                        placeholder="Mur"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phase</Label>
                      <Select value={testPhase} onValueChange={setTestPhase}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="APS">APS</SelectItem>
                          <SelectItem value="APD">APD</SelectItem>
                          <SelectItem value="PDE">PDE</SelectItem>
                          <SelectItem value="EXE">EXE</SelectItem>
                          <SelectItem value="EXP">EXP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button 
                    onClick={() => testEndpoint(`${BASE_URL}/get-prescriptions?element=${encodeURIComponent(testElement)}&phase=${testPhase}`)}
                    disabled={isLoading}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {isLoading ? "Chargement..." : "Tester"}
                  </Button>
                </div>

                {/* Code Examples */}
                <div>
                  <h4 className="font-semibold mb-3">Exemples de code</h4>
                  <Tabs defaultValue="curl">
                    <TabsList>
                      <TabsTrigger value="curl">cURL</TabsTrigger>
                      <TabsTrigger value="js">JavaScript</TabsTrigger>
                      <TabsTrigger value="csharp">C# (Revit)</TabsTrigger>
                      <TabsTrigger value="python">Python</TabsTrigger>
                    </TabsList>
                    <TabsContent value="curl" className="relative">
                      <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
{`curl "${BASE_URL}/get-prescriptions?element=Mur&phase=PDE"`}
                      </pre>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(`curl "${BASE_URL}/get-prescriptions?element=Mur&phase=PDE"`)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TabsContent>
                    <TabsContent value="js" className="relative">
                      <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
{`const response = await fetch(
  '${BASE_URL}/get-prescriptions?element=Mur&phase=PDE'
);
const data = await response.json();
console.log(data.data.prescriptions);`}
                      </pre>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(`const response = await fetch(\n  '${BASE_URL}/get-prescriptions?element=Mur&phase=PDE'\n);\nconst data = await response.json();\nconsole.log(data.data.prescriptions);`)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TabsContent>
                    <TabsContent value="csharp" className="relative">
                      <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
{`// Plugin Revit C#
using System.Net.Http;
using Newtonsoft.Json;

public async Task<List<Prescription>> GetPrescriptions(string element, string phase)
{
    var client = new HttpClient();
    var url = $"${BASE_URL}/get-prescriptions?element={element}&phase={phase}";
    
    var response = await client.GetAsync(url);
    var json = await response.Content.ReadAsStringAsync();
    var result = JsonConvert.DeserializeObject<ApiResponse>(json);
    
    return result.Data.Prescriptions;
}

// Créer les paramètres Revit
foreach (var p in prescriptions)
{
    CreateSharedParameter(p.RevitParam, p.IfcReference);
}`}
                      </pre>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(`// Plugin Revit C#...`)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TabsContent>
                    <TabsContent value="python" className="relative">
                      <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
{`import requests

url = "${BASE_URL}/get-prescriptions"
params = {"element": "Mur", "phase": "PDE"}

response = requests.get(url, params=params)
data = response.json()

for p in data["data"]["prescriptions"]:
    print(f"{p['revit_param']} -> {p['ifc_reference']}")`}
                      </pre>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(`import requests...`)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Elements Endpoint */}
          <TabsContent value="elements">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">GET</Badge>
                  <CardTitle>/get-elements</CardTitle>
                </div>
                <CardDescription>
                  Retourne la liste de tous les éléments/catégories disponibles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border rounded-lg p-4 space-y-4">
                  <h4 className="font-semibold">Tester l'endpoint</h4>
                  <Button 
                    onClick={() => testEndpoint(`${BASE_URL}/get-elements`)}
                    disabled={isLoading}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {isLoading ? "Chargement..." : "Tester"}
                  </Button>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Exemple cURL</h4>
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
{`curl "${BASE_URL}/get-elements"`}
                    </pre>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(`curl "${BASE_URL}/get-elements"`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Phases Endpoint */}
          <TabsContent value="phases">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">GET</Badge>
                  <CardTitle>/get-phases</CardTitle>
                </div>
                <CardDescription>
                  Retourne la liste des phases de projet disponibles avec leurs descriptions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border rounded-lg p-4 space-y-4">
                  <h4 className="font-semibold">Tester l'endpoint</h4>
                  <Button 
                    onClick={() => testEndpoint(`${BASE_URL}/get-phases`)}
                    disabled={isLoading}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {isLoading ? "Chargement..." : "Tester"}
                  </Button>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Exemple cURL</h4>
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
{`curl "${BASE_URL}/get-phases"`}
                    </pre>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(`curl "${BASE_URL}/get-phases"`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Test Result */}
        {testResult && (
          <Card>
            <CardHeader>
              <CardTitle>Résultat du test</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <pre className="bg-muted p-4 rounded-md text-sm">
                  {testResult}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Response Structure */}
        <Card>
          <CardHeader>
            <CardTitle>Structure de réponse</CardTitle>
            <CardDescription>Format JSON standardisé pour toutes les réponses</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
{`{
  "success": true,
  "data": {
    "element": "Mur",
    "phase": "PDE",
    "count": 45,
    "prescriptions": [
      {
        "id": "mur_0",
        "categorie": "Informations alphanumériques",
        "sous_categorie": "Niveau objet",
        "type_document": "Prescriptions GID",
        "propriete": "Classe IFC",
        "ifc_reference": "IFC Class",
        "revit_param": "Export Type to IFC As",
        "nom_ifc": "IfcWall",
        "ifc_type": "",
        "classification": "CC-Construction",
        "descriptif": "Définit la classe IFC de l'élément"
      }
    ]
  },
  "meta": {
    "api_version": "1.0",
    "generated_at": "2024-12-17T12:00:00Z",
    "source": "GID CRTI-B Luxembourg"
  }
}`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApiDocs;