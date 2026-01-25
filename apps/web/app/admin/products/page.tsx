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
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, X, Search } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Product {
  id: string;
  name: string;
  price: number;
  category: { id: string; name: string } | null;
  // stock removed
}

interface Category {
  id: string;
  name: string;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form State
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState(100);
  const [newCatId, setNewCatId] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newImage, setNewImage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file) return;

    setUploading(true);

    try {
      // 1. Get Presigned URL
      const res = await fetch(`${API_URL}/uploads/presign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-service-key": "dev-service-key",
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      });

      if (!res.ok) throw new Error("Failed to get presigned URL");
      const { uploadUrl, publicUrl } = await res.json();

      // 2. Upload to R2
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");

      setNewImage(publicUrl);
    } catch (err) {
      console.error(err);
      alert("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const fetchProducts = async (p = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/products?page=${p}&pageSize=10`, {
        headers: { "x-service-key": "dev-service-key" },
      });
      if (res.ok) {
        const data = await res.json();
        // Endpoint returns { data: [], pagination: {} }
        if (data.data) {
          // New format
          setProducts(data.data);
          setTotalPages(data.pagination.totalPages);
          setPage(data.pagination.page);
        } else if (Array.isArray(data)) {
          // Old format fallback
          setProducts(data);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/categories`, {
        headers: { "x-service-key": "dev-service-key" },
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
        if (data.length > 0) setNewCatId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts(1);
  }, []);

  const createProduct = async () => {
    if (!newName || !newCatId) {
      setError("Name and Category are required");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-service-key": "dev-service-key",
        },
        body: JSON.stringify({
          name: newName,
          price: Number(newPrice),
          categoryId: newCatId,
          description: newDesc,
          imageUrl: newImage,
          // stock removed
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setNewName("");
        setNewPrice(100);
        fetchProducts(1);
      } else {
        const d = await res.json();
        setError(d.error || "Failed");
      }
    } catch {
      setError("Error creating product");
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete product?")) return;
    try {
      await fetch(`${API_URL}/products/${id}`, {
        method: "DELETE",
        headers: { "x-service-key": "dev-service-key" },
      });
      fetchProducts(page);
    } catch {
      alert("Error deleting");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in-50">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground mt-1">
            Manage your product inventory level.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? (
            <X className="mr-2 h-4 w-4" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {showForm ? "Cancel" : "Add Product"}
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-destructive/15 text-destructive rounded-md text-sm font-medium">
          {error}
        </div>
      )}

      {showForm && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">New Product Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Product Name"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Price (Cents)</Label>
                <Input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(Number(e.target.value))}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <select
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newCatId}
                  onChange={(e) => setNewCatId(e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Image</Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    disabled={uploading}
                    className="file:text-primary bg-background/50"
                  />
                </div>
                {uploading && (
                  <div className="text-xs text-muted-foreground animate-pulse">
                    Uploading to R2...
                  </div>
                )}
                <Input
                  className="mt-2 bg-background/50"
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  placeholder="Or paste URL..."
                />
                {newImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={newImage}
                    alt="Preview"
                    className="mt-2 h-20 w-20 object-cover rounded border"
                  />
                )}
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Description</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Product details..."
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={createProduct}>Save Product</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="py-20 text-center text-muted-foreground animate-pulse">
          Loading products...
        </div>
      ) : (
        <Card className="border-border/50">
          <div className="p-4 border-b flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter products..."
              className="max-w-sm border-none shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="rounded-md">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {p.id}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground">
                        {p.category?.name || "Uncategorized"}
                      </span>
                    </TableCell>
                    <TableCell>${(p.price / 100).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteProduct(p.id)}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {products.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center h-32 text-muted-foreground"
                    >
                      No products found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchProducts(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </Button>
        <div className="text-sm font-medium">
          Page {page} of {totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchProducts(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
