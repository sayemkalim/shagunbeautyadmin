import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import NavbarItem from "@/components/navbar/navbar_item";
import UserEditorCard from "./UserEditorCard";
import { fetchUserById } from "../../helpers/fetchUserById";

const UserEditor = () => {
  const { id } = useParams();

  const {
    data: initialDataRes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["user", id],
    queryFn: () => fetchUserById(id),
    enabled: !!id,
  });

  const initialData = initialDataRes?.response?.data;

  const breadcrumbs = [
    { title: "Users", isNavigation: true, path: "/dashboard/users" },
    { title: id ? "Edit User" : "Add User", isNavigation: false },
  ];

  return (
    <div className="flex flex-col gap-2">
      <NavbarItem
        title={id ? "Edit User" : "Add User"}
        breadcrumbs={breadcrumbs}
      />
      <div className="px-8 pb-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <span>Loading...</span>
          </div>
        ) : error ? (
          <p className="text-destructive text-center">Failed to load user data.</p>
        ) : id && !initialData ? (
          <p className="text-destructive text-center">No user data found.</p>
        ) : (
          <UserEditorCard initialData={initialData} isEdit={!!id} />
        )}
      </div>
    </div>
  );
};

export default UserEditor; 