import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Filter, Upload } from "lucide-react";

import FilterSidebar from "@/components/resources/FilterSidebar";
import ResourceCard from "@/components/resources/ResourceCard";
import UploadDialog from "@/components/resources/UploadDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthContext } from "@/contexts/AuthContext";
import { useResources } from "@/hooks/useResources";
import type { Resource } from "@/types/resource";
import { useVirtualizer } from "@tanstack/react-virtual";

const ResourceHub = () => {
  const auth = useContext(AuthContext);
  const currentUser = auth?.user ?? null;

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState("all");
  const [savedOnly, setSavedOnly] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Debounce search to prevent network spam on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const { resources, loading, error, refetch } = useResources({
    search: debouncedSearch,
    tags: selectedTags,
    fileType: selectedType === "all" || selectedType === "code" ? undefined : selectedType,
    savedOnly,
  });

  const displayedResources = useMemo(() => {
    if (selectedType !== "code") {
      return resources;
    }

    return resources.filter((resource) => ["py", "js", "ts", "md","txt"].includes(resource.file_type));
  }, [resources, selectedType]);

  const gridRows = useMemo(() => {
    const rows: Resource[][] = [];

    for (let index = 0; index < displayedResources.length; index += 3) {
      rows.push(displayedResources.slice(index, index + 3));
    }

    return rows;
  }, [displayedResources]);

  const rowsParentRef = useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: gridRows.length,
    getScrollElement: () => rowsParentRef.current,
    estimateSize: () => 520,
    overscan: 4,
  });

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setSelectedTags([]);
    setSelectedType("all");
    setSavedOnly(false);
  }, []);

  const sidebar = (
    <FilterSidebar
      search={search}
      onSearchChange={setSearch}
      selectedTags={selectedTags}
      onTagsChange={setSelectedTags}
      selectedType={selectedType}
      onTypeChange={setSelectedType}
      savedOnly={savedOnly}
      onSavedOnlyChange={setSavedOnly}
      onClear={handleClearFilters}
    />
  );

  const renderSkeletons = () =>
    Array.from({ length: 3 }).map((_, index) => (
      <Card key={index} className="flex h-full flex-col">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-start gap-3">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
        </CardContent>
      </Card>
    ));

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Resource Hub</h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              Browse shared notes, code samples, assignments, and study references uploaded by the community.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full max-w-sm overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filter Resources</SheetTitle>
                </SheetHeader>
                <div className="mt-6">{sidebar}</div>
              </SheetContent>
            </Sheet>

            <Button onClick={() => setIsUploadOpen(true)} disabled={!currentUser}>
              <Upload className="h-4 w-4" />
              Upload Resource
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          <aside className="hidden lg:block lg:col-span-1">{sidebar}</aside>

          <section className="lg:col-span-3">
            {error ? (
              <ErrorBanner
                title="Could not load resources"
                description={error}
                actionLabel="Try again"
                onAction={refetch}
              />
            ) : loading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{renderSkeletons()}</div>
            ) : displayedResources.length === 0 ? (
              <Card>
                <CardContent className="flex min-h-[240px] flex-col items-center justify-center gap-2 p-6 text-center">
                  <h2 className="text-xl font-semibold text-foreground">No resources found</h2>
                  <p className="max-w-md text-sm text-muted-foreground">
                    Try adjusting your search or filters, or upload the first resource for this topic.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div ref={rowsParentRef} className="h-[1200px] overflow-y-auto pr-2">
                <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: "relative" }}>
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const row = gridRows[virtualRow.index];

                    return (
                      <div
                        key={virtualRow.key}
                        ref={rowVirtualizer.measureElement}
                        data-index={virtualRow.index}
                        style={{
                          transform: `translateY(${virtualRow.start}px)`,
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                        }}
                        className="pb-4"
                      >
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                          {row.map((resource: Resource) => (
                            <ResourceCard key={resource.id} resource={resource} onDelete={refetch} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      <UploadDialog
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        onSuccess={refetch}
      />
    </div>
  );
};

export default ResourceHub;
