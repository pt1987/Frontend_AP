import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { de } from "@/i18n/de";
import { useRequestHistory } from "@/hooks/useAccessPackages";
import { classifyGraphError } from "@/utils/errorHandling";
import type { BadgeProps } from "@/components/ui/badge";

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "-";
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
}

function getRequestStateLabel(state: string | undefined | null): string {
  switch (state) {
    case "submitted":
      return de.requestHistory.submitted;
    case "pendingApproval":
      return de.requestHistory.pendingApproval;
    case "approved":
      return de.requestHistory.approved;
    case "denied":
      return de.requestHistory.denied;
    case "cancelled":
      return de.requestHistory.cancelled;
    case "failed":
      return de.requestHistory.failed;
    default:
      return state ?? "";
  }
}

function getRequestStateBadgeVariant(
  state: string | undefined | null
): BadgeProps["variant"] {
  switch (state) {
    case "approved":
      return "success";
    case "denied":
    case "failed":
      return "destructive";
    case "pendingApproval":
    case "submitted":
      return "warning";
    default:
      return "secondary";
  }
}

export function RequestHistoryPage() {
  const { data: requests, isLoading, error } = useRequestHistory();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{de.common.loading}</p>
      </div>
    );
  }

  if (error) {
    const classified = classifyGraphError(error);
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">{classified.userMessage}</p>
      </div>
    );
  }

  const sortedRequests = [...(requests ?? [])].sort((a, b) => {
    const dateA = a.createdDateTime ? new Date(a.createdDateTime).getTime() : 0;
    const dateB = b.createdDateTime ? new Date(b.createdDateTime).getTime() : 0;
    return dateB - dateA;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{de.requestHistory.title}</h1>
        <p className="text-muted-foreground">{de.requestHistory.description}</p>
      </div>

      {sortedRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 gap-2 text-center">
          <p className="font-medium">{de.requestHistory.noHistory}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedRequests.map((request) => (
            <Card key={request.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">
                    {request.assignment?.accessPackage?.displayName ?? request.id}
                  </CardTitle>
                  <Badge variant={getRequestStateBadgeVariant(request.state)}>
                    {getRequestStateLabel(request.state)}
                  </Badge>
                </div>
                <CardDescription>
                  {de.requestHistory.requestType}: {request.requestType}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">{de.requestHistory.requestedOn}: </span>
                    {formatDate(request.createdDateTime)}
                  </div>
                  {request.completedDateTime && (
                    <div>
                      <span className="font-medium">{de.requestHistory.completedOn}: </span>
                      {formatDate(request.completedDateTime)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
