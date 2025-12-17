import jsPDF from "jspdf";
import "jspdf-autotable";

// Brand colors
const COLORS = {
  primary: [35, 53, 84] as [number, number, number], // #233554 - BIMsmarter blue
  secondary: [128, 128, 128] as [number, number, number], // gray
  accent: [41, 128, 185] as [number, number, number], // blue accent
  text: [33, 33, 33] as [number, number, number],
  lightBg: [245, 247, 250] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

// Convert logo to base64 for PDF embedding
const getLogoBase64 = async (): Promise<string | null> => {
  try {
    const response = await fetch("/src/assets/bimsmarter-logo.jpg");
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

interface DynamoStep {
  title: string;
  description: string;
  illustration: string[];
  tip?: string;
}

const dynamoSteps: DynamoStep[] = [
  {
    title: "Étape 1 : Ouvrir votre projet Revit",
    description: "Lancez Autodesk Revit et ouvrez le projet pour lequel vous souhaitez créer les paramètres GID.",
    illustration: [
      "┌─────────────────────────────────────┐",
      "│  AUTODESK REVIT 2024               │",
      "├─────────────────────────────────────┤",
      "│  Fichier │ Modifier │ Vue │ Gérer  │",
      "├─────────────────────────────────────┤",
      "│                                     │",
      "│     [Ouvrir un projet existant]     │",
      "│                                     │",
      "│     MonProjet_BIM.rvt               │",
      "│                                     │",
      "└─────────────────────────────────────┘",
    ],
    tip: "Assurez-vous que votre projet utilise un gabarit conforme aux standards luxembourgeois.",
  },
  {
    title: "Étape 2 : Lancer Dynamo",
    description: "Dans le ruban Revit, naviguez vers l'onglet 'Gérer' puis cliquez sur 'Dynamo' pour ouvrir l'environnement de programmation visuelle.",
    illustration: [
      "┌─────────────────────────────────────┐",
      "│ Fichier │ Modifier │ Vue │ GÉRER ← │",
      "├─────────────────────────────────────┤",
      "│                                     │",
      "│  ┌────────┐  ┌────────┐  ┌────────┐│",
      "│  │Paramètres│ │ DYNAMO │  │Phases  ││",
      "│  └────────┘  └───↑────┘  └────────┘│",
      "│                  │                 │",
      "│            Cliquez ici !           │",
      "│                                     │",
      "└─────────────────────────────────────┘",
    ],
    tip: "Dynamo est inclus avec Revit depuis la version 2020. Aucune installation supplémentaire requise.",
  },
  {
    title: "Étape 3 : Créer un nœud Python Script",
    description: "Dans Dynamo, faites un clic droit sur le canvas et recherchez 'Python Script'. Sélectionnez-le pour créer un nouveau nœud.",
    illustration: [
      "┌─────────────────────────────────────┐",
      "│  DYNAMO                             │",
      "├─────────────────────────────────────┤",
      "│                                     │",
      "│    ┌──────────────────┐             │",
      "│    │ Rechercher...    │             │",
      "│    │ python           │             │",
      "│    ├──────────────────┤             │",
      "│    │ ▶ Python Script  │ ← Sélectionner│",
      "│    │   Iron Python    │             │",
      "│    └──────────────────┘             │",
      "│                                     │",
      "└─────────────────────────────────────┘",
    ],
  },
  {
    title: "Étape 4 : Éditer le nœud Python",
    description: "Double-cliquez sur le nœud 'Python Script' créé pour ouvrir l'éditeur de code Python intégré.",
    illustration: [
      "┌─────────────────────────────────────┐",
      "│  ┌─────────────────┐                │",
      "│  │  Python Script  │                │",
      "│  │ ═══════════════ │                │",
      "│  │   IN[0] ──┐     │                │",
      "│  │   IN[1] ──┤     │                │",
      "│  │          ├── OUT│                │",
      "│  └─────────────────┘                │",
      "│         ↑                           │",
      "│    Double-clic                      │",
      "│    pour éditer                      │",
      "└─────────────────────────────────────┘",
    ],
  },
  {
    title: "Étape 5 : Coller le code BIMsmarter",
    description: "Supprimez le code par défaut et collez l'intégralité du script téléchargé depuis BIMsmarter.",
    illustration: [
      "┌─────────────────────────────────────┐",
      "│  ÉDITEUR PYTHON                     │",
      "├─────────────────────────────────────┤",
      "│  # ================================ │",
      "│  # BIMSMARTER - Créateur GID       │",
      "│  # Version 1.0                      │",
      "│  # ================================ │",
      "│                                     │",
      "│  ELEMENT = \"Mur\"                   │",
      "│  PHASE = \"PDE\"  ← Modifier ici     │",
      "│                                     │",
      "│  # Appel API BIMsmarter...         │",
      "└─────────────────────────────────────┘",
    ],
    tip: "Le script est déjà pré-configuré avec l'élément et la phase que vous avez choisis lors du téléchargement.",
  },
  {
    title: "Étape 6 : Configurer élément et phase",
    description: "Si nécessaire, modifiez les variables ELEMENT et PHASE en haut du script pour correspondre à vos besoins.",
    illustration: [
      "┌─────────────────────────────────────┐",
      "│  # CONFIGURATION (MODIFIE ICI)     │",
      "│  # ================================ │",
      "│                                     │",
      "│  ELEMENT = \"Mur\"     # Catégorie   │",
      "│           ↓                        │",
      "│  ELEMENT = \"Dalle\"   # Nouveau     │",
      "│                                     │",
      "│  PHASE = \"PDE\"       # Phase       │",
      "│           ↓                        │",
      "│  PHASE = \"EXE\"       # Nouveau     │",
      "│                                     │",
      "└─────────────────────────────────────┘",
    ],
    tip: "Éléments disponibles : Mur, Dalle, Porte, Fenêtre, Luminaire, etc. Phases : APS, APD, PDE, EXE, EXP",
  },
  {
    title: "Étape 7 : Exécuter et vérifier",
    description: "Cliquez sur 'Run' (Exécuter) pour lancer le script. Un rapport détaillé apparaîtra dans la sortie du nœud.",
    illustration: [
      "┌─────────────────────────────────────┐",
      "│  DYNAMO                 [▶ RUN]    │",
      "├─────────────────────────────────────┤",
      "│                           ↑         │",
      "│  ┌─────────────────┐    Cliquer    │",
      "│  │  Python Script  │               │",
      "│  │ ═══════════════ │               │",
      "│  │          ├── OUT├───────────┐   │",
      "│  └─────────────────┘   WATCH   │   │",
      "│                      ┌─────────┤   │",
      "│                      │✅ 45 params│  │",
      "│                      │ créés      │  │",
      "│                      └──────────┘   │",
      "└─────────────────────────────────────┘",
    ],
    tip: "Le rapport indique le nombre de paramètres créés, ignorés (déjà existants), et les éventuelles erreurs.",
  },
];

export const generateIntegrationGuidePDF = async () => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let currentY = margin;

  // Helper functions
  const addPageNumber = (pageNum: number, totalPages: number) => {
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.secondary);
    doc.text(`Page ${pageNum} / ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: "right" });
    doc.text("© BIMsmarter - support@bimsmarter.eu", margin, pageHeight - 10);
  };

  const addSectionHeader = (title: string, pageNum: number) => {
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, pageWidth, 12, "F");
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.white);
    doc.text(title, margin, 8);
    doc.text(`Page ${pageNum}`, pageWidth - margin, 8, { align: "right" });
  };

  const drawIllustration = (lines: string[], startY: number): number => {
    doc.setFontSize(7);
    doc.setFont("courier", "normal");
    doc.setTextColor(...COLORS.primary);
    
    const boxHeight = lines.length * 3.5 + 6;
    doc.setFillColor(...COLORS.lightBg);
    doc.roundedRect(margin, startY, pageWidth - 2 * margin, boxHeight, 2, 2, "F");
    doc.setDrawColor(...COLORS.primary);
    doc.roundedRect(margin, startY, pageWidth - 2 * margin, boxHeight, 2, 2, "S");
    
    let y = startY + 5;
    lines.forEach((line) => {
      doc.text(line, margin + 5, y);
      y += 3.5;
    });
    
    doc.setFont("helvetica", "normal");
    return startY + boxHeight + 5;
  };

  // ==================
  // PAGE 1: Cover
  // ==================
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 80, "F");
  
  // Title
  doc.setFontSize(28);
  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.text("BIMsmarter", pageWidth / 2, 35, { align: "center" });
  
  doc.setFontSize(16);
  doc.setFont("helvetica", "normal");
  doc.text("Guide d'intégration Revit / Dynamo", pageWidth / 2, 50, { align: "center" });
  
  doc.setFontSize(12);
  doc.text("Automatisation des paramètres GID", pageWidth / 2, 62, { align: "center" });
  
  // Subtitle box
  doc.setFillColor(...COLORS.lightBg);
  doc.roundedRect(margin, 100, pageWidth - 2 * margin, 60, 3, 3, "F");
  
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Conformité GID - CRTI-B Luxembourg", pageWidth / 2, 120, { align: "center" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.text);
  const coverText = [
    "Ce guide vous accompagne pas à pas dans l'intégration",
    "des scripts BIMsmarter pour automatiser la création",
    "des paramètres GID dans vos projets Revit.",
  ];
  coverText.forEach((line, i) => {
    doc.text(line, pageWidth / 2, 135 + i * 7, { align: "center" });
  });
  
  // Version info
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.secondary);
  doc.text(`Version 1.0 - ${new Date().toLocaleDateString("fr-FR")}`, pageWidth / 2, 200, { align: "center" });
  doc.text("Compatible Revit 2020 - 2025", pageWidth / 2, 210, { align: "center" });
  
  // Footer
  doc.setFontSize(9);
  doc.text("support@bimsmarter.eu | https://bimsmarter.eu", pageWidth / 2, pageHeight - 20, { align: "center" });

  // ==================
  // PAGE 2: Table of Contents
  // ==================
  doc.addPage();
  addSectionHeader("Table des matières", 2);
  
  currentY = 25;
  doc.setFontSize(20);
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.text("Table des matières", margin, currentY);
  
  currentY += 15;
  const toc = [
    { title: "1. Introduction", page: 3 },
    { title: "2. Prérequis", page: 4 },
    { title: "3. Guide Script Dynamo (avec illustrations)", page: 5 },
    { title: "   • Étape 1 : Ouvrir votre projet Revit", page: 5 },
    { title: "   • Étape 2 : Lancer Dynamo", page: 6 },
    { title: "   • Étape 3 : Créer un nœud Python Script", page: 6 },
    { title: "   • Étape 4 : Éditer le nœud Python", page: 7 },
    { title: "   • Étape 5 : Coller le code BIMsmarter", page: 7 },
    { title: "   • Étape 6 : Configurer élément et phase", page: 8 },
    { title: "   • Étape 7 : Exécuter et vérifier", page: 8 },
    { title: "4. Guide Script Python Standalone", page: 9 },
    { title: "5. Documentation API REST", page: 10 },
    { title: "6. Dépannage et FAQ", page: 12 },
    { title: "7. Support et Contact", page: 13 },
  ];
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  toc.forEach((item) => {
    doc.setTextColor(...COLORS.text);
    doc.text(item.title, margin, currentY);
    doc.setTextColor(...COLORS.secondary);
    const dotsWidth = pageWidth - 2 * margin - doc.getTextWidth(item.title) - 10;
    const dots = ".".repeat(Math.floor(dotsWidth / 1.5));
    doc.text(dots, margin + doc.getTextWidth(item.title) + 2, currentY);
    doc.text(item.page.toString(), pageWidth - margin, currentY, { align: "right" });
    currentY += 8;
  });

  addPageNumber(2, 13);

  // ==================
  // PAGE 3: Introduction
  // ==================
  doc.addPage();
  addSectionHeader("1. Introduction", 3);
  
  currentY = 25;
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.text("1. Introduction", margin, currentY);
  
  currentY += 12;
  doc.setFontSize(14);
  doc.text("Qu'est-ce que BIMsmarter ?", margin, currentY);
  
  currentY += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.text);
  const introText1 = doc.splitTextToSize(
    "BIMsmarter est un outil développé pour les BIM Coordinators au Luxembourg. Il automatise la création des paramètres Revit conformes au standard GID (Guide d'Interopérabilité des Données), établi par le CRTI-B.",
    pageWidth - 2 * margin
  );
  doc.text(introText1, margin, currentY);
  
  currentY += introText1.length * 5 + 8;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("Qu'est-ce que le standard GID ?", margin, currentY);
  
  currentY += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.text);
  const introText2 = doc.splitTextToSize(
    "Le GID (Guide d'Interopérabilité des Données) est le standard BIM luxembourgeois qui définit les propriétés et paramètres requis pour chaque type d'élément BIM, selon la phase du projet. Il garantit l'interopérabilité des maquettes IFC entre tous les acteurs d'un projet.",
    pageWidth - 2 * margin
  );
  doc.text(introText2, margin, currentY);
  
  currentY += introText2.length * 5 + 8;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("Objectifs de ce guide", margin, currentY);
  
  currentY += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.text);
  const objectives = [
    "• Vous guider pas à pas dans l'utilisation du script Dynamo",
    "• Expliquer l'utilisation du script Python standalone",
    "• Documenter l'API REST pour les intégrations avancées",
    "• Fournir des solutions aux problèmes courants",
  ];
  objectives.forEach((obj) => {
    doc.text(obj, margin, currentY);
    currentY += 6;
  });

  addPageNumber(3, 13);

  // ==================
  // PAGE 4: Prerequisites
  // ==================
  doc.addPage();
  addSectionHeader("2. Prérequis", 4);
  
  currentY = 25;
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.text("2. Prérequis", margin, currentY);
  
  currentY += 15;
  
  const prerequisites = [
    { title: "Autodesk Revit", version: "2020 - 2025", required: true, note: "Dynamo est inclus" },
    { title: "Connexion Internet", version: "Active", required: true, note: "Pour l'API BIMsmarter" },
    { title: "Python 3.x", version: "3.8+", required: false, note: "Uniquement pour le script standalone" },
    { title: "pip install requests", version: "-", required: false, note: "Dépendance Python" },
  ];
  
  prerequisites.forEach((prereq) => {
    if (prereq.required) {
      doc.setFillColor(...COLORS.lightBg);
    } else {
      doc.setFillColor(250, 250, 250);
    }
    doc.roundedRect(margin, currentY, pageWidth - 2 * margin, 20, 2, 2, "F");
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.primary);
    doc.text(prereq.title, margin + 5, currentY + 8);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.text);
    doc.text(`Version : ${prereq.version}`, margin + 80, currentY + 8);
    
    doc.setTextColor(...COLORS.secondary);
    doc.text(prereq.note, margin + 5, currentY + 15);
    
    // Badge
    if (prereq.required) {
      doc.setFillColor(220, 38, 38);
    } else {
      doc.setFillColor(34, 197, 94);
    }
    doc.roundedRect(pageWidth - margin - 25, currentY + 4, 20, 6, 1, 1, "F");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.white);
    doc.text(prereq.required ? "Requis" : "Optionnel", pageWidth - margin - 23, currentY + 8.5);
    
    currentY += 25;
  });
  
  currentY += 10;
  doc.setFillColor(255, 243, 205);
  doc.roundedRect(margin, currentY, pageWidth - 2 * margin, 25, 2, 2, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(133, 100, 4);
  doc.text("💡 Note importante", margin + 5, currentY + 8);
  doc.setFont("helvetica", "normal");
  const noteText = doc.splitTextToSize(
    "Le script Dynamo fonctionne directement dans Revit sans installation supplémentaire. Le script Python standalone est optionnel et destiné aux utilisateurs avancés.",
    pageWidth - 2 * margin - 10
  );
  doc.text(noteText, margin + 5, currentY + 15);

  addPageNumber(4, 13);

  // ==================
  // PAGES 5-8: Dynamo Guide with Illustrations
  // ==================
  let pageNum = 5;
  let stepIndex = 0;
  
  while (stepIndex < dynamoSteps.length) {
    doc.addPage();
    addSectionHeader("3. Guide Script Dynamo", pageNum);
    
    currentY = 25;
    
    if (stepIndex === 0) {
      doc.setFontSize(18);
      doc.setTextColor(...COLORS.primary);
      doc.setFont("helvetica", "bold");
      doc.text("3. Guide Script Dynamo", margin, currentY);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.secondary);
      doc.text("Suivez ces étapes illustrées pour utiliser le script dans Revit/Dynamo", margin, currentY + 7);
      currentY += 20;
    }
    
    // Add 2 steps per page
    for (let i = 0; i < 2 && stepIndex < dynamoSteps.length; i++) {
      const step = dynamoSteps[stepIndex];
      
      // Step number badge
      doc.setFillColor(...COLORS.primary);
      doc.circle(margin + 4, currentY + 2, 4, "F");
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.white);
      doc.text((stepIndex + 1).toString(), margin + 2.5, currentY + 4);
      
      // Step title
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.primary);
      doc.text(step.title.replace(/^Étape \d+ : /, ""), margin + 12, currentY + 4);
      
      currentY += 10;
      
      // Description
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.text);
      const descLines = doc.splitTextToSize(step.description, pageWidth - 2 * margin);
      doc.text(descLines, margin, currentY);
      currentY += descLines.length * 5 + 5;
      
      // Illustration
      currentY = drawIllustration(step.illustration, currentY);
      
      // Tip
      if (step.tip) {
        doc.setFillColor(219, 234, 254);
        doc.roundedRect(margin, currentY, pageWidth - 2 * margin, 12, 2, 2, "F");
        doc.setFontSize(8);
        doc.setTextColor(30, 64, 175);
        doc.text(`💡 Astuce : ${step.tip}`, margin + 3, currentY + 7);
        currentY += 15;
      }
      
      currentY += 8;
      stepIndex++;
    }
    
    addPageNumber(pageNum, 13);
    pageNum++;
  }

  // ==================
  // PAGE 9: Python Standalone Guide
  // ==================
  doc.addPage();
  addSectionHeader("4. Guide Script Python Standalone", 9);
  
  currentY = 25;
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.text("4. Guide Script Python Standalone", margin, currentY);
  
  currentY += 15;
  doc.setFontSize(12);
  doc.text("Installation", margin, currentY);
  
  currentY += 8;
  doc.setFontSize(10);
  doc.setFont("courier", "normal");
  doc.setTextColor(...COLORS.text);
  doc.setFillColor(...COLORS.lightBg);
  doc.roundedRect(margin, currentY, pageWidth - 2 * margin, 10, 2, 2, "F");
  doc.text("pip install requests", margin + 5, currentY + 6);
  
  currentY += 18;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("Commandes disponibles", margin, currentY);
  
  currentY += 8;
  const commands = [
    { cmd: "python bimsmarter_generator.py --element Mur --phase PDE", desc: "Générer les fichiers pour Mur en phase PDE" },
    { cmd: "python bimsmarter_generator.py --list-elements", desc: "Lister tous les éléments disponibles" },
    { cmd: "python bimsmarter_generator.py --list-phases", desc: "Lister toutes les phases disponibles" },
  ];
  
  commands.forEach((c) => {
    doc.setFillColor(...COLORS.lightBg);
    doc.roundedRect(margin, currentY, pageWidth - 2 * margin, 18, 2, 2, "F");
    doc.setFontSize(8);
    doc.setFont("courier", "normal");
    doc.setTextColor(...COLORS.primary);
    doc.text(c.cmd, margin + 5, currentY + 6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.secondary);
    doc.text(c.desc, margin + 5, currentY + 13);
    currentY += 22;
  });
  
  currentY += 5;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("Fichiers générés", margin, currentY);
  
  currentY += 10;
  const files = [
    { name: "gabarit_Mur_PDE.txt", desc: "Fichier texte pour import dans Revit" },
    { name: "prescriptions_Mur_PDE.csv", desc: "Fichier CSV pour Excel/documentation" },
  ];
  
  files.forEach((f) => {
    doc.setFontSize(10);
    doc.setFont("courier", "bold");
    doc.setTextColor(...COLORS.primary);
    doc.text(`• ${f.name}`, margin + 5, currentY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.text);
    doc.text(f.desc, margin + 70, currentY);
    currentY += 8;
  });

  addPageNumber(9, 13);

  // ==================
  // PAGES 10-11: API Documentation
  // ==================
  doc.addPage();
  addSectionHeader("5. Documentation API REST", 10);
  
  currentY = 25;
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.text("5. Documentation API REST", margin, currentY);
  
  currentY += 12;
  doc.setFontSize(12);
  doc.text("URL de base", margin, currentY);
  
  currentY += 8;
  doc.setFillColor(...COLORS.lightBg);
  doc.roundedRect(margin, currentY, pageWidth - 2 * margin, 10, 2, 2, "F");
  doc.setFontSize(9);
  doc.setFont("courier", "normal");
  doc.setTextColor(...COLORS.primary);
  doc.text("https://xdzsqiemmiplxckfcsar.supabase.co/functions/v1", margin + 5, currentY + 6);
  
  currentY += 18;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("Endpoints disponibles", margin, currentY);
  
  currentY += 10;
  const endpoints = [
    {
      method: "GET",
      path: "/get-prescriptions",
      params: "element (string), phase (string)",
      desc: "Retourne les prescriptions GID filtrées",
    },
    {
      method: "GET",
      path: "/get-elements",
      params: "Aucun",
      desc: "Liste tous les éléments disponibles",
    },
    {
      method: "GET",
      path: "/get-phases",
      params: "Aucun",
      desc: "Liste toutes les phases disponibles",
    },
  ];
  
  endpoints.forEach((ep) => {
    doc.setFillColor(...COLORS.lightBg);
    doc.roundedRect(margin, currentY, pageWidth - 2 * margin, 22, 2, 2, "F");
    
    // Method badge
    doc.setFillColor(34, 197, 94);
    doc.roundedRect(margin + 3, currentY + 3, 12, 5, 1, 1, "F");
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.white);
    doc.text(ep.method, margin + 5, currentY + 6.5);
    
    // Path
    doc.setFontSize(10);
    doc.setFont("courier", "bold");
    doc.setTextColor(...COLORS.primary);
    doc.text(ep.path, margin + 18, currentY + 7);
    
    // Params and desc
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.secondary);
    doc.text(`Paramètres : ${ep.params}`, margin + 5, currentY + 14);
    doc.setTextColor(...COLORS.text);
    doc.text(ep.desc, margin + 5, currentY + 19);
    
    currentY += 26;
  });
  
  currentY += 5;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("Exemple de réponse JSON", margin, currentY);
  
  currentY += 8;
  doc.setFillColor(...COLORS.lightBg);
  doc.roundedRect(margin, currentY, pageWidth - 2 * margin, 50, 2, 2, "F");
  doc.setFontSize(7);
  doc.setFont("courier", "normal");
  doc.setTextColor(...COLORS.text);
  const jsonExample = [
    '{',
    '  "success": true,',
    '  "data": {',
    '    "element": "Mur",',
    '    "phase": "PDE",',
    '    "count": 45,',
    '    "prescriptions": [...]',
    '  }',
    '}',
  ];
  jsonExample.forEach((line, i) => {
    doc.text(line, margin + 5, currentY + 5 + i * 5);
  });

  addPageNumber(10, 13);

  // Continue API docs
  doc.addPage();
  addSectionHeader("5. Documentation API REST (suite)", 11);
  
  currentY = 25;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("Exemple cURL", margin, currentY);
  
  currentY += 8;
  doc.setFillColor(...COLORS.lightBg);
  doc.roundedRect(margin, currentY, pageWidth - 2 * margin, 15, 2, 2, "F");
  doc.setFontSize(8);
  doc.setFont("courier", "normal");
  doc.setTextColor(...COLORS.text);
  doc.text('curl "https://xdzsqiemmiplxckfcsar.supabase.co/functions/v1/', margin + 5, currentY + 6);
  doc.text('      get-prescriptions?element=Mur&phase=PDE"', margin + 5, currentY + 11);
  
  currentY += 25;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("Exemple JavaScript", margin, currentY);
  
  currentY += 8;
  doc.setFillColor(...COLORS.lightBg);
  doc.roundedRect(margin, currentY, pageWidth - 2 * margin, 30, 2, 2, "F");
  doc.setFontSize(7);
  doc.setFont("courier", "normal");
  doc.setTextColor(...COLORS.text);
  const jsExample = [
    'const response = await fetch(',
    '  "https://xdzsqiemmiplxckfcsar.supabase.co/functions/v1/get-prescriptions"',
    '  + "?element=Mur&phase=PDE"',
    ');',
    'const data = await response.json();',
    'console.log(data.data.prescriptions);',
  ];
  jsExample.forEach((line, i) => {
    doc.text(line, margin + 5, currentY + 5 + i * 4);
  });

  addPageNumber(11, 13);

  // ==================
  // PAGE 12: Troubleshooting
  // ==================
  doc.addPage();
  addSectionHeader("6. Dépannage et FAQ", 12);
  
  currentY = 25;
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.text("6. Dépannage et FAQ", margin, currentY);
  
  currentY += 15;
  const troubleshootItems = [
    {
      problem: '"Erreur de connexion à l\'API"',
      solution: "Vérifiez votre connexion Internet. L'API BIMsmarter nécessite un accès au réseau.",
    },
    {
      problem: '"Élément introuvable"',
      solution: "Vérifiez l'orthographe exacte de l'élément (sensible à la casse). Consultez la liste via l'API /get-elements.",
    },
    {
      problem: '"Aucune prescription trouvée"',
      solution: "Certaines combinaisons élément/phase peuvent ne pas avoir de prescriptions. Vérifiez sur l'application web.",
    },
    {
      problem: '"Paramètre existe déjà"',
      solution: "C'est normal ! Le script ignore les paramètres déjà présents pour éviter les doublons.",
    },
    {
      problem: '"urllib2 non trouvé" (Python 3)',
      solution: "Le script Dynamo utilise IronPython 2.7 (inclus dans Dynamo). Pour Python 3, utilisez le script standalone.",
    },
  ];
  
  troubleshootItems.forEach((item) => {
    doc.setFillColor(254, 242, 242);
    doc.roundedRect(margin, currentY, pageWidth - 2 * margin, 22, 2, 2, "F");
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(185, 28, 28);
    doc.text(`❌ ${item.problem}`, margin + 5, currentY + 7);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(22, 163, 74);
    const solutionLines = doc.splitTextToSize(`✅ ${item.solution}`, pageWidth - 2 * margin - 10);
    doc.text(solutionLines, margin + 5, currentY + 14);
    
    currentY += 27;
  });

  addPageNumber(12, 13);

  // ==================
  // PAGE 13: Support
  // ==================
  doc.addPage();
  addSectionHeader("7. Support et Contact", 13);
  
  currentY = 25;
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.text("7. Support et Contact", margin, currentY);
  
  currentY += 20;
  
  // Contact card
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(margin, currentY, pageWidth - 2 * margin, 50, 3, 3, "F");
  
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.text("BIMsmarter", pageWidth / 2, currentY + 15, { align: "center" });
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Automatisation des paramètres GID pour le BIM luxembourgeois", pageWidth / 2, currentY + 25, { align: "center" });
  
  doc.setFontSize(10);
  doc.text("📧 support@bimsmarter.eu", pageWidth / 2, currentY + 38, { align: "center" });
  doc.text("🌐 https://bimsmarter.eu", pageWidth / 2, currentY + 45, { align: "center" });
  
  currentY += 65;
  
  // Resources
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("Ressources utiles", margin, currentY);
  
  currentY += 10;
  const resources = [
    { label: "Application web BIMsmarter", url: "https://gid-prescription-bimsmarter-eu.lovable.app" },
    { label: "Documentation API interactive", url: "https://gid-prescription-bimsmarter-eu.lovable.app/api-docs" },
    { label: "Standard GID - CRTI-B", url: "https://crtib.lu" },
  ];
  
  resources.forEach((res) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.text);
    doc.text(`• ${res.label}`, margin + 5, currentY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.accent);
    doc.text(res.url, margin + 10, currentY + 5);
    currentY += 12;
  });
  
  currentY += 15;
  doc.setFillColor(219, 234, 254);
  doc.roundedRect(margin, currentY, pageWidth - 2 * margin, 25, 2, 2, "F");
  doc.setFontSize(10);
  doc.setTextColor(30, 64, 175);
  doc.setFont("helvetica", "bold");
  doc.text("Merci d'utiliser BIMsmarter !", pageWidth / 2, currentY + 10, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text("N'hésitez pas à nous contacter pour toute question ou suggestion.", pageWidth / 2, currentY + 18, { align: "center" });

  addPageNumber(13, 13);

  // Save the PDF
  doc.save("BIMsmarter_Guide_Integration_Revit.pdf");
};
