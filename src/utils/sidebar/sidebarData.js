import {
  BellIcon,
  Briefcase,
  ContactIcon,
  Crown,
  FileText,
  FormInput,
  GalleryThumbnails,
  Layers,
  LayoutDashboard,
  Package,
  Settings2,
  ShieldUserIcon,
  User,
  Users,
  Users2,
  Image,
  Plus,
  Bell,
  ShoppingBag,
  Store,
  BadgeInfo,
  MessageSquarePlus,
  BadgePlus,
  CopyPlus,
  Package2,
  LayoutGridIcon,
  CreditCard,
  Mail,
  Truck,
  Ticket
} from "lucide-react";
import { getItem } from "../local_storage";
const userName = getItem("userName") || "Admin";
const userEmail = getItem("userEmail") || "admin@admin.com";
export const data = {
  user: {
    name: userName,
    email: userEmail,
    avatar: "/user.jpg",
  },
  
  navMain: [
    
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
      isActive: true,
      items: [],
    },
    {
      title: "Admin",
      url: "/dashboard/admins",
      icon: Users2,
      isActive: true,
      items: [],
      roles: [ "super_admin"], 
    },
    {
      title: "Super Admins",
      url: "/dashboard/super-admin",
      icon: Users2,
      isActive: true,
      items: [],
      roles: [ "super_admin"], 
    },
    {
      title: "Users",
      url: "/dashboard/users",
      icon: Users,
      isActive: true,
      items: [],
      roles: ["super_admin","admin"],
    },
    {
      title: "Categories",
      url: "/dashboard/categories",
      icon: Plus,
      isActive: true,
      items: [],
      roles: ["super_admin", "admin"],

      
    },
    {
      title: "Sub Categories",
      url: "/dashboard/subcategory",
      icon: CopyPlus,
      isActive: true,
      items: [],
      roles: ["super_admin", "admin"],

      
    },
    {
      title: " Products",
      url: "/dashboard/products",
      icon: ShoppingBag,
      isActive: true,
      items: [],
      roles: ["super_admin", "admin"],
    },
    {
      title: "Bundles",
      url: "/dashboard/bundles",
      icon: LayoutGridIcon,
      isActive: true,
      items: [],
      roles: ["super_admin", "admin"],
    },
    {
      title: "Brands",
      url: "/dashboard/brands",
      icon: Store,
      isActive: true,
      items: [],
      roles: [ "admin","super_admin"],

      
    },
    {
      title: "Shipment Zones",
      url: "/dashboard/shipment-zones",
      icon: Truck,
      isActive: true,
      items: [],
      roles: ["super_admin", "admin"],
    },
    {
      title: "Banners",
      url: "/dashboard/banners",
      icon: Image,
      isActive: true,
      items: [],
      roles: ["super_admin", "admin"],
    },
    {
      title: "Inventory",
      url: "/dashboard/inventory",
      icon: Package,
      isActive: true,
      items: [],
      roles: ["super_admin", "admin", "sub_admin"],
    },


  ],
  projects: [
    {
      title: "Blogs",
      name: "Blogs",
      url: "/dashboard/blogs",
      icon: FileText,
      roles: ["super_admin","admin"],
    },
    {
      title: "Queries",
      name: "Queries",
      url: "/dashboard/contact-us",
      icon: ContactIcon,
      roles: ["super_admin", "admin"],
    },
    // {
    //   title: "Newsletter",
    //   name: "Newsletter",
    //   url: "/dashboard/newsletter",
    //   icon: Mail,
    //   roles: ["super_admin", "admin"],
    // }
    // {
    //   title: "Info & Policy",
    //   name: "Info & Policy",
    //   url: "/dashboard/info-policy",
    //   icon: BadgeInfo,
    //   roles: ["super_admin", "admin"],
    //   items: [
    //     {
    //       title: "Terms & Conditions",
    //       name: "Terms & Conditions",
    //       url: "/dashboard/info-policy/terms-conditions",
    //     },
    //     {
    //       title: "Privacy Policy",
    //       name: "Privacy Policy",
    //       url: "/dashboard/info-policy/privacy-policy",
    //     },
    //     {
    //       title: "FAQ",
    //       name: "FAQ",
    //       url: "/dashboard/info-policy/faq",
    //     },
    //   ],
    // },
    // {
    //   title: "Testimonial",
    //   name: "Testimonial",
    //   url: "/dashboard/testimonials",
    //   icon: MessageSquarePlus,
    //   roles: ["super_admin", "admin",],
    // },
  ],
  management: [
    {
      title: "Orders",
      name: "Orders",
      url: "/dashboard/orders",
      icon: Package2,
      roles: ["super_admin","admin"],
    },
    {
      title: "Coupons",
      name: "Coupons",
      url: "/dashboard/coupons",
      icon: Ticket,
      roles: ["super_admin","admin"],
    },
    // {
    //   title: "Transactions",
    //   name: "Transactions",
    //   url: "/dashboard/transactions",
    //   icon: CreditCard,
    //   roles: ["super_admin"],
    // }
  ]
};
