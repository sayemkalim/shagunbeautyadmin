import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Eye,
  PackagePlus,
  SlidersHorizontal,
  Target,
  AlertTriangle,
  ImageOff,
  Boxes,
  RefreshCw,
} from "lucide-react";
import CustomTable from "@/components/custom_table";
import ActionMenu from "@/components/action_menu";
import Typography from "@/components/typography";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getItem } from "@/utils/local_storage";
import { fetchInventoryList } from "../helpers/fetchInventoryList";
import { getApiData, isApiError } from "../helpers/apiResult";
import { getStockStatus, getStockStatusLabel, getStockStatusBadgeClass } from "../helpers/stockStatus";
import InventoryActionDialog from "./InventoryActionDialog";

const InventoryTable = ({ params, setParams, onOpenSync, setTotal }) => {
  const navigate = useNavigate();
  const role = getItem("userRole");
  const canMutate = role === "admin" || role === "super_admin";

  const [dialogState, setDialogState] = useState({ open: false, actionType: null, record: null });

  const { data: apiResponse, isLoading, error } = useQuery({
    queryKey: ["inventory", params],
    queryFn: () => fetchInventoryList({ params }),
  });

  const records = useMemo(() => {
    if (isApiError(apiResponse)) return [];
    return getApiData(apiResponse)?.data || [];
  }, [apiResponse]);

  const total = !isApiError(apiResponse) ? getApiData(apiResponse)?.total || 0 : 0;

  useEffect(() => {
    setTotal?.(total);
  }, [total, setTotal]);

  const openDialog = (actionType, record) => setDialogState({ open: true, actionType, record });
  const closeDialog = (open) => setDialogState((prev) => ({ ...prev, open }));

  const columns = [
    {
      key: "product",
      label: "Product",
      render: (product) => (
        <div className="flex items-center gap-3">
          {product?.banner_image ? (
            <img
              src={product.banner_image}
              alt={product?.name}
              className="size-10 shrink-0 rounded-md border object-cover"
            />
          ) : (
            <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-md border">
              <ImageOff className="text-muted-foreground size-4" />
            </div>
          )}
          <Typography variant="p" className="max-w-[200px] truncate font-medium">
            {product?.name || "Unknown Product"}
          </Typography>
        </div>
      ),
    },
    {
      key: "sku",
      label: "SKU",
      render: (sku) => (
        <Typography variant="p" className="font-mono text-xs">
          {sku}
        </Typography>
      ),
    },
    {
      key: "variant_sku",
      label: "Variant",
      render: (variantSku) =>
        variantSku ? (
          <Badge variant="outline" className="w-fit font-mono text-xs">
            {variantSku}
          </Badge>
        ) : (
          <Typography variant="small" className="text-muted-foreground">
            Base
          </Typography>
        ),
    },
    {
      key: "quantity_on_hand",
      label: "Qty on Hand",
      render: (qty) => (
        <Typography variant="p" className="font-medium tabular-nums">
          {qty}
        </Typography>
      ),
    },
    {
      key: "low_stock_threshold",
      label: "Threshold",
      render: (threshold) => (
        <Typography variant="p" className="text-muted-foreground tabular-nums">
          {threshold}
        </Typography>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (_, row) => {
        const status = getStockStatus(row.quantity_on_hand, row.low_stock_threshold);
        return (
          <Badge className={cn("w-fit capitalize", getStockStatusBadgeClass(status))}>
            {getStockStatusLabel(status)}
          </Badge>
        );
      },
    },
    {
      key: "last_restocked_at",
      label: "Last Restocked",
      render: (date) => (
        <Typography variant="p" className="text-muted-foreground">
          {date ? format(new Date(date), "dd/MM/yyyy") : "Never"}
        </Typography>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <ActionMenu
          options={[
            {
              label: "View Details",
              icon: Eye,
              action: () =>
                navigate(`/dashboard/inventory/${row.sku}`, { state: { product: row.product } }),
            },
            ...(canMutate
              ? [
                  {
                    label: "Restock",
                    icon: PackagePlus,
                    action: () => openDialog("restock", row),
                  },
                  {
                    label: "Adjust Quantity",
                    icon: SlidersHorizontal,
                    action: () => openDialog("adjust", row),
                  },
                  {
                    label: "Set Quantity",
                    icon: Target,
                    action: () => openDialog("set", row),
                  },
                  {
                    label: "Edit Threshold",
                    icon: AlertTriangle,
                    action: () => openDialog("threshold", row),
                  },
                ]
              : []),
          ]}
        />
      ),
    },
  ];

  const perPage = params.per_page || 50;
  const currentPage = params.page || 1;
  const totalPages = Math.ceil(total / perPage);

  const onPageChange = (page) => setParams((prev) => ({ ...prev, page }));

  const noRecordsAtAll =
    !isLoading && !error && total === 0 && params.filter === "all" && !params.search;

  return (
    <>
      {noRecordsAtAll ? (
        <Card className="text-muted-foreground flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="bg-muted flex size-12 items-center justify-center rounded-full">
            <Boxes className="size-5" />
          </div>
          <Typography variant="p" className="text-muted-foreground">
            No inventory records yet.
          </Typography>
          <Typography variant="small" className="text-muted-foreground max-w-sm">
            {canMutate
              ? "Records appear once an order, manual action, or sync touches a SKU. Run a sync to backfill from your existing products."
              : "Ask an admin to sync inventory from products to get started."}
          </Typography>
          {canMutate && (
            <Button onClick={onOpenSync} className="mt-1 gap-2">
              <RefreshCw className="size-4" /> Sync from Products
            </Button>
          )}
        </Card>
      ) : (
        <CustomTable
          columns={columns}
          data={records}
          isLoading={isLoading}
          error={error}
          perPage={perPage}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          emptyStateMessage="No inventory records found matching your criteria. Try adjusting your filters or search."
        />
      )}

      <InventoryActionDialog
        open={dialogState.open}
        onOpenChange={closeDialog}
        actionType={dialogState.actionType}
        record={dialogState.record}
      />
    </>
  );
};

export default InventoryTable;
