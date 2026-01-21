export default function SuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/90 text-white font-mono p-4">
      <div className="border border-green-500/50 bg-green-900/10 p-12 text-center backdrop-blur-md rounded-lg shadow-[0_0_50px_rgba(34,197,94,0.2)]">
        <h1 className="text-4xl md:text-6xl font-black mb-6 text-green-400">
          PAYMENT SUCCESSFUL
        </h1>
        <p className="text-xl text-green-200/80 mb-8">
          Session ID:{" "}
          <span className="text-green-400">
            {searchParams.session_id || "Unknown"}
          </span>
        </p>
        <p className="mb-8 text-neutral-400">
          Your transaction has been securely processed.
        </p>
        <a
          href="/"
          className="inline-block px-8 py-3 bg-green-500 text-black font-bold hover:bg-green-400 transition-colors uppercase tracking-widest"
        >
          Return to Market
        </a>
      </div>
    </div>
  );
}
