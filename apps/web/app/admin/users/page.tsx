"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, Search } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface User {
  id: string;
  name: string;
  email: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/users`, {
        headers: { "x-service-key": "dev-service-key" },
      });
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const createUser = async () => {
    if (!name || !email) return;
    try {
      const res = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-service-key": "dev-service-key",
        },
        body: JSON.stringify({ name, email }),
      });
      if (res.ok) {
        setName("");
        setEmail("");
        fetchUsers();
      } else {
        const d = await res.json();
        setError(d.error || "Failed");
      }
    } catch {
      setError("Error creating user");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in-50">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground mt-1">
            Manage user accounts and permissions.
          </p>
        </div>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Create New User</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="grid gap-2 flex-1 w-full">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="bg-background/50"
              />
            </div>
            <div className="grid gap-2 flex-1 w-full">
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="bg-background/50"
              />
            </div>
            <Button onClick={createUser} className="w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Create User
            </Button>
          </div>
          {error && (
            <div className="text-destructive mt-3 text-sm font-medium bg-destructive/10 p-2 rounded">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <div className="p-4 border-b flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter users..."
            className="max-w-sm border-none shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="rounded-md">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="font-mono text-xs">ID</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {u.email}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono">
                    {u.id}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      Active
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center h-32 text-muted-foreground"
                  >
                    No users found. Create one above.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
