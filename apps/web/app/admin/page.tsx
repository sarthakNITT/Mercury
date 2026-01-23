"use client";

import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/categories"
          className="block p-6 border rounded-lg hover:shadow-lg transition"
        >
          <h2 className="text-xl font-semibold mb-2">Categories</h2>
          <p className="text-gray-500">Manage product categories</p>
        </Link>

        <Link
          href="/admin/products"
          className="block p-6 border rounded-lg hover:shadow-lg transition"
        >
          <h2 className="text-xl font-semibold mb-2">Products</h2>
          <p className="text-gray-500">Manage products, pricing, and stock</p>
        </Link>

        <Link
          href="/admin/users"
          className="block p-6 border rounded-lg hover:shadow-lg transition"
        >
          <h2 className="text-xl font-semibold mb-2">Users</h2>
          <p className="text-gray-500">Manage users and active sessions</p>
        </Link>
      </div>
    </div>
  );
}
