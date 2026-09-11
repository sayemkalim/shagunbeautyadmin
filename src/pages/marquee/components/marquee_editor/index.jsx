import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import NavbarItem from "@/components/navbar/navbar_item";
import AddMarqueeCard from "./AddMarqueeCard";
import { fetchMarqueeById } from "../../helpers/fetchMarqueeById";

const MarqueeEditor = () => {
  const { id } = useParams();

  const {
    data: initialDataRes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["marquee", id],
    queryFn: () => fetchMarqueeById(id),
    enabled: !!id,
  });

  const initialData = initialDataRes?.response?.data || initialDataRes?.data;

  const breadcrumbs = [
    { title: "Marquee", isNavigation: true, path: "/dashboard/marquee" },
    { title: id ? "Edit Marquee" : "Add Marquee", isNavigation: false },
  ];

  return (
    <div className="flex flex-col gap-2">
      <NavbarItem
        title={id ? "Edit Marquee" : "Add Marquee"}
        breadcrumbs={breadcrumbs}
      />
      <div className="px-8 pb-8">
        {isLoading ? (
          <div className="text-muted-foreground flex h-48 items-center justify-center">Loading...</div>
        ) : error ? (
          <p className="text-destructive text-center">Failed to load marquee data.</p>
        ) : id && !initialData ? (
          <p className="text-destructive text-center">No marquee data found.</p>
        ) : (
          <AddMarqueeCard initialData={initialData} isEditMode={!!id} />
        )}
      </div>
    </div>
  );
};

export default MarqueeEditor;
