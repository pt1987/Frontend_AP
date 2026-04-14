import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/auth/AuthProvider";
import { AppShell } from "@/components/layout/AppShell";
import { LoginPage } from "@/features/login/LoginPage";
import { PackageCatalogPage } from "@/features/package-catalog/PackageCatalogPage";
import { MyAccessPage } from "@/features/my-access/MyAccessPage";
import { RequestHistoryPage } from "@/features/request-history/RequestHistoryPage";
import { AdminPage } from "@/features/admin/AdminPage";
import { AuthGuard } from "@/components/auth/AuthGuard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (failureCount >= 3) return false;
        // Do not retry on 403, 404, or 401 - these are not transient
        if (error instanceof Error && "statusCode" in error) {
          const statusCode = (error as { statusCode?: number }).statusCode;
          if (statusCode === 403 || statusCode === 404 || statusCode === 401) {
            return false;
          }
        }
        return true;
      },
      retryDelay: (attemptIndex) => Math.pow(2, attemptIndex) * 1000,
    },
  },
});

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <AuthGuard>
                  <AppShell />
                </AuthGuard>
              }
            >
              <Route index element={<Navigate to="/catalog" replace />} />
              <Route path="/catalog" element={<PackageCatalogPage />} />
              <Route path="/my-access" element={<MyAccessPage />} />
              <Route path="/request-history" element={<RequestHistoryPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/catalog" replace />} />
          </Routes>
        </QueryClientProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
