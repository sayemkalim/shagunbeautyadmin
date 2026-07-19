import { Boxes, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const FILTERS = [
  { key: "all", label: "All", icon: Boxes },
  { key: "low_stock", label: "Low Stock", icon: AlertTriangle },
  { key: "out_of_stock", label: "Out of Stock", icon: XCircle },
];

const InventoryFilterTabs = ({ value, onChange }) => {
  return (
    <div className="bg-muted inline-flex items-center gap-1 rounded-lg p-1">
      {FILTERS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            value === key
              ? "bg-card text-foreground shadow-elegant-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="size-4" />
          {label}
        </button>
      ))}
    </div>
  );
};

export default InventoryFilterTabs;
