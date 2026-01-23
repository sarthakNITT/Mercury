"use client";

import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Product {
  id: string;
  name: string;
  price: number;
  category: { id: string; name: string } | null;
  stock: number;
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
          stock: 100,
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
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Products</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {showForm ? "Cancel" : "Add Product"}
        </button>
      </div>

      {error && (
        <div className="p-4 mb-4 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      {showForm && (
        <div className="bg-gray-50 p-6 rounded-lg mb-8 border transition-all">
          <h2 className="text-lg font-semibold mb-4">New Product</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                className="w-full p-2 border rounded"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Price (Minor Units)
              </label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={newPrice}
                onChange={(e) => setNewPrice(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                className="w-full p-2 border rounded"
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
            <div>
              <label className="block text-sm font-medium mb-1">
                Image URL
              </label>
              <input
                className="w-full p-2 border rounded"
                value={newImage}
                onChange={(e) => setNewImage(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                className="w-full p-2 border rounded"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={createProduct}
            className="mt-4 bg-green-600 text-white px-6 py-2 rounded"
          >
            Save Product
          </button>
        </div>
      )}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {p.name}
                    </div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {p.id}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {p.category?.name || "Uncategorized"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {(p.price / 100).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => deleteProduct(p.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex justify-between items-center">
        <button
          disabled={page <= 1}
          onClick={() => fetchProducts(page - 1)}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => fetchProducts(page + 1)}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
