"use client";

import * as React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";

export const AdvancedModeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDarkMode =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const toggleTheme = () => setTheme(isDarkMode ? "light" : "dark");

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative flex items-center gap-2 w-24 p-1.5 py-2 rounded-full bg-slate-200 dark:bg-slate-800 cursor-pointer transition-colors"
      aria-label="Toggle light or dark theme"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Sliding indicator */}
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`absolute top-1 h-7 w-11 rounded-full bg-white dark:bg-slate-600 shadow-md`}
        style={{
          left: isDarkMode ? "calc(100% - 46px)" : "4px",
        }}
      />

      {/* Icons with improved styling */}
      <div className={`relative z-10 w-1/2 flex items-center justify-center`}>
        <Sun
          className={`h-5 w-5 transition-colors duration-300 ${
            isDarkMode ? "text-amber-500/50 dark:text-gray-400" : "text-amber-500"
          }`}
        />
      </div>
      <div className={`relative z-10 w-1/2 flex items-center justify-center`}>
        <Moon
          className={`h-5 w-5 transition-colors duration-300 ${
            isDarkMode ? "text-gray-400" : "text-amber-500/50 dark:text-gray-600"
          }`}
        />
      </div>
    </motion.button>
  );
};