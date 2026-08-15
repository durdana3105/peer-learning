import React, { useState, useEffect, Suspense } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";

import SplashScreen from "@/components/SplashScreen";
import MouseSparkles from "@/components/MouseSparkles";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import Chatbot from "@/components/Chatbot/Chatbot";
import FloatingAI from "@/components/FloatingAI";
import BackToTop from "@/components/BackToTop";

export default function RootLayout() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <>
      <MouseSparkles />
      <CookieConsentBanner />

      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-[#020617]">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
          </div>
        }
      >
        <Outlet />
      </Suspense>

      {user && (
        <>
          <Chatbot />
          <FloatingAI />
        </>
      )}

      <BackToTop />
    </>
  );
}
