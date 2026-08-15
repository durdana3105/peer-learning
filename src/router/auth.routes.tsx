import React from "react";
import { RouteObject } from "react-router-dom";

const Login = React.lazy(() => import("@/pages/Login"));
const Signup = React.lazy(() => import("@/pages/Signup"));
const ForgotPassword = React.lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = React.lazy(() => import("@/pages/ResetPassword"));
const AuthCallback = React.lazy(() => import("@/pages/AuthCallback"));
const Onboarding = React.lazy(() => import("@/pages/Onboarding"));
const PublicPortfolio = React.lazy(() => import("@/pages/PublicPortfolio"));
const BecomeMentor = React.lazy(() => import("@/pages/BecomeMentor"));

export const authRoutes: RouteObject[] = [
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password", element: <ResetPassword /> },
  { path: "/auth/callback", element: <AuthCallback /> },
  { path: "/onboarding", element: <Onboarding /> },
  { path: "/portfolio/:slug", element: <PublicPortfolio /> },
  { path: "/become-mentor", element: <BecomeMentor /> },
];
