import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { syncInventory } from "../helpers/syncInventory";
import { getApiErrorMessage, getApiData, isApiError } from "../helpers/apiResult";

const SyncInventoryDialog = ({ open, onOpenChange }) => {
  const queryClient = useQueryClient();
  const [result, setResult] = useState(null);

  const mutation = useMutation({
    mutationFn: syncInventory,
    onSuccess: (res) => {
      if (isApiError(res)) {
        toast.error(getApiErrorMessage(res, "Failed to sync inventory from products."));
        return;
      }
      const data = getApiData(res);
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stats"] });
      toast.success(`Sync complete — ${data?.created ?? 0} record(s) created.`);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to sync inventory from products.");
    },
  });

  const handleClose = (nextOpen) => {
    if (!nextOpen) setResult(null);
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Sync from Products</DialogTitle>
          {!result && (
            <DialogDescription>
              Creates an inventory record (at 0 stock) for every existing product and variant that
              isn't tracked yet. Existing records are left untouched.
            </DialogDescription>
          )}
        </DialogHeader>

        {result ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-muted/50 rounded-lg border p-3">
                <div className="text-lg font-semibold">{result.total_products}</div>
                <div className="text-muted-foreground text-xs">Products</div>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-500/10">
                <div className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                  {result.created}
                </div>
                <div className="text-muted-foreground text-xs">Created</div>
              </div>
              <div className="bg-muted/50 rounded-lg border p-3">
                <div className="text-lg font-semibold">{result.skipped}</div>
                <div className="text-muted-foreground text-xs">Already Tracked</div>
              </div>
            </div>

            {result.conflicts?.length > 0 && (
              <div className="border-destructive/20 bg-destructive/5 space-y-2 rounded-lg border p-3">
                <div className="text-destructive flex items-center gap-2 text-sm font-medium">
                  <AlertTriangle className="size-4" />
                  {result.conflicts.length} conflict(s) need attention
                </div>
                <ul className="max-h-40 space-y-1.5 overflow-y-auto text-sm">
                  {result.conflicts.map((conflict, idx) => (
                    <li key={idx} className="border-b pb-1.5 last:border-0 last:pb-0">
                      <span className="font-mono text-xs">{conflict.sku}</span>
                      <p className="text-muted-foreground text-xs">{conflict.error}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}

        <DialogFooter>
          {result ? (
            <Button onClick={() => handleClose(false)} className="w-full">
              Done
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="size-4 animate-spin" />
                    Syncing...
                  </span>
                ) : (
                  "Run Sync"
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SyncInventoryDialog;
