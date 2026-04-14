import {
  useMsal,
  useIsAuthenticated,
  useAccount,
} from "@azure/msal-react";
import {
  InteractionRequiredAuthError,
  type AccountInfo,
} from "@azure/msal-browser";
import { graphScopes, loginRequest } from "@/auth/authConfig";

interface UseAuthResult {
  account: AccountInfo | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  acquireToken: () => Promise<string>;
}

export function useAuth(): UseAuthResult {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const account = useAccount(accounts[0] ?? null);

  // Admin role check via App Roles claim in the ID token.
  // The role value "Admin" must be defined in the Azure App Registration.
  const isAdmin = (account?.idTokenClaims?.roles as string[] ?? []).includes("Admin");

  async function login(): Promise<void> {
    await instance.loginPopup(loginRequest);
  }

  async function logout(): Promise<void> {
    await instance.logoutPopup();
  }

  // Always attempt silent acquisition first, fall back to interactive popup.
  // Ref: https://learn.microsoft.com/en-us/azure/active-directory/develop/msal-js-avoid-page-reloads
  async function acquireToken(): Promise<string> {
    if (!account) {
      throw new Error("No authenticated account found");
    }

    try {
      const result = await instance.acquireTokenSilent({
        scopes: graphScopes,
        account,
      });
      return result.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        const result = await instance.acquireTokenPopup({
          scopes: graphScopes,
        });
        return result.accessToken;
      }
      throw error;
    }
  }

  return {
    account,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    acquireToken,
  };
}
