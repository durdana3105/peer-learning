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
import MouseSparkles from "./components/MouseSparkles";
import ErrorBoundary from "./components/ErrorBoundary";

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
const Contact = React.lazy(() => import("./pages/Contact"));
const PrivacyPolicy = React.lazy(() => import("./pages/privacy"));
const PeerReviewDashboard = React.lazy(() => import("./pages/PeerReviewDashboard"));
const SubmitForReview = React.lazy(() => import("./pages/SubmitForReview"));
const ReviewSubmission = React.lazy(() => import("./pages/ReviewSubmission"));
const MockInterview = React.lazy(() => import("./pages/MockInterview"));

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

  return (
    <>
      <MouseSparkles />


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
          <Route path="/contact" element={<WithNav><Contact /></WithNav>} />
          <Route path="/privacy-policy" element={<WithNav><PrivacyPolicy /></WithNav>} />

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
            path="/peer-review"
            element={
              <ProtectedRoute>
                <WithNav>
                  <PeerReviewDashboard />
                </WithNav>
              </ProtectedRoute>
            }
          />
          <Route
            path="/peer-review/new"
            element={
              <ProtectedRoute>
                <WithNav>
                  <SubmitForReview />
                </WithNav>
              </ProtectedRoute>
            }
          />
          <Route
            path="/peer-review/:id"
            element={
              <ProtectedRoute>
                <WithNav>
                  <ReviewSubmission />
                </WithNav>
              </ProtectedRoute>
            }
          />

          <Route
            path="/mock-interview"
            element={
              <ProtectedRoute>
                <WithNav>
                  <MockInterview />
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
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

export default App;
