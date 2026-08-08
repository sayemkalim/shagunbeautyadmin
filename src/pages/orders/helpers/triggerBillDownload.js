// Opens/downloads a bill PDF given the { bill_url, filename } payload from fetchOrderBill.
export const triggerBillDownload = (bill) => {
  if (!bill?.bill_url) return false;

  const link = document.createElement("a");
  link.href = bill.bill_url;
  link.download = bill.filename || "invoice.pdf";
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
};
