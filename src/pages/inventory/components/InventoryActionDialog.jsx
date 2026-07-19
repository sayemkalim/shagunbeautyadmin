import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { restockInventory } from "../helpers/restockInventory";
import { adjustInventory } from "../helpers/adjustInventory";
import { setInventoryQuantity } from "../helpers/setInventoryQuantity";
import { updateInventoryThreshold } from "../helpers/updateInventoryThreshold";
import { getApiErrorMessage, getApiData, isApiError } from "../helpers/apiResult";

const ACTION_CONFIG = {
  restock: {
    title: "Restock",
    description: "Add stock received from a supplier or return.",
    submitLabel: "Restock",
  },
  adjust: {
    title: "Adjust Quantity",
    description: "Apply a relative correction to the stock count. Use a negative number to reduce it.",
    submitLabel: "Apply Adjustment",
  },
  set: {
    title: "Set Quantity",
    description: "Set the absolute stock count, overriding the current value.",
    submitLabel: "Set Quantity",
  },
  threshold: {
    title: "Edit Low-Stock Threshold",
    description: "The record will show as Low Stock once quantity falls to or below this number.",
    submitLabel: "Save Threshold",
  },
};

const InventoryActionDialog = ({ open, onOpenChange, actionType, record, onSuccess }) => {
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState("");
  const [quantityChange, setQuantityChange] = useState("");
  const [threshold, setThreshold] = useState("");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");

  const config = actionType ? ACTION_CONFIG[actionType] : null;
  const sku = record?.sku;

  useEffect(() => {
    if (open) {
      setQuantity("");
      setQuantityChange("");
      setThreshold(record?.low_stock_threshold ?? "");
      setNote("");
      setFormError("");
    }
  }, [open, record]);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
    queryClient.invalidateQueries({ queryKey: ["inventory-stats"] });
    queryClient.invalidateQueries({ queryKey: ["inventory-detail", sku] });
    queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
  };

  const mutation = useMutation({
    mutationFn: () => {
      if (actionType === "restock") {
        return restockInventory({ sku, quantity: Number(quantity), note: note || undefined });
      }
      if (actionType === "adjust") {
        return adjustInventory({ sku, quantityChange: Number(quantityChange), note: note || undefined });
      }
      if (actionType === "set") {
        return setInventoryQuantity({ sku, quantity: Number(quantity), note: note || undefined });
      }
      return updateInventoryThreshold({ sku, low_stock_threshold: Number(threshold) });
    },
    onSuccess: (res) => {
      if (isApiError(res)) {
        const message = getApiErrorMessage(res, `Failed to ${config?.title.toLowerCase()}.`);
        setFormError(message);
        toast.error(message);
        return;
      }

      const data = getApiData(res);
      invalidateAll();

      if (actionType === "threshold") {
        toast.success(`Low-stock threshold updated to ${data?.low_stock_threshold}.`);
      } else if (data?.movement) {
        toast.success(
          `Stock updated: ${data.movement.quantity_before} → ${data.movement.quantity_after}.`
        );
      } else {
        toast.success("Quantity unchanged — already at that value.");
      }

      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      const message = getApiErrorMessage({ response: error?.response }, `Failed to ${config?.title.toLowerCase()}.`);
      setFormError(message);
      toast.error(message);
    },
  });

  if (!config) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");

    if (actionType === "restock" && (!quantity || Number(quantity) <= 0)) {
      setFormError("Quantity must be a positive number.");
      return;
    }
    if (actionType === "adjust" && (!quantityChange || Number(quantityChange) === 0)) {
      setFormError("Quantity change is required and cannot be zero.");
      return;
    }
    if (actionType === "set" && (quantity === "" || Number(quantity) < 0)) {
      setFormError("Quantity must be zero or a positive number.");
      return;
    }
    if (actionType === "threshold" && (threshold === "" || Number(threshold) < 0)) {
      setFormError("Threshold must be zero or a positive number.");
      return;
    }

    mutation.mutate();
  };

  const projectedQuantity =
    actionType === "adjust" && quantityChange !== "" && !Number.isNaN(Number(quantityChange))
      ? (record?.quantity_on_hand ?? 0) + Number(quantityChange)
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>
            {config.description}
            {sku && (
              <span className="text-foreground mt-1 block font-mono text-xs">{sku}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {(actionType === "restock" || actionType === "set") && (
            <div className="space-y-2">
              <Label htmlFor="inv-quantity">
                {actionType === "restock" ? "Quantity to add" : "New quantity on hand"}
              </Label>
              <Input
                id="inv-quantity"
                type="number"
                min={actionType === "restock" ? 1 : 0}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={actionType === "restock" ? "e.g. 50" : "e.g. 15"}
                autoFocus
              />
              {actionType === "restock" && (
                <p className="text-muted-foreground text-xs">
                  Current on hand: {record?.quantity_on_hand ?? 0}
                </p>
              )}
            </div>
          )}

          {actionType === "adjust" && (
            <div className="space-y-2">
              <Label htmlFor="inv-quantity-change">Quantity change</Label>
              <Input
                id="inv-quantity-change"
                type="number"
                value={quantityChange}
                onChange={(e) => setQuantityChange(e.target.value)}
                placeholder="e.g. -5"
                autoFocus
              />
              <p className="text-muted-foreground text-xs">
                Current on hand: {record?.quantity_on_hand ?? 0}
                {projectedQuantity !== null && (
                  <>
                    {" "}
                    &rarr; new total:{" "}
                    <span className={projectedQuantity < 0 ? "text-destructive font-medium" : "text-foreground font-medium"}>
                      {projectedQuantity}
                    </span>
                  </>
                )}
              </p>
            </div>
          )}

          {actionType === "threshold" && (
            <div className="space-y-2">
              <Label htmlFor="inv-threshold">Low-stock threshold</Label>
              <Input
                id="inv-threshold"
                type="number"
                min={0}
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder="e.g. 10"
                autoFocus
              />
            </div>
          )}

          {actionType !== "threshold" && (
            <div className="space-y-2">
              <Label htmlFor="inv-note">Note (optional)</Label>
              <Textarea
                id="inv-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add context for this change…"
                rows={2}
              />
            </div>
          )}

          {formError && (
            <p className="border-destructive/20 bg-destructive/5 text-destructive rounded-md border p-2.5 text-sm">
              {formError}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : config.submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryActionDialog;
