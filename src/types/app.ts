// App-specific types that are not part of the Microsoft Graph types

export const UserRole = {
  Admin: "Admin",
  User: "User",
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

export const PackageStatusFilter = {
  All: "all",
  Requestable: "requestable",
  Assigned: "assigned",
  NotRequestable: "not-requestable",
} as const;

export type PackageStatusFilterType =
  (typeof PackageStatusFilter)[keyof typeof PackageStatusFilter];

export const SortDirection = {
  AscAlpha: "asc-alpha",
  DescAlpha: "desc-alpha",
  Custom: "custom",
} as const;

export type SortDirectionType = (typeof SortDirection)[keyof typeof SortDirection];

export interface Category {
  id: string;
  title: string;
  description: string;
  packageIds: string[];
  sortOrder: number;
}

export interface PackageWithStatus {
  id: string;
  displayName: string;
  description: string;
  catalogId: string;
  isAssigned: boolean;
  isPending: boolean;
  isRequestable: boolean;
  assignmentPolicyId: string | null;
}

export interface ActiveFilter {
  key: string;
  label: string;
  value: string;
}

export interface BatchRequestItem {
  id: string;
  packageId: string;
  policyId: string;
  targetId: string;
}

export interface BatchSubResponse {
  id: string;
  status: number;
  body?: unknown;
}
