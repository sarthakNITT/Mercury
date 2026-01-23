"use client";

import { useState, useEffect } from "react";

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
    } catch (e) {
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
    } catch (e) {
      alert("Error deleting category");
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Manage Categories</h1>

      <div className="mb-8 flex gap-4">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New Category Name"
          className="p-2 border rounded"
        />
        <button
          onClick={createCategory}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Create
        </button>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map((cat) => (
              <tr key={cat.id}>
                <td className="px-6 py-4 whitespace-nowrap">{cat.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {cat.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => deleteCategory(cat.id)}
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
    </div>
  );
}
