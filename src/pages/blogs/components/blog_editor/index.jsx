import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import NavbarItem from "@/components/navbar/navbar_item";
import AddBlogCard from "./AddBlogCard";
import { fetchBlogById } from "../../helpers/fetchBlogById";

const BlogEditor = () => {
  const { id } = useParams(); 

  const {
    data: initialDataRes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["blog", id],
    queryFn: () => fetchBlogById(id),
    enabled: !!id,
  });

  const initialData = initialDataRes?.response?.data;

  const breadcrumbs = [
    { title: "Blogs", isNavigation: true, path: "/dashboard/blogs" },
    { title: id ? "Edit Blog" : "Add Blog", isNavigation: false },
  ];

  return (
    <div className="flex flex-col gap-2">
      <NavbarItem
        title={id ? "Edit Blog" : "Add Blog"}
        breadcrumbs={breadcrumbs}
      />
      <div className="px-8 pb-8">
        {isLoading ? (
          <div className="text-muted-foreground flex h-48 items-center justify-center text-sm">
            Loading...
          </div>
        ) : error ? (
          <p className="text-destructive text-center">Failed to load blog data.</p>
        ) : id && !initialData ? (
          <p className="text-destructive text-center">No blog data found.</p>
        ) : (
          <AddBlogCard initialData={initialData} isEdit={!!id} />
        )}
      </div>
    </div>
  );
};

export default BlogEditor;
