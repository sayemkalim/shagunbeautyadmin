import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { Info } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { updateCoupon } from "../../helpers/updateCoupon";
import { createCoupon } from "../../helpers/createCoupon";

const todayISODate = () => format(new Date(), "yyyy-MM-dd");

const toDateInputValue = (value) => {
  if (!value) return "";
  try {
    return format(new Date(value), "yyyy-MM-dd");
  } catch {
    return "";
  }
};

const AddCouponCard = ({ initialData = {}, isEditMode = false }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "flat",
    discount_value: "",
    max_discount_amount: "",
    min_order_value: 0,
    usage_limit_total: "",
    usage_limit_per_user: 1,
    valid_from: todayISODate(),
    valid_until: "",
    is_active: true,
  });

  const [codeError, setCodeError] = useState("");

  // Pre-fill form for editing
  useEffect(() => {
    if (isEditMode && initialData && Object.keys(initialData).length > 0) {
      setFormData({
        code: initialData.code || "",
        description: initialData.description || "",
        discount_type: initialData.discount_type || "flat",
        discount_value:
          initialData.discount_value === null || initialData.discount_value === undefined
            ? ""
            : String(initialData.discount_value),
        max_discount_amount:
          initialData.max_discount_amount === null || initialData.max_discount_amount === undefined
            ? ""
            : String(initialData.max_discount_amount),
        min_order_value: initialData.min_order_value ?? 0,
        usage_limit_total:
          initialData.usage_limit_total === null || initialData.usage_limit_total === undefined
            ? ""
            : String(initialData.usage_limit_total),
        usage_limit_per_user: initialData.usage_limit_per_user ?? 1,
        valid_from: toDateInputValue(initialData.valid_from) || todayISODate(),
        valid_until: toDateInputValue(initialData.valid_until),
        is_active: initialData.is_active !== undefined ? initialData.is_active : true,
      });
    }
  }, [initialData, isEditMode]);

  // Mutation: Create or Update
  const mutation = useMutation({
    mutationFn: async (payload) => {
      return isEditMode
        ? await updateCoupon({ id: initialData._id, data: payload })
        : await createCoupon(payload);
    },

    onSuccess: (data) => {
      const isSuccess = data?.response?.success || data?.success;

      if (isSuccess) {
        toast.success(`Coupon ${isEditMode ? "updated" : "created"} successfully!`);
        navigate("/dashboard/coupons");
        return;
      }

      const status = data?.response?.status;
      const message =
        data?.response?.data?.message ||
        data?.response?.message ||
        data?.message ||
        "Failed to save coupon";

      if (status === 409) {
        setCodeError(message);
        return;
      }

      toast.error(message);
    },

    onError: (error) => {
      if (error?.response?.status === 409) {
        setCodeError(error?.response?.data?.message || "Coupon code already exists");
        return;
      }
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to save coupon";
      toast.error(message);
    },
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === "checkbox" ? checked : value;

    if (name === "code") {
      newValue = newValue.toUpperCase();
      setCodeError("");
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Submit form
  const handleSubmit = () => {
    if (!formData.code.trim()) {
      toast.error("Coupon code is required");
      return;
    }

    const discountValue = Number(formData.discount_value);
    if (!formData.discount_value || isNaN(discountValue) || discountValue <= 0) {
      toast.error("Discount value must be greater than 0");
      return;
    }

    if (formData.discount_type === "percentage" && discountValue > 100) {
      toast.error("Percentage discount cannot exceed 100");
      return;
    }

    const minOrderValue = Number(formData.min_order_value || 0);
    if (minOrderValue < 0) {
      toast.error("Minimum order value cannot be negative");
      return;
    }

    const payload = {
      code: formData.code.trim().toUpperCase(),
      description: formData.description?.trim() || null,
      discount_type: formData.discount_type,
      discount_value: discountValue,
      max_discount_amount:
        formData.discount_type === "percentage" && formData.max_discount_amount !== ""
          ? Number(formData.max_discount_amount)
          : null,
      min_order_value: minOrderValue,
      usage_limit_total:
        formData.usage_limit_total === "" ? null : Number(formData.usage_limit_total),
      usage_limit_per_user: Number(formData.usage_limit_per_user || 1),
      valid_from: formData.valid_from
        ? new Date(formData.valid_from).toISOString()
        : new Date().toISOString(),
      valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
      is_active: !!formData.is_active,
    };

    setCodeError("");
    mutation.mutate(payload);
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
        <Label>Code</Label>
        <Input
          type="text"
          name="code"
          value={formData.code}
          onChange={handleChange}
          placeholder="e.g. WELCOME10"
          className="font-mono uppercase"
          required
        />
        {codeError && <p className="text-destructive text-sm">{codeError}</p>}
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Optional description for this coupon"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Discount Type</Label>
          <Select
            value={formData.discount_type}
            onValueChange={(value) => handleSelectChange("discount_type", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select discount type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="flat">Flat</SelectItem>
              <SelectItem value="percentage">Percentage</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Discount Value ({formData.discount_type === "percentage" ? "%" : "₹"})</Label>
          <Input
            type="number"
            name="discount_value"
            value={formData.discount_value}
            onChange={handleChange}
            placeholder={formData.discount_type === "percentage" ? "e.g. 10" : "e.g. 100"}
            min="0"
            step="0.01"
            required
          />
        </div>
      </div>

      {formData.discount_type === "percentage" && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label>Max Discount Amount (₹)</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="text-muted-foreground size-3.5" />
              </TooltipTrigger>
              <TooltipContent>caps the discount amount, optional</TooltipContent>
            </Tooltip>
          </div>
          <Input
            type="number"
            name="max_discount_amount"
            value={formData.max_discount_amount}
            onChange={handleChange}
            placeholder="Optional cap"
            min="0"
            step="0.01"
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Min Order Value (₹)</Label>
          <Input
            type="number"
            name="min_order_value"
            value={formData.min_order_value}
            onChange={handleChange}
            placeholder="0"
            min="0"
            step="0.01"
          />
        </div>

        <div className="space-y-2">
          <Label>Usage Limit Total</Label>
          <Input
            type="number"
            name="usage_limit_total"
            value={formData.usage_limit_total}
            onChange={handleChange}
            placeholder="Unlimited"
            min="1"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Usage Limit Per User</Label>
          <Input
            type="number"
            name="usage_limit_per_user"
            value={formData.usage_limit_per_user}
            onChange={handleChange}
            placeholder="1"
            min="1"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Valid From</Label>
          <Input
            type="date"
            name="valid_from"
            value={formData.valid_from}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <Label>Valid Until</Label>
          <Input
            type="date"
            name="valid_until"
            value={formData.valid_until}
            onChange={handleChange}
            placeholder="No expiry"
          />
        </div>
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
          ) : isEditMode ? "Update Coupon" : "Create Coupon"}
        </Button>
      </div>
    </form>
  );
};

export default AddCouponCard;
