import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CategorySidebar } from "@/components/CategorySidebar";
import { MappingGenerator } from "@/components/MappingGenerator";
import { type ElementKey } from "@/lib/gid-database";

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState<ElementKey | null>(null);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <CategorySidebar 
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
        <main className="flex-1 overflow-auto bg-background">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">BIMsmarter</span>
              <span className="text-xs text-muted-foreground">| GID Mapping Tool</span>
            </div>
          </header>
          <MappingGenerator selectedCategory={selectedCategory} />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
