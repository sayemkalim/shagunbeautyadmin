import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Edit, ArrowLeft } from "lucide-react";
import NavbarItem from "@/components/navbar/navbar_item";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Typography from "@/components/typography";
import { fetchBlogById } from "../helpers/fetchBlogById";

const BlogDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data: blogResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["blog", id],
    queryFn: () => fetchBlogById(id),
    enabled: !!id,
  });

  const blog = blogResponse?.response?.data;

  const breadcrumbs = [
    { title: "Blogs", isNavigation: true, path: "/dashboard/blogs" },
    { title: blog?.title || "Blog Details", isNavigation: false },
  ];

  const onEdit = () => {
    navigate(`/dashboard/blogs/edit/${id}`);
  };

  const onBack = () => {
    navigate("/dashboard/blogs");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <NavbarItem title="Blog Details" breadcrumbs={breadcrumbs} />
        <div className="px-8 pb-8">
          <div className="text-muted-foreground flex h-48 items-center justify-center text-sm">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="flex flex-col gap-2">
        <NavbarItem title="Blog Details" breadcrumbs={breadcrumbs} />
        <div className="px-8 pb-8">
          <p className="text-destructive text-center">
            {error ? "Failed to load blog data." : "Blog not found."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <NavbarItem title="Blog Details" breadcrumbs={breadcrumbs} />
      <div className="px-8 pb-8">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 size-4" />
            Back to Blogs
          </Button>
          <Button onClick={onEdit}>
            <Edit className="mr-2 size-4" />
            Edit Blog
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{blog.title}</CardTitle>
            <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
              <span
                className={
                  blog.published
                    ? "inline-block rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground inline-block rounded-full px-2 py-1 text-xs font-medium"
                }
              >
                {blog.published ? "Published" : "Draft"}
              </span>
              {blog.isFeatured && (
                <span className="bg-primary/10 text-primary inline-block rounded-full px-2 py-1 text-xs font-medium">
                  Featured
                </span>
              )}
              <span>Created: {format(new Date(blog.createdAt), "dd/MM/yyyy hh:mm a")}</span>
              {blog.createdAt !== blog.updatedAt && (
                <span>Updated: {format(new Date(blog.updatedAt), "dd/MM/yyyy hh:mm a")}</span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {blog.banner_image_url && (
              <div>
                <Typography variant="h4" className="mb-2">
                  Banner Image
                </Typography>
                <img
                  src={blog.banner_image_url}
                  alt={blog.title}
                  className="border-border h-auto max-w-full rounded-lg border"
                />
              </div>
            )}

            {blog.short_description && (
              <div>
                <Typography variant="h4" className="mb-2">
                  Short Description
                </Typography>
                <Typography variant="p" className="text-muted-foreground">
                  {blog.short_description}
                </Typography>
              </div>
            )}

            {blog.content && (
              <div>
                <Typography variant="h4" className="mb-2">
                  Content
                </Typography>
                <div
                  className="text-foreground max-w-none space-y-4 leading-relaxed [&_a]:text-primary [&_a]:underline [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold [&_img]:rounded-lg [&_strong]:font-semibold"
                  dangerouslySetInnerHTML={{ __html: blog.content }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BlogDetails; 