"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface User {
  id: string;
  name: string;
}

export default function Navbar() {
  const [users, setUsers] = useState<User[]>([]);
  const [activeUserId, setActiveUserId] = useState<string>("");
  const pathname = usePathname();

  useEffect(() => {
    // Load active user
    const stored = localStorage.getItem("mercury.activeUserId");
    if (stored) setActiveUserId(stored);

    // Fetch users
    fetch(`${API_URL}/users`, {
      headers: { "x-service-key": "dev-service-key" }, // Ideally from env
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setUsers(data);
          if (!stored && data.length > 0) {
            setActiveUserId(data[0].id);
            localStorage.setItem("mercury.activeUserId", data[0].id);
          }
        }
      })
      .catch(console.error);
  }, []);

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setActiveUserId(id);
    localStorage.setItem("mercury.activeUserId", id);
  };

  return (
    <header className="header" style={{ marginBottom: "2rem" }}>
      <nav
        className="nav"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          <Link
            href="/"
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            Mercury 🚀
          </Link>
          <ul
            style={{
              display: "flex",
              gap: "1rem",
              listStyle: "none",
              margin: 0,
              padding: 0,
            }}
          >
            <li>
              <Link href="/">Marketplace</Link>
            </li>
            <li>
              <Link href="/dashboard">Live Dashboard</Link>
            </li>
            <li>
              <Link href="/admin">Admin</Link>
            </li>
          </ul>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: "0.9rem", color: "#666" }}>
            Active User:
          </span>
          <select
            value={activeUserId}
            onChange={handleUserChange}
            style={{
              padding: "0.5rem",
              borderRadius: "4px",
              border: "1px solid #ddd",
            }}
          >
            <option value="">-- Select User --</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      </nav>
    </header>
  );
}
