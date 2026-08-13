"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, Moon, Laptop, BookOpen, Upload, Library, Volume2 } from "lucide-react";
import { useTheme } from "./ThemeContext";

export default function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const navItems = [
    { href: "/library", label: "Library", icon: Library },
    { href: "/upload", label: "Upload", icon: Upload },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-4">
      {/* Double Bezel Outer Enclosure */}
      <div className="mx-auto max-w-5xl rounded-full bg-black/5 dark:bg-white/5 p-1 ring-1 ring-black/5 dark:ring-white/10 backdrop-blur-md">
        {/* Inner Core */}
        <div className="flex items-center justify-between px-6 py-2 rounded-full bg-white/70 dark:bg-black/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center transition-premium active:scale-95">
              <Volume2 className="w-4 h-4" />
            </div>
            <span className="font-semibold tracking-tight text-sm font-sans">
              Readify <span className="text-muted-foreground font-normal">AI</span>
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-premium ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Settings & Theme Selector */}
          <div className="flex items-center gap-2">
            {/* Quick Link for Mobile */}
            <div className="flex md:hidden items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`p-2 rounded-full transition-premium ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-muted-foreground"
                    }`}
                    title={item.label}
                  >
                    <Icon className="w-4 h-4" />
                  </Link>
                );
              })}
            </div>

            {/* Theme Toggle Button */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-premium active:scale-95"
                title="Theme Settings"
              >
                {theme === "light" && <Sun className="w-4 h-4" />}
                {theme === "dark" && <Moon className="w-4 h-4" />}
                {theme === "system" && <Laptop className="w-4 h-4" />}
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setDropdownOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-32 rounded-2xl border border-border bg-popover p-1.5 shadow-lg z-20">
                    <button
                      onClick={() => {
                        setTheme("light");
                        setDropdownOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2 rounded-xl text-left text-xs transition-premium ${
                        theme === "light" ? "bg-muted font-medium" : "hover:bg-muted/50"
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5" /> Light
                    </button>
                    <button
                      onClick={() => {
                        setTheme("dark");
                        setDropdownOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2 rounded-xl text-left text-xs transition-premium ${
                        theme === "dark" ? "bg-muted font-medium" : "hover:bg-muted/50"
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5" /> Dark
                    </button>
                    <button
                      onClick={() => {
                        setTheme("system");
                        setDropdownOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2 rounded-xl text-left text-xs transition-premium ${
                        theme === "system" ? "bg-muted font-medium" : "hover:bg-muted/50"
                      }`}
                    >
                      <Laptop className="w-3.5 h-3.5" /> System
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
