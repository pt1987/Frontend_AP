import type { Client } from "@microsoft/microsoft-graph-client";
import type {
  AccessPackage,
  AccessPackageCatalog,
  AccessPackageAssignmentPolicy,
} from "@/types/api";
import { fetchAllPages } from "@/utils/graphPagination";
import { withRetry } from "@/utils/errorHandling";

const ENTITLEMENT_BASE = "identityGovernance/entitlementManagement";

// Fetches all access packages the current user is allowed to request.
// Uses the filterByCurrentUser function which requires Delegated permissions.
// Ref: https://learn.microsoft.com/en-us/graph/api/accesspackage-filterbycurrentuser
export async function fetchRequestablePackages(
  graphClient: Client
): Promise<AccessPackage[]> {
  return withRetry(() =>
    fetchAllPages<AccessPackage>(
      `${ENTITLEMENT_BASE}/accessPackages/filterByCurrentUser(on='allowedRequestor')`,
      graphClient
    )
  );
}

// Fetches all access packages in the tenant (admin only).
// Ref: https://learn.microsoft.com/en-us/graph/api/entitlementmanagement-list-accesspackages
export async function fetchAllPackages(
  graphClient: Client
): Promise<AccessPackage[]> {
  return withRetry(() =>
    fetchAllPages<AccessPackage>(
      `${ENTITLEMENT_BASE}/accessPackages`,
      graphClient
    )
  );
}

// Fetches all available catalogs.
// Ref: https://learn.microsoft.com/en-us/graph/api/entitlementmanagement-list-catalogs
export async function fetchCatalogs(
  graphClient: Client
): Promise<AccessPackageCatalog[]> {
  return withRetry(() =>
    fetchAllPages<AccessPackageCatalog>(
      `${ENTITLEMENT_BASE}/catalogs`,
      graphClient
    )
  );
}

// Fetches all assignment policies to resolve policy IDs for requests.
// Ref: https://learn.microsoft.com/en-us/graph/api/entitlementmanagement-list-assignmentpolicies
export async function fetchAssignmentPolicies(
  graphClient: Client
): Promise<AccessPackageAssignmentPolicy[]> {
  return withRetry(() =>
    fetchAllPages<AccessPackageAssignmentPolicy>(
      `${ENTITLEMENT_BASE}/assignmentPolicies`,
      graphClient
    )
  );
}
