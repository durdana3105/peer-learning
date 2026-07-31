import React from "react";
import { RouteObject } from "react-router-dom";
import AdminLayout from "@/layouts/AdminLayout";

const Admin = React.lazy(() => import("@/pages/Admin"));

export const adminRoutes: RouteObject[] = [
  {
    element: <AdminLayout />,
    children: [
      { path: "/admin", element: <Admin /> },
    ],
  },
];
