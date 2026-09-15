import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Trash2, Package, CreditCard, Layers } from "lucide-react";
import CustomTable from "@/components/custom_table";
import Typography from "@/components/typography";
import ActionMenu from "@/components/action_menu";
import { CustomDialog } from "@/components/custom_dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { deleteCardBanner } from "../helpers/deleteCardBanner";
import { updateCardBanner } from "../helpers/updateCardBanner";
import dayjs from "dayjs";

const CardBannerTable = ({
  banners = [],
  isLoading,
  error,
  params,
  setParams,
  total = 0,
  totalPages = 1,
  onEditBanner,
  globalHeading = "",
}) => {
  const queryClient = useQueryClient();

  const [openDelete, setOpenDelete] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // Delete mutation
  const { mutate: deleteMutation, isPending: isDeleting } = useMutation({
    mutationFn: deleteCardBanner,
    onSuccess: (res) => {
      if (res?.response?.success || res?.success || res?.response?.statusCode === 200) {
        toast.success("Card banner deleted successfully.");
        queryClient.invalidateQueries({ queryKey: ["card-banners"] });
        setOpenDelete(false);
        setSelectedBanner(null);
      } else {
        toast.error(
          res?.response?.message || res?.message || "Failed to delete card banner."
        );
      }
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message || "An error occurred while deleting the card banner."
      );
    },
  });

  // Toggle status mutation
  const { mutate: toggleStatusMutation } = useMutation({
    mutationFn: updateCardBanner,
    onMutate: ({ id }) => {
      setTogglingId(id);
    },
    onSuccess: (res, variables) => {
      setTogglingId(null);
      if (res?.response?.success || res?.success || res?.response?.statusCode === 200) {
        const nextStatus = variables.data?.is_active;
        toast.success(
          nextStatus
            ? "Status updated to Active."
            : "Status updated to Inactive."
        );
        queryClient.invalidateQueries({ queryKey: ["card-banners"] });
      } else {
        toast.error(res?.response?.message || res?.message || "Failed to update status.");
      }
    },
    onError: (err) => {
      setTogglingId(null);
      toast.error(
        err?.response?.data?.message || "An error occurred while toggling status."
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

  const handleDelete = (id) => {
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
      key: "banner_url",
      label: "Image",
      render: (_, row) => {
        const url =
          row?.banner_url || row?.banner_image || row?.image || row?.imageUrl;
        return url ? (
          <div className="relative group size-16 sm:w-24 sm:h-14 overflow-hidden rounded-md border border-border bg-muted shrink-0">
            <img
              src={url}
              alt={row?.title || "Banner preview"}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="size-16 sm:w-24 sm:h-14 rounded-md border border-dashed border-border bg-muted/40 flex items-center justify-center text-xs text-muted-foreground shrink-0">
            No image
          </div>
        );
      },
    },
    {
      key: "heading",
      label: "Section Heading",
      render: (value) => {
        const displayValue = value || globalHeading;
        const isMismatched = Boolean(
          globalHeading && value && value.trim() !== globalHeading.trim()
        );

        return displayValue ? (
          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className={`text-xs font-medium max-w-[150px] truncate ${
                isMismatched
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                  : "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 border-blue-200 dark:border-blue-800/40"
              }`}
              title={
                isMismatched
                  ? `Different from shared heading ("${globalHeading}")`
                  : displayValue
              }
            >
              {displayValue}
            </Badge>
            {isMismatched && (
              <span
                className="text-[10px] text-amber-600 dark:text-amber-400 font-bold"
                title="Heading does not match global heading. Save or sync heading above to fix."
              >
                (Diff)
              </span>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground italic text-xs">—</span>
        );
      },
    },
    {
      key: "type",
      label: "Type",
      render: (_, row) => {
        const isCard = row?.is_card !== undefined ? row.is_card : !row?.is_banner;
        return isCard ? (
          <Badge
            variant="outline"
            className="bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300 border-purple-300 dark:border-purple-500/30 gap-1 font-semibold px-2.5 py-0.5 rounded-full"
          >
            <CreditCard className="size-3" />
            <span>Card</span>
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30 gap-1 font-semibold px-2.5 py-0.5 rounded-full"
          >
            <Layers className="size-3" />
            <span>Banner</span>
          </Badge>
        );
      },
    },
    {
      key: "text",
      label: "Subtitle / Text",
      render: (value) => (
        <span className="text-xs text-muted-foreground line-clamp-2 max-w-[200px]" title={value}>
          {value || "—"}
        </span>
      ),
    },
    {
      key: "products",
      label: "Linked Products",
      render: (_, row) => {
        const products = Array.isArray(row?.products) ? row.products : [];

        if (products.length === 0) {
          return <span className="text-muted-foreground text-sm">—</span>;
        }

        const productNames = products.map((p) => p?.name || "Product").join(", ");

        if (products.length === 1) {
          const product = products[0];
          return (
            <div className="flex items-center gap-2 max-w-[200px]" title={productNames}>
              {product?.banner_image ? (
                <img
                  src={product.banner_image}
                  alt={product?.name}
                  className="size-7 rounded object-cover border shrink-0"
                />
              ) : (
                <div className="size-7 rounded bg-muted flex items-center justify-center border shrink-0">
                  <Package className="size-3.5 text-muted-foreground" />
                </div>
              )}
              <span className="text-xs font-medium truncate">
                {product?.name || "1 Product"}
              </span>
            </div>
          );
        }

        return (
          <div className="flex items-center gap-2" title={productNames}>
            <div className="flex -space-x-2 shrink-0">
              {products.slice(0, 3).map((p, idx) =>
                p?.banner_image ? (
                  <img
                    key={p?._id || idx}
                    src={p.banner_image}
                    alt={p?.name}
                    className="size-7 rounded-full border-2 border-background object-cover"
                  />
                ) : (
                  <div
                    key={p?._id || idx}
                    className="size-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px]"
                  >
                    <Package className="size-3 text-muted-foreground" />
                  </div>
                )
              )}
            </div>
            <span className="text-xs font-semibold text-foreground">
              {products.length} Products
            </span>
          </div>
        );
      },
    },
    {
      key: "order",
      label: "Order",
      render: (value) => (
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
          {value ?? 0}
        </span>
      ),
    },
    {
      key: "is_active",
      label: "Status",
      render: (value, row) => {
        const isToggling = togglingId === row._id;
        return (
          <div className="flex items-center gap-2">
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
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <ActionMenu
          options={[
            {
              label: "Edit",
              icon: Pencil,
              action: () => onEditBanner(row),
            },
            {
              label: "Delete",
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
        emptyStateMessage="No card banners found. Click 'Add Card Banner' above to create one."
      />

      {/* Delete confirmation dialog */}
      <CustomDialog
        onOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        title={
          selectedBanner?.title
            ? `"${selectedBanner.title}"`
            : selectedBanner?.text
            ? `"${selectedBanner.text}"`
            : selectedBanner?.heading
            ? `"${selectedBanner.heading}"`
            : "this card banner"
        }
        modalType="Delete"
        onDelete={handleDelete}
        id={selectedBanner?._id}
        isLoading={isDeleting}
      />
    </>
  );
};

export default CardBannerTable;
