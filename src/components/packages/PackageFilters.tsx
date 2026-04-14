import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { de } from "@/i18n/de";
import { useUiStore } from "@/store/uiStore";
import { PackageStatusFilter } from "@/types/app";
import type { Category } from "@/types/app";
import type { AccessPackageCatalog } from "@/types/api";

interface PackageFiltersProps {
  catalogs: AccessPackageCatalog[];
  categories: Category[];
}

export function PackageFilters({ catalogs, categories }: PackageFiltersProps) {
  const {
    searchQuery,
    selectedCatalogId,
    selectedCategoryId,
    statusFilter,
    setSearchQuery,
    setSelectedCatalogId,
    setSelectedCategoryId,
    setStatusFilter,
    resetFilters,
  } = useUiStore();

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedCatalogId !== null ||
    selectedCategoryId !== null ||
    statusFilter !== PackageStatusFilter.All;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={de.catalog.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={selectedCatalogId ?? "all"}
          onValueChange={(value) =>
            setSelectedCatalogId(value === "all" ? null : value)
          }
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={de.catalog.filterByCatalog} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{de.status.all}</SelectItem>
            {catalogs.map((catalog) => (
              <SelectItem key={catalog.id} value={catalog.id ?? ""}>
                {catalog.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as typeof statusFilter)
          }
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={de.catalog.filterByStatus} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={PackageStatusFilter.All}>{de.status.all}</SelectItem>
            <SelectItem value={PackageStatusFilter.Requestable}>{de.status.requestable}</SelectItem>
            <SelectItem value={PackageStatusFilter.Assigned}>{de.status.assigned}</SelectItem>
            <SelectItem value={PackageStatusFilter.NotRequestable}>{de.status.notRequestable}</SelectItem>
          </SelectContent>
        </Select>

        {categories.length > 0 && (
          <Select
            value={selectedCategoryId ?? "all"}
            onValueChange={(value) =>
              setSelectedCategoryId(value === "all" ? null : value)
            }
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={de.catalog.filterByCategory} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{de.status.all}</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">
            {de.catalog.activeFilters}:
          </span>
          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              {searchQuery}
              <button
                onClick={() => setSearchQuery("")}
                className="ml-1 rounded-full hover:bg-muted"
                aria-label="Suchfilter entfernen"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-7 px-2 text-xs"
          >
            {de.catalog.clearFilters}
          </Button>
        </div>
      )}
    </div>
  );
}
