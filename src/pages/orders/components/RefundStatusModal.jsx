import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Clock, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { updateRefundStatus } from "../helpers/updateRefundStatus";
import { cn } from "@/lib/utils";

const RefundStatusModal = ({
  open,
  onOpenChange,
  order,
  targetStatus = "processed", // 'processed' or 'failed'
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [transactionId, setTransactionId] = useState("");
  const [failureReason, setFailureReason] = useState("");
  const [error, setError] = useState("");

  const isMarkingProcessed = targetStatus === "processed";

  useEffect(() => {
    if (open && order) {
      setTransactionId(order.refundTransactionId || order.utr_number || "");
      setFailureReason(order.refundReason || "");
      setError("");
    }
  }, [open, order, targetStatus]);

  const { mutate: updateStatusMutation, isLoading: isUpdating } = useMutation({
    mutationFn: ({ orderId, payload }) => updateRefundStatus({ orderId, payload }),
    onSuccess: (res) => {
      if (res?.error || res?.response?.success === false) {
        toast.error(res?.response?.data?.message || res?.message || "Failed to update refund status.");
        return;
      }
      toast.success(
        res?.response?.data?.message ||
          (isMarkingProcessed
            ? "Refund marked as Processed ✅ successfully!"
            : "Refund marked as Failed ❌.")
      );
      queryClient.invalidateQueries(["orders"]);
      queryClient.invalidateQueries(["order", order?._id]);
      if (onSuccess) onSuccess(res?.response?.data);
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update refund status.");
    },
  });

  const handleSubmit = (e) => {
    e?.preventDefault();
    setError("");

    if (!isMarkingProcessed && !failureReason.trim()) {
      setError("Please provide a reason why the refund failed or was rejected.");
      return;
    }

    const payload = isMarkingProcessed
      ? {
          refundStatus: "processed",
          refundTransactionId: transactionId.trim() || undefined,
        }
      : {
          refundStatus: "failed",
          refundReason: failureReason.trim(),
        };

    updateStatusMutation({
      orderId: order._id,
      payload,
    });
  };

  if (!order) return null;

  const orderNumberDisplay = order.orderNumber
    ? `#${order.orderNumber}`
    : `#${order._id?.slice(-6).toUpperCase()}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0">
        <DialogHeader className={cn("p-5 pb-4 border-b", isMarkingProcessed ? "bg-emerald-50/50 dark:bg-emerald-950/20" : "bg-rose-50/50 dark:bg-rose-950/20")}>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full text-white shrink-0",
                isMarkingProcessed ? "bg-emerald-600" : "bg-rose-600"
              )}
            >
              {isMarkingProcessed ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                {isMarkingProcessed ? "Mark Refund as Processed ✅" : "Mark Refund as Failed ❌"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Order {orderNumberDisplay} • Amount: ₹{Number(order.refundAmount || order.finalTotalAmount || 0).toFixed(2)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {isMarkingProcessed ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Confirm that the refund amount of{" "}
                <strong className="text-foreground font-semibold">
                  ₹{Number(order.refundAmount || order.finalTotalAmount || 0).toFixed(2)}
                </strong>{" "}
                has been transferred to <strong className="text-foreground font-semibold">{order.refundTo || "the customer"}</strong>.
              </p>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="update-utr" className="text-xs font-semibold">
                    Transaction ID / UTR Number
                  </Label>
                  <span className="text-[10px] text-muted-foreground">Optional / Reference</span>
                </div>
                <Input
                  id="update-utr"
                  placeholder="e.g. UTR123456789"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="font-mono text-xs uppercase h-9"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Marking this refund as failed will log the failure reason in the order history.
              </p>

              <div className="space-y-1.5">
                <Label htmlFor="failure-reason" className="text-xs font-semibold">
                  Failure Reason / Remarks <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="failure-reason"
                  placeholder="e.g. Customer bank account invalid / UPI ID inactive / Customer declined"
                  value={failureReason}
                  onChange={(e) => {
                    setFailureReason(e.target.value);
                    if (error) setError("");
                  }}
                  className={cn("text-xs min-h-[80px]", error && "border-destructive")}
                />
                {error && <p className="text-[11px] text-destructive font-medium">{error}</p>}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUpdating}
              className={cn(
                "gap-1.5 text-white font-semibold h-9 text-xs",
                isMarkingProcessed
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-rose-600 hover:bg-rose-700"
              )}
            >
              <RotateCcw className={cn("h-3.5 w-3.5", isUpdating && "animate-spin")} />
              {isUpdating
                ? "Updating..."
                : isMarkingProcessed
                ? "Confirm & Mark Processed"
                : "Confirm Mark as Failed"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RefundStatusModal;
