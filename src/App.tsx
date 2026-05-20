import React, { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider } from "@/contexts/AuthContext";
import { RoleProvider } from "@/contexts/RoleContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ProtectedMentorRoute from "@/components/ProtectedMentorRoute";

import Navbar from "./components/Navbar";
import Chatbot from "./components/Chatbot";
import StudyRooms from "./components/StudyRooms";
import Room from "./components/Room";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import MentorDashboard from "./pages/MentorDashboard";
import LearnerDashboard from "./pages/LearnerDashboard";
import Discover from "./pages/Discover";
import Sessions from "./pages/Sessions";
import Messages from "./pages/Messages";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Notifications from "./pages/Notifications";
import Leaderboard from "./pages/Leaderboard";
import Admin from "./pages/Admin";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AIPage from "./pages/aipage";
import FloatingAI from "./components/FloatingAI";
import ContributorDashboard from "./pages/ContributorDashboard";
const ResourceHub = React.lazy(() => import("@/pages/ResourceHub"));

import { supabase } from "@/integrations/supabase/client";
import BecomeMentor from "./pages/BecomeMentor";
import { useAuth } from "@/contexts/useAuth";

const queryClient = new QueryClient();

const WithNav = ({ children }: { children: React.ReactNode }) => (
  <>
    <Navbar />
    {children}
  </>
);

function App() {

  const { user } = useAuth();

  // ✨ Sparkle Effect
  useEffect(() => {

    const container = document.getElementById("sparkle-container");

    if (!container) return;

    const createSparkle = (x: number, y: number) => {

      const sparkle = document.createElement("div");

      sparkle.className = "sparkle";

      sparkle.style.left = x + "px";
      sparkle.style.top = y + "px";

      container.appendChild(sparkle);

      setTimeout(() => {
        sparkle.remove();
      }, 800);
    };

    const handleMouseMove = (e: MouseEvent) => {

      for (let i = 0; i < 2; i++) {

        createSparkle(
          e.clientX + Math.random() * 10 - 5,
          e.clientY + Math.random() * 10 - 5
        );
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };

  }, []);

  return (

    <QueryClientProvider client={queryClient}>

      <TooltipProvider>

        <Toaster />
        <Sonner />

        <BrowserRouter>

          <AuthProvider>

            <RoleProvider>

            <div id="sparkle-container"></div>

            <Routes>

<Route
  path="/"
  element={
    user ? (
      <Navigate to="/dashboard" replace />
    ) : (
      <Index />
    )
  }
/>
              <Route path="/login" element={<Login />} />

              <Route path="/signup" element={<Signup />} />

              <Route path="/onboarding" element={<Onboarding />} />

              <Route path="/ai" element={<AIPage />} />

              <Route
                path="/forgot-password"
                element={<ForgotPassword />}
              />

              <Route
                path="/reset-password"
                element={<ResetPassword />}
              />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <WithNav>
                      <Dashboard />
                    </WithNav>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mentor-dashboard"
                element={
                  <ProtectedMentorRoute>
                    <WithNav>
                      <MentorDashboard />
                    </WithNav>
                  </ProtectedMentorRoute>
                }
              />
              <Route
                path="/learner-dashboard"
                element={
                  <ProtectedRoute>
                    <WithNav>
                      <LearnerDashboard />
                    </WithNav>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/rooms"
                element={
                  <ProtectedRoute>
                    <WithNav>
                      <StudyRooms />
                    </WithNav>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/rooms/:id"
                element={
                  <ProtectedRoute>
                    <WithNav>
                      <Room />
                    </WithNav>
                  </ProtectedRoute>
                }
              />

              <Route path="/become-mentor" element={<BecomeMentor />} />

              <Route
                path="/discover"
                element={
                  <ProtectedRoute>
                    <WithNav>
                      <Discover />
                    </WithNav>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/sessions"
                element={
                  <ProtectedRoute>
                    <WithNav>
                      <Sessions />
                    </WithNav>
                  </ProtectedRoute>
                }
              />

              {/* UPDATED MESSAGES ROUTE */}
              <Route
                path="/messages"
                element={
                  <ProtectedRoute>
                    <WithNav>
                      <Messages user={user} />
                    </WithNav>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <WithNav>
                      <Chat />
                    </WithNav>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <WithNav>
                      <Notifications />
                    </WithNav>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/leaderboard"
                element={
                  <ProtectedRoute>
                    <WithNav>
                      <Leaderboard />
                    </WithNav>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/resources"
                element={
                  <ProtectedRoute>
                    <WithNav>
                      <ResourceHub />
                    </WithNav>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <WithNav>
                      <Admin />
                    </WithNav>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/edit-profile"
                element={
                  <ProtectedRoute>
                    <EditProfile />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFound />} />

              <Route
                path="/contributor-dashboard"
                element={
                    <WithNav>
                      <ContributorDashboard />
                    </WithNav>
                }
              />

            </Routes>

            <Chatbot />

            </RoleProvider>

          </AuthProvider>

          <FloatingAI />

        </BrowserRouter>

      </TooltipProvider>

    </QueryClientProvider>
  );
}

export default App;