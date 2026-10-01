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

const getInventoryProductInfo = (row) => {
  const isVariant = Boolean(row.variant_sku && row.variant_sku !== row.sku);
  const matchingVariant =
    row.variant ||
    (Array.isArray(row.product?.variants)
      ? row.product.variants.find(
          (v) => v.sku === row.variant_sku || (isVariant && v.sku === row.sku)
        )
      : null);

  const image =
    (isVariant && (matchingVariant?.images?.[0] || matchingVariant?.image)) ||
    row.product?.banner_image ||
    row.product?.images?.[0] ||
    row.image ||
    row.banner_image ||
    null;

  const title = row.product?.name || row.name || "Unknown Product";
  const variantTitle = matchingVariant?.name || (isVariant ? row.variant_sku : null);
  const color = isVariant ? matchingVariant?.color : row.product?.color;
  const colorName = isVariant ? matchingVariant?.color_name : row.product?.color_name;

  const rawPrice =
    (isVariant && (matchingVariant?.price?.$numberDecimal || matchingVariant?.price)) ||
    row.product?.price?.$numberDecimal ||
    row.product?.price ||
    row.price ||
    null;

  const rawDiscountedPrice =
    (isVariant && (matchingVariant?.discounted_price?.$numberDecimal || matchingVariant?.discounted_price)) ||
    row.product?.discounted_price?.$numberDecimal ||
    row.product?.discounted_price ||
    row.discounted_price ||
    null;

  const price = rawPrice ? String(rawPrice) : null;
  const discountedPrice = rawDiscountedPrice ? String(rawDiscountedPrice) : null;

  const activeSku = isVariant ? row.variant_sku || row.sku : row.sku || row.product?.sku;
  const baseSku = row.product?.sku || (isVariant ? row.sku : null);

  return {
    isVariant,
    variant: matchingVariant,
    image,
    title,
    variantTitle,
    color,
    colorName,
    price,
    discountedPrice,
    activeSku,
    baseSku,
  };
};

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
      render: (_, row) => {
        const info = getInventoryProductInfo(row);
        return (
          <div className="flex items-center gap-3">
            {info.image ? (
              <img
                src={info.image}
                alt={info.title}
                className="size-12 shrink-0 rounded-lg border object-contain p-0.5 bg-muted/20"
              />
            ) : (
              <div className="bg-muted flex size-12 shrink-0 items-center justify-center rounded-lg border">
                <ImageOff className="text-muted-foreground size-5" />
              </div>
            )}
            <div className="flex flex-col gap-0.5 max-w-[240px]">
              <Typography variant="p" className="truncate font-medium text-foreground" title={info.title}>
                {info.title}
              </Typography>
              {info.isVariant ? (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-medium shrink-0">
                    Variant
                  </Badge>
                  {info.variantTitle && (
                    <span className="truncate max-w-[140px] text-foreground font-medium" title={info.variantTitle}>
                      {info.variantTitle}
                    </span>
                  )}
                  {(info.color || info.colorName) && (
                    <span className="inline-flex items-center gap-1 text-[11px]">
                      {info.color && (
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full border border-border shrink-0"
                          style={{ backgroundColor: info.color }}
                        />
                      )}
                      <span>{info.colorName || info.color}</span>
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-normal shrink-0">
                    Base Product
                  </Badge>
                  {(info.color || info.colorName) && (
                    <span className="inline-flex items-center gap-1 text-[11px]">
                      {info.color && (
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full border border-border shrink-0"
                          style={{ backgroundColor: info.color }}
                        />
                      )}
                      <span>{info.colorName || info.color}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "sku",
      label: "SKU",
      render: (_, row) => {
        const info = getInventoryProductInfo(row);
        return (
          <div className="flex flex-col gap-0.5">
            <Typography variant="p" className="font-mono text-xs font-semibold text-foreground">
              {info.activeSku || "—"}
            </Typography>
            {info.isVariant && info.baseSku && info.baseSku !== info.activeSku && (
              <span className="font-mono text-[10px] text-muted-foreground">
                Base: {info.baseSku}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "price",
      label: "Price",
      render: (_, row) => {
        const info = getInventoryProductInfo(row);
        const effectivePrice = info.discountedPrice || info.price;
        if (!effectivePrice) {
          return <span className="text-muted-foreground text-xs">—</span>;
        }
        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-sm text-foreground">
              ₹{effectivePrice}
            </span>
            {info.discountedPrice && info.price && info.discountedPrice !== info.price && (
              <span className="text-muted-foreground text-[11px] line-through">
                ₹{info.price}
              </span>
            )}
          </div>
        );
      },
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
        <Typography variant="p" className="text-muted-foreground text-xs">
          {date ? format(new Date(date), "dd/MM/yyyy") : "Never"}
        </Typography>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => {
        const info = getInventoryProductInfo(row);
        return (
          <ActionMenu
            options={[
              {
                label: "View Details",
                icon: Eye,
                action: () =>
                  navigate(`/dashboard/inventory/${row.sku}`, {
                    state: { product: row.product, variant: info.variant, info },
                  }),
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
        );
      },
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
