// Extended types built on top of @microsoft/microsoft-graph-types
// Ref: https://learn.microsoft.com/en-us/graph/api/resources/entitlementmanagement-overview

import type {
  AccessPackage,
  AccessPackageAssignment,
  AccessPackageAssignmentRequest,
  AccessPackageCatalog,
  AccessPackageAssignmentPolicy,
} from "@microsoft/microsoft-graph-types";

// Re-export Microsoft Graph types for convenience
export type {
  AccessPackage,
  AccessPackageAssignment,
  AccessPackageAssignmentRequest,
  AccessPackageCatalog,
  AccessPackageAssignmentPolicy,
};

// OData list response envelope
export interface ODataListResponse<T> {
  value: T[];
  "@odata.nextLink"?: string;
  "@odata.count"?: number;
}

// Graph Batch API types
// Ref: https://learn.microsoft.com/en-us/graph/json-batching
export interface BatchRequest {
  requests: BatchRequestEntry[];
}

export interface BatchRequestEntry {
  id: string;
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
}

export interface BatchResponse {
  responses: BatchResponseEntry[];
}

export interface BatchResponseEntry {
  id: string;
  status: number;
  headers?: Record<string, string>;
  body?: unknown;
}

// SharePoint list item for categories
export interface CategoryListItem {
  id: string;
  fields: {
    Title: string;
    Description?: string;
    PackageIds?: string;
    SortOrder?: number;
  };
}

export interface GraphErrorResponse {
  error: {
    code: string;
    message: string;
    innerError?: {
      "request-id": string;
      date: string;
    };
  };
}
