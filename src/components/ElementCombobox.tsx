import { useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { searchElements } from "@/lib/element-aliases";

interface ElementComboboxProps {
  elements: string[];
  value: string | null;
  onChange: (value: string) => void;
  elementCounts: Record<string, number>;
  disabled?: boolean;
  placeholder?: string;
}

export function ElementCombobox({
  elements,
  value,
  onChange,
  elementCounts,
  disabled = false,
  placeholder = "Rechercher un élément...",
}: ElementComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredElements = searchElements(elements, searchTerm);

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setOpen(false);
    setSearchTerm("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          {value ? (
            <span className="flex items-center gap-2 truncate">
              <span className="truncate">{value}</span>
              <span className="text-muted-foreground text-xs">
                ({elementCounts[value] || 0})
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">
              {disabled ? "Chargement..." : "Sélectionner..."}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            <CommandEmpty>Aucun élément trouvé.</CommandEmpty>
            <CommandGroup>
              {filteredElements.map((element) => (
                <CommandItem
                  key={element}
                  value={element}
                  onSelect={() => handleSelect(element)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Check
                      className={cn(
                        "h-4 w-4",
                        value === element ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span>{element}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {elementCounts[element] || 0} prescrip.
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
