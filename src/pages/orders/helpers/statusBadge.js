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
};

export const getStatusBadgeClass = (status) =>
  STATUS_BADGE_CLASSES[status?.toLowerCase()] ||
  "border-transparent bg-muted text-muted-foreground";
