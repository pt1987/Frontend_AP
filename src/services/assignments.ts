import type { Client } from "@microsoft/microsoft-graph-client";
import type {
  AccessPackageAssignment,
  AccessPackageAssignmentRequest,
} from "@/types/api";
import { fetchAllPages } from "@/utils/graphPagination";
import { withRetry } from "@/utils/errorHandling";

const ENTITLEMENT_BASE = "identityGovernance/entitlementManagement";

// Fetches all active assignments for the currently authenticated user.
// Ref: https://learn.microsoft.com/en-us/graph/api/accesspackageassignment-filterbycurrentuser
export async function fetchCurrentUserAssignments(
  graphClient: Client
): Promise<AccessPackageAssignment[]> {
  return withRetry(() =>
    fetchAllPages<AccessPackageAssignment>(
      `${ENTITLEMENT_BASE}/assignments/filterByCurrentUser(on='target')`,
      graphClient
    )
  );
}

// Fetches the request history for the currently authenticated user.
// Ref: https://learn.microsoft.com/en-us/graph/api/accesspackageassignmentrequest-filterbycurrentuser
export async function fetchCurrentUserRequestHistory(
  graphClient: Client
): Promise<AccessPackageAssignmentRequest[]> {
  return withRetry(() =>
    fetchAllPages<AccessPackageAssignmentRequest>(
      `${ENTITLEMENT_BASE}/assignmentRequests/filterByCurrentUser(on='target')`,
      graphClient
    )
  );
}

interface CreateAssignmentRequestParams {
  targetId: string;
  accessPackageId: string;
  assignmentPolicyId: string;
}

// Submits a single access package assignment request.
// Ref: https://learn.microsoft.com/en-us/graph/api/entitlementmanagement-post-assignmentrequests
export async function createAssignmentRequest(
  graphClient: Client,
  params: CreateAssignmentRequestParams
): Promise<AccessPackageAssignmentRequest> {
  const { targetId, accessPackageId, assignmentPolicyId } = params;

  return withRetry(() =>
    graphClient.api(`${ENTITLEMENT_BASE}/assignmentRequests`).post({
      requestType: "userAdd",
      assignment: {
        targetId,
        assignmentPolicyId,
        accessPackage: {
          id: accessPackageId,
        },
      },
    })
  );
}
