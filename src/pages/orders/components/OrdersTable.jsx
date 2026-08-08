import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import ActionMenu from "@/components/action_menu";
import { Eye, Pencil, FileDown } from "lucide-react";
import CustomTable from "@/components/custom_table";
import Typography from "@/components/typography";
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { fetchOrders } from "../helpers/fetchOrders";
import { updateOrderStatus } from "../helpers/updateOrderStatus";
import { bulkUpdateOrderStatus } from "../helpers/bulkUpdateOrderStatus";
import { fetchOrderBill } from "../helpers/fetchOrderBill";
import { triggerBillDownload } from "../helpers/triggerBillDownload";
import { getStatusBadgeClass } from "../helpers/statusBadge";
import { cn } from "@/lib/utils";

const ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const OrdersTable = ({
  setOrdersLength,
  params,
  setParams,
  showAllOnSinglePage = false,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const perPage = params.per_page || 10;
  const queryParams = {
    ...params,
    per_page: perPage,
  };

  const {
    data: apiOrdersResponse,
    isLoading: apiLoading,
    error: apiError,
  } = useQuery({
    queryKey: ["orders", queryParams],
    queryFn: () => fetchOrders({ params: queryParams }),
  });

  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [openBulkStatusDialog, setOpenBulkStatusDialog] = useState(false);
  const [bulkStatus, setBulkStatus] = useState("");
  const [downloadingOrderId, setDownloadingOrderId] = useState(null);

  const { mutate: updateOrderStatusMutation, isLoading: isUpdating } =
    useMutation({
      mutationFn: ({ orderId, status }) => {
        return updateOrderStatus({ orderId, status });
      },
      onSuccess: () => {
        toast.success("Order status updated successfully.");
        queryClient.invalidateQueries(["orders"]);
        setOpenStatusDialog(false);
      },
      onError: () => {
        toast.error("Failed to update order status.");
      },
    });

  const { mutate: bulkUpdateOrderStatusMutation, isLoading: isBulkUpdating } =
    useMutation({
      mutationFn: ({ orderIds, status }) => {
        return bulkUpdateOrderStatus({ orderIds, status });
      },
      onSuccess: (_, variables) => {
        toast.success(
          `Successfully updated ${variables.orderIds.length} order(s).`
        );
        queryClient.invalidateQueries(["orders"]);
        setOpenBulkStatusDialog(false);
        setSelectedRowIds([]);
      },
      onError: () => {
        toast.error("Failed to update order statuses.");
      },
    });

  const { mutate: downloadInvoiceMutation } = useMutation({
    mutationFn: (id) => fetchOrderBill({ id }),
    onMutate: (id) => setDownloadingOrderId(id),
    onSuccess: (res) => {
      // apiService never throws on API errors — it resolves with an
      // error-shaped object instead, so success must be checked explicitly.
      if (res?.error || res?.response?.success === false) {
        toast.error(res?.response?.data?.message || "Failed to fetch invoice. Please try again.");
        return;
      }
      const downloaded = triggerBillDownload(res?.response?.data);
      if (!downloaded) {
        toast.error("Invoice URL not available.");
      }
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to fetch invoice. Please try again.");
    },
    onSettled: () => setDownloadingOrderId(null),
  });

  const orders = useMemo(() => {
    return Array.isArray(apiOrdersResponse?.response?.data?.data)
      ? apiOrdersResponse.response.data.data
      : [];
  }, [apiOrdersResponse]);

  const orderTotal = apiOrdersResponse?.response?.data?.total || 0;
  const isLoading = apiLoading;
  const error = apiError;

  useEffect(() => {
    setOrdersLength(orders?.length);
  }, [orders, setOrdersLength]);

  const onOpenStatusDialog = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setOpenStatusDialog(true);
  };

  const columns = [
    {
      key: "sr_no",
      label: "Order ID",
      render: (_, row) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <Typography
              variant="p"
              className="text-primary font-mono font-medium"
            >
              {row?.orderNumber ? `#${row.orderNumber}` : row?._id}
            </Typography>
            {row?.couponCode && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="cursor-default px-1.5 py-0 text-[10px]">
                    {row.couponCode}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  −₹{(row.couponDiscountAmount || 0).toFixed(2)} discount applied
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "customer",
      label: "Customer",
      render: (_, row) => (
        <div className="flex flex-col gap-1">
          <Typography variant="p" className="font-medium">
            {row.address?.name || row.customer?.name || "Unknown Customer"}
          </Typography>
          <Typography variant="small" className="text-muted-foreground">
            {row.address?.mobile || row.customer?.email || "No contact info"}
          </Typography>
        </div>
      ),
    },
    {
      key: "items",
      label: "Items",
      render: (items) => {
        const itemLabels =
          items?.map((item) => {
            const isBundle = item.type === "bundle";
            const isProduct = item.type === "product" || !item.type;

            let itemData;
            if (isBundle) {
              itemData = item.bundle;
            } else if (isProduct) {
              itemData = item.product;
            }

            const itemName = itemData?.name || "Unknown Item";
            const quantity = item.quantity || 0;

            return `${itemName} x${quantity}`;
          }) || [];

        const fullList = itemLabels.join(", ") || "No items";

        // Show as many whole items as fit in a ~100 char budget, then summarize the rest.
        const CHAR_BUDGET = 100;
        let shownCount = 0;
        let charCount = 0;
        for (const label of itemLabels) {
          const addition = (shownCount > 0 ? 2 : 0) + label.length;
          if (shownCount > 0 && charCount + addition > CHAR_BUDGET) break;
          charCount += addition;
          shownCount++;
        }
        const remaining = itemLabels.length - shownCount;
        const shownText = itemLabels.slice(0, shownCount).join(", ");
        const displayText = itemLabels.length === 0 ? "No items" : shownText;

        return (
          <div className="flex max-w-xs flex-col gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Typography variant="p" className="cursor-default truncate">
                  {displayText}
                  {remaining > 0 && "..."}
                </Typography>
              </TooltipTrigger>
              {remaining > 0 && (
                <TooltipContent className="max-w-xs text-wrap">{fullList}</TooltipContent>
              )}
            </Tooltip>
            <div className="flex items-center gap-1.5">
              <Typography variant="small" className="text-muted-foreground">
                {itemLabels.length} item(s)
              </Typography>
              {remaining > 0 && (
                <Typography variant="small" className="text-primary font-medium">
                  +{remaining} more
                </Typography>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (status, row) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <Badge
              className={cn("w-fit cursor-pointer capitalize", getStatusBadgeClass(status))}
              onClick={() => onOpenStatusDialog(row)}
            >
              {status}
            </Badge>
            {row?.paymentMode && (
              <Badge variant="outline" className="w-fit">
                {row.paymentMode}
              </Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "finalTotalAmount",
      label: "Total Amount",
      render: (finalTotalAmount, row) => {
        const finalAmount = finalTotalAmount || row?.finalTotalAmount || 0;
        return (
          <div className="flex flex-col gap-1">
            <Typography variant="p" className="text-[var(--color-success)] font-semibold">
              ₹{finalAmount.toFixed(2)}
            </Typography>
          </div>
        );
      },
    },
    {
      key: "createdAt",
      label: "Order Date",
      render: (date) => (
        <div className="flex flex-col gap-1">
          <Typography variant="p">
            {format(new Date(date), "dd/MM/yyyy")}
          </Typography>
          <Typography variant="small" className="text-muted-foreground">
            {format(new Date(date), "hh:mm a")}
          </Typography>
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, order) => (
        <div className="flex items-center gap-2">
          <ActionMenu
            options={[
              {
                label: "View Details",
                icon: Eye,
                action: () => navigate(`/dashboard/orders/${order._id}`),
              },
              ...(order.status !== "pending"
                ? [
                    {
                      label:
                        downloadingOrderId === order._id
                          ? "Downloading..."
                          : "Download Invoice",
                      icon: FileDown,
                      action: () => downloadInvoiceMutation(order._id),
                    },
                  ]
                : []),
            ]}
          />
        </div>
      ),
    },
  ];

  const onPageChange = (page) => {
    setParams((prev) => ({
      ...prev,
      page: page,
    }));
  };

  const currentPage = params.page || 1;
  const totalPages = Math.ceil(orderTotal / perPage);

  const handleBulkStatusUpdate = () => {
    if (selectedRowIds.length === 0) {
      toast.error("Please select at least one order.");
      return;
    }
    bulkUpdateOrderStatusMutation({
      orderIds: selectedRowIds,
      status: bulkStatus,
    });
  };

  return (
    <>
      <div className="mb-4">
        {selectedRowIds.length > 0 && (
          <div className="bg-primary/5 border-primary/20 flex items-center justify-between rounded-lg border p-4">
            <Typography variant="p" className="text-primary font-medium">
              {selectedRowIds.length} order(s) selected
            </Typography>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setSelectedRowIds([])}>
                Clear Selection
              </Button>
              <Button
                onClick={() => setOpenBulkStatusDialog(true)}
                disabled={selectedRowIds.length === 0}
              >
                Update Status
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const selectedOrders = orders.filter((o) =>
                    selectedRowIds.includes(o._id)
                  );
                  const csv = [
                    ["Order ID", "Customer", "Status", "Total", "Date"].join(","),
                    ...selectedOrders.map((o) =>
                      [
                        o.orderNumber ? `#${o.orderNumber}` : o._id,
                        `"${o.address?.name || o.customer?.name || "Unknown"}"`,
                        o.status,
                        o.finalTotalAmount || 0,
                        o.createdAt
                          ? format(new Date(o.createdAt), "dd/MM/yyyy")
                          : "",
                      ].join(",")
                    ),
                  ].join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "selected_orders.csv";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Export Selected
              </Button>
            </div>
          </div>
        )}
      </div>

      <CustomTable
        columns={columns}
        data={orders || []}
        isLoading={isLoading}
        error={error}
        perPage={perPage}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        hidePagination={false}
        emptyStateMessage="No orders found matching your criteria. Try adjusting your filters or search terms."
        enableRowSelection={true}
        selectedRows={selectedRowIds}
        onRowSelectionChange={setSelectedRowIds}
      />

      {/* Single Order Status Update Dialog */}
      <Dialog open={openStatusDialog} onOpenChange={setOpenStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
          </DialogHeader>
          <Typography variant="p" className="font-medium">
            Order ID: {selectedOrder?._id}
          </Typography>
          <Select value={newStatus} onValueChange={setNewStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              onClick={() =>
                updateOrderStatusMutation({
                  orderId: selectedOrder?._id,
                  status: newStatus,
                })
              }
              disabled={isUpdating}
            >
              {isUpdating ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Status Update Dialog */}
      <Dialog
        open={openBulkStatusDialog}
        onOpenChange={setOpenBulkStatusDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Update Order Status</DialogTitle>
          </DialogHeader>
          <Typography variant="p" className="font-medium">
            Update {selectedRowIds.length} order(s) to:
          </Typography>
          <Select value={bulkStatus} onValueChange={setBulkStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenBulkStatusDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkStatusUpdate}
              disabled={isBulkUpdating || !bulkStatus}
            >
              {isBulkUpdating ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrdersTable;
