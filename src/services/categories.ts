import type { Client } from "@microsoft/microsoft-graph-client";
import type { Category } from "@/types/app";
import type { CategoryListItem } from "@/types/api";
import { withRetry } from "@/utils/errorHandling";

const siteId = import.meta.env.VITE_SHAREPOINT_SITE_ID as string;
const listId = import.meta.env.VITE_CATEGORY_LIST_ID as string;

const listBaseUrl = `sites/${siteId}/lists/${listId}`;

function mapListItemToCategory(item: CategoryListItem): Category {
  let packageIds: string[] = [];
  try {
    const raw = item.fields.PackageIds;
    if (raw) {
      packageIds = JSON.parse(raw) as string[];
    }
  } catch {
    packageIds = [];
  }

  return {
    id: item.id,
    title: item.fields.Title,
    description: item.fields.Description ?? "",
    packageIds,
    sortOrder: item.fields.SortOrder ?? 0,
  };
}

// Fetches all categories from the SharePoint list.
// Ref: https://learn.microsoft.com/en-us/graph/api/listitem-list
export async function fetchCategories(
  graphClient: Client
): Promise<Category[]> {
  return withRetry(async () => {
    const response = (await graphClient
      .api(`${listBaseUrl}/items`)
      .expand("fields($select=Title,Description,PackageIds,SortOrder)")
      .get()) as { value: CategoryListItem[] };

    const items = response.value;
    return items
      .map(mapListItemToCategory)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  });
}

interface CategoryWriteData {
  title: string;
  description: string;
  packageIds: string[];
  sortOrder: number;
}

// Creates a new category in the SharePoint list.
export async function createCategory(
  graphClient: Client,
  data: CategoryWriteData
): Promise<Category> {
  return withRetry(async () => {
    const response = (await graphClient
      .api(`${listBaseUrl}/items`)
      .post({
        fields: {
          Title: data.title,
          Description: data.description,
          PackageIds: JSON.stringify(data.packageIds),
          SortOrder: data.sortOrder,
        },
      })) as CategoryListItem;

    return mapListItemToCategory(response);
  });
}

// Updates an existing category in the SharePoint list.
export async function updateCategory(
  graphClient: Client,
  id: string,
  data: Partial<CategoryWriteData>
): Promise<void> {
  const fields: Record<string, unknown> = {};
  if (data.title !== undefined) fields["Title"] = data.title;
  if (data.description !== undefined) fields["Description"] = data.description;
  if (data.packageIds !== undefined) {
    fields["PackageIds"] = JSON.stringify(data.packageIds);
  }
  if (data.sortOrder !== undefined) fields["SortOrder"] = data.sortOrder;

  await withRetry(() =>
    graphClient.api(`${listBaseUrl}/items/${id}/fields`).patch(fields)
  );
}

// Deletes a category from the SharePoint list.
export async function deleteCategory(
  graphClient: Client,
  id: string
): Promise<void> {
  await withRetry(() =>
    graphClient.api(`${listBaseUrl}/items/${id}`).delete()
  );
}
