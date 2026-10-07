import { useState } from "react";
import { format } from "date-fns";
import {
  Truck,
  Package,
  ExternalLink,
  Copy,
  CheckCircle2,
  Clock,
  Send,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ShiprocketCreateOrderModal } from "./ShiprocketCreateOrderModal";
import { ShiprocketAssignAwbModal } from "./ShiprocketAssignAwbModal";
import { extractPackageData } from "../helpers/extractPackageData";
import { cn } from "@/lib/utils";

const formatDateTime = (dateVal) => {
  if (!dateVal) return "N/A";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return format(d, "dd MMM yyyy, hh:mm a");
  } catch {
    return String(dateVal);
  }
};

const getShippingStatusBadgeClass = (status) => {
  if (!status) return "border-muted text-muted-foreground bg-muted/40";
  const normalized = String(status).toLowerCase().trim();
  switch (normalized) {
    case "delivered":
      return "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "in_transit":
    case "shipped":
    case "out_for_delivery":
      return "border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300";
    case "awb_assigned":
    case "ready_for_pickup":
    case "pickup_scheduled":
      return "border-violet-300 bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300";
    case "created":
    case "order_created":
    case "new":
      return "border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
    case "cancelled":
    case "canceled":
    case "failed":
      return "border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300";
    default:
      return "border-border bg-muted/50 text-foreground";
  }
};

const ShiprocketCard = ({ order, onOrderUpdated }) => {
  const shipping = order?.shipping || {};

  const isShiprocketCreated = Boolean(shipping?.shiprocketOrderId || shipping?.shipmentId);
  const isAwbAssigned = Boolean(shipping?.awbCode);
  const canAssignAwb = Boolean(isShiprocketCreated && !isAwbAssigned);

  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false);
  const [isAssignAwbModalOpen, setIsAssignAwbModalOpen] = useState(false);

  const handleOpenAssignAwb = () => {
    const pkg = extractPackageData(order);
    console.log("SHIPROCKET ORDER DATA", order);
    console.log("SHIPROCKET PACKAGE DATA", order?.package || order?.shipping?.package || order?.packageDetails || order?.shipping?.packageDetails || order?.shipping);
    console.log("SHIPROCKET WEIGHT", pkg.weight);
    console.log("SHIPROCKET LENGTH", pkg.length);
    console.log("SHIPROCKET BREADTH", pkg.breadth);
    console.log("SHIPROCKET HEIGHT", pkg.height);
    setIsAssignAwbModalOpen(true);
  };

  const handleCopy = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <Card className="border shadow-xs">
      <CardHeader className="pb-3 border-b bg-muted/20">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">Shiprocket Logistics</CardTitle>
              <span className="text-[11px] text-muted-foreground">Provider: Shiprocket</span>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-2 py-0.5 font-medium capitalize",
              isShiprocketCreated
                ? getShippingStatusBadgeClass(shipping?.status || "created")
                : "border-muted text-muted-foreground bg-muted/30"
            )}
          >
            {isShiprocketCreated
              ? shipping?.status
                ? shipping.status.replace(/_/g, " ")
                : isAwbAssigned
                ? "AWB Assigned"
                : "Order Created"
              : "Not Synced"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-3.5 space-y-3 text-xs">
        {/* Shipping Details Grid */}
        <div className="space-y-2">
          {/* Provider */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Shipping Provider</span>
            <span className="font-semibold text-foreground">
              {shipping?.provider || "Shiprocket"}
            </span>
          </div>

          {/* Shiprocket Order ID */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Shiprocket Order ID</span>
            {shipping?.shiprocketOrderId ? (
              <div className="flex items-center gap-1.5 font-mono font-medium">
                <span>{shipping.shiprocketOrderId}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-muted-foreground hover:text-foreground"
                  onClick={() => handleCopy(shipping.shiprocketOrderId, "Order ID")}
                  title="Copy Shiprocket Order ID"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <span className="text-muted-foreground/70 italic">Not created</span>
            )}
          </div>

          {/* Shipment ID */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Shipment ID</span>
            {shipping?.shipmentId ? (
              <div className="flex items-center gap-1.5 font-mono font-medium">
                <span>{shipping.shipmentId}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-muted-foreground hover:text-foreground"
                  onClick={() => handleCopy(shipping.shipmentId, "Shipment ID")}
                  title="Copy Shipment ID"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <span className="text-muted-foreground/70 italic">—</span>
            )}
          </div>

          {/* AWB Code */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">AWB Code</span>
            {shipping?.awbCode ? (
              <div className="flex items-center gap-1.5 font-mono font-medium">
                <Badge variant="outline" className="font-mono text-xs bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300">
                  {shipping.awbCode}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-muted-foreground hover:text-foreground"
                  onClick={() => handleCopy(shipping.awbCode, "AWB")}
                  title="Copy AWB Code"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <span className="text-muted-foreground/70 italic">Pending assignment</span>
            )}
          </div>

          {/* Courier Name */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Courier</span>
            <span className="font-medium">
              {shipping?.courierName || <span className="text-muted-foreground/70 italic">—</span>}
            </span>
          </div>

          {/* Shipping Status */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Shipping Status</span>
            {shipping?.status ? (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5 py-0 font-medium capitalize",
                  getShippingStatusBadgeClass(shipping.status)
                )}
              >
                {shipping.status.replace(/_/g, " ")}
              </Badge>
            ) : (
              <span className="text-muted-foreground/70 italic">Unassigned</span>
            )}
          </div>

          {/* Package Dimensions & Weight */}
          {(() => {
            const pkg = extractPackageData(order);
            if (!pkg.weight && !pkg.length) return null;
            return (
              <div className="flex justify-between items-center pt-1 border-t">
                <span className="text-muted-foreground">Package</span>
                <span className="font-mono font-medium text-right">
                  {pkg.weight ? `${pkg.weight} KG` : "—"}
                  {pkg.length && pkg.breadth && pkg.height && (
                    <span className="text-[11px] text-muted-foreground font-normal ml-1">
                      ({pkg.length}×{pkg.breadth}×{pkg.height} cm)
                    </span>
                  )}
                </span>
              </div>
            );
          })()}

          {/* Pickup Scheduled */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Pickup Scheduled</span>
            <span className="font-medium text-right">
              {shipping?.pickupScheduledAt ? (
                formatDateTime(shipping.pickupScheduledAt)
              ) : (
                <span className="text-muted-foreground/70 italic">Not scheduled</span>
              )}
            </span>
          </div>

          {/* Tracking URL */}
          {shipping?.trackingUrl && (
            <div className="pt-2 border-t flex justify-between items-center">
              <span className="text-muted-foreground">Tracking Link</span>
              <a
                href={shipping.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
              >
                <span>Track Package</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>

        {/* Action Controls Section */}
        <div className="pt-3 border-t space-y-2">
          {/* Step 1: Create Order */}
          {!isShiprocketCreated ? (
            <Button
              type="button"
              className="w-full h-8 text-xs font-semibold gap-1.5 shadow-xs cursor-pointer"
              onClick={() => setIsCreateOrderModalOpen(true)}
            >
              <Send className="h-3.5 w-3.5" />
              Create Shiprocket Order
            </Button>
          ) : (
            <div className="space-y-2">
              {/* Order Status Banner */}
              <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div className="min-w-0 flex-1">
                  <span className="font-semibold block text-[11px]">Synced with Shiprocket</span>
                  <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80">
                    Order #{shipping.shiprocketOrderId || "Created"}
                  </span>
                </div>
              </div>

              {/* Step 2: Assign AWB Action Button */}
              {canAssignAwb && (
                <Button
                  type="button"
                  className="w-full h-8 text-xs font-semibold gap-1.5 bg-violet-600 hover:bg-violet-700 text-white shadow-xs cursor-pointer"
                  onClick={handleOpenAssignAwb}
                >
                  <Truck className="h-3.5 w-3.5" />
                  Assign AWB
                </Button>
              )}

              {/* AWB Assigned State Banner */}
              {isAwbAssigned && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/40 text-violet-800 dark:text-violet-300">
                  <Truck className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" />
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold block text-[11px]">AWB Assigned</span>
                    <span className="text-[10px] font-mono text-violet-700/80 dark:text-violet-400/80">
                      AWB: {shipping.awbCode} {shipping.courierName ? `• ${shipping.courierName}` : ""}
                    </span>
                  </div>
                </div>
              )}

              {/* Placeholder for Next Phase: Schedule Pickup */}
              <div className="pt-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="w-full h-7 text-[11px] gap-1 opacity-60"
                      >
                        <Clock className="h-3 w-3" />
                        Schedule Pickup
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    {isAwbAssigned
                      ? "Pickup scheduling will be enabled in next phase"
                      : "Assign AWB before scheduling pickup"}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {/* Package Details & Create Shiprocket Order Modal */}
      {!isShiprocketCreated && (
        <ShiprocketCreateOrderModal
          open={isCreateOrderModalOpen}
          onOpenChange={setIsCreateOrderModalOpen}
          order={order}
          onOrderUpdated={onOrderUpdated}
        />
      )}

      {/* Courier Selection & AWB Assignment Modal */}
      {canAssignAwb && (
        <ShiprocketAssignAwbModal
          open={isAssignAwbModalOpen}
          onOpenChange={setIsAssignAwbModalOpen}
          order={order}
          onOrderUpdated={onOrderUpdated}
        />
      )}
    </Card>
  );
};

export default ShiprocketCard;
