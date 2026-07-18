import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import ActionMenu from "@/components/action_menu";
import { Eye, Pencil, Trash2 } from "lucide-react";
import CustomTable from "@/components/custom_table";
import Typography from "@/components/typography";
import { useEffect, useState } from "react";
import { CustomDialog } from "@/components/custom_dialog";
import { toast } from "sonner";

import { useNavigate } from "react-router";
import { fetchUsers } from "../helpers/fetchUsers";
import { deleteUser } from "../helpers/deleteUser";

const UsersTable = ({ setUsersLength, params, setParams }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    data: usersRes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["users", params],
    queryFn: () => fetchUsers({ params }),
  });

  const users = usersRes?.data;
  const totalUsers = usersRes?.total;

  const [openDelete, setOpenDelete] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const handleOpenDialog = (user) => {
    setOpenDelete(true);
    setSelectedUser(user);
  };

  const handleCloseDialog = () => {
    setOpenDelete(false);
    setSelectedUser(null);
  };

  const { mutate: deleteUserMutation, isLoading: isDeleting } = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      toast.success("User deleted successfully.");
      queryClient.invalidateQueries(["users"]);
      handleCloseDialog();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to delete user.");
    },
  });

  const handleDeleteUser = (id) => {
    deleteUserMutation(id);
  };

  const onNavigateToEdit = (id) => {
    navigate(`/dashboard/users/edit/${id}`);
  };

  const onNavigateToView = (id) => {
    navigate(`/dashboard/users/${id}`);
  };

  useEffect(() => {
    setUsersLength(totalUsers);
  }, [totalUsers]);

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (value, row) => (
        <div className="flex flex-col gap-1">
          <Typography variant="p" className="font-medium">
            {row.name}
          </Typography>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      render: (value, row) => (
        <div className="flex flex-col gap-1">
          <Typography variant="p" className="text-muted-foreground">
            {row.email}
          </Typography>
        </div>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      render: (value, row) => (
        <div className="flex flex-col gap-1">
          <Typography variant="p" className="text-muted-foreground">
            {row.phone || "N/A"}
          </Typography>
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "Created at",
      render: (value, row) => (
        <div className="flex flex-col gap-1">
          <Typography>
            {format(new Date(value), "dd/MM/yyyy hh:mm a")}
          </Typography>
          {value !== row.updatedAt && (
            <Typography className="text-muted-foreground text-sm">
              Last updated -{" "}
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
              label: "View User Details",
              icon: Eye,
              action: () => onNavigateToView(row._id),
            },
            {
              label: "Edit User",
              icon: Pencil,
              action: () => onNavigateToEdit(row._id),
            },
            {
              label: "Delete User",
              icon: Trash2,
              action: () => handleOpenDialog(row),
              className: "text-destructive",
            },
          ]}
        />
      ),
    },
  ];

  const onPageChange = (page) => {
    setParams((prev) => ({
      ...prev,
      page: page + 1,
    }));
  };

  const perPage = params.per_page;
  const currentPage = params.page;
  const totalPages = Math.ceil(totalUsers / perPage);

  return (
    <>
      <CustomTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        error={error}
        emptyStateMessage="No users found"
        perPage={perPage}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />

      <CustomDialog
        onOpen={openDelete}
        onClose={handleCloseDialog}
        title={selectedUser?.name}
        modalType="Delete"
        onDelete={handleDeleteUser}
        id={selectedUser?._id}
        isLoading={isDeleting}
      />
    </>
  );
};

export default UsersTable; 