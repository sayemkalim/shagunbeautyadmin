import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { Pencil, Trash2,Eye } from "lucide-react";
import CustomTable from "@/components/custom_table";
import Typography from "@/components/typography";
import ActionMenu from "@/components/action_menu";
import { CustomDialog } from "@/components/custom_dialog";
import { fetchBrand } from "../helpers/fetchBrand";
import { deleteBrand } from "../helpers/deleteBrand";
;

const BrandsTable = ({ setBrandsLength, params }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: brands = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["brands", params],
    queryFn: () => fetchBrand({ params }),
    select: (data) => data?.response?.data?.brands,
    });

  const [openDelete, setOpenDelete] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);

  const handleOpenDialog = (brand) => {
    setOpenDelete(true);
    setSelectedBrand(brand);
  };

  const handleCloseDialog = () => {
    setOpenDelete(false);
    setSelectedBrand(null);
  };

  const { mutate: deleteBrandMutation ,isLoading: isDeleting } = useMutation({
    mutationFn: deleteBrand,
    onSuccess: (res) => {
      if (res?.success) {
        toast.success(res.message || "Brand deleted successfully.");
        queryClient.invalidateQueries(["brands"]);
        handleCloseDialog();
      } else {
        toast.error(res?.message || "Failed to delete brand.");
      }
    },    
    onError: (error) => {
      toast.error(error?.response?.data?.message || "An error occurred while deleting the brand.");
    },
  });
  

  const handleDeleteBrand = (id) => {
    deleteBrandMutation(id);
  };

  const onEditBrand = (brand) => {
    navigate(`/dashboard/brands/edit/${brand._id}`);
  };
  const onNavigateDetail = (brand) => {
    navigate(`/dashboard/brands/${brand._id}`);
    };
  useEffect(() => {
    setBrandsLength(brands?.length || 0);
  }, [brands]);

  const columns = [
    // {
    //   key: "logo_url",
    //   label: "Logo",
    //   render: (value) =>
    //     value ? (
    //       <img
    //         src={value}
    //         alt="Brand Logo"
    //         className="w-10 h-10 object-contain rounded"
    //       />
    //     ) : (
    //       <Typography variant="p" className="text-gray-400 italic">
    //         No Logo
    //       </Typography>
    //     ),
    // },
    {
      key: "name",
      label: "Name",
      render: (value) => (
        <Typography variant="p" className="font-medium capitalize">
          {value}
        </Typography>
      ),
    },
    {
      key: "description",
      label: "Description",
      render: (value) => (
        <span className="text-sm max-w-[20vw] break-words whitespace-normal">
          {value || "—"}
        </span>
      ),
    },
    // {
    //   key: "website",
    //   label: "Website",
    //   render: (value) =>
    //     value ? (
    //       <a
    //         href={value}
    //         target="_blank"
    //         rel="noopener noreferrer"
    //         className="text-blue-600 underline text-sm"
    //       >
    //         {value}
    //       </a>
    //     ) : (
    //       <span className="text-gray-400">—</span>
    //     ),
    // },
    {
      key: "is_active",
      label: "Status",
      render: (value) => (
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${
            value
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {value ? "Active" : "Inactive"}
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
            // {
            //   label: "View Details",
            //   icon: Eye,
            //   action: () => onNavigateDetail(row),
            // },
            
            {
              label: "Edit Brand",
              icon: Pencil,
              action: () => onEditBrand(row),
            },
            {
              label: "Delete Brand",
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
        data={brands}
        isLoading={isLoading}
        error={error}
        emptyStateMessage="No brands available"
      />

      <CustomDialog
        onOpen={openDelete}
        onClose={handleCloseDialog}
        title={`Delete brand "${selectedBrand?.name}"?`}
        description="This will permanently remove the brand and cannot be undone."
        modalType="Delete"
        onDelete={handleDeleteBrand}
        id={selectedBrand?._id}
        isLoading={isDeleting} 
          />
    </>
  );
};

export default BrandsTable;
