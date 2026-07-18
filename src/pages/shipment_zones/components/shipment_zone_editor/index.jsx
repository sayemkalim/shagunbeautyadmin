import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import NavbarItem from "@/components/navbar/navbar_item";
import AddShipmentZoneCard from "./AddShipmentZoneCard";
import { fetchShipmentZoneById } from "../../helpers/fetchShipmentZoneById";

const ShipmentZoneEditor = () => {
  const { id } = useParams();

  const {
    data: initialDataRes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["shipment-zone", id],
    queryFn: () => fetchShipmentZoneById(id),
    enabled: !!id,
  });

  const initialData = initialDataRes?.response?.data || initialDataRes?.data;

  const breadcrumbs = [
    { title: "Shipment Zones", isNavigation: true, path: "/dashboard/shipment-zones" },
    { title: id ? "Edit Shipment Zone" : "Add Shipment Zone", isNavigation: false },
  ];

  return (
    <div className="flex flex-col gap-2">
      <NavbarItem
        title={id ? "Edit Shipment Zone" : "Add Shipment Zone"}
        breadcrumbs={breadcrumbs}
      />
      <div className="px-8 pb-8">
        {isLoading ? (
          <div className="text-muted-foreground flex h-48 items-center justify-center">Loading...</div>
        ) : error ? (
          <p className="text-destructive text-center">Failed to load Shipment Zone data.</p>
        ) : id && !initialData ? (
          <p className="text-destructive text-center">No shipment zone data found.</p>
        ) : (
          <AddShipmentZoneCard initialData={initialData} isEditMode={!!id} />
        )}
      </div>
    </div>
  );
};

export default ShipmentZoneEditor;
