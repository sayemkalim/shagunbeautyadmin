import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import NavbarItem from "@/components/navbar/navbar_item";
import AddCouponCard from "./AddCouponCard";
import { fetchCouponById } from "../../helpers/fetchCouponById";

const CouponEditor = () => {
  const { id } = useParams();

  const {
    data: initialDataRes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["coupon", id],
    queryFn: () => fetchCouponById(id),
    enabled: !!id,
  });

  const initialData = initialDataRes?.response?.data || initialDataRes?.data;

  const breadcrumbs = [
    { title: "Coupons", isNavigation: true, path: "/dashboard/coupons" },
    { title: id ? "Edit Coupon" : "Add Coupon", isNavigation: false },
  ];

  return (
    <div className="flex flex-col gap-2">
      <NavbarItem
        title={id ? "Edit Coupon" : "Add Coupon"}
        breadcrumbs={breadcrumbs}
      />
      <div className="px-8 pb-8">
        {isLoading ? (
          <div className="text-muted-foreground flex h-48 items-center justify-center">Loading...</div>
        ) : error ? (
          <p className="text-destructive text-center">Failed to load coupon data.</p>
        ) : id && !initialData ? (
          <p className="text-destructive text-center">No coupon data found.</p>
        ) : (
          <AddCouponCard initialData={initialData} isEditMode={!!id} />
        )}
      </div>
    </div>
  );
};

export default CouponEditor;
