"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { List, ShoppingBag, Users } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Admin Dashboard</h3>
        <p className="text-sm text-muted-foreground">
          Manage your platform settings and data.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/admin/categories" className="block group">
          <Card className="transition-colors group-hover:bg-muted/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <List className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Manage</div>
              <p className="text-xs text-muted-foreground">
                View and edit product categories
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/products" className="block group">
          <Card className="transition-colors group-hover:bg-muted/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Inventory</div>
              <p className="text-xs text-muted-foreground">
                Manage products, prices and stock
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/users" className="block group">
          <Card className="transition-colors group-hover:bg-muted/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Accounts</div>
              <p className="text-xs text-muted-foreground">
                Manage users and permissions
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
