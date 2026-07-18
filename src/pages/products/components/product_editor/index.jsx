import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import AddProductCard from "./AddProductCard";
import NavbarItem from "@/components/navbar/navbar_item";
import { fetchProductById } from "../helpers/fetchProductById"; // your function

const ProductsEditor = () => {
  const { id } = useParams(); // e.g. /dashboard/products/edit/:id

  const {
    data: initialDataRes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProductById({ id }),
    enabled: !!id, // Only run query in edit mode
  });

  const initialData = initialDataRes?.response?.data;

  const breadcrumbs = [
    { title: "Products", isNavigation: true, path: "/dashboard/products" },
    { title: id ? "Edit Product" : "Add Product", isNavigation: false },
  ];

  return (
    <div className="flex flex-col gap-2">
      <NavbarItem
        title={id ? "Edit Product" : "Add Product"}
        breadcrumbs={breadcrumbs}
      />
      <div className="px-8 pb-8">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="text-muted-foreground size-6 animate-spin" />
          </div>
        ) : error ? (
          <p className="text-destructive text-center">Failed to load product data.</p>
        ) : id && !initialData ? (
          <p className="text-destructive text-center">No product data found.</p>
        ) : (
          <AddProductCard initialData={initialData} isEditMode={!!id} />
        )}
      </div>
    </div>
  );
};

export default ProductsEditor;
