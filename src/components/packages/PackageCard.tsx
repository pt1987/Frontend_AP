import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { de } from "@/i18n/de";
import type { PackageWithStatus } from "@/types/app";

interface PackageCardProps {
  pkg: PackageWithStatus;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onRequest: (pkg: PackageWithStatus) => void;
}

export function PackageCard({
  pkg,
  isSelected,
  onToggleSelect,
  onRequest,
}: PackageCardProps) {
  function handleRequest() {
    onRequest(pkg);
  }

  function handleToggleSelect() {
    onToggleSelect(pkg.id);
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-1">
        <div className="flex items-start gap-3">
          {pkg.isRequestable && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={handleToggleSelect}
              aria-label={`${pkg.displayName} auswaehlen`}
              className="mt-1"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base">{pkg.displayName}</CardTitle>
              {pkg.isAssigned && (
                <Badge variant="success">{de.packages.alreadyAssigned}</Badge>
              )}
              {pkg.isPending && (
                <Badge variant="warning">{de.packages.pending}</Badge>
              )}
            </div>
            {pkg.description && (
              <CardDescription className="mt-1.5 line-clamp-2">
                {pkg.description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>

      <CardFooter className="pt-0">
        <Button
          size="sm"
          disabled={!pkg.isRequestable || !pkg.assignmentPolicyId}
          onClick={handleRequest}
          className="w-full"
        >
          {pkg.isAssigned
            ? de.packages.alreadyAssigned
            : pkg.isPending
            ? de.packages.pending
            : !pkg.assignmentPolicyId
            ? de.packages.noPolicyAvailable
            : de.packages.request}
        </Button>
      </CardFooter>
    </Card>
  );
}
