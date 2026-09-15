import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import NavbarItem from "@/components/navbar/navbar_item";
import CustomActionMenu from "@/components/custom_action";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ActiveBannerCard from "./components/ActiveBannerCard";
import SecondBannerTable from "./components/SecondBannerTable";
import SecondBannerModal from "./components/SecondBannerModal";
import { fetchSecondBanners } from "./helpers/fetchSecondBanners";
import { fetchProducts } from "@/pages/products/components/helpers/fetchProducts";

const SecondBanner = () => {
  const [params, setParams] = useState({
    page: 1,
    per_page: 20,
    is_active: undefined,
  });

  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);

  // Fetch second banners
  const {
    data: apiResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["second-banners", params],
    queryFn: () => fetchSecondBanners({ params }),
  });

  // Dedicated query to always resolve the currently live active second banner
  const {
    data: activeBannerResponse,
    isLoading: isActiveBannerLoading,
  } = useQuery({
    queryKey: ["second-banners", "active-preview"],
    queryFn: () =>
      fetchSecondBanners({ params: { page: 1, per_page: 10, is_active: true } }),
  });

  // Fetch products map to resolve linked product details
  const { data: apiProductsResponse } = useQuery({
    queryKey: ["products-for-second-banner-map"],
    queryFn: () => fetchProducts({ params: { page: 1, per_page: 1000 } }),
    staleTime: 5 * 60 * 1000,
  });

  const productsMap = useMemo(() => {
    const map = new Map();
    const products = apiProductsResponse?.data || [];
    products.forEach((p) => {
      if (p?._id) {
        map.set(p._id, p);
      }
    });
    return map;
  }, [apiProductsResponse]);

  const bannerData =
    apiResponse?.response?.data || apiResponse?.data || {};
  const banners = bannerData?.banners || [];

  const total = bannerData?.total || banners.length || 0;
  const totalPages = bannerData?.total_pages || 1;

  // Single banner constraint: Only 1 banner allowed until deleted
  const hasExistingBanner = total > 0 || banners.length > 0;

  // Determine active banner
  const activeBannersList =
    activeBannerResponse?.response?.data?.banners ||
    activeBannerResponse?.data?.banners ||
    [];

  const currentActiveBanner = useMemo(() => {
    if (activeBannersList.length > 0) {
      return activeBannersList[0];
    }
    return banners[0] || null;
  }, [activeBannersList, banners]);

  const handleOpenAdd = () => {
    setEditingBanner(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (banner) => {
    setEditingBanner(banner);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBanner(null);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setParams((prev) => ({
      ...prev,
      is_active: value === "all" ? undefined : value === "true",
      page: 1,
    }));
  };

  const onRowsPerPageChange = (newRowsPerPage) => {
    setParams((prev) => ({
      ...prev,
      per_page: newRowsPerPage,
      page: 1,
    }));
  };

  const breadcrumbs = [
    { title: "Dashboard", url: "/dashboard", isNavigation: true },
    { title: "Top Single Banner", isNavigation: false },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <NavbarItem title="Top Single Banner Management" breadcrumbs={breadcrumbs} />

      <div className="px-4 py-4 space-y-4">
        {/* Current Active Banner Card */}
        <ActiveBannerCard
          activeBanner={currentActiveBanner}
          isLoading={isActiveBannerLoading}
          onEdit={handleOpenEdit}
          onAdd={handleOpenAdd}
          productsMap={productsMap}
        />

        {/* Action Menu - Disable Add if banner already exists */}
        <CustomActionMenu
          title="Top Single Banner"
          total={total}
          onAdd={handleOpenAdd}
          disableAdd={hasExistingBanner}
          disableBulkUpload={true}
          disableSearch={true}
          onRowsPerPageChange={onRowsPerPageChange}
          showRowSelection={true}
          rowsPerPage={params.per_page}
          filters={
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          }
        />

        {hasExistingBanner && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between">
            <span>
              ℹ️ Only one top single banner can be active at a time. To add a new one, please edit or delete the existing banner.
            </span>
          </div>
        )}

        {/* Second Banners Table */}
        <SecondBannerTable
          banners={banners}
          isLoading={isLoading}
          error={error}
          params={params}
          setParams={setParams}
          total={total}
          totalPages={totalPages}
          onEditBanner={handleOpenEdit}
          productsMap={productsMap}
        />
      </div>

      {/* Add / Edit Modal */}
      <SecondBannerModal
        open={isModalOpen}
        onClose={handleCloseModal}
        bannerToEdit={editingBanner}
      />
    </div>
  );
};

export default SecondBanner;
