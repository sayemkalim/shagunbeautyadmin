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
  ImageIcon,
  LinkIcon,
} from "lucide-react";
import { createSecondBanner } from "../helpers/createSecondBanner";
import { updateSecondBanner } from "../helpers/updateSecondBanner";
import { fetchProducts } from "@/pages/products/components/helpers/fetchProducts";

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
  singleValue: (base) => ({ ...base, color: "var(--color-foreground)" }),
  placeholder: (base) => ({ ...base, color: "var(--color-muted-foreground)" }),
};

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/jpg"];

const SecondBannerModal = ({ open, onClose, bannerToEdit = null }) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const isEditMode = Boolean(bannerToEdit);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [link, setLink] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Fetch products for dropdown autocomplete
  const { data: apiProductsResponse, isLoading: isProductsLoading } = useQuery({
    queryKey: ["products-for-second-banner"],
    queryFn: () => fetchProducts({ params: { page: 1, per_page: 1000 } }),
    staleTime: 5 * 60 * 1000,
  });

  const productOptions = useMemo(() => {
    const products = apiProductsResponse?.data || [];
    return products.map((p) => ({
      value: p._id,
      label: p.name,
      sku: p.sku,
      image: p.banner_image,
      price: p.price,
    }));
  }, [apiProductsResponse]);

  useEffect(() => {
    if (open) {
      if (bannerToEdit) {
        setLink(bannerToEdit.link || "");
        setIsActive(
          bannerToEdit.is_active !== undefined ? bannerToEdit.is_active : true
        );
        setImageFile(null);
        setImagePreview(
          bannerToEdit.banner_image ||
            bannerToEdit.banner_url ||
            bannerToEdit.image ||
            null
        );

        const prodId =
          typeof bannerToEdit.product === "object"
            ? bannerToEdit.product?._id
            : bannerToEdit.product;

        if (prodId && productOptions.length > 0) {
          const match = productOptions.find((opt) => opt.value === prodId);
          setSelectedProduct(
            match || {
              value: prodId,
              label: bannerToEdit.product?.name || "Linked Product",
              image: bannerToEdit.product?.banner_image,
            }
          );
        } else if (prodId) {
          setSelectedProduct({
            value: prodId,
            label: bannerToEdit.product?.name || prodId,
            image: bannerToEdit.product?.banner_image,
          });
        } else {
          setSelectedProduct(null);
        }
      } else {
        setSelectedProduct(null);
        setLink("");
        setIsActive(true);
        setImageFile(null);
        setImagePreview(null);
      }
    }
  }, [open, bannerToEdit, productOptions]);

  const handleFileChange = (file) => {
    if (!file) return;
    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      toast.error("Only JPG and PNG images are allowed.");
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

  // Create mutation
  const { mutate: createMutation, isPending: isCreating } = useMutation({
    mutationFn: createSecondBanner,
    onSuccess: (res) => {
      const isSuccess =
        !res?.error &&
        (res?.response?.success ||
          res?.success ||
          (res?.response?.statusCode >= 200 && res?.response?.statusCode < 300) ||
          (res?.response?.status >= 200 && res?.response?.status < 300));

      if (isSuccess) {
        toast.success("Top single banner created successfully.");
        queryClient.invalidateQueries({ queryKey: ["second-banners"] });
        onClose();
      } else {
        const errorMsg =
          res?.response?.data?.message ||
          res?.response?.data?.error ||
          res?.response?.message ||
          res?.message ||
          "Failed to create top single banner.";
        console.error("Create top single banner failed:", res);
        toast.error(errorMsg);
      }
    },
    onError: (error) => {
      console.error("Create second banner mutation error:", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "An error occurred while creating the banner.";
      toast.error(errorMsg);
    },
  });

  // Update mutation
  const { mutate: updateMutation, isPending: isUpdating } = useMutation({
    mutationFn: updateSecondBanner,
    onSuccess: (res) => {
      const isSuccess =
        !res?.error &&
        (res?.response?.success ||
          res?.success ||
          (res?.response?.statusCode >= 200 && res?.response?.statusCode < 300) ||
          (res?.response?.status >= 200 && res?.response?.status < 300));

      if (isSuccess) {
        toast.success("Top single banner updated successfully.");
        queryClient.invalidateQueries({ queryKey: ["second-banners"] });
        onClose();
      } else {
        const errorMsg =
          res?.response?.data?.message ||
          res?.response?.data?.error ||
          res?.response?.message ||
          res?.message ||
          "Failed to update top single banner.";
        console.error("Update top single banner failed:", res);
        toast.error(errorMsg);
      }
    },
    onError: (error) => {
      console.error("Update second banner mutation error:", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "An error occurred while updating the banner.";
      toast.error(errorMsg);
    },
  });

  const isSubmitting = isCreating || isUpdating;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isEditMode && !imageFile) {
      toast.error("Please upload a banner image (JPG or PNG).");
      return;
    }

    if (isEditMode && !imageFile && !imagePreview) {
      toast.error("Banner image is required.");
      return;
    }

    // When editing without changing image, send clean JSON
    if (isEditMode && !imageFile) {
      const payload = {
        order: 0,
        is_active: Boolean(isActive),
      };
      if (selectedProduct?.value) {
        payload.product = selectedProduct.value;
      }
      if (link && link.trim()) {
        payload.link = link.trim();
      }

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
    if (selectedProduct?.value) {
      formData.append("product", selectedProduct.value);
    }
    if (link && link.trim()) {
      formData.append("link", link.trim());
    }
    formData.append("order", "0");
    formData.append("is_active", String(isActive));

    if (isEditMode) {
      updateMutation({
        id: bannerToEdit._id,
        data: formData,
      });
    } else {
      createMutation(formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isSubmitting && onClose(isOpen)}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <ImageIcon className="size-5 text-primary" />
            <span>{isEditMode ? "Edit Top Single Banner" : "Add Top Single Banner"}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Banner Image Uploader: PNG / JPG only */}
          <div className="space-y-2">
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
                  <span>Remove Image</span>
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
                className={`cursor-pointer border-2 border-dashed rounded-xl p-6 transition-colors flex flex-col items-center justify-center gap-2 text-center ${
                  isDragOver
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/60 hover:bg-muted/30"
                }`}
              >
                <div className="size-11 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <UploadCloud className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Click to browse or drag &amp; drop PNG or JPG banner image
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Only .png, .jpg, .jpeg supported
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Linked Product Dropdown / Autocomplete */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Package className="size-4 text-muted-foreground" />
              <span>Link to Product</span>
              <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Select
              isLoading={isProductsLoading}
              isClearable
              placeholder="Search product by name or SKU..."
              options={productOptions}
              value={selectedProduct}
              onChange={(opt) => setSelectedProduct(opt)}
              styles={selectStyles}
              formatOptionLabel={(option) => (
                <div className="flex items-center gap-2.5 py-0.5">
                  {option.image ? (
                    <img
                      src={option.image}
                      alt={option.label}
                      className="size-7 rounded object-cover border shrink-0"
                    />
                  ) : (
                    <div className="size-7 rounded bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                      <Package className="size-3.5" />
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-medium truncate">{option.label}</span>
                    {option.sku && (
                      <span className="text-[10px] text-muted-foreground">SKU: {option.sku}</span>
                    )}
                  </div>
                </div>
              )}
            />
          </div>

          {/* Custom Link */}
          <div className="space-y-1.5">
            <Label htmlFor="banner-link" className="text-sm font-medium flex items-center gap-1.5">
              <LinkIcon className="size-4 text-muted-foreground" />
              <span>Custom Route / External Link</span>
              <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Input
              id="banner-link"
              placeholder="e.g. /category/skincare or https://..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
          </div>

          {/* Active Toggle Switch */}
          <div className="rounded-lg border border-border/80 p-3 bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="active-toggle" className="text-sm font-medium cursor-pointer">
                  Active Status
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  {isActive ? "Visible on storefront" : "Hidden from storefront"}
                </p>
              </div>
              <Switch
                id="active-toggle"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
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
                  <span>{isEditMode ? "Updating..." : "Uploading..."}</span>
                </>
              ) : (
                <span>{isEditMode ? "Update Banner" : "Upload Banner"}</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SecondBannerModal;
