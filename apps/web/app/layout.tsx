import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mercury Market Force',
  description: 'Real-time marketplace intelligence demo',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <header className="header">
            <nav className="nav">
              <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                Mercury 🚀
              </Link>
              <ul>
                <li><Link href="/">Marketplace</Link></li>
                <li><Link href="/dashboard">Live Dashboard</Link></li>
              </ul>
            </nav>
          </header>
          <main>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
