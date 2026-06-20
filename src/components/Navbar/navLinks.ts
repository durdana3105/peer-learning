import {
  BookOpen,
  LayoutDashboard,
  Compass,
  Calendar,
  MessageCircle,
  Trophy,
  Shield,
  Users,
  BriefcaseBusiness,
  FileCheck,
} from "lucide-react";
import { User } from "@supabase/supabase-js";

export const getNavLinks = (user: User | null, isAdmin: boolean) => {
  return user
    ? [
        {
          to: "/dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
        },
        {
          to: "/discover",
          label: "Discover",
          icon: Compass,
        },
        {
          to: "/resources",
          label: "Resources",
          icon: BookOpen,
        },
        {
          to: "/sessions",
          label: "Sessions",
          icon: Calendar,
        },
        {
          to: "/chat",
          label: "Chat",
          icon: MessageCircle,
        },
        {
          to: "/leaderboard",
          label: "Ranks",
          icon: Trophy,
        },
        {
          to: "/portfolio",
          label: "Portfolio",
          icon: BriefcaseBusiness,
        },
        {
          to: "/peer-review",
          label: "Peer Review",
          icon: FileCheck,
        },
        ...(isAdmin
          ? [
              {
                to: "/admin",
                label: "Admin",
                icon: Shield,
              },
            ]
          : []),
      ]
    : [
        {
          to: "/",
          label: "Home",
          icon: BookOpen,
          onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' })
        },
        {
          to: "/#features",
          label: "Features",
          icon: Compass,
        },
        {
          to: "/#community",
          label: "Communities",
          icon: Users,
        },
        {
          to: "/contributor-dashboard",
          label: "Contributor Dashboard",
          icon: LayoutDashboard,
        },
        {
          to: "/#faq",
          label: "FAQ",
          icon: MessageCircle,
        },
      ];
};
