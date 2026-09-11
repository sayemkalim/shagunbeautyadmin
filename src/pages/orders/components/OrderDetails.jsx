import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  Plus,
  Minus,
  Save,
  Trash2,
  Mail,
  CreditCard,
  Edit,
  Package,
  Truck,
  DollarSign,
  Eye,
  EyeOff,
  Copy,
  Layers,
  FileDown,
  RefreshCw,
  MapPin,
  User,
  Phone,
  ExternalLink,
} from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Typography from "@/components/typography";

import { fetchOrderById } from "../helpers/fetchOrderById";
import { updateOrder } from "../helpers/updateOrder";
import { generatePaymentLink } from "../helpers/generatePaymentLink";
import { fetchOrderBill } from "../helpers/fetchOrderBill";
import { triggerBillDownload } from "../helpers/triggerBillDownload";
import { fetchUserById } from "@/pages/users/helpers/fetchUserById";
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

  // Extract user ID (handles string ID, populated object, or null)
  const userId = typeof order?.user === "object" ? order?.user?._id : order?.user;
  const isRegisteredUser = !order?.isGuestOrder && Boolean(userId);

  // Fetch registered user details by user ID
  const { data: userResponse, isLoading: isUserLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUserById(userId),
    enabled: Boolean(isRegisteredUser),
  });

  const registeredUser =
    userResponse?.response?.data || (typeof order?.user === "object" ? order?.user : null);

  // Customer display details (handles registered users and guest orders)
  const customerDetails = useMemo(() => {
    if (order?.isGuestOrder) {
      return {
        isGuest: true,
        name: order?.guestInfo?.name || order?.address?.name || "Guest Customer",
        email: order?.guestInfo?.email || "Not provided",
        phone: order?.guestInfo?.mobile || order?.address?.mobile || "Not provided",
        userId: null,
      };
    }

    return {
      isGuest: false,
      name:
        registeredUser?.name ||
        (isUserLoading ? "Loading..." : order?.address?.name || "N/A"),
      email:
        registeredUser?.email ||
        (isUserLoading ? "Loading..." : "Not provided"),
      phone:
        registeredUser?.phone ||
        registeredUser?.mobile ||
        (isUserLoading ? "Loading..." : "Not provided"),
      userId: userId || null,
      isActive: registeredUser?.isActive,
    };
  }, [order, registeredUser, isUserLoading, userId]);

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

  // Regenerate invoice/bill mutation
  const { mutate: regenerateOrderBillMutation, isLoading: isRegeneratingBill } = useMutation({
    mutationFn: () => fetchOrderBill({ id: orderId, regenerate: true }),
    onSuccess: (res) => {
      if (res?.error || res?.response?.success === false) {
        toast.error(res?.response?.data?.message || "Failed to regenerate invoice. Please try again.");
        return;
      }
      const downloaded = triggerBillDownload(res?.response?.data);
      if (!downloaded) {
        toast.error("Invoice URL not available.");
      } else {
        toast.success("Invoice regenerated successfully!");
        refetchOrderData();
      }
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to regenerate invoice. Please try again.");
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
      {/* Minimal Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/dashboard/orders")}
            className="h-9 w-9 rounded-lg shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <Typography variant="h3" className="text-2xl font-bold tracking-tight">
                Order #{order.orderNumber ?? (order._id ? order._id.slice(-6).toUpperCase() : "")}
              </Typography>
              <Badge
                variant="outline"
                className={cn("text-xs font-medium uppercase px-2.5 py-0.5", getStatusBadgeClass(order.status))}
              >
                {order.status || "PENDING"}
              </Badge>
              {order.paymentMode && (
                <Badge variant="outline" className="text-xs font-mono px-2 py-0.5">
                  {order.paymentMode}
                </Badge>
              )}
            </div>
            <Typography variant="small" className="text-muted-foreground text-xs block mt-0.5">
              ID: {order._id} • Placed {order.createdAt ? format(new Date(order.createdAt), "dd MMM yyyy, hh:mm a") : "N/A"}
            </Typography>
          </div>
        </div>

        {/* Header Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Changer */}
          <div className="flex items-center gap-1.5 bg-background border rounded-lg px-2.5 py-1">
            <span className="text-xs font-medium text-muted-foreground">Status:</span>
            <Select value={selectedStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-7 w-28 text-xs border-0 shadow-none px-1 focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((status) => (
                  <SelectItem key={status} value={status} className="text-xs">
                    {status.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {statusChanged && (
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" title="Status modified" />
            )}
          </div>

          {/* Generate Payment Link Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleGeneratePaymentLink}
            disabled={isGeneratingPaymentLink}
            className="h-9 gap-1.5 text-xs font-medium"
          >
            <CreditCard className="h-3.5 w-3.5" />
            {isGeneratingPaymentLink ? "Generating..." : "Payment Link"}
          </Button>

          {/* Download & Regenerate Invoice Buttons */}
          {order.status === "pending" ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button variant="outline" size="sm" disabled className="h-9 gap-1.5 text-xs">
                    <FileDown className="h-3.5 w-3.5" />
                    Invoice
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Available once the order is confirmed</TooltipContent>
            </Tooltip>
          ) : (
            <div className="inline-flex items-center rounded-lg border bg-background p-0.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchOrderBillMutation()}
                disabled={isFetchingBill || isRegeneratingBill}
                className="h-8 gap-1.5 text-xs px-2.5"
                title="Download current invoice PDF"
              >
                <FileDown className="h-3.5 w-3.5" />
                {isFetchingBill ? "Downloading..." : "Invoice"}
              </Button>
              <div className="h-4 w-px bg-border my-auto" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => regenerateOrderBillMutation()}
                disabled={isFetchingBill || isRegeneratingBill}
                className="h-8 gap-1.5 text-xs px-2.5"
                title="Regenerate invoice with latest order details and phone number"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isRegeneratingBill && "animate-spin")} />
                {isRegeneratingBill ? "Regenerating..." : "Regenerate"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Top 3 Cards Row: Customer Info | Shipping Address | Payment & Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {/* 1. Customer Information Card */}
        <Card className="border shadow-xs overflow-hidden flex flex-col h-full">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold">Customer Information</CardTitle>
              </div>
              <Badge
                variant={customerDetails.isGuest ? "secondary" : "outline"}
                className={cn(
                  "text-xs font-normal",
                  !customerDetails.isGuest &&
                    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"
                )}
              >
                {customerDetails.isGuest ? "Guest Order" : "Registered User"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-sm flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Customer Avatar & Name */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-10 w-10 border shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                      {customerDetails.name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <Typography variant="p" className="font-semibold truncate text-sm">
                      {customerDetails.name}
                    </Typography>
                    <span className="text-xs text-muted-foreground block">
                      {customerDetails.isGuest ? "Guest Checkout" : "Account Holder"}
                    </span>
                  </div>
                </div>
                {!customerDetails.isGuest && customerDetails.userId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/dashboard/users/${customerDetails.userId}`)}
                    className="h-8 px-2 text-xs text-primary hover:text-primary gap-1 shrink-0"
                    title="View user details"
                  >
                    <span>Profile</span>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Email */}
              <div className="flex items-start gap-2.5 pt-2 border-t">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <Typography variant="small" className="text-muted-foreground text-xs block">
                    Email Address
                  </Typography>
                  {customerDetails.email && customerDetails.email !== "Not provided" && customerDetails.email !== "N/A" ? (
                    <a
                      href={`mailto:${customerDetails.email}`}
                      className="text-sm font-medium text-primary hover:underline truncate block"
                    >
                      {customerDetails.email}
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">Not provided</span>
                  )}
                </div>
              </div>

              {/* Registered Mobile */}
              <div className="flex items-start gap-2.5">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <Typography variant="small" className="text-muted-foreground text-xs block">
                    Registered Mobile No
                  </Typography>
                  {customerDetails.phone && customerDetails.phone !== "Not provided" && customerDetails.phone !== "N/A" ? (
                    <a
                      href={`tel:${customerDetails.phone}`}
                      className="text-sm font-medium text-primary hover:underline block"
                    >
                      {customerDetails.phone}
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">Not provided</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Shipping Address Card */}
        <Card className="border shadow-xs overflow-hidden flex flex-col h-full">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold">Shipping Address</CardTitle>
              </div>
              {order.address?.addressType && (
                <Badge variant="outline" className="capitalize text-xs font-normal">
                  {order.address.addressType}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3.5 text-sm flex-1 flex flex-col justify-between">
            <div className="space-y-3.5">
              {/* Recipient Name */}
              <div className="flex items-start gap-2.5">
                <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <Typography variant="small" className="text-muted-foreground text-xs block">
                    Recipient Name
                  </Typography>
                  <Typography variant="p" className="font-semibold text-sm">
                    {order.address?.name || "N/A"}
                  </Typography>
                </div>
              </div>

              {/* Delivery Contact Phone */}
              <div className="flex items-start gap-2.5">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <Typography variant="small" className="text-muted-foreground text-xs block">
                    Delivery Contact Phone
                  </Typography>
                  <div className="flex items-center gap-2 flex-wrap">
                    {order.address?.mobile ? (
                      <a
                        href={`tel:${order.address.mobile}`}
                        className="font-medium text-sm text-primary hover:underline"
                      >
                        {order.address.mobile}
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                    {order.address?.alternatePhone && (
                      <span className="text-xs text-muted-foreground">
                        (Alt:{" "}
                        <a href={`tel:${order.address.alternatePhone}`} className="hover:underline">
                          {order.address.alternatePhone}
                        </a>
                        )
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Complete Address */}
              <div className="flex items-start gap-2.5 pt-2 border-t">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <Typography variant="small" className="text-muted-foreground text-xs block">
                    Delivery Address
                  </Typography>
                  <Typography variant="p" className="text-sm leading-relaxed font-normal">
                    {order.address?.address || "N/A"}
                  </Typography>
                  {(order.address?.locality || order.address?.landmark) && (
                    <Typography variant="small" className="text-muted-foreground text-xs block">
                      {[
                        order.address?.locality,
                        order.address?.landmark && `Landmark: ${order.address.landmark}`,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </Typography>
                  )}
                  <Typography variant="p" className="text-sm font-semibold mt-1">
                    {[order.address?.city, order.address?.state].filter(Boolean).join(", ")}
                    {order.address?.pincode ? ` - ${order.address.pincode}` : ""}
                  </Typography>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Payment & Status Overview Card */}
        <Card className="border shadow-xs overflow-hidden flex flex-col h-full">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold">Payment & Overview</CardTitle>
              </div>
              <Badge
                variant={order.paymentStatus === "paid" ? "default" : "secondary"}
                className="text-xs capitalize"
              >
                {order.paymentStatus || "Pending"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3.5 text-sm flex-1 flex flex-col justify-between">
            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3 pb-2 border-b">
                <div>
                  <Typography variant="small" className="text-muted-foreground text-xs block">
                    Payment Method
                  </Typography>
                  <Badge variant="outline" className="font-mono text-xs mt-1">
                    {order.paymentMode || "COD"}
                  </Badge>
                </div>
                <div>
                  <Typography variant="small" className="text-muted-foreground text-xs block">
                    Order Total
                  </Typography>
                  <span className="font-bold text-base text-[var(--color-success)] block mt-0.5">
                    ₹{finalTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <Typography variant="small" className="text-muted-foreground text-xs block">
                    Order Status
                  </Typography>
                  <Badge
                    variant="outline"
                    className={cn("text-xs font-medium uppercase mt-1", getStatusBadgeClass(order.status))}
                  >
                    {order.status || "PENDING"}
                  </Badge>
                </div>
                <div>
                  <Typography variant="small" className="text-muted-foreground text-xs block">
                    Placed On
                  </Typography>
                  <span className="font-medium block mt-0.5">
                    {order.createdAt ? format(new Date(order.createdAt), "dd MMM yyyy, hh:mm a") : "N/A"}
                  </span>
                </div>
              </div>

              {order.utr_number && (
                <div className="pt-2 border-t">
                  <Typography variant="small" className="text-muted-foreground text-xs block">
                    UTR Number
                  </Typography>
                  <span className="font-mono text-xs font-semibold block mt-0.5">
                    {order.utr_number}
                  </span>
                </div>
              )}

              {order.paymentLinkId && (
                <div className="pt-2 border-t">
                  <Typography variant="small" className="text-muted-foreground text-xs block">
                    Payment Link ID
                  </Typography>
                  <span className="font-mono text-xs text-muted-foreground block mt-0.5">
                    {order.paymentLinkId}
                  </span>
                </div>
              )}

              {order.paymentLink && (
                <div className="pt-2 border-t space-y-1.5">
                  <Typography variant="small" className="text-muted-foreground text-xs block">
                    Payment Link
                  </Typography>
                  <div className="flex items-center gap-1.5">
                    <Input
                      readOnly
                      value={order.paymentLink}
                      className="h-8 text-xs font-mono bg-muted/40"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyPaymentLink}
                      className="h-8 px-2.5 text-xs shrink-0 gap-1"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </Button>
                  </div>
                </div>
              )}
            </div>
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

          {/* Order Payment Summary */}
          <div className="mt-6 pt-5 border-t flex flex-col md:flex-row md:justify-between md:items-start gap-6">
            <div className="space-y-2 max-w-sm">
              <Typography variant="small" className="font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
                Payment Breakdown
              </Typography>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Item prices and product discounts are calculated based on applicable catalog pricing. Shipping charges can be customized using the edit button.
              </p>
              {order.paymentMode && (
                <div className="inline-flex items-center gap-2 text-xs bg-muted/40 px-3 py-1.5 rounded-lg border">
                  <CreditCard className="h-3.5 w-3.5 text-primary" />
                  <span className="text-muted-foreground">Mode:</span>
                  <span className="font-semibold font-mono uppercase">{order.paymentMode}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={order.paymentStatus === "paid" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0 capitalize">
                    {order.paymentStatus || "Pending"}
                  </Badge>
                </div>
              )}
            </div>

            <div className="w-full md:w-80 lg:w-96 space-y-2.5 bg-muted/20 p-4 rounded-xl border">
              {/* Items Total */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Items Total:</span>
                <span className="font-medium">₹{originalItemsTotal.toFixed(2)}</span>
              </div>

              {/* Product Discount */}
              {productDiscount > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[var(--color-success)] font-medium">Discount:</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-[var(--color-success)] border-[var(--color-success)]/30 font-medium">
                      Save ₹{productDiscount.toFixed(2)}
                    </Badge>
                  </div>
                  <span className="font-semibold text-[var(--color-success)]">
                    −₹{productDiscount.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Coupon Discount */}
              {order.coupon && (
                <div className="flex justify-between items-start text-sm">
                  <div>
                    <span className="text-[var(--color-success)] font-medium">Coupon ({order.coupon.code})</span>
                    <span className="text-muted-foreground text-xs block">
                      {formatCouponDiscount(order.coupon)}
                    </span>
                  </div>
                  <span className="font-semibold text-[var(--color-success)]">
                    −₹{(order.couponDiscountAmount || 0).toFixed(2)}
                  </span>
                </div>
              )}

              {/* Shipping Cost */}
              <div className="flex justify-between items-center text-sm pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Shipping Cost:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleShippingEdit}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                    title={isEditingShipping ? "Close shipping editor" : "Edit shipping cost"}
                  >
                    {isEditingShipping ? <EyeOff className="h-3.5 w-3.5" /> : <Edit className="h-3.5 w-3.5" />}
                  </Button>
                  {shippingCostChanged && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-300 dark:text-amber-400 font-medium">
                      ● Modified
                    </Badge>
                  )}
                </div>
                {isEditingShipping ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium">₹</span>
                    <Input
                      type="number"
                      value={shippingCost}
                      onChange={(e) => handleShippingCostChange(parseFloat(e.target.value) || 0)}
                      className="h-7 w-20 text-right font-medium text-xs"
                      min="0"
                      step="0.01"
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">₹{shippingCost.toFixed(2)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleShippingEdit}
                      className="h-6 px-1.5 text-xs text-muted-foreground hover:text-primary gap-1"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Final Total */}
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-base font-bold">Final Total:</span>
                <span className="text-xl font-bold text-[var(--color-success)]">
                  ₹{finalTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

          {/* Action Bar for Changes */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border bg-card shadow-xs">
            <div className="flex items-center gap-2.5">
              <Button
                onClick={handleUpdateOrder}
                disabled={isUpdating}
                className={cn(
                  "font-medium shadow-xs transition-all",
                  (hasChanges || statusChanged || shippingCostChanged) &&
                    "bg-emerald-600 hover:bg-emerald-700 text-white"
                )}
                size="default"
              >
                <Save className="h-4 w-4 mr-2" />
                {isUpdating ? "Saving..." : (hasChanges || statusChanged || shippingCostChanged) ? "Save Changes ●" : "Save Changes"}
              </Button>
              {(hasChanges || statusChanged || shippingCostChanged) && (
                <Badge variant="outline" className="text-amber-600 border-amber-300 dark:text-amber-400 font-medium text-xs">
                  ● Unsaved: {[hasChanges && "Items", statusChanged && "Status", shippingCostChanged && "Shipping"].filter(Boolean).join(", ")}
                </Badge>
              )}
            </div>
            <Typography variant="small" className="text-muted-foreground text-xs">
              Status, quantities, or shipping changes will be saved to the database.
            </Typography>
          </div>

          {/* Logistics & Tracking Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Shipping Details */}
            <Card className="border shadow-xs">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-semibold">Delivery & Zone</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleShippingEdit}
                    className="h-6 px-2 text-xs gap-1 text-primary hover:text-primary"
                  >
                    {isEditingShipping ? (
                      <>
                        <EyeOff className="h-3 w-3" />
                        <span>Cancel</span>
                      </>
                    ) : (
                      <>
                        <Edit className="h-3 w-3" />
                        <span>Edit Price</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-3.5 space-y-2.5 text-xs">
                {order.shippingDetails ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Delivery Zone</span>
                      <span className="font-medium">{order.shippingDetails.zoneName || "Standard"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Pricing Type</span>
                      <span className="font-medium capitalize">{order.shippingDetails.pricingType || "Default"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Manual Override</span>
                      <Badge variant={order.shippingDetails.isManual || shippingCostChanged ? "destructive" : "secondary"} className="text-[10px] px-1.5 py-0">
                        {order.shippingDetails.isManual || shippingCostChanged ? "Yes" : "No"}
                      </Badge>
                    </div>
                    {order.shippingDetails.calculatedAt && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Calculated At</span>
                        <span className="text-muted-foreground">
                          {format(new Date(order.shippingDetails.calculatedAt), "dd/MM/yyyy hh:mm a")}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">Standard delivery calculation applied</p>
                )}

                {/* Live Shipping Price Editor */}
                <div className="pt-2 border-t flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground font-medium">Shipping Cost:</span>
                    {shippingCostChanged && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0 text-amber-600 border-amber-300">
                        Modified
                      </Badge>
                    )}
                  </div>
                  {isEditingShipping ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium">₹</span>
                      <Input
                        type="number"
                        value={shippingCost}
                        onChange={(e) => handleShippingCostChange(parseFloat(e.target.value) || 0)}
                        className="h-7 w-20 text-right text-xs px-2 font-medium"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  ) : (
                    <span className="font-semibold text-sm">₹{shippingCost.toFixed(2)}</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Email Tracking */}
            <Card className="border shadow-xs">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-semibold">Email Tracking</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-3.5 space-y-2.5 text-xs">
                {order.emailTracking?.confirmation ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Confirmation Email</span>
                      <Badge
                        variant={
                          order.emailTracking.confirmation?.status === "sent"
                            ? "default"
                            : order.emailTracking.confirmation?.status === "failed"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-[10px] px-1.5 py-0 uppercase"
                      >
                        {order.emailTracking.confirmation?.status || "UNKNOWN"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Attempts / Engagement</span>
                      <span className="text-muted-foreground">
                        {order.emailTracking.confirmation.attempts || 0} attempts •{" "}
                        {order.emailTracking.confirmation.opened
                          ? `Opened (${order.emailTracking.confirmation.openCount})`
                          : "Unopened"}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">No confirmation email data yet</p>
                )}
                {Array.isArray(order.emailTracking?.statusUpdates) && order.emailTracking.statusUpdates.length > 0 && (
                  <div className="pt-2 border-t space-y-1">
                    <span className="text-muted-foreground block text-[11px]">Recent Updates:</span>
                    {order.emailTracking.statusUpdates.slice(0, 2).map((upd, idx) => (
                      <div key={idx} className="flex justify-between text-[11px]">
                        <span className="capitalize">{upd.status}</span>
                        <Badge variant="outline" className="text-[10px]">{upd.emailStatus}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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