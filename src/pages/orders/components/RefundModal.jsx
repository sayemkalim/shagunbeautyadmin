import { useState, useEffect, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  RotateCcw,
  CheckCircle2,
  Clock,
  XCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { updateRefundStatus } from "../helpers/updateRefundStatus";
import { cn } from "@/lib/utils";

const REFUND_STATUS_OPTIONS = [
  { value: "initiated", label: "Initiated (Refund in progress ⏳)" },
  { value: "processed", label: "Processed (Refund completed / credited ✅)" },
  { value: "failed", label: "Failed (Refund failed ❌)" },
];

const REFUND_MODES = [
  { value: "UPI", label: "UPI" },
  { value: "Bank Transfer", label: "Bank Transfer" },
  { value: "Razorpay", label: "Razorpay" },
  { value: "Cash", label: "Cash" },
];

const QUICK_REASONS = [
  "Customer return accepted",
  "Product returned & verified",
  "Customer cancelled before shipping",
  "Damaged item refund",
  "Out of stock item refund",
];

const RefundModal = ({ open, onOpenChange, order, onSuccess, initialStatus = "processed" }) => {
  const queryClient = useQueryClient();

  const isDecided = Boolean(
    order?.refundStatus === "processed" ||
    order?.refundStatus === "failed" ||
    order?.status === "refunded"
  );

  const availableStatusOptions = useMemo(() => {
    if (isDecided) {
      return REFUND_STATUS_OPTIONS.filter((opt) => opt.value !== "initiated");
    }
    return REFUND_STATUS_OPTIONS;
  }, [isDecided]);

  const [refundStatus, setRefundStatus] = useState("processed");
  const [amount, setAmount] = useState("");
  const [refundMode, setRefundMode] = useState("UPI");
  const [refundTo, setRefundTo] = useState("");
  const [refundTransactionId, setRefundTransactionId] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState({});

  const customerMobile =
    order?.address?.mobile ||
    order?.address?.phone ||
    order?.guestInfo?.mobile ||
    order?.user?.phone ||
    order?.user?.mobile ||
    "";
  const customerEmail =
    order?.address?.email ||
    order?.guestInfo?.email ||
    order?.user?.email ||
    "";

  useEffect(() => {
    if (open && order) {
      const defaultAmt = Number(order.refundAmount || order.finalTotalAmount || 0);
      setAmount(defaultAmt > 0 ? String(defaultAmt) : "");

      if (isDecided) {
        setRefundStatus(order.refundStatus === "failed" ? "failed" : "processed");
      } else {
        setRefundStatus(order.refundStatus || initialStatus || "processed");
      }

      // Format mode to standard UPI / Bank Transfer / Razorpay / Cash
      const existingMode = order.refundMode || order.refundMethod;
      if (existingMode) {
        const norm = String(existingMode).toLowerCase();
        if (norm.includes("upi")) setRefundMode("UPI");
        else if (norm.includes("bank")) setRefundMode("Bank Transfer");
        else if (norm.includes("razor")) setRefundMode("Razorpay");
        else if (norm.includes("cash")) setRefundMode("Cash");
        else setRefundMode("UPI");
      } else if (order.paymentMode === "razorpay") {
        setRefundMode("Razorpay");
      } else {
        setRefundMode("UPI");
      }

      setRefundTo(order.refundTo || customerMobile || customerEmail || "");
      setRefundTransactionId(order.refundTransactionId || order.utr_number || (order.paymentMode === "razorpay" ? order.paymentId || "" : ""));
      setReason(order.refundReason || order.reason || "Customer return accepted");
      setErrors({});
    }
  }, [open, order, isDecided, initialStatus, customerMobile, customerEmail]);

  const { mutate: updateRefundMutation, isLoading: isSubmitting } = useMutation({
    mutationFn: ({ orderId, payload }) => updateRefundStatus({ orderId, payload }),
    onSuccess: (res) => {
      if (res?.error || res?.response?.success === false) {
        toast.error(res?.response?.data?.message || res?.message || "Failed to update refund.");
        return;
      }
      toast.success(
        res?.response?.data?.message ||
          (refundStatus === "processed"
            ? "Refund processed successfully! ✅"
            : refundStatus === "failed"
            ? "Refund marked as Failed ❌"
            : "Refund initiated successfully! ⏳")
      );
      queryClient.invalidateQueries(["orders"]);
      queryClient.invalidateQueries(["order", order?._id]);
      if (onSuccess) onSuccess(res?.response?.data);
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update refund.");
    },
  });

  const validateForm = () => {
    const newErrors = {};
    const numericAmount = Number(amount);

    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      newErrors.amount = "Please enter a valid refund amount greater than 0.";
    } else if (order?.finalTotalAmount && numericAmount > Number(order.finalTotalAmount)) {
      newErrors.amount = `Amount cannot exceed order total of ₹${Number(order.finalTotalAmount).toFixed(2)}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRefundSubmit = (e) => {
    e?.preventDefault();
    if (isDecided && refundStatus === "initiated") {
      toast.error("A Processed or Failed refund cannot be reverted back to Initiated.");
      return;
    }
    if (!validateForm()) return;

    const payload = {
      refundStatus, // 'initiated', 'processed', or 'failed'
      refundAmount: Number(amount) || 0,
      refundMode, // 'UPI', 'Bank Transfer', 'Razorpay', 'Cash'
      refundTransactionId: refundTransactionId.trim() || undefined,
      refundTo: refundTo.trim() || undefined,
      refundReason: reason.trim() || undefined,
    };

    updateRefundMutation({
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
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto p-0 gap-0">
        {/* Header */}
        <DialogHeader className="p-5 pb-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                <RotateCcw className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">Manage Order Refund</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Order {orderNumberDisplay} • Total: ₹{Number(order.finalTotalAmount || 0).toFixed(2)}
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleRefundSubmit} className="p-5 space-y-4 text-xs">
          {/* 1. Refund Status Dropdown */}
          <div className="space-y-1.5">
            <Label htmlFor="refund-status-select" className="text-xs font-semibold text-foreground">
              1. Refund Status <span className="text-destructive">*</span>
            </Label>
            <Select value={refundStatus} onValueChange={setRefundStatus}>
              <SelectTrigger id="refund-status-select" className="h-9 text-xs">
                <SelectValue placeholder="Select Refund Status" />
              </SelectTrigger>
              <SelectContent>
                {availableStatusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 2. Refund Amount Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="refund-amount-input" className="text-xs font-semibold text-foreground">
                2. Refund Amount (₹) <span className="text-destructive">*</span>
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setAmount(String(Number(order.finalTotalAmount || 0)))}
                className="h-5 px-1.5 text-[11px] font-medium text-primary hover:bg-primary/10"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Full Order (₹{Number(order.finalTotalAmount || 0).toFixed(2)})
              </Button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                ₹
              </span>
              <Input
                id="refund-amount-input"
                type="number"
                step="0.01"
                min="0"
                max={order.finalTotalAmount || 1000000}
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errors.amount) setErrors((prev) => ({ ...prev, amount: undefined }));
                }}
                className={cn("pl-7 text-sm font-semibold h-9", errors.amount && "border-destructive ring-destructive/20")}
              />
            </div>
            {errors.amount && (
              <p className="text-[11px] text-destructive font-medium">{errors.amount}</p>
            )}
          </div>

          {/* 3. Refund Mode Dropdown */}
          <div className="space-y-1.5">
            <Label htmlFor="refund-mode-select" className="text-xs font-semibold text-foreground">
              3. Refund Mode <span className="text-destructive">*</span>
            </Label>
            <Select value={refundMode} onValueChange={setRefundMode}>
              <SelectTrigger id="refund-mode-select" className="h-9 text-xs">
                <SelectValue placeholder="Select Refund Mode" />
              </SelectTrigger>
              <SelectContent>
                {REFUND_MODES.map((mode) => (
                  <SelectItem key={mode.value} value={mode.value} className="text-xs">
                    {mode.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 4. Transaction ID / UTR No. */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="refund-utr-input" className="text-xs font-semibold text-foreground">
                4. Transaction ID / UTR No.
              </Label>
              <span className="text-[10px] text-muted-foreground">e.g. UTR123456789012</span>
            </div>
            <Input
              id="refund-utr-input"
              placeholder="e.g. 123456789012 / pay_..."
              value={refundTransactionId}
              onChange={(e) => setRefundTransactionId(e.target.value)}
              className="font-mono text-xs uppercase h-9"
            />
          </div>

          {/* 5. Refunded To */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="refund-to-input" className="text-xs font-semibold text-foreground">
                5. Refunded To
              </Label>
              <span className="text-[10px] text-muted-foreground">UPI ID / Phone / Bank Acc</span>
            </div>
            <Input
              id="refund-to-input"
              placeholder="e.g. customer@okhdfcbank, 9876543210"
              value={refundTo}
              onChange={(e) => setRefundTo(e.target.value)}
              className="text-xs h-9"
            />
            {(customerMobile || customerEmail) && (
              <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                <span className="text-[10px] text-muted-foreground">Quick insert:</span>
                {customerMobile && (
                  <button
                    type="button"
                    onClick={() => setRefundTo(customerMobile)}
                    className="text-[10px] font-mono bg-muted hover:bg-muted/80 px-1.5 py-0.5 rounded border text-foreground"
                  >
                    {customerMobile}
                  </button>
                )}
                {customerEmail && (
                  <button
                    type="button"
                    onClick={() => setRefundTo(customerEmail)}
                    className="text-[10px] bg-muted hover:bg-muted/80 px-1.5 py-0.5 rounded border text-foreground truncate max-w-[160px]"
                  >
                    {customerEmail}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 6. Reason / Note */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="refund-reason-input" className="text-xs font-semibold text-foreground">
                6. Reason / Note
              </Label>
              <span className="text-[10px] text-muted-foreground">Remarks</span>
            </div>
            <Textarea
              id="refund-reason-input"
              placeholder="e.g. Customer return accepted"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="text-xs min-h-[60px] resize-y"
            />
            <div className="flex items-center gap-1 flex-wrap pt-0.5">
              <span className="text-[10px] text-muted-foreground">Presets:</span>
              {QUICK_REASONS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setReason(preset)}
                  className="text-[10px] bg-muted/60 hover:bg-primary/10 hover:text-primary px-2 py-0.5 rounded border transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "gap-1.5 text-white font-semibold h-9 text-xs",
                refundStatus === "processed"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : refundStatus === "failed"
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-amber-600 hover:bg-amber-700"
              )}
            >
              <RotateCcw className={cn("h-3.5 w-3.5", isSubmitting && "animate-spin")} />
              {isSubmitting
                ? "Saving..."
                : refundStatus === "processed"
                ? `Confirm Refund (₹${Number(amount || 0).toFixed(2)}) ✅`
                : refundStatus === "failed"
                ? `Mark as Failed ❌`
                : `Initiate Refund (₹${Number(amount || 0).toFixed(2)}) ⏳`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RefundModal;
