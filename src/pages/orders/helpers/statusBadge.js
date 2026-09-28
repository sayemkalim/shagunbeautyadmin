const STATUS_BADGE_CLASSES = {
  delivered: "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  sent: "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  cancelled: "border-transparent bg-destructive/10 text-destructive",
  failed: "border-transparent bg-destructive/10 text-destructive",
  pending: "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  processing: "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  in_progress: "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  confirmed: "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  shipped: "border-transparent bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
  out_for_delivery: "border-transparent bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
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
    refund_initiated: "Refund Initiated ⏳",
    refunded: "Refunded ✅",
    refund_failed: "Refund Failed ❌",
  };
  return labels[normalized] || status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

export const REFUND_STATUSES = [
  { value: "initiated", label: "Initiate Refund ⏳", description: "Will mark as pending / in-progress" },
  { value: "processed", label: "Mark as Processed ✅", description: "Completed & transferred immediately" },
  { value: "failed", label: "Mark as Failed ❌", description: "Refund failed or was rejected" },
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
  if (!status) return "Refund Initiated ⏳";
  const normalized = String(status).toLowerCase().trim();
  const map = {
    processed: "Refund Completed ✅",
    confirmed: "Refund Completed ✅",
    refunded: "Refunded ✅",
    success: "Refund Completed ✅",
    completed: "Refund Completed ✅",
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
  { value: "manual_upi", label: "Owner UPI (Manual)", shortLabel: "UPI", description: "Refund sent directly via UPI QR / VPA" },
  { value: "razorpay", label: "Razorpay (Automatic)", shortLabel: "Razorpay", description: "Automatic gateway refund via Razorpay" },
  { value: "bank_transfer", label: "Bank Transfer", shortLabel: "Bank Transfer", description: "Direct NEFT / IMPS / RTGS to customer bank" },
];

export const formatRefundMode = (mode) => {
  if (!mode) return "N/A";
  const normalized = String(mode).toLowerCase().trim();
  const labels = {
    manual_upi: "Owner UPI (Manual)",
    upi: "Owner UPI (Manual)",
    razorpay: "Razorpay (Auto)",
    bank_transfer: "Bank Transfer",
    cash: "Cash",
    other: "Other",
  };
  return labels[normalized] || mode.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

