import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import MainLayout from "./MainLayout";

export default function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <MainLayout />
    </ProtectedRoute>
  );
}
