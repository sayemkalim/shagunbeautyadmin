import { useState, useEffect, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Package,
  Box,
  Scale,
  Ruler,
  Loader2,
  AlertCircle,
  Send,
  Zap,
  Warehouse,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { createShiprocketOrder } from "../helpers/createShiprocketOrder";
import { saveOrderPackage } from "../helpers/updateOrder";
import {
  extractPackageData,
  calculatePackageWeights,
} from "../helpers/extractPackageData";
import { cn } from "@/lib/utils";

export const ShiprocketCreateOrderModal = ({
  open,
  onOpenChange,
  order,
  onOrderUpdated,
}) => {
  const queryClient = useQueryClient();
  const orderId = order?._id;

  // Extract initial package dimensions dynamically from order data
  const initialPackageData = useMemo(() => {
    return extractPackageData(order);
  }, [order]);

  const [formData, setFormData] = useState(initialPackageData);
  const [errors, setErrors] = useState({});

  // Reset or initialize form when modal opens/closes or order/orderId updates
  useEffect(() => {
    if (open && order) {
      const extracted = extractPackageData(order);
      setFormData(extracted);
      setErrors({});
    } else if (!open) {
      setErrors({});
    }
  }, [open, orderId, order]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error on change
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  // Calculations for Volumetric Weight & Applicable (Chargeable) Weight using shared helper
  const {
    deadWeight,
    length: numLength,
    breadth: numBreadth,
    height: numHeight,
    volumetricWeight,
    applicableWeight,
  } = useMemo(() => {
    return calculatePackageWeights(formData);
  }, [formData]);

  const validate = () => {
    const newErrors = {};

    // 1. Weight Validation
    if (!formData.weight || String(formData.weight).trim() === "") {
      newErrors.weight = "Weight is required";
    } else {
      const val = Number(formData.weight);
      if (isNaN(val) || val <= 0) {
        newErrors.weight = "Weight must be > 0 kg";
      }
    }

    // 2. Length Validation
    if (!formData.length || String(formData.length).trim() === "") {
      newErrors.length = "Length is required";
    } else {
      const val = Number(formData.length);
      if (isNaN(val) || val <= 0) {
        newErrors.length = "Length must be > 0 cm";
      }
    }

    // 3. Breadth Validation
    if (!formData.breadth || String(formData.breadth).trim() === "") {
      newErrors.breadth = "Breadth is required";
    } else {
      const val = Number(formData.breadth);
      if (isNaN(val) || val <= 0) {
        newErrors.breadth = "Breadth must be > 0 cm";
      }
    }

    // 4. Height Validation
    if (!formData.height || String(formData.height).trim() === "") {
      newErrors.height = "Height is required";
    } else {
      const val = Number(formData.height);
      if (isNaN(val) || val <= 0) {
        newErrors.height = "Height must be > 0 cm";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { mutate: handleCreateOrder, isPending: isCreating } = useMutation({
    mutationFn: async () => {
      // Persist package to order.shippingDetails.package
      try {
        await saveOrderPackage({
          orderId,
          status: order?.status || "pending",
          packageData: formData,
        });
      } catch (err) {
        console.warn("Could not persist package to order before create:", err);
      }

      return createShiprocketOrder({
        orderId,
        pickup_location: "Shagun Beauty",
        weight: Number(formData.weight),
        length: Number(formData.length),
        breadth: Number(formData.breadth),
        height: Number(formData.height),
      });
    },
    onSuccess: (res) => {
      if (res?.error || res?.response?.success === false) {
        const errorMsg =
          res?.response?.data?.message ||
          res?.response?.message ||
          res?.message ||
          "Failed to create Shiprocket order.";
        toast.error(errorMsg);
        return;
      }

      const successMsg =
        res?.response?.message ||
        res?.response?.data?.message ||
        "Shiprocket order created successfully!";
      toast.success(successMsg);

      // Invalidate queries & trigger order refresh
      queryClient.invalidateQueries(["order", orderId]);
      queryClient.invalidateQueries(["orders"]);
      if (typeof onOrderUpdated === "function") {
        onOrderUpdated();
      }

      onOpenChange(false);
    },
    onError: (err) => {
      const errorMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "An error occurred while creating Shiprocket order.";
      toast.error(errorMsg);
    },
  });

  const onSubmit = (e) => {
    e?.preventDefault();
    if (!validate()) {
      toast.error("Please provide all required package dimensions and weight.");
      return;
    }
    handleCreateOrder();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-[680px] max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-2xl border border-border/80 shadow-2xl bg-card">
        {/* Header */}
        <DialogHeader className="p-5 pb-3.5 border-b bg-muted/20 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20">
                <Box className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold tracking-tight text-foreground">
                  Package Details for Shiprocket
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Exact package dimensions and dead weight for this shipment.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Quick Info Summary Bar */}
          <div className="mt-3.5 p-2.5 rounded-xl bg-muted/40 dark:bg-muted/15 border border-border/70 text-xs grid grid-cols-3 gap-2">
            <div className="space-y-0.5">
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold tracking-wider">Order</span>
              <span className="font-mono font-bold text-foreground">
                {order?.orderNumber || order?.orderId || `#${orderId?.slice(-6)}`}
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold tracking-wider flex items-center gap-1">
                <Warehouse className="h-2.5 w-2.5 text-violet-500" />
                Pickup Location
              </span>
              <span className="font-medium text-foreground">Shagun Beauty</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold tracking-wider flex items-center gap-1">
                <MapPin className="h-2.5 w-2.5 text-rose-500" />
                Destination
              </span>
              <span className="font-medium text-foreground truncate block">
                {order?.address?.city || order?.address?.state || order?.shippingAddress?.city || "Customer Address"}
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Form Body */}
        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto flex flex-col justify-between">
          <div className="p-5 space-y-4 text-xs">
            {/* 3D Box Dimensions Visual Guide */}
            <div className="p-3.5 rounded-xl bg-muted/30 dark:bg-muted/10 border border-border/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Ruler className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                  Box Dimensions Illustration
                </span>
                <span className="text-[10px] text-muted-foreground font-medium bg-background px-2 py-0.5 rounded border">
                  In centimeters (cm)
                </span>
              </div>

              {/* 3D Box Diagram Graphic */}
              <div className="relative flex flex-col sm:flex-row items-center justify-center gap-4 bg-background/90 p-3 rounded-lg border">
                {/* SVG Isometric Box Illustration */}
                <div className="relative w-48 h-32 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 240 180" className="w-full h-full drop-shadow-xs">
                    <defs>
                      <marker id="arrow-blue-c" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb" />
                      </marker>
                      <marker id="arrow-green-c" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#059669" />
                      </marker>
                      <marker id="arrow-purple-c" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#7c3aed" />
                      </marker>
                    </defs>

                    {/* Top Face */}
                    <polygon
                      points="110,25 180,55 110,85 40,55"
                      fill="#e2e8f0"
                      className="dark:fill-slate-800"
                      stroke="#64748b"
                      strokeWidth="1.5"
                    />
                    <text x="110" y="58" textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="600" className="dark:fill-slate-400">
                      TOP
                    </text>

                    {/* Left/Front Face */}
                    <polygon
                      points="40,55 110,85 110,145 40,115"
                      fill="#f8fafc"
                      className="dark:fill-slate-900"
                      stroke="#64748b"
                      strokeWidth="1.5"
                    />
                    <text x="75" y="105" textAnchor="middle" fontSize="11" fill="#475569" fontWeight="bold" className="dark:fill-slate-300">
                      FRONT
                    </text>

                    {/* Right/Side Face */}
                    <polygon
                      points="110,85 180,55 180,115 110,145"
                      fill="#cbd5e1"
                      className="dark:fill-slate-700"
                      stroke="#64748b"
                      strokeWidth="1.5"
                    />
                    <text x="145" y="105" textAnchor="middle" fontSize="11" fill="#475569" fontWeight="bold" className="dark:fill-slate-300">
                      SIDE
                    </text>

                    {/* 1. LENGTH Dimension Line (Blue) */}
                    <line
                      x1="32"
                      y1="124"
                      x2="102"
                      y2="154"
                      stroke="#2563eb"
                      strokeWidth="2.5"
                      markerStart="url(#arrow-blue-c)"
                      markerEnd="url(#arrow-blue-c)"
                    />
                    <rect x="36" y="146" width="62" height="18" rx="4" fill="#2563eb" />
                    <text x="67" y="159" textAnchor="middle" fontSize="9.5" fill="#ffffff" fontWeight="bold">
                      Length (L)
                    </text>

                    {/* 2. WIDTH / BREADTH Dimension Line (Green) */}
                    <line
                      x1="118"
                      y1="154"
                      x2="188"
                      y2="124"
                      stroke="#059669"
                      strokeWidth="2.5"
                      markerStart="url(#arrow-green-c)"
                      markerEnd="url(#arrow-green-c)"
                    />
                    <rect x="124" y="146" width="68" height="18" rx="4" fill="#059669" />
                    <text x="158" y="159" textAnchor="middle" fontSize="9.5" fill="#ffffff" fontWeight="bold">
                      Breadth (B)
                    </text>

                    {/* 3. HEIGHT Dimension Line (Purple) */}
                    <line
                      x1="192"
                      y1="55"
                      x2="192"
                      y2="115"
                      stroke="#7c3aed"
                      strokeWidth="2.5"
                      markerStart="url(#arrow-purple-c)"
                      markerEnd="url(#arrow-purple-c)"
                    />
                    <rect x="180" y="78" width="56" height="18" rx="4" fill="#7c3aed" />
                    <text x="208" y="91" textAnchor="middle" fontSize="9.5" fill="#ffffff" fontWeight="bold">
                      Height (H)
                    </text>
                  </svg>
                </div>

                {/* Live Dimension Badges */}
                <div className="space-y-1.5 flex-1 text-[11px] w-full">
                  {/* Length */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                      <span className="font-semibold text-blue-950 dark:text-blue-200">Length (L)</span>
                    </div>
                    <span className="font-mono font-bold text-xs bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded text-blue-800 dark:text-blue-300">
                      {formData.length ? `${formData.length} cm` : "0 cm"}
                    </span>
                  </div>

                  {/* Breadth */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-600 shrink-0" />
                      <span className="font-semibold text-emerald-950 dark:text-emerald-200">Breadth (B)</span>
                    </div>
                    <span className="font-mono font-bold text-xs bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-800 dark:text-emerald-300">
                      {formData.breadth ? `${formData.breadth} cm` : "0 cm"}
                    </span>
                  </div>

                  {/* Height */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-violet-50/80 dark:bg-violet-950/40 border border-violet-200/80 dark:border-violet-900">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-violet-600 shrink-0" />
                      <span className="font-semibold text-violet-950 dark:text-violet-200">Height (H)</span>
                    </div>
                    <span className="font-mono font-bold text-xs bg-violet-100 dark:bg-violet-900/60 px-2 py-0.5 rounded text-violet-800 dark:text-violet-300">
                      {formData.height ? `${formData.height} cm` : "0 cm"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Inputs Section: 4-Column Balanced Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Scale className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                  Package Weight & Dimensions
                </span>
                <span className="text-[10px] text-muted-foreground">All 4 fields required</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* 1. Weight Field */}
                <div className="space-y-1">
                  <Label htmlFor="pkg-weight" className="text-[11px] font-semibold text-foreground flex items-center justify-between">
                    <span>Weight (KG)</span>
                    <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="pkg-weight"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="e.g. 5"
                    value={formData.weight}
                    onChange={(e) => handleChange("weight", e.target.value)}
                    className={cn(
                      "h-8.5 text-xs font-mono bg-background border-border/80 focus-visible:ring-1 focus-visible:ring-violet-500",
                      errors.weight && "border-rose-500 focus-visible:ring-rose-500"
                    )}
                    disabled={isCreating}
                    autoFocus
                  />
                  {errors.weight && (
                    <p className="text-[10px] text-rose-500 font-medium">{errors.weight}</p>
                  )}
                </div>

                {/* 2. Length Field */}
                <div className="space-y-1">
                  <Label htmlFor="pkg-length" className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 flex items-center justify-between">
                    <span>Length (CM)</span>
                    <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="pkg-length"
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="e.g. 20"
                    value={formData.length}
                    onChange={(e) => handleChange("length", e.target.value)}
                    className={cn(
                      "h-8.5 text-xs font-mono bg-background border-border/80 focus-visible:ring-1 focus-visible:ring-blue-500",
                      errors.length && "border-rose-500 focus-visible:ring-rose-500"
                    )}
                    disabled={isCreating}
                  />
                  {errors.length && (
                    <p className="text-[10px] text-rose-500 font-medium">{errors.length}</p>
                  )}
                </div>

                {/* 3. Breadth Field */}
                <div className="space-y-1">
                  <Label htmlFor="pkg-breadth" className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
                    <span>Breadth (CM)</span>
                    <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="pkg-breadth"
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="e.g. 30"
                    value={formData.breadth}
                    onChange={(e) => handleChange("breadth", e.target.value)}
                    className={cn(
                      "h-8.5 text-xs font-mono bg-background border-border/80 focus-visible:ring-1 focus-visible:ring-emerald-500",
                      errors.breadth && "border-rose-500 focus-visible:ring-rose-500"
                    )}
                    disabled={isCreating}
                  />
                  {errors.breadth && (
                    <p className="text-[10px] text-rose-500 font-medium">{errors.breadth}</p>
                  )}
                </div>

                {/* 4. Height Field */}
                <div className="space-y-1">
                  <Label htmlFor="pkg-height" className="text-[11px] font-semibold text-violet-700 dark:text-violet-400 flex items-center justify-between">
                    <span>Height (CM)</span>
                    <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="pkg-height"
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="e.g. 30"
                    value={formData.height}
                    onChange={(e) => handleChange("height", e.target.value)}
                    className={cn(
                      "h-8.5 text-xs font-mono bg-background border-border/80 focus-visible:ring-1 focus-visible:ring-violet-500",
                      errors.height && "border-rose-500 focus-visible:ring-rose-500"
                    )}
                    disabled={isCreating}
                  />
                  {errors.height && (
                    <p className="text-[10px] text-rose-500 font-medium">{errors.height}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Live Calculated Weight Summary Bar */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-border/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 text-xs">
                <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span className="text-muted-foreground">
                  Volumetric: <strong className="font-mono text-foreground">{volumetricWeight} KG</strong>
                  {numLength > 0 && numBreadth > 0 && numHeight > 0 && (
                    <span className="text-[10px] text-muted-foreground/80 font-mono"> ({numLength}×{numBreadth}×{numHeight}/5000)</span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <span className="text-[11px] text-muted-foreground font-medium">Applicable:</span>
                <Badge variant="outline" className="h-5 px-2 text-[11px] font-mono font-bold bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border-violet-200 dark:border-violet-800">
                  {applicableWeight} KG
                </Badge>
              </div>
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="p-4 border-t bg-muted/20 flex flex-row items-center justify-end gap-2.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8.5 text-xs px-4"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-8.5 text-xs font-semibold gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white min-w-[170px] shadow-sm shadow-violet-500/25"
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Creating Order...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Create Shiprocket Order
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ShiprocketCreateOrderModal;

