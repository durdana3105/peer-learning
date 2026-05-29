import { useCallback, useContext, useMemo, useState } from "react";
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

const ResourceHub = () => {
  const auth = useContext(AuthContext);
  const currentUser = auth?.user ?? null;

  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState("all");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const { resources, loading, error, refetch } = useResources({
    search,
    tags: selectedTags,
    fileType: selectedType === "all" || selectedType === "code" ? undefined : selectedType,
  });

  const displayedResources = useMemo(() => {
    if (selectedType !== "code") {
      return resources;
    }

    return resources.filter((resource) => ["py", "js", "ts"].includes(resource.file_type));
  }, [resources, selectedType]);

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setSelectedTags([]);
    setSelectedType("all");
  }, []);

  const sidebar = (
    <FilterSidebar
      search={search}
      onSearchChange={setSearch}
      selectedTags={selectedTags}
      onTagsChange={setSelectedTags}
      selectedType={selectedType}
      onTypeChange={setSelectedType}
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
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {displayedResources.map((resource: Resource) => (
                  <ResourceCard key={resource.id} resource={resource} onDelete={refetch} />
                ))}
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
