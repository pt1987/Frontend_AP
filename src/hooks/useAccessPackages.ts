import { useQuery } from "@tanstack/react-query";
import { useGraphClient } from "@/hooks/useGraphClient";
import { useAuth } from "@/auth/useAuth";
import {
  fetchRequestablePackages,
  fetchAllPackages,
  fetchCatalogs,
  fetchAssignmentPolicies,
} from "@/services/accessPackages";
import {
  fetchCurrentUserAssignments,
  fetchCurrentUserRequestHistory,
} from "@/services/assignments";
import type { AccessPackage, AccessPackageCatalog } from "@/types/api";
import type { PackageWithStatus } from "@/types/app";

export function useCatalogs() {
  const graphClient = useGraphClient();

  return useQuery<AccessPackageCatalog[]>({
    queryKey: ["catalogs"],
    queryFn: () => fetchCatalogs(graphClient),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRequestablePackages() {
  const graphClient = useGraphClient();

  return useQuery<AccessPackage[]>({
    queryKey: ["packages", "requestable"],
    queryFn: () => fetchRequestablePackages(graphClient),
    staleTime: 2 * 60 * 1000,
  });
}

export function useAllPackages(enabled: boolean) {
  const graphClient = useGraphClient();

  return useQuery<AccessPackage[]>({
    queryKey: ["packages", "all"],
    queryFn: () => fetchAllPackages(graphClient),
    enabled,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCurrentUserAssignments() {
  const graphClient = useGraphClient();

  return useQuery({
    queryKey: ["assignments", "current-user"],
    queryFn: () => fetchCurrentUserAssignments(graphClient),
    staleTime: 1 * 60 * 1000,
  });
}

export function useRequestHistory() {
  const graphClient = useGraphClient();

  return useQuery({
    queryKey: ["assignment-requests", "current-user"],
    queryFn: () => fetchCurrentUserRequestHistory(graphClient),
    staleTime: 1 * 60 * 1000,
  });
}

export function useAssignmentPolicies() {
  const graphClient = useGraphClient();

  return useQuery({
    queryKey: ["assignment-policies"],
    queryFn: () => fetchAssignmentPolicies(graphClient),
    staleTime: 10 * 60 * 1000,
  });
}

// Combines requestable packages with assignment and pending status.
export function usePackagesWithStatus(): {
  packages: PackageWithStatus[];
  isLoading: boolean;
  error: Error | null;
} {
  const { account } = useAuth();
  const packagesQuery = useRequestablePackages();
  const assignmentsQuery = useCurrentUserAssignments();
  const requestHistoryQuery = useRequestHistory();
  const policiesQuery = useAssignmentPolicies();

  const isLoading =
    packagesQuery.isLoading ||
    assignmentsQuery.isLoading ||
    requestHistoryQuery.isLoading ||
    policiesQuery.isLoading;

  const error =
    packagesQuery.error ??
    assignmentsQuery.error ??
    requestHistoryQuery.error ??
    policiesQuery.error;

  const packages: PackageWithStatus[] = (packagesQuery.data ?? []).map(
    (pkg) => {
      const assignedPackageIds = new Set(
        (assignmentsQuery.data ?? []).map((a) => a.accessPackage?.id)
      );

      const pendingPackageIds = new Set(
        (requestHistoryQuery.data ?? [])
          .filter((r) => r.state === "submitted" || r.state === "pendingApproval")
          .map((r) => r.assignment?.accessPackage?.id)
      );

      const matchingPolicy = (policiesQuery.data ?? []).find(
        (p) => p.accessPackage?.id === pkg.id
      );

      return {
        id: pkg.id ?? "",
        displayName: pkg.displayName ?? "",
        description: pkg.description ?? "",
        catalogId: pkg.catalog?.id ?? "",
        isAssigned: assignedPackageIds.has(pkg.id),
        isPending: pendingPackageIds.has(pkg.id),
        isRequestable: !assignedPackageIds.has(pkg.id) && !pendingPackageIds.has(pkg.id),
        assignmentPolicyId: matchingPolicy?.id ?? null,
      };
    }
  );

  return {
    packages,
    isLoading,
    error: error as Error | null,
  };

  void account;
}
