import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import ActionMenu from "@/components/action_menu";
import { Eye, Pencil, Trash2 } from "lucide-react";
import CustomTable from "@/components/custom_table";
import Typography from "@/components/typography";
import { CustomDialog } from "@/components/custom_dialog";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { deleteCategory } from "../helpers/deleteCategory";
import { fetchCategory } from "../helpers/fetchCategory";

const CategoryTable = ({ setCategoryLength, params, setParams }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: apicategorysResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["category", params],
    queryFn: () => fetchCategory({ params }),
  });

  const [openDelete, setOpenDelete] = useState(false);
  const [categoryData, setcategoryData] = useState(null);

  const onOpenDialog = (row) => {
    setOpenDelete(true);
    setcategoryData(row);
  };

  const onCloseDialog = () => {
    setOpenDelete(false);
    setcategoryData(null);
  };

  const onPageChange = (page) => {
    setParams((prev) => ({
      ...prev,
      page,
    }));
    // window.scrollTo(0, 0);
  };

  const { mutate: deleteProuductsMutation, isLoading: isDeleting } =
    useMutation({
      mutationFn: deleteCategory,
      onSuccess: () => {
        toast.success("Category deleted successfully.");
        queryClient.invalidateQueries(["categorys"]);
        onCloseDialog();
      },
      onError: (error) => {
        console.error(error);
        toast.error("Failed to delete category.");
      },
    });

  const onDeleteClick = (id) => {
    deleteProuductsMutation(id);
  };
  const categorys = apicategorysResponse?.data?.categories || [];
  const total = apicategorysResponse?.data?.total || 0;

  const onNavigateToEdit = (category) => {
    navigate(`/dashboard/category/edit/${category._id}`);
  };

  const onNavigateDetails = (category) => {
    navigate(`/dashboard/category/${category._id}`);
  };

  const onNavigateInventoryHistory = (category) => {
    navigate(`/dashboard/categorys/inventory-history/${category._id}`);
  };

  useEffect(() => {
    setCategoryLength(categorys?.length);
  }, [categorys, setCategoryLength]);

  const perPage = params.per_page;
  const totalPages = Math.ceil(total / perPage);
  const currentPage = params.page;

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <img
            src={
              row.banner_image ||
              row.images?.[0] ||
              "https://placehold.co/64x64?text=No+Image&font=roboto"
            }
            alt={value}
            className="bg-muted border-border h-14 w-14 shrink-0 rounded-lg border object-contain p-1"
          />
          <Typography variant="p" className="w-[15rem] text-wrap font-medium">
            {value}
          </Typography>
        </div>
      ),
    },
    // {
    //   key: "small_description",
    //   label: "Short Description",
    //   render: (value) => (
    //     <Typography variant="p" className="text-sm w-[20rem] text-wrap line-clamp-2">
    //       {value}
    //     </Typography>
    //   ),
    // },
    // {
    //   key: "price",
    //   label: "Price",
    //   render: (value) => `₹${value}`,
    // },
    // {
    //   key: "discounted_price",
    //   label: "Discounted Price",
    //   render: (value) => `₹${value}`,
    // },
    {
      key: "description",
      label: "Description",
      render: (value) => (
        <Typography variant="p" className="text-sm w-[20rem] text-wrap line-clamp-3">
          {value}
        </Typography>
      ),
    },
    {
      key: "newly_launched",
      label: " Newly Launched",
      render: (value) => (value ? "Yes" : "No"),
    },

    // {
    //   key: "category_type",
    //   label: "category type",
    //   render: (value) => {
    //     let bg = "bg-blue-100";
    //     let text = "text-blue-700";
    //     if (value === "service") {
    //       bg = "bg-purple-100";
    //       text = "text-purple-700";
    //     } else if (value === "category") {
    //       bg = "bg-blue-100";
    //       text = "text-blue-700";
    //     }
    //     return (
    //       <span
    //         className={`inline-block px-2 py-1 rounded-full ${bg} ${text} text-xs font-medium`}
    //       >
    //         {value ? value.charAt(0).toUpperCase() + value.slice(1) : "-"}
    //       </span>
    //     );
    //   },
    // },
    // {
    //   key: "is_active",
    //   label: "Status",
    //   render: (value) => (
    //     <span
    //       className={`px-2 py-1 rounded-full text-sm ${
    //         value ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
    //       }`}
    //     >
    //       {value ? "Active" : "Inactive"}
    //     </span>
    //   ),
    // },
    {
      key: "createdAt",
      label: "Created At",
      render: (value, row) => (
        <div className="flex flex-col gap-1">
          <Typography>
            {format(new Date(value), "dd/MM/yyyy hh:mm a")}
          </Typography>
          {value !== row.updatedAt && (
            <Typography className="text-muted-foreground text-sm">
              Updated -{" "}
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
      render: (value, row) => (
        <ActionMenu
          options={[
            {
              label: "View Details",
              icon: Eye,
              action: () => onNavigateDetails(row),
            },
            {
              label: "Edit",
              icon: Pencil,
              action: () => onNavigateToEdit(row),
            },
            {
              label: "Delete",
              icon: Trash2,
              action: () => onOpenDialog(row),
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
        data={categorys || []}
        isLoading={isLoading}
        error={error}
        totalPages={totalPages}
        currentPage={currentPage}
        perPage={perPage}
        onPageChange={onPageChange}
      />
      <CustomDialog
        onOpen={openDelete}
        onClose={onCloseDialog}
        title={categoryData?.name}
        modalType="Delete"
        onDelete={onDeleteClick}
        id={categoryData?._id}
        isLoading={isDeleting}
      />
    </>
  );
};

export default CategoryTable;
