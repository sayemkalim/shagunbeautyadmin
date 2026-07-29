import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { Pencil, Trash2 } from "lucide-react";
import CustomTable from "@/components/custom_table";
import Typography from "@/components/typography";
import ActionMenu from "@/components/action_menu";
import { CustomDialog } from "@/components/custom_dialog";
import { fetchCoupons } from "../helpers/fetchCoupons";
import { deleteCoupon } from "../helpers/deleteCoupon";

const formatDiscount = (coupon) => {
  if (coupon.discount_type === "percentage") {
    return `${coupon.discount_value}% off`;
  }
  return `₹${coupon.discount_value} off`;
};

const formatMinOrder = (value) => {
  if (!value || value <= 0) return "None";
  return `₹${value}`;
};

const formatUsage = (coupon) => {
  const limit =
    coupon.usage_limit_total === null || coupon.usage_limit_total === undefined
      ? "∞"
      : coupon.usage_limit_total;
  return `${coupon.used_count || 0} / ${limit}`;
};

const formatValidity = (coupon) => {
  const from = coupon.valid_from
    ? format(new Date(coupon.valid_from), "dd/MM/yyyy")
    : "—";
  if (!coupon.valid_until) {
    return `${from} – No expiry`;
  }
  const until = format(new Date(coupon.valid_until), "dd/MM/yyyy");
  return `${from} – ${until}`;
};

const CouponsTable = ({ setCouponsLength, params, setParams }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: apiCouponsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["coupons", params],
    queryFn: () => fetchCoupons({ params }),
  });

  const couponData = apiCouponsResponse?.response?.data || apiCouponsResponse?.data;
  const coupons = useMemo(() => couponData?.coupons || [], [couponData]);
  const total = couponData?.total || 0;
  const totalPages = couponData?.total_pages || 1;
  const currentPage = params.page || 1;

  const [openDelete, setOpenDelete] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  const handleOpenDialog = (coupon) => {
    setOpenDelete(true);
    setSelectedCoupon(coupon);
  };

  const handleCloseDialog = () => {
    setOpenDelete(false);
    setSelectedCoupon(null);
  };

  const { mutate: deleteCouponMutation, isLoading: isDeleting } = useMutation({
    mutationFn: deleteCoupon,
    onSuccess: (res) => {
      if (res?.response?.success || res?.success) {
        toast.success(res?.response?.message || res?.message || "Coupon deleted successfully.");
        queryClient.invalidateQueries(["coupons"]);
        handleCloseDialog();
      } else {
        toast.error(res?.response?.message || res?.message || "Failed to delete coupon.");
      }
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
          "An error occurred while deleting the coupon."
      );
    },
  });

  const handleDeleteCoupon = (id) => {
    deleteCouponMutation(id);
  };

  const onEditCoupon = (coupon) => {
    navigate(`/dashboard/coupons/edit/${coupon._id}`);
  };

  const onPageChange = (page) => {
    setParams((prev) => ({
      ...prev,
      page,
    }));
  };

  useEffect(() => {
    setCouponsLength(total || coupons?.length || 0);
  }, [total, coupons]);

  const columns = [
    {
      key: "code",
      label: "Code",
      render: (value) => (
        <Typography variant="p" className="font-mono font-medium">
          {value}
        </Typography>
      ),
    },
    {
      key: "discount_value",
      label: "Type / Value",
      render: (_, row) => (
        <div>
          <span className="text-sm font-medium">{formatDiscount(row)}</span>
          {row.discount_type === "percentage" && row.max_discount_amount ? (
            <div className="text-muted-foreground text-sm">
              Capped at ₹{row.max_discount_amount}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: "min_order_value",
      label: "Min Order",
      render: (value) => <span className="text-sm">{formatMinOrder(value)}</span>,
    },
    {
      key: "used_count",
      label: "Usage",
      render: (_, row) => <span className="text-sm">{formatUsage(row)}</span>,
    },
    {
      key: "valid_from",
      label: "Valid From – Until",
      render: (_, row) => <span className="text-sm">{formatValidity(row)}</span>,
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
              label: "Edit Coupon",
              icon: Pencil,
              action: () => onEditCoupon(row),
            },
            {
              label: "Delete Coupon",
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
        data={coupons}
        isLoading={isLoading}
        error={error}
        perPage={params.per_page}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        emptyStateMessage="No coupons available"
      />

      <CustomDialog
        onOpen={openDelete}
        onClose={handleCloseDialog}
        title={`coupon "${selectedCoupon?.code}"`}
        modalType="Delete"
        onDelete={handleDeleteCoupon}
        id={selectedCoupon?._id}
        isLoading={isDeleting}
      />
    </>
  );
};

export default CouponsTable;
