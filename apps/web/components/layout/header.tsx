"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
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
    // Refresh page to apply context? No, just localStorage is fine as per old logic
    // But old select did it, so we should be fine.
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2">
            <Rocket className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl tracking-tight hidden sm:inline-block">
              Mercury
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link
              href="/"
              className="transition-colors hover:text-foreground/80 text-foreground/60 hover:underline"
            >
              Marketplace
            </Link>
            <Link
              href="/dashboard"
              className="transition-colors hover:text-foreground/80 text-foreground/60 hover:underline"
            >
              Live Dashboard
            </Link>
            {session?.user.role === "ADMIN" && (
              <Link
                href="/admin"
                className="transition-colors hover:text-foreground/80 text-foreground/60 hover:underline"
              >
                Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* User Selector or Auth */}
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <div className="flex items-center justify-center h-full w-full bg-primary/10 rounded-full">
                    <UserIcon className="h-4 w-4" />
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
                    className="h-9 gap-2 text-xs md:text-sm"
                  >
                    <UserIcon className="h-4 w-4" />
                    {activeUserName}
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-[200px] h-[300px] overflow-y-auto"
                >
                  <DropdownMenuLabel>Select Demo User</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {users.map((u) => (
                    <DropdownMenuItem
                      key={u.id}
                      onClick={() => handleUserChange(u.id, u.name)}
                    >
                      {u.name}
                      {activeUserId === u.id && (
                        <span className="ml-auto text-primary">✓</span>
                      )}
                    </DropdownMenuItem>
                  ))}
                  {users.length === 0 && (
                    <div className="p-2 text-xs text-muted-foreground">
                      No users found
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Link href="/login">
                <Button size="sm">Login</Button>
              </Link>
            </div>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
