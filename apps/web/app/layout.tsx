import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mercury Market Force",
  description: "Real-time marketplace intelligence demo",
};

import Navbar from "../components/Navbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <Navbar />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
