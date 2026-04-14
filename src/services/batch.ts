import type { Client } from "@microsoft/microsoft-graph-client";
import type { BatchRequestEntry, BatchResponseEntry } from "@/types/api";

// The Graph Batch API allows up to 20 requests per batch call.
// Ref: https://learn.microsoft.com/en-us/graph/json-batching
const MAX_BATCH_SIZE = 20;

interface AssignmentBatchItem {
  id: string;
  packageId: string;
  policyId: string;
  targetId: string;
}

export interface BatchResultItem {
  id: string;
  packageId: string;
  success: boolean;
  statusCode: number;
  error?: string;
}

// Splits an array into chunks of at most `size` elements.
function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Builds a single batch request entry for an assignment request.
function buildAssignmentBatchEntry(
  item: AssignmentBatchItem
): BatchRequestEntry {
  return {
    id: item.id,
    method: "POST",
    url: "/identityGovernance/entitlementManagement/assignmentRequests",
    headers: { "Content-Type": "application/json" },
    body: {
      requestType: "userAdd",
      assignment: {
        targetId: item.targetId,
        assignmentPolicyId: item.policyId,
        accessPackage: { id: item.packageId },
      },
    },
  };
}

// Sends multiple assignment requests using the Graph Batch API.
// Batches exceeding the 20-request limit are sent as sequential batch calls.
// Each sub-response status must be checked individually because the outer
// batch response is always HTTP 200.
// Ref: https://learn.microsoft.com/en-us/graph/json-batching#response-body
export async function batchCreateAssignmentRequests(
  graphClient: Client,
  items: AssignmentBatchItem[]
): Promise<BatchResultItem[]> {
  const results: BatchResultItem[] = [];
  const batches = chunk(items, MAX_BATCH_SIZE);

  for (const batch of batches) {
    const batchRequests = batch.map(buildAssignmentBatchEntry);

    const response = (await graphClient.api("/$batch").post({
      requests: batchRequests,
    })) as { responses: BatchResponseEntry[] };

    for (const subResponse of response.responses) {
      const originalItem = batch.find((item) => item.id === subResponse.id);

      results.push({
        id: subResponse.id,
        packageId: originalItem?.packageId ?? subResponse.id,
        success: subResponse.status >= 200 && subResponse.status < 300,
        statusCode: subResponse.status,
        error:
          subResponse.status >= 400
            ? extractBatchErrorMessage(subResponse.body)
            : undefined,
      });
    }
  }

  return results;
}

function extractBatchErrorMessage(body: unknown): string {
  if (
    typeof body === "object" &&
    body !== null &&
    "error" in body
  ) {
    const error = (body as { error?: { message?: string } }).error;
    return error?.message ?? "Unknown error";
  }
  return "Unknown error";
}
