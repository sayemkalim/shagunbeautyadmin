import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { Pencil, Trash2 } from "lucide-react";
import CustomTable from "@/components/custom_table";
import Typography from "@/components/typography";
import ActionMenu from "@/components/action_menu";
import { CustomDialog } from "@/components/custom_dialog";
import { fetchMarquees } from "../helpers/fetchMarquees";
import { deleteMarquee } from "../helpers/deleteMarquee";
import dayjs from "dayjs";

const MarqueeTable = ({ setMarqueesLength, params, setParams }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: apiMarqueesResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["marquees", params],
    queryFn: () => fetchMarquees({ params }),
  });

  const marqueeData = apiMarqueesResponse?.response?.data || apiMarqueesResponse?.data;
  const marquees = useMemo(() => {
    const list = marqueeData?.marquees || [];
    return [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [marqueeData]);
  const total = marqueeData?.total || 0;
  const totalPages = marqueeData?.total_pages || 1;
  const currentPage = params.page || 1;

  const [openDelete, setOpenDelete] = useState(false);
  const [selectedMarquee, setSelectedMarquee] = useState(null);

  const handleOpenDialog = (marquee) => {
    setOpenDelete(true);
    setSelectedMarquee(marquee);
  };

  const handleCloseDialog = () => {
    setOpenDelete(false);
    setSelectedMarquee(null);
  };

  const { mutate: deleteMarqueeMutation, isPending: isDeleting } = useMutation({
    mutationFn: deleteMarquee,
    onSuccess: (res) => {
      if (res?.response?.success || res?.success) {
        toast.success(res?.response?.message || res?.message || "Marquee deleted successfully.");
        queryClient.invalidateQueries(["marquees"]);
        handleCloseDialog();
      } else {
        toast.error(res?.response?.message || res?.message || "Failed to delete marquee.");
      }
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
          "An error occurred while deleting the marquee."
      );
    },
  });

  const handleDeleteMarquee = (id) => {
    deleteMarqueeMutation(id);
  };

  const onEditMarquee = (marquee) => {
    navigate(`/dashboard/marquee/edit/${marquee._id}`);
  };

  const onPageChange = (page) => {
    setParams((prev) => ({
      ...prev,
      page,
    }));
  };

  useEffect(() => {
    setMarqueesLength(total || marquees?.length || 0);
  }, [total, marquees, setMarqueesLength]);

  const columns = [
    {
      key: "text",
      label: "Text",
      render: (value) => (
        <Typography variant="p" className="font-medium text-sm">
          {value}
        </Typography>
      ),
    },
    {
      key: "is_active",
      label: "Status",
      render: (value) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
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
      key: "createdAt",
      label: "Created Date",
      render: (value) => (
        <span className="text-xs text-muted-foreground">
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
              label: "Edit Marquee",
              icon: Pencil,
              action: () => onEditMarquee(row),
            },
            {
              label: "Delete Marquee",
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
        data={marquees}
        isLoading={isLoading}
        error={error}
        perPage={params.per_page}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        emptyStateMessage="No marquee texts available"
      />

      <CustomDialog
        onOpen={openDelete}
        onClose={handleCloseDialog}
        title={`marquee text "${selectedMarquee?.text || ""}"`}
        modalType="Delete"
        onDelete={handleDeleteMarquee}
        id={selectedMarquee?._id}
        isLoading={isDeleting}
      />
    </>
  );
};

export default MarqueeTable;
