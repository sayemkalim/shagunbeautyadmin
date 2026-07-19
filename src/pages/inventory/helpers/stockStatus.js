export const getStockStatus = (quantity, threshold) => {
  if (quantity === 0) return "out_of_stock";
  if (quantity > 0 && quantity <= (threshold || 0)) return "low_stock";
  return "in_stock";
};

const STOCK_STATUS_LABELS = {
  in_stock: "In Stock",
  low_stock: "Low Stock",
  out_of_stock: "Out of Stock",
};

const STOCK_STATUS_BADGE_CLASSES = {
  in_stock:
    "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  low_stock:
    "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  out_of_stock: "border-transparent bg-destructive/10 text-destructive",
};

export const getStockStatusLabel = (status) => STOCK_STATUS_LABELS[status] || status;

export const getStockStatusBadgeClass = (status) =>
  STOCK_STATUS_BADGE_CLASSES[status] || "border-transparent bg-muted text-muted-foreground";
