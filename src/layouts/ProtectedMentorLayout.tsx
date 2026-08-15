import React from "react";
import ProtectedMentorRoute from "@/components/ProtectedMentorRoute";
import MainLayout from "./MainLayout";

export default function ProtectedMentorLayout() {
  return (
    <ProtectedMentorRoute>
      <MainLayout />
    </ProtectedMentorRoute>
  );
}
