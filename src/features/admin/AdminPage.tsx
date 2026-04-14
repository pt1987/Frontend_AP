import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CategoryForm } from "@/components/categories/CategoryForm";
import { de } from "@/i18n/de";
import { useAuth } from "@/auth/useAuth";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/hooks/useCategories";
import { useAllPackages } from "@/hooks/useAccessPackages";
import { classifyGraphError } from "@/utils/errorHandling";
import type { Category } from "@/types/app";

export function AdminPage() {
  const { isAdmin } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();

  const categoriesQuery = useCategories();
  const packagesQuery = useAllPackages(isAdmin);
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">{de.errors.forbidden}</p>
      </div>
    );
  }

  function handleOpenCreate() {
    setEditingCategory(undefined);
    setIsDialogOpen(true);
  }

  function handleOpenEdit(category: Category) {
    setEditingCategory(category);
    setIsDialogOpen(true);
  }

  function handleDelete(id: string) {
    if (window.confirm(de.admin.confirmDelete)) {
      deleteMutation.mutate(id);
    }
  }

  function handleFormSubmit(data: {
    title: string;
    description: string;
    packageIds: string[];
    sortOrder: number;
  }) {
    if (editingCategory) {
      updateMutation.mutate(
        { id: editingCategory.id, data },
        { onSuccess: () => setIsDialogOpen(false) }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => setIsDialogOpen(false),
      });
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const categories = categoriesQuery.data ?? [];
  const availablePackages = packagesQuery.data ?? [];

  if (categoriesQuery.error) {
    const classified = classifyGraphError(categoriesQuery.error);
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">{classified.userMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{de.admin.title}</h1>
          <p className="text-muted-foreground">{de.admin.categories}</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {de.admin.newCategory}
        </Button>
      </div>

      {categories.length === 0 && !categoriesQuery.isLoading ? (
        <div className="flex flex-col items-center justify-center h-40 gap-2 text-center border rounded-lg">
          <p className="text-muted-foreground">{de.catalog.noResults}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base">{category.title}</CardTitle>
                    {category.description && (
                      <CardDescription className="mt-1">
                        {category.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(category)}
                      aria-label={de.admin.editCategory}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(category.id)}
                      disabled={deleteMutation.isPending}
                      aria-label={de.admin.deleteCategory}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">
                  {category.packageIds.length} {de.admin.categoryPackages}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <CategoryForm
            initialData={editingCategory}
            availablePackages={availablePackages}
            onSubmit={handleFormSubmit}
            onCancel={() => setIsDialogOpen(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
