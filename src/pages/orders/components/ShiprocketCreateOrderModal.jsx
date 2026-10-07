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
        newErrors.weight = "Weight must be greater than 0 kg";
      }
    }

    // 2. Length Validation
    if (!formData.length || String(formData.length).trim() === "") {
      newErrors.length = "Length is required";
    } else {
      const val = Number(formData.length);
      if (isNaN(val) || val <= 0) {
        newErrors.length = "Length must be greater than 0 cm";
      }
    }

    // 3. Breadth Validation
    if (!formData.breadth || String(formData.breadth).trim() === "") {
      newErrors.breadth = "Breadth / Width is required";
    } else {
      const val = Number(formData.breadth);
      if (isNaN(val) || val <= 0) {
        newErrors.breadth = "Breadth / Width must be greater than 0 cm";
      }
    }

    // 4. Height Validation
    if (!formData.height || String(formData.height).trim() === "") {
      newErrors.height = "Height is required";
    } else {
      const val = Number(formData.height);
      if (isNaN(val) || val <= 0) {
        newErrors.height = "Height must be greater than 0 cm";
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
      <DialogContent className="max-w-xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-xl">
        {/* Header */}
        <DialogHeader className="p-5 pb-3.5 border-b bg-muted/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Box className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Package Details for Shiprocket
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Exact package dimensions and weight for this shipment.
              </DialogDescription>
            </div>
          </div>

          {/* Quick info banner */}
          <div className="mt-3 p-2.5 rounded-lg bg-background/80 border text-[11px] flex justify-between items-center">
            <div>
              <span className="text-muted-foreground block text-[10px]">Order</span>
              <span className="font-semibold">
                {order?.orderNumber || order?.orderId || `#${orderId?.slice(-6)}`}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Pickup Location</span>
              <span className="font-medium text-foreground">Shagun Beauty</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Destination</span>
              <span className="font-medium text-foreground">
                {order?.address?.city || order?.address?.state || "India"}
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Form Body */}
        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto flex flex-col justify-between">
          <div className="p-5 space-y-4 text-xs">
            {/* 3D Box Dimensions Visual Guide */}
            <div className="p-3.5 rounded-xl bg-muted/30 border space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Ruler className="h-3.5 w-3.5 text-primary" />
                  Box Dimensions Illustration
                </span>
                <span className="text-[10px] text-muted-foreground">Dimensions in centimeters (cm)</span>
              </div>

              {/* 3D Box Diagram Graphic */}
              <div className="relative flex flex-col md:flex-row items-center justify-center gap-4 bg-background p-3.5 rounded-lg border">
                {/* SVG Isometric Box Illustration with Direct On-Box Labels */}
                <div className="relative w-52 h-36 flex items-center justify-center shrink-0">
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

                    {/* 1. LENGTH Dimension Line & Label (Blue) */}
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

                    {/* 2. WIDTH / BREADTH Dimension Line & Label (Green) */}
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
                      Width / B (W)
                    </text>

                    {/* 3. HEIGHT Dimension Line & Label (Purple) */}
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

                {/* Dimension Legend Badges */}
                <div className="space-y-2 flex-1 text-[11px] w-full">
                  {/* Length Legend */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-950 dark:text-blue-200">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                        <span className="font-bold">Length (L)</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground block">
                        Front horizontal length
                      </span>
                    </div>
                    <span className="font-mono font-bold text-xs bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded text-blue-800 dark:text-blue-300">
                      {formData.length ? `${formData.length} cm` : "—"}
                    </span>
                  </div>

                  {/* Breadth / Width Legend */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-950 dark:text-emerald-200">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-600 shrink-0" />
                        <span className="font-bold">Width / Breadth (W/B)</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground block">
                        Side horizontal width & depth
                      </span>
                    </div>
                    <span className="font-mono font-bold text-xs bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-800 dark:text-emerald-300">
                      {formData.breadth ? `${formData.breadth} cm` : "—"}
                    </span>
                  </div>

                  {/* Height Legend */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-violet-50/80 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900 text-violet-950 dark:text-violet-200">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-violet-600 shrink-0" />
                        <span className="font-bold">Height (H)</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground block">
                        Vertical height (top to bottom)
                      </span>
                    </div>
                    <span className="font-mono font-bold text-xs bg-violet-100 dark:bg-violet-900/60 px-2 py-0.5 rounded text-violet-800 dark:text-violet-300">
                      {formData.height ? `${formData.height} cm` : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Input Fields Section */}
            <div className="space-y-3">
              {/* 1. Weight Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="pkg-weight" className="text-xs font-semibold flex items-center gap-1.5">
                    <Scale className="h-3.5 w-3.5 text-primary" />
                    Package Weight (kg)
                    <span className="text-rose-500">*</span>
                  </Label>
                  <span className="text-[10px] text-muted-foreground">Dead weight in KG</span>
                </div>
                <Input
                  id="pkg-weight"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g. 5"
                  value={formData.weight}
                  onChange={(e) => handleChange("weight", e.target.value)}
                  className={cn("h-9 text-xs font-mono", errors.weight && "border-rose-500 ring-rose-500/20")}
                  disabled={isCreating}
                  autoFocus
                />
                {errors.weight && (
                  <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.weight}
                  </p>
                )}
              </div>

              {/* 2. Package Dimensions (Length, Breadth, Height) */}
              <div className="space-y-1.5 pt-1">
                <div className="grid grid-cols-3 gap-2.5">
                  {/* Length */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="pkg-length" className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                        Length (cm) *
                      </Label>
                    </div>
                    <Input
                      id="pkg-length"
                      type="number"
                      step="0.1"
                      min="0.1"
                      placeholder="e.g. 20"
                      value={formData.length}
                      onChange={(e) => handleChange("length", e.target.value)}
                      className={cn("h-9 text-xs font-mono border-blue-200 dark:border-blue-900", errors.length && "border-rose-500 ring-rose-500/20")}
                      disabled={isCreating}
                    />
                    {errors.length ? (
                      <p className="text-[10px] text-rose-500 font-medium">{errors.length}</p>
                    ) : (
                      <span className="text-[10px] text-muted-foreground block">Front length</span>
                    )}
                  </div>

                  {/* Breadth / Width */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="pkg-breadth" className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                        Breadth (cm) *
                      </Label>
                    </div>
                    <Input
                      id="pkg-breadth"
                      type="number"
                      step="0.1"
                      min="0.1"
                      placeholder="e.g. 30"
                      value={formData.breadth}
                      onChange={(e) => handleChange("breadth", e.target.value)}
                      className={cn("h-9 text-xs font-mono border-emerald-200 dark:border-emerald-900", errors.breadth && "border-rose-500 ring-rose-500/20")}
                      disabled={isCreating}
                    />
                    {errors.breadth ? (
                      <p className="text-[10px] text-rose-500 font-medium">{errors.breadth}</p>
                    ) : (
                      <span className="text-[10px] text-muted-foreground block">Side width</span>
                    )}
                  </div>

                  {/* Height */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="pkg-height" className="text-[11px] font-semibold text-violet-700 dark:text-violet-400 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-600" />
                        Height (cm) *
                      </Label>
                    </div>
                    <Input
                      id="pkg-height"
                      type="number"
                      step="0.1"
                      min="0.1"
                      placeholder="e.g. 30"
                      value={formData.height}
                      onChange={(e) => handleChange("height", e.target.value)}
                      className={cn("h-9 text-xs font-mono border-violet-200 dark:border-violet-900", errors.height && "border-rose-500 ring-rose-500/20")}
                      disabled={isCreating}
                    />
                    {errors.height ? (
                      <p className="text-[10px] text-rose-500 font-medium">{errors.height}</p>
                    ) : (
                      <span className="text-[10px] text-muted-foreground block">Top to bottom</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Calculated Weight Summary Box */}
              {(deadWeight > 0 || volumetricWeight > 0) && (
                <div className="mt-2 p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-amber-800 dark:text-amber-300 font-medium flex items-center gap-1">
                      <Zap className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                      Volumetric Weight:
                    </span>
                    <span className="font-mono font-semibold text-amber-900 dark:text-amber-200">
                      ({numLength || 0} × {numBreadth || 0} × {numHeight || 0}) / 5000 = {volumetricWeight} KG
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-amber-200/60 dark:border-amber-900/60 font-bold">
                    <span className="text-amber-900 dark:text-amber-200">
                      Applicable / Chargeable Weight:
                    </span>
                    <span className="font-mono text-sm text-primary">
                      {applicableWeight} KG
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="p-4 border-t bg-muted/20 flex flex-row items-center justify-end gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-8 text-xs font-semibold gap-1.5 min-w-[150px]"
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
