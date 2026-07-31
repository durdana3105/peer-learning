import React from "react";
import { createBrowserRouter } from "react-router-dom";
import RootLayout from "@/layouts/RootLayout";
import { publicRoutes } from "./public.routes";
import { authRoutes } from "./auth.routes";
import { protectedRoutes } from "./protected.routes";
import { settingsRoutes } from "./settings.routes";
import { mentorRoutes } from "./mentor.routes";
import { adminRoutes } from "./admin.routes";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      ...publicRoutes,
      ...authRoutes,
      ...protectedRoutes,
      ...settingsRoutes,
      ...mentorRoutes,
      ...adminRoutes,
    ],
  },
]);
