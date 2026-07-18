import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import ActionMenu from "@/components/action_menu";
import { Trash2 } from "lucide-react";
import CustomTable from "@/components/custom_table";
import Typography from "@/components/typography";
import { useEffect, useState } from "react";
import { CustomDialog } from "@/components/custom_dialog";
import { toast } from "sonner";
import { fetchContacts } from "../helpers/fetchContacts";
import { deleteContacts } from "../helpers/deleteContacts";

const ContactUsTable = ({ setContactUsLength, params, setParams }) => {
  const queryClient = useQueryClient();

  const {
    data: apiContactsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["contacts", params],
    queryFn: () => fetchContacts({ params }),
  });

  const [openDelete, setOpenDelete] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  const onOpenDialog = (row) => {
    setOpenDelete(true);
    setSelectedContact(row);
  };

  const onCloseDialog = () => {
    setOpenDelete(false);
    setSelectedContact(null);
  };

  const { mutate: deleteContactMutation, isLoading: isDeleting } = useMutation({
    mutationFn: deleteContacts,
    onSuccess: () => {
      toast.success("Contact deleted successfully.");
      queryClient.invalidateQueries(["contacts"]);
      onCloseDialog();
    },
    onError: () => {
      toast.error("Failed to delete contact.");
    },
  });

  const onDeleteClick = (id) => {
    deleteContactMutation(id);
  };

  const contacts = Array.isArray(apiContactsResponse?.response?.data?.data)
    ? apiContactsResponse?.response?.data?.data
    : [];
  const contactsTotal = apiContactsResponse?.response?.data?.total;

  useEffect(() => {
    setContactUsLength(contacts?.length);
  }, [contacts, setContactUsLength]);

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    {
      key: "subject",
      label: "Subject",
      render: (value) => (
        <Typography className="text-muted-foreground line-clamp-1">{value}</Typography>
      ),
    },
    // {
    //   key: "message",
    //   label: "Message",
    //   render: (value) => (
    //     <Typography className="line-clamp-2 text-gray-500">{value}</Typography>
    //   ),
    // },
    {
      key: "createdAt",
      label: "Received At",
      render: (value) => (
        <div className="flex flex-col gap-1">
          <Typography>
            {format(new Date(value), "dd/MM/yyyy hh:mm a")}
          </Typography>
          <Typography className="text-muted-foreground text-sm">
            {formatDistanceToNow(new Date(value), { addSuffix: true })}
          </Typography>
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (value, row) => (
        <ActionMenu
          options={[
            // {
            //   label: "View Details",
            //   icon: Eye,
            //   action: () => console.log("Viewing", row),
            // },
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

  const onPageChange = (page) => {
    setParams((prev) => ({
      ...prev,
      page: page + 1,
    }));
  };

  const perPage = params.per_page;
  const currentPage = params.page;
  const totalPages = Math.ceil(contactsTotal / perPage);

  return (
    <>
      <CustomTable
        columns={columns}
        data={contacts || []}
        isLoading={isLoading}
        error={error}
        perPage={perPage}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
      <CustomDialog
        onOpen={openDelete}
        onClose={onCloseDialog}
        title={`Delete Contact: ${selectedContact?.name}`}
        modalType="Delete"
        onDelete={onDeleteClick}
        id={selectedContact?._id}
        isLoading={isDeleting}
      />
    </>
  );
};

export default ContactUsTable;
