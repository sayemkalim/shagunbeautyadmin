import React, { useState, useEffect, useRef, useMemo } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import Select from "react-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  UploadCloud,
  X,
  Package,
  Loader2,
  CreditCard,
  Layers,
  Hash,
  Sparkles,
  CheckSquare,
  IndianRupee,
  Tag,
  Filter,
  Lock,
} from "lucide-react";
import { createCardBanner } from "../helpers/createCardBanner";
import { updateCardBanner } from "../helpers/updateCardBanner";
import { fetchCardBanners } from "../helpers/fetchCardBanners";
import { fetchProducts } from "@/pages/products/components/helpers/fetchProducts";
import { fetchBrand } from "@/pages/brands/helpers/fetchBrand";

const selectStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: "var(--color-background)",
    borderColor: state.isFocused ? "var(--color-ring)" : "var(--color-input)",
    boxShadow: state.isFocused
      ? "0 0 0 3px color-mix(in oklch, var(--color-ring) 50%, transparent)"
      : "none",
    "&:hover": { borderColor: "var(--color-ring)" },
    borderRadius: "var(--radius-md)",
    minHeight: "2.5rem",
    fontSize: "0.875rem",
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "var(--color-popover)",
    color: "var(--color-popover-foreground)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    overflow: "hidden",
    zIndex: 60,
  }),
  groupHeading: (base) => ({
    ...base,
    color: "var(--color-primary)",
    fontWeight: 600,
    fontSize: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    padding: "8px 12px 4px",
    borderBottom: "1px solid var(--color-border)",
    backgroundColor: "color-mix(in oklch, var(--color-muted) 50%, transparent)",
  }),
  group: (base) => ({
    ...base,
    paddingTop: 0,
    paddingBottom: "4px",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? "var(--color-accent)" : "transparent",
    color: state.isFocused
      ? "var(--color-accent-foreground)"
      : "var(--color-popover-foreground)",
    cursor: "pointer",
    padding: "6px 10px",
  }),
  input: (base) => ({ ...base, color: "var(--color-foreground)" }),
  placeholder: (base) => ({ ...base, color: "var(--color-muted-foreground)" }),
};

const parsePrice = (val) => {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val === "object" && "$numberDecimal" in val) {
    const parsed = parseFloat(val.$numberDecimal);
    return isNaN(parsed) ? null : parsed;
  }
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
};

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/jpg"];

const CardBannerModal = ({
  open,
  onClose,
  bannerToEdit = null,
  nextOrder = 0,
  globalHeading = "",
}) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const isEditMode = Boolean(bannerToEdit);

  // Form states
  const [title, setTitle] = useState("");
  const [type, setType] = useState("card"); // "card" or "banner"
  const [text, setText] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [order, setOrder] = useState(nextOrder || 0);
  const [orderManuallyChanged, setOrderManuallyChanged] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Fetch existing banners to reliably calculate auto-order sequence (0, 1, 2...)
  const { data: allBannersResponse } = useQuery({
    queryKey: ["card-banners-for-order"],
    queryFn: () => fetchCardBanners({ params: { per_page: 100 } }),
    enabled: open && !bannerToEdit,
    staleTime: 10000,
  });

  const calculatedNextOrder = useMemo(() => {
    const list =
      allBannersResponse?.response?.data?.banners ||
      allBannersResponse?.data?.banners ||
      [];
    if (!list || list.length === 0) {
      return typeof nextOrder === "number" ? nextOrder : 0;
    }
    const orders = list.map((b) =>
      typeof b.order === "number" ? b.order : parseInt(b.order, 10) || 0
    );
    const max = Math.max(...orders, -1);
    return max >= 0 ? max + 1 : 0;
  }, [allBannersResponse, nextOrder]);

  // Filters for product selection
  const [selectedPriceFilter, setSelectedPriceFilter] = useState("all");
  const [selectedBrandFilter, setSelectedBrandFilter] = useState("all");
  const [selectedDiscountFilter, setSelectedDiscountFilter] = useState("all");

  // Fetch products
  const { data: apiProductsResponse, isLoading: isProductsLoading } = useQuery({
    queryKey: ["products-for-card-banner"],
    queryFn: () => fetchProducts({ params: { page: 1, per_page: 1000 } }),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch brands
  const { data: apiBrandsResponse, isLoading: isBrandsLoading } = useQuery({
    queryKey: ["brands-for-card-banner"],
    queryFn: () => fetchBrand({ params: {} }),
    select: (data) => data?.response?.data || data?.data || [],
    staleTime: 5 * 60 * 1000,
  });

  // Brands map & list
  const brandsList = useMemo(() => {
    const list = Array.isArray(apiBrandsResponse)
      ? apiBrandsResponse
      : apiBrandsResponse?.brands || [];
    return list.filter((b) => b && b._id);
  }, [apiBrandsResponse]);

  const brandsMap = useMemo(() => {
    const map = new Map();
    brandsList.forEach((b) => {
      map.set(b._id, b.name);
    });
    return map;
  }, [brandsList]);

  // Normalize all products with images, brand names, and price/discount calculations
  const allProductItems = useMemo(() => {
    const products = apiProductsResponse?.data || [];
    const itemsMap = new Map();

    products.forEach((p) => {
      let brandId = null;
      let brandName = "";
      if (p.brand && typeof p.brand === "object") {
        brandId = p.brand._id;
        brandName = p.brand.name || "";
      } else if (p.brand && typeof p.brand === "string") {
        brandId = p.brand;
        brandName = brandsMap.get(p.brand) || "";
      }

      const image =
        p.banner_image ||
        (Array.isArray(p.images) && p.images[0]) ||
        "";

      const price = parsePrice(p.price);
      const discountedPrice = parsePrice(p.discounted_price);
      const discountPercent =
        price && discountedPrice && discountedPrice < price
          ? Math.round(((price - discountedPrice) / price) * 100)
          : 0;

      const effectivePrice =
        discountedPrice !== null && discountedPrice !== undefined
          ? discountedPrice
          : price;

      itemsMap.set(p._id, {
        value: p._id,
        label: p.sku ? `${p.name} (${p.sku})` : p.name,
        name: p.name,
        sku: p.sku || "",
        image,
        brandId,
        brandName,
        price,
        discountedPrice,
        effectivePrice,
        discountPercent,
      });
    });

    return Array.from(itemsMap.values());
  }, [apiProductsResponse, brandsMap]);

  // Quick lookup map for products by ID
  const productOptionsMap = useMemo(() => {
    const map = new Map();
    allProductItems.forEach((p) => map.set(p.value, p));
    return map;
  }, [allProductItems]);

  // Filter products by Brand, Price range (including 299 to 999), and Discount
  const filteredProducts = useMemo(() => {
    return allProductItems.filter((p) => {
      // 1. Price Filter
      if (selectedPriceFilter !== "all") {
        const ep = p.effectivePrice;
        if (ep === null || ep === undefined) return false;

        if (selectedPriceFilter === "299_999") {
          // ₹299 to ₹999
          if (ep < 299 || ep > 999) return false;
        } else if (selectedPriceFilter === "under_299") {
          // Under ₹299
          if (ep >= 299) return false;
        } else if (selectedPriceFilter === "299_499") {
          // ₹299 to ₹499
          if (ep < 299 || ep > 499) return false;
        } else if (selectedPriceFilter === "499_999") {
          // ₹499 to ₹999
          if (ep < 499 || ep > 999) return false;
        } else if (selectedPriceFilter === "999_1999") {
          // ₹999 to ₹1999
          if (ep < 999 || ep > 1999) return false;
        } else if (selectedPriceFilter === "1999_plus") {
          // ₹1999 & Above
          if (ep < 1999) return false;
        }
      }

      // 2. Brand Filter
      if (selectedBrandFilter !== "all") {
        if (selectedBrandFilter === "unbranded") {
          if (p.brandId || p.brandName) return false;
        } else if (p.brandId !== selectedBrandFilter) {
          return false;
        }
      }

      // 3. Discount Filter
      if (selectedDiscountFilter === "any") {
        if (p.discountPercent <= 0) return false;
      } else if (selectedDiscountFilter === "10_plus") {
        if (p.discountPercent < 10) return false;
      } else if (selectedDiscountFilter === "20_plus") {
        if (p.discountPercent < 20) return false;
      } else if (selectedDiscountFilter === "30_plus") {
        if (p.discountPercent < 30) return false;
      } else if (selectedDiscountFilter === "50_plus") {
        if (p.discountPercent < 50) return false;
      }

      return true;
    });
  }, [allProductItems, selectedPriceFilter, selectedBrandFilter, selectedDiscountFilter]);

  // Grouped options for react-select (separated by brand)
  const groupedOptions = useMemo(() => {
    if (selectedBrandFilter !== "all") {
      return filteredProducts;
    }

    const groups = new Map();
    filteredProducts.forEach((p) => {
      const groupKey = p.brandName || "Other / No Brand";
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey).push(p);
    });

    const sortedGroupKeys = Array.from(groups.keys()).sort((a, b) => {
      if (a === "Other / No Brand") return 1;
      if (b === "Other / No Brand") return -1;
      return a.localeCompare(b);
    });

    return sortedGroupKeys.map((groupKey) => ({
      label: `${groupKey} (${groups.get(groupKey).length})`,
      options: groups.get(groupKey),
    }));
  }, [filteredProducts, selectedBrandFilter]);

  useEffect(() => {
    if (open) {
      if (bannerToEdit) {
        setTitle(bannerToEdit.title || "");
        setType(bannerToEdit.is_banner ? "banner" : "card");
        setText(bannerToEdit.text || "");
        setOrder(bannerToEdit.order ?? 0);
        setOrderManuallyChanged(true);
        setIsActive(
          bannerToEdit.is_active !== undefined ? bannerToEdit.is_active : true
        );
        setImageFile(null);
        setImagePreview(
          bannerToEdit.banner_url ||
            bannerToEdit.banner_image ||
            bannerToEdit.image ||
            null
        );

        // Pre-fill selected product IDs
        const rawProducts = bannerToEdit.products || [];
        const ids = rawProducts
          .map((p) => (typeof p === "object" ? p._id : p))
          .filter(Boolean);
        setSelectedProductIds(ids);
      } else {
        setTitle("");
        setType("card");
        setText("");
        setSelectedProductIds([]);
        setOrder(calculatedNextOrder);
        setOrderManuallyChanged(false);
        setIsActive(true);
        setImageFile(null);
        setImagePreview(null);
        setSelectedPriceFilter("all");
        setSelectedBrandFilter("all");
        setSelectedDiscountFilter("all");
      }
    }
  }, [open, bannerToEdit, globalHeading, calculatedNextOrder]);

  // Synchronize auto-filled order if calculatedNextOrder updates and user hasn't typed their own order
  useEffect(() => {
    if (open && !bannerToEdit && !orderManuallyChanged) {
      setOrder(calculatedNextOrder);
    }
  }, [open, bannerToEdit, calculatedNextOrder, orderManuallyChanged]);

  const handleFileChange = (file) => {
    if (!file) return;
    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      toast.error("Only PNG and JPG images are allowed.");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = (e) => {
    e.stopPropagation();
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Product Selection Handlers
  const handleProductSelectChange = (selectedOpts) => {
    const ids = selectedOpts ? selectedOpts.map((opt) => opt.value) : [];
    setSelectedProductIds(ids);
  };

  const handleSelectAllFiltered = () => {
    const idsToAdd = filteredProducts.map((p) => p.value);
    setSelectedProductIds((prev) => Array.from(new Set([...prev, ...idsToAdd])));
    toast.success(`Selected all ${idsToAdd.length} filtered products`);
  };

  const removeSelectedProduct = (productId) => {
    setSelectedProductIds((prev) => prev.filter((id) => id !== productId));
  };

  const clearAllProducts = () => {
    setSelectedProductIds([]);
  };

  // Custom filter option matching Product Name, SKU, Brand, Discount, and Price
  const filterOption = (candidate, input) => {
    if (!input) return true;
    const search = input.toLowerCase().trim();
    const data = candidate.data;
    if (!data) return false;
    const name = (data.name || "").toLowerCase();
    const sku = (data.sku || "").toLowerCase();
    const brand = (data.brandName || "").toLowerCase();
    const discountStr = data.discountPercent > 0 ? `${data.discountPercent}%` : "";
    const priceStr = data.effectivePrice ? `${data.effectivePrice}` : "";

    return (
      name.includes(search) ||
      sku.includes(search) ||
      brand.includes(search) ||
      discountStr.includes(search) ||
      priceStr.includes(search)
    );
  };

  // Format option label with product thumbnail, brand, discount, and price
  const formatOptionLabel = (option) => (
    <div className="flex items-center gap-2.5 py-1">
      {option.image ? (
        <img
          src={option.image}
          alt={option.name}
          className="size-8 rounded object-cover border border-border shrink-0"
        />
      ) : (
        <div className="size-8 rounded bg-muted flex items-center justify-center border border-border shrink-0">
          <Package className="size-4 text-muted-foreground" />
        </div>
      )}
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-foreground truncate max-w-[200px]">
            {option.name}
          </span>
          {option.brandName && (
            <span className="bg-secondary text-secondary-foreground text-[10px] px-1 rounded font-medium">
              {option.brandName}
            </span>
          )}
          {option.discountPercent > 0 && (
            <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] px-1 rounded font-bold">
              {option.discountPercent}% OFF
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
          {option.sku && <span>SKU: {option.sku}</span>}
          {option.discountedPrice && option.price && option.discountedPrice < option.price ? (
            <span className="font-semibold text-foreground">
              ₹{option.discountedPrice}{" "}
              <span className="line-through text-muted-foreground font-normal">
                ₹{option.price}
              </span>
            </span>
          ) : option.price ? (
            <span className="font-semibold text-foreground">₹{option.price}</span>
          ) : null}
        </div>
      </div>
    </div>
  );

  // Selected products objects for preview grid
  const selectedOptionsValue = useMemo(() => {
    return selectedProductIds
      .map((id) => productOptionsMap.get(id))
      .filter(Boolean);
  }, [selectedProductIds, productOptionsMap]);

  // Create mutation
  const { mutate: createMutation, isPending: isCreating } = useMutation({
    mutationFn: createCardBanner,
    onSuccess: async (res) => {
      const isSuccess =
        !res?.error &&
        (res?.response?.success ||
          res?.success ||
          (res?.response?.statusCode >= 200 && res?.response?.statusCode < 300) ||
          (res?.response?.status >= 200 && res?.response?.status < 300));

      if (isSuccess) {
        toast.success(
          type === "card"
            ? "Card created successfully."
            : "Banner created successfully."
        );
        queryClient.invalidateQueries({ queryKey: ["card-banners"] });
        onClose();
      } else {
        const errorMsg =
          res?.response?.data?.message ||
          res?.response?.data?.error ||
          res?.response?.message ||
          res?.message ||
          "Failed to create card banner.";
        console.error("Create card banner failed:", res);
        toast.error(errorMsg);
      }
    },
    onError: (error) => {
      console.error("Create card banner mutation error:", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "An error occurred while creating the card banner.";
      toast.error(errorMsg);
    },
  });

  // Update mutation
  const { mutate: updateMutation, isPending: isUpdating } = useMutation({
    mutationFn: updateCardBanner,
    onSuccess: (res) => {
      const isSuccess =
        !res?.error &&
        (res?.response?.success ||
          res?.success ||
          (res?.response?.statusCode >= 200 && res?.response?.statusCode < 300) ||
          (res?.response?.status >= 200 && res?.response?.status < 300));

      if (isSuccess) {
        toast.success("Card banner updated successfully.");
        queryClient.invalidateQueries({ queryKey: ["card-banners"] });
        onClose();
      } else {
        const errorMsg =
          res?.response?.data?.message ||
          res?.response?.data?.error ||
          res?.response?.message ||
          res?.message ||
          "Failed to update card banner.";
        console.error("Update card banner failed:", res);
        toast.error(errorMsg);
      }
    },
    onError: (error) => {
      console.error("Update card banner mutation error:", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "An error occurred while updating the card banner.";
      toast.error(errorMsg);
    },
  });

  const isSubmitting = isCreating || isUpdating;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isEditMode && !imageFile) {
      toast.error("Please upload an image (PNG or JPG).");
      return;
    }

    if (isEditMode && !imageFile && !imagePreview) {
      toast.error("Image is required.");
      return;
    }

    const finalHeading = (globalHeading !== undefined ? globalHeading : bannerToEdit?.heading || "").trim();

    // When editing without changing image, send clean JSON
    if (isEditMode && !imageFile) {
      const payload = {
        heading: finalHeading,
        title: title.trim(),
        text: text.trim(),
        is_card: type === "card",
        is_banner: type === "banner",
        order: Number(order) || 0,
        is_active: Boolean(isActive),
        products: selectedProductIds,
      };

      updateMutation({
        id: bannerToEdit._id,
        data: payload,
      });
      return;
    }

    // Build FormData
    const formData = new FormData();
    if (imageFile) {
      formData.append("banner_image", imageFile);
    }
    formData.append("heading", finalHeading);
    formData.append("title", title.trim());
    formData.append("text", text.trim());
    formData.append("is_card", String(type === "card"));
    formData.append("is_banner", String(type === "banner"));
    formData.append("order", String(Number(order) || 0));
    formData.append("is_active", String(isActive));
    formData.append("products", JSON.stringify(selectedProductIds));

    if (isEditMode) {
      updateMutation({
        id: bannerToEdit._id,
        data: formData,
      });
    } else {
      createMutation(formData);
    }
  };

  const isAnyFilterActive =
    selectedPriceFilter !== "all" ||
    selectedBrandFilter !== "all" ||
    selectedDiscountFilter !== "all";

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isSubmitting && onClose(isOpen)}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            {type === "card" ? (
              <CreditCard className="size-5 text-purple-600" />
            ) : (
              <Layers className="size-5 text-emerald-600" />
            )}
            <span>
              {isEditMode
                ? type === "card"
                  ? "Edit Card"
                  : "Edit Banner"
                : type === "card"
                ? "Add New Card"
                : "Add New Banner"}
            </span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          {/* 1. Section Heading */}
          <div className="space-y-1.5 p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/40">
            <Label htmlFor="banner-heading-display" className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
              <Tag className="size-4 text-blue-600 dark:text-blue-400" />
              <span>Section Heading (Shared by all banners)</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 ml-auto flex items-center gap-0.5">
                <Lock className="size-2.5" /> Read only
              </span>
            </Label>
            <Input
              id="banner-heading-display"
              value={globalHeading || bannerToEdit?.heading || ""}
              disabled
              readOnly
              placeholder="No global heading configured"
              className="bg-muted text-muted-foreground font-medium cursor-not-allowed select-none opacity-80"
            />
            <p className="text-[11px] text-muted-foreground">
              Heading cannot be changed from this dialog. Use &ldquo;All Card Banners Heading&rdquo; on the main page to change it.
            </p>
          </div>

          {/* 2. Type Selector & Active Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Type Selector: Card vs Banner */}
            <div className="md:col-span-8 space-y-1.5">
              <Label className="text-sm font-semibold">Type Selector</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType("card")}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border transition-all cursor-pointer text-sm font-medium ${
                    type === "card"
                      ? "border-purple-500 bg-purple-500/15 text-purple-700 dark:text-purple-300 font-bold shadow-xs ring-2 ring-purple-400"
                      : "border-border hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <CreditCard className="size-4" />
                  <span>Card (is_card)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType("banner")}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border transition-all cursor-pointer text-sm font-medium ${
                    type === "banner"
                      ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs ring-2 ring-emerald-400"
                      : "border-border hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <Layers className="size-4" />
                  <span>Banner (is_banner)</span>
                </button>
              </div>
            </div>

            {/* Active Toggle Switch */}
            <div className="md:col-span-4 rounded-xl border border-border/80 p-3 bg-muted/20 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="active-toggle" className="text-sm font-medium cursor-pointer">
                    Active Status
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    {isActive ? "Visible on store" : "Hidden"}
                  </p>
                </div>
                <Switch
                  id="active-toggle"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            </div>
          </div>

          {/* 3. Image Uploader & Promo Subtitle */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Banner Image Uploader: PNG / JPG only */}
            <div className="md:col-span-7 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">
                  Banner Image (PNG / JPG) <span className="text-destructive">*</span>
                </Label>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="text-xs text-destructive hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <X className="size-3" />
                    <span>Remove</span>
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".png, .jpg, .jpeg, image/png, image/jpeg"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              {imagePreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-muted aspect-[21/9] sm:aspect-[16/6] flex items-center justify-center"
                >
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover transition duration-200 group-hover:scale-[1.02] group-hover:brightness-90"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium text-xs gap-1.5">
                    <UploadCloud className="size-4" />
                    <span>Click to replace image</span>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`cursor-pointer border-2 border-dashed rounded-xl p-5 transition-colors flex flex-col items-center justify-center gap-2 text-center ${
                    isDragOver
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/60 hover:bg-muted/30"
                  }`}
                >
                  <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <UploadCloud className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      Click to browse or drag &amp; drop PNG or JPG image
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Only .png, .jpg, .jpeg
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Subtitle / Promo Text & Display Order */}
            <div className="md:col-span-5 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="banner-text" className="text-sm font-medium">
                  Subtitle / Promo Text <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Input
                  id="banner-text"
                  placeholder="e.g. Get up to 40% OFF on organic items"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="banner-order" className="text-sm font-medium flex items-center gap-1.5">
                    <Hash className="size-4 text-muted-foreground" />
                    <span>Display Order</span>
                  </Label>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {isEditMode ? "Priority order" : `Auto-filled (${order})`}
                  </span>
                </div>
                <Input
                  id="banner-order"
                  type="number"
                  min="0"
                  value={order}
                  onChange={(e) => {
                    setOrderManuallyChanged(true);
                    setOrder(e.target.value);
                  }}
                  placeholder={String(calculatedNextOrder)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Auto-fills sequentially (0, 1, 2...). Lower numbers display first.
                </p>
              </div>
            </div>
          </div>

          {/* 4. LINKED PRODUCTS SECTION (WITH PRICE 299 TO 999 FILTER, BRAND FILTER, DISCOUNT FILTER) */}
          <div className="space-y-3 pt-2 border-t border-border/60">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Package className="size-4 text-primary" />
                <Label className="text-sm font-semibold">
                  Linked Products
                </Label>
                {selectedProductIds.length > 0 && (
                  <span className="bg-primary/15 text-primary rounded-full px-2.5 py-0.5 text-xs font-bold">
                    {selectedProductIds.length} Selected
                  </span>
                )}
              </div>

              {/* Action Buttons: Select All Filtered & Clear All */}
              <div className="flex flex-wrap items-center gap-2">
                {isAnyFilterActive && filteredProducts.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs font-semibold border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 cursor-pointer"
                    onClick={handleSelectAllFiltered}
                  >
                    <CheckSquare className="size-3.5" />
                    <span>
                      Select All Filtered ({filteredProducts.length})
                    </span>
                  </Button>
                )}

                {selectedProductIds.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllProducts}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors cursor-pointer px-1 py-0.5"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {/* FILTERS BAR: Price Filter (including 299 to 999), Brand Filter, Discount Filter */}
            <div className="p-3 rounded-xl bg-muted/40 border border-border/80 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* 1. Price Filter (299 to 999 highlight) */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                  <IndianRupee className="size-3 text-emerald-600" />
                  <span>Price Range Filter:</span>
                </span>
                <select
                  value={selectedPriceFilter}
                  onChange={(e) => setSelectedPriceFilter(e.target.value)}
                  className="w-full border-input bg-background text-foreground h-8 rounded-md border px-2 text-xs focus:ring-ring focus:outline-none focus:ring-2 cursor-pointer font-medium"
                >
                  <option value="all">All Prices</option>
                  <option value="299_999" className="font-bold text-emerald-600">
                    ★ ₹299 to ₹999
                  </option>
                  <option value="under_299">Under ₹299</option>
                  <option value="299_499">₹299 to ₹499</option>
                  <option value="499_999">₹499 to ₹999</option>
                  <option value="999_1999">₹999 to ₹1,999</option>
                  <option value="1999_plus">₹1,999 &amp; Above</option>
                </select>
              </div>

              {/* 2. Brand Filter */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                  <Filter className="size-3 text-indigo-500" />
                  <span>Brand Filter:</span>
                </span>
                <select
                  value={selectedBrandFilter}
                  onChange={(e) => setSelectedBrandFilter(e.target.value)}
                  className="w-full border-input bg-background text-foreground h-8 rounded-md border px-2 text-xs focus:ring-ring focus:outline-none focus:ring-2 cursor-pointer"
                >
                  <option value="all">All Brands ({brandsList.length})</option>
                  {brandsList.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                  <option value="unbranded">Other / No Brand</option>
                </select>
              </div>

              {/* 3. Sale / Discount Filter */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                  <Tag className="size-3 text-amber-500" />
                  <span>Discount / Sale Filter:</span>
                </span>
                <select
                  value={selectedDiscountFilter}
                  onChange={(e) => setSelectedDiscountFilter(e.target.value)}
                  className="w-full border-input bg-background text-foreground h-8 rounded-md border px-2 text-xs focus:ring-ring focus:outline-none focus:ring-2 cursor-pointer"
                >
                  <option value="all">All Discounts</option>
                  <option value="any">On Sale (Any % Off)</option>
                  <option value="10_plus">10% Off or more</option>
                  <option value="20_plus">20% Off or more</option>
                  <option value="30_plus">30% Off or more</option>
                  <option value="50_plus">50% Off or more</option>
                </select>
              </div>
            </div>

            {/* React Select with Grouped Options, Search, and Custom Labels */}
            <Select
              isMulti
              placeholder="Search products by name, SKU, brand, price (e.g. 299)..."
              isLoading={isProductsLoading || isBrandsLoading}
              isClearable
              closeMenuOnSelect={false}
              styles={selectStyles}
              options={groupedOptions}
              value={selectedOptionsValue}
              onChange={handleProductSelectChange}
              formatOptionLabel={formatOptionLabel}
              filterOption={filterOption}
            />

            <p className="text-muted-foreground text-[11px]">
              Tip: Select the <strong>₹299 to ₹999</strong> price filter above and click <strong>"Select All Filtered"</strong> to instantly link all products in that price tier!
            </p>

            {/* Selected Products Preview Grid with Images, Prices, and Remove Buttons */}
            {selectedOptionsValue.length > 0 && (
              <div className="space-y-2 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Selected Products Preview ({selectedOptionsValue.length}):
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Click ✕ to remove any product
                  </span>
                </div>

                <div className="grid max-h-56 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 overflow-y-auto rounded-xl border border-border bg-muted/20 p-2.5">
                  {selectedOptionsValue.map((prod) => (
                    <div
                      key={prod.value}
                      className="border-border bg-card shadow-2xs flex items-center gap-2 rounded-lg border p-2 text-xs transition-all hover:border-primary/40 group"
                    >
                      {prod.image ? (
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="size-9 shrink-0 rounded-md border border-border object-cover"
                        />
                      ) : (
                        <div className="size-9 shrink-0 rounded-md bg-muted border border-border flex items-center justify-center text-muted-foreground">
                          <Package className="size-4" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-foreground truncate font-medium" title={prod.name}>
                          {prod.name}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap text-[10px] mt-0.5">
                          {prod.brandName && (
                            <span className="bg-secondary text-secondary-foreground px-1 rounded truncate max-w-[80px]">
                              {prod.brandName}
                            </span>
                          )}
                          {prod.discountPercent > 0 && (
                            <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold px-1 rounded">
                              {prod.discountPercent}%
                            </span>
                          )}
                          {prod.effectivePrice !== null && prod.effectivePrice !== undefined && (
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              ₹{prod.effectivePrice}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSelectedProduct(prod.value)}
                        className="text-muted-foreground hover:bg-destructive/15 hover:text-destructive shrink-0 rounded p-1 transition-colors cursor-pointer"
                        title="Remove"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-border/60 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-28 gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>{isEditMode ? "Updating..." : "Creating..."}</span>
                </>
              ) : (
                <span>{isEditMode ? "Update Card Banner" : "Create Card Banner"}</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CardBannerModal;
