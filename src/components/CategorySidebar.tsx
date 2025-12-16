import { Building2, Columns, Wind, Droplets, Zap } from "lucide-react";
import { CATEGORY_GROUPS, type ElementKey } from "@/lib/gid-database";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface CategorySidebarProps {
  selectedCategory: ElementKey | null;
  onSelectCategory: (category: ElementKey) => void;
}

const GROUP_ICONS = {
  "Architecture": Building2,
  "Structure": Columns,
  "CVC / HVAC": Wind,
  "Plomberie / Sanitaire": Droplets,
  "Électricité & Incendie": Zap,
};

export function CategorySidebar({ selectedCategory, onSelectCategory }: CategorySidebarProps) {
  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Building2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">BIM GID Injector</h2>
            <p className="text-xs text-muted-foreground">Standard CRTI-B</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-2">
        {Object.entries(CATEGORY_GROUPS).map(([groupName, categories]) => {
          const Icon = GROUP_ICONS[groupName as keyof typeof GROUP_ICONS];
          
          return (
            <SidebarGroup key={groupName}>
              <SidebarGroupLabel className="flex items-center gap-2 px-2 text-xs font-medium text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
                {groupName}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {categories.map((category) => (
                    <SidebarMenuItem key={category}>
                      <SidebarMenuButton
                        onClick={() => onSelectCategory(category as ElementKey)}
                        className={cn(
                          "w-full justify-start text-sm transition-colors",
                          selectedCategory === category && "bg-accent text-accent-foreground font-medium"
                        )}
                      >
                        {category}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
