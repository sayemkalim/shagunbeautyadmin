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
  refunded: "border-transparent bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
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
    refunded: "Refunded",
  };
  return labels[normalized] || status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};
