"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BrandMark } from "@/components/brand/Logo";
import { useAuth } from "@/hooks/useAuth";

const HIGHLIGHTS = [
  { label: "Approval in minutes", icon: "⚡" },
  { label: "Mobile Money payout", icon: "📱" },
  { label: "No collateral needed", icon: "🔓" },
];

export default function WelcomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  // Returning, already-authenticated users go straight to their dashboard.
  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace("/dashboard");
  }, [isLoading, isAuthenticated, router]);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
  };
  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex min-h-screen flex-col px-6 pb-10 pt-14"
    >
      <motion.div variants={item} className="flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <BrandMark size={76} className="drop-shadow-sm" />
        </motion.div>
        <h1 className="mt-5 text-[26px] font-extrabold leading-tight tracking-tight text-secondary-900">
          BoA Micro Finance
        </h1>
        <p className="mt-1.5 text-sm text-secondary-500">Fast, trusted mobile loans in Ghana</p>
      </motion.div>

      <motion.div variants={item} className="mt-10 rounded-2xl border border-primary-100 bg-primary-50/70 p-5">
        <p className="text-[15px] font-bold text-secondary-900">Borrow with confidence</p>
        <p className="mt-1 text-sm leading-relaxed text-secondary-600">
          Apply in minutes, receive funds on your Mobile Money wallet, and build a higher limit with every
          repayment.
        </p>
      </motion.div>

      <motion.ul variants={item} className="mt-5 space-y-2.5">
        {HIGHLIGHTS.map((h) => (
          <li key={h.label} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-soft">
            <span className="text-lg" aria-hidden>
              {h.icon}
            </span>
            <span className="text-sm font-medium text-secondary-700">{h.label}</span>
          </li>
        ))}
      </motion.ul>

      <div className="mt-auto pt-10">
        <motion.div variants={item} className="space-y-3">
          <Link href="/register" className="btn-primary block w-full py-4 text-center text-base">
            Create Account
          </Link>
          <Link href="/login" className="btn-secondary block w-full py-4 text-center text-base">
            Log In
          </Link>
          <Link
            href="/home"
            className="block w-full rounded-xl px-4 py-3 text-center text-sm font-semibold text-secondary-500 transition-colors hover:bg-secondary-100 hover:text-secondary-700"
          >
            Continue as Guest
          </Link>
        </motion.div>

        <motion.p variants={item} className="mt-6 text-center text-[11px] leading-relaxed text-secondary-400">
          Your information is protected. Loan services require an account.
        </motion.p>
      </div>
    </motion.div>
  );
}
