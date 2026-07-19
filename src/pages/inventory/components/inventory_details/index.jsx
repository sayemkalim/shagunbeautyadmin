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

  const [dialogState, setDialogState] = useState({ open: false, actionType: null });

  const { data: apiResponse, isLoading, refetch } = useQuery({
    queryKey: ["inventory-detail", sku],
    queryFn: () => fetchInventoryBySku({ sku }),
    enabled: !!sku,
  });

  const apiError = !isLoading && isApiError(apiResponse);
  const inventory = !apiError ? getApiData(apiResponse)?.inventory : null;

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
          <CardContent className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              {product?.banner_image ? (
                <img
                  src={product.banner_image}
                  alt={product?.name}
                  className="size-20 shrink-0 rounded-lg border object-cover"
                />
              ) : (
                <div className="bg-muted flex size-20 shrink-0 items-center justify-center rounded-lg border">
                  <ImageOff className="text-muted-foreground size-6" />
                </div>
              )}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Typography variant="h4">{product?.name || "Inventory Record"}</Typography>
                  <Badge className={cn("w-fit capitalize", getStockStatusBadgeClass(status))}>
                    {getStockStatusLabel(status)}
                  </Badge>
                </div>
                <Typography variant="p" className="text-muted-foreground font-mono text-sm">
                  {inventory.sku}
                </Typography>
                {inventory.variant_sku && (
                  <Badge variant="outline" className="w-fit font-mono text-xs">
                    Variant: {inventory.variant_sku}
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 md:gap-8">
              <Detail label="Qty on Hand" value={inventory.quantity_on_hand} />
              <Detail label="Threshold" value={inventory.low_stock_threshold} />
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
