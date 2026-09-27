/**
 * Determines whether an order is Cash on Delivery (COD).
 * Handles various casing and explicit flags, while excluding prepaid/online methods.
 */
export const isOrderCOD = (order) => {
  if (!order) return false;
  if (order.isCOD === true) return true;
  if (order.isCOD === false) return false;

  const mode = String(order.paymentMode || "").toLowerCase().trim();
  if (
    mode === "cod" ||
    mode === "cash on delivery" ||
    mode === "cash_on_delivery" ||
    mode === "cash"
  ) {
    return true;
  }

  if (
    mode === "online" ||
    mode === "razorpay" ||
    mode === "prepaid" ||
    mode === "card" ||
    mode === "netbanking" ||
    mode === "wallet"
  ) {
    return false;
  }

  // If no explicit online payment mode is specified in this system, the default is COD
  if (!mode) {
    return true;
  }

  return false;
};
