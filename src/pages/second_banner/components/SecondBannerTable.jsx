import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Trash2, Package, ExternalLink, ArrowUpRight } from "lucide-react";
import CustomTable from "@/components/custom_table";
import Typography from "@/components/typography";
import ActionMenu from "@/components/action_menu";
import { CustomDialog } from "@/components/custom_dialog";
import { Switch } from "@/components/ui/switch";
import { deleteSecondBanner } from "../helpers/deleteSecondBanner";
import { updateSecondBanner } from "../helpers/updateSecondBanner";
import dayjs from "dayjs";

const SecondBannerTable = ({
  banners = [],
  isLoading,
  error,
  params,
  setParams,
  total = 0,
  totalPages = 1,
  onEditBanner,
  productsMap = new Map(),
}) => {
  const queryClient = useQueryClient();

  const [openDelete, setOpenDelete] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // Delete banner mutation
  const { mutate: deleteMutation, isPending: isDeleting } = useMutation({
    mutationFn: deleteSecondBanner,
    onSuccess: (res) => {
      if (res?.response?.success || res?.success || res?.response?.statusCode === 200) {
        toast.success("Top single banner deleted successfully.");
        queryClient.invalidateQueries({ queryKey: ["second-banners"] });
        setOpenDelete(false);
        setSelectedBanner(null);
      } else {
        toast.error(
          res?.response?.message || res?.message || "Failed to delete top single banner."
        );
      }
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message || "An error occurred while deleting the banner."
      );
    },
  });

  // Toggle status mutation
  const { mutate: toggleStatusMutation } = useMutation({
    mutationFn: updateSecondBanner,
    onMutate: ({ id }) => {
      setTogglingId(id);
    },
    onSuccess: (res, variables) => {
      setTogglingId(null);
      if (res?.response?.success || res?.success || res?.response?.statusCode === 200) {
        const nextStatus = variables.data?.is_active;
        toast.success(
          nextStatus
            ? "Top single banner activated successfully."
            : "Top single banner deactivated successfully."
        );
        queryClient.invalidateQueries({ queryKey: ["second-banners"] });
      } else {
        toast.error(res?.response?.message || res?.message || "Failed to update status.");
      }
    },
    onError: (err) => {
      setTogglingId(null);
      toast.error(
        err?.response?.data?.message || "An error occurred while toggling banner status."
      );
    },
  });

  const handleToggleStatus = (banner) => {
    const newStatus = !banner.is_active;
    toggleStatusMutation({
      id: banner._id,
      data: {
        is_active: newStatus,
      },
    });
  };

  const handleOpenDeleteDialog = (banner) => {
    setSelectedBanner(banner);
    setOpenDelete(true);
  };

  const handleDeleteBanner = (id) => {
    deleteMutation(id);
  };

  const onPageChange = (newPage) => {
    setParams((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const columns = [
    {
      key: "banner_image",
      label: "Image Preview",
      render: (_, row) => {
        const url =
          row?.banner_image || row?.banner_url || row?.image || row?.imageUrl;
        return url ? (
          <div className="relative group size-16 sm:w-28 sm:h-14 overflow-hidden rounded-md border border-border bg-muted shrink-0">
            <img
              src={url}
              alt="Banner preview"
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="size-16 sm:w-28 sm:h-14 rounded-md border border-dashed border-border bg-muted/40 flex items-center justify-center text-xs text-muted-foreground shrink-0">
            No image
          </div>
        );
      },
    },
    {
      key: "product",
      label: "Linked Product / Destination",
      render: (_, row) => {
        let productObj = null;
        if (row?.product) {
          if (typeof row.product === "object") {
            productObj = row.product;
          } else if (productsMap.has(row.product)) {
            productObj = productsMap.get(row.product);
          }
        }

        if (productObj) {
          return (
            <div className="flex items-center gap-2 max-w-[260px]">
              {productObj.banner_image ? (
                <img
                  src={productObj.banner_image}
                  alt={productObj.name}
                  className="size-8 rounded object-cover border border-border shrink-0"
                />
              ) : (
                <div className="size-8 rounded bg-muted text-muted-foreground flex items-center justify-center border border-border shrink-0">
                  <Package className="size-4" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <Typography variant="p" className="font-medium text-xs truncate">
                  {productObj.name || "Product"}
                </Typography>
                {productObj.sku && (
                  <span className="text-[10px] text-muted-foreground block truncate">
                    SKU: {productObj.sku}
                  </span>
                )}
              </div>
            </div>
          );
        }

        if (row?.link) {
          return (
            <a
              href={row.link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline max-w-[200px] truncate"
              title={row.link}
            >
              <ExternalLink className="size-3 shrink-0" />
              <span className="truncate">{row.link}</span>
              <ArrowUpRight className="size-3 shrink-0" />
            </a>
          );
        }

        return <span className="text-muted-foreground text-sm">Direct / None</span>;
      },
    },
    {
      key: "is_active",
      label: "Status",
      render: (value, row) => {
        const isToggling = togglingId === row._id;
        return (
          <div className="flex items-center gap-2.5">
            <Switch
              checked={Boolean(value)}
              disabled={isToggling}
              onCheckedChange={() => handleToggleStatus(row)}
              aria-label="Toggle banner active status"
            />
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                value
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {value ? "Active" : "Inactive"}
            </span>
          </div>
        );
      },
    },
    {
      key: "createdAt",
      label: "Uploaded Date",
      render: (value) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {value ? dayjs(value).format("DD MMM YYYY, hh:mm A") : "—"}
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
              action: () => handleOpenDeleteDialog(row),
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
        currentPage={params.page || 1}
        totalPages={totalPages}
        onPageChange={onPageChange}
        emptyStateMessage="No top single banner uploaded yet."
      />

      {/* Delete confirmation dialog */}
      <CustomDialog
        onOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        title="this top single banner"
        modalType="Delete"
        onDelete={handleDeleteBanner}
        id={selectedBanner?._id}
        isLoading={isDeleting}
      />
    </>
  );
};

export default SecondBannerTable;
