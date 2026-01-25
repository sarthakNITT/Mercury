"use client";

import Link from "next/link";
import { Rocket } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-background/50 backdrop-blur-xl">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <Rocket className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl tracking-tight">Mercury</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Next-gen commerce intelligence stack. Real-time observability for
              modern marketplaces.
            </p>
            <div className="text-xs text-muted-foreground pt-2">
              Built for LavaPhunk Hackathon
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-sm">Platform</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/"
                  className="hover:text-foreground transition-colors"
                >
                  Marketplace
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="hover:text-foreground transition-colors"
                >
                  Live Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/admin"
                  className="hover:text-foreground transition-colors"
                >
                  Admin Console
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-sm">Resources</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link
                  href="#"
                  className="hover:text-foreground transition-colors"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-foreground transition-colors"
                >
                  API Status
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Mercury. All rights reserved.</p>
          <div className="flex gap-4">
            <span>v0.1.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
