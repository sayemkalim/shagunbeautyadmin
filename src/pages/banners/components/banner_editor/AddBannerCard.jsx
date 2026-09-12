import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import Select from "react-select";
import { X, Package, CheckSquare } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { updateBanner } from "../../helpers/updateBanner";
import { createBanner } from "../../helpers/createBanner";
import { fetchBanners } from "../../helpers/fetchBanners";
import { fetchProducts } from "@/pages/products/components/helpers/fetchProducts";
import { fetchBrand } from "@/pages/brands/helpers/fetchBrand";

const selectStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: "var(--color-background)",
    borderColor: state.isFocused ? "var(--color-ring)" : "var(--color-input)",
    boxShadow: state.isFocused ? "0 0 0 3px color-mix(in oklch, var(--color-ring) 50%, transparent)" : "none",
    "&:hover": { borderColor: "var(--color-ring)" },
    borderRadius: "var(--radius-md)",
    minHeight: "2.5rem",
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "var(--color-popover)",
    color: "var(--color-popover-foreground)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    overflow: "hidden",
    zIndex: 30,
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
    color: state.isFocused ? "var(--color-accent-foreground)" : "var(--color-popover-foreground)",
    cursor: "pointer",
    padding: "6px 10px",
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: "color-mix(in oklch, var(--color-primary) 12%, transparent)",
    borderRadius: "var(--radius-sm)",
  }),
  multiValueLabel: (base) => ({ ...base, color: "var(--color-primary)" }),
  multiValueRemove: (base) => ({
    ...base,
    color: "var(--color-primary)",
    "&:hover": { backgroundColor: "var(--color-primary)", color: "var(--color-primary-foreground)" },
  }),
  input: (base) => ({ ...base, color: "var(--color-foreground)" }),
  singleValue: (base) => ({ ...base, color: "var(--color-foreground)" }),
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

const AddBannerCard = ({ initialData = {}, isEditMode = false }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    banner_image: null,
    bannerPreview: null,
    selectedProductIds: [],
    order: 0,
    is_active: true,
  });

  const [selectedBrandFilter, setSelectedBrandFilter] = useState("all");
  const [selectedDiscountFilter, setSelectedDiscountFilter] = useState("all");
  const [orderManuallyChanged, setOrderManuallyChanged] = useState(false);

  // Fetch products
  const { data: apiProductsResponse, isLoading: isProductsLoading } = useQuery({
    queryKey: ["products-for-banner"],
    queryFn: () => fetchProducts({ params: { page: 1, per_page: 1000 } }),
  });

  // Fetch brands
  const { data: apiBrandsResponse, isLoading: isBrandsLoading } = useQuery({
    queryKey: ["brands-for-banner"],
    queryFn: () => fetchBrand({ params: {} }),
    select: (data) => data?.response?.data || data?.data || [],
  });

  // Fetch existing banners to calculate auto-increment order in create mode
  const { data: apiBannersResponse } = useQuery({
    queryKey: ["banners-for-order"],
    queryFn: () => fetchBanners({ params: { page: 1, per_page: 200 } }),
    enabled: !isEditMode,
  });

  // Calculate next auto-increment order (0, 1, 2, 3...)
  const nextOrder = useMemo(() => {
    const bannersList =
      apiBannersResponse?.response?.data?.banners ||
      apiBannersResponse?.data?.banners ||
      [];
    if (!bannersList || bannersList.length === 0) return 0;
    const orders = bannersList.map((b) =>
      typeof b.order === "number" ? b.order : parseInt(b.order, 10) || 0
    );
    const max = Math.max(...orders);
    return max >= 0 ? max + 1 : 0;
  }, [apiBannersResponse]);

  // Auto-fill order for new banners
  useEffect(() => {
    if (!isEditMode && !orderManuallyChanged) {
      setFormData((prev) => ({ ...prev, order: nextOrder }));
    }
  }, [nextOrder, isEditMode, orderManuallyChanged]);

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

  // Normalize all products with images, brand names, and discount percentages
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
        discountPercent,
      });
    });

    // Also include any products from initialData that might not be in the initial query list
    if (initialData?.products && Array.isArray(initialData.products)) {
      initialData.products.forEach((p) => {
        if (p && p._id && !itemsMap.has(p._id)) {
          let brandId = null;
          let brandName = "";
          if (p.brand && typeof p.brand === "object") {
            brandId = p.brand._id;
            brandName = p.brand.name || "";
          } else if (p.brand && typeof p.brand === "string") {
            brandId = p.brand;
            brandName = brandsMap.get(p.brand) || "";
          }

          const price = parsePrice(p.price);
          const discountedPrice = parsePrice(p.discounted_price);
          const discountPercent =
            price && discountedPrice && discountedPrice < price
              ? Math.round(((price - discountedPrice) / price) * 100)
              : 0;

          itemsMap.set(p._id, {
            value: p._id,
            label: p.sku ? `${p.name} (${p.sku})` : p.name,
            name: p.name,
            sku: p.sku || "",
            image: p.banner_image || (Array.isArray(p.images) && p.images[0]) || "",
            brandId,
            brandName,
            price,
            discountedPrice,
            discountPercent,
          });
        }
      });
    } else if (
      initialData?.product &&
      initialData.product._id &&
      !itemsMap.has(initialData.product._id)
    ) {
      const p = initialData.product;
      const price = parsePrice(p.price);
      const discountedPrice = parsePrice(p.discounted_price);
      const discountPercent =
        price && discountedPrice && discountedPrice < price
          ? Math.round(((price - discountedPrice) / price) * 100)
          : 0;

      itemsMap.set(p._id, {
        value: p._id,
        label: p.sku ? `${p.name} (${p.sku})` : p.name,
        name: p.name,
        sku: p.sku || "",
        image: p.banner_image || (Array.isArray(p.images) && p.images[0]) || "",
        brandId: typeof p.brand === "object" ? p.brand?._id : p.brand,
        brandName: typeof p.brand === "object" ? p.brand?.name : brandsMap.get(p.brand) || "",
        price,
        discountedPrice,
        discountPercent,
      });
    }

    return Array.from(itemsMap.values());
  }, [apiProductsResponse, initialData, brandsMap]);

  // Quick lookup map for products by ID
  const productOptionsMap = useMemo(() => {
    const map = new Map();
    allProductItems.forEach((p) => map.set(p.value, p));
    return map;
  }, [allProductItems]);

  // Filter products by selected brand and selected discount/sale percentage
  const filteredProducts = useMemo(() => {
    return allProductItems.filter((p) => {
      // 1. Brand filter
      if (selectedBrandFilter !== "all") {
        if (selectedBrandFilter === "unbranded") {
          if (p.brandId || p.brandName) return false;
        } else if (p.brandId !== selectedBrandFilter) {
          return false;
        }
      }

      // 2. Sale / Discount filter
      if (selectedDiscountFilter === "any") {
        return p.discountPercent > 0;
      }
      if (selectedDiscountFilter === "10_plus") {
        return p.discountPercent >= 10;
      }
      if (selectedDiscountFilter === "20_plus") {
        return p.discountPercent >= 20;
      }
      if (selectedDiscountFilter === "30_plus") {
        return p.discountPercent >= 30;
      }
      if (selectedDiscountFilter === "40_plus") {
        return p.discountPercent >= 40;
      }
      if (selectedDiscountFilter === "50_plus") {
        return p.discountPercent >= 50;
      }
      if (selectedDiscountFilter === "20_30") {
        return p.discountPercent >= 20 && p.discountPercent < 30;
      }
      if (selectedDiscountFilter === "30_50") {
        return p.discountPercent >= 30 && p.discountPercent < 50;
      }

      return true;
    });
  }, [allProductItems, selectedBrandFilter, selectedDiscountFilter]);

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

  // Pre-fill form for editing
  useEffect(() => {
    if (isEditMode && initialData && Object.keys(initialData).length > 0) {
      let initialProductIds = [];
      if (Array.isArray(initialData.products) && initialData.products.length > 0) {
        initialProductIds = initialData.products
          .map((p) => (typeof p === "string" ? p : p._id))
          .filter(Boolean);
      } else if (initialData.product) {
        const pId =
          typeof initialData.product === "string"
            ? initialData.product
            : initialData.product._id;
        if (pId) initialProductIds = [pId];
      }

      setFormData({
        banner_image: null,
        bannerPreview: initialData.banner_url || null,
        selectedProductIds: initialProductIds,
        order: initialData.order ?? 0,
        is_active: initialData.is_active !== undefined ? initialData.is_active : true,
      });
    }
  }, [initialData, isEditMode]);

  // Mutation: Create or Update
  const mutation = useMutation({
    mutationFn: async (payload) => {
      return isEditMode
        ? await updateBanner({ id: initialData._id, data: payload })
        : await createBanner(payload);
    },

    onSuccess: (data) => {
      const isSuccess = data?.response?.success || data?.success;

      if (isSuccess) {
        toast.success(`Banner ${isEditMode ? "updated" : "created"} successfully!`);
        navigate("/dashboard/banners");
        return;
      }

      const message =
        data?.response?.data?.message ||
        data?.response?.message ||
        data?.message ||
        "Failed to save banner";
      toast.error(message);
    },

    onError: (error) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to save banner";
      toast.error(message);
    },
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 5 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, or WEBP files are allowed.");
      return;
    }

    if (file.size > maxSize) {
      toast.error("Image size must be under 5MB.");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      banner_image: file,
      bannerPreview: URL.createObjectURL(file),
    }));
  };

  const revertImage = () => {
    setFormData((prev) => ({
      ...prev,
      banner_image: null,
      bannerPreview: isEditMode ? initialData?.banner_url || null : null,
    }));
  };

  const handleProductChange = (selectedOptions) => {
    const ids = selectedOptions ? selectedOptions.map((opt) => opt.value) : [];
    setFormData((prev) => ({ ...prev, selectedProductIds: ids }));
  };

  const removeSelectedProduct = (productId) => {
    setFormData((prev) => ({
      ...prev,
      selectedProductIds: prev.selectedProductIds.filter((id) => id !== productId),
    }));
  };

  const clearAllProducts = () => {
    setFormData((prev) => ({ ...prev, selectedProductIds: [] }));
  };

  const handleSelectAllFiltered = () => {
    const idsToAdd = filteredProducts.map((p) => p.value);
    setFormData((prev) => ({
      ...prev,
      selectedProductIds: Array.from(new Set([...prev.selectedProductIds, ...idsToAdd])),
    }));
    toast.success(`Selected all ${idsToAdd.length} filtered products`);
  };

  // Custom filter option matching Product Name, SKU, Brand, and Discount
  const filterOption = (candidate, input) => {
    if (!input) return true;
    const search = input.toLowerCase().trim();
    const data = candidate.data;
    if (!data) return false;
    const name = (data.name || "").toLowerCase();
    const sku = (data.sku || "").toLowerCase();
    const brand = (data.brandName || "").toLowerCase();
    const discountStr = data.discountPercent > 0 ? `${data.discountPercent}%` : "";
    return (
      name.includes(search) ||
      sku.includes(search) ||
      brand.includes(search) ||
      discountStr.includes(search)
    );
  };

  // Format option label with product image, SKU, brand, and discount badge
  const formatOptionLabel = (option, { context }) => {
    if (context === "value") {
      return (
        <div className="flex items-center gap-1.5 py-0.5">
          {option.image ? (
            <img
              src={option.image}
              alt=""
              className="size-4 rounded object-cover shrink-0"
            />
          ) : (
            <Package className="size-3.5 text-muted-foreground shrink-0" />
          )}
          <span className="text-xs font-medium truncate max-w-[140px]">
            {option.name}
          </span>
          {option.discountPercent > 0 && (
            <span className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] px-1 rounded font-semibold shrink-0">
              {option.discountPercent}%
            </span>
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2.5 py-1">
        {option.image ? (
          <img
            src={option.image}
            alt={option.name}
            className="border-input size-9 rounded-md border object-cover shrink-0"
          />
        ) : (
          <div className="border-input bg-muted flex size-9 items-center justify-center rounded-md border text-muted-foreground shrink-0">
            <Package className="size-4" />
          </div>
        )}
        <div className="flex flex-1 flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate text-foreground">
              {option.name}
            </span>
            {option.brandName && (
              <span className="bg-secondary text-secondary-foreground text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0">
                {option.brandName}
              </span>
            )}
            {option.discountPercent > 0 && (
              <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0">
                {option.discountPercent}% OFF
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            {option.sku && <span>{option.sku}</span>}
            {option.discountedPrice && option.price && option.discountedPrice < option.price ? (
              <span className="flex items-center gap-1.5">
                <span className="font-semibold text-foreground">₹{option.discountedPrice}</span>
                <span className="line-through text-muted-foreground">₹{option.price}</span>
              </span>
            ) : option.price ? (
              <span>₹{option.price}</span>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  // Selected options objects for value & preview grid
  const selectedOptionsValue = useMemo(() => {
    return formData.selectedProductIds
      .map((id) => productOptionsMap.get(id))
      .filter(Boolean);
  }, [formData.selectedProductIds, productOptionsMap]);

  // Submit form
  const handleSubmit = () => {
    if (!isEditMode && !formData.banner_image) {
      toast.error("Banner image is required");
      return;
    }

    if (!formData.selectedProductIds || formData.selectedProductIds.length === 0) {
      toast.error("Please select at least 1 product to link this banner to");
      return;
    }

    const orderNum = Number(formData.order);
    if (isNaN(orderNum) || orderNum < 0) {
      toast.error("Order must be a non-negative number");
      return;
    }

    const form = new FormData();
    if (formData.banner_image) {
      form.append("banner_image", formData.banner_image);
    }
    form.append("products", JSON.stringify(formData.selectedProductIds));
    form.append("product_ids", JSON.stringify(formData.selectedProductIds));
    form.append("order", orderNum);
    form.append("is_active", String(formData.is_active));

    mutation.mutate(form);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="bg-card shadow-elegant-sm mx-auto w-full max-w-6xl space-y-6 rounded-xl border p-10"
    >
      <div className="space-y-2">
        <Label>Banner Image</Label>
        <Input type="file" accept="image/*" onChange={handleImageChange} />
        {formData.bannerPreview && (
          <div className="border-input relative mt-2 overflow-hidden rounded-lg border">
            <img
              src={formData.bannerPreview}
              alt="Banner Preview"
              className="h-48 w-full object-cover"
            />
            {formData.banner_image && (
              <button
                type="button"
                onClick={revertImage}
                className="bg-destructive text-destructive-foreground shadow-elegant-sm absolute top-2 right-2 rounded-full p-1 transition-opacity hover:opacity-90"
                title="Revert to previous image"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Label className="flex items-center gap-2">
            <span>Linked Products</span>
            {formData.selectedProductIds.length > 0 && (
              <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-semibold">
                {formData.selectedProductIds.length} selected
              </span>
            )}
          </Label>

          <div className="flex flex-wrap items-center gap-2">
            {/* Brand Filter Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-xs font-medium">Brand:</span>
              <select
                value={selectedBrandFilter}
                onChange={(e) => setSelectedBrandFilter(e.target.value)}
                className="border-input bg-background text-foreground h-8 rounded-md border px-2.5 py-1 text-xs focus:ring-ring focus:outline-none focus:ring-2 cursor-pointer"
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

            {/* Sale / Discount Filter Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-xs font-medium">Sale:</span>
              <select
                value={selectedDiscountFilter}
                onChange={(e) => setSelectedDiscountFilter(e.target.value)}
                className="border-input bg-background text-foreground h-8 rounded-md border px-2.5 py-1 text-xs focus:ring-ring focus:outline-none focus:ring-2 cursor-pointer"
              >
                <option value="all">All Discounts</option>
                <option value="any">On Sale (Any % Off)</option>
                <option value="10_plus">10% Off or more</option>
                <option value="20_plus">20% Off or more</option>
                <option value="30_plus">30% Off or more</option>
                <option value="40_plus">40% Off or more</option>
                <option value="50_plus">50% Off or more</option>
                <option value="20_30">20% - 30% Off</option>
                <option value="30_50">30% - 50% Off</option>
              </select>
            </div>

            {(selectedBrandFilter !== "all" || selectedDiscountFilter !== "all") &&
              filteredProducts.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={handleSelectAllFiltered}
                >
                  <CheckSquare className="size-3.5" />
                  Select All Filtered ({filteredProducts.length})
                </Button>
              )}

            {formData.selectedProductIds.length > 0 && (
              <button
                type="button"
                onClick={clearAllProducts}
                className="text-muted-foreground hover:text-destructive text-xs transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        <Select
          isMulti
          placeholder="Search products by name, SKU, brand, or discount (e.g. 20%)..."
          isLoading={isProductsLoading || isBrandsLoading}
          isClearable
          closeMenuOnSelect={false}
          styles={selectStyles}
          options={groupedOptions}
          value={selectedOptionsValue}
          onChange={handleProductChange}
          formatOptionLabel={formatOptionLabel}
          filterOption={filterOption}
        />

        <p className="text-muted-foreground text-xs">
          Search products by name, SKU, brand, or discount (e.g. "20%"). Use the Brand and Sale filters above to easily find and select products on 20%, 30%, 50% sale.
        </p>

        {/* Selected Products Preview with Images and Discount Badges */}
        {selectedOptionsValue.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-semibold">
                Selected Products ({selectedOptionsValue.length}):
              </span>
              <span className="text-muted-foreground text-[11px]">
                Click X to remove
              </span>
            </div>
            <div className="border-border bg-muted/20 grid max-h-60 grid-cols-1 gap-2 overflow-y-auto rounded-lg border p-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {selectedOptionsValue.map((prod) => (
                <div
                  key={prod.value}
                  className="border-border bg-card shadow-xs flex items-center gap-2.5 rounded-lg border p-2 text-xs transition-all hover:border-primary/50"
                >
                  {prod.image ? (
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="border-input size-10 shrink-0 rounded-md border object-cover"
                    />
                  ) : (
                    <div className="border-input bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-md border">
                      <Package className="size-5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate font-medium">{prod.name}</p>
                    <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1.5">
                      {prod.brandName && (
                        <span className="bg-secondary text-secondary-foreground max-w-[90px] truncate rounded px-1 text-[10px] font-medium">
                          {prod.brandName}
                        </span>
                      )}
                      {prod.discountPercent > 0 && (
                        <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 rounded px-1 text-[10px] font-semibold">
                          {prod.discountPercent}% OFF
                        </span>
                      )}
                      {prod.discountedPrice && prod.price && prod.discountedPrice < prod.price ? (
                        <span className="text-[11px] font-semibold text-foreground">
                          ₹{prod.discountedPrice}{" "}
                          <span className="line-through text-muted-foreground font-normal">
                            ₹{prod.price}
                          </span>
                        </span>
                      ) : prod.price ? (
                        <span className="text-[11px]">₹{prod.price}</span>
                      ) : prod.sku ? (
                        <span className="truncate text-[11px]">{prod.sku}</span>
                      ) : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSelectedProduct(prod.value)}
                    className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0 rounded p-1 transition-colors"
                    title="Remove product"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="order">Order</Label>
          {!isEditMode && (
            <span className="text-muted-foreground text-xs">
              Auto-filled as next in sequence ({formData.order})
            </span>
          )}
        </div>
        <Input
          id="order"
          type="number"
          name="order"
          value={formData.order}
          onChange={(e) => {
            setOrderManuallyChanged(true);
            setFormData((prev) => ({ ...prev, order: e.target.value }));
          }}
          placeholder="0"
          min="0"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) =>
            setFormData((prev) => ({
              ...prev,
              is_active: !!checked,
            }))
          }
        />
        <Label htmlFor="is_active">Active</Label>
      </div>

      <div className="pt-4">
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? (
            <span className="flex items-center gap-2">
              <span className="border-primary-foreground h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
              {isEditMode ? "Updating..." : "Submitting..."}
            </span>
          ) : isEditMode ? "Update Banner" : "Create Banner"}
        </Button>
      </div>
    </form>
  );
};

export default AddBannerCard;



