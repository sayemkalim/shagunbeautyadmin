import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import {
  ArrowLeft,
  Pencil,
  Copy,
  Check,
  Layers,
  Tag,
  Calendar,
  Box,
  Sparkles,
  Percent,
  Clock,
  Coins,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Info,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import Typography from "@/components/typography";
import NavbarItem from "@/components/navbar/navbar_item";
import { fetchProductById } from "../helpers/fetchProductById";

const ProductDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [previewImg, setPreviewImg] = useState(null);
  const [selectedGalleryImg, setSelectedGalleryImg] = useState(null);
  const [copiedSku, setCopiedSku] = useState("");

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product_details", id],
    queryFn: () => fetchProductById({ id }),
    select: (data) => data?.response?.data || data?.data || data,
    enabled: !!id,
  });

  const handleCopySku = (sku) => {
    if (!sku) return;
    navigator.clipboard.writeText(sku);
    setCopiedSku(sku);
    toast.success(`SKU copied: ${sku}`);
    setTimeout(() => setCopiedSku(""), 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 px-6 py-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <Skeleton className="h-[400px] w-full rounded-2xl" />
            <div className="flex gap-2">
              <Skeleton className="h-16 w-16 rounded-lg" />
              <Skeleton className="h-16 w-16 rounded-lg" />
              <Skeleton className="h-16 w-16 rounded-lg" />
            </div>
          </div>
          <div className="lg:col-span-7 space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <AlertCircle className="size-12 text-destructive" />
        <p className="text-lg font-medium text-foreground">Product not found</p>
        <Button variant="outline" onClick={() => navigate("/dashboard/products")}>
          <ArrowLeft className="mr-2 size-4" /> Back to Products
        </Button>
      </div>
    );
  }

  const breadcrumbs = [
    { title: "Products", path: "/dashboard/products", isNavigation: true },
    { title: product.name || "Product Details", isNavigation: false },
  ];

  const brandName =
    typeof product.brand === "object" && product.brand?.name
      ? product.brand.name
      : typeof product.brand === "string" && !/^[0-9a-fA-F]{24}$/.test(product.brand.trim())
      ? product.brand
      : null;

  const brandLogo =
    typeof product.brand === "object" && product.brand?.logo
      ? product.brand.logo
      : null;

  const categoryName =
    typeof product.category === "object" && product.category?.name
      ? product.category.name
      : typeof product.category === "string" && !/^[0-9a-fA-F]{24}$/.test(product.category.trim())
      ? product.category
      : null;

  const subCategoryName =
    typeof product.sub_category === "object" && product.sub_category?.name
      ? product.sub_category.name
      : typeof product.subCategory === "object" && product.subCategory?.name
      ? product.subCategory.name
      : typeof product.sub_category === "string" && !/^[0-9a-fA-F]{24}$/.test(product.sub_category.trim())
      ? product.sub_category
      : null;

  const allImages = [
    product.banner_image,
    ...(Array.isArray(product.images) ? product.images : []),
  ].filter(Boolean);

  const activeMainImage = selectedGalleryImg || product.banner_image || allImages[0];

  const discountPercent =
    product.price && product.discounted_price && Number(product.price) > Number(product.discounted_price)
      ? Math.round(((Number(product.price) - Number(product.discounted_price)) / Number(product.price)) * 100)
      : null;

  const baseAvailableInventory =
    typeof product.inventory === "number"
      ? product.inventory
      : product.inventory
      ? 1
      : 0;

  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;

  const variantsTotalInventory = hasVariants
    ? product.variants.reduce(
        (sum, v) => sum + (typeof v.inventory === "number" ? v.inventory : v.inventory ? 1 : 0),
        0
      )
    : 0;

  const totalCombinedInventory = baseAvailableInventory + variantsTotalInventory;

  const inStock = baseAvailableInventory > 0 || variantsTotalInventory > 0 || product.status === "published";

  return (
    <div className="space-y-6 px-4 md:px-8 py-4">
      {/* Navigation & Header */}
      <NavbarItem title="Product Details" breadcrumbs={breadcrumbs} />

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
        <Button
          variant="outline"
          size="sm"
          className="gap-2 shadow-sm"
          onClick={() => navigate("/dashboard/products")}
        >
          <ArrowLeft className="size-4" /> Back to Products
        </Button>

        <div className="flex items-center gap-2.5">
          <Button
            variant="default"
            size="sm"
            className="gap-2 shadow-sm"
            onClick={() => navigate(`/dashboard/product/edit/${product._id}`)}
          >
            <Pencil className="size-4" /> Edit Product
          </Button>
        </div>
      </div>

      {/* Main Grid: Gallery + Core Specs */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Image Gallery & Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative group overflow-hidden rounded-2xl border border-border bg-card/80 p-3 shadow-sm">
            <Dialog open={!!previewImg} onOpenChange={() => setPreviewImg(null)}>
              <DialogTrigger asChild>
                <div
                  className="relative flex h-[380px] w-full items-center justify-center cursor-zoom-in overflow-hidden rounded-xl bg-muted/20"
                  onClick={() => setPreviewImg(activeMainImage)}
                >
                  {activeMainImage ? (
                    <img
                      src={activeMainImage}
                      alt={product.name}
                      className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Box className="size-12 stroke-[1.5]" />
                      <span className="text-xs">No image available</span>
                    </div>
                  )}
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-2xl border-none bg-black/90 p-2 shadow-2xl backdrop-blur-md">
                <img
                  src={previewImg}
                  alt="Product High Resolution Preview"
                  className="max-h-[82vh] w-full rounded-lg object-contain"
                />
              </DialogContent>
            </Dialog>

            {discountPercent && (
              <Badge className="absolute top-5 left-5 bg-rose-500 hover:bg-rose-600 text-white font-bold px-2.5 py-1 text-xs shadow-md">
                {discountPercent}% OFF
              </Badge>
            )}

            {product.is_best_seller && (
              <Badge className="absolute top-5 right-5 bg-amber-500 hover:bg-amber-600 text-white font-semibold gap-1 px-2.5 py-1 text-xs shadow-md">
                <Sparkles className="size-3.5" /> Best Seller
              </Badge>
            )}
          </div>

          {/* Thumbnails list */}
          {allImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedGalleryImg(img)}
                  className={`relative size-16 shrink-0 rounded-xl border p-1 transition-all ${
                    activeMainImage === img
                      ? "border-primary ring-2 ring-primary/30 shadow-sm"
                      : "border-border hover:border-muted-foreground/50 opacity-70 hover:opacity-100"
                  } bg-card`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    className="h-full w-full rounded-lg object-contain"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Key Details & Specs */}
        <div className="lg:col-span-7 space-y-6">
          {/* Brand & Category badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            {brandName && (
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary shadow-xs">
                {brandLogo && (
                  <img
                    src={brandLogo}
                    alt={brandName}
                    className="size-4 rounded-full bg-white object-contain"
                  />
                )}
                <span>{brandName}</span>
              </div>
            )}

            {categoryName && (
              <Badge variant="outline" className="text-xs bg-muted/30">
                {categoryName}
              </Badge>
            )}

            {subCategoryName && (
              <Badge variant="outline" className="text-xs bg-muted/30">
                {subCategoryName}
              </Badge>
            )}

            <Badge
              variant={inStock ? "default" : "destructive"}
              className={`text-xs font-medium ${
                inStock
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                  : ""
              }`}
            >
              {inStock ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="size-3" /> In Stock
                  {typeof product.inventory === "number" && ` (${product.inventory})`}
                </span>
              ) : (
                "Out of Stock"
              )}
            </Badge>

            {product.status && (
              <Badge variant="secondary" className="capitalize text-xs">
                {product.status}
              </Badge>
            )}
          </div>

          {/* Product Title */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {product.name}
            </h1>
            {product.small_description && (
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {product.small_description}
              </p>
            )}
          </div>

          {/* Pricing Box */}
          <div className="flex flex-wrap items-baseline gap-4 rounded-2xl border border-border/80 bg-gradient-to-r from-card to-muted/20 p-4 shadow-sm">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-primary">
                ₹{product.discounted_price || product.price}
              </span>
              {product.price && Number(product.price) > Number(product.discounted_price) && (
                <span className="text-lg text-muted-foreground line-through">
                  ₹{product.price}
                </span>
              )}
            </div>

            {discountPercent && (
              <Badge variant="secondary" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30 font-semibold text-xs">
                Save {discountPercent}%
              </Badge>
            )}
          </div>

          {/* Inventory Overview Summary */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/80 bg-muted/30 p-3 text-xs">
            <div className="flex items-center gap-1.5 font-medium">
              <Box className="size-4 text-primary" />
              <span className="text-muted-foreground">Base Available Stock:</span>
              <span className={`font-bold ${baseAvailableInventory > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                {baseAvailableInventory} {baseAvailableInventory === 1 ? "unit" : "units"}
              </span>
            </div>

            {hasVariants && (
              <>
                <span className="text-muted-foreground/50 hidden sm:inline">•</span>
                <div className="flex items-center gap-1.5 font-medium">
                  <Layers className="size-4 text-primary" />
                  <span className="text-muted-foreground">Variants Available Stock:</span>
                  <span className="font-bold text-foreground">
                    {variantsTotalInventory} units ({product.variants.length} var)
                  </span>
                </div>
                <span className="text-muted-foreground/50 hidden sm:inline">•</span>
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="text-muted-foreground">Total Combined Stock:</span>
                  <span className="font-bold text-primary">{totalCombinedInventory} units</span>
                </div>
              </>
            )}
          </div>

          {/* Attributes Grid Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            {/* SKU Card */}
            <div className="rounded-xl border border-border bg-card p-3 shadow-2xs space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Base SKU
              </span>
              <div className="flex items-center justify-between gap-1">
                <span className="font-semibold text-xs text-foreground truncate" title={product.sku}>
                  {product.sku || "N/A"}
                </span>
                {product.sku && (
                  <button
                    type="button"
                    onClick={() => handleCopySku(product.sku)}
                    className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                    title="Copy SKU"
                  >
                    {copiedSku === product.sku ? (
                      <Check className="size-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Base Available Inventory Card */}
            <div className="rounded-xl border border-border bg-card p-3 shadow-2xs space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Base Available Stock
              </span>
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <Box className="size-3.5 text-primary" />
                <span className={baseAvailableInventory > 0 ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-destructive"}>
                  {baseAvailableInventory} {baseAvailableInventory === 1 ? "unit" : "units"}
                </span>
              </div>
            </div>

            {/* Color / Shade Card */}
            {(product.color || product.color_name) && (
              <div className="rounded-xl border border-border bg-card p-3 shadow-2xs space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Color / Shade
                </span>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  {product.color && (
                    <span
                      className="size-3.5 rounded-full border border-border shadow-xs shrink-0"
                      style={{ backgroundColor: product.color }}
                    />
                  )}
                  <span className="truncate">
                    {[product.color_name, product.color].filter(Boolean).join(" - ")}
                  </span>
                </div>
              </div>
            )}

            {/* Weight / Volume */}
            {product.weight_in_grams && (
              <div className="rounded-xl border border-border bg-card p-3 shadow-2xs space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Weight / Vol
                </span>
                <p className="font-semibold text-xs text-foreground">
                  {(() => {
                    const str = String(product.weight_in_grams).trim();
                    if (str.endsWith("g") || str.endsWith("ml")) return str;
                    const unit = product.weight_unit || product.unit || "g";
                    return `${str}${unit}`;
                  })()}
                </p>
              </div>
            )}

            {/* Expiry Date */}
            {product.expiry_date && (
              <div className="rounded-xl border border-border bg-card p-3 shadow-2xs space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Expiry Date
                </span>
                <div className="flex items-center gap-1 text-xs font-semibold text-foreground">
                  <Calendar className="size-3.5 text-muted-foreground" />
                  <span>{dayjs(product.expiry_date).format("DD MMM, YYYY")}</span>
                </div>
              </div>
            )}

            {/* Created At */}
            <div className="rounded-xl border border-border bg-card p-3 shadow-2xs space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Created
              </span>
              <div className="flex items-center gap-1 text-xs font-semibold text-foreground">
                <Clock className="size-3.5 text-muted-foreground" />
                <span>{product.createdAt ? dayjs(product.createdAt).format("DD MMM, YYYY") : "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          {Array.isArray(product.tags) && product.tags.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Tag className="size-3.5 text-primary" /> Tags
              </span>
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map((tag, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="text-xs font-medium px-2.5 py-0.5 rounded-md"
                  >
                    {String(tag).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Bulk Pricing / Price Tiers */}
          {Array.isArray(product.price_tiers) && product.price_tiers.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-primary" />
                <h4 className="font-semibold text-sm text-foreground">
                  Tiered Bulk Pricing
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-left">
                      <th className="pb-2 font-medium">Quantity</th>
                      <th className="pb-2 font-medium text-right">Price per item</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    <tr className="text-muted-foreground">
                      <td className="py-1.5">1 unit (Base)</td>
                      <td className="py-1.5 font-medium text-right">
                        ₹{product.discounted_price || product.price}
                      </td>
                    </tr>
                    {product.price_tiers
                      .slice()
                      .sort((a, b) => a.quantity - b.quantity)
                      .map((tier, i) => (
                        <tr key={i} className="text-foreground">
                          <td className="py-1.5 font-medium">{tier.quantity} units</td>
                          <td className="py-1.5 font-semibold text-primary text-right">
                            ₹{tier.price}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Description & Key Points */}
      {(product.full_description || (product.meta_data?.points && product.meta_data.points.length > 0)) && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-4">
          {product.full_description && (
            <div className={`${product.meta_data?.points?.length ? "md:col-span-7" : "md:col-span-12"} rounded-2xl border border-border bg-card p-5 space-y-2 shadow-xs`}>
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                <h3 className="font-semibold text-base text-foreground">
                  Description
                </h3>
              </div>
              <div
                className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line"
                dangerouslySetInnerHTML={{ __html: product.full_description }}
              />
            </div>
          )}

          {Array.isArray(product.meta_data?.points) && product.meta_data.points.length > 0 && (
            <div className={`${product.full_description ? "md:col-span-5" : "md:col-span-12"} rounded-2xl border border-border bg-card p-5 space-y-3 shadow-xs`}>
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <h3 className="font-semibold text-base text-foreground">
                  Key Highlights
                </h3>
              </div>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {product.meta_data.points.map((pt, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Variants Section */}
      {Array.isArray(product.variants) && product.variants.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Product Variants ({product.variants.length})
              </h2>
              <p className="text-xs text-muted-foreground">
                All color shades, sizes, and stock variations of this product
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {product.variants.map((v, idx) => {
              const vQty =
                typeof v.inventory === "number"
                  ? v.inventory
                  : v.inventory
                  ? 1
                  : 0;
              const varInStock = vQty > 0;
              const varImg =
                (Array.isArray(v.images) && v.images[0]) ||
                v.image ||
                product.banner_image;

              const varDiscountPercent =
                v.price && v.discounted_price && Number(v.price) > Number(v.discounted_price)
                  ? Math.round(((Number(v.price) - Number(v.discounted_price)) / Number(v.price)) * 100)
                  : null;

              return (
                <div
                  key={v._id || idx}
                  className="rounded-2xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="relative size-16 shrink-0 rounded-xl border border-border bg-muted/20 p-1 overflow-hidden">
                        <img
                          src={varImg}
                          alt={v.name}
                          className="size-full object-contain cursor-pointer"
                          onClick={() => setPreviewImg(varImg)}
                        />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-semibold text-sm text-foreground truncate" title={v.name}>
                            {v.name || `Variant #${idx + 1}`}
                          </h4>
                          <Badge
                            variant={varInStock ? "default" : "destructive"}
                            className={`text-[10px] px-1.5 py-0.5 ${
                              varInStock
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                                : ""
                            }`}
                          >
                            {varInStock
                              ? `Stock: ${vQty}`
                              : "Out of Stock"}
                          </Badge>
                        </div>

                        {/* SKU */}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="text-[11px] font-medium">SKU:</span>
                          <span className="font-mono text-[11px] text-foreground font-semibold truncate">
                            {v.sku || "N/A"}
                          </span>
                          {v.sku && (
                            <button
                              type="button"
                              onClick={() => handleCopySku(v.sku)}
                              className="hover:text-foreground p-0.5"
                              title="Copy SKU"
                            >
                              {copiedSku === v.sku ? (
                                <Check className="size-3 text-emerald-500" />
                              ) : (
                                <Copy className="size-3" />
                              )}
                            </button>
                          )}
                        </div>

                        {/* Variant Available Inventory */}
                        <div className="flex items-center gap-1 text-[11px] pt-0.5">
                          <span className="text-muted-foreground font-medium">Available Stock:</span>
                          <span className={`font-bold ${varInStock ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                            {vQty} {vQty === 1 ? "unit" : "units"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Color and Weight/Volume */}
                    <div className="flex flex-wrap items-center gap-2 text-xs pt-1 border-t border-border/60">
                      {(v.color || v.color_name) && (
                        <div className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-2 py-0.5">
                          {v.color && (
                            <span
                              className="size-3 rounded-full border border-border shrink-0"
                              style={{ backgroundColor: v.color }}
                            />
                          )}
                          <span className="font-medium text-[11px]">
                            {[v.color_name, v.color].filter(Boolean).join(" - ")}
                          </span>
                        </div>
                      )}

                      {v.weight_in_grams && (
                        <div className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-2 py-0.5 text-[11px]">
                          <span>
                            {v.weight_in_grams}
                            {v.weight_unit || v.unit || "g"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-lg font-bold text-primary">
                        ₹{v.discounted_price || v.price}
                      </span>
                      {v.price && Number(v.price) > Number(v.discounted_price) && (
                        <span className="text-xs text-muted-foreground line-through">
                          ₹{v.price}
                        </span>
                      )}
                      {varDiscountPercent && (
                        <span className="text-[10px] font-semibold text-rose-500">
                          {varDiscountPercent}% off
                        </span>
                      )}
                    </div>

                    {/* Variant Price Tiers */}
                    {Array.isArray(v.price_tiers) && v.price_tiers.length > 0 && (
                      <div className="bg-muted/30 rounded-lg border border-border/60 p-2 space-y-1">
                        <span className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                          <Layers size={11} className="text-primary" /> Bulk Tier Pricing
                        </span>
                        <div className="space-y-0.5 text-[10px]">
                          {v.price_tiers.map((t, i) => (
                            <div key={i} className="flex justify-between text-muted-foreground">
                              <span>
                                {t.min_qty || t.quantity}
                                {t.max_qty ? ` - ${t.max_qty}` : "+"} units
                              </span>
                              <span className="font-semibold text-foreground">₹{t.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tax & Financial Details Card */}
      {(product.gst || product.cgst || product.sgst || product.igst) && (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <Coins className="size-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Tax & GST Breakdown</h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-1">
            {product.gst && (
              <div>
                <span className="text-muted-foreground">Total GST:</span>{" "}
                <span className="font-semibold text-foreground">{product.gst}%</span>
              </div>
            )}
            {product.cgst && (
              <div>
                <span className="text-muted-foreground">CGST:</span>{" "}
                <span className="font-semibold text-foreground">{product.cgst}%</span>
              </div>
            )}
            {product.sgst && (
              <div>
                <span className="text-muted-foreground">SGST:</span>{" "}
                <span className="font-semibold text-foreground">{product.sgst}%</span>
              </div>
            )}
            {product.igst && (
              <div>
                <span className="text-muted-foreground">IGST:</span>{" "}
                <span className="font-semibold text-foreground">{product.igst}%</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
