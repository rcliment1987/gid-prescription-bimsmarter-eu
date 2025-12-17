import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Play, ExternalLink, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const BASE_URL = "https://xdzsqiemmiplxckfcsar.supabase.co/functions/v1";

const ApiDocs = () => {
  const [testElement, setTestElement] = useState("Mur");
  const [testPhase, setTestPhase] = useState("PDE");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
            <h1 className="text-3xl font-bold">API REST - GID Prescriptions</h1>
            <p className="text-muted-foreground">
              Documentation pour l'intégration avec Revit, Dynamo ou d'autres outils BIM
            </p>
          </div>
        </div>

        {/* Base URL */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              URL de base
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
