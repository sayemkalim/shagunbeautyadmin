import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import NavbarItem from "@/components/navbar/navbar_item";
import CustomActionMenu from "@/components/custom_action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tag, Check, Loader2, AlertCircle } from "lucide-react";
import CardBannerTable from "./components/CardBannerTable";
import CardBannerModal from "./components/CardBannerModal";
import { fetchCardBanners } from "./helpers/fetchCardBanners";
import { updateCardBannerHeading } from "./helpers/updateCardBannerHeading";

const CardBanner = () => {
  const queryClient = useQueryClient();
  const [params, setParams] = useState({
    page: 1,
    per_page: 20,
    is_active: undefined,
    is_card: undefined,
    is_banner: undefined,
  });

  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);

  // Global section heading for all card banners
  const [globalHeading, setGlobalHeading] = useState("");
  const [isHeadingInitialized, setIsHeadingInitialized] = useState(false);

  // Fetch card banners
  const {
    data: apiResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["card-banners", params],
    queryFn: () => fetchCardBanners({ params }),
  });

  const bannerData =
    apiResponse?.response?.data || apiResponse?.data || {};
  const banners = useMemo(() => {
    const list = bannerData?.banners || [];
    return [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [bannerData]);

  const total = bannerData?.total || banners.length || 0;
  const totalPages = bannerData?.total_pages || 1;

  // Auto-increment next order calculation (0, 1, 2, ...)
  const nextOrder = useMemo(() => {
    const list = bannerData?.banners || [];
    if (!list || list.length === 0) return 0;
    const orders = list.map((b) =>
      typeof b.order === "number" ? b.order : parseInt(b.order, 10) || 0
    );
    const max = Math.max(...orders, -1);
    return max >= 0 ? max + 1 : 0;
  }, [bannerData]);

  // Pre-fill global heading from existing banners
  useEffect(() => {
    if (!isHeadingInitialized && banners.length > 0) {
      const existingHeading =
        banners.find((b) => b?.heading?.trim())?.heading?.trim() || "";
      if (existingHeading) {
        setGlobalHeading(existingHeading);
      }
      setIsHeadingInitialized(true);
    }
  }, [banners, isHeadingInitialized]);

  // Collect unique non-empty headings from all banners
  const uniqueHeadings = useMemo(() => {
    const set = new Set();
    banners.forEach((b) => {
      if (b?.heading?.trim()) set.add(b.heading.trim());
    });
    return Array.from(set);
  }, [banners]);

  // Check if headings are inconsistent or missing across banners
  const hasMismatchedHeadings = useMemo(() => {
    if (banners.length <= 1) return false;
    const hasDifferentHeadings = uniqueHeadings.length > 1;
    const hasMissingHeadings =
      banners.some((b) => !b?.heading?.trim()) && uniqueHeadings.length > 0;
    return hasDifferentHeadings || hasMissingHeadings;
  }, [banners, uniqueHeadings]);

  // Bulk update heading mutation (updates ALL card banners in one go)
  const { mutate: handleSaveGlobalHeading, isPending: isSavingHeading } =
    useMutation({
      mutationFn: updateCardBannerHeading,
      onSuccess: (res, variables) => {
        const isSuccess =
          !res?.error &&
          (res?.response?.success ||
            res?.success ||
            (res?.response?.statusCode >= 200 &&
              res?.response?.statusCode < 300) ||
            (res?.response?.status >= 200 && res?.response?.status < 300));

        if (isSuccess) {
          if (variables?.heading !== undefined) {
            setGlobalHeading(variables.heading);
          }
          const defaultMsg = variables?.heading
            ? "All Card Banners heading updated successfully!"
            : "All Card Banners heading cleared successfully!";
          toast.success(res?.response?.message || res?.message || defaultMsg);
          queryClient.invalidateQueries({ queryKey: ["card-banners"] });
        } else {
          toast.error(
            res?.response?.data?.message ||
              res?.response?.message ||
              res?.message ||
              "Failed to update heading."
          );
        }
      },
      onError: (err) => {
        toast.error(
          err?.response?.data?.message ||
            err?.message ||
            "An error occurred while updating the heading."
        );
      },
    });

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

  const handleTypeFilterChange = (val) => {
    setTypeFilter(val);
    setParams((prev) => ({
      ...prev,
      is_card: val === "cards" ? true : undefined,
      is_banner: val === "banners" ? true : undefined,
      page: 1,
    }));
  };

  const handleStatusFilterChange = (val) => {
    setStatusFilter(val);
    setParams((prev) => ({
      ...prev,
      is_active: val === "all" ? undefined : val === "true",
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
    { title: "Card Banners", isNavigation: false },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <NavbarItem title="Card Banners Management" breadcrumbs={breadcrumbs} />

      <div className="px-4 py-4 space-y-4">
        {/* Top Card: All Card Banners Heading (Section Header) */}
        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Tag className="size-4" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  All Card Banners Heading (Section Header)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                  Same for All Banners
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Set the shared section heading for the storefront (e.g. &ldquo;Trending Beauty Deals&rdquo;). This updates across all card banners at once so they are never different.
              </p>
            </div>
            <div className="flex items-center gap-2 sm:w-auto w-full">
              <Input
                value={globalHeading}
                onChange={(e) => setGlobalHeading(e.target.value)}
                placeholder="e.g. Trending Beauty Deals"
                className="max-w-xs text-sm font-medium"
              />
              <Button
                onClick={() =>
                  handleSaveGlobalHeading({ heading: globalHeading.trim() })
                }
                disabled={isSavingHeading}
                className="shrink-0 gap-1.5 cursor-pointer"
              >
                {isSavingHeading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                <span>Save All Headings</span>
              </Button>
            </div>
          </div>

          {/* Mismatched Headings Alert: If any banner currently has a different or missing heading */}
          {hasMismatchedHeadings && (
            <div className="mt-3.5 pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 p-3 border border-amber-200/80 dark:border-amber-800/50">
              <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-200">
                <AlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>
                  Notice: Some banners currently have different or missing headings ({uniqueHeadings.join(", ") || "None"}). Sync now to make all banners identical.
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  handleSaveGlobalHeading({
                    heading: (globalHeading || uniqueHeadings[0] || "").trim(),
                  })
                }
                disabled={isSavingHeading || !(globalHeading || uniqueHeadings[0])}
                className="h-7 text-xs shrink-0 border-amber-300 bg-amber-100/60 text-amber-900 hover:bg-amber-200/70 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-100 cursor-pointer font-semibold"
              >
                {isSavingHeading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
                <span>Sync All to &ldquo;{globalHeading || uniqueHeadings[0]}&rdquo;</span>
              </Button>
            </div>
          )}
        </div>

        {/* Custom Action Menu with Type Filter, Status Filter & Add Button */}
        <CustomActionMenu
          title="Card Banners"
          total={total}
          onAdd={handleOpenAdd}
          disableBulkUpload={true}
          disableSearch={true}
          onRowsPerPageChange={onRowsPerPageChange}
          showRowSelection={true}
          rowsPerPage={params.per_page}
          filters={
            <div className="flex flex-col gap-3">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-medium">Filter by Type:</span>
                <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="cards">Cards Only (is_card)</SelectItem>
                    <SelectItem value="banners">Banners Only (is_banner)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-medium">Filter by Status:</span>
                <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          }
        />

        {/* Card Banners Table */}
        <CardBannerTable
          banners={banners}
          isLoading={isLoading}
          error={error}
          params={params}
          setParams={setParams}
          total={total}
          totalPages={totalPages}
          onEditBanner={handleOpenEdit}
          globalHeading={globalHeading}
        />
      </div>

      {/* Add / Edit Modal */}
      <CardBannerModal
        open={isModalOpen}
        onClose={handleCloseModal}
        bannerToEdit={editingBanner}
        nextOrder={nextOrder}
        globalHeading={globalHeading}
      />
    </div>
  );
};

export default CardBanner;
