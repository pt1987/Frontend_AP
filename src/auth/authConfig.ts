import type { Configuration, PopupRequest } from "@azure/msal-browser";

const clientId = import.meta.env.VITE_CLIENT_ID as string;
const tenantId = import.meta.env.VITE_TENANT_ID as string;
const redirectUri = import.meta.env.VITE_REDIRECT_URI as string;

// Tenant-specific authority is required so that the `roles` claim
// is present in the ID token. Generic authorities (common/organizations)
// omit app role claims.
export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri,
  },
  cache: {
    cacheLocation: "sessionStorage",
  },
};

// Scopes required for Entitlement Management and SharePoint categories
export const graphScopes: string[] = [
  "User.Read",
  "EntitlementManagement.ReadWrite.All",
  "Directory.Read.All",
  "Sites.ReadWrite.All",
];

export const loginRequest: PopupRequest = {
  scopes: graphScopes,
};
