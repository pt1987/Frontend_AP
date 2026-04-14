import { useMemo, useState } from "react";
import { PackageCard } from "@/components/packages/PackageCard";
import { PackageFilters } from "@/components/packages/PackageFilters";
import { PaginationControls } from "@/components/packages/PaginationControls";
import { MultiRequestDialog } from "@/components/requests/MultiRequestDialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { de } from "@/i18n/de";
import { useUiStore } from "@/store/uiStore";
import { usePackagesWithStatus, useCatalogs } from "@/hooks/useAccessPackages";
import { useCategories } from "@/hooks/useCategories";
import {
  PackageStatusFilter,
  SortDirection,
  type PackageWithStatus,
} from "@/types/app";
import { classifyGraphError } from "@/utils/errorHandling";

export function PackageCatalogPage() {
  const {
    searchQuery,
    selectedCatalogId,
    selectedCategoryId,
    statusFilter,
    sortDirection,
    currentPage,
    pageSize,
    selectedPackageIds,
    togglePackageSelection,
  } = useUiStore();

  const [isMultiRequestOpen, setIsMultiRequestOpen] = useState(false);

  const { packages, isLoading, error } = usePackagesWithStatus();
  const catalogsQuery = useCatalogs();
  const categoriesQuery = useCategories();

  const categories = categoriesQuery.data ?? [];
  const catalogs = catalogsQuery.data ?? [];

  const filteredPackages = useMemo(() => {
    let result = packages;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (pkg) =>
          pkg.displayName.toLowerCase().includes(query) ||
          pkg.description.toLowerCase().includes(query)
      );
    }

    if (selectedCatalogId) {
      result = result.filter((pkg) => pkg.catalogId === selectedCatalogId);
    }

    if (selectedCategoryId) {
      const category = categories.find((c) => c.id === selectedCategoryId);
      if (category) {
        const packageIdSet = new Set(category.packageIds);
        result = result.filter((pkg) => packageIdSet.has(pkg.id));
      }
    }

    switch (statusFilter) {
      case PackageStatusFilter.Requestable:
        result = result.filter((pkg) => pkg.isRequestable);
        break;
      case PackageStatusFilter.Assigned:
        result = result.filter((pkg) => pkg.isAssigned);
        break;
      case PackageStatusFilter.NotRequestable:
        result = result.filter((pkg) => !pkg.isRequestable && !pkg.isAssigned && !pkg.isPending);
        break;
    }

    if (sortDirection === SortDirection.AscAlpha) {
      result = [...result].sort((a, b) =>
        a.displayName.localeCompare(b.displayName)
      );
    } else if (sortDirection === SortDirection.DescAlpha) {
      result = [...result].sort((a, b) =>
        b.displayName.localeCompare(a.displayName)
      );
    }

    return result;
  }, [packages, searchQuery, selectedCatalogId, selectedCategoryId, statusFilter, sortDirection, categories]);

  const paginatedPackages = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPackages.slice(start, start + pageSize);
  }, [filteredPackages, currentPage, pageSize]);

  const selectedPackages = useMemo(
    () => packages.filter((pkg) => selectedPackageIds.includes(pkg.id)),
    [packages, selectedPackageIds]
  );

  function handleRequestSingle(pkg: PackageWithStatus) {
    if (!selectedPackageIds.includes(pkg.id)) {
      togglePackageSelection(pkg.id);
    }
    setIsMultiRequestOpen(true);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{de.catalog.loadingPackages}</p>
      </div>
    );
  }

  if (error) {
    const classified = classifyGraphError(error);
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">{classified.userMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{de.catalog.title}</h1>
        <p className="text-muted-foreground">{de.catalog.description}</p>
      </div>

      <PackageFilters catalogs={catalogs} categories={categories} />

      {selectedPackageIds.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-3">
          <span className="text-sm font-medium">
            {selectedPackageIds.length} {de.packages.requestSelected}
          </span>
          <Button
            size="sm"
            onClick={() => setIsMultiRequestOpen(true)}
          >
            {de.packages.requestSelected}
          </Button>
        </div>
      )}

      <Separator />

      {paginatedPackages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 gap-2 text-center">
          <p className="font-medium">{de.catalog.noResults}</p>
          <p className="text-sm text-muted-foreground">{de.catalog.noResultsDescription}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedPackages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              isSelected={selectedPackageIds.includes(pkg.id)}
              onToggleSelect={togglePackageSelection}
              onRequest={handleRequestSingle}
            />
          ))}
        </div>
      )}

      <PaginationControls totalItems={filteredPackages.length} />

      <MultiRequestDialog
        isOpen={isMultiRequestOpen}
        onClose={() => setIsMultiRequestOpen(false)}
        selectedPackages={selectedPackages}
      />
    </div>
  );
}
