import React from "react";
import { RouteObject } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";

const Profile = React.lazy(() => import("@/pages/Profile"));
const EditProfile = React.lazy(() => import("@/pages/EditProfile"));

export const settingsRoutes: RouteObject[] = [
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <Profile />
      </ProtectedRoute>
    ),
  },
  {
    path: "/edit-profile",
    element: (
      <ProtectedRoute>
        <EditProfile />
      </ProtectedRoute>
    ),
  },
];
