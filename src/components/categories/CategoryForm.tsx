import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { de } from "@/i18n/de";
import type { Category } from "@/types/app";
import type { AccessPackage } from "@/types/api";

interface CategoryFormData {
  title: string;
  description: string;
  packageIds: string[];
  sortOrder: number;
}

interface CategoryFormProps {
  initialData?: Category;
  availablePackages: AccessPackage[];
  onSubmit: (data: CategoryFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function CategoryForm({
  initialData,
  availablePackages,
  onSubmit,
  onCancel,
  isSubmitting,
}: CategoryFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [packageIds, setPackageIds] = useState<string[]>(initialData?.packageIds ?? []);
  const [sortOrder, setSortOrder] = useState(initialData?.sortOrder ?? 0);

  function handleTogglePackage(packageId: string) {
    setPackageIds((prev) =>
      prev.includes(packageId)
        ? prev.filter((id) => id !== packageId)
        : [...prev, packageId]
    );
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onSubmit({ title, description, packageIds, sortOrder });
  }

  const isEditing = initialData !== undefined;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>
          {isEditing ? de.admin.editCategory : de.admin.newCategory}
        </DialogTitle>
        <DialogDescription>
          {isEditing ? de.admin.editCategory : de.admin.newCategory}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="category-title">{de.admin.categoryName}</Label>
        <Input
          id="category-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={100}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category-description">{de.admin.categoryDescription}</Label>
        <Input
          id="category-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category-sort-order">{de.admin.sortOrder}</Label>
        <Input
          id="category-sort-order"
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
          min={0}
        />
      </div>

      <div className="space-y-2">
        <Label>{de.admin.categoryPackages}</Label>
        <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-3">
          {availablePackages.length === 0 ? (
            <p className="text-sm text-muted-foreground">{de.catalog.loadingPackages}</p>
          ) : (
            availablePackages.map((pkg) => (
              <div key={pkg.id} className="flex items-center gap-2">
                <Checkbox
                  id={`pkg-${pkg.id}`}
                  checked={packageIds.includes(pkg.id ?? "")}
                  onCheckedChange={() => handleTogglePackage(pkg.id ?? "")}
                />
                <label
                  htmlFor={`pkg-${pkg.id}`}
                  className="text-sm leading-none cursor-pointer"
                >
                  {pkg.displayName}
                </label>
              </div>
            ))
          )}
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          {de.admin.cancel}
        </Button>
        <Button type="submit" disabled={isSubmitting || !title.trim()}>
          {isSubmitting ? de.common.loading : de.admin.save}
        </Button>
      </DialogFooter>
    </form>
  );
}
