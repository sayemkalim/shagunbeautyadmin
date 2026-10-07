import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Truck,
  Package,
  Check,
  Star,
  RefreshCw,
  AlertCircle,
  Loader2,
  BadgeCheck,
  Clock,
  ShieldCheck,
  Search,
  Scale,
  Ruler,
  Zap,
  Tag,
  Layers,
  ArrowDownNarrowWide,
  MapPin,
  Warehouse,
  X,
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  fetchShiprocketServiceability,
  SHAGUN_BEAUTY_PICKUP_PINCODE,
} from "../helpers/fetchShiprocketServiceability";
import { assignShiprocketAwb } from "../helpers/assignShiprocketAwb";
import { saveOrderPackage } from "../helpers/updateOrder";
import {
  extractPackageData,
  calculatePackageWeights,
} from "../helpers/extractPackageData";
import { getItem, setItem } from "@/utils/local_storage";
import { cn } from "@/lib/utils";

/**
 * Extracts and normalizes courier data directly from the raw Shiprocket serviceability API response.
 * Uses Shiprocket's dynamic recommendation metadata (recommended_courier_company_id / shiprocket_recommended_courier_id).
 * Strictly preserves courier.rate without modification or hardcoding.
 */
const extractShiprocketServiceabilityData = (response) => {
  if (!response) {
    return { couriers: [], recommendedCourierId: null, metadata: {} };
  }

  // Unwrap potential nesting from apiService and Shiprocket backend responses
  const payload =
    response?.response?.data ||
    response?.response ||
    response?.data ||
    response;

  const rawList =
    payload?.data?.available_courier_companies ||
    payload?.available_courier_companies ||
    payload?.data?.couriers ||
    payload?.couriers ||
    (Array.isArray(payload?.data) ? payload.data : null) ||
    (Array.isArray(payload) ? payload : []);

  // Sourced dynamically from Shiprocket metadata without hardcoding any courier IDs
  const recommendedCourierId =
    payload?.data?.recommended_courier_company_id ??
    payload?.data?.shiprocket_recommended_courier_id ??
    payload?.recommended_courier_company_id ??
    payload?.shiprocket_recommended_courier_id ??
    payload?.data?.recommended_by?.id ??
    payload?.recommended_by?.id ??
    null;

  const metadata = {
    isRecommendationEnabled:
      payload?.data?.is_recommendation_enabled ?? payload?.is_recommendation_enabled,
    recommendationLevel:
      payload?.data?.recommendation_level ?? payload?.recommendation_level,
    recommendedCourierCompanyId:
      payload?.data?.recommended_courier_company_id ?? payload?.recommended_courier_company_id,
    shiprocketRecommendedCourierId:
      payload?.data?.shiprocket_recommended_courier_id ?? payload?.shiprocket_recommended_courier_id,
    recommendedBy:
      payload?.data?.recommended_by ?? payload?.recommended_by,
  };

  if (!Array.isArray(rawList)) {
    return { couriers: [], recommendedCourierId, metadata };
  }

  const seenCourierIds = new Set();
  const couriers = [];

  rawList.forEach((item, index) => {
    const courierCompanyId =
      item?.courier_company_id ??
      item?.courier_id ??
      item?.id;

    if (courierCompanyId == null) return;

    // Handle duplicate courier entries safely
    const idKey = String(courierCompanyId);
    if (seenCourierIds.has(idKey)) return;
    seenCourierIds.add(idKey);

    const courierName =
      item?.courier_name ||
      item?.name ||
      item?.courier_company_name ||
      "Courier Partner";

    // 1. Primary rate strictly from courier.rate
    const rateVal = item?.rate;
    const rate =
      rateVal != null && !isNaN(Number(rateVal))
        ? Number(rateVal)
        : null;

    // 2. Freight charge from courier.freight_charge
    const freightChargeVal = item?.freight_charge;
    const freightCharge =
      freightChargeVal != null && !isNaN(Number(freightChargeVal))
        ? Number(freightChargeVal)
        : null;

    // 3. COD charges from courier.cod_charges
    const codChargesVal = item?.cod_charges;
    const codCharges =
      codChargesVal != null && !isNaN(Number(codChargesVal))
        ? Number(codChargesVal)
        : null;

    // 4. ETD and estimated_delivery_days
    const etd = item?.etd ? String(item.etd) : null;
    const estimatedDeliveryDays =
      item?.estimated_delivery_days != null
        ? Number(item.estimated_delivery_days)
        : item?.delivery_days != null
        ? Number(item.delivery_days)
        : item?.etd_hours != null
        ? Math.ceil(Number(item.etd_hours) / 24)
        : null;

    // 5. Rating
    const ratingVal =
      item?.rating ??
      item?.courier_rating ??
      item?.rating_score ??
      item?.score;
    const rating =
      ratingVal != null && !isNaN(Number(ratingVal))
        ? Number(ratingVal)
        : null;

    // 6. Charge weight
    const chargeWeightVal =
      item?.charge_weight ??
      item?.charged_weight ??
      item?.chargeable_weight ??
      item?.weight ??
      item?.min_weight;
    const chargeWeight =
      chargeWeightVal != null && !isNaN(Number(chargeWeightVal))
        ? Number(chargeWeightVal)
        : null;

    // 7. COD availability
    const codVal = item?.cod ?? item?.is_cod ?? item?.cod_available;
    const isCodAvailable =
      codVal === 1 ||
      codVal === "1" ||
      codVal === true ||
      String(codVal).toLowerCase() === "yes" ||
      String(codVal).toLowerCase() === "available";

    // 8. Dynamic recommendation flag strictly matching Shiprocket's recommended_lt === 1
    const isRecommended = Number(item?.recommended_lt) === 1;

    couriers.push({
      key: `courier-${courierCompanyId}-${index}`,
      courierCompanyId,
      courierId: courierCompanyId, // For Assign AWB payload
      courierName,
      rate,
      freightCharge,
      codCharges,
      etd,
      estimatedDeliveryDays,
      rating,
      chargeWeight,
      isCodAvailable,
      recommended_lt: item?.recommended_lt != null ? Number(item.recommended_lt) : null,
      isRecommended,
      raw: item,
    });
  });

  return { couriers, recommendedCourierId, metadata };
};

export const ShiprocketAssignAwbModal = ({
  open,
  onOpenChange,
  order,
  onOrderUpdated,
}) => {
  const queryClient = useQueryClient();
  const orderId = order?._id;
  const shipping = order?.shipping || {};

  // Extract delivery postcode strictly from order.address.pincode (with fallback)
  const initialDeliveryPostcode = useMemo(() => {
    return String(
      order?.address?.pincode ||
        order?.address?.postalCode ||
        order?.shippingAddress?.pincode ||
        order?.shippingAddress?.postalCode ||
        order?.shipping?.delivery_postcode ||
        shipping?.pincode ||
        ""
    ).trim();
  }, [order, shipping]);

  // Extract or load Shagun Beauty pickup location pincode (Fixed default: 206001)
  const initialPickupPostcode = useMemo(() => {
    return String(
      order?.shipping?.pickup_postcode ||
        order?.shipping?.pickupPostcode ||
        order?.pickup_postcode ||
        order?.pickupPostcode ||
        getItem("shiprocket_pickup_postcode") ||
        SHAGUN_BEAUTY_PICKUP_PINCODE
    ).trim();
  }, [order]);

  // Extract initial package dimensions & weight dynamically from order data
  const initialPackageData = useMemo(() => {
    return extractPackageData(order);
  }, [order]);

  const [pickupPostcode, setPickupPostcode] = useState(initialPickupPostcode);
  const [deliveryPostcode, setDeliveryPostcode] = useState(initialDeliveryPostcode);
  const [packageData, setPackageData] = useState(initialPackageData);
  const [selectedCourierId, setSelectedCourierId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSort, setFilterSort] = useState("recommended"); // "recommended" | "cheapest" | "fastest" | "topRated" | "all"

  // Sync state whenever modal opens or order/orderId changes (prevents stale state)
  useEffect(() => {
    if (open && order) {
      const extracted = extractPackageData(order);
      console.log("SHIPROCKET ORDER DATA", order);
      console.log("SHIPROCKET PACKAGE DATA", order?.package || order?.shipping?.package || order?.packageDetails || order?.shipping?.packageDetails || order?.shipping);
      console.log("SHIPROCKET WEIGHT", extracted.weight);
      console.log("SHIPROCKET LENGTH", extracted.length);
      console.log("SHIPROCKET BREADTH", extracted.breadth);
      console.log("SHIPROCKET HEIGHT", extracted.height);

      setPackageData(extracted);
      setSelectedCourierId(null);
      setSearchQuery("");
      setFilterSort("recommended");
      if (initialDeliveryPostcode) setDeliveryPostcode(initialDeliveryPostcode);
      if (initialPickupPostcode) setPickupPostcode(initialPickupPostcode);
    }
  }, [open, orderId, order, initialDeliveryPostcode, initialPickupPostcode]);

  const handlePickupPostcodeChange = (val) => {
    const cleaned = String(val).trim();
    setPickupPostcode(cleaned);
    if (cleaned.length >= 6) {
      setItem("shiprocket_pickup_postcode", cleaned);
    }
  };

  const handlePackageChange = (field, val) => {
    setPackageData((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  // Weight & Dimension Calculations using single-source utility
  const {
    deadWeight,
    length: pkgLength,
    breadth: pkgBreadth,
    height: pkgHeight,
    volumetricWeight,
    applicableWeight,
  } = useMemo(() => {
    return calculatePackageWeights(packageData);
  }, [packageData]);

  // Determine COD and Declared Value from Order
  const isCod = useMemo(() => {
    const paymentMethod = String(
      order?.paymentMethod ||
        order?.payment_method ||
        order?.paymentMode ||
        order?.payment_mode ||
        ""
    ).toLowerCase();
    return paymentMethod.includes("cod") || paymentMethod.includes("cash") ? 1 : 0;
  }, [order]);

  const declaredValue = useMemo(() => {
    const total =
      order?.finalTotalAmount ??
      order?.final_total_amount ??
      order?.grandTotal ??
      order?.grand_total ??
      order?.totalAmount ??
      order?.total ??
      0;
    return Number(total) > 0 ? Number(total) : 0;
  }, [order]);

  const isReturn = 0;

  const isQueryReady = Boolean(
    open &&
      orderId &&
      pickupPostcode &&
      pickupPostcode.length >= 3 &&
      deliveryPostcode &&
      deliveryPostcode.length >= 3
  );

  // Fetch serviceability couriers using exact package weight & dimensions
  const {
    data: serviceabilityResponse,
    isLoading: isCheckingCouriers,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "shiprocket-serviceability",
      orderId,
      pickupPostcode,
      deliveryPostcode,
      deadWeight,
      pkgLength,
      pkgBreadth,
      pkgHeight,
      isCod,
      declaredValue,
      isReturn,
    ],
    queryFn: () =>
      fetchShiprocketServiceability({
        orderId,
        pickup_postcode: pickupPostcode,
        delivery_postcode: deliveryPostcode,
        weight: deadWeight > 0 ? deadWeight : undefined,
        length: pkgLength > 0 ? pkgLength : undefined,
        breadth: pkgBreadth > 0 ? pkgBreadth : undefined,
        height: pkgHeight > 0 ? pkgHeight : undefined,
        cod: isCod,
        declared_value: declaredValue > 0 ? declaredValue : undefined,
        is_return: isReturn,
      }),
    enabled: isQueryReady,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Extract and process courier list and recommendation metadata
  const {
    couriers: availableCouriers,
    recommendedCourierId,
    metadata,
  } = useMemo(() => {
    return extractShiprocketServiceabilityData(serviceabilityResponse);
  }, [serviceabilityResponse]);

  // Log recommendation metadata and recommended couriers
  useEffect(() => {
    if (serviceabilityResponse && open) {
      console.log("Shiprocket recommendation metadata", {
        is_recommendation_enabled: metadata?.isRecommendationEnabled,
        recommendation_level: metadata?.recommendationLevel,
        recommended_courier_company_id: metadata?.recommendedCourierCompanyId,
        shiprocket_recommended_courier_id: metadata?.shiprocketRecommendedCourierId,
        recommended_by: metadata?.recommendedBy,
      });

      const recommendedCouriers = availableCouriers.filter(
        (c) => Number(c.recommended_lt) === 1
      );
      console.log("Recommended couriers (recommended_lt === 1)", recommendedCouriers);
    }
  }, [serviceabilityResponse, metadata, availableCouriers, open]);

  // Auto-select recommended courier if available, otherwise first courier
  useEffect(() => {
    if (availableCouriers.length > 0 && selectedCourierId === null) {
      const rec = availableCouriers.find((c) => Number(c.recommended_lt) === 1);
      if (rec) {
        setSelectedCourierId(rec.courierCompanyId);
      } else {
        setSelectedCourierId(availableCouriers[0].courierCompanyId);
      }
    }
  }, [availableCouriers, selectedCourierId]);

  // Reset selection on dialog close
  useEffect(() => {
    if (!open) {
      setSelectedCourierId(null);
      setSearchQuery("");
      setFilterSort("recommended");
    }
  }, [open]);

  // Derived filtered and sorted couriers based on the active tab (pure, non-mutating)
  const displayedCouriers = useMemo(() => {
    let list;

    switch (filterSort) {
      case "recommended": {
        // Filter strictly by Shiprocket recommended_lt === 1
        list = availableCouriers.filter(
          (courier) => Number(courier.recommended_lt) === 1
        );
        break;
      }
      case "cheapest": {
        // Sort by courier.rate ascending (lowest rate first)
        list = [...availableCouriers].sort(
          (a, b) => Number(a.rate || 0) - Number(b.rate || 0)
        );
        break;
      }
      case "fastest": {
        // Sort by estimated_delivery_days (lowest days first)
        list = [...availableCouriers].sort((a, b) => {
          const aDays = a.estimatedDeliveryDays != null ? a.estimatedDeliveryDays : 999;
          const bDays = b.estimatedDeliveryDays != null ? b.estimatedDeliveryDays : 999;
          if (aDays !== bDays) return aDays - bDays;
          return Number(a.rate || 0) - Number(b.rate || 0);
        });
        break;
      }
      case "topRated":
      case "rating": {
        // Sort by courier.rating descending (highest rating first)
        list = [...availableCouriers].sort(
          (a, b) => Number(b.rating || 0) - Number(a.rating || 0)
        );
        break;
      }
      case "all":
      default: {
        // Show all available couriers without filtering
        list = [...availableCouriers];
        break;
      }
    }

    // Apply search query filter if user typed in search box
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return list.filter(
        (c) =>
          c.courierName.toLowerCase().includes(q) ||
          String(c.courierCompanyId).includes(q)
      );
    }

    return list;
  }, [availableCouriers, filterSort, searchQuery]);

  // Count of recommended couriers (recommended_lt === 1)
  const recommendedCount = useMemo(() => {
    return availableCouriers.filter(
      (c) => Number(c.recommended_lt) === 1
    ).length;
  }, [availableCouriers]);

  // Mutation to persist package data to backend Order (shippingDetails.package)
  const { mutateAsync: savePackageMutation, isPending: isSavingPackage } = useMutation({
    mutationFn: (pkg) =>
      saveOrderPackage({
        orderId,
        status: order?.status || "pending",
        packageData: pkg,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["order", orderId]);
      queryClient.invalidateQueries(["orders"]);
      if (typeof onOrderUpdated === "function") {
        onOrderUpdated();
      }
    },
    onError: (err) => {
      console.warn("Could not persist package to order:", err);
    },
  });

  const handleRecalculateRates = async () => {
    const numWeight = parseFloat(packageData.weight);
    const numLength = parseFloat(packageData.length);
    const numBreadth = parseFloat(packageData.breadth);
    const numHeight = parseFloat(packageData.height);

    const hasValidPackage =
      !isNaN(numWeight) && numWeight > 0 &&
      !isNaN(numLength) && numLength > 0 &&
      !isNaN(numBreadth) && numBreadth > 0 &&
      !isNaN(numHeight) && numHeight > 0;

    // If valid package values exist, persist them to backend order.shippingDetails.package
    if (hasValidPackage) {
      try {
        await savePackageMutation(packageData);
        toast.success("Package dimensions updated and saved.");
      } catch (err) {
        console.warn("Failed to persist package data during recalculation:", err);
      }
    }
    refetch();
  };

  // Mutation to Assign AWB
  const { mutate: handleAssignAwb, isPending: isAssigningAwb } = useMutation({
    mutationFn: (courierIdToAssign) =>
      assignShiprocketAwb({
        orderId,
        courier_id: courierIdToAssign,
      }),
    onSuccess: (res) => {
      if (res?.error || res?.response?.success === false) {
        const errorMsg =
          res?.response?.data?.message ||
          res?.response?.message ||
          res?.message ||
          "Failed to assign AWB.";
        toast.error(errorMsg);
        return;
      }

      const successMsg =
        res?.response?.message ||
        res?.response?.data?.message ||
        "AWB assigned successfully!";
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
        "An error occurred while assigning AWB.";
      toast.error(errorMsg);
    },
  });

  const onConfirm = async () => {
    if (!selectedCourierId) {
      toast.error("Please select a courier to continue.");
      return;
    }
    const numWeight = parseFloat(packageData.weight);
    const numLength = parseFloat(packageData.length);
    const numBreadth = parseFloat(packageData.breadth);
    const numHeight = parseFloat(packageData.height);

    const hasValidPackage =
      !isNaN(numWeight) && numWeight > 0 &&
      !isNaN(numLength) && numLength > 0 &&
      !isNaN(numBreadth) && numBreadth > 0 &&
      !isNaN(numHeight) && numHeight > 0;

    if (hasValidPackage) {
      try {
        await savePackageMutation(packageData);
      } catch (err) {
        console.warn("Failed to persist package data before assigning AWB:", err);
      }
    }
    handleAssignAwb(selectedCourierId);
  };

  const selectedCourierObj = useMemo(() => {
    return availableCouriers.find((c) => c.courierCompanyId === selectedCourierId);
  }, [availableCouriers, selectedCourierId]);

  const hasNoCouriers =
    isQueryReady &&
    !isCheckingCouriers &&
    !isFetching &&
    !isError &&
    availableCouriers.length === 0;

  const errorMessage =
    serviceabilityResponse?.error ||
    serviceabilityResponse?.response?.success === false
      ? serviceabilityResponse?.response?.data?.message ||
        serviceabilityResponse?.response?.message ||
        serviceabilityResponse?.message ||
        "Failed to fetch available couriers."
      : error?.response?.data?.message ||
        error?.message ||
        "An error occurred while checking courier serviceability.";

  const isFailedResponse =
    Boolean(isError) ||
    Boolean(
      serviceabilityResponse &&
        (serviceabilityResponse.error ||
          serviceabilityResponse?.response?.success === false)
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl sm:max-w-[760px] max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-2xl border border-border/80 shadow-2xl bg-card">
        {/* Modal Header */}
        <DialogHeader className="p-5 pb-3.5 border-b bg-muted/20 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold tracking-tight text-foreground">
                  Select Courier Partner
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span>Order #{order?.orderNumber || order?.orderId || orderId?.slice(-6)}</span>
                  {shipping?.shipmentId && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-[11px] bg-muted px-1.5 py-0.2 rounded">
                        Shipment #{shipping.shipmentId}
                      </span>
                    </>
                  )}
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Configuration Card: Pincodes & Editable Package Dimensions */}
          <div className="mt-3.5 p-3.5 rounded-xl bg-muted/40 dark:bg-muted/15 border border-border/70 space-y-3 text-xs">
            {/* Top row: Pincodes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Pickup Pincode */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="awb-pickup-postcode" className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                    <Warehouse className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                    Pickup Pincode (Warehouse)
                  </Label>
                  <span className="text-[10px] text-muted-foreground font-medium bg-background/80 px-1.5 py-0.5 rounded border">
                    Shagun Beauty
                  </span>
                </div>
                <Input
                  id="awb-pickup-postcode"
                  type="text"
                  placeholder="e.g. 206001"
                  maxLength={6}
                  value={pickupPostcode}
                  onChange={(e) => handlePickupPostcodeChange(e.target.value)}
                  className="h-8 text-xs font-mono bg-background border-border/80 focus-visible:ring-1 focus-visible:ring-violet-500"
                />
              </div>

              {/* Delivery Pincode */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="awb-delivery-postcode" className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-rose-500" />
                    Delivery Pincode (Customer)
                  </Label>
                  <span className="text-[10px] text-muted-foreground font-medium bg-background/80 px-1.5 py-0.5 rounded border">
                    Destination
                  </span>
                </div>
                <Input
                  id="awb-delivery-postcode"
                  type="text"
                  placeholder="e.g. 110001"
                  maxLength={6}
                  value={deliveryPostcode}
                  onChange={(e) => setDeliveryPostcode(e.target.value.trim())}
                  className="h-8 text-xs font-mono bg-background border-border/80 focus-visible:ring-1 focus-visible:ring-violet-500"
                />
              </div>
            </div>

            {/* Package Dimensions */}
            <div className="pt-2.5 border-t border-border/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                  <Ruler className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                  Package Dimensions & Weight:
                </span>
                <span className="text-[10px] text-muted-foreground">Editable for live rate calculations</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Weight */}
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground font-medium">Weight (KG)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="KG"
                    value={packageData.weight}
                    onChange={(e) => handlePackageChange("weight", e.target.value)}
                    className="h-8 text-xs font-mono bg-background border-border/80 focus-visible:ring-1 focus-visible:ring-violet-500"
                  />
                </div>

                {/* Length */}
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground font-medium">Length (CM)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="L"
                    value={packageData.length}
                    onChange={(e) => handlePackageChange("length", e.target.value)}
                    className="h-8 text-xs font-mono bg-background border-border/80 focus-visible:ring-1 focus-visible:ring-violet-500"
                  />
                </div>

                {/* Breadth */}
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground font-medium">Breadth (CM)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="B"
                    value={packageData.breadth}
                    onChange={(e) => handlePackageChange("breadth", e.target.value)}
                    className="h-8 text-xs font-mono bg-background border-border/80 focus-visible:ring-1 focus-visible:ring-violet-500"
                  />
                </div>

                {/* Height */}
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground font-medium">Height (CM)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="H"
                    value={packageData.height}
                    onChange={(e) => handlePackageChange("height", e.target.value)}
                    className="h-8 text-xs font-mono bg-background border-border/80 focus-visible:ring-1 focus-visible:ring-violet-500"
                  />
                </div>
              </div>

              {/* Weight Preview & Recalculate Row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-border/50 bg-background/60 p-2.5 rounded-lg">
                <div className="flex items-center gap-3.5 flex-wrap text-xs">
                  <span className="text-muted-foreground">
                    Volumetric: <strong className="font-mono text-foreground">{volumetricWeight} KG</strong>
                    {pkgLength > 0 && pkgBreadth > 0 && pkgHeight > 0 && (
                      <span className="text-[10px] text-muted-foreground/80 font-mono"> ({pkgLength}×{pkgBreadth}×{pkgHeight}/5000)</span>
                    )}
                  </span>
                  <span className="text-muted-foreground flex items-center gap-1">
                    Applicable:
                    <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-mono font-bold bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border-violet-200 dark:border-violet-800">
                      {applicableWeight} KG
                    </Badge>
                  </span>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-7 text-xs font-medium px-3 gap-1.5 shrink-0 self-end sm:self-auto hover:bg-violet-100 dark:hover:bg-violet-950"
                  onClick={handleRecalculateRates}
                  disabled={!isQueryReady || isCheckingCouriers || isFetching || isSavingPackage}
                >
                  <RefreshCw className={cn("h-3 w-3", (isFetching || isSavingPackage) && "animate-spin text-violet-600")} />
                  Recalculate Rates
                </Button>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
          {/* Missing Postcode Prompt */}
          {!pickupPostcode && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800/50 space-y-2">
              <div className="flex items-start gap-2.5 text-amber-800 dark:text-amber-300">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div className="text-xs">
                  <p className="font-semibold">Pickup Pincode Required</p>
                  <p className="mt-0.5 text-amber-700 dark:text-amber-300/80">
                    Please enter the Shagun Beauty pickup warehouse pincode above to check available couriers and rates.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 1. Loading State */}
          {isQueryReady && (isCheckingCouriers || (isFetching && availableCouriers.length === 0)) && (
            <div className="py-14 flex flex-col items-center justify-center text-center space-y-3">
              <div className="relative">
                <div className="h-12 w-12 rounded-full border-4 border-violet-100 border-t-violet-600 animate-spin dark:border-violet-950 dark:border-t-violet-400" />
                <Truck className="h-5 w-5 text-violet-600 dark:text-violet-400 absolute inset-0 m-auto" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Fetching Available Couriers...</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Calculating real-time rates for {applicableWeight} KG ({pkgLength || "—"}×{pkgBreadth || "—"}×{pkgHeight || "—"} cm)
                </p>
              </div>
            </div>
          )}

          {/* 2. Error State */}
          {isQueryReady && !isCheckingCouriers && isFailedResponse && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800/50 space-y-3">
              <div className="flex items-start gap-2.5 text-rose-800 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <div className="text-xs">
                  <p className="font-semibold">Unable to fetch courier serviceability</p>
                  <p className="mt-0.5 text-rose-700 dark:text-rose-300/80">{errorMessage}</p>
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1.5 border-rose-300 hover:bg-rose-100 dark:border-rose-800"
                  onClick={() => refetch()}
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry
                </Button>
              </div>
            </div>
          )}

          {/* 3. Empty State (No Courier Available Across All Tabs) */}
          {hasNoCouriers && !isFailedResponse && (
            <div className="py-12 px-4 rounded-xl border border-dashed text-center space-y-3 bg-muted/20">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  No courier available
                </p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Shiprocket could not find any active courier partners delivering from {pickupPostcode} to {deliveryPostcode} for {applicableWeight} KG.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 mt-2"
                onClick={() => refetch()}
              >
                <RefreshCw className="h-3 w-3" />
                Refresh Serviceability
              </Button>
            </div>
          )}

          {/* 4. Couriers Available List */}
          {!isCheckingCouriers && !isFailedResponse && availableCouriers.length > 0 && (
            <div className="space-y-3">
              {/* Segmented Filter Tabs Bar */}
              <div className="bg-slate-100/90 dark:bg-zinc-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-zinc-700/60 flex items-center gap-1 overflow-x-auto">
                <button
                  type="button"
                  className={cn(
                    "flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex-1 whitespace-nowrap",
                    filterSort === "recommended"
                      ? "bg-white dark:bg-zinc-900 shadow-xs text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-zinc-800"
                  )}
                  onClick={() => setFilterSort("recommended")}
                >
                  <BadgeCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Recommended</span>
                  {recommendedCount > 0 && (
                    <span className="h-4 px-1.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {recommendedCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  className={cn(
                    "flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex-1 whitespace-nowrap",
                    filterSort === "cheapest"
                      ? "bg-white dark:bg-zinc-900 shadow-xs text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-zinc-800"
                  )}
                  onClick={() => setFilterSort("cheapest")}
                >
                  <ArrowDownNarrowWide className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Cheapest</span>
                </button>

                <button
                  type="button"
                  className={cn(
                    "flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex-1 whitespace-nowrap",
                    filterSort === "fastest"
                      ? "bg-white dark:bg-zinc-900 shadow-xs text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-zinc-800"
                  )}
                  onClick={() => setFilterSort("fastest")}
                >
                  <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span>Fastest</span>
                </button>

                <button
                  type="button"
                  className={cn(
                    "flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex-1 whitespace-nowrap",
                    filterSort === "topRated" || filterSort === "rating"
                      ? "bg-white dark:bg-zinc-900 shadow-xs text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-zinc-800"
                  )}
                  onClick={() => setFilterSort("topRated")}
                >
                  <Star className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span>Top Rated</span>
                </button>

                <button
                  type="button"
                  className={cn(
                    "flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex-1 whitespace-nowrap",
                    filterSort === "all"
                      ? "bg-white dark:bg-zinc-900 shadow-xs text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-zinc-800"
                  )}
                  onClick={() => setFilterSort("all")}
                >
                  <Layers className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>All</span>
                  <span className="text-[10px] text-muted-foreground">({availableCouriers.length})</span>
                </button>
              </div>

              {/* Full-width Search Bar */}
              <div className="relative w-full">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground/70" />
                <Input
                  placeholder="Search courier by name or company ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8.5 pl-9 pr-8 text-xs bg-card border-border/80 rounded-lg focus-visible:ring-1 focus-visible:ring-violet-500"
                />
                {searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Courier Option Cards List */}
              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                {/* Empty State for Search or Tab filter */}
                {displayedCouriers.length === 0 ? (
                  <div className="py-10 px-4 rounded-xl border border-dashed text-center space-y-2.5 bg-muted/10">
                    {filterSort === "recommended" && !searchQuery.trim() ? (
                      <>
                        <BadgeCheck className="h-7 w-7 text-muted-foreground/60 mx-auto" />
                        <p className="text-xs font-semibold text-foreground">
                          No recommended courier available
                        </p>
                        <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                          Shiprocket has not flagged a specific recommended partner for this route. Browse other tabs to pick the cheapest, fastest, or highest rated courier.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs mt-1"
                          onClick={() => setFilterSort("all")}
                        >
                          View All {availableCouriers.length} Couriers
                        </Button>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-6 w-6 text-muted-foreground/60 mx-auto" />
                        <p className="text-xs font-semibold text-foreground">
                          No courier found
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {searchQuery.trim()
                            ? `No couriers match "${searchQuery}".`
                            : "No couriers match the current filter."}
                        </p>
                        {searchQuery.trim() && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs text-primary"
                            onClick={() => setSearchQuery("")}
                          >
                            Clear Search
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  displayedCouriers.map((courier) => {
                    const isSelected = selectedCourierId === courier.courierCompanyId;

                    return (
                      <div
                        key={courier.key}
                        onClick={() => setSelectedCourierId(courier.courierCompanyId)}
                        className={cn(
                          "relative flex items-center justify-between p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-150 gap-3.5",
                          isSelected
                            ? "border-violet-600 bg-violet-50/50 dark:border-violet-500 dark:bg-violet-950/25 ring-1 ring-violet-600/40 shadow-xs"
                            : "border-border/80 bg-card hover:border-violet-300 dark:hover:border-zinc-700 hover:bg-slate-50/60 dark:hover:bg-zinc-900/40"
                        )}
                      >
                        {/* Left Side: Radio circle & Courier details */}
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          {/* Custom Radio Indicator */}
                          <div
                            className={cn(
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors mt-0.5",
                              isSelected
                                ? "border-violet-600 bg-violet-600 text-white shadow-xs"
                                : "border-muted-foreground/40 bg-transparent"
                            )}
                          >
                            {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                          </div>

                          {/* Info Column */}
                          <div className="space-y-1.5 min-w-0 flex-1">
                            {/* Courier Name & Badges */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs sm:text-sm text-foreground">
                                {courier.courierName}
                              </span>
                              <Badge
                                variant="outline"
                                className="font-mono text-[10px] px-1.5 py-0 h-4 bg-muted/60 text-muted-foreground border-border"
                              >
                                ID: {courier.courierCompanyId}
                              </Badge>
                              {courier.isRecommended && (
                                <Badge className="text-[10px] px-2 py-0 h-4.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold gap-1">
                                  <BadgeCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                  Recommended
                                </Badge>
                              )}
                            </div>

                            {/* Metrics Row: ETA, Rating, COD, Charged Wt */}
                            <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground flex-wrap">
                              {/* ETA / Estimated Delivery Days */}
                              {(courier.estimatedDeliveryDays != null || courier.etd) && (
                                <span className="inline-flex items-center gap-1 font-medium text-foreground/80 bg-muted/40 px-1.5 py-0.5 rounded border border-border/50">
                                  <Clock className="h-3 w-3 text-blue-500" />
                                  <span>
                                    {courier.estimatedDeliveryDays != null
                                      ? `${courier.estimatedDeliveryDays} Days`
                                      : courier.etd}
                                    {courier.estimatedDeliveryDays != null && courier.etd && (
                                      <span className="text-[10px] text-muted-foreground font-normal ml-1">
                                        ({courier.etd})
                                      </span>
                                    )}
                                  </span>
                                </span>
                              )}

                              {/* Rating */}
                              {courier.rating != null && (
                                <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900/50">
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                                  <span>{courier.rating.toFixed(1)}</span>
                                </span>
                              )}

                              {/* COD Availability */}
                              <span className="inline-flex items-center gap-1">
                                <ShieldCheck
                                  className={cn(
                                    "h-3 w-3",
                                    courier.isCodAvailable
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : "text-muted-foreground/60"
                                  )}
                                />
                                <span
                                  className={
                                    courier.isCodAvailable
                                      ? "text-emerald-700 dark:text-emerald-300 font-medium"
                                      : "text-muted-foreground/70"
                                  }
                                >
                                  {courier.isCodAvailable ? "COD Available" : "Prepaid Only"}
                                </span>
                              </span>

                              {/* Chargeable Weight */}
                              {courier.chargeWeight != null && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                                  <Scale className="h-3 w-3" />
                                  <span>{courier.chargeWeight} KG</span>
                                </span>
                              )}
                            </div>

                            {/* Additional breakdown: Freight & COD Fee */}
                            {(courier.freightCharge != null || (courier.codCharges != null && courier.codCharges > 0)) && (
                              <div className="text-[10px] text-muted-foreground/80 flex items-center gap-2 font-mono">
                                {courier.freightCharge != null && (
                                  <span>Freight: ₹{courier.freightCharge.toFixed(2)}</span>
                                )}
                                {courier.codCharges != null && courier.codCharges > 0 && (
                                  <span>• COD Charge: ₹{courier.codCharges.toFixed(2)}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right Side: Main Courier Rate (courier.rate) */}
                        <div className="text-right shrink-0 pl-3">
                          {courier.rate != null ? (
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-muted-foreground block font-medium uppercase tracking-wider">
                                Rate
                              </span>
                              <div className="text-base sm:text-lg font-bold text-foreground font-mono">
                                ₹{courier.rate.toFixed(2)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              Rate upon pickup
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <DialogFooter className="p-4 border-t bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-muted-foreground w-full sm:w-auto text-left">
            {selectedCourierObj ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <Truck className="h-4 w-4 text-violet-600 shrink-0" />
                <span>
                  Selected: <strong className="text-foreground">{selectedCourierObj.courierName}</strong>{" "}
                  (ID: {selectedCourierObj.courierCompanyId}
                  {selectedCourierObj.rate != null ? (
                    <> • <span className="font-mono font-bold text-foreground">₹{selectedCourierObj.rate.toFixed(2)}</span></>
                  ) : ""})
                </span>
              </div>
            ) : (
              <span>Please choose a courier partner above.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8.5 text-xs px-4"
              onClick={() => onOpenChange(false)}
              disabled={isAssigningAwb}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8.5 text-xs font-semibold gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white min-w-[135px] shadow-sm shadow-violet-500/25"
              onClick={onConfirm}
              disabled={
                !selectedCourierId ||
                isAssigningAwb ||
                isCheckingCouriers ||
                availableCouriers.length === 0
              }
            >
              {isAssigningAwb ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Assigning AWB...
                </>
              ) : (
                <>
                  <Truck className="h-3.5 w-3.5" />
                  Assign AWB
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShiprocketAssignAwbModal;

