import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { de } from "@/i18n/de";
import { useUiStore } from "@/store/uiStore";
import { useGraphClient } from "@/hooks/useGraphClient";
import { useAuth } from "@/auth/useAuth";
import { batchCreateAssignmentRequests } from "@/services/batch";
import type { PackageWithStatus } from "@/types/app";
import type { BatchResultItem } from "@/services/batch";

interface MultiRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPackages: PackageWithStatus[];
}

export function MultiRequestDialog({
  isOpen,
  onClose,
  selectedPackages,
}: MultiRequestDialogProps) {
  const { account } = useAuth();
  const graphClient = useGraphClient();
  const queryClient = useQueryClient();
  const clearPackageSelection = useUiStore((s) => s.clearPackageSelection);
  const [batchResults, setBatchResults] = useState<BatchResultItem[] | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!account?.localAccountId) {
        throw new Error("No authenticated account");
      }

      const items = selectedPackages
        .filter((pkg) => pkg.isRequestable && pkg.assignmentPolicyId)
        .map((pkg) => ({
          id: pkg.id,
          packageId: pkg.id,
          policyId: pkg.assignmentPolicyId as string,
          targetId: account.localAccountId,
        }));

      return batchCreateAssignmentRequests(graphClient, items);
    },
    onSuccess: (results) => {
      setBatchResults(results);
      void queryClient.invalidateQueries({ queryKey: ["assignments"] });
      void queryClient.invalidateQueries({ queryKey: ["assignment-requests"] });
      clearPackageSelection();
    },
  });

  function handleConfirm() {
    mutation.mutate();
  }

  function handleClose() {
    setBatchResults(null);
    mutation.reset();
    onClose();
  }

  const failedResults = batchResults?.filter((r) => !r.success) ?? [];
  const successCount = (batchResults?.length ?? 0) - failedResults.length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{de.multiRequest.title}</DialogTitle>
          <DialogDescription>
            {batchResults
              ? failedResults.length > 0
                ? de.multiRequest.successPartial
                : de.multiRequest.successAll
              : `${selectedPackages.length} ${de.multiRequest.selectedPackages}`}
          </DialogDescription>
        </DialogHeader>

        {!batchResults && (
          <ul className="max-h-64 overflow-y-auto space-y-1">
            {selectedPackages.map((pkg) => (
              <li key={pkg.id} className="flex items-center gap-2 text-sm py-1 border-b last:border-0">
                <span className="flex-1 truncate">{pkg.displayName}</span>
                {!pkg.assignmentPolicyId && (
                  <span className="text-xs text-muted-foreground">
                    {de.packages.noPolicyAvailable}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}

        {batchResults && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {successCount} {de.multiRequest.selectedPackages}
            </p>
            {failedResults.length > 0 && (
              <ul className="space-y-1">
                {failedResults.map((result) => (
                  <li key={result.id} className="text-sm text-destructive">
                    {de.multiRequest.errorItem}: {result.packageId} – {result.error}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {mutation.error && (
          <p className="text-sm text-destructive">{de.errors.generic}</p>
        )}

        <DialogFooter>
          {batchResults ? (
            <Button onClick={handleClose}>{de.common.close}</Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={mutation.isPending}>
                {de.multiRequest.cancel}
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={mutation.isPending || selectedPackages.length === 0}
              >
                {mutation.isPending
                  ? de.multiRequest.submitting
                  : de.multiRequest.confirmRequest}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
