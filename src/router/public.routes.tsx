import React from "react";
import { Navigate, RouteObject } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import { useAuth } from "@/contexts/useAuth";

const Index = React.lazy(() => import("@/pages/Index"));
const Contact = React.lazy(() => import("@/pages/Contact"));
const PrivacyPolicy = React.lazy(() => import("@/pages/privacy"));
const CookiesPolicy = React.lazy(() => import("@/pages/cookies-policy"));
const TermsAndConditions = React.lazy(() => import("@/pages/TermsAndConditions"));
const NotFound = React.lazy(() => import("@/pages/NotFound"));

const IndexRoute = () => {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : <Index />;
};

export const publicRoutes: RouteObject[] = [
  {
    element: <MainLayout />,
    children: [
      { path: "/", element: <IndexRoute /> },
      { path: "/contact", element: <Contact /> },
      { path: "/privacy-policy", element: <PrivacyPolicy /> },
      { path: "/cookies-policy", element: <CookiesPolicy /> },
      { path: "/terms-and-conditions", element: <TermsAndConditions /> },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
];
