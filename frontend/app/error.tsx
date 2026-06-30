"use client";

import Link from "next/link";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-[56px] sm:text-[72px] font-black text-gradient leading-none">
          500
        </h1>
        <h2 className="mt-2 sm:mt-3 text-[16px] sm:text-[18px] font-bold text-[#1A1A1A]">
          Something went wrong
        </h2>
        <p className="mt-2 text-[13px] text-[#777]">
          An unexpected error occurred. Please try again.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center bg-[#468284] px-5 py-2.5 text-[13px] font-bold text-white hover:bg-[#4fb38c] transition-all shadow-[0_4px_16px_rgba(70,130,132,0.3)]"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center border border-[#666666] bg-[#555555] px-5 py-2.5 text-[13px] font-bold text-white hover:bg-[#666666] hover:border-[#468284]/40 transition-all"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
