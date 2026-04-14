import { Client, type AuthenticationProvider } from "@microsoft/microsoft-graph-client";

// Creates a Graph client that uses the provided token acquisition function.
// The client should be re-created when the authenticated account changes.
// Ref: https://github.com/microsoftgraph/msgraph-sdk-javascript
export function createGraphClient(
  acquireToken: () => Promise<string>
): Client {
  const authProvider: AuthenticationProvider = {
    getAccessToken: acquireToken,
  };

  return Client.initWithMiddleware({ authProvider });
}
