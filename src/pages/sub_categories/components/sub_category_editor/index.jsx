import React from "react";
import { useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import NavbarItem from "@/components/navbar/navbar_item";
import AddSubCategoryCard from "./AddSubCategoryCard";
import { fetchUserCartById } from "@/pages/customer_list/page/customer_details/helpers/fetchUserCartById";

const SubCategoryEditor = () => {
  const { id } = useParams();
  const location = useLocation();

  const initialDataFromState = location.state?.subCategory || null;

  // ✅ React Query v5 syntax
  const {
    data: fetchedData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["subcategory", id],
    queryFn: () => fetchUserCartById(id),
    enabled: !!id && !initialDataFromState,
    staleTime: 5 * 60 * 1000, // Optional: 5 minutes
  });

  const initialData = initialDataFromState || fetchedData || null;

  const breadcrumbs = [
    {
      title: "Sub-Category",
      isNavigation: true,
      path: "/dashboard/subcategory",
    },
    {
      title: id ? "Edit Sub-Category" : "Add Sub-Category",
      isNavigation: false,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading Sub-Category data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-destructive text-center">
        Failed to load sub-category data.
      </p>
    );
  }

  if (id && !initialData) {
    return (
      <p className="text-destructive text-center">
        No sub-category data found.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <NavbarItem
        title={id ? "Edit Sub-Category" : "Add Sub-Category"}
        breadcrumbs={breadcrumbs}
      />
      <div className="px-8 pb-8">
        <AddSubCategoryCard initialData={initialData} isEditMode={!!id} />
      </div>
    </div>
  );
};

export default SubCategoryEditor;
