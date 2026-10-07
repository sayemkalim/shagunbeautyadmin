import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const updateOrder = async ({ 
  orderId, 
  status, 
  codPaymentMethod,
  addressId, 
  products = [], 
  bundles = [], 
  addProducts = [], 
  addBundles = [], 
  removeProducts = [],
  removeBundles = [],
  shippingCost,
  shippingDetails,
  packageData,
  package: pkg,
}) => {
  try {
    // Status is required by the API (fallback to current or "pending" if not provided)
    const orderStatus = status || "pending";

    const updateData = {
      status: orderStatus,
    };

    if (codPaymentMethod) {
      updateData.codPaymentMethod = codPaymentMethod;
    }
    
    // Add addressId if provided
    if (addressId) {
      updateData.addressId = addressId;
    }
    
    // Add shipping cost if provided
    if (shippingCost !== undefined) {
      updateData.shippingCost = shippingCost;
    }

    // Persist package dimensions to shippingDetails.package
    const packageToPersist = packageData || pkg || shippingDetails?.package;
    if (packageToPersist) {
      const numWeight = parseFloat(packageToPersist.weight);
      const numLength = parseFloat(packageToPersist.length);
      const numBreadth = parseFloat(packageToPersist.breadth ?? packageToPersist.width);
      const numHeight = parseFloat(packageToPersist.height);

      const isValid =
        !isNaN(numWeight) && numWeight > 0 &&
        !isNaN(numLength) && numLength > 0 &&
        !isNaN(numBreadth) && numBreadth > 0 &&
        !isNaN(numHeight) && numHeight > 0;

      if (isValid) {
        const formattedPkg = {
          weight: numWeight,
          length: numLength,
          breadth: numBreadth,
          height: numHeight,
        };

        console.log("PACKAGE DATA BEFORE SAVE", {
          weight: formattedPkg.weight,
          length: formattedPkg.length,
          breadth: formattedPkg.breadth,
          height: formattedPkg.height,
        });

        updateData.shippingDetails = {
          ...(shippingDetails || {}),
          package: formattedPkg,
        };
      } else if (shippingDetails) {
        updateData.shippingDetails = shippingDetails;
      }
    } else if (shippingDetails) {
      updateData.shippingDetails = shippingDetails;
    }
    
    // Add products if provided (for updating existing products)
    if (products && products.length > 0) {
      updateData.products = products.map(product => ({
        productId: product.productId,
        newQuantity: product.newQuantity
      }));
    }
    
    // Add bundles if provided (for updating existing bundles)
    if (bundles && bundles.length > 0) {
      updateData.bundles = bundles.map(bundle => ({
        bundleId: bundle.bundleId,
        newQuantity: bundle.newQuantity
      }));
    }

    // Add new products if provided
    if (addProducts && addProducts.length > 0) {
      updateData.addProducts = addProducts.map(product => ({
        productId: product.productId,
        quantity: product.quantity
      }));
    }

    // Add new bundles if provided
    if (addBundles && addBundles.length > 0) {
      updateData.addBundles = addBundles.map(bundle => ({
        bundleId: bundle.bundleId,
        quantity: bundle.quantity
      }));
    }

    // Add products to remove if provided
    if (removeProducts && removeProducts.length > 0) {
      updateData.removeProducts = removeProducts.map(product => ({
        productId: product.productId
      }));
    }

    // Add bundles to remove if provided
    if (removeBundles && removeBundles.length > 0) {
      updateData.removeBundles = removeBundles.map(bundle => ({
        bundleId: bundle.bundleId
      }));
    }

    const apiResponse = await apiService({
      endpoint: `${endpoints.order}/${orderId}`,
      method: "PATCH",
      data: updateData,
    });

    return apiResponse;
  } catch (error) {
    console.error("Error updating order:", error);
    throw error;
  }
};

/**
 * Persists package dimensions (weight, length, breadth, height) to order.shippingDetails.package
 */
export const saveOrderPackage = async ({ orderId, status = "pending", packageData }) => {
  return updateOrder({
    orderId,
    status,
    packageData,
  });
};

