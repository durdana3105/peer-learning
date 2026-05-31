import React, { useEffect, Suspense, useState, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Router } from "react-router-dom";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider } from "@/contexts/AuthContext";
import { RoleProvider } from "@/contexts/RoleContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import AdminRoute from "@/components/AdminRoute";
import ProtectedRoute from "@/components/ProtectedRoute";
import ProtectedMentorRoute from "@/components/ProtectedMentorRoute";

// Global layout components – rendered on every page, keep static
import Navbar from "./components/Navbar";
import Chatbot from "./components/Chatbot";
import StreakBadge from "./components/StreakBadge";
import FloatingAI from "./components/FloatingAI";

import { useAuth } from "@/contexts/useAuth";

// Lazy-loaded page & route-specific components (code-split per route)
const Landing = React.lazy(() => import("./pages/Landing"));
const Index = React.lazy(() => import("./pages/Index"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const MentorDashboard = React.lazy(() => import("./pages/MentorDashboard"));
const LearnerDashboard = React.lazy(() => import("./pages/LearnerDashboard"));
const Discover = React.lazy(() => import("./pages/Discover"));
const Sessions = React.lazy(() => import("./pages/Sessions"));
const Messages = React.lazy(() => import("./pages/Messages"));
const Chat = React.lazy(() => import("./pages/Chat"));
const Login = React.lazy(() => import("./pages/Login"));
const Signup = React.lazy(() => import("./pages/Signup"));
const Onboarding = React.lazy(() => import("./pages/Onboarding"));
const Profile = React.lazy(() => import("./pages/Profile"));
const EditProfile = React.lazy(() => import("./pages/EditProfile"));
const Notifications = React.lazy(() => import("./pages/Notifications"));
const Leaderboard = React.lazy(() => import("./pages/Leaderboard"));
const Admin = React.lazy(() => import("./pages/Admin"));
const ForgotPassword = React.lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = React.lazy(() => import("./pages/ResetPassword"));
const AnonymousDoubts = React.lazy(() => import("./pages/AnonymousDoubts"));
const AIPage = React.lazy(() => import("./pages/aipage"));
const ContributorDashboard = React.lazy(() => import("./pages/ContributorDashboard"));
const BecomeMentor = React.lazy(() => import("./pages/BecomeMentor"));
const Portfolio = React.lazy(() => import("./pages/Portfolio"));
const AuthCallback = React.lazy(() => import("./pages/AuthCallback"));
const PublicPortfolio = React.lazy(() => import("./pages/PublicPortfolio"));
const ResourceHub = React.lazy(() => import("@/pages/ResourceHub"));
const StudyRooms = React.lazy(() => import("./components/StudyRooms"));
const Room = React.lazy(() => import("./components/Room"));

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
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number }[]>([]);
  const sparkleIdRef = useRef(0);

  useEffect(() => {
    let timeouts: NodeJS.Timeout[] = [];
    
    const handleMouseMove = (e: MouseEvent) => {
      const newSparkles = Array.from({ length: 2 }).map(() => ({
        id: sparkleIdRef.current++,
        x: e.clientX + Math.random() * 10 - 5,
        y: e.clientY + Math.random() * 10 - 5,
      }));

      setSparkles((prev) => [...prev, ...newSparkles]);

      newSparkles.forEach((sparkle) => {
        const timeout = setTimeout(() => {
          setSparkles((prev) => prev.filter((s) => s.id !== sparkle.id));
        }, 800);
        timeouts.push(timeout);
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      timeouts.forEach(clearTimeout);
    };
  }, []);

  return (
    <>
      <div id="sparkle-container">
        {sparkles.map((sparkle) => (
          <div
            key={sparkle.id}
            className="sparkle"
            style={{ left: `${sparkle.x}px`, top: `${sparkle.y}px`, position: 'absolute', pointerEvents: 'none' }}
          />
        ))}
      </div>


      <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#020617]"><div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" /></div>}>
        <Routes>
          <Route
            path="/"
            element={user ? <Navigate to="/dashboard" replace /> : <WithNav><Index /></WithNav>}
          />

          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route
            path="/ai"
            element={
              <ProtectedRoute>
                <WithNav>
                  <AIPage />
                </WithNav>
              </ProtectedRoute>
            }
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/become-mentor" element={<BecomeMentor />} />
          <Route path="/portfolio/:slug" element={<PublicPortfolio />} />

          <Route path="/auth/callback" element={<AuthCallback />} />

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
            path="/portfolio"
            element={
              <ProtectedRoute>
                <WithNav>
                  <Portfolio />
                </WithNav>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <WithNav>
                  <Admin />
                </WithNav>
              </AdminRoute>
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
              <ProtectedRoute>
                <WithNav>
                  <AnonymousDoubts />
                </WithNav>
              </ProtectedRoute>
            }
          />

          <Route
            path="/contributor-dashboard"
            element={
              <ProtectedRoute>
                <WithNav>
                  <ContributorDashboard />
                </WithNav>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      {user && (
        <>
          <Chatbot />
          <FloatingAI />
        </>
      )}
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
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
