import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import VirtualList from "rc-virtual-list";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateShipmentZone } from "../../helpers/updateShipmentZone";
import { createShipmentZone } from "../../helpers/createShipmentZone";
import { X, Plus } from "lucide-react";


const AddShipmentZoneCard = ({ initialData = {}, isEditMode = false }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    zone_name: "",
    pincodes: [],
    pricing_type: "flat_rate",
    weight_unit_grams: 1000,
    price: 0,
    price_per_unit: 0,
    fixed_amount: 0,
    flat_rate_base: 0,
    min_weight_grams: 1000,
    is_default: false,
    is_active: true,
    description: "",
    newPincode: "",
  });


  // Pre-fill form for editing
  useEffect(() => {
    if (isEditMode && initialData && Object.keys(initialData).length > 0) {

      const newFormData = {
        zone_name: initialData.zone_name || "",
        pincodes: initialData.pincodes || [],
        pricing_type: initialData.pricing_type || "flat_rate",
        weight_unit_grams: initialData.weight_unit_grams || 1000,
        price: initialData.price || 0,
        price_per_unit: initialData.price_per_unit || initialData.price || 0, // Use price if price_per_unit is not available
        fixed_amount: initialData.fixed_amount || 0,
        flat_rate_base: initialData.flat_rate_base || 0,
        min_weight_grams: initialData.min_weight_grams || 1000,
        is_default: initialData.is_default || false,
        is_active: initialData.is_active !== undefined ? initialData.is_active : true,
        description: initialData.description || "",
        newPincode: "",
      };
      
      setFormData(newFormData);
    }
  }, [initialData, isEditMode]);

  // Mutation: Create or Update
  const mutation = useMutation({
    mutationFn: async (form) => {
      
        const result = isEditMode
          ? await updateShipmentZone({ id: initialData._id, data: form })
          : await createShipmentZone(form);
        return result;
      
    },

    onSuccess: (data) => {
      
      // Handle different response structures
      const isSuccess = data?.response?.success || data?.success;
      const message = data?.response?.message || data?.message;
      
      if (isSuccess) {
        toast.success(`Shipment Zone ${isEditMode ? "updated" : "created"} successfully!`);
        navigate("/dashboard/shipment-zones");
      } else if (data?.response?.data || data?.data) {
        // Sometimes API returns data even if success is false
        toast.success(`Shipment Zone ${isEditMode ? "updated" : "created"} successfully!`);
        navigate("/dashboard/shipment-zones");
      } else {
        toast.error(message || "Operation failed");
      }
    },

    onError: (error) => {
      if (error?.response?.data?.errors) {
        Object.values(error.response.data.errors).forEach((errMsg) => {
          toast.error(errMsg);
        });
        return;
      }
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to save shipment zone";

      toast.error(message);
    },
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

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

  const addPincode = () => {
    const input = formData.newPincode.trim();
    if (!input) return;

    // Check if input contains multiple lines (bulk input)
    const lines = input.split('\n').map(line => line.trim()).filter(line => line);
    
    if (lines.length > 1) {
      // Bulk input - add all valid pincodes
      const newPincodes = lines.filter(pincode => 
        pincode && 
        !formData.pincodes.includes(pincode) &&
        /^\d{6}$/.test(pincode) // Basic 6-digit pincode validation
      );
      
      if (newPincodes.length > 0) {
        setFormData((prev) => ({
          ...prev,
          pincodes: [...prev.pincodes, ...newPincodes],
          newPincode: "",
        }));
        toast.success(`Added ${newPincodes.length} pincodes`);
      } else {
        toast.error("No valid pincodes found in the input");
      }
    } else {
      // Single pincode input
      const pincode = lines[0];
      if (!/^\d{6}$/.test(pincode)) {
        toast.error("Please enter a valid 6-digit pincode");
        return;
      }
      
      if (!formData.pincodes.includes(pincode)) {
        setFormData((prev) => ({
          ...prev,
          pincodes: [...prev.pincodes, pincode],
          newPincode: "",
        }));
      } else {
        toast.error("This pincode is already added");
      }
    }
  };

  const removePincode = (index) => {
    setFormData((prev) => ({
      ...prev,
      pincodes: prev.pincodes.filter((_, i) => i !== index),
    }));
  };

  const handlePincodeKeyPress = (e) => {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      addPincode();
    }
  };

  // Submit form
  const handleSubmit = () => {
    if (!formData.zone_name.trim()) {
      toast.error("Zone name is required");
      return;
    }

    // Allow empty pincodes only if this is a default zone
    if (formData.pincodes.length === 0 && !formData.is_default) {
      toast.error("At least one pincode is required (or mark as default zone)");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Description is required");
      return;
    }

    // Prepare the payload based on pricing type
    const payload = {
      zone_name: formData.zone_name,
      pincodes: formData.pincodes,
      pricing_type: formData.pricing_type,
      is_default: formData.is_default,
      is_active: formData.is_active,
      description: formData.description,
    };

    // Add pricing fields based on type
    if (formData.pricing_type === "flat_rate") {
      payload.weight_unit_grams = Number(formData.weight_unit_grams);
      payload.price = Number(formData.price_per_unit); // Note: API expects "price" not "price_per_unit"
    } else if (formData.pricing_type === "fixed_rate") {
      payload.fixed_amount = Number(formData.fixed_amount);
    } else if (formData.pricing_type === "flat_rate_plus_dynamic") {
      payload.weight_unit_grams = Number(formData.weight_unit_grams);
      payload.price = Number(formData.price_per_unit);
      payload.flat_rate_base = Number(formData.flat_rate_base);
      payload.min_weight_grams = Number(formData.min_weight_grams);
    }
    // For "free" pricing type, no additional fields needed

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
        <Label>Zone Name</Label>
        <Input
          type="text"
          name="zone_name"
          value={formData.zone_name}
          onChange={handleChange}
          placeholder="Enter zone name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Pincodes</Label>
        <p className="text-muted-foreground text-sm">
          Enter single pincode or paste multiple pincodes (one per line) for bulk input
          {formData.is_default && (
            <span className="text-primary mt-1 block font-medium">
              Default zone: Can be left empty to serve as fallback for all unmatched pincodes
            </span>
          )}
        </p>
        <div className="space-y-2">
          <Textarea
            value={formData.newPincode}
            onChange={(e) => setFormData(prev => ({ ...prev, newPincode: e.target.value }))}
            onKeyDown={handlePincodeKeyPress}
            placeholder={formData.is_default ? "Optional: Add specific pincodes, or leave empty for default fallback&#10;795114&#10;795005&#10;795008&#10;..." : "795114&#10;795005&#10;795008&#10;... or single pincode"}
            rows={4}
            className="resize-none"
          />
          <Button type="button" onClick={addPincode} variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Pincode(s)
          </Button>
        </div>
        {formData.pincodes.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                {formData.pincodes.length} pincode(s) added
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormData(prev => ({ ...prev, pincodes: [] }))}
                className="text-destructive hover:text-destructive"
              >
                Clear All
              </Button>
            </div>
            <div className="border-border rounded-lg border p-2">
              {formData.pincodes.length <= 50 ? (
                // Show regular flex layout for small lists (≤50 items)
                <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
                  {formData.pincodes.map((pincode, index) => (
                    <div
                      key={index}
                      className="bg-primary/10 text-primary flex items-center gap-1 rounded-full px-3 py-1 text-sm"
                    >
                      <span>{pincode}</span>
                      <button
                        type="button"
                        onClick={() => removePincode(index)}
                        className="hover:text-primary/70 ml-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                // Use virtual list for large lists (>50 items)
                <div className="h-32">
                  <VirtualList
                    data={formData.pincodes}
                    height={128}
                    itemHeight={32}
                    itemKey={(item, index) => `${item}-${index}`}
                    style={{ outline: 'none' }}
                  >
                    {(pincode, index) => (
                      <div key={`${pincode}-${index}`} className="px-1 py-0.5">
                        <div className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm">
                          <span>{pincode}</span>
                          <button
                            type="button"
                            onClick={() => removePincode(index)}
                            className="hover:text-primary/70 ml-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </VirtualList>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Pricing Type</Label>
        <Select
          key={formData.pricing_type} // Force re-render when pricing_type changes
          value={formData.pricing_type}
          onValueChange={(value) => handleSelectChange("pricing_type", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select pricing type">
              {formData.pricing_type === "free" && "Free Shipping"}
              {formData.pricing_type === "flat_rate" && "Flat Rate (per weight unit)"}
              {formData.pricing_type === "fixed_rate" && "Fixed Rate"}
              {formData.pricing_type === "flat_rate_plus_dynamic" && "Flat Rate + Dynamic Pricing"}
              {!formData.pricing_type && "Select pricing type"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="free">Free Shipping</SelectItem>
            <SelectItem value="flat_rate">Flat Rate (per weight unit)</SelectItem>
            <SelectItem value="fixed_rate">Fixed Rate</SelectItem>
            <SelectItem value="flat_rate_plus_dynamic">Flat Rate + Dynamic Pricing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.pricing_type === "flat_rate" && (
        <>
          <div className="space-y-2">
            <Label>Weight Unit (grams)</Label>
            <Input
              type="number"
              name="weight_unit_grams"
              value={formData.weight_unit_grams}
              onChange={handleChange}
              placeholder="Enter weight unit in grams"
              min="1"
            />
          </div>
          <div className="space-y-2">
            <Label>Price (₹)</Label>
            <Input
              type="number"
              name="price_per_unit"
              value={formData.price_per_unit}
              onChange={handleChange}
              placeholder="Enter price"
              min="0"
              step="0.01"
            />
          </div>
        </>
      )}

      {formData.pricing_type === "fixed_rate" && (
        <div className="space-y-2">
          <Label>Fixed Amount (₹)</Label>
          <Input
            type="number"
            name="fixed_amount"
            value={formData.fixed_amount}
            onChange={handleChange}
            placeholder="Enter fixed amount"
            min="0"
            step="0.01"
          />
        </div>
      )}

      {formData.pricing_type === "flat_rate_plus_dynamic" && (
        <>
          <div className="space-y-2">
            <Label>Weight Unit (grams)</Label>
            <Input
              type="number"
              name="weight_unit_grams"
              value={formData.weight_unit_grams}
              onChange={handleChange}
              placeholder="Enter weight unit in grams"
              min="1"
            />
          </div>
          <div className="space-y-2">
            <Label>Price (₹)</Label>
            <Input
              type="number"
              name="price_per_unit"
              value={formData.price_per_unit}
              onChange={handleChange}
              placeholder="Enter price"
              min="0"
              step="0.01"
            />
          </div>
          <div className="space-y-2">
            <Label>Flat Rate Base (₹)</Label>
            <Input
              type="number"
              name="flat_rate_base"
              value={formData.flat_rate_base}
              onChange={handleChange}
              placeholder="Enter flat rate base amount"
              min="0"
              step="0.01"
            />
          </div>
          <div className="space-y-2">
            <Label>Minimum Weight (grams)</Label>
            <Input
              type="number"
              name="min_weight_grams"
              value={formData.min_weight_grams}
              onChange={handleChange}
              placeholder="Enter minimum weight in grams"
              min="1"
            />
          </div>
        </>
      )}

      {formData.pricing_type === "free" && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-500/10">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-400">
            Free shipping is enabled for this zone. No additional charges will apply.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter zone description"
          required
        />
      </div>

      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_default"
            checked={formData.is_default}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({
                ...prev,
                is_default: !!checked,
              }))
            }
          />
          <Label htmlFor="is_default">Set as Default Zone</Label>
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
      </div>

      <div className="pt-4">
        <Button type="submit" className="w-full" disabled={mutation.isLoading}>
          {mutation.isLoading ? (
            <span className="flex items-center gap-2">
              <span className="border-primary-foreground h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
              {isEditMode ? "Updating..." : "Submitting..."}
            </span>
          ) : isEditMode ? "Update Shipment Zone" : "Create Shipment Zone"}
        </Button>
      </div>
    </form>
  );
};

export default AddShipmentZoneCard;
