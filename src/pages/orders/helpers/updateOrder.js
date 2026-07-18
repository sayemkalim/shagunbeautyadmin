import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

export const updateOrder = async ({ 
  orderId, 
  status, 
  addressId, 
  products = [], 
  bundles = [], 
  addProducts = [], 
  addBundles = [], 
  removeProducts = [],
  removeBundles = [],
  shippingCost 
}) => {
  try {
    // Status is required by the API
    if (!status) {
      throw new Error("Status is required for order updates");
    }

    const updateData = {
      status, // Always include status as it's required
    };
    
    // Add addressId if provided
    if (addressId) {
      updateData.addressId = addressId;
    }
    
    // Add shipping cost if provided
    if (shippingCost !== undefined) {
      updateData.shippingCost = shippingCost;
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
