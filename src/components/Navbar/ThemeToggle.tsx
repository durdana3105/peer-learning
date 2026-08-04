import React from "react";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { useTheme, Theme } from "@/contexts/ThemeContext";

interface ThemeToggleProps {
  setTheme?: (theme: Theme) => void;
}

export const ThemeToggle = React.memo(function ThemeToggle({ setTheme: propSetTheme }: ThemeToggleProps) {
  const { theme, setTheme: contextSetTheme, mode, setMode, isDarkMode } = useTheme();
  const setTheme = propSetTheme || contextSetTheme;

  return (
    <div className="flex items-center gap-1">
      {/* Quick Dark/Light Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setMode(isDarkMode ? "light" : "dark")}
        className="h-10 w-10 rounded-xl text-gray-300 hover:text-white hover:bg-white/10"
        aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDarkMode ? (
          <Sun className="h-5 w-5 text-amber-400" />
        ) : (
          <Moon className="h-5 w-5 text-cyan-400" />
        )}
      </Button>

      {/* Theme & Mode Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl text-gray-300 hover:text-white hover:bg-white/10"
            aria-label="Theme options"
            title="Theme options"
          >
            <span className="h-4 w-4 rounded-full border border-white/20 bg-gradient-to-tr from-cyan-400 to-purple-500 inline-block" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="z-[1001] bg-[#0b1329] border-white/10 text-white min-w-[13rem]">
          <DropdownMenuLabel className="text-gray-400 font-semibold text-xs px-2 py-1">Appearance</DropdownMenuLabel>
          <DropdownMenuItem
            className="flex items-center justify-between cursor-pointer focus:bg-white/10 hover:bg-white/10 focus:text-white px-3 py-2 text-sm rounded-lg"
            onClick={() => setMode("light")}
          >
            <span className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-amber-400" />
              <span>Light Mode</span>
            </span>
            {mode === "light" && <Check className="h-4 w-4 text-cyan-400" />}
          </DropdownMenuItem>

          <DropdownMenuItem
            className="flex items-center justify-between cursor-pointer focus:bg-white/10 hover:bg-white/10 focus:text-white px-3 py-2 text-sm rounded-lg"
            onClick={() => setMode("dark")}
          >
            <span className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-cyan-400" />
              <span>Dark Mode</span>
            </span>
            {mode === "dark" && <Check className="h-4 w-4 text-cyan-400" />}
          </DropdownMenuItem>

          <DropdownMenuItem
            className="flex items-center justify-between cursor-pointer focus:bg-white/10 hover:bg-white/10 focus:text-white px-3 py-2 text-sm rounded-lg"
            onClick={() => setMode("system")}
          >
            <span className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-purple-400" />
              <span>System Preference</span>
            </span>
            {mode === "system" && <Check className="h-4 w-4 text-cyan-400" />}
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuLabel className="text-gray-400 font-semibold text-xs px-2 py-1">Color Palette</DropdownMenuLabel>

          <DropdownMenuItem className="flex items-center justify-between cursor-pointer focus:bg-white/10 hover:bg-white/10 focus:text-white px-3 py-2 text-sm rounded-lg" onClick={() => setTheme("default" as Theme)}>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
              <span className="text-cyan-400 font-medium">Default</span>
            </span>
            {theme === "default" && <Check className="h-4 w-4 text-cyan-400" />}
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center justify-between cursor-pointer focus:bg-white/10 hover:bg-white/10 focus:text-white px-3 py-2 text-sm rounded-lg" onClick={() => setTheme("purple" as Theme)}>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
              <span className="text-purple-400 font-medium">Purple Galaxy</span>
            </span>
            {theme === "purple" && <Check className="h-4 w-4 text-cyan-400" />}
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center justify-between cursor-pointer focus:bg-white/10 hover:bg-white/10 focus:text-white px-3 py-2 text-sm rounded-lg" onClick={() => setTheme("blue" as Theme)}>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span className="text-blue-400 font-medium">Ocean Blue</span>
            </span>
            {theme === "blue" && <Check className="h-4 w-4 text-cyan-400" />}
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center justify-between cursor-pointer focus:bg-white/10 hover:bg-white/10 focus:text-white px-3 py-2 text-sm rounded-lg" onClick={() => setTheme("green" as Theme)}>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
              <span className="text-green-400 font-medium">Neon Green</span>
            </span>
            {theme === "green" && <Check className="h-4 w-4 text-cyan-400" />}
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center justify-between cursor-pointer focus:bg-white/10 hover:bg-white/10 focus:text-white px-3 py-2 text-sm rounded-lg" onClick={() => setTheme("orange" as Theme)}>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
              <span className="text-orange-400 font-medium">Sunset Orange</span>
            </span>
            {theme === "orange" && <Check className="h-4 w-4 text-cyan-400" />}
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center justify-between cursor-pointer focus:bg-white/10 hover:bg-white/10 focus:text-white px-3 py-2 text-sm rounded-lg" onClick={() => setTheme("black-white" as Theme)}>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-black border border-white" />
              <span className="text-gray-300 font-medium">Black White</span>
            </span>
            {theme === "black-white" && <Check className="h-4 w-4 text-cyan-400" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});

