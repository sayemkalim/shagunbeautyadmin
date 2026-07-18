import React from "react";
import { Package, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

const ViewSwitcher = ({ currentView, onViewChange }) => {
  const views = [
    {
      key: "orders",
      label: "Order View",
      icon: ShoppingCart,
      description: "View all orders",
    },
    {
      key: "sku",
      label: "SKU View",
      icon: Package,
      description: "View orders by product/SKU",
    },
  ];

  return (
    <div className="bg-muted inline-flex items-center gap-1 rounded-lg p-1">
      {views.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => onViewChange(key)}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            currentView === key
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

export default ViewSwitcher;
