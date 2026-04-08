import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "./components/Navbar.tsx";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Discover from "./pages/Discover.tsx";
import Sessions from "./pages/Sessions.tsx";
import Messages from "./pages/Messages.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import Profile from "./pages/Profile.tsx";
import Notifications from "./pages/Notifications.tsx";
import Leaderboard from "./pages/Leaderboard.tsx";
import Admin from "./pages/Admin.tsx";
import { supabase } from "./lib/supabase";

const queryClient = new QueryClient();

const WithNav = ({ children }) => (
  <>
    <Navbar />
    {children}
  </>
);

function App() {

  // 🔥 TEST SUPABASE CONNECTION
  useEffect(() => {
    const test = async () => {
      const { data, error } = await supabase.from("users").select("*");
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
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              <Route path="/dashboard" element={<ProtectedRoute><WithNav><Dashboard /></WithNav></ProtectedRoute>} />
              <Route path="/discover" element={<ProtectedRoute><WithNav><Discover /></WithNav></ProtectedRoute>} />
              <Route path="/sessions" element={<ProtectedRoute><WithNav><Sessions /></WithNav></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><WithNav><Messages /></WithNav></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><WithNav><Notifications /></WithNav></ProtectedRoute>} />
              <Route path="/leaderboard" element={<ProtectedRoute><WithNav><Leaderboard /></WithNav></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><WithNav><Admin /></WithNav></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;