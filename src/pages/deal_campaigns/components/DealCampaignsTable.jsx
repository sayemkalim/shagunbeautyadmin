import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Pencil,
  Trash2,
  Flame,
  Clock,
  Package,
  Store,
  Grid,
  Globe,
  CheckCircle2,
  XCircle,
  Calendar,
  Layers,
} from "lucide-react";
import CustomTable from "@/components/custom_table";
import Typography from "@/components/typography";
import ActionMenu from "@/components/action_menu";
import { CustomDialog } from "@/components/custom_dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import CountdownBadge from "./CountdownBadge";
import { toggleDealCampaignStatus } from "../helpers/toggleDealCampaignStatus";
import { deleteDealCampaign } from "../helpers/deleteDealCampaign";

const getScopeBadge = (applyTo) => {
  switch (applyTo) {
    case "SPECIFIC_PRODUCTS":
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 border-blue-200 dark:border-blue-800/40 gap-1.5 font-medium px-2.5 py-0.5 rounded-full"
        >
          <Package className="size-3 text-blue-600 dark:text-blue-400" />
          <span>Specific Products</span>
        </Badge>
      );
    case "BY_BRAND":
      return (
        <Badge
          variant="outline"
          className="bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300 border-purple-200 dark:border-purple-800/40 gap-1.5 font-medium px-2.5 py-0.5 rounded-full"
        >
          <Store className="size-3 text-purple-600 dark:text-purple-400" />
          <span>By Brand</span>
        </Badge>
      );
    case "BY_CATEGORY":
      return (
        <Badge
          variant="outline"
          className="bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border-amber-200 dark:border-amber-800/40 gap-1.5 font-medium px-2.5 py-0.5 rounded-full"
        >
          <Grid className="size-3 text-amber-600 dark:text-amber-400" />
          <span>By Category</span>
        </Badge>
      );
    case "ALL_PRODUCTS":
    default:
      return (
        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40 gap-1.5 font-semibold px-2.5 py-0.5 rounded-full"
        >
          <Globe className="size-3 text-emerald-600 dark:text-emerald-400" />
          <span>All Products (Storewide)</span>
        </Badge>
      );
  }
};

const renderTargetPreview = (row) => {
  const applyTo = row?.apply_to || "ALL_PRODUCTS";

  if (applyTo === "ALL_PRODUCTS") {
    return (
      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
        <Globe className="size-3.5" /> Entire Store Catalog
      </span>
    );
  }

  if (applyTo === "SPECIFIC_PRODUCTS") {
    const products = Array.isArray(row?.product_ids) ? row.product_ids : [];
    const count = products.length;

    if (count === 0) return <span className="text-xs text-muted-foreground italic">No products</span>;

    const previewNames = products.map((p) => (typeof p === "object" ? p.name : "Product")).join(", ");

    return (
      <div className="flex items-center gap-2 max-w-[240px]" title={previewNames}>
        <div className="flex -space-x-2 shrink-0">
          {products.slice(0, 3).map((p, idx) => {
            const img = typeof p === "object" ? p.banner_image || p.images?.[0] : null;
            return img ? (
              <img
                key={typeof p === "object" ? p._id : idx}
                src={img}
                alt={typeof p === "object" ? p.name : "Product"}
                className="size-7 rounded-full border-2 border-background object-cover"
              />
            ) : (
              <div
                key={typeof p === "object" ? p._id : idx}
                className="size-7 rounded-full border-2 border-background bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold"
              >
                <Package className="size-3.5" />
              </div>
            );
          })}
        </div>
        <span className="text-xs font-semibold text-foreground">
          {count} {count === 1 ? "Product" : "Products"}
        </span>
      </div>
    );
  }

  if (applyTo === "BY_BRAND") {
    const brands = Array.isArray(row?.brand_ids) ? row.brand_ids : [];
    const count = brands.length;
    if (count === 0) return <span className="text-xs text-muted-foreground italic">No brands</span>;

    const brandNames = brands.map((b) => (typeof b === "object" ? b.name : "Brand")).join(", ");

    return (
      <div className="flex items-center gap-1.5 max-w-[220px]" title={brandNames}>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-semibold border border-purple-200 dark:border-purple-800">
          <Store className="size-3" />
          <span>{count} {count === 1 ? "Brand" : "Brands"}</span>
        </span>
        <span className="text-xs text-muted-foreground truncate">{brandNames}</span>
      </div>
    );
  }

  if (applyTo === "BY_CATEGORY") {
    const categories = Array.isArray(row?.category_ids) ? row.category_ids : [];
    const count = categories.length;
    if (count === 0) return <span className="text-xs text-muted-foreground italic">No categories</span>;

    const catNames = categories.map((c) => (typeof c === "object" ? c.name : "Category")).join(", ");

    return (
      <div className="flex items-center gap-1.5 max-w-[220px]" title={catNames}>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-200 dark:border-amber-800">
          <Grid className="size-3" />
          <span>{count} {count === 1 ? "Category" : "Categories"}</span>
        </span>
        <span className="text-xs text-muted-foreground truncate">{catNames}</span>
      </div>
    );
  }

  return <span className="text-xs text-muted-foreground">—</span>;
};

const DealCampaignsTable = ({
  campaigns = [],
  isLoading,
  error,
  params,
  setParams,
  total = 0,
  totalPages = 1,
  onEditCampaign,
}) => {
  const queryClient = useQueryClient();
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // Delete Mutation
  const { mutate: deleteMutation, isPending: isDeleting } = useMutation({
    mutationFn: deleteDealCampaign,
    onSuccess: (res) => {
      if (res?.response?.success || res?.success || res?.response?.statusCode === 200) {
        toast.success("Deal campaign deleted successfully.");
        queryClient.invalidateQueries({ queryKey: ["deal-campaigns"] });
        setOpenDelete(false);
        setSelectedCampaign(null);
      } else {
        toast.error(res?.response?.message || res?.message || "Failed to delete campaign.");
      }
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "An error occurred while deleting.");
    },
  });

  // Toggle Status Mutation
  const { mutate: toggleStatusMutation } = useMutation({
    mutationFn: toggleDealCampaignStatus,
    onMutate: (id) => {
      setTogglingId(id);
    },
    onSuccess: (res) => {
      setTogglingId(null);
      if (res?.response?.success || res?.success || res?.response?.statusCode === 200) {
        const nextStatus = res?.response?.data?.is_active ?? res?.data?.is_active;
        toast.success(
          nextStatus !== undefined
            ? nextStatus
              ? "Campaign activated!"
              : "Campaign paused/deactivated."
            : "Campaign status updated."
        );
        queryClient.invalidateQueries({ queryKey: ["deal-campaigns"] });
      } else {
        toast.error(res?.response?.message || res?.message || "Failed to toggle status.");
      }
    },
    onError: (err) => {
      setTogglingId(null);
      toast.error(err?.response?.data?.message || "Failed to toggle campaign status.");
    },
  });

  const handleToggleStatus = (campaign) => {
    toggleStatusMutation(campaign._id);
  };

  const handleOpenDelete = (campaign) => {
    setSelectedCampaign(campaign);
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
      key: "title",
      label: "Campaign Title",
      render: (value, row) => {
        const createdDate = row.createdAt ? format(new Date(row.createdAt), "dd MMM yyyy") : "";
        return (
          <div className="flex items-start gap-3 py-1">
            <div className="size-9 rounded-lg bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 mt-0.5">
              <Flame className="size-5 fill-current" />
            </div>
            <div className="flex flex-col min-w-0">
              <Typography variant="p" className="font-bold text-foreground text-sm leading-tight">
                {value || "Deal Campaign"}
              </Typography>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
                {createdDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3" /> Created {createdDate}
                  </span>
                )}
                {row.created_by?.name && (
                  <span>by {row.created_by.name}</span>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "sale_end_time",
      label: "Sale End & Countdown",
      render: (value, row) => {
        if (!value) return <span className="text-muted-foreground text-xs">—</span>;
        const formattedDate = format(new Date(value), "dd MMM yyyy, hh:mm a");
        return (
          <div className="flex flex-col gap-1.5 py-1">
            <CountdownBadge endTime={value} isActive={row.is_active} />
            <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
              <Clock className="size-3" /> {formattedDate}
            </span>
          </div>
        );
      },
    },
    {
      key: "apply_to",
      label: "Target Scope",
      render: (value) => getScopeBadge(value),
    },
    {
      key: "target_preview",
      label: "Applied Items",
      render: (_, row) => renderTargetPreview(row),
    },
    {
      key: "is_active",
      label: "Active Status",
      render: (value, row) => {
        const isToggling = togglingId === row._id;
        return (
          <div className="flex items-center gap-2.5">
            <Switch
              checked={Boolean(value)}
              disabled={isToggling}
              onCheckedChange={() => handleToggleStatus(row)}
              aria-label="Toggle campaign status"
            />
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                value
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {value ? "Active" : "Paused"}
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
              label: "Edit Campaign",
              icon: Pencil,
              action: () => onEditCampaign(row),
            },
            {
              label: "Delete Campaign",
              icon: Trash2,
              action: () => handleOpenDelete(row),
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
        data={campaigns}
        isLoading={isLoading}
        error={error}
        perPage={params.per_page}
        currentPage={params.page || 1}
        totalPages={totalPages}
        onPageChange={onPageChange}
        emptyStateMessage="No deal campaigns found. Click 'Create Deal Campaign' above to start one."
      />

      {/* Delete Confirmation Dialog */}
      <CustomDialog
        onOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        title={selectedCampaign?.title ? `campaign "${selectedCampaign.title}"` : "this campaign"}
        modalType="Delete"
        onDelete={handleDelete}
        id={selectedCampaign?._id}
        isLoading={isDeleting}
      />
    </>
  );
};

export default DealCampaignsTable;
