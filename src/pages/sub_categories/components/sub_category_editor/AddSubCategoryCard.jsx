import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { fetchCategory } from "../../helpers/fetchCategory";
import { updateSubCategory } from "../../helpers/updateSubCategory";
import { createSubCategory } from "../../helpers/createSubCategory";

const AddSubCategoryCard = ({ initialData = null, isEditMode = false }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
  });

  // Prefill form when editing
  useEffect(() => {
    if (isEditMode && initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        category: initialData.category?._id || "",
      });
    }
  }, [isEditMode, initialData]);

  // Mutation for create or update depending on mode
  const mutation = useMutation({
    mutationFn: (data) =>
      isEditMode
        ? updateSubCategory({ id: initialData._id, payload: data })
        : createSubCategory(data),
    onSuccess: () => {
      toast.success(
        isEditMode
          ? "Sub-Category updated successfully!"
          : "Sub-Category created successfully!"
      );
      navigate("/dashboard/subcategory");
    },
    onError: (error) => {
      toast.error(error.message || `Failed to ${isEditMode ? "update" : "create"} Sub-Category`);
    },
  });


  const {
    data: apiCategoriesResponse,
    isLoading: isCategoriesLoading,
    error: categoriesError,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: () => fetchCategory({ params: {} }),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    if (!formData.category) {
      toast.error("Category selection is required");
      return;
    }

    const payload = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
    };

    mutation.mutate(payload);
  };

  return (
    <>
      <div className="bg-card shadow-elegant-sm mx-auto w-full max-w-6xl space-y-6 rounded-xl border p-10">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Sub-Category Name"
          />
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Category Description"
          />
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <select
            name="category"
            onChange={handleChange}
            value={formData.category}
            className="border-input bg-background text-foreground focus-visible:ring-ring/50 h-9 w-60 rounded-md border px-3 py-1 text-sm shadow-elegant-sm outline-none focus-visible:ring-[3px]"
          >
            <option value=""> Select Category </option>
            {Array.isArray(apiCategoriesResponse?.data?.categories) &&
              apiCategoriesResponse.data.categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
          </select>
          {isCategoriesLoading && (
            <p className="text-muted-foreground text-sm">Loading categories...</p>
          )}
          {categoriesError && (
            <p className="text-destructive text-sm">Failed to load categories</p>
          )}
        </div>

        <div className="pt-4">
        <Button
  className="w-full"
  onClick={handleSubmit}
  disabled={mutation.isLoading}
>
  {mutation.isLoading
    ? isEditMode
      ? "Updating..."
      : "Adding..."
    : isEditMode
    ? "Update "
    : "Add"}
</Button>
        </div>
      </div>
    </>
  );
};

export default AddSubCategoryCard;
