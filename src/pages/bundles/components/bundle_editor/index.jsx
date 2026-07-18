import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import NavbarItem from "@/components/navbar/navbar_item";
import { fetchBundleById } from "../../helpers/fetchBundleById";
import AddBundleCard from "./AddBundleCard";

const BundleEditor = () => {
  const { id } = useParams(); 

  const {
    data: initialDataRes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["bundle", id],
    queryFn: () => fetchBundleById({ id }),
    enabled: !!id, 
  });

  const initialData = initialDataRes?.response?.data;

  const breadcrumbs = [
    { title: "Bundles", isNavigation: true, path: "/dashboard/bundles" },
    { title: id ? "Edit Bundle" : "Add Bundle", isNavigation: false },
  ];

  return (
    <div className="flex flex-col gap-2">
      <NavbarItem
        title={id ? "Edit Bundle" : "Add Bundle"}
        breadcrumbs={breadcrumbs}
      />
      <div className="px-8 pb-8">
        {isLoading ? (
          <div className="text-muted-foreground flex h-48 items-center justify-center">
            Loading...
          </div>
        ) : error ? (
          <p className="text-destructive text-center">Failed to load Bundle data.</p>
        ) : id && !initialData ? (
          <p className="text-destructive text-center">No Bundle data found.</p>
        ) : (
          <AddBundleCard initialData={initialData} isEditMode={!!id} />
        )}
      </div>
    </div>
  );
};

export default BundleEditor;
