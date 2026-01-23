import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mercury Market Force",
  description: "Real-time marketplace intelligence demo",
};

import Navbar from "../components/Navbar";
import { NextAuthProvider } from "../components/NextAuthProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <NextAuthProvider>
          <div className="container">
            <Navbar />
            <main>{children}</main>
          </div>
        </NextAuthProvider>
      </body>
    </html>
  );
}
