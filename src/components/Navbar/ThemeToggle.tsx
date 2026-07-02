import React from "react";
import { Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { Theme } from "@/contexts/ThemeContext";

interface ThemeToggleProps {
  setTheme: (theme: Theme) => void;
}

export const ThemeToggle = React.memo(function ThemeToggle({ setTheme }: ThemeToggleProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl text-white hover:bg-white/10"
          aria-label="Change theme"
          title="Change theme"
        >
          <Moon className="h-5 w-5 text-cyan-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="z-[1001] bg-[#0b1329] border-white/10 text-white min-w-[12rem]">
        <DropdownMenuLabel className="text-gray-400 font-semibold text-xs px-2 py-1">Select Theme</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer focus:bg-white/10 hover:bg-white/10 focus:text-white px-3 py-2 text-sm rounded-lg" onClick={() => setTheme("default" as Theme)}>
          <span className="h-2 w-2 rounded-full bg-cyan-400" />
          <span className="text-cyan-400 font-medium">Default</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer focus:bg-white/10 hover:bg-white/10 focus:text-white px-3 py-2 text-sm rounded-lg" onClick={() => setTheme("purple" as Theme)}>
          <span className="h-2 w-2 rounded-full bg-purple-500" />
          <span className="text-purple-400 font-medium">Purple Galaxy</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer focus:bg-white/10 hover:bg-white/10 focus:text-white px-3 py-2 text-sm rounded-lg" onClick={() => setTheme("blue" as Theme)}>
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          <span className="text-blue-400 font-medium">Ocean Blue</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer focus:bg-white/10 hover:bg-white/10 focus:text-white px-3 py-2 text-sm rounded-lg" onClick={() => setTheme("green" as Theme)}>
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-green-400 font-medium">Neon Green</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer focus:bg-white/10 hover:bg-white/10 focus:text-white px-3 py-2 text-sm rounded-lg" onClick={() => setTheme("orange" as Theme)}>
          <span className="h-2 w-2 rounded-full bg-orange-500" />
          <span className="text-orange-400 font-medium">Sunset Orange</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer focus:bg-white/10 hover:bg-white/10 focus:text-white px-3 py-2 text-sm rounded-lg" onClick={() => setTheme("black-white" as Theme)}>
          <span className="h-2 w-2 rounded-full bg-black border border-white-400" />
          <span className="text-gray-300 font-medium">Black White</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
