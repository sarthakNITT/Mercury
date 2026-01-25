"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User as UserIcon, Rocket, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface User {
  id: string;
  name: string;
}

export function Header() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [activeUserId, setActiveUserId] = useState<string>("");
  const [activeUserName, setActiveUserName] = useState<string>("Select User");
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Load persistency
    const stored = localStorage.getItem("mercury.activeUserId");
    if (stored) setActiveUserId(stored);

    if (session?.user) {
      setActiveUserId(session.user.id);
      localStorage.setItem("mercury.activeUserId", session.user.id);
      return;
    }

    fetch(`${API_URL}/users`, {
      headers: { "x-service-key": "dev-service-key" },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setUsers(data);
          // If stored user matches one in list, find name
          if (stored) {
            const u = data.find((u) => u.id === stored);
            if (u) setActiveUserName(u.name);
          } else if (data.length > 0) {
            // Default to first
            setActiveUserId(data[0].id);
            setActiveUserName(data[0].name);
            localStorage.setItem("mercury.activeUserId", data[0].id);
          }
        }
      })
      .catch(console.error);
  }, [session]);

  const handleUserChange = (id: string, name: string) => {
    setActiveUserId(id);
    setActiveUserName(name);
    localStorage.setItem("mercury.activeUserId", id);
    window.location.reload();
  };

  const navLinks = [
    { href: "/", label: "Home" },
    ...(session ? [{ href: "/dashboard", label: "Dashboard" }] : []),
    ...(session?.user.role === "ADMIN"
      ? [{ href: "/admin", label: "Admin" }]
      : []),
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "bg-background/80 backdrop-blur-md shadow-sm border-b"
          : "bg-background/0 backdrop-blur-sm border-b border-transparent",
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="bg-primary/10 p-1.5 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Rocket className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:inline-block">
              Mercury
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-4 py-2 text-sm font-medium transition-colors relative",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute inset-x-0 -bottom-[10px] h-0.5 bg-primary animate-in fade-in zoom-in duration-300" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />

          <div className="h-6 w-px bg-border/50 hidden sm:block" />

          {/* User Selector or Auth */}
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <div className="flex items-center justify-center h-full w-full bg-primary/10 rounded-full text-primary font-medium">
                    {session.user.name?.[0]?.toUpperCase() || (
                      <UserIcon className="h-4 w-4" />
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {session.user.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              {/* Demo User Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 gap-2 text-xs md:text-sm bg-background/50 backdrop-blur-sm"
                  >
                    <UserIcon className="h-3.5 w-3.5 opacity-70" />
                    <span className="max-w-[100px] truncate">
                      {activeUserName}
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-[220px] max-h-[300px] overflow-y-auto"
                >
                  <DropdownMenuLabel>Select Active User</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {users.map((u) => (
                    <DropdownMenuItem
                      key={u.id}
                      onClick={() => handleUserChange(u.id, u.name)}
                      className="cursor-pointer"
                    >
                      {u.name}
                      {activeUserId === u.id && (
                        <span className="ml-auto text-primary">✓</span>
                      )}
                    </DropdownMenuItem>
                  ))}
                  {users.length === 0 && (
                    <div className="p-2 text-xs text-muted-foreground">
                      Loading users...
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Link href="/login">
                <Button size="sm" className="hidden sm:inline-flex">
                  Login
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
