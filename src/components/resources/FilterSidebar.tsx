import { Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type FilterSidebarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
  onClear: () => void;
};

const TYPE_OPTIONS = [
  { label: "All", value: "all" },
  { label: "PDF", value: "pdf" },
  { label: "DOCX", value: "docx" },
  { label: "Code", value: "code" },
  { label: "Markdown", value: "md" },
  { label: "Archive", value: "zip" },
];

const COMMON_TAGS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Data Structures",
  "Algorithms",
  "Machine Learning",
  "Web Development",
  "Notes",
  "Assignment",
  "Reference",
];

const FilterSidebar = ({
  search,
  onSearchChange,
  selectedTags,
  onTagsChange,
  selectedType,
  onTypeChange,
  onClear,
}: FilterSidebarProps) => {
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((item) => item !== tag));
      return;
    }

    onTagsChange([...selectedTags, tag]);
  };

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg">Filters</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Search</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search by title"
              className="pl-9"
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">File Type</p>
          <div className="flex flex-wrap gap-2">
            {TYPE_OPTIONS.map((type) => (
              <Button
                key={type.value}
                type="button"
                variant={selectedType === type.value ? "default" : "outline"}
                size="sm"
                onClick={() => onTypeChange(type.value)}
              >
                {type.label}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Common Tags</p>
          <div className="flex flex-wrap gap-2">
            {COMMON_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag);

              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn("rounded-full", isSelected ? "ring-2 ring-primary/40 ring-offset-2" : "")}
                >
                  <Badge variant={isSelected ? "default" : "outline"}>{tag}</Badge>
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FilterSidebar;
