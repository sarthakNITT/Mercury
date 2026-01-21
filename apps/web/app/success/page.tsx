"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function SuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const [status, setStatus] = useState<
    "PENDING" | "PAID" | "FAILED" | "LOADING"
  >("LOADING");
  const sessionId = searchParams.session_id;

  useEffect(() => {
    if (!sessionId) {
      setStatus("FAILED");
      return;
    }

    let intervalId: ReturnType<typeof setInterval> | undefined = undefined;
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"}/payments/status?sessionId=${sessionId}`,
        );
        const data = await res.json();

        if (data.status === "PAID") {
          setStatus("PAID");
          clearInterval(intervalId);
        } else if (data.status === "FAILED") {
          setStatus("FAILED");
          clearInterval(intervalId);
        } else {
          attempts++;
          if (attempts > 30) {
            setStatus("PENDING"); // Timeout but show pending
            clearInterval(intervalId);
          }
        }
      } catch (err) {
        console.error("Status check failed", err);
      }
    };

    checkStatus();
    intervalId = setInterval(checkStatus, 2000);

    return () => clearInterval(intervalId);
  }, [sessionId]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/90 text-white font-mono p-4">
      <div
        className={`border ${status === "PAID" ? "border-green-500/50 bg-green-900/10" : "border-yellow-500/50 bg-yellow-900/10"} p-12 text-center backdrop-blur-md rounded-lg shadow-[0_0_50px_rgba(34,197,94,0.2)]`}
      >
        <h1
          className={`text-4xl md:text-6xl font-black mb-6 ${status === "PAID" ? "text-green-400" : "text-yellow-400"}`}
        >
          {status === "PAID"
            ? "PAYMENT SUCCESSFUL"
            : status === "LOADING"
              ? "CONFIRMING..."
              : "PAYMENT PENDING"}
        </h1>
        <p
          className={`text-xl ${status === "PAID" ? "text-green-200/80" : "text-yellow-200/80"} mb-8`}
        >
          Session ID:{" "}
          <span
            className={status === "PAID" ? "text-green-400" : "text-yellow-400"}
          >
            {sessionId || "Unknown"}
          </span>
        </p>
        <p className="mb-8 text-neutral-400">
          {status === "PAID"
            ? "Your transaction has been securely processed."
            : "Please wait while we confirm your payment."}
        </p>
        <Link
          href="/"
          className={`inline-block px-8 py-3 ${status === "PAID" ? "bg-green-500 hover:bg-green-400" : "bg-yellow-500 hover:bg-yellow-400"} text-black font-bold transition-colors uppercase tracking-widest`}
        >
          Return to Market
        </Link>
      </div>
    </div>
  );
}
