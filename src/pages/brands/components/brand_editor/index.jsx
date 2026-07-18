import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import NavbarItem from "@/components/navbar/navbar_item";
import AddBrandCard from "./AddBrandCard";
import { fetchBrandById } from "../../helpers/fetchBrandById";

const BrandEditor = () => {
  const { id } = useParams();

  const {
    data: initialDataRes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["brand", id],
    queryFn: () => fetchBrandById({ id }),
    enabled: !!id,
  });

  const initialData = initialDataRes?.response?.data;

  const breadcrumbs = [
    { title: "Brands", isNavigation: true, path: "/dashboard/brands" },
    { title: id ? "Edit Brand" : "Add Brand", isNavigation: false },
  ];

  return (
    <div className="flex flex-col gap-2">
      <NavbarItem
        title={id ? "Edit Brand" : "Add Brand"}
        breadcrumbs={breadcrumbs}
      />
      <div className="px-8 pb-8">
        {isLoading ? (
          <div className="text-muted-foreground flex h-48 items-center justify-center">Loading...</div>
        ) : error ? (
          <p className="text-destructive text-center">Failed to load Brand data.</p>
        ) : id && !initialData ? (
          <p className="text-destructive text-center">No brand data found.</p>
        ) : (
          <AddBrandCard initialData={initialData} isEditMode={!!id} />
        )}
      </div>
    </div>
  );
};

export default BrandEditor;
