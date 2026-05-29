import React, { useEffect, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Router } from "react-router-dom";

import Landing from "./pages/Landing";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider } from "@/contexts/AuthContext";
import { RoleProvider } from "@/contexts/RoleContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ProtectedMentorRoute from "@/components/ProtectedMentorRoute";

import Navbar from "./components/Navbar";
import Chatbot from "./components/Chatbot";
import StudyRooms from "./components/StudyRooms";
import Room from "./components/Room";
import StreakBadge from "./components/StreakBadge";
import FloatingAI from "./components/FloatingAI";

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
import AnonymousDoubts from "./pages/AnonymousDoubts";
import AIPage from "./pages/aipage";
import ContributorDashboard from "./pages/ContributorDashboard";
import BecomeMentor from "./pages/BecomeMentor";

import { useAuth } from "@/contexts/useAuth";

const ResourceHub = React.lazy(() => import("@/pages/ResourceHub"));

const queryClient = new QueryClient();

const WithNav = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return (
    <>
      <Navbar />
      {user && <StreakBadge />}
      {children}
    </>
  );
};

function AppContent() {
  const { user } = useAuth();

  useEffect(() => {
    const container = document.getElementById("sparkle-container");
    if (!container) return;

    const createSparkle = (x: number, y: number) => {
      const sparkle = document.createElement("div");
      sparkle.className = "sparkle";
      sparkle.style.left = `${x}px`;
      sparkle.style.top = `${y}px`;
      container.appendChild(sparkle);

      setTimeout(() => sparkle.remove(), 800);
    };

    const handleMouseMove = (e: MouseEvent) => {
      for (let i = 0; i < 2; i++) {
        createSparkle(
          e.clientX + Math.random() * 10 - 5,
          e.clientY + Math.random() * 10 - 5,
        );
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <>
      <div id="sparkle-container"></div>


      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route
            path="/"
            element={user ? <Navigate to="/dashboard" replace /> : <Index />}
          />

          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/ai" element={<AIPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/become-mentor" element={<BecomeMentor />} />

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

          <Route
            path="/anonymous-doubts"
            element={
              <WithNav>
                <AnonymousDoubts />
              </WithNav>
            }
          />

          <Route
            path="/contributor-dashboard"
            element={
              <WithNav>
                <ContributorDashboard />
              </WithNav>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      <Chatbot />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />

          <BrowserRouter>
            <AuthProvider>
              <RoleProvider>
                <AppContent />
              </RoleProvider>
            </AuthProvider>

            <FloatingAI />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
