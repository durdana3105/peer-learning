import React from "react";
import { RouteObject } from "react-router-dom";
import ProtectedMentorLayout from "@/layouts/ProtectedMentorLayout";

const MentorDashboard = React.lazy(() => import("@/pages/MentorDashboard"));

export const mentorRoutes: RouteObject[] = [
  {
    element: <ProtectedMentorLayout />,
    children: [
      { path: "/mentor-dashboard", element: <MentorDashboard /> },
    ],
  },
];
