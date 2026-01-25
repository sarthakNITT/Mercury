import type { Metadata } from "next";
import { Inter } from "next/font/google"; // [NEW]
import "./globals.css";
import { ThemeProvider } from "@/components/providers";
import { AppShell } from "@/components/layout/app-shell";
import { NextAuthProvider } from "@/components/NextAuthProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" }); // [NEW]

export const metadata: Metadata = {
  title: "Mercury Market Force",
  description: "Real-time marketplace intelligence demo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <NextAuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <AppShell>{children}</AppShell>
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
