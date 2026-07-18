import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { Pencil, Trash2, Eye } from "lucide-react";
import CustomTable from "@/components/custom_table";
import Typography from "@/components/typography";
import ActionMenu from "@/components/action_menu";
import { CustomDialog } from "@/components/custom_dialog";
import { fetchShipmentZones } from "../helpers/fetchShipmentZones";
import { deleteShipmentZone } from "../helpers/deleteShipmentZone";

const ShipmentZonesTable = ({ setShipmentZoneLength, params }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: shipmentZones = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["shipment-zones", params],
    queryFn: () => fetchShipmentZones({ params }),
    select: (data) => {
      return data?.response?.data?.zones || data?.data?.zones || [];
    },
  });

  const [openDelete, setOpenDelete] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);

  const handleOpenDialog = (zone) => {
    setOpenDelete(true);
    setSelectedZone(zone);
  };

  const handleCloseDialog = () => {
    setOpenDelete(false);
    setSelectedZone(null);
  };

  const { mutate: deleteZoneMutation, isLoading: isDeleting } = useMutation({
    mutationFn: deleteShipmentZone,
    onSuccess: (res) => {
      if (res?.response?.success || res?.success) {
        toast.success(res?.response?.message || res?.message || "Shipment zone deleted successfully.");
        queryClient.invalidateQueries(["shipment-zones"]);
        handleCloseDialog();
      } else {
        toast.error(res?.response?.message || res?.message || "Failed to delete shipment zone.");
      }
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
          "An error occurred while deleting the shipment zone."
      );
    },
  });

  const handleDeleteZone = (id) => {
    deleteZoneMutation(id);
  };

  const onEditZone = (zone) => {
    navigate(`/dashboard/shipment-zones/edit/${zone._id}`);
  };

  const onNavigateDetail = (zone) => {
    navigate(`/dashboard/shipment-zones/${zone._id}`);
  };

  useEffect(() => {
    setShipmentZoneLength(shipmentZones?.length || 0);
  }, [shipmentZones]);

  const formatPincodes = (pincodes) => {
    if (!pincodes || pincodes.length === 0) return "—";
    if (pincodes.length <= 3) {
      return pincodes.join(", ");
    }
    return `${pincodes.slice(0, 3).join(", ")} +${pincodes.length - 3} more`;
  };

  const formatPricing = (zone) => {
    if (zone.pricing_type === "free") {
      return "Free";
    } else if (zone.pricing_type === "flat_rate") {
      return `₹${zone.price || zone.price_per_unit || 0}${zone.weight_unit_grams ? ` / ${zone.weight_unit_grams}g` : ""}`;
    } else if (zone.pricing_type === "fixed_rate") {
      return `₹${zone.fixed_amount || 0} (Fixed)`;
    }
    return "—";
  };

  const columns = [
    {
      key: "zone_name",
      label: "Zone Name",
      render: (value) => (
        <Typography variant="p" className="font-medium capitalize">
          {value}
        </Typography>
      ),
    },
    {
      key: "pincodes",
      label: "Pincodes",
      render: (value) => (
        <span className="text-sm max-w-[20vw] break-words whitespace-normal">
          {formatPincodes(value)}
        </span>
      ),
    },
    {
      key: "pricing_type",
      label: "Pricing",
      render: (value, row) => (
        <div>
          <span className="text-sm font-medium capitalize">
            {value?.replace("_", " ")}
          </span>
          <div
            className={`text-sm ${
              row.pricing_type === "free"
                ? "font-medium text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground"
            }`}
          >
            {formatPricing(row)}
          </div>
        </div>
      ),
    },
    {
      key: "is_default",
      label: "Default",
      render: (value) => (
        <span
          className={`rounded-full px-2 py-1 text-sm ${
            value
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {value ? "Yes" : "No"}
        </span>
      ),
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
      key: "description",
      label: "Description",
      render: (value) => (
        <span className="text-sm max-w-[25vw] break-words whitespace-normal">
          {value || "—"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (value, row) => (
        <div>
          <Typography>
            {format(new Date(value), "dd/MM/yyyy hh:mm a")}
          </Typography>
          {value !== row.updatedAt && (
            <Typography className="text-muted-foreground text-sm">
              Updated{" "}
              {formatDistanceToNow(new Date(row.updatedAt), {
                addSuffix: true,
              })}
            </Typography>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <ActionMenu
          options={[
            {
              label: "View Details",
              icon: Eye,
              action: () => onNavigateDetail(row),
            },
            {
              label: "Edit Zone",
              icon: Pencil,
              action: () => onEditZone(row),
            },
            {
              label: "Delete Zone",
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
        data={shipmentZones}
        isLoading={isLoading}
        error={error}
        emptyStateMessage="No shipment zones available"
      />

      <CustomDialog
        onOpen={openDelete}
        onClose={handleCloseDialog}
        title={`Delete shipment zone "${selectedZone?.zone_name}"?`}
        description="This will permanently remove the shipment zone and cannot be undone."
        modalType="Delete"
        onDelete={handleDeleteZone}
        id={selectedZone?._id}
        isLoading={isDeleting}
      />
    </>
  );
};

export default ShipmentZonesTable;
