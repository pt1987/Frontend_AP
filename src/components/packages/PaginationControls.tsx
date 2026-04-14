import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { de } from "@/i18n/de";
import { useUiStore } from "@/store/uiStore";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

interface PaginationControlsProps {
  totalItems: number;
}

export function PaginationControls({ totalItems }: PaginationControlsProps) {
  const { currentPage, pageSize, setCurrentPage, setPageSize } = useUiStore();

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  function handlePreviousPage() {
    setCurrentPage(currentPage - 1);
  }

  function handleNextPage() {
    setCurrentPage(currentPage + 1);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          {totalItems} {de.catalog.totalItems}
        </span>
        <span className="mx-2 text-border">|</span>
        <span>{de.catalog.itemsPerPage}:</span>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => setPageSize(Number(value))}
        >
          <SelectTrigger className="h-8 w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {de.common.page} {currentPage} {de.common.of} {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={handlePreviousPage}
          disabled={!canGoPrevious}
          aria-label={de.common.previous}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleNextPage}
          disabled={!canGoNext}
          aria-label={de.common.next}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
