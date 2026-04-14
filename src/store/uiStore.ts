import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  PackageStatusFilter,
  type PackageStatusFilterType,
  type SortDirectionType,
  SortDirection,
} from "@/types/app";

const PAGE_SIZE_STORAGE_KEY = "preferred-page-size";

interface UiState {
  // Pagination
  currentPage: number;
  pageSize: number;

  // Search and filters
  searchQuery: string;
  selectedCatalogId: string | null;
  selectedCategoryId: string | null;
  statusFilter: PackageStatusFilterType;
  sortDirection: SortDirectionType;

  // Multi-request cart
  selectedPackageIds: string[];

  // Sidebar collapsed state
  isSidebarCollapsed: boolean;

  // Actions
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCatalogId: (id: string | null) => void;
  setSelectedCategoryId: (id: string | null) => void;
  setStatusFilter: (filter: PackageStatusFilterType) => void;
  setSortDirection: (direction: SortDirectionType) => void;
  togglePackageSelection: (packageId: string) => void;
  clearPackageSelection: () => void;
  resetFilters: () => void;
  toggleSidebar: () => void;
}

const DEFAULT_PAGE_SIZE = 20;

function getStoredPageSize(): number {
  try {
    const stored = localStorage.getItem(PAGE_SIZE_STORAGE_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if ([10, 20, 50, 100].includes(parsed)) {
        return parsed;
      }
    }
  } catch {
    // localStorage may be unavailable in some environments
  }
  return DEFAULT_PAGE_SIZE;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      currentPage: 1,
      pageSize: getStoredPageSize(),
      searchQuery: "",
      selectedCatalogId: null,
      selectedCategoryId: null,
      statusFilter: PackageStatusFilter.All,
      sortDirection: SortDirection.AscAlpha,
      selectedPackageIds: [],
      isSidebarCollapsed: false,

      setCurrentPage: (page) => set({ currentPage: page }),

      setPageSize: (size) => {
        try {
          localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(size));
        } catch {
          // Ignore storage errors
        }
        set({ pageSize: size, currentPage: 1 });
      },

      setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1 }),

      setSelectedCatalogId: (id) =>
        set({ selectedCatalogId: id, currentPage: 1 }),

      setSelectedCategoryId: (id) =>
        set({ selectedCategoryId: id, currentPage: 1 }),

      setStatusFilter: (filter) =>
        set({ statusFilter: filter, currentPage: 1 }),

      setSortDirection: (direction) => set({ sortDirection: direction }),

      togglePackageSelection: (packageId) =>
        set((state) => ({
          selectedPackageIds: state.selectedPackageIds.includes(packageId)
            ? state.selectedPackageIds.filter((id) => id !== packageId)
            : [...state.selectedPackageIds, packageId],
        })),

      clearPackageSelection: () => set({ selectedPackageIds: [] }),

      resetFilters: () =>
        set({
          searchQuery: "",
          selectedCatalogId: null,
          selectedCategoryId: null,
          statusFilter: PackageStatusFilter.All,
          sortDirection: SortDirection.AscAlpha,
          currentPage: 1,
        }),

      toggleSidebar: () =>
        set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
    }),
    {
      name: "ui-store",
      partialize: (state) => ({
        pageSize: state.pageSize,
        isSidebarCollapsed: state.isSidebarCollapsed,
      }),
    }
  )
);
