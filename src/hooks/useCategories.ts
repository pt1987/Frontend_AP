import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useGraphClient } from "@/hooks/useGraphClient";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/services/categories";
import type { Category } from "@/types/app";

const QUERY_KEY = ["categories"];

export function useCategories() {
  const graphClient = useGraphClient();

  return useQuery<Category[]>({
    queryKey: QUERY_KEY,
    queryFn: () => fetchCategories(graphClient),
    staleTime: 5 * 60 * 1000,
  });
}

interface CategoryWriteData {
  title: string;
  description: string;
  packageIds: string[];
  sortOrder: number;
}

export function useCreateCategory() {
  const graphClient = useGraphClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CategoryWriteData) => createCategory(graphClient, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateCategory() {
  const graphClient = useGraphClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CategoryWriteData> }) =>
      updateCategory(graphClient, id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteCategory() {
  const graphClient = useGraphClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCategory(graphClient, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
