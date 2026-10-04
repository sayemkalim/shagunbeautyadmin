import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import ActionMenu from "@/components/action_menu";
import { Eye, Pencil, Trash2, Loader2, CheckCircle, XCircle, X, IndianRupee, ChevronUp, ChevronDown, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CustomTable from "@/components/custom_table";
import Typography from "@/components/typography";
import { CustomDialog } from "@/components/custom_dialog";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { fetchProducts } from "./helpers/fetchProducts";
import { deleteProduct } from "./helpers/deleteProduct";
import { migrateProductImages } from "./helpers/migrateProductImages";
import { fetchBrand } from "@/pages/brands/helpers/fetchBrand";
import { apiService } from "@/api/api_service/apiService";
import { endpoints } from "@/api/endpoints";

const STATUS_CONFIGS = {
  liveInStock: {
    label: "Live & In Stock",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
  liveOutOfStock: {
    label: "Live & Out of Stock",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  },
  hidden: { label: "Hidden / Draft", className: "bg-muted text-muted-foreground" },
};

const getProductStatus = (row) => {
  if (row.status === "published" && row.inventory === 1) return "liveInStock";
  if (row.status === "published" && row.inventory === 0) return "liveOutOfStock";
  return "hidden";
};

const ProductsTable = ({ setProductLength, params, setParams, selectedBrand = "all" }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    data: apiProductsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["products", params],
    queryFn: () => fetchProducts({ params }),
  });

  const { data: apiBrandsData } = useQuery({
    queryKey: ["brands-filter-list"],
    queryFn: () => fetchBrand({ params: {} }),
    select: (data) => data?.response?.data || data?.data || data,
  });

  const brandsList = Array.isArray(apiBrandsData?.brands)
    ? apiBrandsData.brands
    : Array.isArray(apiBrandsData)
    ? apiBrandsData
    : [];

  const brandMap = useMemo(() => {
    const map = new Map();
    brandsList.forEach((b) => {
      if (b._id) map.set(String(b._id), b.name);
      if (b.name) map.set(b.name.toLowerCase(), b.name);
    });
    return map;
  }, [brandsList]);

  const getRowBrandName = (brandField) => {
    if (!brandField) return null;
    if (typeof brandField === "object" && brandField.name) return brandField.name;
    const str = String(brandField).trim();
    if (brandMap.has(str)) return brandMap.get(str);
    if (brandMap.has(str.toLowerCase())) return brandMap.get(str.toLowerCase());
    if (!/^[0-9a-fA-F]{24}$/.test(str)) return str;
    return null;
  };

  const [openDelete, setOpenDelete] = useState(false);
  const [productData, setProductData] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [bulkMigrating, setBulkMigrating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkStatusConfirm, setBulkStatusConfirm] = useState(null); // { label, updates }
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [priceEdits, setPriceEdits] = useState({}); // { [productId]: { newPrice, newDiscountedPrice } }
  const [priceModalStep, setPriceModalStep] = useState("edit"); // "edit" | "review"
  const [priceModalError, setPriceModalError] = useState("");
  const [priceUpdating, setPriceUpdating] = useState(false);
  const [priceModalSort, setPriceModalSort] = useState("asc"); // "asc" | "desc"

  // Bulk status update
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ productIds, updates }) => {
      const { response } = await apiService({
        endpoint: endpoints.bulk_update,
        method: "PATCH",
        data: { productIds, updates },
      });
      return response;
    },
    onSuccess: (data) => {
      toast.success(`${data?.data?.updated || 0} products updated successfully.`);
      setSelectedRows([]);
      setBulkStatusConfirm(null);
      queryClient.invalidateQueries(["products"]);
    },
    onError: (error) => {
      toast.error(`Bulk update failed: ${error?.message || "Unknown error"}`);
      setBulkStatusConfirm(null);
    },
  });

  const handleBulkStatusChange = (label, updates) => {
    setBulkStatusConfirm({ label, updates });
  };

  const confirmBulkStatusChange = () => {
    if (!bulkStatusConfirm) return;
    const productIds = selectedRows.map((rowId) => {
      const product = products.find((p) => (p._id || `${products.indexOf(p)}`) === rowId);
      return product?._id;
    }).filter(Boolean);
    bulkUpdateMutation.mutate({ productIds, updates: bulkStatusConfirm.updates });
  };

  // Bulk migrate handler
  const handleBulkMigrate = async () => {
    setBulkMigrating(true);
    setBulkProgress(0);
    for (let i = 0; i < selectedRows.length; i++) {
      const rowId = selectedRows[i];
      const product = products.find((p) => (p._id || `${products.indexOf(p)}`) === rowId);
      if (product) {
        try {
          await migrateProductImages({ id: product._id });
        } catch (e) {
          // Optionally handle error per product
        }
      }
      setBulkProgress(i + 1);
    }
    toast.success("Bulk migration complete");
    setBulkMigrating(false);
    setBulkProgress(0);
    setSelectedRows([]);
    queryClient.invalidateQueries(["products"]);
  };

  // Price modify helpers
  const getCurrentPriceNum = (val) => {
    if (val === undefined || val === null || val === "") return null;
    if (typeof val === "object" && val.$numberDecimal !== undefined) {
      const n = parseFloat(val.$numberDecimal);
      return isNaN(n) ? null : n;
    }
    const n = parseFloat(val);
    return isNaN(n) ? null : n;
  };

  const openPriceModal = () => {
    setPriceEdits({});
    setPriceModalStep("edit");
    setPriceModalError("");
    setPriceModalSort("asc");
    setPriceModalOpen(true);
  };

  const togglePriceModalSort = () => {
    setPriceModalSort((s) => (s === "asc" ? "desc" : "asc"));
  };

  const closePriceModal = () => {
    setPriceModalOpen(false);
    setPriceEdits({});
    setPriceModalStep("edit");
    setPriceModalError("");
  };

  const updatePriceEdit = (productId, field, value) => {
    setPriceEdits((prev) => ({
      ...prev,
      [productId]: { ...(prev[productId] || {}), [field]: value },
    }));
    if (priceModalError) setPriceModalError("");
  };

  const getSelectedProducts = () => {
    const list = selectedRows
      .map((rowId) => products.find((p) => (p._id || `${products.indexOf(p)}`) === rowId))
      .filter(Boolean);
    list.sort((a, b) => {
      const cmp = (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
      return priceModalSort === "asc" ? cmp : -cmp;
    });
    return list;
  };

  const getChangedEntries = () => {
    return getSelectedProducts().flatMap((p) => {
      const edit = priceEdits[p._id];
      if (!edit) return [];
      const newPriceStr = (edit.newPrice ?? "").toString().trim();
      if (!newPriceStr) return [];
      const newPriceNum = parseFloat(newPriceStr);
      if (isNaN(newPriceNum)) return [];
      const currentPrice = getCurrentPriceNum(p.price);
      const currentDisc = getCurrentPriceNum(p.discounted_price);
      const flags = [];
      if (currentPrice != null && currentPrice > 0) {
        const pct = ((newPriceNum - currentPrice) / currentPrice) * 100;
        if (Math.abs(pct) > 20) flags.push({ field: "price", pct });
      }
      // Auto-sync discounted_price unless a genuine discount currently exists
      const hasGenuineDiscount =
        currentDisc != null &&
        currentDisc > 0 &&
        currentPrice != null &&
        currentDisc < currentPrice;
      const autoSyncDisc = !hasGenuineDiscount;
      return [{
        product: p,
        newPriceStr,
        newPriceNum,
        currentPrice,
        currentDisc,
        flags,
        autoSyncDisc,
      }];
    });
  };

  const onReviewChanges = () => {
    const changed = getChangedEntries();
    if (changed.length === 0) {
      setPriceModalError("No prices were changed");
      return;
    }
    setPriceModalError("");
    setPriceModalStep("review");
  };

  const onConfirmPriceUpdate = async () => {
    const changed = getChangedEntries();
    if (changed.length === 0) return;
    setPriceUpdating(true);
    let successCount = 0;
    let errorCount = 0;
    for (const entry of changed) {
      try {
        const formData = new FormData();
        formData.append("price", entry.newPriceStr);
        if (entry.autoSyncDisc) {
          formData.append("discounted_price", entry.newPriceStr);
        }
        const result = await apiService({
          endpoint: `${endpoints.product}/${entry.product._id}`,
          method: "PUT",
          data: formData,
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (result?.error || result?.success === false || !result?.response) {
          errorCount++;
        } else {
          successCount++;
        }
      } catch (e) {
        errorCount++;
      }
    }
    setPriceUpdating(false);
    if (errorCount === 0) {
      toast.success(`${successCount} product${successCount === 1 ? "" : "s"} updated successfully`);
      closePriceModal();
      setSelectedRows([]);
      queryClient.invalidateQueries(["products"]);
    } else if (successCount > 0) {
      toast.error(`${successCount} updated, ${errorCount} failed`);
      queryClient.invalidateQueries(["products"]);
    } else {
      toast.error("Failed to update prices");
    }
  };

  const onOpenDialog = (row) => {
    setOpenDelete(true);
    setProductData(row);
  };

  const onCloseDialog = () => {
    setOpenDelete(false);
    setProductData(null);
  };

  const onPageChange = (page) => {
    setParams((prev) => ({
      ...prev,
      page,
    }));
  };

  const { mutate: deleteProuductsMutation, isLoading: isDeleting } =
    useMutation({
      mutationFn: deleteProduct,
      onSuccess: () => {
        toast.success("Products deleted successfully.");
        queryClient.invalidateQueries(["products"]);
        onCloseDialog();
      },
      onError: (error) => {
        console.error(error);
        toast.error("Failed to delete product.");
      },
    });

  const onDeleteClick = (id) => {
    deleteProuductsMutation(id);
  };

  // Track loading state for migration per product
  const [migratingId, setMigratingId] = useState(null);
  const migrateImages = async (row) => {
    setMigratingId(row._id);
    try {
      await migrateProductImages({ id: row._id });
      toast.success("Images migration triggered");
      queryClient.invalidateQueries(["products"]);
    } catch (e) {
      toast.error("Failed to migrate images");
    } finally {
      setMigratingId(null);
    }
  };
  const rawProducts = apiProductsResponse?.data || [];
  const total = apiProductsResponse?.total || 0;

  const searchLower = (params?.search || "").toLowerCase().trim();

  const products = useMemo(() => {
    let list = rawProducts;

    // Filter by Brand if selected
    if (selectedBrand && selectedBrand !== "all") {
      list = list.filter((p) => {
        const bId = typeof p.brand === "object" ? p.brand?._id : p.brand;
        const bName = typeof p.brand === "object" ? p.brand?.name : p.brand;
        return (
          String(bId) === String(selectedBrand) ||
          (typeof bName === "string" && bName.toLowerCase() === String(selectedBrand).toLowerCase())
        );
      });
    }

    if (searchLower) {
      list = list.filter((product) => {
        const nameMatch = product.name?.toLowerCase().includes(searchLower);
        const brandName =
          typeof product.brand === "object"
            ? product.brand?.name
            : typeof product.brand === "string"
            ? product.brand
            : "";
        const brandMatch = brandName?.toLowerCase().includes(searchLower);
        const skuMatch = product.sku?.toLowerCase().includes(searchLower);
        const colorMatch =
          product.color_name?.toLowerCase().includes(searchLower) ||
          product.color?.toLowerCase().includes(searchLower);
        const variantMatch =
          Array.isArray(product.variants) &&
          product.variants.some(
            (v) =>
              v.name?.toLowerCase().includes(searchLower) ||
              v.color_name?.toLowerCase().includes(searchLower) ||
              v.sku?.toLowerCase().includes(searchLower)
          );
        return nameMatch || brandMatch || skuMatch || colorMatch || variantMatch;
      });
    }

    // Sort by brand name first, then product name (Brand by Brand ordering)
    return [...list].sort((a, b) => {
      const brandA = (typeof a.brand === "object" ? a.brand?.name : a.brand) || "zzz";
      const brandB = (typeof b.brand === "object" ? b.brand?.name : b.brand) || "zzz";
      const brandCmp = brandA.localeCompare(brandB, undefined, { sensitivity: "base" });
      if (brandCmp !== 0) return brandCmp;
      return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
    });
  }, [rawProducts, selectedBrand, searchLower]);

  const onNavigateToEdit = (product) => {
    navigate(`/dashboard/product/edit/${product._id}`);
  };

  const onNavigateDetails = (product) => {
    navigate(`/dashboard/products/${product._id}`);
  };

  const onNavigateInventoryHistory = (product) => {
    navigate(`/dashboard/products/inventory-history/${product._id}`);
  };

  const displayTotal = useMemo(() => {
    if (selectedBrand && selectedBrand !== "all") {
      return products.length;
    }
    if (searchLower && !params?.search) {
      return products.length;
    }
    return total || products.length;
  }, [selectedBrand, searchLower, params?.search, total, products.length]);

  useEffect(() => {
    setProductLength(displayTotal);
  }, [displayTotal, setProductLength]);

  const isBrandFiltered = selectedBrand && selectedBrand !== "all";
  const perPage = isBrandFiltered ? Math.max(1, products.length) : (params.per_page || 50);
  const totalPages = isBrandFiltered ? 1 : Math.max(1, Math.ceil((total || displayTotal) / perPage));
  const currentPage = isBrandFiltered ? 1 : (params.page || 1);

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (value, row) => {
        const brandName = getRowBrandName(row.brand);
        return (
          <div className="flex items-center gap-3">
            <img
              src={row.banner_image || row.images?.[0]}
              alt={value}
              className="bg-muted border-border h-14 w-14 shrink-0 rounded-lg border object-contain p-1"
            />
            <div className="flex flex-col gap-0.5 max-w-[18rem] sm:max-w-[22rem]">
              <Typography variant="p" className="text-wrap font-medium text-foreground text-sm line-clamp-2" title={value}>
                {value}
              </Typography>
              {brandName && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {brandName}
                  </span>
                </div>
              )}
              {(row.color || row.color_name) && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {row.color && (
                    <span
                      className="inline-block h-3.5 w-3.5 rounded-full border border-border shrink-0 shadow-sm"
                      style={{ backgroundColor: row.color }}
                    />
                  )}
                  <span>{[row.color_name, row.color].filter(Boolean).join(" - ")}</span>
                </div>
              )}
              {Array.isArray(row.variants) && row.variants.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 max-w-[24rem] overflow-x-auto whitespace-nowrap py-0.5">
                  <span className="text-[11px] font-medium shrink-0">{row.variants.length} var:</span>
                  {row.variants.map((v, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded bg-muted/70 px-1.5 py-0.5 text-[11px] shrink-0 whitespace-nowrap"
                      title={[v.name, v.color_name, v.color, v.sku].filter(Boolean).join(" | ")}
                    >
                      {v.color && (
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full border border-border shrink-0"
                          style={{ backgroundColor: v.color }}
                        />
                      )}
                      <span>{v.name || v.color_name || v.sku || `Var ${idx + 1}`}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "price",
      label: "Price",
      render: (value) => `₹${value?.$numberDecimal || value || ""}`,
    },
    {
      key: "discounted_price",
      label: "Discounted Price",
      render: (value) => `₹${value?.$numberDecimal || value || ""}`,
    },
    {
      key: "price_tiers",
      label: "Bulk Pricing",
      render: (value) =>
        Array.isArray(value) && value.length > 0 ? (
          <Badge variant="secondary" className="gap-1">
            <Layers size={12} />
            {value.length} pack size{value.length > 1 ? "s" : ""}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
    },
    {
      key: "status",
      label: "Status",
      render: (_value, row) => {
        const statusKey = getProductStatus(row);
        const config = STATUS_CONFIGS[statusKey];
        return (
          <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${config.className}`}>
            {config.label}
          </span>
        );
      },
    },
    {
      key: "createdAt",
      label: "Created At",
      render: (value, row) => (
        <div className="flex flex-col gap-1">
          <Typography>
            {format(new Date(value), "dd/MM/yyyy hh:mm a")}
          </Typography>
          {value !== row.updatedAt && (
            <Typography className="text-muted-foreground text-sm">
              Updated -{" "}
              {formatDistanceToNow(new Date(row.updatedAt), {
                addSuffix: true,
              })}
            </Typography>
          )}
        </div>
      ),
    },
    {
      key: "isImported",
      label: "Imported",
      render: (value, row) => {
        const images = row.images || [];
        const isImported = images.some(
          (img) => typeof img === "string" && img.includes("res.cloudinary.com")
        );
        return isImported ? (
          <CheckCircle className="text-green-500 w-5 h-5 mx-auto" title="Imported" />
        ) : (
          <XCircle className="text-red-500 w-5 h-5 mx-auto" title="Not Imported" />
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (value, row) => (
        <ActionMenu
          options={[
            {
              label: "View Details",
              icon: Eye,
              action: () => onNavigateDetails(row),
            },
            {
              label: "Edit",
              icon: Pencil,
              action: () => onNavigateToEdit(row),
            },
            {
              label: "Migrate images to Cloudinary",
              icon: Loader2,
              action: () => migrateImages(row),
              disabled: migratingId === row._id,
              renderRight:
                migratingId === row._id
                  ? () => <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  : undefined,
            },
            {
              label: "Delete",
              icon: Trash2,
              action: () => onOpenDialog(row),
              className: "text-destructive",
            },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      {/* Floating bulk action bar */}
      {selectedRows.length > 0 && (
        <div className="bg-primary/5 border-primary/20 mb-4 flex flex-wrap items-center gap-3 rounded-lg border p-3">
          <span className="text-primary text-sm font-medium">
            {selectedRows.length} product{selectedRows.length > 1 ? "s" : ""} selected
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
              onClick={() => handleBulkStatusChange("Live & In Stock", { status: "published", inventory: 1 })}
              disabled={bulkUpdateMutation.isPending}
            >
              Live &amp; In Stock
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20"
              onClick={() => handleBulkStatusChange("Live & Out of Stock", { status: "published", inventory: 0 })}
              disabled={bulkUpdateMutation.isPending}
            >
              Live &amp; Out of Stock
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkStatusChange("Hidden", { status: "draft", inventory: 0 })}
              disabled={bulkUpdateMutation.isPending}
            >
              Hidden
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="ml-1"
              onClick={openPriceModal}
              disabled={bulkUpdateMutation.isPending || bulkMigrating}
            >
              <IndianRupee className="mr-1 size-4" />
              Modify Prices
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkMigrate}
              disabled={bulkMigrating || selectedRows.length === 0 || selectedRows.length > 10}
              className="gap-1.5"
            >
              {bulkMigrating ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Migrate Images {selectedRows.length > 10 && "(max 10)"}
            </Button>
            {bulkMigrating && (
              <div className="flex w-36 items-center gap-2">
                <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${(bulkProgress / selectedRows.length) * 100}%` }}
                  />
                </div>
                <span className="text-muted-foreground text-xs">{bulkProgress}/{selectedRows.length}</span>
              </div>
            )}
            <button
              onClick={() => setSelectedRows([])}
              className="text-muted-foreground hover:text-foreground ml-2 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modify Prices modal */}
      {priceModalOpen && (() => {
        const selProducts = getSelectedProducts();
        const changed = priceModalStep === "review" ? getChangedEntries() : [];
        const flagged = changed.filter((c) => c.flags.length > 0);
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
            onClick={() => { if (!priceUpdating) closePriceModal(); }}
          >
            <div
              className="bg-card text-card-foreground shadow-elegant-lg max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-border bg-card sticky top-0 flex items-center justify-between border-b p-4">
                <div>
                  <h3 className="text-lg font-semibold">Modify Prices</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-muted-foreground text-xs">
                      {selProducts.length} product{selProducts.length === 1 ? "" : "s"} selected
                      {priceModalStep === "review" && ` · ${changed.length} change${changed.length === 1 ? "" : "s"}`}
                    </p>
                    <button
                      type="button"
                      onClick={togglePriceModalSort}
                      className="text-muted-foreground hover:text-foreground border-input flex items-center gap-1 rounded border px-2 py-0.5 text-xs transition-colors"
                      aria-label="Toggle sort order"
                    >
                      Name {priceModalSort === "asc" ? "A→Z" : "Z→A"}
                      {priceModalSort === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={closePriceModal}
                  disabled={priceUpdating}
                  className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              {priceModalStep === "edit" && (
                <div className="p-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-muted-foreground border-border border-b text-left">
                          <th className="py-2 pr-3 font-medium">Product Name</th>
                          <th className="px-3 py-2 font-medium">Current Price</th>
                          <th className="py-2 pl-3 font-medium">New Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selProducts.map((p) => {
                          const curPrice = getCurrentPriceNum(p.price);
                          const edit = priceEdits[p._id] || {};
                          return (
                            <tr key={p._id} className="border-border border-b align-top">
                              <td className="max-w-[18rem] py-2 pr-3">
                                <div
                                  className="text-foreground"
                                  style={{
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                  }}
                                  title={p.name}
                                >
                                  {p.name}
                                </div>
                              </td>
                              <td className="text-muted-foreground px-3 py-2">
                                {curPrice != null ? `₹${curPrice}` : "—"}
                              </td>
                              <td className="py-2 pl-3">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="Enter new price"
                                  value={edit.newPrice ?? ""}
                                  onChange={(e) => updatePriceEdit(p._id, "newPrice", e.target.value)}
                                  className="border-input bg-background focus-visible:ring-ring/50 w-32 rounded px-2 py-1 text-sm outline-none focus-visible:ring-[3px]"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {priceModalError && (
                    <p className="text-destructive mt-3 text-sm">{priceModalError}</p>
                  )}
                </div>
              )}

              {priceModalStep === "review" && (
                <div className="space-y-4 p-4">
                  {flagged.length > 0 && (
                    <div className="border-destructive/30 bg-destructive/5 rounded-lg border p-3">
                      <h4 className="text-destructive mb-2 font-semibold">
                        ⚠️ Please double-check these prices
                      </h4>
                      <div className="space-y-2">
                        {flagged.map((c) => (
                          <div key={c.product._id} className="bg-card border-destructive/20 rounded border p-2 text-sm">
                            <div className="text-foreground truncate font-medium" title={c.product.name}>
                              {c.product.name}
                            </div>
                            <div className="text-muted-foreground mt-1 space-y-0.5">
                              {c.flags.map((f) => (
                                <div key={f.field}>
                                  <span className="text-muted-foreground">Price:</span>{" "}
                                  ₹{c.currentPrice} → ₹{c.newPriceNum}{" "}
                                  <span className={f.pct > 0 ? "text-destructive" : "text-amber-600 dark:text-amber-400"}>
                                    ({f.pct > 0 ? "+" : ""}{f.pct.toFixed(1)}%)
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-border rounded-lg border p-3">
                    <h4 className="mb-2 font-semibold">Changes to apply</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-muted-foreground border-border border-b text-left">
                            <th className="py-2 pr-3 font-medium">Product</th>
                            <th className="py-2 pl-3 font-medium">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {changed.map((c) => {
                            const isFlagged = c.flags.length > 0;
                            return (
                              <tr
                                key={c.product._id}
                                className={`border-border border-b align-top ${isFlagged ? "bg-destructive/5" : ""}`}
                              >
                                <td className="max-w-[18rem] py-2 pr-3">
                                  <div
                                    className="text-foreground"
                                    style={{
                                      display: "-webkit-box",
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: "vertical",
                                      overflow: "hidden",
                                    }}
                                    title={c.product.name}
                                  >
                                    {c.product.name}
                                  </div>
                                  {!c.autoSyncDisc && (
                                    <div className="text-muted-foreground mt-0.5 text-[11px]">
                                      Discount preserved (current ₹{c.currentDisc})
                                    </div>
                                  )}
                                </td>
                                <td className="text-muted-foreground py-2 pl-3">
                                  <span>{c.currentPrice != null ? `₹${c.currentPrice}` : "—"}</span>
                                  {" → "}
                                  <span className="text-foreground font-medium">₹{c.newPriceNum}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-border bg-card sticky bottom-0 flex items-center justify-end gap-2 border-t p-4">
                {priceModalStep === "edit" && (
                  <>
                    <Button variant="outline" size="sm" onClick={closePriceModal} disabled={priceUpdating}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={onReviewChanges} disabled={priceUpdating}>
                      Review Changes
                    </Button>
                  </>
                )}
                {priceModalStep === "review" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPriceModalStep("edit")}
                      disabled={priceUpdating}
                    >
                      Back to Edit
                    </Button>
                    <Button size="sm" onClick={onConfirmPriceUpdate} disabled={priceUpdating}>
                      {priceUpdating && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                      Confirm &amp; Update
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Bulk status confirmation dialog */}
      {bulkStatusConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]" onClick={() => setBulkStatusConfirm(null)}>
          <div className="bg-card shadow-elegant-lg mx-4 max-w-sm rounded-xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2 text-lg font-semibold">Confirm status change</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Set {selectedRows.length} product{selectedRows.length > 1 ? "s" : ""} to <strong className="text-foreground">{bulkStatusConfirm.label}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setBulkStatusConfirm(null)}>Cancel</Button>
              <Button size="sm" onClick={confirmBulkStatusChange} disabled={bulkUpdateMutation.isPending}>
                {bulkUpdateMutation.isPending ? <Loader2 className="mr-1 size-4 animate-spin" /> : null}
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
      <CustomTable
        columns={columns}
        data={products || []}
        isLoading={isLoading}
        error={error}
        totalPages={totalPages}
        currentPage={currentPage}
        perPage={perPage}
        hidePagination={isBrandFiltered}
        onPageChange={onPageChange}
        enableRowSelection={true}
        selectedRows={selectedRows}
        onRowSelectionChange={setSelectedRows}
      />
      <CustomDialog
        onOpen={openDelete}
        onClose={onCloseDialog}
        title={productData?.name}
        modalType="Delete"
        onDelete={onDeleteClick}
        id={productData?._id}
        isLoading={isDeleting}
      />
    </>
  );
};

export default ProductsTable;
