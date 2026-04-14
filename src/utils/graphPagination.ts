import type { Client } from "@microsoft/microsoft-graph-client";

// Fetches all pages of a paginated Graph API response using @odata.nextLink.
// Never use manual $skip offset pagination; nextLink is the only supported
// pattern for Entitlement Management endpoints.
// Ref: https://learn.microsoft.com/en-us/graph/paging
export async function fetchAllPages<T>(
  initialUrl: string,
  graphClient: Client
): Promise<T[]> {
  const results: T[] = [];
  let nextLink: string | undefined = initialUrl;

  while (nextLink) {
    const response = (await graphClient.api(nextLink).get()) as {
      value: T[];
      "@odata.nextLink"?: string;
    };
    results.push(...response.value);
    nextLink = response["@odata.nextLink"];
  }

  return results;
}
