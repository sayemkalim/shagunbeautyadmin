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
import { formatWeight } from "../helpers/formatWeight";
import InventoryActionDialog from "./InventoryActionDialog";

export { formatWeight };

export const getInventoryProductInfo = (row) => {
  const matchingVariant =
    row.variant ||
    (Array.isArray(row.product?.variants)
      ? row.product.variants.find(
          (v) =>
            (row.sku && v.sku === row.sku) ||
            (row.variant_sku && v.sku === row.variant_sku) ||
            (row.variant_id && String(v._id) === String(row.variant_id)) ||
            (row.variantId && String(v._id) === String(row.variantId))
        )
      : null);

  const isVariant = Boolean(
    matchingVariant ||
      row.is_variant ||
      row.isVariant ||
      row.variant_id ||
      row.variantId ||
      (row.variant_sku && row.variant_sku !== row.product?.sku) ||
      (row.product?.sku && row.sku && row.sku !== row.product?.sku)
  );

  const image =
    (isVariant && (matchingVariant?.images?.[0] || matchingVariant?.image)) ||
    row.product?.banner_image ||
    row.product?.images?.[0] ||
    row.image ||
    row.banner_image ||
    null;

  const baseTitle = row.product?.name || row.name || "Unknown Product";
  const title = baseTitle;

  const baseRawWeight =
    row.product?.weight_in_grams ??
    row.product?.weight ??
    (!isVariant ? (row.weight_in_grams ?? row.weight) : null);
  const baseWeightUnit =
    row.product?.weight_unit || row.product?.unit || row.weight_unit || row.unit || "g";
  const baseWeight = formatWeight(baseRawWeight, baseWeightUnit);

  const variantTitle =
    matchingVariant?.name ||
    row.variant_name ||
    row.variantName ||
    (isVariant ? row.variant_sku || row.sku : null);

  const variantRawWeight =
    matchingVariant?.weight_in_grams ??
    matchingVariant?.weight ??
    row.variant_weight_in_grams ??
    (isVariant ? (row.weight_in_grams ?? row.weight) : null);
  const variantWeightUnit =
    matchingVariant?.weight_unit ||
    matchingVariant?.unit ||
    row.variant_weight_unit ||
    row.weight_unit ||
    "g";
  const variantWeight = formatWeight(variantRawWeight, variantWeightUnit);

  const color = isVariant ? matchingVariant?.color : (row.product?.color || row.color);
  const colorName = isVariant ? matchingVariant?.color_name : (row.product?.color_name || row.color_name);

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

  const activeSku = isVariant ? row.sku || row.variant_sku || matchingVariant?.sku : row.sku || row.product?.sku;
  const baseSku = row.product?.sku || (isVariant && row.sku !== row.product?.sku ? row.product?.sku : null);

  return {
    isVariant,
    variant: matchingVariant,
    image,
    title,
    baseTitle,
    baseWeight,
    variantTitle,
    variantWeight,
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
        const displayName = info.isVariant ? (info.variantTitle || info.baseTitle) : info.baseTitle;
        const displayWeight = info.isVariant ? info.variantWeight : info.baseWeight;

        return (
          <div className="flex items-center gap-3">
            {info.image ? (
              <img
                src={info.image}
                alt={displayName}
                className="size-12 shrink-0 rounded-lg border object-contain p-0.5 bg-muted/20"
              />
            ) : (
              <div className="bg-muted flex size-12 shrink-0 items-center justify-center rounded-lg border">
                <ImageOff className="text-muted-foreground size-5" />
              </div>
            )}
            <div className="flex flex-col gap-1 max-w-[320px]">
              {info.isVariant ? (
                <>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Typography
                      variant="p"
                      className="font-semibold text-foreground text-sm line-clamp-1"
                      title={displayName}
                    >
                      {displayName}
                    </Typography>
                    {displayWeight && (
                      <span
                        className="inline-flex items-center rounded bg-purple-100/80 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80 px-1.5 py-0.5 text-[11px] font-medium"
                        title={`Variant Weight: ${displayWeight}`}
                      >
                        {displayWeight}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs flex-wrap">
                    <span className="inline-flex items-center gap-1 rounded bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/25 px-1.5 py-0.5 text-[11px] font-semibold">
                      Variant
                    </span>
                    {info.baseTitle && info.baseTitle !== displayName && (
                      <span
                        className="text-[11px] text-muted-foreground truncate max-w-[170px]"
                        title={`Base Product: ${info.baseTitle}`}
                      >
                        Base: {info.baseTitle}
                      </span>
                    )}
                    {(info.color || info.colorName) && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        {info.color && (
                          <span
                            className="inline-block w-3 h-3 rounded-full border border-border shrink-0 shadow-2xs"
                            style={{ backgroundColor: info.color }}
                          />
                        )}
                        <span>{[info.colorName, info.color].filter(Boolean).join(" - ")}</span>
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Typography
                      variant="p"
                      className="font-semibold text-foreground text-sm line-clamp-1"
                      title={displayName}
                    >
                      {displayName}
                    </Typography>
                    {displayWeight && (
                      <span
                        className="inline-flex items-center rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 text-[11px] font-medium"
                        title={`Weight: ${displayWeight}`}
                      >
                        {displayWeight}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs flex-wrap">
                    <span className="inline-flex items-center rounded bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/25 px-1.5 py-0.5 text-[11px] font-medium">
                      Base Product
                    </span>
                    {(info.color || info.colorName) && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        {info.color && (
                          <span
                            className="inline-block w-3 h-3 rounded-full border border-border shrink-0 shadow-2xs"
                            style={{ backgroundColor: info.color }}
                          />
                        )}
                        <span>{[info.colorName, info.color].filter(Boolean).join(" - ")}</span>
                      </span>
                    )}
                  </div>
                </>
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
