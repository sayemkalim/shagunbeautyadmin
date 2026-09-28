import { useState, useEffect, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  RotateCcw,
  QrCode,
  CreditCard,
  Building2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { refundOrder } from "../helpers/refundOrder";
import { getRefundStatusBadgeClass, formatRefundStatus } from "../helpers/statusBadge";
import { cn } from "@/lib/utils";

const INITIAL_STATUS_OPTIONS = [
  {
    id: "initiated",
    label: "Initiate Refund ⏳",
    description: "Mark as pending / in-progress for transfer",
    icon: Clock,
    activeColor: "border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 ring-2 ring-amber-500/20",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    id: "processed",
    label: "Mark as Processed ✅",
    description: "Refund transferred & completed immediately",
    icon: CheckCircle2,
    activeColor: "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 ring-2 ring-emerald-500/20",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
];

const REFUND_MODES = [
  {
    id: "manual_upi",
    label: "Owner UPI / Manual",
    icon: QrCode,
    description: "Manual UPI transfer by admin",
  },
  {
    id: "razorpay",
    label: "Razorpay Auto",
    icon: CreditCard,
    description: "Automatic gateway refund",
  },
  {
    id: "bank_transfer",
    label: "Bank Transfer",
    icon: Building2,
    description: "Direct NEFT / IMPS transfer",
  },
];

const QUICK_REASONS = [
  "Return accepted by admin",
  "Customer requested return / damaged item",
  "Customer cancelled before shipping",
  "Product out of stock",
  "Incorrect item delivered",
];

const RefundModal = ({ open, onOpenChange, order, onSuccess }) => {
  const queryClient = useQueryClient();

  const isDecided = Boolean(
    order?.refundStatus === "processed" ||
    order?.refundStatus === "failed" ||
    order?.status === "refunded"
  );

  const maxRefundable = useMemo(() => {
    if (!order) return 0;
    return Number(order.finalTotalAmount || 0);
  }, [order]);

  const availableInitialOptions = useMemo(() => {
    if (isDecided) {
      return [
        {
          id: "processed",
          label: "Mark as Processed ✅",
          description: "Refund transferred & completed successfully",
          icon: CheckCircle2,
          activeColor: "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 ring-2 ring-emerald-500/20",
          iconColor: "text-emerald-600 dark:text-emerald-400",
        },
        {
          id: "failed",
          label: "Mark as Failed ❌",
          description: "Refund failed or was rejected",
          icon: AlertCircle,
          activeColor: "border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-300 ring-2 ring-rose-500/20",
          iconColor: "text-rose-600 dark:text-rose-400",
        },
      ];
    }
    return INITIAL_STATUS_OPTIONS;
  }, [isDecided]);

  const [refundStatus, setRefundStatus] = useState("initiated");
  const [amount, setAmount] = useState("");
  const [refundMode, setRefundMode] = useState("manual_upi");
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
  const razorpayPaymentId =
    order?.paymentId ||
    order?.razorpayPaymentId ||
    order?.razorpay_payment_id ||
    order?.transactionId ||
    "";

  useEffect(() => {
    if (open && order) {
      const defaultAmt = maxRefundable > 0 ? maxRefundable : Number(order.finalTotalAmount || 0);
      const initialMode = order.refundMode && order.refundMode !== "cash" ? order.refundMode : (order.paymentMode === "razorpay" ? "razorpay" : "manual_upi");

      setRefundMode(initialMode);
      setRefundStatus(
        isDecided
          ? "processed"
          : initialMode === "razorpay"
          ? "processed"
          : order.refundStatus || "initiated"
      );
      setAmount(String(defaultAmt));

      if (initialMode === "razorpay") {
        setRefundTransactionId(order.refundTransactionId || razorpayPaymentId || "");
        setRefundTo(order.refundTo || customerEmail || customerMobile || "Razorpay Auto Source");
      } else {
        setRefundTransactionId(order.refundTransactionId || order.utr_number || "");
        setRefundTo(order.refundTo || customerMobile || customerEmail || "");
      }

      setReason(order.refundReason || order.reason || "Return accepted, refund processed");
      setErrors({});
    }
  }, [open, order, maxRefundable, customerMobile, customerEmail, razorpayPaymentId, isDecided]);

  // Handle Mode Change dynamically
  const handleModeChange = (modeId) => {
    setRefundMode(modeId);
    setErrors((prev) => ({ ...prev, refundTransactionId: undefined, refundTo: undefined }));

    if (modeId === "razorpay") {
      if (!isDecided) setRefundStatus("processed");
      if (razorpayPaymentId && !refundTransactionId) {
        setRefundTransactionId(razorpayPaymentId);
      }
      if (!refundTo) {
        setRefundTo(customerEmail || customerMobile || "Razorpay Auto Source");
      }
    } else {
      if (!isDecided && refundStatus === "processed" && !order?.refundStatus) {
        setRefundStatus("initiated");
      }
      if (refundTransactionId === razorpayPaymentId) {
        setRefundTransactionId(order?.utr_number || "");
      }
      if (refundTo === "Razorpay Auto Source") {
        setRefundTo(customerMobile || customerEmail || "");
      }
    }
  };

  const { mutate: processRefundMutation, isLoading: isRefunding } = useMutation({
    mutationFn: ({ orderId, payload }) => refundOrder({ orderId, payload }),
    onSuccess: (res) => {
      if (res?.error || res?.response?.success === false) {
        toast.error(res?.response?.data?.message || res?.message || "Failed to initiate refund.");
        return;
      }
      toast.success(
        res?.response?.data?.message ||
          (refundStatus === "processed"
            ? "Refund processed successfully! ✅"
            : "Refund initiated successfully! ⏳")
      );
      queryClient.invalidateQueries(["orders"]);
      queryClient.invalidateQueries(["order", order?._id]);
      if (onSuccess) onSuccess(res?.response?.data);
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to process refund.");
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

    if (refundMode === "razorpay") {
      if (!refundTransactionId.trim()) {
        newErrors.refundTransactionId = "Razorpay Payment ID (pay_...) is required for Razorpay refund.";
      }
    } else {
      // Manual UPI or Bank Transfer
      if (!refundTo.trim()) {
        newErrors.refundTo = "Please specify customer destination (UPI ID, Phone, or Bank A/C).";
      }
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
    if (!validateForm()) {
      return;
    }

    const payload = {
      amount: Number(amount) || 0,
      refundMode,
      refundTo: refundTo.trim() || (refundMode === "razorpay" ? "Razorpay Gateway" : undefined),
      refundTransactionId: refundTransactionId.trim() || undefined,
      reason: reason.trim() || undefined,
      refundStatus: refundMode === "razorpay" ? "processed" : refundStatus,
    };

    processRefundMutation({
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
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto p-0 gap-0">
        {/* Header */}
        <DialogHeader className="p-5 pb-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                <RotateCcw className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">Initiate Order Refund</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Order {orderNumberDisplay} • Customer: {order.address?.name || order.user?.name || "Customer"}
                </DialogDescription>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-medium text-muted-foreground block">Order Total</span>
              <span className="text-sm font-bold text-foreground">
                ₹{Number(order.finalTotalAmount || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleRefundSubmit} className="p-5 space-y-4">
          {/* Order Info Strip */}
          <div className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/40 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5 text-primary" />
              <span>Payment Mode: <strong className="text-foreground uppercase">{order.paymentMode || "COD"}</strong></span>
            </div>
            {Boolean(order.refundStatus || order.refundAmount > 0) && (
              <Badge
                variant="outline"
                className={cn("text-[10px] px-2 py-0.5 font-medium border", getRefundStatusBadgeClass(order.refundStatus))}
              >
                {formatRefundStatus(order.refundStatus || "initiated")} (₹{Number(order.refundAmount || order.finalTotalAmount || 0).toFixed(2)})
              </Badge>
            )}
          </div>

          {/* FIELD 1: Refund Method / Mode (No Cash) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              1. Select Refund Mode <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {REFUND_MODES.map((mode) => {
                const Icon = mode.icon;
                const isSelected = refundMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => handleModeChange(mode.id)}
                    className={cn(
                      "flex flex-col items-start p-2.5 rounded-lg border text-left transition-all cursor-pointer",
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20 text-foreground font-semibold"
                        : "border-border hover:bg-muted/50 text-muted-foreground"
                    )}
                  >
                    <div className="flex items-center gap-1.5 w-full mb-0.5">
                      <Icon className={cn("h-4 w-4 shrink-0", isSelected ? "text-primary" : "text-muted-foreground")} />
                      <span className="text-xs truncate font-medium">{mode.label}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground line-clamp-1">{mode.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* FIELD 2: Status Selection (If Manual UPI / Bank Transfer) */}
          {refundMode !== "razorpay" ? (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                2. Refund Status / State <span className="text-destructive">*</span>
              </Label>
              <div className={cn("grid gap-2.5", isDecided ? "grid-cols-1" : "grid-cols-2")}>
                {availableInitialOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = refundStatus === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setRefundStatus(opt.id)}
                      className={cn(
                        "flex flex-col items-start p-3 rounded-lg border text-left transition-all cursor-pointer relative",
                        isSelected
                          ? opt.activeColor
                          : "border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <div className="flex items-center gap-1.5 font-medium text-xs text-foreground">
                          <Icon className={cn("h-4 w-4", isSelected ? opt.iconColor : "text-muted-foreground")} />
                          <span>{opt.label}</span>
                        </div>
                        {isSelected && (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]">
                            ✓
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground line-clamp-2">
                        {opt.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20 text-xs text-emerald-800 dark:text-emerald-300">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Razorpay Automatic Refund:</span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Refunds via Razorpay will be automatically credited to the customer's original payment method and marked as <strong>Refunded (Completed ✅)</strong>.
                </p>
              </div>
            </div>
          )}

          {/* FIELD 3: Refund Amount (₹) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="refund-amount" className="text-xs font-semibold text-foreground">
                3. Refund Amount (₹) <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAmount(String(Number(order.finalTotalAmount || 0)))}
                  className="h-5 px-1.5 text-[11px] font-medium text-primary hover:bg-primary/10"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Full (₹{Number(order.finalTotalAmount || 0).toFixed(2)})
                </Button>
                {order.finalTotalAmount && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setAmount(String((Number(order.finalTotalAmount || 0) / 2).toFixed(2)))
                    }
                    className="h-5 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    50%
                  </Button>
                )}
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                ₹
              </span>
              <Input
                id="refund-amount"
                type="number"
                step="0.01"
                min="0"
                max={order.finalTotalAmount || 1000000}
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errors.amount) {
                    setErrors((prev) => ({ ...prev, amount: undefined }));
                  }
                }}
                className={cn("pl-7 text-sm font-semibold h-9", errors.amount && "border-destructive ring-destructive/20")}
              />
            </div>
            {errors.amount && (
              <p className="text-[11px] text-destructive font-medium">{errors.amount}</p>
            )}
          </div>

          {/* DYNAMIC FIELD: Razorpay Payment ID vs Manual UPI / Bank Fields */}
          {refundMode === "razorpay" ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="razorpay-payment-id" className="text-xs font-semibold text-foreground">
                  4. Razorpay Payment / Transaction ID (`pay_...`) <span className="text-destructive">*</span>
                </Label>
                <span className="text-[10px] text-muted-foreground">Required for Auto Refund</span>
              </div>
              <Input
                id="razorpay-payment-id"
                placeholder="e.g. pay_L7k2q0s9P8Wq9Z"
                value={refundTransactionId}
                onChange={(e) => {
                  setRefundTransactionId(e.target.value);
                  if (errors.refundTransactionId) {
                    setErrors((prev) => ({ ...prev, refundTransactionId: undefined }));
                  }
                }}
                className={cn("font-mono text-xs h-9", errors.refundTransactionId && "border-destructive ring-destructive/20")}
              />
              {errors.refundTransactionId && (
                <p className="text-[11px] text-destructive font-medium">{errors.refundTransactionId}</p>
              )}
            </div>
          ) : (
            <>
              {/* FIELD 4: Refund Destination / "Kis Par Bheja" */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="refund-destination" className="text-xs font-semibold text-foreground">
                    4. Refund Destination ("Kis Par Bheja") <span className="text-destructive">*</span>
                  </Label>
                  <span className="text-[10px] text-muted-foreground">Customer UPI / Mobile / Bank</span>
                </div>
                <Input
                  id="refund-destination"
                  placeholder="e.g. user@okhdfcbank, 9876543210, or Bank A/C"
                  value={refundTo}
                  onChange={(e) => {
                    setRefundTo(e.target.value);
                    if (errors.refundTo) {
                      setErrors((prev) => ({ ...prev, refundTo: undefined }));
                    }
                  }}
                  className={cn("text-xs h-9", errors.refundTo && "border-destructive ring-destructive/20")}
                />
                {errors.refundTo && (
                  <p className="text-[11px] text-destructive font-medium">{errors.refundTo}</p>
                )}
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

              {/* FIELD 5: UTR / Transaction Reference */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="refund-utr" className="text-xs font-semibold text-foreground">
                    5. Transaction / UTR Number
                  </Label>
                  <span className="text-[10px] text-muted-foreground">Optional at initiation (e.g. UTR482910492812)</span>
                </div>
                <Input
                  id="refund-utr"
                  placeholder="e.g. UTR482910492812"
                  value={refundTransactionId}
                  onChange={(e) => setRefundTransactionId(e.target.value)}
                  className="font-mono text-xs uppercase h-9"
                />
              </div>
            </>
          )}

          {/* FIELD 6: Reason / Admin Note */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="refund-reason" className="text-xs font-semibold text-foreground">
                {refundMode === "razorpay" ? "5. Reason / Notes" : "6. Reason / Notes"}
              </Label>
              <span className="text-[10px] text-muted-foreground">Remarks</span>
            </div>
            <Textarea
              id="refund-reason"
              placeholder="e.g. Customer requested return / cancellation"
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
              disabled={isRefunding}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isRefunding}
              className={cn(
                "gap-1.5 text-white font-semibold h-9 text-xs",
                refundMode === "razorpay" || refundStatus === "processed"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-amber-600 hover:bg-amber-700"
              )}
            >
              <RotateCcw className={cn("h-3.5 w-3.5", isRefunding && "animate-spin")} />
              {isRefunding
                ? "Processing..."
                : refundMode === "razorpay" || refundStatus === "processed"
                ? `Confirm & Process Refund (₹${Number(amount || 0).toFixed(2)})`
                : `Initiate Refund (₹${Number(amount || 0).toFixed(2)}) ⏳`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RefundModal;
