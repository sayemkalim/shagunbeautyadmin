const STATUS_BADGE_CLASSES = {
  pending: "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  confirmed: "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  processing: "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  in_progress: "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  shipped: "border-transparent bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
  out_for_delivery: "border-transparent bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
  delivered: "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  sent: "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  cancelled: "border-transparent bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
  failed: "border-transparent bg-destructive/10 text-destructive",
  return_requested: "border-transparent bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300",
  returned: "border-transparent bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300",
  refund_initiated: "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  refunded: "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  refund_failed: "border-transparent bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300",
};

export const getStatusBadgeClass = (status) =>
  STATUS_BADGE_CLASSES[status?.toLowerCase()] ||
  "border-transparent bg-muted text-muted-foreground";

export const formatOrderStatus = (status) => {
  if (!status) return "";
  const normalized = String(status).toLowerCase().trim();
  const labels = {
    pending: "Pending",
    confirmed: "Confirmed",
    processing: "Processing",
    shipped: "Shipped",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
    return_requested: "Return Requested",
    returned: "Returned",
    refund_initiated: "Refund Initiated",
    refunded: "Refunded",
    refund_failed: "Refund Failed",
  };
  return labels[normalized] || status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

export const REFUND_STATUSES = [
  { value: "initiated", label: "Initiated (In Progress ⏳)", description: "Refund in progress" },
  { value: "processed", label: "Processed (Credited ✅)", description: "Refund completed successfully" },
  { value: "failed", label: "Failed ❌", description: "Refund failed or was rejected" },
];

export const getRefundStatusBadgeClass = (status) => {
  const normalized = String(status || "initiated").toLowerCase().trim();
  switch (normalized) {
    case "processed":
    case "confirmed":
    case "refunded":
    case "success":
    case "completed":
      return "border-emerald-300 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300";
    case "initiated":
    case "refund_initiated":
    case "pending":
    case "processing":
      return "border-amber-300 bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300";
    case "failed":
    case "refund_failed":
    case "rejected":
    case "cancelled":
      return "border-rose-300 bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300";
    default:
      return "border-amber-300 bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300";
  }
};

export const formatRefundStatus = (status) => {
  if (!status) return "Refund Initiated";
  const normalized = String(status).toLowerCase().trim();
  const map = {
    processed: "Refund Processed ✅",
    confirmed: "Refund Processed ✅",
    refunded: "Refunded ✅",
    success: "Refund Processed ✅",
    completed: "Refund Processed ✅",
    initiated: "Refund Initiated ⏳",
    refund_initiated: "Refund Initiated ⏳",
    pending: "Refund Initiated ⏳",
    processing: "Refund In-Progress ⏳",
    failed: "Refund Failed ❌",
    refund_failed: "Refund Failed ❌",
    rejected: "Refund Failed ❌",
  };
  return map[normalized] || status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

export const REFUND_MODES = [
  { value: "UPI", label: "UPI", description: "Customer UPI / QR" },
  { value: "Bank Transfer", label: "Bank Transfer", description: "Direct NEFT / IMPS" },
  { value: "Razorpay", label: "Razorpay", description: "Razorpay Auto Gateway" },
  { value: "Cash", label: "Cash", description: "Cash in hand" },
];

export const formatRefundMode = (mode) => {
  if (!mode) return "N/A";
  const normalized = String(mode).toLowerCase().trim();
  const labels = {
    upi: "UPI",
    manual_upi: "UPI",
    bank_transfer: "Bank Transfer",
    razorpay: "Razorpay",
    cash: "Cash",
    other: "Other",
  };
  return labels[normalized] || mode;
};
