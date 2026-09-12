import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { Pencil, Trash2, Package } from "lucide-react";
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

  const getBannerDeleteTitle = (banner) => {
    if (!banner) return "banner";
    const products =
      banner.products && banner.products.length > 0
        ? banner.products
        : banner.product
        ? [banner.product]
        : [];

    if (products.length === 0) return "banner";
    if (products.length === 1) return `banner linked to "${products[0]?.name || "product"}"`;
    return `banner linked to ${products.length} products (${products
      .slice(0, 3)
      .map((p) => p?.name)
      .filter(Boolean)
      .join(", ")}${products.length > 3 ? "..." : ""})`;
  };

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
      key: "products",
      label: "Linked Products",
      render: (_, row) => {
        const products =
          row?.products && row.products.length > 0
            ? row.products
            : row?.product
            ? [row.product]
            : [];

        if (products.length === 0) {
          return <span className="text-muted-foreground text-sm">—</span>;
        }

        if (products.length === 1) {
          const product = products[0];
          return (
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
          );
        }

        return (
          <div className="flex items-center gap-2.5">
            <div className="flex -space-x-2 shrink-0">
              {products.slice(0, 3).map((p, idx) =>
                p?.banner_image ? (
                  <img
                    key={p?._id || idx}
                    src={p.banner_image}
                    alt={p?.name}
                    className="border-background h-7 w-7 rounded-full border-2 object-cover"
                    title={p?.name}
                  />
                ) : (
                  <div
                    key={p?._id || idx}
                    className="border-background bg-muted text-muted-foreground flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px]"
                    title={p?.name}
                  >
                    <Package className="size-3.5" />
                  </div>
                )
              )}
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex flex-wrap items-center gap-1">
                {products.slice(0, 2).map((p, idx) => (
                  <span
                    key={p?._id || idx}
                    className="bg-secondary text-secondary-foreground inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium truncate max-w-[120px]"
                    title={p?.name}
                  >
                    {p?.name || "Product"}
                  </span>
                ))}
                {products.length > 2 && (
                  <span className="bg-muted text-muted-foreground inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium">
                    +{products.length - 2}
                  </span>
                )}
              </div>
              <Typography variant="small" className="text-muted-foreground text-[11px]">
                {products.length} products linked
              </Typography>
            </div>
          </div>
        );
      },
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
        title={getBannerDeleteTitle(selectedBanner)}
        modalType="Delete"
        onDelete={handleDeleteBanner}
        id={selectedBanner?._id}
        isLoading={isDeleting}
      />
    </>
  );
};

export default BannersTable;
