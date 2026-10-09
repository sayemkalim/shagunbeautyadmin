import React, { useState, useEffect, useMemo } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import Select from "react-select";
import { format } from "date-fns";
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
import { Badge } from "@/components/ui/badge";
import {
  Flame,
  Zap,
  Package,
  Store,
  Grid,
  Globe,
  Loader2,
  Calendar,
  Clock,
  CheckCircle2,
  X,
  Sparkles,
  CheckSquare,
  IndianRupee,
  Tag,
  Filter,
  Info,
  Layers,
} from "lucide-react";
import { createDealCampaign } from "../helpers/createDealCampaign";
import { updateDealCampaign } from "../helpers/updateDealCampaign";
import { fetchProducts } from "@/pages/products/components/helpers/fetchProducts";
import { fetchBrand } from "@/pages/brands/helpers/fetchBrand";
import { fetchCategory } from "@/pages/categories/helpers/fetchCategory";

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

// Formats a Date object or ISO string into datetime-local value format (YYYY-MM-DDTHH:mm)
const toDateTimeLocalValue = (dateInput) => {
  if (!dateInput) return "";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return "";
  }
};

const TITLE_PRESETS = [
  "Lowest Price Live",
  "Flash Sale",
  "Midnight Deals",
  "Super Weekend Sale",
  "Mega Beauty Deals",
];

const TARGET_SCOPES = [
  {
    id: "SPECIFIC_PRODUCTS",
    label: "Specific Products",
    description: "Apply deal only to selected products",
    icon: Package,
    color: "text-blue-600 dark:text-blue-400",
    bgActive: "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300 ring-2 ring-blue-400",
  },
  {
    id: "BY_BRAND",
    label: "By Brand",
    description: "Apply deal to all products under chosen brands",
    icon: Store,
    color: "text-purple-600 dark:text-purple-400",
    bgActive: "border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-300 ring-2 ring-purple-400",
  },
  {
    id: "BY_CATEGORY",
    label: "By Category",
    description: "Apply deal to all products in chosen categories",
    icon: Grid,
    color: "text-amber-600 dark:text-amber-400",
    bgActive: "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-2 ring-amber-400",
  },
  {
    id: "ALL_PRODUCTS",
    label: "All Products (Storewide)",
    description: "Apply deal timer to entire store catalog",
    icon: Globe,
    color: "text-emerald-600 dark:text-emerald-400",
    bgActive: "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-400",
  },
];

const DealCampaignModal = ({ open, onClose, campaignToEdit = null }) => {
  const queryClient = useQueryClient();
  const isEditMode = Boolean(campaignToEdit);

  // Form states
  const [title, setTitle] = useState("Lowest Price Live");
  const [saleEndTime, setSaleEndTime] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [applyTo, setApplyTo] = useState("SPECIFIC_PRODUCTS");
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [selectedBrandIds, setSelectedBrandIds] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);

  // Filter states for product picker
  const [selectedPriceFilter, setSelectedPriceFilter] = useState("all");
  const [selectedBrandFilter, setSelectedBrandFilter] = useState("all");
  const [selectedDiscountFilter, setSelectedDiscountFilter] = useState("all");

  // Fetch Products
  const { data: apiProductsResponse, isLoading: isProductsLoading } = useQuery({
    queryKey: ["products-for-deal-campaign"],
    queryFn: () => fetchProducts({ params: { page: 1, per_page: 1000 } }),
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch Brands
  const { data: apiBrandsResponse, isLoading: isBrandsLoading } = useQuery({
    queryKey: ["brands-for-deal-campaign"],
    queryFn: () => fetchBrand({ params: {} }),
    enabled: open,
    select: (data) => data?.response?.data || data?.data || [],
    staleTime: 5 * 60 * 1000,
  });

  // Fetch Categories
  const { data: apiCategoriesResponse, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["categories-for-deal-campaign"],
    queryFn: () => fetchCategory({ params: {} }),
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  // Normalize Brands
  const brandsList = useMemo(() => {
    const list = Array.isArray(apiBrandsResponse)
      ? apiBrandsResponse
      : apiBrandsResponse?.brands || [];
    return list.filter((b) => b && b._id);
  }, [apiBrandsResponse]);

  const brandsMap = useMemo(() => {
    const map = new Map();
    brandsList.forEach((b) => map.set(b._id, b.name));
    return map;
  }, [brandsList]);

  // Normalize Categories
  const categoriesList = useMemo(() => {
    const raw =
      apiCategoriesResponse?.data?.categories ||
      apiCategoriesResponse?.data ||
      apiCategoriesResponse?.categories ||
      [];
    const list = Array.isArray(raw) ? raw : [];
    return list.filter((c) => c && c._id);
  }, [apiCategoriesResponse]);

  // Normalize Products
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

  const productOptionsMap = useMemo(() => {
    const map = new Map();
    allProductItems.forEach((p) => map.set(p.value, p));
    return map;
  }, [allProductItems]);

  // Brand Options for react-select
  const brandOptions = useMemo(() => {
    return brandsList.map((b) => ({
      value: b._id,
      label: b.name,
      name: b.name,
      logo: b.images?.[0] || b.logo || "",
    }));
  }, [brandsList]);

  const brandOptionsMap = useMemo(() => {
    const map = new Map();
    brandOptions.forEach((b) => map.set(b.value, b));
    return map;
  }, [brandOptions]);

  // Category Options for react-select
  const categoryOptions = useMemo(() => {
    return categoriesList.map((c) => ({
      value: c._id,
      label: c.name,
      name: c.name,
      image: c.images?.[0] || c.image || "",
    }));
  }, [categoriesList]);

  const categoryOptionsMap = useMemo(() => {
    const map = new Map();
    categoryOptions.forEach((c) => map.set(c.value, c));
    return map;
  }, [categoryOptions]);

  // Filtered Products for picker
  const filteredProducts = useMemo(() => {
    return allProductItems.filter((p) => {
      // 1. Price Filter
      if (selectedPriceFilter !== "all") {
        const ep = p.effectivePrice;
        if (ep === null || ep === undefined) return false;

        if (selectedPriceFilter === "under_299" && ep >= 299) return false;
        if (selectedPriceFilter === "299_999" && (ep < 299 || ep > 999)) return false;
        if (selectedPriceFilter === "999_1999" && (ep < 999 || ep > 1999)) return false;
        if (selectedPriceFilter === "1999_plus" && ep < 1999) return false;
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
      if (selectedDiscountFilter === "any" && p.discountPercent <= 0) return false;
      if (selectedDiscountFilter === "20_plus" && p.discountPercent < 20) return false;
      if (selectedDiscountFilter === "40_plus" && p.discountPercent < 40) return false;

      return true;
    });
  }, [allProductItems, selectedPriceFilter, selectedBrandFilter, selectedDiscountFilter]);

  // Grouped Product Options
  const groupedProductOptions = useMemo(() => {
    if (selectedBrandFilter !== "all") return filteredProducts;

    const groups = new Map();
    filteredProducts.forEach((p) => {
      const groupKey = p.brandName || "Other / No Brand";
      if (!groups.has(groupKey)) groups.set(groupKey, []);
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

  // Reset or Populate Form when opening modal
  useEffect(() => {
    if (open) {
      if (campaignToEdit) {
        setTitle(campaignToEdit.title || "Lowest Price Live");
        setSaleEndTime(toDateTimeLocalValue(campaignToEdit.sale_end_time));
        setIsActive(campaignToEdit.is_active !== undefined ? campaignToEdit.is_active : true);
        setApplyTo(campaignToEdit.apply_to || "SPECIFIC_PRODUCTS");

        // Extract products
        const pIds = (campaignToEdit.product_ids || [])
          .map((p) => (typeof p === "object" ? p._id : p))
          .filter(Boolean);
        setSelectedProductIds(pIds);

        // Extract brands
        const bIds = (campaignToEdit.brand_ids || [])
          .map((b) => (typeof b === "object" ? b._id : b))
          .filter(Boolean);
        setSelectedBrandIds(bIds);

        // Extract categories
        const cIds = (campaignToEdit.category_ids || [])
          .map((c) => (typeof c === "object" ? c._id : c))
          .filter(Boolean);
        setSelectedCategoryIds(cIds);
      } else {
        setTitle("Lowest Price Live");
        // Default sale_end_time to 48 hours from now
        const defaultEnd = new Date(Date.now() + 48 * 60 * 60 * 1000);
        setSaleEndTime(toDateTimeLocalValue(defaultEnd));
        setIsActive(true);
        setApplyTo("SPECIFIC_PRODUCTS");
        setSelectedProductIds([]);
        setSelectedBrandIds([]);
        setSelectedCategoryIds([]);
        setSelectedPriceFilter("all");
        setSelectedBrandFilter("all");
        setSelectedDiscountFilter("all");
      }
    }
  }, [open, campaignToEdit]);

  // Preset End Time Buttons Handler
  const handleQuickDuration = (hoursToAdd, isEndOfDay = false) => {
    const now = new Date();
    if (isEndOfDay) {
      now.setHours(23, 59, 59, 999);
      setSaleEndTime(toDateTimeLocalValue(now));
      return;
    }
    const target = new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000);
    setSaleEndTime(toDateTimeLocalValue(target));
  };

  // Create Mutation
  const { mutate: createMutation, isPending: isCreating } = useMutation({
    mutationFn: createDealCampaign,
    onSuccess: (res) => {
      const isSuccess =
        !res?.error &&
        (res?.response?.success ||
          res?.success ||
          (res?.response?.statusCode >= 200 && res?.response?.statusCode < 300));

      if (isSuccess) {
        toast.success("Deal campaign created successfully.");
        queryClient.invalidateQueries({ queryKey: ["deal-campaigns"] });
        onClose();
      } else {
        const errorMsg =
          res?.response?.data?.message ||
          res?.response?.message ||
          res?.message ||
          "Failed to create deal campaign.";
        toast.error(errorMsg);
      }
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "An error occurred.");
    },
  });

  // Update Mutation
  const { mutate: updateMutation, isPending: isUpdating } = useMutation({
    mutationFn: updateDealCampaign,
    onSuccess: (res) => {
      const isSuccess =
        !res?.error &&
        (res?.response?.success ||
          res?.success ||
          (res?.response?.statusCode >= 200 && res?.response?.statusCode < 300));

      if (isSuccess) {
        toast.success("Deal campaign updated successfully.");
        queryClient.invalidateQueries({ queryKey: ["deal-campaigns"] });
        onClose();
      } else {
        const errorMsg =
          res?.response?.data?.message ||
          res?.response?.message ||
          res?.message ||
          "Failed to update deal campaign.";
        toast.error(errorMsg);
      }
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "An error occurred.");
    },
  });

  const isSubmitting = isCreating || isUpdating;

  // Submit Handler
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Campaign title is required.");
      return;
    }

    if (!saleEndTime) {
      toast.error("Please specify a Sale End Time.");
      return;
    }

    const endDate = new Date(saleEndTime);
    if (isNaN(endDate.getTime())) {
      toast.error("Invalid Sale End Time format.");
      return;
    }

    if (applyTo === "SPECIFIC_PRODUCTS" && selectedProductIds.length === 0) {
      toast.error("Please select at least one product for this campaign.");
      return;
    }

    if (applyTo === "BY_BRAND" && selectedBrandIds.length === 0) {
      toast.error("Please select at least one brand for this campaign.");
      return;
    }

    if (applyTo === "BY_CATEGORY" && selectedCategoryIds.length === 0) {
      toast.error("Please select at least one category for this campaign.");
      return;
    }

    const payload = {
      title: title.trim(),
      sale_end_time: endDate.toISOString(),
      is_active: Boolean(isActive),
      apply_to: applyTo,
      product_ids: applyTo === "SPECIFIC_PRODUCTS" ? selectedProductIds : [],
      brand_ids: applyTo === "BY_BRAND" ? selectedBrandIds : [],
      category_ids: applyTo === "BY_CATEGORY" ? selectedCategoryIds : [],
    };

    if (isEditMode) {
      updateMutation({ id: campaignToEdit._id, data: payload });
    } else {
      createMutation(payload);
    }
  };

  // Selected values for react-select components
  const selectedProductOptions = useMemo(() => {
    return selectedProductIds.map((id) => productOptionsMap.get(id)).filter(Boolean);
  }, [selectedProductIds, productOptionsMap]);

  const selectedBrandOptions = useMemo(() => {
    return selectedBrandIds.map((id) => brandOptionsMap.get(id)).filter(Boolean);
  }, [selectedBrandIds, brandOptionsMap]);

  const selectedCategoryOptions = useMemo(() => {
    return selectedCategoryIds.map((id) => categoryOptionsMap.get(id)).filter(Boolean);
  }, [selectedCategoryIds, categoryOptionsMap]);

  // Format option label for products
  const formatProductOptionLabel = (option) => (
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
          <span className="text-xs font-semibold text-foreground truncate max-w-[220px]">
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
          {option.effectivePrice !== null && (
            <span className="font-semibold text-foreground">₹{option.effectivePrice}</span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isSubmitting && onClose(isOpen)}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <div className="size-8 rounded-lg bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <Flame className="size-5 fill-current" />
            </div>
            <span>{isEditMode ? "Edit Deal / Flash Sale Campaign" : "Create Deal / Flash Sale Campaign"}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-2">
          {/* 1. Title & Preset Tags */}
          <div className="space-y-2">
            <Label htmlFor="campaign-title" className="text-sm font-semibold flex items-center gap-1.5">
              <span>Campaign Title</span>
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="campaign-title"
              placeholder="e.g. Lowest Price Live, Flash Sale, Midnight Deals"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-base font-medium"
              required
            />
            {/* Quick suggestions */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                <Sparkles className="size-3 text-amber-500" /> Quick suggestions:
              </span>
              {TITLE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTitle(preset)}
                  className={`text-[11px] px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                    title === preset
                      ? "bg-primary text-primary-foreground border-primary font-medium"
                      : "bg-muted/50 hover:bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Sale End Time Picker & Active Switch */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* End Time Picker */}
            <div className="md:col-span-8 space-y-2">
              <Label htmlFor="campaign-end-time" className="text-sm font-semibold flex items-center gap-1.5">
                <Clock className="size-4 text-primary" />
                <span>Sale End Time (Countdown Expiration)</span>
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="campaign-end-time"
                type="datetime-local"
                value={saleEndTime}
                onChange={(e) => setSaleEndTime(e.target.value)}
                className="font-medium"
                required
              />
              {/* Quick Duration Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] text-muted-foreground">Quick set:</span>
                <button
                  type="button"
                  onClick={() => handleQuickDuration(0, true)}
                  className="text-[11px] px-2 py-0.5 rounded bg-muted/60 hover:bg-muted text-foreground border border-border cursor-pointer transition-colors"
                >
                  Tonight (23:59)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDuration(24)}
                  className="text-[11px] px-2 py-0.5 rounded bg-muted/60 hover:bg-muted text-foreground border border-border cursor-pointer transition-colors"
                >
                  +24 Hours
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDuration(48)}
                  className="text-[11px] px-2 py-0.5 rounded bg-muted/60 hover:bg-muted text-foreground border border-border cursor-pointer transition-colors"
                >
                  +48 Hours
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDuration(72)}
                  className="text-[11px] px-2 py-0.5 rounded bg-muted/60 hover:bg-muted text-foreground border border-border cursor-pointer transition-colors"
                >
                  +3 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDuration(168)}
                  className="text-[11px] px-2 py-0.5 rounded bg-muted/60 hover:bg-muted text-foreground border border-border cursor-pointer transition-colors"
                >
                  +7 Days
                </button>
              </div>
            </div>

            {/* Active Toggle Switch Card */}
            <div className="md:col-span-4 rounded-xl border border-border/80 p-3 bg-muted/20 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="active-toggle" className="text-sm font-semibold cursor-pointer">
                    Campaign Active
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    {isActive ? "🟢 Live & Visible" : "⚪ Paused / Hidden"}
                  </p>
                </div>
                <Switch id="active-toggle" checked={isActive} onCheckedChange={setIsActive} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 border-t border-border/40 pt-1.5">
                When active, storefront PDP &amp; cards will display the live countdown timer.
              </p>
            </div>
          </div>

          {/* 3. Target Scope Selector (apply_to) */}
          <div className="space-y-2.5 pt-2 border-t border-border/60">
            <Label className="text-sm font-semibold flex items-center gap-1.5">
              <Layers className="size-4 text-primary" />
              <span>Target Scope (Where does this deal apply?)</span>
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {TARGET_SCOPES.map((scope) => {
                const Icon = scope.icon;
                const isSelected = applyTo === scope.id;
                return (
                  <button
                    key={scope.id}
                    type="button"
                    onClick={() => setApplyTo(scope.id)}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? scope.bgActive
                        : "border-border hover:bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`size-4 ${scope.color}`} />
                      <span className="text-xs font-bold text-foreground">{scope.label}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground line-clamp-2">
                      {scope.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. DYNAMIC TARGET SELECTORS */}

          {/* A. SPECIFIC PRODUCTS SELECTOR */}
          {applyTo === "SPECIFIC_PRODUCTS" && (
            <div className="space-y-3 p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/20 dark:bg-blue-950/10">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Package className="size-4 text-blue-600 dark:text-blue-400" />
                  <Label className="text-sm font-semibold">Select Products</Label>
                  {selectedProductIds.length > 0 && (
                    <Badge variant="secondary" className="text-xs font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300">
                      {selectedProductIds.length} Selected
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {filteredProducts.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs font-medium border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50/50 dark:bg-blue-950/40 cursor-pointer"
                      onClick={() => {
                        const idsToAdd = filteredProducts.map((p) => p.value);
                        setSelectedProductIds((prev) => Array.from(new Set([...prev, ...idsToAdd])));
                        toast.success(`Selected all ${idsToAdd.length} filtered products`);
                      }}
                    >
                      <CheckSquare className="size-3 mr-1" />
                      Select All Filtered ({filteredProducts.length})
                    </Button>
                  )}

                  {selectedProductIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedProductIds([])}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>

              {/* Filters for product list */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 rounded-lg bg-background border border-border">
                {/* Price Filter */}
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                    <IndianRupee className="size-2.5 text-emerald-600" /> Price:
                  </span>
                  <select
                    value={selectedPriceFilter}
                    onChange={(e) => setSelectedPriceFilter(e.target.value)}
                    className="w-full border-input bg-background text-foreground h-7 rounded border px-2 text-xs cursor-pointer"
                  >
                    <option value="all">All Prices</option>
                    <option value="under_299">Under ₹299</option>
                    <option value="299_999">₹299 to ₹999</option>
                    <option value="999_1999">₹999 to ₹1,999</option>
                    <option value="1999_plus">₹1,999 &amp; Above</option>
                  </select>
                </div>

                {/* Brand Filter */}
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                    <Filter className="size-2.5 text-indigo-500" /> Brand:
                  </span>
                  <select
                    value={selectedBrandFilter}
                    onChange={(e) => setSelectedBrandFilter(e.target.value)}
                    className="w-full border-input bg-background text-foreground h-7 rounded border px-2 text-xs cursor-pointer"
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

                {/* Discount Filter */}
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                    <Tag className="size-2.5 text-amber-500" /> Discount:
                  </span>
                  <select
                    value={selectedDiscountFilter}
                    onChange={(e) => setSelectedDiscountFilter(e.target.value)}
                    className="w-full border-input bg-background text-foreground h-7 rounded border px-2 text-xs cursor-pointer"
                  >
                    <option value="all">All Discounts</option>
                    <option value="any">On Sale (Any % Off)</option>
                    <option value="20_plus">20% Off or more</option>
                    <option value="40_plus">40% Off or more</option>
                  </select>
                </div>
              </div>

              {/* React Select Products */}
              <Select
                isMulti
                placeholder="Search products by title, SKU, brand..."
                isLoading={isProductsLoading}
                isClearable
                closeMenuOnSelect={false}
                styles={selectStyles}
                options={groupedProductOptions}
                value={selectedProductOptions}
                onChange={(opts) => setSelectedProductIds(opts ? opts.map((o) => o.value) : [])}
                formatOptionLabel={formatProductOptionLabel}
              />

              {/* Selected Products Grid */}
              {selectedProductOptions.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Selected Items Preview:
                  </span>
                  <div className="grid max-h-48 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 overflow-y-auto rounded-lg border border-border bg-background p-2">
                    {selectedProductOptions.map((prod) => (
                      <div
                        key={prod.value}
                        className="flex items-center gap-2 rounded-md border border-border/80 bg-card p-1.5 text-xs group"
                      >
                        {prod.image ? (
                          <img
                            src={prod.image}
                            alt={prod.name}
                            className="size-8 rounded object-cover border shrink-0"
                          />
                        ) : (
                          <div className="size-8 rounded bg-muted flex items-center justify-center border shrink-0">
                            <Package className="size-3.5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground text-[11px]">
                            {prod.name}
                          </p>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            {prod.brandName && <span>{prod.brandName}</span>}
                            {prod.effectivePrice && <span>• ₹{prod.effectivePrice}</span>}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedProductIds((prev) => prev.filter((id) => id !== prod.value))
                          }
                          className="text-muted-foreground hover:text-destructive p-1 rounded cursor-pointer"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* B. BY BRAND SELECTOR */}
          {applyTo === "BY_BRAND" && (
            <div className="space-y-3 p-4 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/20 dark:bg-purple-950/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="size-4 text-purple-600 dark:text-purple-400" />
                  <Label className="text-sm font-semibold">Select Brands</Label>
                  {selectedBrandIds.length > 0 && (
                    <Badge variant="secondary" className="text-xs font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300">
                      {selectedBrandIds.length} Selected
                    </Badge>
                  )}
                </div>

                {selectedBrandIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedBrandIds([])}
                    className="text-xs text-muted-foreground hover:text-destructive cursor-pointer"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <Select
                isMulti
                placeholder="Search and select brands..."
                isLoading={isBrandsLoading}
                isClearable
                closeMenuOnSelect={false}
                styles={selectStyles}
                options={brandOptions}
                value={selectedBrandOptions}
                onChange={(opts) => setSelectedBrandIds(opts ? opts.map((o) => o.value) : [])}
              />

              {/* Selected Brand Chips */}
              {selectedBrandOptions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedBrandOptions.map((brand) => (
                    <span
                      key={brand.value}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800"
                    >
                      <Store className="size-3" />
                      <span>{brand.name}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedBrandIds((prev) => prev.filter((id) => id !== brand.value))
                        }
                        className="hover:text-destructive cursor-pointer ml-0.5"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* C. BY CATEGORY SELECTOR */}
          {applyTo === "BY_CATEGORY" && (
            <div className="space-y-3 p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Grid className="size-4 text-amber-600 dark:text-amber-400" />
                  <Label className="text-sm font-semibold">Select Categories</Label>
                  {selectedCategoryIds.length > 0 && (
                    <Badge variant="secondary" className="text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                      {selectedCategoryIds.length} Selected
                    </Badge>
                  )}
                </div>

                {selectedCategoryIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryIds([])}
                    className="text-xs text-muted-foreground hover:text-destructive cursor-pointer"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <Select
                isMulti
                placeholder="Search and select categories..."
                isLoading={isCategoriesLoading}
                isClearable
                closeMenuOnSelect={false}
                styles={selectStyles}
                options={categoryOptions}
                value={selectedCategoryOptions}
                onChange={(opts) => setSelectedCategoryIds(opts ? opts.map((o) => o.value) : [])}
              />

              {/* Selected Category Chips */}
              {selectedCategoryOptions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedCategoryOptions.map((cat) => (
                    <span
                      key={cat.value}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                    >
                      <Grid className="size-3" />
                      <span>{cat.name}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedCategoryIds((prev) => prev.filter((id) => id !== cat.value))
                        }
                        className="hover:text-destructive cursor-pointer ml-0.5"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* D. ALL PRODUCTS (STOREWIDE) INFO BANNER */}
          {applyTo === "ALL_PRODUCTS" && (
            <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                <Globe className="size-5 text-emerald-600 dark:text-emerald-400" />
                <span>Entire Store Catalog Selected (Storewide)</span>
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-400/90 leading-relaxed">
                This flash sale campaign will automatically apply to every active product across all categories and brands in the mobile app &amp; website. No individual product selection required.
              </p>
            </div>
          )}

          {/* Modal Actions */}
          <DialogFooter className="pt-4 border-t border-border/60 gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-32 gap-2 bg-primary">
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>{isEditMode ? "Updating..." : "Creating..."}</span>
                </>
              ) : (
                <>
                  <Flame className="size-4 fill-current" />
                  <span>{isEditMode ? "Update Campaign" : "Create Campaign"}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DealCampaignModal;
