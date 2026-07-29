import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { Pencil, Trash2 } from "lucide-react";
import CustomTable from "@/components/custom_table";
import Typography from "@/components/typography";
import ActionMenu from "@/components/action_menu";
import { CustomDialog } from "@/components/custom_dialog";
import { fetchBanners } from "../helpers/fetchBanners";
import { deleteBanner } from "../helpers/deleteBanner";

const BannersTable = ({ setBannersLength, params, setParams }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: apiBannersResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["banners", params],
    queryFn: () => fetchBanners({ params }),
  });

  const bannerData = apiBannersResponse?.response?.data || apiBannersResponse?.data;
  const banners = useMemo(() => {
    const list = bannerData?.banners || [];
    return [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [bannerData]);
  const total = bannerData?.total || 0;
  const totalPages = bannerData?.total_pages || 1;
  const currentPage = params.page || 1;

  const [openDelete, setOpenDelete] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState(null);

  const handleOpenDialog = (banner) => {
    setOpenDelete(true);
    setSelectedBanner(banner);
  };

  const handleCloseDialog = () => {
    setOpenDelete(false);
    setSelectedBanner(null);
  };

  const { mutate: deleteBannerMutation, isLoading: isDeleting } = useMutation({
    mutationFn: deleteBanner,
    onSuccess: (res) => {
      if (res?.response?.success || res?.success) {
        toast.success(res?.response?.message || res?.message || "Banner deleted successfully.");
        queryClient.invalidateQueries(["banners"]);
        handleCloseDialog();
      } else {
        toast.error(res?.response?.message || res?.message || "Failed to delete banner.");
      }
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
          "An error occurred while deleting the banner."
      );
    },
  });

  const handleDeleteBanner = (id) => {
    deleteBannerMutation(id);
  };

  const onEditBanner = (banner) => {
    navigate(`/dashboard/banners/edit/${banner._id}`);
  };

  const onPageChange = (page) => {
    setParams((prev) => ({
      ...prev,
      page,
    }));
  };

  useEffect(() => {
    setBannersLength(total || banners?.length || 0);
  }, [total, banners]);

  const columns = [
    {
      key: "banner_url",
      label: "Banner",
      render: (value) => (
        <img
          src={value}
          alt="Banner"
          className="border-input h-12 w-24 rounded-md border object-cover"
        />
      ),
    },
    {
      key: "product",
      label: "Linked Product",
      render: (product) => (
        <div className="flex items-center gap-2">
          {product?.banner_image && (
            <img
              src={product.banner_image}
              alt={product?.name}
              className="border-input h-8 w-8 shrink-0 rounded-full border object-cover"
            />
          )}
          <div className="flex flex-col">
            <Typography variant="p" className="font-medium">
              {product?.name || "—"}
            </Typography>
            {product?.sku && (
              <Typography variant="small" className="text-muted-foreground">
                {product.sku}
              </Typography>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "order",
      label: "Order",
      render: (value) => <span className="text-sm">{value ?? 0}</span>,
    },
    {
      key: "is_active",
      label: "Status",
      render: (value) => (
        <span
          className={`rounded-full px-2 py-1 text-sm ${
            value
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {value ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <ActionMenu
          options={[
            {
              label: "Edit Banner",
              icon: Pencil,
              action: () => onEditBanner(row),
            },
            {
              label: "Delete Banner",
              icon: Trash2,
              action: () => handleOpenDialog(row),
              className: "text-destructive",
            },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <CustomTable
        columns={columns}
        data={banners}
        isLoading={isLoading}
        error={error}
        perPage={params.per_page}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        emptyStateMessage="No banners available"
      />

      <CustomDialog
        onOpen={openDelete}
        onClose={handleCloseDialog}
        title={`banner linked to "${selectedBanner?.product?.name}"`}
        modalType="Delete"
        onDelete={handleDeleteBanner}
        id={selectedBanner?._id}
        isLoading={isDeleting}
      />
    </>
  );
};

export default BannersTable;
