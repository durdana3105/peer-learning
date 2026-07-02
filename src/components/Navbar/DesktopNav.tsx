import React from "react";
import { Link, useLocation } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { getNavLinks } from "./navLinks";

interface DesktopNavProps {
  user: User | null;
  isAdmin: boolean;
}

export const DesktopNav = React.memo(function DesktopNav({ user, isAdmin }: DesktopNavProps) {
  const location = useLocation();
  const navLinks = getNavLinks(user, isAdmin);

  return (
    <div className="hidden items-center gap-3 md:flex">
      {navLinks.map((link) => {
        const Icon = link.icon;

        const active =
          link.to === "/"
            ? location.pathname === "/" && !location.hash
            : link.to.startsWith("/#")
            ? location.hash === link.to.replace("/", "")
            : location.pathname === link.to;

        const className = `flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300
          ${
            active
              ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-lg shadow-cyan-500/20"
              : "text-gray-300 hover:bg-white/10 hover:text-white"
          }`;

        if (
          link.to === "/#features" ||
          link.to === "/#community" ||
          link.to === "/#faq"
        ) {
          return (
            <a
              key={link.to}
              href={link.to.replace("/", "")}
              className={className}
            >
              <Icon size={16} />
              {link.label}
            </a>
          );
        }

        return (
          <Link
            key={link.to}
            to={link.to}
            className={className}
            onClick={link.onClick}
          >
            <Icon size={16} />
            {link.label}
          </Link>
        );
      })}
    </div>
  );
});
