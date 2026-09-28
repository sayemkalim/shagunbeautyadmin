export const columnMapper = {
    "Name": "name",
    "Small Description": "small_description",
    "Category": "category",
    "Sub Category": "sub_category",
    "Full Description": "full_description",
    "Price": "price",
    "Discounted Price": "discounted_price",
    "Salesperson Discounted Price": "salesperson_discounted_price",
    "DND Discounted Price": "dnd_discounted_price",
    "Instock": "instock",
    "Consumed Type": "consumed_type",
    "Manufacture": "manufacture",
    "Is Best Seller": "is_best_seller",
    "Inventory": "inventory",
    "Tags": "tags",
    "Created By Admin": "created_by_admin"
  };

export const ORDER_STATUSES = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refund_initiated", label: "Refund Initiated ⏳" },
  { value: "refunded", label: "Refunded ✅" },
  { value: "refund_failed", label: "Refund Failed ❌" },
];

export const ORDER_STATUS_VALUES = [
  "pending",
  "confirmed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refund_initiated",
  "refunded",
  "refund_failed",
];

