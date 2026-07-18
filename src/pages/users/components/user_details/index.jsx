import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Edit, ArrowLeft } from "lucide-react";
import NavbarItem from "@/components/navbar/navbar_item";
import Typography from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { fetchUserById } from "../../helpers/fetchUserById";

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data: userRes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["user", id],
    queryFn: () => fetchUserById(id),
    enabled: !!id,
  });

  const user = userRes?.response?.data;

  const breadcrumbs = [
    { title: "Users", isNavigation: true, path: "/dashboard/users" },
    { title: "User Details", isNavigation: false },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <NavbarItem title="User Details" breadcrumbs={breadcrumbs} />
        <div className="px-8 pb-8">
          <Card className="mx-auto max-w-4xl space-y-6 p-8">
            <div className="flex items-center gap-4">
              <Skeleton className="size-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col gap-2">
        <NavbarItem title="User Details" breadcrumbs={breadcrumbs} />
        <div className="flex h-48 flex-col items-center justify-center space-y-4">
          <p className="text-destructive">Failed to load user details.</p>
          <Button onClick={() => navigate("/dashboard/users")}>
            <ArrowLeft className="mr-2 size-4" />
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <NavbarItem
        title="User Details"
        breadcrumbs={breadcrumbs}
      />

      <div className="px-8 pb-8">
        <Card className="mx-auto max-w-4xl p-8">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="size-16">
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                  {user.name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <Typography variant="h2" className="mb-1.5">
                  {user.name}
                </Typography>
                <Badge variant={user.isActive ? "default" : "destructive"} className={user.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" : ""}>
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
            <Button
              onClick={() => navigate(`/dashboard/users/edit/${id}`)}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit User
            </Button>
          </div>

          {/* User Information */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <Typography variant="h4" className="text-muted-foreground mb-1 text-sm font-medium">
                  Email
                </Typography>
                <Typography variant="p">{user.email}</Typography>
              </div>

              <div>
                <Typography variant="h4" className="text-muted-foreground mb-1 text-sm font-medium">
                  Phone Number
                </Typography>
                <Typography variant="p">{user.phone || "Not provided"}</Typography>
              </div>

              <div>
                <Typography variant="h4" className="text-muted-foreground mb-1 text-sm font-medium">
                  Status
                </Typography>
                <Typography variant="p">
                  {user.isActive ? "Active" : "Inactive"}
                </Typography>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Typography variant="h4" className="text-muted-foreground mb-1 text-sm font-medium">
                  Created At
                </Typography>
                <Typography variant="p">
                  {format(new Date(user.createdAt), "PPP")}
                </Typography>
              </div>

              <div>
                <Typography variant="h4" className="text-muted-foreground mb-1 text-sm font-medium">
                  Last Updated
                </Typography>
                <Typography variant="p">
                  {format(new Date(user.updatedAt), "PPP")}
                </Typography>
              </div>

              <div>
                <Typography variant="h4" className="text-muted-foreground mb-1 text-sm font-medium">
                  User ID
                </Typography>
                <Typography variant="p" className="text-muted-foreground text-sm">
                  {user._id}
                </Typography>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-8 flex justify-start border-t pt-8">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard/users")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Users
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UserDetails; 