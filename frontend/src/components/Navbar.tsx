"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, Moon, Laptop, BookOpen, Upload, Library, Volume2 } from "lucide-react";
import { useTheme } from "./ThemeContext";
import Logo from "./Logo";

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
      <div className="mx-auto max-w-6xl rounded-full bg-black/5 dark:bg-white/5 p-1.5 ring-1 ring-black/5 dark:ring-white/10 backdrop-blur-md">
        {/* Inner Core */}
        <div className="flex items-center justify-between px-8 py-3.5 rounded-full bg-white/70 dark:bg-black/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
          {/* Logo */}
          <Link href="/">
            <Logo />
          </Link>
 
          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-premium ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
 
          {/* Settings & Theme Selector */}
          <div className="flex items-center gap-3">
            {/* Quick Link for Mobile */}
            <div className="flex md:hidden items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`p-2.5 rounded-full transition-premium ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-muted-foreground"
                    }`}
                    title={item.label}
                  >
                    <Icon className="w-5 h-5" />
                  </Link>
                );
              })}
            </div>
 
            {/* Theme Toggle Button */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-premium active:scale-95"
                title="Theme Settings"
              >
                {theme === "light" && <Sun className="w-5 h-5" />}
                {theme === "dark" && <Moon className="w-5 h-5" />}
                {theme === "system" && <Laptop className="w-5 h-5" />}
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
