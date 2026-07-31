import React from "react";
import AdminRoute from "@/components/AdminRoute";
import MainLayout from "./MainLayout";

export default function AdminLayout() {
  return (
    <AdminRoute>
      <MainLayout />
    </AdminRoute>
  );
}
