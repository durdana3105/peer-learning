import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import Navbar from "./components/Navbar.tsx";
import Chatbot from "./components/Chatbot";

import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Discover from "./pages/Discover.tsx";
import Sessions from "./pages/Sessions.tsx";
import Messages from "./pages/Messages.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import Profile from "./pages/Profile.tsx";
import EditProfile from "./pages/EditProfile"; // ✅ added
import Notifications from "./pages/Notifications.tsx";
import Leaderboard from "./pages/Leaderboard.tsx";
import Admin from "./pages/Admin.tsx";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import { supabase } from "./lib/supabase";

const queryClient = new QueryClient();

const WithNav = ({ children }) => (
  <>
    <Navbar />
    {children}
  </>
);

function App() {

  // ✨ Sparkle Effect
  useEffect(() => {
    const container = document.getElementById("sparkle-container");
    if (!container) return;

    const createSparkle = (x, y) => {
      const sparkle = document.createElement("div");
      sparkle.className = "sparkle";
      sparkle.style.left = `${x}px`;
      sparkle.style.top = `${y}px`;
      container.appendChild(sparkle);

      setTimeout(() => sparkle.remove(), 800);
    };

    const handleMouseMove = (e) => {
      for (let i = 0; i < 2; i++) {
        createSparkle(
          e.clientX + Math.random() * 10 - 5,
          e.clientY + Math.random() * 10 - 5
        );
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // 🔍 Supabase test
  useEffect(() => {
    const test = async () => {
      const { data, error } = await supabase.from("profiles").select("*");
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
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              <Route path="/dashboard" element={<ProtectedRoute><WithNav><Dashboard /></WithNav></ProtectedRoute>} />
              <Route path="/discover" element={<ProtectedRoute><WithNav><Discover /></WithNav></ProtectedRoute>} />
              <Route path="/sessions" element={<ProtectedRoute><WithNav><Sessions /></WithNav></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><WithNav><Messages /></WithNav></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><WithNav><Notifications /></WithNav></ProtectedRoute>} />
              <Route path="/leaderboard" element={<ProtectedRoute><WithNav><Leaderboard /></WithNav></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><WithNav><Admin /></WithNav></ProtectedRoute>} />

              {/* ✅ Profile */}
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

              {/* ✅ Edit Profile */}
              <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>

            <Chatbot />

          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;