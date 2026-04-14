import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { de } from "@/i18n/de";
import { useCurrentUserAssignments } from "@/hooks/useAccessPackages";
import { classifyGraphError } from "@/utils/errorHandling";

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return de.myAccess.permanent;
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
  }).format(new Date(dateString));
}

function getDeliveryStateLabel(state: string | undefined | null): string {
  switch (state) {
    case "delivered":
      return de.myAccess.delivered;
    case "delivering":
      return de.myAccess.delivering;
    case "partiallyDelivered":
      return de.myAccess.partiallyDelivered;
    case "notDelivered":
      return de.myAccess.notDelivered;
    default:
      return state ?? "";
  }
}

export function MyAccessPage() {
  const { data: assignments, isLoading, error } = useCurrentUserAssignments();

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

  const activeAssignments = (assignments ?? []).filter(
    (a) => a.state === "delivered" || a.state === "delivering" || a.state === "partiallyDelivered"
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{de.myAccess.title}</h1>
        <p className="text-muted-foreground">{de.myAccess.description}</p>
      </div>

      {activeAssignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 gap-2 text-center">
          <p className="font-medium">{de.myAccess.noAssignments}</p>
          <p className="text-sm text-muted-foreground">{de.myAccess.noAssignmentsDescription}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeAssignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">
                    {assignment.accessPackage?.displayName ?? ""}
                  </CardTitle>
                  <Badge variant="success">
                    {getDeliveryStateLabel(assignment.state)}
                  </Badge>
                </div>
                {assignment.accessPackage?.description && (
                  <CardDescription className="line-clamp-2">
                    {assignment.accessPackage.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>{de.myAccess.expiresOn}:</span>
                    <span>{formatDate(assignment.expiredDateTime)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
