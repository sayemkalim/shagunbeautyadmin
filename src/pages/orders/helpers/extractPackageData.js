/**
 * Helper to parse any number or numeric string (e.g. 5, "5", "5 KG", "5kg", "20 CM", "3.6").
 * Returns a clean numeric string or null if empty/invalid/<=0.
 */
const parseNumericValue = (val) => {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val === "number" && !isNaN(val) && val > 0) {
    return String(val);
  }
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (trimmed === "") return null;
    // Match first floating point or integer number
    const match = trimmed.match(/[-+]?[0-9]*\.?[0-9]+/);
    if (match) {
      const parsed = parseFloat(match[0]);
      if (!isNaN(parsed) && parsed > 0) {
        return String(parsed);
      }
    }
  }
  return null;
};

/**
 * Helper to parse composite dimension string (e.g. "20x30x30", "20 x 30 x 30 cm", "20*30*30").
 */
const parseDimensionString = (val) => {
  if (typeof val !== "string") return null;
  const match = val.match(/([0-9]*\.?[0-9]+)\s*[xX*×]\s*([0-9]*\.?[0-9]+)\s*[xX*×]\s*([0-9]*\.?[0-9]+)/);
  if (match) {
    const l = parseNumericValue(match[1]);
    const b = parseNumericValue(match[2]);
    const h = parseNumericValue(match[3]);
    if (l || b || h) {
      return { length: l || "", breadth: b || "", height: h || "" };
    }
  }
  return null;
};

/**
 * Extracts package dimensions and weight from an order object across all known
 * nested structures used by the backend, Shiprocket, and admin panel.
 * Single source of truth: order.shippingDetails.package
 */
export const extractPackageData = (order) => {
  if (!order || typeof order !== "object") {
    return { weight: "", length: "", breadth: "", height: "" };
  }

  // 1. Check primary single source of truth: order.shippingDetails.package
  const primaryPackage = order?.shippingDetails?.package;
  if (primaryPackage && typeof primaryPackage === "object" && !Array.isArray(primaryPackage)) {
    const w = parseNumericValue(primaryPackage.weight);
    const l = parseNumericValue(primaryPackage.length);
    const b = parseNumericValue(primaryPackage.breadth ?? primaryPackage.width);
    const h = parseNumericValue(primaryPackage.height);

    // Ignore corrupted backend placeholder { weight: null, breadth: null, height: null, length: 0.1 }
    const isCorruptedDefault =
      (!w || w === "") &&
      (!b || b === "") &&
      (!h || h === "") &&
      (l === "0.1" || parseFloat(l) <= 0.1);

    if (!isCorruptedDefault && (w || l || b || h)) {
      return {
        weight: w || "",
        length: l || "",
        breadth: b || "",
        height: h || "",
      };
    }
  }

  // Exhaustive list of potential candidate objects
  const candidateSources = [
    // shippingDetails nested
    order?.shippingDetails?.package_details,
    order?.shippingDetails?.packageDetails,
    order?.shippingDetails?.dimensions,
    order?.shippingDetails?.dimension,
    order?.shippingDetails?.shipping,
    order?.shippingDetails,

    // shipping nested
    order?.shipping?.package,
    order?.shipping?.package_details,
    order?.shipping?.packageDetails,
    order?.shipping?.dimensions,
    order?.shipping?.dimension,
    order?.shipping?.box,
    order?.shipping?.boxDetails,
    order?.shipping?.box_details,
    order?.shipping?.parcel,
    order?.shipping?.package_info,
    order?.shipping?.packageInfo,
    order?.shipping?.shiprocketOrder,
    order?.shipping?.shiprocket_order,
    order?.shipping?.shiprocketResponse,
    order?.shipping?.shiprocket_response,
    order?.shipping?.shiprocket_data,
    order?.shipping?.shiprocketData,
    order?.shipping?.shipment,
    order?.shipping,

    // shipping_details nested
    order?.shipping_details?.package,
    order?.shipping_details?.package_details,
    order?.shipping_details?.packageDetails,
    order?.shipping_details?.dimensions,
    order?.shipping_details,

    // shipping_info / shippingInfo
    order?.shippingInfo?.package,
    order?.shippingInfo?.packageDetails,
    order?.shippingInfo,
    order?.shipping_info?.package,
    order?.shipping_info?.package_details,
    order?.shipping_info,

    // root order package & dimensions
    order?.package,
    order?.package_details,
    order?.packageDetails,
    order?.package_info,
    order?.packageInfo,
    order?.dimensions,
    order?.dimension,
    order?.box,
    order?.boxDetails,
    order?.box_details,
    order?.parcel,
    order?.shipment,
    order?.shiprocket,
    order?.shiprocketDetails,
    order?.shiprocket_details,
    order?.shiprocketOrder,
    order?.shiprocket_order,
    order?.shiprocketResponse,
    order?.shiprocket_response,
    order?.shiprocketShipment,
    order?.shiprocket_shipment,
    order?.shiprocket_data,
    order?.shiprocketData,
    order?.customPackage,
    order?.custom_package,
    order?.data,
    order?.response,
    order?.order,
    order,
  ];

  let weight = "";
  let length = "";
  let breadth = "";
  let height = "";

  for (const s of candidateSources) {
    if (!s) continue;

    // 1. If candidate source is a string representing dimensions (e.g. "20x30x30 cm")
    if (typeof s === "string") {
      const parsedDim = parseDimensionString(s);
      if (parsedDim) {
        if (length === "" && parsedDim.length) length = parsedDim.length;
        if (breadth === "" && parsedDim.breadth) breadth = parsedDim.breadth;
        if (height === "" && parsedDim.height) height = parsedDim.height;
      }
      continue;
    }

    // Skip non-objects and Arrays (to prevent Array.length from being parsed as package length!)
    if (typeof s !== "object" || Array.isArray(s)) continue;

    // Check if s has any dimension string properties (e.g. s.dimensions = "20x30x30")
    const dimStringFields = [
      s.dimensions,
      s.dimension,
      s.dim,
      s.dims,
      s.size,
      s.package_dimensions,
      s.packageDimensions,
      s.box_dimensions,
      s.boxDimensions,
    ];
    for (const dStr of dimStringFields) {
      if (typeof dStr === "string") {
        const parsedDim = parseDimensionString(dStr);
        if (parsedDim) {
          if (length === "" && parsedDim.length) length = parsedDim.length;
          if (breadth === "" && parsedDim.breadth) breadth = parsedDim.breadth;
          if (height === "" && parsedDim.height) height = parsedDim.height;
        }
      }
    }

    // Weight extraction with all property variations
    if (weight === "") {
      const candidates = [
        s.weight,
        s.package_weight,
        s.packageWeight,
        s.pkg_weight,
        s.pkgWeight,
        s.dead_weight,
        s.deadWeight,
        s.weight_in_kg,
        s.weightKg,
        s.weight_kg,
        s.weightInKg,
        s.total_weight,
        s.totalWeight,
        s.net_weight,
        s.netWeight,
        s.gross_weight,
        s.grossWeight,
        s.actual_weight,
        s.actualWeight,
        s.wt,
      ];
      for (const val of candidates) {
        const parsed = parseNumericValue(val);
        if (parsed) {
          weight = parsed;
          break;
        }
      }
    }

    // Length extraction with all property variations (ignore 0.1 placeholder)
    if (length === "") {
      const candidates = [
        s.length,
        s.package_length,
        s.packageLength,
        s.pkg_length,
        s.pkgLength,
        s.len,
        s.length_cm,
        s.lengthCm,
        s.length_in_cm,
        s.lengthInCm,
        s.dim_length,
        s.dimLength,
      ];
      for (const val of candidates) {
        const parsed = parseNumericValue(val);
        if (parsed && parseFloat(parsed) > 0.1) {
          length = parsed;
          break;
        }
      }
    }

    // Breadth / Width extraction with all property variations
    if (breadth === "") {
      const candidates = [
        s.breadth,
        s.package_breadth,
        s.packageBreadth,
        s.pkg_breadth,
        s.pkgBreadth,
        s.width,
        s.package_width,
        s.packageWidth,
        s.pkg_width,
        s.pkgWidth,
        s.breadth_cm,
        s.breadthCm,
        s.width_cm,
        s.widthCm,
        s.breadth_in_cm,
        s.breadthInCm,
        s.width_in_cm,
        s.widthInCm,
        s.dim_breadth,
        s.dimBreadth,
        s.dim_width,
        s.dimWidth,
      ];
      for (const val of candidates) {
        const parsed = parseNumericValue(val);
        if (parsed) {
          breadth = parsed;
          break;
        }
      }
    }

    // Height extraction with all property variations
    if (height === "") {
      const candidates = [
        s.height,
        s.package_height,
        s.packageHeight,
        s.pkg_height,
        s.pkgHeight,
        s.ht,
        s.height_cm,
        s.heightCm,
        s.height_in_cm,
        s.heightInCm,
        s.dim_height,
        s.dimHeight,
      ];
      for (const val of candidates) {
        const parsed = parseNumericValue(val);
        if (parsed) {
          height = parsed;
          break;
        }
      }
    }
  }

  return {
    weight,
    length,
    breadth,
    height,
  };
};

/**
 * Calculates Volumetric Weight and Applicable Weight given package values.
 * Formula:
 * Volumetric Weight = (length × breadth × height) / 5000
 * Applicable Weight = max(dead weight, volumetric weight)
 */
export const calculatePackageWeights = ({ weight, length, breadth, height }) => {
  const numWeight = parseFloat(weight) || 0;
  const numLength = parseFloat(length) || 0;
  const numBreadth = parseFloat(breadth) || 0;
  const numHeight = parseFloat(height) || 0;

  let volumetricWeight = 0;
  if (numLength > 0 && numBreadth > 0 && numHeight > 0) {
    volumetricWeight = parseFloat(((numLength * numBreadth * numHeight) / 5000).toFixed(2));
  }

  let applicableWeight = 0;
  if (numWeight > 0 || volumetricWeight > 0) {
    applicableWeight = parseFloat(Math.max(numWeight, volumetricWeight).toFixed(2));
  }

  return {
    deadWeight: numWeight,
    length: numLength,
    breadth: numBreadth,
    height: numHeight,
    volumetricWeight,
    applicableWeight,
  };
};
