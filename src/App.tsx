import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import Navbar from "./components/Navbar";
import Chatbot from "./components/Chatbot";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Discover from "./pages/Discover";
import Sessions from "./pages/Sessions";
import Messages from "./pages/Messages";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
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

import { supabase } from "./lib/supabase";
import BecomeMentor from "./pages/BecomeMentor";

const queryClient = new QueryClient();

const WithNav = ({ children }: { children: React.ReactNode }) => (
  <>
    <Navbar />
    {children}
  </>
);

function App() {

  // GLOBAL USER STATE
  const [user, setUser] = useState<any>(null);

  // FETCH USER ONLY ONCE
  useEffect(() => {
    const getUser = async () => {
      const demoSessionStr = localStorage.getItem("peerlearn-demo-session");
      if (demoSessionStr) {
        try {
          const parsed = JSON.parse(demoSessionStr);
          setUser(parsed.user);
          return;
        } catch (e) {
          console.warn("Failed to load demo session from App state:", e);
        }
      }

      const {
        data: { user: supabaseUser },
      } = await supabase.auth.getUser();

      setUser(supabaseUser);
    };

    getUser();
  }, []);

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

  // TEST SUPABASE
  useEffect(() => {

    const test = async () => {

      const { data, error } = await supabase
        .from("profiles")
        .select("*");

      console.log("DATA:", data);
      console.log("ERROR:", error);
    };

    test();

  }, []);

  return (

    <QueryClientProvider client={queryClient}>

      <TooltipProvider>

        <Toaster />
        <Sonner />

        <BrowserRouter>

          <AuthProvider>

            <div id="sparkle-container"></div>

            <Routes>

<Route
  path="/"
  element={
    user ? (
      <ProtectedRoute>
        <WithNav>
          <Dashboard />
        </WithNav>
      </ProtectedRoute>
    ) : (
      <Index />
    )
  }
/>
              <Route path="/login" element={<Login />} />

              <Route path="/signup" element={<Signup />} />

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

          </AuthProvider>

          <FloatingAI />

        </BrowserRouter>

      </TooltipProvider>

    </QueryClientProvider>
  );
}

export default App;