const MOVEMENT_TYPE_LABELS = {
  restock: "Restock",
  sale: "Sale",
  return: "Return",
  adjustment: "Adjustment",
  damage: "Damage",
  order_cancelled: "Order Cancelled",
};

const MOVEMENT_TYPE_BADGE_CLASSES = {
  restock:
    "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  sale: "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  return:
    "border-transparent bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
  adjustment:
    "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  damage: "border-transparent bg-destructive/10 text-destructive",
  order_cancelled: "border-transparent bg-muted text-muted-foreground",
};

// sale and order_cancelled movements are created automatically when a
// customer order is placed/cancelled — created_by_admin is null for these.
export const isSystemMovementType = (type) => type === "sale" || type === "order_cancelled";

export const getMovementTypeLabel = (type) => MOVEMENT_TYPE_LABELS[type] || type;

export const getMovementTypeBadgeClass = (type) =>
  MOVEMENT_TYPE_BADGE_CLASSES[type] || "border-transparent bg-muted text-muted-foreground";
