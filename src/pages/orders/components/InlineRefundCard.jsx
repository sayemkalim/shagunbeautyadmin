import { useState, useEffect, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  RotateCcw,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  Edit,
  Save,
  QrCode,
  CreditCard,
  Building2,
  Sparkles,
  Info,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { refundOrder } from "../helpers/refundOrder";
import { updateRefundStatus } from "../helpers/updateRefundStatus";
import {
  formatRefundMode,
  formatRefundStatus,
  getRefundStatusBadgeClass,
} from "../helpers/statusBadge";
import { cn } from "@/lib/utils";

const REFUND_STATUS_OPTIONS = [
  {
    id: "initiated",
    label: "Initiate Refund ⏳",
    shortLabel: "Initiated ⏳",
    description: "Mark as in-progress / awaiting transfer",
    icon: Clock,
    activeColor: "border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 ring-2 ring-amber-500/20",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    id: "processed",
    label: "Mark Processed ✅",
    shortLabel: "Processed ✅",
    description: "Refund transferred & completed successfully",
    icon: CheckCircle2,
    activeColor: "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 ring-2 ring-emerald-500/20",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "failed",
    label: "Mark Failed ❌",
    shortLabel: "Failed ❌",
    description: "Refund failed or was rejected",
    icon: XCircle,
    activeColor: "border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-300 ring-2 ring-rose-500/20",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
];

const REFUND_MODES = [
  { id: "manual_upi", label: "Owner UPI / Manual", icon: QrCode, description: "Manual UPI transfer by admin" },
  { id: "razorpay", label: "Razorpay Auto", icon: CreditCard, description: "Automatic gateway refund" },
  { id: "bank_transfer", label: "Bank Transfer", icon: Building2, description: "Direct NEFT / IMPS transfer" },
];

const QUICK_REASONS = [
  "Return accepted by admin",
  "Customer requested return / damaged item",
  "Customer cancelled before shipping",
  "Product out of stock",
  "Incorrect item delivered",
];

const InlineRefundCard = ({ order, onUpdated }) => {
  const queryClient = useQueryClient();

  const hasExistingRefund = Boolean(
    order?.refundStatus ||
    (order?.refundAmount && Number(order.refundAmount) > 0) ||
    order?.status === "refunded"
  );

  // Once an order refund has been processed or failed, it cannot go back to initiated
  const isDecided = Boolean(
    order?.refundStatus === "processed" ||
    order?.refundStatus === "failed" ||
    order?.status === "refunded"
  );

  const availableStatusOptions = useMemo(() => {
    if (isDecided) {
      return REFUND_STATUS_OPTIONS.filter((opt) => opt.id !== "initiated");
    }
    return REFUND_STATUS_OPTIONS;
  }, [isDecided]);

  const [isEditing, setIsEditing] = useState(!hasExistingRefund);
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

  // Sync state whenever order data changes
  useEffect(() => {
    if (order) {
      const initialMode = order.refundMode && order.refundMode !== "cash" ? order.refundMode : (order.paymentMode === "razorpay" ? "razorpay" : "manual_upi");
      setRefundMode(initialMode);

      if (order.refundStatus === "processed" || order.status === "refunded" || initialMode === "razorpay") {
        setRefundStatus("processed");
      } else if (order.refundStatus === "failed") {
        setRefundStatus("failed");
      } else {
        setRefundStatus(order.refundStatus || "initiated");
      }

      setAmount(String(Number(order.refundAmount || order.finalTotalAmount || 0)));

      if (initialMode === "razorpay") {
        setRefundTransactionId(order.refundTransactionId || razorpayPaymentId || "");
        setRefundTo(order.refundTo || customerEmail || customerMobile || "Razorpay Auto Source");
      } else {
        setRefundTransactionId(order.refundTransactionId || order.utr_number || "");
        setRefundTo(order.refundTo || customerMobile || customerEmail || "");
      }

      setReason(order.refundReason || order.reason || "Return accepted by admin");
      if (hasExistingRefund) {
        setIsEditing(false);
      }
    }
  }, [order, customerMobile, customerEmail, razorpayPaymentId, hasExistingRefund]);

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

  // Full refund save mutation
  const { mutate: saveRefundMutation, isLoading: isSaving } = useMutation({
    mutationFn: (payload) => refundOrder({ orderId: order._id, payload }),
    onSuccess: (res) => {
      if (res?.error || res?.response?.success === false) {
        toast.error(res?.response?.data?.message || res?.message || "Failed to save refund.");
        return;
      }
      toast.success(res?.response?.data?.message || `Refund saved (${refundStatus.toUpperCase()}) successfully!`);
      queryClient.invalidateQueries(["orders"]);
      queryClient.invalidateQueries(["order", order._id]);
      if (onUpdated) onUpdated();
      setIsEditing(false);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to save refund.");
    },
  });

  // Quick 1-click status update mutation
  const { mutate: quickStatusMutation, isLoading: isUpdatingStatus } = useMutation({
    mutationFn: (payload) => updateRefundStatus({ orderId: order._id, payload }),
    onSuccess: (res, variables) => {
      if (res?.error || res?.response?.success === false) {
        toast.error(res?.response?.data?.message || res?.message || "Failed to update refund status.");
        return;
      }
      toast.success(
        res?.response?.data?.message ||
          (variables.refundStatus === "processed"
            ? "Refund marked as Processed ✅!"
            : "Refund marked as Failed ❌!")
      );
      queryClient.invalidateQueries(["orders"]);
      queryClient.invalidateQueries(["order", order._id]);
      if (onUpdated) onUpdated();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update refund status.");
    },
  });

  const validateForm = () => {
    const newErrors = {};
    const numericAmount = Number(amount);

    if (refundStatus !== "failed") {
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
        if (!refundTo.trim()) {
          newErrors.refundTo = "Please specify customer destination (UPI ID / Phone / Bank).";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveRefund = (e) => {
    e?.preventDefault();
    if (isDecided && refundStatus === "initiated") {
      toast.error("A Processed or Failed refund cannot be reverted back to Initiated.");
      return;
    }
    if (!validateForm()) return;

    const payload = {
      amount: Number(amount) || 0,
      refundMode,
      refundTo: refundTo.trim() || (refundMode === "razorpay" ? "Razorpay Gateway" : undefined),
      refundTransactionId: refundTransactionId.trim() || undefined,
      reason: reason.trim() || undefined,
      refundStatus: refundMode === "razorpay" ? "processed" : refundStatus,
    };

    saveRefundMutation(payload);
  };

  if (!order) return null;

  return (
    <Card className="border-rose-200 dark:border-rose-900/60 bg-gradient-to-r from-rose-50/20 via-background to-rose-50/10 dark:from-rose-950/20 dark:via-background dark:to-rose-950/10 shadow-xs overflow-hidden">
      {/* Header with status badge & quick action buttons */}
      <CardHeader className="pb-3 border-b border-rose-100 dark:border-rose-900/40 bg-rose-100/30 dark:bg-rose-950/30">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-600 text-white shadow-xs">
              <RotateCcw className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-rose-950 dark:text-rose-200">
                Order Refund Management
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                Manage refund lifecycle directly on this page (No modals required)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={cn(
                "font-semibold text-xs px-2.5 py-0.5 border",
                getRefundStatusBadgeClass(order.refundStatus || (hasExistingRefund ? "processed" : "initiated"))
              )}
            >
              {formatRefundStatus(order.refundStatus || (hasExistingRefund ? "processed" : "initiated"))}
            </Badge>

            {/* Quick 1-click status transitions if initiated */}
            {!isEditing && (order.refundStatus === "initiated" || order.refundStatus === "pending") && (
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  disabled={isUpdatingStatus}
                  onClick={() => quickStatusMutation({ refundStatus: "processed", refundTransactionId: order.refundTransactionId })}
                  className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white gap-1 font-semibold shadow-xs"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Mark Processed ✅
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isUpdatingStatus}
                  onClick={() => quickStatusMutation({ refundStatus: "failed", refundReason: order.refundReason || "Refund rejected by admin" })}
                  className="h-7 text-xs px-2 border-rose-300 text-rose-700 hover:bg-rose-100/80 dark:border-rose-800 dark:text-rose-300 gap-1 font-medium"
                >
                  <XCircle className="h-3 w-3" />
                  Mark Failed ❌
                </Button>
              </div>
            )}

            {/* Edit / View Toggle */}
            <Button
              variant={isEditing ? "secondary" : "outline"}
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="h-7 text-xs px-2.5 gap-1 border-rose-200"
            >
              <Edit className="h-3 w-3" />
              {isEditing ? "Close Form" : hasExistingRefund ? "Edit Refund" : "Initiate Refund"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 text-xs">
        {/* VIEW MODE (One row per field) */}
        {!isEditing && hasExistingRefund ? (
          <div className="divide-y">
            {/* Row 1: Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 px-5 gap-1 hover:bg-muted/20 transition-colors">
              <span className="text-muted-foreground font-medium sm:w-1/3">1. Refund Status / State:</span>
              <div className="flex items-center gap-2 sm:w-2/3">
                <Badge
                  variant="outline"
                  className={cn(
                    "font-semibold text-xs px-2.5 py-0.5 border",
                    getRefundStatusBadgeClass(order.refundStatus)
                  )}
                >
                  {formatRefundStatus(order.refundStatus || "initiated")}
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                  {(order.refundStatus === "initiated" || order.refundStatus === "pending")
                    ? "⏳ In Progress - Refund initiated, pending transfer"
                    : order.refundStatus === "failed"
                    ? "❌ Failed - Refund could not be completed"
                    : "✅ Processed - Refund completed & transferred"}
                </span>
              </div>
            </div>

            {/* Row 2: Amount */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 px-5 gap-1 hover:bg-muted/20 transition-colors">
              <span className="text-muted-foreground font-medium sm:w-1/3">2. Refund Amount:</span>
              <div className="flex items-center gap-2 sm:w-2/3">
                <span className="text-base font-bold text-rose-600 dark:text-rose-400 font-mono">
                  ₹{Number(order.refundAmount || order.finalTotalAmount || 0).toFixed(2)}
                </span>
                <Badge variant="secondary" className="text-[10px] px-2 py-0">
                  {Number(order.refundAmount || 0) < Number(order.finalTotalAmount || 0) && Number(order.refundAmount || 0) > 0
                    ? "Partial Refund"
                    : "Full Order Amount"}
                </Badge>
              </div>
            </div>

            {/* Row 3: Mode */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 px-5 gap-1 hover:bg-muted/20 transition-colors">
              <span className="text-muted-foreground font-medium sm:w-1/3">3. Refund Mode:</span>
              <div className="flex items-center gap-2 sm:w-2/3">
                <Badge variant="secondary" className="font-semibold text-xs">
                  {formatRefundMode(order.refundMode || order.refundMethod)}
                </Badge>
                <span className="text-xs font-mono text-muted-foreground uppercase">
                  ({order.refundMode || "manual_upi"})
                </span>
              </div>
            </div>

            {/* Row 4: UTR / Reference */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 px-5 gap-1 hover:bg-muted/20 transition-colors">
              <span className="text-muted-foreground font-medium sm:w-1/3">4. {order.refundMode === "razorpay" ? "Razorpay Payment ID:" : "Transaction / UTR Number:"}</span>
              <div className="flex items-center gap-2 sm:w-2/3">
                <span className="font-mono font-semibold text-xs text-foreground bg-muted/60 px-2 py-1 rounded border select-all">
                  {order.refundTransactionId || order.utr_number || "Not provided"}
                </span>
                {(order.refundTransactionId || order.utr_number) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                    onClick={() => {
                      navigator.clipboard.writeText(order.refundTransactionId || order.utr_number);
                      toast.success("Transaction / UTR ID copied!");
                    }}
                  >
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Row 5: Destination */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 px-5 gap-1 hover:bg-muted/20 transition-colors">
              <span className="text-muted-foreground font-medium sm:w-1/3">5. Refund Destination (Kispar bheja):</span>
              <div className="flex items-center gap-2 sm:w-2/3">
                <span className="font-medium text-xs text-foreground bg-muted/60 px-2 py-1 rounded border select-all">
                  {order.refundTo || (order.refundMode === "razorpay" ? "Razorpay Auto Gateway" : order.address?.mobile || "Customer Account")}
                </span>
                {order.refundTo && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                    onClick={() => {
                      navigator.clipboard.writeText(order.refundTo);
                      toast.success("Destination copied!");
                    }}
                  >
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Row 6: Reason */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 px-5 gap-1 hover:bg-muted/20 transition-colors">
              <span className="text-muted-foreground font-medium sm:w-1/3">6. Reason / Remarks:</span>
              <div className="sm:w-2/3">
                <p className="text-xs text-foreground font-medium">
                  {order.refundReason || order.reason || "Return accepted by admin"}
                </p>
              </div>
            </div>

            {/* Row 7: Initiated Timestamp */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 px-5 gap-1 hover:bg-muted/20 transition-colors">
              <span className="text-muted-foreground font-medium sm:w-1/3">7. Initiated Date:</span>
              <div className="sm:w-2/3">
                <span className="text-xs font-medium text-foreground">
                  {order.refundInitiatedAt
                    ? format(new Date(order.refundInitiatedAt), "dd MMMM yyyy, hh:mm:ss a")
                    : order.createdAt
                    ? format(new Date(order.createdAt), "dd MMMM yyyy, hh:mm:ss a")
                    : "N/A"}
                </span>
              </div>
            </div>

            {/* Row 8: Completed Timestamp */}
            {(order.refundStatus === "processed" || order.refundedAt) && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 px-5 gap-1 hover:bg-muted/20 transition-colors">
                <span className="text-muted-foreground font-medium sm:w-1/3">8. Completed Date:</span>
                <div className="sm:w-2/3">
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    {order.refundedAt
                      ? format(new Date(order.refundedAt), "dd MMMM yyyy, hh:mm:ss a")
                      : order.updatedAt
                      ? format(new Date(order.updatedAt), "dd MMMM yyyy, hh:mm:ss a")
                      : "Completed"}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* EDIT / INITIATE FORM (Inline fields, One line per field) */
          <form onSubmit={handleSaveRefund} className="p-5 space-y-4">
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

            {/* FIELD 2: Status / State Selector (If Manual UPI or Bank Transfer) */}
            {refundMode !== "razorpay" ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground">
                    2. Refund Status / State <span className="text-destructive">*</span>
                  </Label>
                  <span className="text-[10px] text-muted-foreground">Select current state</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {availableStatusOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = refundStatus === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setRefundStatus(opt.id)}
                        className={cn(
                          "flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all cursor-pointer",
                          isSelected
                            ? opt.activeColor
                            : "border-border hover:bg-muted/50 text-muted-foreground"
                        )}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0", isSelected ? opt.iconColor : "text-muted-foreground")} />
                        <div className="min-w-0">
                          <span className="font-semibold text-xs block truncate">{opt.shortLabel}</span>
                          <span className="text-[10px] text-muted-foreground block truncate">{opt.description}</span>
                        </div>
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
                    Razorpay refunds are processed directly via gateway, marking the refund as <strong>Processed (Completed ✅)</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* FIELD 3: Refund Amount (₹) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="inline-refund-amount" className="text-xs font-semibold text-foreground">
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
                    Full Order (₹{Number(order.finalTotalAmount || 0).toFixed(2)})
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
                  id="inline-refund-amount"
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

            {/* DYNAMIC FIELD: Razorpay Payment ID vs Manual UPI / Bank Transfer */}
            {refundMode === "razorpay" ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="inline-razorpay-id" className="text-xs font-semibold text-foreground">
                    4. Razorpay Payment / Transaction ID (`pay_...`) <span className="text-destructive">*</span>
                  </Label>
                  <span className="text-[10px] text-muted-foreground">Required for Auto Refund</span>
                </div>
                <Input
                  id="inline-razorpay-id"
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
                    <Label htmlFor="inline-refund-destination" className="text-xs font-semibold text-foreground">
                      4. Refund Destination ("Kis Par Bheja") <span className="text-destructive">*</span>
                    </Label>
                    <span className="text-[10px] text-muted-foreground">Customer UPI / Mobile / Bank</span>
                  </div>
                  <Input
                    id="inline-refund-destination"
                    placeholder="e.g. user@okhdfcbank, 9876543210, or Bank A/C"
                    value={refundTo}
                    onChange={(e) => {
                      setRefundTo(e.target.value);
                      if (errors.refundTo) setErrors((prev) => ({ ...prev, refundTo: undefined }));
                    }}
                    className={cn("text-xs h-9", errors.refundTo && "border-destructive ring-destructive/20")}
                  />
                  {errors.refundTo && (
                    <p className="text-[11px] text-destructive font-medium">{errors.refundTo}</p>
                  )}
                  {(customerMobile || customerEmail) && (
                    <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                      <span className="text-[10px] text-muted-foreground">Autofill:</span>
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
                    <Label htmlFor="inline-refund-utr" className="text-xs font-semibold text-foreground">
                      5. Transaction / UTR Number
                    </Label>
                    <span className="text-[10px] text-muted-foreground">Optional at initiation (e.g. UTR482910492812)</span>
                  </div>
                  <Input
                    id="inline-refund-utr"
                    placeholder="e.g. UTR482910492812"
                    value={refundTransactionId}
                    onChange={(e) => setRefundTransactionId(e.target.value)}
                    className="font-mono text-xs uppercase h-9"
                  />
                </div>
              </>
            )}

            {/* FIELD 6: Reason / Remarks */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="inline-refund-reason" className="text-xs font-semibold text-foreground">
                  {refundMode === "razorpay" ? "5. Reason / Notes" : "6. Reason / Notes"}
                </Label>
                <span className="text-[10px] text-muted-foreground">Remarks</span>
              </div>
              <Textarea
                id="inline-refund-reason"
                placeholder="e.g. Customer requested return / cancellation"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="text-xs min-h-[60px] resize-y"
              />
              <div className="flex items-center gap-1 flex-wrap pt-0.5">
                <span className="text-[10px] text-muted-foreground">Quick:</span>
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

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSaving}
                className={cn(
                  "gap-1.5 text-white font-semibold h-8 text-xs",
                  refundMode === "razorpay" || refundStatus === "processed"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-amber-600 hover:bg-amber-700"
                )}
              >
                <Save className="h-3.5 w-3.5" />
                {isSaving
                  ? "Saving..."
                  : refundMode === "razorpay" || refundStatus === "processed"
                  ? `Save as Processed (₹${Number(amount || 0).toFixed(2)})`
                  : `Save as Initiated (₹${Number(amount || 0).toFixed(2)}) ⏳`}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default InlineRefundCard;
