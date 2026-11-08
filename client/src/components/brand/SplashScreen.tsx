"use client";

import { motion } from "framer-motion";
import { BrandMark } from "./Logo";

/**
 * In-app boot splash (distinct from the native Android launch screen).
 * It only covers authentication hydration — it never adds a fixed delay
 * beyond the short brand beat enforced by AppBoot.
 */
export function SplashScreen({ fading = false }: { fading?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: fading ? 0 : 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b from-primary-50 via-white to-white"
      role="status"
      aria-label="BoA Micro Finance is starting"
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative"
      >
        <span className="absolute inset-0 rounded-[22%] bg-primary-500/20 blur-xl" aria-hidden />
        <BrandMark size={88} className="relative drop-shadow-sm" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.4, ease: "easeOut" }}
        className="mt-6 text-xl font-extrabold tracking-tight text-secondary-900"
      >
        BoA Micro Finance
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.22, duration: 0.4 }}
        className="mt-1.5 text-xs font-medium text-secondary-500"
      >
        Fast, trusted mobile loans
      </motion.p>

      <div className="mt-10 h-1 w-28 overflow-hidden rounded-full bg-primary-100" aria-hidden>
        <motion.div
          className="h-full w-1/2 rounded-full bg-primary-500"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
}
