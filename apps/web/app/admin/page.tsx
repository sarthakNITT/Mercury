"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { List, ShoppingBag, Users, ArrowRight } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="space-y-8 animate-in fade-in-50">
      <div>
        <h3 className="text-3xl font-bold tracking-tight">Admin Overview</h3>
        <p className="text-muted-foreground mt-1">
          Manage your platform settings and data.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/admin/categories"
          className="block group text-decoration-none"
        >
          <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50 bg-card/50 backdrop-blur-sm group-hover:border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                Categories
              </CardTitle>
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                <List className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">Manage</div>
              <p className="text-xs text-muted-foreground mt-1">
                View and edit product categories
              </p>
              <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0">
                Go to Categories <ArrowRight className="ml-1 h-3 w-3" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link
          href="/admin/products"
          className="block group text-decoration-none"
        >
          <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50 bg-card/50 backdrop-blur-sm group-hover:border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                Products
              </CardTitle>
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                <ShoppingBag className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">Inventory</div>
              <p className="text-xs text-muted-foreground mt-1">
                Manage products, prices and stock
              </p>
              <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0">
                Go to Products <ArrowRight className="ml-1 h-3 w-3" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/users" className="block group text-decoration-none">
          <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50 bg-card/50 backdrop-blur-sm group-hover:border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                Users
              </CardTitle>
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">Accounts</div>
              <p className="text-xs text-muted-foreground mt-1">
                Manage users and permissions
              </p>
              <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0">
                Go to Users <ArrowRight className="ml-1 h-3 w-3" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
