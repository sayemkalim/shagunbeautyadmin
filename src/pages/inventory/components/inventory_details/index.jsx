import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, ImageOff, PackagePlus, SlidersHorizontal, Target, AlertTriangle } from "lucide-react";
import NavbarItem from "@/components/navbar/navbar_item";
import Typography from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { getItem } from "@/utils/local_storage";
import { fetchInventoryBySku } from "../../helpers/fetchInventoryBySku";
import { getApiData, getApiErrorMessage, isApiError } from "../../helpers/apiResult";
import { getStockStatus, getStockStatusLabel, getStockStatusBadgeClass } from "../../helpers/stockStatus";
import { formatWeight } from "../../helpers/formatWeight";
import InventoryActionDialog from "../InventoryActionDialog";
import MovementsTable from "../MovementsTable";

const InventoryDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sku } = useParams();
  const role = getItem("userRole");
  const canMutate = role === "admin" || role === "super_admin";

  // The list/get-by-sku API doesn't populate `product` on this endpoint —
  // carry the product summary through from whichever row the admin clicked.
  const product = location.state?.product;
  const variant = location.state?.variant;
  const passedInfo = location.state?.info;

  const [dialogState, setDialogState] = useState({ open: false, actionType: null });

  const { data: apiResponse, isLoading, refetch } = useQuery({
    queryKey: ["inventory-detail", sku],
    queryFn: () => fetchInventoryBySku({ sku }),
    enabled: !!sku,
  });

  const apiError = !isLoading && isApiError(apiResponse);
  const inventory = !apiError ? getApiData(apiResponse)?.inventory : null;

  const matchingVariant =
    variant ||
    passedInfo?.variant ||
    (Array.isArray(product?.variants)
      ? product.variants.find(
          (v) =>
            v.sku === sku ||
            (inventory?.sku && v.sku === inventory.sku) ||
            (inventory?.variant_sku && v.sku === inventory.variant_sku) ||
            (inventory?.variant_id && String(v._id) === String(inventory.variant_id)) ||
            (inventory?.variantId && String(v._id) === String(inventory.variantId))
        )
      : null);

  const isVariant = Boolean(
    matchingVariant ||
      passedInfo?.isVariant ||
      inventory?.is_variant ||
      inventory?.isVariant ||
      inventory?.variant_id ||
      inventory?.variant_sku ||
      (product?.sku && sku && sku !== product.sku)
  );

  const displayImage =
    (isVariant && (matchingVariant?.images?.[0] || matchingVariant?.image)) ||
    product?.banner_image ||
    product?.images?.[0] ||
    passedInfo?.image ||
    null;

  const baseProductName = product?.name || passedInfo?.baseTitle || (!isVariant ? passedInfo?.title : null) || inventory?.product_name || "Base Product";
  const variantName = matchingVariant?.name || passedInfo?.variantTitle || inventory?.variant_name || inventory?.variant_sku;

  const currentDisplayName = isVariant ? (variantName || passedInfo?.variantTitle || baseProductName) : baseProductName;

  const baseRawWeight =
    product?.weight_in_grams ??
    product?.weight ??
    (!isVariant ? passedInfo?.baseWeight : null) ??
    (!isVariant ? (inventory?.weight_in_grams ?? inventory?.weight) : null);
  const baseWeightUnit = product?.weight_unit || product?.unit || inventory?.weight_unit || "g";
  const baseWeight = typeof passedInfo?.baseWeight === "string" ? passedInfo.baseWeight : formatWeight(baseRawWeight, baseWeightUnit);

  const variantRawWeight =
    matchingVariant?.weight_in_grams ??
    matchingVariant?.weight ??
    passedInfo?.variantWeight ??
    inventory?.variant_weight_in_grams ??
    (isVariant ? (inventory?.weight_in_grams ?? inventory?.weight) : null);
  const variantWeightUnit = matchingVariant?.weight_unit || matchingVariant?.unit || inventory?.variant_weight_unit || inventory?.weight_unit || "g";
  const variantWeight = typeof passedInfo?.variantWeight === "string" ? passedInfo.variantWeight : formatWeight(variantRawWeight, variantWeightUnit);

  const currentWeight = isVariant ? variantWeight : baseWeight;

  const color = isVariant ? matchingVariant?.color : product?.color;
  const colorName = isVariant ? matchingVariant?.color_name : product?.color_name;

  const rawPrice =
    (isVariant && (matchingVariant?.price?.$numberDecimal || matchingVariant?.price)) ||
    product?.price?.$numberDecimal ||
    product?.price ||
    passedInfo?.price ||
    null;

  const rawDiscountedPrice =
    (isVariant && (matchingVariant?.discounted_price?.$numberDecimal || matchingVariant?.discounted_price)) ||
    product?.discounted_price?.$numberDecimal ||
    product?.discounted_price ||
    passedInfo?.discountedPrice ||
    null;

  const effectivePrice = rawDiscountedPrice || rawPrice;

  const openDialog = (actionType) => setDialogState({ open: true, actionType });
  const closeDialog = (open) => setDialogState((prev) => ({ ...prev, open }));

  const breadcrumbs = [
    { title: "Inventory", path: "/dashboard/inventory", isNavigation: true },
    { title: sku, isNavigation: false },
  ];

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <Skeleton className="h-[320px] w-full rounded-xl" />
      </div>
    );
  }

  if (apiError || !inventory) {
    return (
      <div className="flex flex-col">
        <NavbarItem title="Inventory" breadcrumbs={breadcrumbs} />
        <div className="p-4">
          <Alert variant="destructive">
            <AlertTitle>Could not load this SKU</AlertTitle>
            <AlertDescription>
              {getApiErrorMessage(apiResponse, "This SKU could not be found.")}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const status = getStockStatus(inventory.quantity_on_hand, inventory.low_stock_threshold);

  return (
    <div className="flex flex-col">
      <NavbarItem title="Inventory" breadcrumbs={breadcrumbs} />

      <div className="flex flex-col gap-4 p-4">
        <Button
          variant="ghost"
          className="flex w-fit items-center gap-2 px-0 text-sm"
          onClick={() => navigate("/dashboard/inventory")}
        >
          <ArrowLeft className="size-4" /> Back to Inventory
        </Button>

        <Card>
          <CardContent className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between p-6">
            <div className="flex items-start gap-4">
              {displayImage ? (
                <img
                  src={displayImage}
                  alt={currentDisplayName}
                  className="size-20 shrink-0 rounded-lg border object-contain p-1 bg-muted/20"
                />
              ) : (
                <div className="bg-muted flex size-20 shrink-0 items-center justify-center rounded-lg border">
                  <ImageOff className="text-muted-foreground size-6" />
                </div>
              )}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Typography variant="h4">{currentDisplayName}</Typography>
                  <Badge className={cn("w-fit capitalize", getStockStatusBadgeClass(status))}>
                    {getStockStatusLabel(status)}
                  </Badge>
                </div>

                {isVariant ? (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-sm flex-wrap">
                      <Badge variant="secondary" className="font-semibold text-xs bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/25">
                        Variant
                      </Badge>
                      {variantWeight && (
                        <span
                          className="inline-flex items-center rounded bg-purple-100/80 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80 px-2 py-0.5 text-xs font-medium"
                          title={`Variant Weight: ${variantWeight}`}
                        >
                          Weight: {variantWeight}
                        </span>
                      )}
                      {(color || colorName) && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          {color && (
                            <span
                              className="inline-block w-3 h-3 rounded-full border border-border shrink-0"
                              style={{ backgroundColor: color }}
                            />
                          )}
                          <span>{[colorName, color].filter(Boolean).join(" - ")}</span>
                        </span>
                      )}
                    </div>
                    {baseProductName && baseProductName !== currentDisplayName && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="font-medium">Base Product:</span>
                        <span>{baseProductName}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm flex-wrap">
                    <Badge variant="outline" className="font-medium text-xs bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/25">
                      Base Product
                    </Badge>
                    {baseWeight && (
                      <span className="inline-flex items-center rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-xs font-medium">
                        Weight: {baseWeight}
                      </span>
                    )}
                    {(color || colorName) && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        {color && (
                          <span
                            className="inline-block w-3 h-3 rounded-full border border-border shrink-0"
                            style={{ backgroundColor: color }}
                          />
                        )}
                        <span>{[colorName, color].filter(Boolean).join(" - ")}</span>
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
                  <span>SKU: {inventory.variant_sku || inventory.sku}</span>
                  {inventory.variant_sku && inventory.sku && inventory.variant_sku !== inventory.sku && (
                    <span className="text-xs text-muted-foreground">
                      (Base SKU: {inventory.sku})
                    </span>
                  )}
                </div>

                {effectivePrice && (
                  <div className="flex items-center gap-2 pt-1 text-base font-semibold text-primary">
                    <span>₹{effectivePrice}</span>
                    {rawDiscountedPrice && rawPrice && rawDiscountedPrice !== rawPrice && (
                      <span className="text-sm font-normal text-muted-foreground line-through">
                        ₹{rawPrice}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-8 shrink-0">
              <Detail label="Qty on Hand" value={inventory.quantity_on_hand} />
              <Detail label="Threshold" value={inventory.low_stock_threshold} />
              <Detail label="Weight / Volume" value={currentWeight || "—"} />
              <Detail
                label="Last Restocked"
                value={
                  inventory.last_restocked_at
                    ? format(new Date(inventory.last_restocked_at), "dd MMM, yyyy")
                    : "Never"
                }
              />
            </div>
          </CardContent>

          {canMutate && (
            <CardContent className="flex flex-wrap gap-2 border-t pt-4">
              <Button size="sm" onClick={() => openDialog("restock")} className="gap-2">
                <PackagePlus className="size-4" /> Restock
              </Button>
              <Button size="sm" variant="outline" onClick={() => openDialog("adjust")} className="gap-2">
                <SlidersHorizontal className="size-4" /> Adjust
              </Button>
              <Button size="sm" variant="outline" onClick={() => openDialog("set")} className="gap-2">
                <Target className="size-4" /> Set Quantity
              </Button>
              <Button size="sm" variant="outline" onClick={() => openDialog("threshold")} className="gap-2">
                <AlertTriangle className="size-4" /> Edit Threshold
              </Button>
            </CardContent>
          )}
        </Card>

        <div className="space-y-2">
          <Typography variant="h5">Stock Movement History</Typography>
          <MovementsTable sku={sku} showSkuColumn={false} perPage={10} />
        </div>
      </div>

      <InventoryActionDialog
        open={dialogState.open}
        onOpenChange={closeDialog}
        actionType={dialogState.actionType}
        record={inventory}
        onSuccess={refetch}
      />
    </div>
  );
};

const Detail = ({ label, value }) => (
  <div className="text-center md:text-right">
    <div className="text-2xl font-semibold tabular-nums">{value}</div>
    <div className="text-muted-foreground text-xs">{label}</div>
  </div>
);

export default InventoryDetails;
