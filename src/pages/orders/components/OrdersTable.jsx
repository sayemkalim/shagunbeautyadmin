import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import ActionMenu from "@/components/action_menu";
import { Eye, Pencil, FileDown, RefreshCw } from "lucide-react";
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
  const perPage = params.per_page || 50;

  // Memoize queryParams excluding search so search is handled client-side instantly
  const queryParams = useMemo(() => {
    const p = { ...params };
    delete p.search;
    return p;
  }, [params.status, params.service_id, params.start_date, params.end_date, perPage]);

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
  const [regeneratingOrderId, setRegeneratingOrderId] = useState(null);

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

  const { mutate: regenerateInvoiceMutation } = useMutation({
    mutationFn: (id) => fetchOrderBill({ id, regenerate: true }),
    onMutate: (id) => setRegeneratingOrderId(id),
    onSuccess: (res) => {
      if (res?.error || res?.response?.success === false) {
        toast.error(res?.response?.data?.message || "Failed to regenerate invoice. Please try again.");
        return;
      }
      const downloaded = triggerBillDownload(res?.response?.data);
      if (!downloaded) {
        toast.error("Invoice URL not available.");
      } else {
        toast.success("Invoice regenerated successfully!");
        queryClient.invalidateQueries(["orders"]);
      }
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to regenerate invoice. Please try again.");
    },
    onSettled: () => setRegeneratingOrderId(null),
  });

  const orders = useMemo(() => {
    return Array.isArray(apiOrdersResponse?.response?.data?.data)
      ? apiOrdersResponse.response.data.data
      : [];
  }, [apiOrdersResponse]);

  // Comprehensive client-side search across orderNumber, MongoDB _id, mobile, customer name, email
  const filteredOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    const search = (params.search || "").trim().toLowerCase();

    return orders.filter((order) => {
      // 1. Status filter (if not "all")
      if (params.status && params.status !== "all") {
        if (order.status?.toLowerCase() !== params.status.toLowerCase()) {
          return false;
        }
      }

      if (!search) return true;

      // Clean search for '#45' -> '45'
      const cleanSearch = search.startsWith("#") ? search.slice(1).trim() : search;

      // 1. Match orderNumber (e.g. 45 or #45)
      if (order.orderNumber !== undefined && order.orderNumber !== null) {
        if (String(order.orderNumber).toLowerCase().includes(cleanSearch)) {
          return true;
        }
      }

      // 2. Match MongoDB _id (e.g. 6aa3d4b822447a37818fcdf3)
      if (order._id && order._id.toLowerCase().includes(cleanSearch)) {
        return true;
      }

      // 3. Match mobile phone numbers
      const mobiles = [
        order.address?.mobile,
        order.address?.alternatePhone,
        order.address?.phone,
        order.guestInfo?.mobile,
        order.user?.phone,
        order.user?.mobile,
        order.customer?.mobile,
        order.customer?.phone,
      ].filter(Boolean);

      if (mobiles.some((m) => String(m).toLowerCase().includes(cleanSearch))) {
        return true;
      }

      // 4. Match customer names
      const names = [
        order.address?.name,
        order.user?.name,
        order.customer?.name,
        order.guestInfo?.name,
      ].filter(Boolean);

      if (names.some((n) => String(n).toLowerCase().includes(search))) {
        return true;
      }

      // 5. Match emails
      const emails = [
        order.user?.email,
        order.customer?.email,
        order.guestInfo?.email,
        order.address?.email,
      ].filter(Boolean);

      if (emails.some((e) => String(e).toLowerCase().includes(search))) {
        return true;
      }

      return false;
    });
  }, [orders, params.search, params.status]);

  const isLoading = apiLoading;
  const error = apiError;

  useEffect(() => {
    setOrdersLength(filteredOrders?.length || 0);
  }, [filteredOrders, setOrdersLength]);

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
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Typography
              variant="p"
              className="text-primary font-mono font-semibold text-sm hover:underline cursor-pointer"
              onClick={() => navigate(`/dashboard/orders/${row._id}`)}
              title="Click to view order details"
            >
              {row?.orderNumber ? `#${row.orderNumber}` : `#${row?._id?.slice(-6).toUpperCase()}`}
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
          <span className="text-[11px] font-mono text-muted-foreground select-all" title="Mongo Order ID">
            ID: {row?._id}
          </span>
        </div>
      ),
    },
    {
      key: "customer",
      label: "Customer",
      render: (_, row) => {
        const customerName =
          row.address?.name ||
          row.user?.name ||
          row.customer?.name ||
          row.guestInfo?.name ||
          (row.isGuestOrder ? "Guest Customer" : "Customer");
        const mobile =
          row.address?.mobile ||
          row.address?.phone ||
          row.guestInfo?.mobile ||
          row.customer?.mobile ||
          row.user?.phone ||
          row.user?.mobile;

        return (
          <div className="flex flex-col gap-0.5">
            <Typography variant="p" className="font-medium text-sm">
              {customerName}
            </Typography>
            {mobile ? (
              <span className="text-xs font-mono text-muted-foreground">
                {mobile}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground/60">
                No mobile
              </span>
            )}
          </div>
        );
      },
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
                    {
                      label:
                        regeneratingOrderId === order._id
                          ? "Regenerating..."
                          : "Regenerate Invoice",
                      icon: RefreshCw,
                      action: () => regenerateInvoiceMutation(order._id),
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

  const totalPages = Math.max(1, Math.ceil((filteredOrders?.length || 0) / perPage));
  const currentPage = Math.min(params.page || 1, totalPages);

  const paginatedOrders = useMemo(() => {
    if (showAllOnSinglePage) return filteredOrders;
    const start = (currentPage - 1) * perPage;
    return filteredOrders.slice(start, start + perPage);
  }, [filteredOrders, currentPage, perPage, showAllOnSinglePage]);

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
                  const selectedOrders = (filteredOrders || []).filter((o) =>
                    selectedRowIds.includes(o._id)
                  );
                  const csv = [
                    ["Order ID", "Customer", "Mobile", "Status", "Total", "Date"].join(","),
                    ...selectedOrders.map((o) =>
                      [
                        o.orderNumber ? `#${o.orderNumber}` : o._id,
                        `"${o.address?.name || o.user?.name || o.customer?.name || "Unknown"}"`,
                        `"${o.address?.mobile || o.guestInfo?.mobile || ""}"`,
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
        data={paginatedOrders || []}
        isLoading={isLoading}
        error={error}
        perPage={perPage}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        hidePagination={showAllOnSinglePage}
        emptyStateMessage={
          params.search
            ? `No orders found matching "${params.search}". Try searching by order number (#45), Mongo ID (${orders?.[0]?._id?.slice(0, 8) || "6aa..."}, mobile number, or customer name.`
            : "No orders found matching your criteria. Try adjusting your filters or search terms."
        }
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
