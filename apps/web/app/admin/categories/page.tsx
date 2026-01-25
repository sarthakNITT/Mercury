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
import { Trash2, Plus, Search } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Category {
  id: string;
  name: string;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/categories`, {
        headers: { "x-service-key": "dev-service-key" }, // Todo: secure this
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const createCategory = async () => {
    if (!newName) return;
    try {
      const res = await fetch(`${API_URL}/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-service-key": "dev-service-key",
        },
        body: JSON.stringify({ name: newName }),
      });
      if (res.ok) {
        setNewName("");
        fetchCategories();
      } else {
        const d = await res.json();
        setError(d.error || "Failed");
      }
    } catch {
      setError("Error creating category");
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Delete category?")) return;
    try {
      const res = await fetch(`${API_URL}/categories/${id}`, {
        method: "DELETE",
        headers: { "x-service-key": "dev-service-key" },
      });
      if (res.ok) {
        fetchCategories();
      } else {
        const d = await res.json();
        alert(d.error || "Failed");
      }
    } catch {
      alert("Error deleting category");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in-50">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
          <p className="text-muted-foreground mt-1">
            Manage product categories for the marketplace.
          </p>
        </div>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Create Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New Category Name"
              className="max-w-md bg-background/50"
            />
            <Button onClick={createCategory}>
              <Plus className="mr-2 h-4 w-4" />
              Create
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
            placeholder="Filter categories..."
            className="max-w-sm border-none shadow-none focus-visible:ring-0"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Name</TableHead>
              <TableHead>ID</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat.id} className="hover:bg-muted/30">
                <TableCell className="font-medium">{cat.name}</TableCell>
                <TableCell className="text-muted-foreground text-xs font-mono">
                  {cat.id}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteCategory(cat.id)}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {categories.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center h-24 text-muted-foreground"
                >
                  No categories found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
