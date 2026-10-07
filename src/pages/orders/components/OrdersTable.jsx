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
import { Banknote, QrCode, RotateCcw, CheckCircle2, XCircle, Package } from "lucide-react";
import { fetchOrders } from "../helpers/fetchOrders";
import { updateOrderStatus } from "../helpers/updateOrderStatus";
import { bulkUpdateOrderStatus } from "../helpers/bulkUpdateOrderStatus";
import { fetchOrderBill } from "../helpers/fetchOrderBill";
import { triggerBillDownload } from "../helpers/triggerBillDownload";
import { getStatusBadgeClass, formatOrderStatus, formatRefundMode, formatRefundStatus } from "../helpers/statusBadge";
import { isOrderCOD } from "../helpers/isOrderCOD";
import RefundModal from "./RefundModal";
import RefundStatusModal from "./RefundStatusModal";
import { ORDER_STATUS_VALUES } from "@/constant";
import { cn } from "@/lib/utils";

const ORDER_STATUSES = ORDER_STATUS_VALUES;


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
  const [codPaymentMethod, setCodPaymentMethod] = useState("");
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [openBulkStatusDialog, setOpenBulkStatusDialog] = useState(false);
  const [bulkStatus, setBulkStatus] = useState("");
  const [downloadingOrderId, setDownloadingOrderId] = useState(null);
  const [regeneratingOrderId, setRegeneratingOrderId] = useState(null);
  const [openRefundModal, setOpenRefundModal] = useState(false);
  const [openRefundStatusModal, setOpenRefundStatusModal] = useState(false);
  const [refundStatusTarget, setRefundStatusTarget] = useState("processed");

  const { mutate: updateOrderStatusMutation, isLoading: isUpdating } =
    useMutation({
      mutationFn: ({ orderId, status, codPaymentMethod }) => {
        return updateOrderStatus({ orderId, status, codPaymentMethod });
      },
      onSuccess: (res) => {
        if (res?.error || res?.response?.success === false) {
          toast.error(res?.response?.data?.message || "Failed to update order status.");
          return;
        }
        toast.success("Order status updated successfully.");
        queryClient.invalidateQueries(["orders"]);
        setOpenStatusDialog(false);
      },
      onError: (err) => {
        toast.error(err?.response?.data?.message || "Failed to update order status.");
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
    setNewStatus(order?.status || "");
    setCodPaymentMethod(order?.codPaymentMethod || "");
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
      render: (status, row) => {
        const isRefundState =
          status === "refunded" ||
          status === "refund_initiated" ||
          status === "refund_failed" ||
          Boolean(row?.refundStatus);

        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge
                className={cn("w-fit cursor-pointer font-medium", getStatusBadgeClass(status))}
                onClick={() => onOpenStatusDialog(row)}
                title="Click to update status"
              >
                {formatOrderStatus(status)}
              </Badge>
              {row?.paymentMode && (
                <Badge variant="outline" className="w-fit text-[11px] font-mono uppercase">
                  {row.paymentMode}
                </Badge>
              )}
              {row?.codPaymentMethod && (
                <Badge variant="secondary" className="w-fit text-[10px] px-1.5 py-0 font-medium">
                  {row.codPaymentMethod === "cash" ? "💵 Cash" : row.codPaymentMethod === "upi" ? "📱 UPI" : row.codPaymentMethod}
                </Badge>
              )}
              {isRefundState && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className={cn(
                        "w-fit cursor-pointer text-[10px] px-1.5 py-0 font-medium flex items-center gap-1 border",
                        row?.refundStatus === "failed" || row?.status === "refund_failed"
                          ? "border-rose-300 text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300"
                          : (row?.refundStatus === "initiated" || row?.refundStatus === "pending" || row?.status === "refund_initiated")
                          ? "border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300"
                          : "border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300"
                      )}
                      onClick={() => {
                        setSelectedOrder(row);
                        setOpenRefundModal(true);
                      }}
                    >
                      <RotateCcw className="h-2.5 w-2.5" />
                      <span>
                        {row?.refundStatus === "failed" || row?.status === "refund_failed"
                          ? "❌ Refund Failed"
                          : (row?.refundStatus === "initiated" || row?.refundStatus === "pending" || row?.status === "refund_initiated")
                          ? "⏳ Refund Initiated"
                          : "✅ Refunded"}
                        : ₹{Number(row.refundAmount || row.finalTotalAmount || 0).toFixed(0)}
                      </span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs space-y-1 p-2">
                    <div className="font-semibold text-foreground">
                      Status: {formatRefundStatus(row.refundStatus || row.status)}
                    </div>
                    <div>Amount: ₹{Number(row.refundAmount || row.finalTotalAmount || 0).toFixed(2)}</div>
                    <div>Mode: {formatRefundMode(row.refundMode)}</div>
                    {row.refundTransactionId && <div>UTR/Ref: {row.refundTransactionId}</div>}
                    {row.refundTo && <div>To: {row.refundTo}</div>}
                  </TooltipContent>
                </Tooltip>
              )}
              {Boolean(row?.shipping?.shiprocketOrderId || row?.shipping?.shipmentId) && (
                <Badge
                  variant="outline"
                  className="w-fit text-[10px] px-1.5 py-0 font-medium border-violet-200 bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800 flex items-center gap-1"
                  title={`Shiprocket Order ID: ${row.shipping?.shiprocketOrderId || 'Created'}${row.shipping?.awbCode ? ` • AWB: ${row.shipping.awbCode}` : ''}`}
                >
                  <Package className="h-2.5 w-2.5" />
                  <span>
                    {row.shipping?.status
                      ? row.shipping.status === "created"
                        ? "Shiprocket Created"
                        : row.shipping.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
                      : "Shiprocket Created"}
                  </span>
                </Badge>
              )}
            </div>
          </div>
        );
      },
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
              ...(order.status === "refunded" ||
              order.status === "refund_initiated" ||
              order.status === "refund_failed" ||
              order.refundStatus
                ? (order.refundStatus === "initiated" ||
                  order.refundStatus === "pending" ||
                  order.status === "refund_initiated"
                    ? [
                        {
                          label: "Mark Processed ✅",
                          icon: CheckCircle2,
                          action: () => {
                            setSelectedOrder(order);
                            setRefundStatusTarget("processed");
                            setOpenRefundStatusModal(true);
                          },
                        },
                        {
                          label: "Mark Failed ❌",
                          icon: XCircle,
                          action: () => {
                            setSelectedOrder(order);
                            setRefundStatusTarget("failed");
                            setOpenRefundStatusModal(true);
                          },
                        },
                        {
                          label: "Edit Refund Details",
                          icon: RotateCcw,
                          action: () => {
                            setSelectedOrder(order);
                            setOpenRefundModal(true);
                          },
                        },
                      ]
                    : [
                        {
                          label: "Edit Refund Details",
                          icon: RotateCcw,
                          action: () => {
                            setSelectedOrder(order);
                            setOpenRefundModal(true);
                          },
                        },
                      ])
                : []),
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
                        formatOrderStatus(o.status),
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="flex items-center justify-between text-xs bg-muted/40 p-2.5 rounded-lg border">
              <div>
                <span className="text-muted-foreground block text-[11px]">Order</span>
                <span className="font-mono font-semibold text-sm">
                  {selectedOrder?.orderNumber ? `#${selectedOrder.orderNumber}` : `#${selectedOrder?._id?.slice(-6).toUpperCase()}`}
                </span>
              </div>
              <div className="text-right">
                <span className="text-muted-foreground block text-[11px]">Payment Mode</span>
                <Badge variant="outline" className="font-mono text-xs uppercase">
                  {selectedOrder?.paymentMode || "COD"}
                </Badge>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Select New Status
              </label>
              <Select value={newStatus} onValueChange={(val) => {
                setNewStatus(val);
                if (val === "refunded") {
                  setOpenStatusDialog(false);
                  setOpenRefundModal(true);
                }
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {formatOrderStatus(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {newStatus === "refunded" && (
              <div className="p-3 rounded-lg border bg-rose-50/50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/40 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-rose-700 dark:text-rose-400">
                  <RotateCcw className="h-4 w-4" />
                  <span>Refund Details Required</span>
                </div>
                <p className="text-muted-foreground">
                  To mark an order as Refunded, please enter the refund method, amount, UTR/Transaction ID, and destination.
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setOpenStatusDialog(false);
                    setOpenRefundModal(true);
                  }}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white gap-1.5 h-8 text-xs font-medium"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Open Refund Form
                </Button>
              </div>
            )}

            {/* COD Payment Collection Selector (Required when marking COD orders as Delivered) */}
            {isOrderCOD(selectedOrder) && newStatus === "delivered" && (
              <div className="space-y-2.5 pt-3 border-t">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                    <Banknote className="h-4 w-4 text-emerald-600" />
                    <span>COD Payment Collection</span>
                    <span className="text-destructive">*</span>
                  </label>
                  <Badge variant="outline" className="text-[10px] uppercase font-mono text-amber-600 border-amber-300 dark:border-amber-700">
                    COD Delivery
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Select how the delivery agent collected payment from the customer:
                </p>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setCodPaymentMethod("cash")}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-all cursor-pointer relative",
                      codPaymentMethod === "cash"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-500 ring-2 ring-emerald-500/30 font-semibold shadow-xs"
                        : "border-border hover:bg-muted/60 text-muted-foreground"
                    )}
                  >
                    <Banknote className={cn("h-5 w-5", codPaymentMethod === "cash" ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")} />
                    <span>Paid by Cash</span>
                    <span className="text-[10px] font-normal text-muted-foreground">Cash on Hand</span>
                    {codPaymentMethod === "cash" && (
                      <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px]">
                        ✓
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setCodPaymentMethod("upi")}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-all cursor-pointer relative",
                      codPaymentMethod === "upi"
                        ? "border-blue-600 bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-500 ring-2 ring-blue-500/30 font-semibold shadow-xs"
                        : "border-border hover:bg-muted/60 text-muted-foreground"
                    )}
                  >
                    <QrCode className={cn("h-5 w-5", codPaymentMethod === "upi" ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground")} />
                    <span>Paid by UPI</span>
                    <span className="text-[10px] font-normal text-muted-foreground">QR / Online Scan</span>
                    {codPaymentMethod === "upi" && (
                      <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white text-[10px]">
                        ✓
                      </span>
                    )}
                  </button>
                </div>

                {!codPaymentMethod && (
                  <p className="text-[11px] text-destructive font-medium">
                    * Please choose Paid by Cash or Paid by UPI before marking as Delivered.
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setOpenStatusDialog(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (isOrderCOD(selectedOrder) && newStatus === "delivered" && !codPaymentMethod) {
                  toast.error("Please select a COD payment collection method (Paid by Cash or Paid by UPI).");
                  return;
                }
                updateOrderStatusMutation({
                  orderId: selectedOrder?._id,
                  status: newStatus,
                  codPaymentMethod:
                    isOrderCOD(selectedOrder) && newStatus === "delivered"
                      ? codPaymentMethod
                      : undefined,
                });
              }}
              disabled={
                isUpdating ||
                !newStatus ||
                (isOrderCOD(selectedOrder) && newStatus === "delivered" && !codPaymentMethod)
              }
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
                  {formatOrderStatus(status)}
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

      {/* Order Refund Modal */}
      <RefundModal
        open={openRefundModal}
        onOpenChange={setOpenRefundModal}
        order={selectedOrder}
        onSuccess={() => {
          queryClient.invalidateQueries(["orders"]);
        }}
      />

      {/* Refund Status Transition Modal */}
      <RefundStatusModal
        open={openRefundStatusModal}
        onOpenChange={setOpenRefundStatusModal}
        order={selectedOrder}
        targetStatus={refundStatusTarget}
        onSuccess={() => {
          queryClient.invalidateQueries(["orders"]);
        }}
      />
    </>
  );
};

export default OrdersTable;
