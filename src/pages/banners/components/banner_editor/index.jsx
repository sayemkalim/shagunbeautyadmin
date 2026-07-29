import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import NavbarItem from "@/components/navbar/navbar_item";
import AddBannerCard from "./AddBannerCard";
import { fetchBannerById } from "../../helpers/fetchBannerById";

const BannerEditor = () => {
  const { id } = useParams();

  const {
    data: initialDataRes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["banner", id],
    queryFn: () => fetchBannerById(id),
    enabled: !!id,
  });

  const initialData = initialDataRes?.response?.data || initialDataRes?.data;

  const breadcrumbs = [
    { title: "Banners", isNavigation: true, path: "/dashboard/banners" },
    { title: id ? "Edit Banner" : "Add Banner", isNavigation: false },
  ];

  return (
    <div className="flex flex-col gap-2">
      <NavbarItem
        title={id ? "Edit Banner" : "Add Banner"}
        breadcrumbs={breadcrumbs}
      />
      <div className="px-8 pb-8">
        {isLoading ? (
          <div className="text-muted-foreground flex h-48 items-center justify-center">Loading...</div>
        ) : error ? (
          <p className="text-destructive text-center">Failed to load banner data.</p>
        ) : id && !initialData ? (
          <p className="text-destructive text-center">No banner data found.</p>
        ) : (
          <AddBannerCard initialData={initialData} isEditMode={!!id} />
        )}
      </div>
    </div>
  );
};

export default BannerEditor;
