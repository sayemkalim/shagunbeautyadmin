import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import Select from "react-select";
import { X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { updateBanner } from "../../helpers/updateBanner";
import { createBanner } from "../../helpers/createBanner";
import { fetchProducts } from "@/pages/products/components/helpers/fetchProducts";

const selectStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: "var(--color-background)",
    borderColor: state.isFocused ? "var(--color-ring)" : "var(--color-input)",
    boxShadow: state.isFocused ? "0 0 0 3px color-mix(in oklch, var(--color-ring) 50%, transparent)" : "none",
    "&:hover": { borderColor: "var(--color-ring)" },
    borderRadius: "var(--radius-md)",
    minHeight: "2.25rem",
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
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? "var(--color-accent)" : "transparent",
    color: state.isFocused ? "var(--color-accent-foreground)" : "var(--color-popover-foreground)",
    cursor: "pointer",
  }),
  input: (base) => ({ ...base, color: "var(--color-foreground)" }),
  singleValue: (base) => ({ ...base, color: "var(--color-foreground)" }),
  placeholder: (base) => ({ ...base, color: "var(--color-muted-foreground)" }),
};

const AddBannerCard = ({ initialData = {}, isEditMode = false }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    banner_image: null,
    bannerPreview: null,
    product_id: "",
    order: 0,
    is_active: true,
  });

  const { data: apiProductsResponse, isLoading: isProductsLoading } = useQuery({
    queryKey: ["products-for-banner"],
    queryFn: () => fetchProducts({ params: { page: 1, per_page: 1000 } }),
  });

  const productOptions = useMemo(
    () => (apiProductsResponse?.data || []).map((p) => ({ value: p._id, label: p.name })),
    [apiProductsResponse]
  );

  // Pre-fill form for editing
  useEffect(() => {
    if (isEditMode && initialData && Object.keys(initialData).length > 0) {
      setFormData({
        banner_image: null,
        bannerPreview: initialData.banner_url || null,
        product_id: initialData.product?._id || "",
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

  const handleProductChange = (option) => {
    setFormData((prev) => ({ ...prev, product_id: option ? option.value : "" }));
  };

  // Submit form
  const handleSubmit = () => {
    if (!isEditMode && !formData.banner_image) {
      toast.error("Banner image is required");
      return;
    }

    if (!formData.product_id) {
      toast.error("Please select a product to link this banner to");
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
    form.append("product_id", formData.product_id);
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

      <div className="space-y-2">
        <Label>Linked Product</Label>
        <Select
          placeholder="Select a product..."
          isLoading={isProductsLoading}
          isClearable
          styles={selectStyles}
          options={productOptions}
          value={productOptions.find((opt) => opt.value === formData.product_id) || null}
          onChange={handleProductChange}
        />
      </div>

      <div className="space-y-2">
        <Label>Order</Label>
        <Input
          type="number"
          name="order"
          value={formData.order}
          onChange={(e) => setFormData((prev) => ({ ...prev, order: e.target.value }))}
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
        <Button type="submit" className="w-full" disabled={mutation.isLoading}>
          {mutation.isLoading ? (
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
