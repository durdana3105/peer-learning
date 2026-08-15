import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar/Navbar";
import StreakBadge from "@/components/StreakBadge";
import { useAuth } from "@/contexts/useAuth";

export default function MainLayout() {
  const { user } = useAuth();
  return (
    <>
      <Navbar />
      {user && <StreakBadge />}
      <Outlet />
    </>
  );
}
