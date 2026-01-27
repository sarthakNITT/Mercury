"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Promote() {
  const { data: session } = useSession();
  const [status, setStatus] = useState("");

  const promote = async () => {
    if (!session?.user?.email) return;
    try {
      const res = await fetch("/api/promote", {
        method: "POST",
        body: JSON.stringify({ email: session.user.email }),
      });
      if (res.ok) setStatus("Success! Sign out and sign in again.");
      else setStatus("Failed");
    } catch {
      setStatus("Error");
    }
  };

  return (
    <div className="p-20 text-center">
      <h1>Current Role: {session?.user?.role || "Current User is null"}</h1>
      <Button onClick={promote}>Promote Me to Admin</Button>
      <p>{status}</p>
    </div>
  );
}
