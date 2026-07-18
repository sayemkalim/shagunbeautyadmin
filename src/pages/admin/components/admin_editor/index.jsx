import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import NavbarItem from "@/components/navbar/navbar_item";
import AdminEditorCard from "./AdminEditorCard";
import { fetchAdminById } from "../../helpers/fetchAdminById";

const AdminEditor = () => {
  const { id } = useParams();

  const {
    data: initialDataRes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", id],
    queryFn: () => fetchAdminById(id),
    enabled: !!id,
  });

  const initialData = initialDataRes?.response?.data;

  const breadcrumbs = [
    { title: "Admins", isNavigation: true, path: "/dashboard/admins" },
    { title: id ? "Edit Admin" : "Add Admin", isNavigation: false },
  ];

  return (
    <div className="flex flex-col gap-2">
      <NavbarItem
        title={id ? "Edit Admin" : "Add Admin"}
        breadcrumbs={breadcrumbs}
      />
      <div className="px-8 pb-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <span>Loading...</span>
          </div>
        ) : error ? (
          <p className="text-destructive text-center">Failed to load admin data.</p>
        ) : id && !initialData ? (
          <p className="text-destructive text-center">No admin data found.</p>
        ) : (
          <AdminEditorCard initialData={initialData} isEdit={!!id} />
        )}
      </div>
    </div>
  );
};

export default AdminEditor;
