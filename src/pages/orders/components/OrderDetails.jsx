import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Plus, Minus, Save, Trash2, Mail, CreditCard, Edit, Package, Truck, DollarSign, Eye, EyeOff, Copy, Layers, FileDown } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import Typography from "@/components/typography";

import { fetchOrderById } from "../helpers/fetchOrderById";
import { updateOrder } from "../helpers/updateOrder";
import { generatePaymentLink } from "../helpers/generatePaymentLink";
import { fetchOrderBill } from "../helpers/fetchOrderBill";
import { triggerBillDownload } from "../helpers/triggerBillDownload";
import { fetchProducts } from "@/pages/products/components/helpers/fetchProducts";
import { fetchBundle } from "@/pages/bundles/helpers/fetchBundle";
import { getStatusBadgeClass } from "../helpers/statusBadge";
import { cn } from "@/lib/utils";

// Mirrors the discount-description format used in CouponsTable.jsx
const formatCouponDiscount = (coupon) => {
  if (coupon.discount_type === "percentage") {
    return `${coupon.discount_value}% off`;
  }
  return `₹${coupon.discount_value} off`;
};

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Helper function to refetch order data after any API call
  // Use this function in the onSuccess callback of any mutation that modifies order data
  const refetchOrderData = () => {
    queryClient.invalidateQueries(["order", orderId]);
  };

  // State for order items editing
  const [orderItems, setOrderItems] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  
  // State for status updates
  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusChanged, setStatusChanged] = useState(false);
  
  // State for shipping cost editing
  const [isEditingShipping, setIsEditingShipping] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingCostChanged, setShippingCostChanged] = useState(false);
  
  // State for adding items
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedBundles, setSelectedBundles] = useState([]);
  const [newItemQuantities, setNewItemQuantities] = useState({});
  
  // State for search functionality
  const [productSearchText, setProductSearchText] = useState("");
  const [bundleSearchText, setBundleSearchText] = useState("");

  // State for image preview dialog
  const [previewImage, setPreviewImage] = useState(null);

  const ORDER_STATUSES = [
    "pending",
    "processing", 
    "confirmed",
    "shipped",
    "delivered",
    "cancelled",
  ];

  // Fetch order from API
  const { data: orderResponse, isLoading: isLoadingOrder, error } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => fetchOrderById({ id: orderId }),
    enabled: !!orderId,
  });

  const order = orderResponse?.response?.data;

  // Fetch products and bundles for adding to order
  const { data: productsResponse } = useQuery({
    queryKey: ["products-for-order"],
    queryFn: () => fetchProducts({ params: { page: 1, per_page: 1000, is_active: true } }),
  });

  const { data: bundlesResponse } = useQuery({
    queryKey: ["bundles-for-order"],
    queryFn: () => fetchBundle({ params: { page: 1, per_page: 1000, is_active: true } }),
  });

  // Lookup map of the freshest product data (incl. price_tiers) by product id,
  // sourced from the product API rather than the order's (possibly stale) populated snapshot.
  const productsById = useMemo(() => {
    const map = {};
    (productsResponse?.data || []).forEach((product) => {
      map[product._id] = product;
    });
    return map;
  }, [productsResponse]);

  // Lookup map of fresh bundle data by bundle id
  const bundlesById = useMemo(() => {
    const map = {};
    (bundlesResponse?.data?.data || []).forEach((bundle) => {
      map[bundle._id] = bundle;
    });
    return map;
  }, [bundlesResponse]);

  // Helper to extract image URL for an item (product or bundle)
  const getItemImage = (item) => {
    if (!item) return null;

    // Direct image properties on item
    if (item.banner_image) return item.banner_image;
    if (typeof item.image === "string" && item.image) return item.image;
    if (Array.isArray(item.images) && item.images.length > 0) {
      const first = item.images[0];
      return typeof first === "string" ? first : first?.url || null;
    }

    // Direct product object on item
    if (item.product && typeof item.product === "object") {
      const p = item.product;
      if (p.banner_image) return p.banner_image;
      if (Array.isArray(p.images) && p.images.length > 0) {
        const first = p.images[0];
        return typeof first === "string" ? first : first?.url || null;
      }
      if (typeof p.images === "string" && p.images) return p.images;
      if (typeof p.image === "string" && p.image) return p.image;
      if (p.thumbnail) return p.thumbnail;
    }

    // Lookup product from productsById
    const productId = item.product?._id || (typeof item.product === "string" ? item.product : null) || item.productId;
    if (productId && productsById[productId]) {
      const p = productsById[productId];
      if (p.banner_image) return p.banner_image;
      if (Array.isArray(p.images) && p.images.length > 0) {
        const first = p.images[0];
        return typeof first === "string" ? first : first?.url || null;
      }
      if (typeof p.images === "string" && p.images) return p.images;
      if (p.image) return p.image;
    }

    // Direct bundle object on item
    if (item.bundle && typeof item.bundle === "object") {
      const b = item.bundle;
      if (b.banner_image) return b.banner_image;
      if (Array.isArray(b.images) && b.images.length > 0) {
        const first = b.images[0];
        return typeof first === "string" ? first : first?.url || null;
      }
      if (typeof b.images === "string" && b.images) return b.images;
      if (typeof b.image === "string" && b.image) return b.image;
      if (b.thumbnail) return b.thumbnail;
    }

    // Lookup bundle from bundlesById
    const bundleId = item.bundle?._id || (typeof item.bundle === "string" ? item.bundle : null) || item.bundleId;
    if (bundleId && bundlesById[bundleId]) {
      const b = bundlesById[bundleId];
      if (b.banner_image) return b.banner_image;
      if (Array.isArray(b.images) && b.images.length > 0) {
        const first = b.images[0];
        return typeof first === "string" ? first : first?.url || null;
      }
      if (typeof b.images === "string" && b.images) return b.images;
      if (b.image) return b.image;
    }

    return null;
  };

  // Returns the allowed quantities for a product ([1, ...tier quantities]) or null if unrestricted.
  const getAllowedQuantities = (productId) => {
    const tiers = productsById[productId]?.price_tiers;
    if (!Array.isArray(tiers) || tiers.length === 0) return null;
    return [1, ...tiers.map((t) => t.quantity).sort((a, b) => a - b)];
  };

  // Update order mutation using real API
  const { mutate: updateOrderMutation, isLoading: isUpdating } = useMutation({
    mutationFn: (updateData) => updateOrder(updateData),
    onSuccess: (res) => {
      // apiService never throws on API errors — it resolves with an
      // error-shaped object instead, so success must be checked explicitly.
      if (res?.error || res?.response?.success === false) {
        toast.error(res?.response?.data?.message || "Failed to update order. Please try again.");
        return;
      }
      toast.success("Order updated successfully.");
      setHasChanges(false);
      setStatusChanged(false);
      // Refetch the order data to get the latest state
      refetchOrderData();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to update order. Please try again.");
    },
  });

  // Generate payment link mutation
  const { mutate: generatePaymentLinkMutation, isLoading: isGeneratingPaymentLink } = useMutation({
    mutationFn: ({ orderId, amount }) => generatePaymentLink({ orderId, amount }),
    onSuccess: () => {
      toast.success("Payment link generated successfully!");
      // Refetch the order data to get the updated payment link
      refetchOrderData();
    },
    onError: () => {
      toast.error("Failed to generate payment link. Please try again.");
    },
  });

  // Fetch invoice/bill mutation
  const { mutate: fetchOrderBillMutation, isLoading: isFetchingBill } = useMutation({
    mutationFn: () => fetchOrderBill({ id: orderId }),
    onSuccess: (res) => {
      // apiService never throws on API errors — it resolves with an
      // error-shaped object instead, so success must be checked explicitly.
      if (res?.error || res?.response?.success === false) {
        toast.error(res?.response?.data?.message || "Failed to fetch invoice. Please try again.");
        return;
      }
      const downloaded = triggerBillDownload(res?.response?.data);
      if (!downloaded) {
        toast.error("Invoice URL not available.");
      }
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to fetch invoice. Please try again.");
    },
  });


  // Initialize order items and status when order data loads
  useEffect(() => {
    if (order?.items) {
      setOrderItems([...order.items]);
    }
    if (order?.status) {
      setSelectedStatus(order.status);
    }
    if (order?.shippingCost !== undefined) {
      setShippingCost(order.shippingCost);
    }
  }, [order]);

  // Update quantity of an item
  const updateItemQuantity = (itemIndex, newQuantity) => {
    if (newQuantity < 1) return;
    
    setOrderItems(prev => 
      prev.map((item, index) => 
        index === itemIndex 
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
    setHasChanges(true);
  };

  // Remove item from order (set quantity to 0)
  const removeItem = (itemIndex) => {
    setOrderItems(prev => 
      prev.map((item, index) => 
        index === itemIndex 
          ? { ...item, quantity: 0 }
          : item
      )
    );
    setHasChanges(true);
  };

  // Handle status change
  const handleStatusChange = (newStatus) => {
    setSelectedStatus(newStatus);
    setStatusChanged(newStatus !== (order.status || ''));
  };

  // Handle shipping cost editing
  const handleShippingCostChange = (newCost) => {
    setShippingCost(newCost);
    setShippingCostChanged(newCost !== (order.shippingCost || 0));
  };

  const toggleShippingEdit = () => {
    setIsEditingShipping(!isEditingShipping);
    if (isEditingShipping) {
      // Reset to original value if canceling edit
      setShippingCost(order.shippingCost || 0);
      setShippingCostChanged(false);
    }
  };

  // Filter products based on search text
  const filteredProducts = productsResponse?.data?.filter(product => 
    product.name.toLowerCase().includes(productSearchText.toLowerCase()) ||
    product.sku?.toLowerCase().includes(productSearchText.toLowerCase())
  ) || [];

  // Filter bundles based on search text
  const filteredBundles = bundlesResponse?.data?.data?.filter(bundle => 
    bundle.name.toLowerCase().includes(bundleSearchText.toLowerCase())
  ) || [];

  // Handle adding new items
  const handleAddItems = () => {
    const newItems = [];
    
    // Add selected products
    selectedProducts.forEach(productId => {
      const product = productsResponse?.data?.find(p => p._id === productId);
      if (product) {
        newItems.push({
          type: "product",
          product: product,
          quantity: newItemQuantities[productId] || 1,
          total_amount: product.discounted_price || product.price || 0,
          discounted_total_amount: (product.discounted_price || product.price || 0) * (newItemQuantities[productId] || 1)
        });
      }
    });

    // Add selected bundles
    selectedBundles.forEach(bundleId => {
      const bundle = bundlesResponse?.data?.data?.find(b => b._id === bundleId);
      if (bundle) {
        newItems.push({
          type: "bundle",
          bundle: bundle,
          quantity: newItemQuantities[bundleId] || 1,
          total_amount: bundle.discounted_price || bundle.price || 0,
          discounted_total_amount: (bundle.discounted_price || bundle.price || 0) * (newItemQuantities[bundleId] || 1)
        });
      }
    });

    if (newItems.length > 0) {
      setOrderItems(prev => [...prev, ...newItems]);
      setHasChanges(true);
      setShowAddItemDialog(false);
      setSelectedProducts([]);
      setSelectedBundles([]);
      setNewItemQuantities({});
      setProductSearchText("");
      setBundleSearchText("");
      toast.success(`${newItems.length} item(s) added to order`);
    }
  };

  // Update entire order (status + items + shipping)
  const handleUpdateOrder = async () => {
    try {
      // If no changes, show info message
      if (!statusChanged && !hasChanges && !shippingCostChanged) {
        toast.info("No changes to update");
        return;
      }

      // Prepare update data using the new format
      const updateData = {
        orderId,
        // Always include status as it's required by the API
        status: selectedStatus,
      };

      // Add shipping cost if changed
      if (shippingCostChanged) {
        updateData.shippingCost = shippingCost;
      }

      // Add products if items changed
      if (hasChanges) {
        // Get original order items to compare with current items
        const originalItems = order?.items || [];
        
        // Separate existing items (being updated) from new items (being added)
        const existingProducts = [];
        const existingBundles = [];
        const newProducts = [];
        const newBundles = [];
        const removedProducts = [];
        const removedBundles = [];

        // Check for items that were removed (exist in original but not in current)
        originalItems.forEach(originalItem => {
          const stillExists = orderItems.some(currentItem => {
            if (originalItem.product?._id && currentItem.product?._id) {
              return originalItem.product._id === currentItem.product._id;
            }
            if (originalItem.bundle?._id && currentItem.bundle?._id) {
              return originalItem.bundle._id === currentItem.bundle._id;
            }
            return false;
          });

          if (!stillExists) {
            // This item was removed
            if (originalItem.product?._id) {
              removedProducts.push({
                productId: originalItem.product._id,
              });
            }
            if (originalItem.bundle?._id) {
              removedBundles.push({
                bundleId: originalItem.bundle._id,
              });
            }
          }
        });

        // Check current items to categorize them
        orderItems.forEach(item => {
          // Skip items with quantity 0 (removed items)
          if (item.quantity === 0) return;

          // Check if this item existed in the original order
          const wasInOriginal = originalItems.some(originalItem => {
            if (item.product?._id && originalItem.product?._id) {
              return originalItem.product._id === item.product._id;
            }
            if (item.bundle?._id && originalItem.bundle?._id) {
              return originalItem.bundle._id === item.bundle._id;
            }
            return false;
          });

          if (wasInOriginal) {
            // This is an existing item being updated
            if (item.product?._id) {
              existingProducts.push({
                productId: item.product._id,
                newQuantity: item.quantity,
              });
            }
            if (item.bundle?._id) {
              existingBundles.push({
                bundleId: item.bundle._id,
                newQuantity: item.quantity,
              });
            }
          } else {
            // This is a new item being added
            if (item.product?._id) {
              newProducts.push({
                productId: item.product._id,
                quantity: item.quantity,
              });
            }
            if (item.bundle?._id) {
              newBundles.push({
                bundleId: item.bundle._id,
                quantity: item.quantity,
              });
            }
          }
        });

        // Handle removed items (items that existed in original but have quantity 0 in current)
        originalItems.forEach(originalItem => {
          const currentItem = orderItems.find(currentItem => {
            if (originalItem.product?._id && currentItem.product?._id) {
              return originalItem.product._id === currentItem.product._id;
            }
            if (originalItem.bundle?._id && currentItem.bundle?._id) {
              return originalItem.bundle._id === currentItem.bundle._id;
            }
            return false;
          });

          // If item exists in current but has quantity 0, it was removed
          if (currentItem && currentItem.quantity === 0) {
            if (originalItem.product?._id) {
              existingProducts.push({
                productId: originalItem.product._id,
                newQuantity: 0,
              });
            }
            if (originalItem.bundle?._id) {
              existingBundles.push({
                bundleId: originalItem.bundle._id,
                newQuantity: 0,
              });
            }
          }
        });

        // Add existing items to update
        if (existingProducts.length > 0) {
          updateData.products = existingProducts;
        }
        if (existingBundles.length > 0) {
          updateData.bundles = existingBundles;
        }

        // Add new items to add
        if (newProducts.length > 0) {
          updateData.addProducts = newProducts;
        }
        if (newBundles.length > 0) {
          updateData.addBundles = newBundles;
        }

        // Add items to remove
        if (removedProducts.length > 0) {
          updateData.removeProducts = removedProducts;
        }
        if (removedBundles.length > 0) {
          updateData.removeBundles = removedBundles;
        }
      }

      updateOrderMutation(updateData);
    } catch (error) {
      toast.error("Failed to prepare order update.");
    }
  };

  // Copy payment link to clipboard
  const handleCopyPaymentLink = async () => {
    if (order?.paymentLink) {
      try {
        await navigator.clipboard.writeText(order.paymentLink);
        toast.success("Payment link copied to clipboard!");
      } catch (error) {
        toast.error("Failed to copy payment link");
      }
    } else {
      toast.error("No payment link available");
    }
  };

  // Generate payment link
  const handleGeneratePaymentLink = () => {
    const totalAmount = calculateTotal();
    generatePaymentLinkMutation({ 
      orderId, 
      amount: totalAmount 
    });
  };

  // Calculate original items total (before product discounts)
  const calculateOriginalItemsTotal = () => {
    if (!hasChanges && order?.totalAmount !== undefined && order?.totalAmount !== null) {
      return Number(order.totalAmount);
    }
    return orderItems
      .filter(item => item.quantity > 0)
      .reduce((total, item) => {
        const isProduct = item.type === "product" || item.product;
        const isBundle = item.type === "bundle" || item.bundle;
        const targetProduct = isProduct ? (item.product || productsById[item.product?._id || item.productId]) : null;
        const targetBundle = isBundle ? (item.bundle || bundlesById[item.bundle?._id || item.bundleId]) : null;

        const originalPrice = isProduct 
          ? (targetProduct?.price ?? item.price ?? (item.total_amount && item.quantity ? item.total_amount / item.quantity : 0))
          : (targetBundle?.price ?? item.price ?? (item.total_amount && item.quantity ? item.total_amount / item.quantity : 0));

        return total + (Number(originalPrice) || 0) * (item.quantity || 0);
      }, 0);
  };

  // Calculate discounted items total (after product discounts, before coupon and shipping)
  const calculateDiscountedItemsTotal = () => {
    if (!hasChanges && order?.discountedTotalAmount !== undefined && order?.discountedTotalAmount !== null) {
      return Number(order.discountedTotalAmount);
    }
    return orderItems
      .filter(item => item.quantity > 0)
      .reduce((total, item) => {
        const isProduct = item.type === "product" || item.product;
        const isBundle = item.type === "bundle" || item.bundle;
        const targetProduct = isProduct ? (item.product || productsById[item.product?._id || item.productId]) : null;
        const targetBundle = isBundle ? (item.bundle || bundlesById[item.bundle?._id || item.bundleId]) : null;

        const originalPrice = isProduct 
          ? (targetProduct?.price ?? item.price ?? (item.total_amount && item.quantity ? item.total_amount / item.quantity : 0))
          : (targetBundle?.price ?? item.price ?? (item.total_amount && item.quantity ? item.total_amount / item.quantity : 0));

        const discountedPrice = isProduct 
          ? (targetProduct?.discounted_price ?? item.discounted_price ?? (item.discounted_total_amount && item.quantity ? item.discounted_total_amount / item.quantity : null))
          : (targetBundle?.discounted_price ?? item.discounted_price ?? (item.discounted_total_amount && item.quantity ? item.discounted_total_amount / item.quantity : null));

        const hasDiscount = discountedPrice !== null && discountedPrice !== undefined && Number(discountedPrice) > 0 && Number(discountedPrice) < Number(originalPrice);
        const price = hasDiscount ? Number(discountedPrice) : Number(originalPrice || 0);

        return total + price * (item.quantity || 0);
      }, 0);
  };

  const originalItemsTotal = calculateOriginalItemsTotal();
  const discountedItemsTotal = calculateDiscountedItemsTotal();
  const productDiscount = Math.max(0, originalItemsTotal - discountedItemsTotal);
  const couponDiscount = Number(order?.couponDiscountAmount || 0);

  // Calculate totals
  const calculateTotal = () => {
    if (!hasChanges && !shippingCostChanged && order?.finalTotalAmount !== undefined && order?.finalTotalAmount !== null) {
      return Number(order.finalTotalAmount);
    }
    return Math.max(0, discountedItemsTotal - couponDiscount) + (shippingCost || 0);
  };

  const finalTotal = calculateTotal();

  if (isLoadingOrder) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        {/* Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-28" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Items Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                <Skeleton className="h-16 w-16 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-8" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions Skeleton */}
        <div className="flex justify-between items-center pt-4">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-28" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Typography variant="h3" className="text-destructive">Order Not Found</Typography>
        <Typography variant="p" className="text-muted-foreground">
          Order with ID "{orderId}" could not be found.
        </Typography>
        <Button onClick={() => navigate("/orders")} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/orders")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <Typography variant="h3">Order Details</Typography>
            <Typography variant="small" className="text-muted-foreground">
              Order ID: {order._id}
            </Typography>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Status Update Section */}
          <div className="flex items-center gap-2">
            <Typography variant="small" className="text-muted-foreground">Status:</Typography>
            <Select value={selectedStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {statusChanged && (
              <Typography variant="small" className="text-amber-600 dark:text-amber-400 font-medium">
                Status Changed
              </Typography>
            )}
          </div>

          {/* Generate Payment Link Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleGeneratePaymentLink}
            disabled={isGeneratingPaymentLink}
            className="flex items-center gap-2"
          >
            <CreditCard className="h-4 w-4" />
            {isGeneratingPaymentLink ? "Generating..." : "Generate Payment Link"}
          </Button>

          {/* Download Invoice Button */}
          {order.status === "pending" ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="flex items-center gap-2"
                  >
                    <FileDown className="h-4 w-4" />
                    Download Invoice
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Available once the order is confirmed</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchOrderBillMutation()}
              disabled={isFetchingBill}
              className="flex items-center gap-2"
            >
              <FileDown className="h-4 w-4" />
              {isFetchingBill ? "Loading..." : "Download Invoice"}
            </Button>
          )}
        </div>
      </div>

      {/* Order Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Typography variant="small" className="text-muted-foreground">Name</Typography>
              <Typography variant="p" className="font-medium">{order.address?.name || 'N/A'}</Typography>
            </div>
            <div>
              <Typography variant="small" className="text-muted-foreground">Email</Typography>
              <Typography variant="p">{order.user?.email || 'N/A'}</Typography>
            </div>
            <div>
              <Typography variant="small" className="text-muted-foreground">Phone</Typography>
              <Typography variant="p">{order.address?.mobile || 'N/A'}</Typography>
            </div>
          </CardContent>
        </Card>

        {/* Order Information */}
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Typography variant="small" className="text-muted-foreground">Order Date</Typography>
              <Typography variant="p" className="font-medium">
                {order.createdAt ? format(new Date(order.createdAt), "dd/MM/yyyy hh:mm a") : 'N/A'}
              </Typography>
            </div>
            <div>
              <Typography variant="small" className="text-muted-foreground">Last Updated</Typography>
              <Typography variant="p" className="font-medium">
                {order.updatedAt ? format(new Date(order.updatedAt), "dd/MM/yyyy hh:mm a") : 'N/A'}
              </Typography>
            </div>
            <div>
              <Typography variant="small" className="text-muted-foreground">Status</Typography>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    order.status === "delivered"
                      ? "success"
                      : order.status === "cancelled"
                      ? "destructive"
                      : order.status === "pending"
                      ? "outline"
                      : "secondary"
                  }
                >
                  {order.status?.toUpperCase() || 'UNKNOWN'}
                </Badge>
                {order.paymentMode && (
                  <Badge variant="outline">{order.paymentMode}</Badge>
                )}
              </div>
            </div>
            <div>
              <Typography variant="small" className="text-muted-foreground">Items Count</Typography>
              <Typography variant="p" className="font-medium">{orderItems.length} items</Typography>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Information */}
        <Card>
          <CardHeader>
            <CardTitle>Shipping Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Typography variant="p" className="font-medium">{order.address?.address || 'N/A'}</Typography>
              <Typography variant="p">{order.address?.city || 'N/A'}, {order.address?.state || 'N/A'}</Typography>
              <Typography variant="p">{order.address?.pincode || 'N/A'}</Typography>
            </div>
          </CardContent>
        </Card>

        {/* Payment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.utr_number && (
              <div>
                <Typography variant="small" className="text-muted-foreground">UTR Number</Typography>
                <Typography variant="p" className="font-medium font-mono text-sm">
                  {order.utr_number}
                </Typography>
              </div>
            )}
            <div>
              <Typography variant="small" className="text-muted-foreground">Payment Link ID</Typography>
              <Typography variant="p" className="font-medium font-mono text-sm">
                {order.paymentLinkId || 'N/A'}
              </Typography>
            </div>
            <div>
              <Typography variant="small" className="text-muted-foreground">Payment Link</Typography>
              {order.paymentLink ? (
                <div className="space-y-2">
                  <Typography variant="p" className="font-mono text-sm break-all">
                    {order.paymentLink}
                  </Typography>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyPaymentLink}
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Link
                  </Button>
                </div>
              ) : (
                <Typography variant="p" className="text-muted-foreground">No payment link available</Typography>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shipping Details & Email Tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shipping Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Shipping Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.shippingDetails && (
              <>
                <div>
                  <Typography variant="small" className="text-muted-foreground">Delivery Zone</Typography>
                  <Typography variant="p" className="font-medium">{order.shippingDetails.zoneName || 'N/A'}</Typography>
                </div>
                <div>
                  <Typography variant="small" className="text-muted-foreground">Pricing Type</Typography>
                  <Typography variant="p">{order.shippingDetails.pricingType || 'N/A'}</Typography>
                </div>
                <div>
                  <Typography variant="small" className="text-muted-foreground">Manual Override</Typography>
                  <Badge variant={order.shippingDetails.isManual ? "destructive" : "secondary"}>
                    {order.shippingDetails.isManual ? "Yes" : "No"}
                  </Badge>
                </div>
                <div>
                  <Typography variant="small" className="text-muted-foreground">Calculated At</Typography>
                  <Typography variant="p">
                    {order.shippingDetails.calculatedAt ? 
                      format(new Date(order.shippingDetails.calculatedAt), "dd/MM/yyyy hh:mm a") : 'N/A'}
                  </Typography>
                </div>
              </>
            )}
            
            {/* Shipping Cost Editor */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <Typography variant="small" className="text-muted-foreground">Shipping Cost</Typography>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleShippingEdit}
                  className="h-6 w-6 p-0"
                >
                  {isEditingShipping ? <EyeOff className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                </Button>
              </div>
              {isEditingShipping ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={shippingCost}
                    onChange={(e) => handleShippingCostChange(parseFloat(e.target.value) || 0)}
                    className="w-24"
                    min="0"
                    step="0.01"
                  />
                  <Typography variant="small">₹</Typography>
                  {shippingCostChanged && (
                    <Typography variant="small" className="text-amber-600 dark:text-amber-400 font-medium">
                      ● Changed
                    </Typography>
                  )}
                </div>
              ) : (
                <Typography variant="p" className="font-medium">₹{shippingCost.toFixed(2)}</Typography>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Email Tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.emailTracking && (
              <>
                {/* Confirmation Email */}
                <div>
                  <Typography variant="small" className="text-muted-foreground">Confirmation Email</Typography>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={
                      order.emailTracking.confirmation?.status === "sent" ? "success" : 
                      order.emailTracking.confirmation?.status === "failed" ? "destructive" : "secondary"
                    }>
                      {order.emailTracking.confirmation?.status?.toUpperCase() || 'UNKNOWN'}
                    </Badge>
                    {order.emailTracking.confirmation?.attempts > 0 && (
                      <Typography variant="small" className="text-muted-foreground">
                        ({order.emailTracking.confirmation.attempts} attempts)
                      </Typography>
                    )}
                  </div>
                  {order.emailTracking.confirmation?.opened && (
                    <Typography variant="small" className="text-[var(--color-success)]">
                      Opened {order.emailTracking.confirmation.openCount} times
                    </Typography>
                  )}
                  {order.emailTracking.confirmation?.clicked && (
                    <Typography variant="small" className="text-blue-600 dark:text-blue-400">
                      Clicked {order.emailTracking.confirmation.clickCount} times
                    </Typography>
                  )}
                </div>

                {/* Status Updates */}
                <div>
                  <Typography variant="small" className="text-muted-foreground">Status Updates</Typography>
                  <div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
                    {order.emailTracking.statusUpdates?.slice(0, 3).map((update, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            update.emailStatus === "sent" ? "success" : 
                            update.emailStatus === "failed" ? "destructive" : "secondary"
                          }>
                            {update.status}
                          </Badge>
                          <Typography variant="small" className="text-muted-foreground">
                            {update.emailStatus}
                          </Typography>
                        </div>
                        <Typography variant="small" className="text-muted-foreground">
                          {update.attempts > 0 && `${update.attempts} attempts`}
                        </Typography>
                      </div>
                    ))}
                    {order.emailTracking.statusUpdates?.length > 3 && (
                      <Typography variant="small" className="text-muted-foreground">
                        +{order.emailTracking.statusUpdates.length - 3} more updates
                      </Typography>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Order Items ({orderItems.length})</CardTitle>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Typography variant="small" className="text-amber-600 dark:text-amber-400 font-medium">
                  ● Items Modified
                </Typography>
              )}
              <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Items
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Products & Bundles to Order</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    {/* Products Selection */}
                    <div>
                      <Typography variant="small" className="text-muted-foreground mb-2">Select Products</Typography>
                      <div className="mb-3">
                        <Input
                          placeholder="Search products by name or SKU..."
                          value={productSearchText}
                          onChange={(e) => setProductSearchText(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
                        {filteredProducts.length > 0 ? (
                          filteredProducts.map((product) => {
                            const prodImg = product.banner_image || (Array.isArray(product.images) ? product.images[0] : null);
                            return (
                              <div key={product._id} className="flex items-center space-x-2.5 p-1.5 rounded-md hover:bg-muted/50 transition-colors">
                                <Checkbox
                                  id={`product-${product._id}`}
                                  checked={selectedProducts.includes(product._id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedProducts(prev => [...prev, product._id]);
                                    } else {
                                      setSelectedProducts(prev => prev.filter(id => id !== product._id));
                                    }
                                  }}
                                />
                                <div className="h-10 w-10 shrink-0 rounded border bg-muted/40 overflow-hidden flex items-center justify-center">
                                  {prodImg ? (
                                    <img src={prodImg} alt={product.name} className="h-full w-full object-cover" />
                                  ) : (
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                                <label
                                  htmlFor={`product-${product._id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
                                >
                                  <span>{product.name}</span>
                                  <span className="text-muted-foreground ml-2 font-normal">
                                    Price: ₹{product.price}
                                  </span>
                                  {product.discounted_price && product.discounted_price !== product.price && (
                                    <span className="text-[var(--color-success)] ml-1.5 font-medium">
                                      (Discounted: ₹{product.discounted_price})
                                    </span>
                                  )}
                                  {Array.isArray(product.price_tiers) && product.price_tiers.length > 0 && (
                                    <Badge variant="secondary" className="ml-2 gap-1 align-middle">
                                      <Layers className="h-3 w-3" />
                                      Bulk pricing
                                    </Badge>
                                  )}
                                </label>
                              </div>
                            );
                          })
                        ) : (
                          <Typography variant="small" className="text-muted-foreground text-center py-4">
                            {productSearchText ? "No products found matching your search" : "No products available"}
                          </Typography>
                        )}
                      </div>
                    </div>

                    {/* Bundles Selection */}
                    <div>
                      <Typography variant="small" className="text-muted-foreground mb-2">Select Bundles</Typography>
                      <div className="mb-3">
                        <Input
                          placeholder="Search bundles by name..."
                          value={bundleSearchText}
                          onChange={(e) => setBundleSearchText(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
                        {filteredBundles.length > 0 ? (
                          filteredBundles.map((bundle) => {
                            const bundleImg = bundle.banner_image || (Array.isArray(bundle.images) ? bundle.images[0] : null);
                            return (
                              <div key={bundle._id} className="flex items-center space-x-2.5 p-1.5 rounded-md hover:bg-muted/50 transition-colors">
                                <Checkbox
                                  id={`bundle-${bundle._id}`}
                                  checked={selectedBundles.includes(bundle._id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedBundles(prev => [...prev, bundle._id]);
                                    } else {
                                      setSelectedBundles(prev => prev.filter(id => id !== bundle._id));
                                    }
                                  }}
                                />
                                <div className="h-10 w-10 shrink-0 rounded border bg-muted/40 overflow-hidden flex items-center justify-center">
                                  {bundleImg ? (
                                    <img src={bundleImg} alt={bundle.name} className="h-full w-full object-cover" />
                                  ) : (
                                    <Layers className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                                <label
                                  htmlFor={`bundle-${bundle._id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
                                >
                                  <span>{bundle.name}</span>
                                  <span className="text-muted-foreground ml-2 font-normal">
                                    Price: ₹{bundle.price}
                                  </span>
                                  {bundle.discounted_price && bundle.discounted_price !== bundle.price && (
                                    <span className="text-[var(--color-success)] ml-1.5 font-medium">
                                      (Discounted: ₹{bundle.discounted_price})
                                    </span>
                                  )}
                                  {bundle.populatedProducts && bundle.populatedProducts.length > 0 && (
                                    <span className="text-muted-foreground ml-2">
                                      ({bundle.populatedProducts.length} product{bundle.populatedProducts.length !== 1 ? 's' : ''})
                                    </span>
                                  )}
                                </label>
                              </div>
                            );
                          })
                        ) : (
                          <Typography variant="small" className="text-muted-foreground text-center py-4">
                            {bundleSearchText ? "No bundles found matching your search" : "No bundles available"}
                          </Typography>
                        )}
                      </div>
                    </div>

                    {/* Quantities */}
                    {(selectedProducts.length > 0 || selectedBundles.length > 0) && (
                      <div>
                        <Typography variant="small" className="text-muted-foreground mb-2">Set Quantities</Typography>
                        <div className="space-y-2">
                          {selectedProducts.map(productId => {
                            const product = productsResponse?.data?.find(p => p._id === productId);
                            const prodImg = product?.banner_image || (Array.isArray(product?.images) ? product.images[0] : null);
                            const allowedQuantities = getAllowedQuantities(productId);
                            return (
                              <div key={productId} className="flex items-center justify-between gap-2 p-1.5 rounded border bg-muted/20">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="h-8 w-8 shrink-0 rounded border bg-muted overflow-hidden flex items-center justify-center">
                                    {prodImg ? (
                                      <img src={prodImg} alt={product?.name} className="h-full w-full object-cover" />
                                    ) : (
                                      <Package className="h-3.5 w-3.5 text-muted-foreground" />
                                    )}
                                  </div>
                                  <Typography variant="small" className="truncate font-medium">{product?.name}</Typography>
                                </div>
                                {allowedQuantities ? (
                                  <Select
                                    value={String(newItemQuantities[productId] || 1)}
                                    onValueChange={(val) => setNewItemQuantities(prev => ({
                                      ...prev,
                                      [productId]: parseInt(val, 10)
                                    }))}
                                  >
                                    <SelectTrigger className="w-20 shrink-0">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {allowedQuantities.map((qty) => (
                                        <SelectItem key={qty} value={String(qty)}>
                                          {qty}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Input
                                    type="number"
                                    min="1"
                                    value={newItemQuantities[productId] || 1}
                                    onChange={(e) => setNewItemQuantities(prev => ({
                                      ...prev,
                                      [productId]: parseInt(e.target.value) || 1
                                    }))}
                                    className="w-20 shrink-0"
                                  />
                                )}
                              </div>
                            );
                          })}
                          {selectedBundles.map(bundleId => {
                            const bundle = bundlesResponse?.data?.data?.find(b => b._id === bundleId);
                            const bundleImg = bundle?.banner_image || (Array.isArray(bundle?.images) ? bundle.images[0] : null);
                            return (
                              <div key={bundleId} className="flex items-center justify-between gap-2 p-1.5 rounded border bg-muted/20">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="h-8 w-8 shrink-0 rounded border bg-muted overflow-hidden flex items-center justify-center">
                                    {bundleImg ? (
                                      <img src={bundleImg} alt={bundle?.name} className="h-full w-full object-cover" />
                                    ) : (
                                      <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                                    )}
                                  </div>
                                  <Typography variant="small" className="truncate font-medium">{bundle?.name}</Typography>
                                </div>
                                <Input
                                  type="number"
                                  min="1"
                                  value={newItemQuantities[bundleId] || 1}
                                  onChange={(e) => setNewItemQuantities(prev => ({
                                    ...prev,
                                    [bundleId]: parseInt(e.target.value) || 1
                                  }))}
                                  className="w-20 shrink-0"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowAddItemDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddItems} disabled={selectedProducts.length === 0 && selectedBundles.length === 0}>
                        Add Items
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orderItems.length === 0 ? (
              <div className="text-center py-8">
                <Typography variant="p" className="text-muted-foreground">
                  No items in this order
                </Typography>
              </div>
            ) : (
              orderItems
                .filter(item => item.quantity > 0) // Only show items with quantity > 0
                .map((item, index) => {
                  const isProduct = item.type === "product" || item.product;
                  const isBundle = item.type === "bundle" || item.bundle;
                  
                  const itemName = isProduct ? (item.product?.name || 'Unknown Product') : 
                                 isBundle ? (item.bundle?.name || 'Unknown Bundle') : 'Unknown Item';
                  
                  const targetProduct = isProduct ? (item.product || productsById[item.product?._id || item.productId]) : null;
                  const targetBundle = isBundle ? (item.bundle || bundlesById[item.bundle?._id || item.bundleId]) : null;

                  const originalPrice = isProduct 
                    ? (targetProduct?.price ?? item.price ?? (item.total_amount && item.quantity ? item.total_amount / item.quantity : 0))
                    : (targetBundle?.price ?? item.price ?? (item.total_amount && item.quantity ? item.total_amount / item.quantity : 0));

                  const discountedPrice = isProduct 
                    ? (targetProduct?.discounted_price ?? item.discounted_price ?? (item.discounted_total_amount && item.quantity ? item.discounted_total_amount / item.quantity : null))
                    : (targetBundle?.discounted_price ?? item.discounted_price ?? (item.discounted_total_amount && item.quantity ? item.discounted_total_amount / item.quantity : null));

                  const hasDiscount = discountedPrice !== null && discountedPrice !== undefined && Number(discountedPrice) > 0 && Number(discountedPrice) < Number(originalPrice);
                  const effectivePrice = hasDiscount ? Number(discountedPrice) : Number(originalPrice || 0);

                  const allowedQuantities = isProduct ? getAllowedQuantities(item.product?._id) : null;
                  const itemImage = getItemImage(item);

                  return (
                    <div key={index} className="flex items-center gap-4 p-4 border rounded-lg transition-colors hover:bg-muted/20">
                      {/* Item Image Thumbnail */}
                      <div
                        className={cn(
                          "relative h-16 w-16 shrink-0 rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center",
                          itemImage ? "cursor-pointer group" : ""
                        )}
                        onClick={() => {
                          if (itemImage) setPreviewImage(itemImage);
                        }}
                        title={itemImage ? "Click to view full image" : undefined}
                      >
                        {itemImage ? (
                          <>
                            <img
                              src={itemImage}
                              alt={itemName}
                              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Eye className="h-4 w-4" />
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center justify-center text-muted-foreground">
                            {isBundle ? (
                              <Layers className="h-6 w-6 stroke-1" />
                            ) : (
                              <Package className="h-6 w-6 stroke-1" />
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Typography variant="p" className="font-medium">{itemName}</Typography>
                          <Badge variant={isProduct ? "default" : "secondary"}>
                            {isProduct ? "Product" : "Bundle"}
                          </Badge>
                          {allowedQuantities && (
                            <Badge variant="secondary" className="gap-1">
                              <Layers className="h-3 w-3" />
                              Bulk pricing
                            </Badge>
                          )}
                        </div>

                        {/* Price and Discounted Price Display */}
                        <div className="flex items-center gap-3 flex-wrap mt-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground font-medium">Price:</span>
                            <span className={cn("text-sm", hasDiscount ? "line-through text-muted-foreground" : "font-medium text-foreground")}>
                              ₹{Number(originalPrice || 0).toFixed(2)}
                            </span>
                          </div>

                          {discountedPrice !== null && discountedPrice !== undefined && Number(discountedPrice) > 0 && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-muted-foreground font-medium">Discounted Price:</span>
                              <span className="text-sm font-semibold text-[var(--color-success)]">
                                ₹{Number(discountedPrice).toFixed(2)}
                              </span>
                            </div>
                          )}

                          <span className="text-xs text-muted-foreground">• each</span>

                          {hasDiscount && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-[var(--color-success)] border-[var(--color-success)]/30 font-medium">
                              Save ₹{(Number(originalPrice) - Number(discountedPrice)).toFixed(2)}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {allowedQuantities ? (
                          <Select
                            value={String(item.quantity)}
                            onValueChange={(val) => updateItemQuantity(index, parseInt(val, 10))}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {allowedQuantities.map((qty) => (
                                <SelectItem key={qty} value={String(qty)}>
                                  {qty}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateItemQuantity(index, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>

                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                              className="w-20 text-center"
                              min="1"
                            />

                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateItemQuantity(index, item.quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                      
                      <div className="w-28 text-right flex flex-col items-end shrink-0">
                        <Typography variant="p" className="font-semibold">
                          ₹{(effectivePrice * item.quantity).toFixed(2)}
                        </Typography>
                        {hasDiscount && (
                          <Typography variant="small" className="text-muted-foreground line-through text-xs">
                            ₹{(Number(originalPrice) * item.quantity).toFixed(2)}
                          </Typography>
                        )}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })
            )}
          </div>

          {/* Order Total */}
          <div className="mt-6 pt-4 border-t">
            <div className="space-y-3">
              {/* Items Total (Original Total before discount) */}
              <div className="flex justify-between items-center">
                <Typography variant="p" className="text-muted-foreground">Items Total:</Typography>
                <Typography variant="p" className="font-medium">₹{originalItemsTotal.toFixed(2)}</Typography>
              </div>

              {/* Product Discount */}
              {productDiscount > 0 && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Typography variant="p" className="text-[var(--color-success)]">
                      Discount:
                    </Typography>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-[var(--color-success)] border-[var(--color-success)]/30 font-medium">
                      Save ₹{productDiscount.toFixed(2)}
                    </Badge>
                  </div>
                  <Typography variant="p" className="font-medium text-[var(--color-success)]">
                    −₹{productDiscount.toFixed(2)}
                  </Typography>
                </div>
              )}

              {/* Coupon Discount */}
              {order.coupon && (
                <div className="flex justify-between items-start">
                  <div>
                    <Typography variant="p" className="text-[var(--color-success)]">
                      Coupon ({order.coupon.code})
                    </Typography>
                    <Typography variant="small" className="text-muted-foreground">
                      {formatCouponDiscount(order.coupon)}
                    </Typography>
                  </div>
                  <Typography variant="p" className="font-medium text-[var(--color-success)]">
                    −₹{(order.couponDiscountAmount || 0).toFixed(2)}
                  </Typography>
                </div>
              )}

              {/* Shipping Cost */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Typography variant="p" className="text-muted-foreground">Shipping Cost:</Typography>
                  {shippingCostChanged && (
                    <Typography variant="small" className="text-amber-600 dark:text-amber-400 font-medium">
                      ● Modified
                    </Typography>
                  )}
                </div>
                <Typography variant="p">₹{shippingCost.toFixed(2)}</Typography>
              </div>
              
              {/* Final Total */}
              <div className="flex justify-between items-center pt-2 border-t">
                <Typography variant="h4">Final Total:</Typography>
                <Typography variant="h4" className="text-[var(--color-success)] font-bold">
                  ₹{finalTotal.toFixed(2)}
                </Typography>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Update Order Button */}
      <div className="flex justify-start">
        <Button
          onClick={handleUpdateOrder}
          disabled={isUpdating}
          className={cn(
            "px-8 py-3 text-base font-semibold",
            (hasChanges || statusChanged || shippingCostChanged) &&
              "bg-[var(--color-success)] text-white hover:brightness-95"
          )}
          size="lg"
        >
          <Save className="h-5 w-5 mr-2" />
          {isUpdating ? "Updating..." : 
           (hasChanges || statusChanged || shippingCostChanged) ? "Update Order ●" : "Update Order"}
        </Button>
        
        {/* Change indicator next to button */}
        {(hasChanges || statusChanged || shippingCostChanged) && (
          <div className="flex items-center ml-4">
            <Typography variant="small" className="text-amber-600 dark:text-amber-400 font-medium">
              {[hasChanges && "Items", statusChanged && "Status", shippingCostChanged && "Shipping"]
                .filter(Boolean).join(" & ")} Changed
            </Typography>
          </div>
        )}
      </div>

      {/* Item Image Fullscreen Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-xl p-3">
          <DialogHeader className="p-2 pb-0">
            <DialogTitle className="text-sm font-medium text-muted-foreground">Image Preview</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-2">
            <img
              src={previewImage}
              alt="Item Preview"
              className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderDetails;