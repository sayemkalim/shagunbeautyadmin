import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "@/auth/ProtectedRoute";
import PublicRoute from "@/auth/PublicRoute";
import Login from "@/pages/login";
import Layout from "@/layout";
import Dashboard from "@/pages/dashboard";
import Brand from "@/pages/brands";
import ErrorPage from "@/components/404";
import Products from "@/pages/products";
import Categories from "@/pages/categories";
import ProductDetails from "@/pages/products/components/product_details";
import BrandDetails from "@/pages/brands/components/brand_details";
import Admin from "@/pages/admin";
import AddAdminCard from "@/pages/admin/components/AddAdminCard";
import AdminEditor from "@/pages/admin/components/admin_editor";
import Blogs from "@/pages/blogs";
import SubCategories from "@/pages/sub_categories";
import CategoryDetails from "@/pages/categories/components/category_details";
import ProductsEditor from "@/pages/products/components/product_editor";
import CategoryEditor from "@/pages/categories/components/category_editor";
import SubCategoryEditor from "@/pages/sub_categories/components/sub_category_editor";
import BrandEditor from "@/pages/brands/components/brand_editor";
import BlogEditor from "@/pages/blogs/components/blog_editor";
import BlogDetails from "@/pages/blogs/components/BlogDetails";
import ContactUs from "@/pages/contact_us";
import Orders from "@/pages/orders";
import OrderDetails from "@/pages/orders/components/OrderDetails";
import Bundles from "@/pages/bundles";
import BundleEditor from "@/pages/bundles/components/bundle_editor";
import Users from "@/pages/users";
import UserEditor from "@/pages/users/components/user_editor";
import UserDetails from "@/pages/users/components/user_details";
import ShipmentZones from "@/pages/shipment_zones";
import ShipmentZoneEditor from "@/pages/shipment_zones/components/shipment_zone_editor";
import ShipmentZoneDetails from "@/pages/shipment_zones/components/ShipmentZoneDetails";
import SuperAdmin from "@/pages/super-admin";
import AddSuperAdminCard from "@/pages/super-admin/components/AddAdminCard";
import SuperAdminEditorCard from "@/pages/super-admin/components/super-admin_editor/AdminEditorCard";
import SuperEditor from "@/pages/super-admin/components/super-admin_editor";

const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Layout />}>
          <Route index element={<Dashboard />} />
          {/* ProductsRoute */}
          <Route path="/dashboard/products" element={<Products />} />
          <Route path="/dashboard/product/add" element={<ProductsEditor />} />
          <Route
            path="/dashboard/product/edit/:id"
            element={<ProductsEditor />}
          />
          <Route path="/dashboard/products/:id" element={<ProductDetails />} />

          {/* {Bundles Route} */}
          <Route path="/dashboard/bundles" element={<Bundles />} />
          <Route path="/dashboard/bundles/add" element={<BundleEditor />} />
          <Route path="/dashboard/bundle/edit/:id" element={<BundleEditor />} />

          {/* Brands Route */}
          <Route path="/dashboard/brands" element={<Brand />} />
          <Route path="/dashboard/brands/add" element={<BrandEditor />} />
          <Route path="/dashboard/brands/edit/:id" element={<BrandEditor />} />
          <Route path="/dashboard/brands/:id" element={<BrandDetails />} />

          {/* Categories Route */}
          <Route path="/dashboard/categories" element={<Categories />} />
          <Route path="/dashboard/category/:id" element={<CategoryDetails />} />
          <Route path="/dashboard/category/add" element={<CategoryEditor />} />
          <Route
            path="/dashboard/category/edit/:id"
            element={<CategoryEditor />}
          />

          {/* Sub Category Route */}
          <Route path="/dashboard/subcategory" element={<SubCategories />} />
          <Route
            path="/dashboard/subcategory/add"
            element={<SubCategoryEditor />}
          />
          <Route
            path="/dashboard/subcategory/edit/:id"
            element={<SubCategoryEditor />}
          />
          {/* Admin Routes */}
          <Route path="/dashboard/admins" element={<Admin />} />
          <Route path="/dashboard/admins/add" element={<AddAdminCard />} />
          <Route path="/dashboard/admins/edit/:id" element={<AdminEditor />} />
          <Route path="/dashboard/super-admin" element={<SuperAdmin />} />
          <Route path="/dashboard/super-admin/add" element={<AddSuperAdminCard />} />
          <Route path="/dashboard/super-admin/edit/:id" element={<SuperEditor />} />
          {/* Blogs */}
          <Route path="/dashboard/blogs" element={<Blogs />} />
          <Route path="/dashboard/blogs/add" element={<BlogEditor />} />
          <Route path="/dashboard/blogs/edit/:id" element={<BlogEditor />} />
          <Route path="/dashboard/blogs/:id" element={<BlogDetails />} />
          {/* Contact Us */}
          <Route path="/dashboard/contact-us" element={<ContactUs />} />
          {/* Orders */}
          <Route path="/dashboard/orders" element={<Orders />} />
          <Route path="/dashboard/orders/:orderId" element={<OrderDetails />} />
          {/* Users Routes */}
          <Route path="/dashboard/users" element={<Users />} />
          <Route path="/dashboard/users/add" element={<UserEditor />} />
          <Route path="/dashboard/users/edit/:id" element={<UserEditor />} />
          <Route path="/dashboard/users/:id" element={<UserDetails />} />
          {/* Shipment Zones Routes */}
          <Route path="/dashboard/shipment-zones" element={<ShipmentZones />} />
          <Route path="/dashboard/shipment-zones/add" element={<ShipmentZoneEditor />} />
          <Route path="/dashboard/shipment-zones/edit/:id" element={<ShipmentZoneEditor />} />
          <Route path="/dashboard/shipment-zones/:id" element={<ShipmentZoneDetails />} />
        </Route>
      </Route>
      <Route path="*" element={<ErrorPage />} />
    </Routes>
  );
};

export default Router;
