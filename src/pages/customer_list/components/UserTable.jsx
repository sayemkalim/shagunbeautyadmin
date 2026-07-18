import { useQuery } from "@tanstack/react-query";
import CustomTable from "@/components/custom_table";
import Typography from "@/components/typography";
import { format } from "date-fns";
import { useEffect } from "react";
import { fetchUsers } from "../helpers/fetchUsers";
import { useNavigate } from "react-router";

const UsersTable = ({ setUsersLength, params }) => {
  const navigate = useNavigate();
  const {
    data: users,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["users", params],
    queryFn: () => fetchUsers({ params }),
  });

  useEffect(() => {
    setUsersLength(users?.length);
  }, [users]);

  const handleRowClick = (row) => {
    navigate(`/dashboard/customer_list/details/${row._id}`); 
  };
  

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (value) => (
        <Typography variant="p" className="font-medium">
          {value}
        </Typography>
      ),
    },
    {
      key: "number",
      label: "Phone",
      render: (value) => (
        <Typography className="text-muted-foreground">{value}</Typography>
      ),
    },
    {
      key: "city",
      label: "City",
      render: (value) => (
        <Typography className="text-muted-foreground">{value || "N/A"}</Typography>
      ),
    },
    {
      key: "email",
      label: "Email",
      render: (value) => (
        <Typography className="text-muted-foreground">{value}</Typography>
      ),
    },
    {
      key: "address",
      label: "Address",
      render: (value) => (
        <Typography className="text-muted-foreground">{value}</Typography>
      ),
    },
    {
      key: "gender",
      label: "Gender",
      render: (value) => (
        <span className="bg-muted text-foreground rounded-full px-3 py-1 text-sm capitalize">
          {value}
        </span>
      ),
    },
    {
      key: "dob",
      label: "DOB",
      render: (value) => (
        <Typography>
          {value ? format(new Date(value), "dd/MM/yyyy") : "N/A"}
        </Typography>
      ),
    },
  ];

  return (
    <CustomTable
      columns={columns}
      data={users}
      isLoading={isLoading}
      error={error}
      emptyStateMessage="No users found"
      onRowClick={handleRowClick}
    />
  );
};

export default UsersTable;
