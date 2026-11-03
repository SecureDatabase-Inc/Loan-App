"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AuthPrompt } from "@/components/auth/AuthPrompt";
import { BrandMark } from "@/components/brand/Logo";

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/80 backdrop-blur-lg shadow-sm" : "bg-transparent"}`}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-2">
            <BrandMark size={28} />
            <span className="text-xl font-extrabold text-gradient">BoA Micro Finance</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost">Sign In</Link>
            <Link href="/register" className="btn-primary !py-2 !px-4">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex items-center bg-gradient-to-b from-primary-50/50 to-white pt-16">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 bg-soft-green px-4 py-2 rounded-full text-sm font-medium text-primary-700 mb-6">
                <span className="size-2 rounded-full bg-primary-500 animate-pulse" />
                Trusted by thousands in Ghana
              </div>
              <h1 className="text-4xl lg:text-6xl font-extrabold text-secondary-900 leading-tight mb-6">
                Fast & Trusted{" "}
                <span className="text-gradient">Mobile Loans</span> in Ghana
              </h1>
              <p className="text-lg text-secondary-500 mb-8 max-w-lg">
                Get instant loans directly to your Mobile Money. No paperwork. No collateral. 
                Competitive rates starting from just 5%.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register" className="btn-primary text-center">Create Free Account</Link>
                <Link href="/login" className="btn-secondary text-center">Sign In</Link>
              </div>
              <p className="mt-5 text-sm text-secondary-500">
                Browsing as a guest?{" "}
                <button
                  type="button"
                  onClick={() => setPromptOpen(true)}
                  className="font-semibold text-primary-600 hover:underline"
                >
                  Apply for a loan
                </button>{" "}
                — you&apos;ll need an account to continue.
              </p>
              <div className="flex items-center gap-8 mt-10 pt-10 border-t border-secondary-100">
                {["GHS 10K+", "5 Min", "4.8 ★"].map((stat) => (
                  <div key={stat}>
                    <p className="font-bold text-secondary-800">{stat.split(" ")[0]}</p>
                    <p className="text-xs text-secondary-400">{stat.split(" ").slice(1).join(" ")}</p>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="hidden lg:block">
              <div className="relative">
                <div className="w-80 h-[500px] mx-auto bg-gradient-to-b from-primary-500/10 to-soft-green rounded-[3rem] border-4 border-secondary-200 shadow-soft p-4">
                  <div className="h-full rounded-2xl bg-white p-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700" />
                      <div>
                        <p className="font-semibold text-sm">Welcome back</p>
                        <p className="text-xs text-secondary-400">Your balance</p>
                      </div>
                    </div>
                    <div className="bg-soft-green rounded-2xl p-4">
                      <p className="text-xs text-primary-700">Available Limit</p>
                      <p className="text-2xl font-bold text-primary-700">GHS 500</p>
                    </div>
                    <div className="space-y-2">
                      {[100, 200, 300].map((a) => (
                        <div key={a} className="bg-secondary-50 rounded-xl p-3 flex justify-between items-center">
                          <span className="font-semibold text-sm">GHS {a}</span>
                          <span className="text-xs text-primary-500 font-medium">{a * 0.1}% interest</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Why Choose BoA Micro Finance?</h2>
            <p className="text-secondary-500">Designed for Ghanaians, by Ghanaians</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Instant Approval", desc: "Get approved in minutes, not days", icon: "⚡" },
              { title: "Mobile Money", desc: "Receive funds directly to your MoMo wallet", icon: "📱" },
              { title: "Low Interest", desc: "Rates starting from just 5%", icon: "📉" },
              { title: "No Collateral", desc: "No assets needed to secure your loan", icon: "🔓" },
              { title: "6-Day Cycle", desc: "Short-term loans for quick needs", icon: "⏱️" },
              { title: "Build Credit", desc: "Unlock higher limits with each repayment", icon: "📈" },
            ].map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="card hover:shadow-md transition-shadow">
                <span className="text-2xl mb-3 block">{f.icon}</span>
                <h3 className="font-bold mb-1">{f.title}</h3>
                <p className="text-sm text-secondary-500">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-secondary-50">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">How It Works</h2>
            <p className="text-secondary-500">Three simple steps to get your loan</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Create Account", desc: "Register with your phone number and verify your identity" },
              { step: "02", title: "Apply for Loan", desc: "Choose your amount and submit your application" },
              { step: "03", title: "Get Funded", desc: "Receive money in your Mobile Money wallet instantly" },
            ].map((item) => (
              <motion.div key={item.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
                <div className="size-16 rounded-full bg-primary-500 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-secondary-500">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Loan Levels */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Loan Levels</h2>
            <p className="text-secondary-500">Higher repayments unlock bigger loans</p>
          </motion.div>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { level: "Bronze", amount: "GHS 100", rate: "10%", color: "bg-orange-100 text-orange-700" },
              { level: "Silver", amount: "GHS 300", rate: "8%", color: "bg-gray-100 text-gray-700" },
              { level: "Gold", amount: "GHS 500", rate: "7%", color: "bg-yellow-100 text-yellow-700" },
              { level: "Platinum", amount: "GHS 1,000", rate: "5%", color: "bg-blue-100 text-blue-700" },
            ].map((l) => (
              <motion.div key={l.level} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="card text-center">
                <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium mb-3 ${l.color}`}>{l.level}</div>
                <p className="text-2xl font-bold mb-1">{l.amount}</p>
                <p className="text-sm text-secondary-400">From {l.rate}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <button type="button" onClick={() => setPromptOpen(true)} className="btn-primary">
              Apply for a loan
            </button>
            <p className="mt-3 text-xs text-secondary-400">
              Guests can browse, but loan applications need an account.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary-500 to-primary-700">
        <div className="max-w-2xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-white/80 mb-8">Join thousands of Ghanaians using BoA Micro Finance for their financial needs.</p>
          <Link href="/register" className="inline-block bg-white text-primary-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-primary-50 transition-colors">
            Create Free Account
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: "How fast will I get my loan?", a: "Approved loans are processed within minutes and sent directly to your Mobile Money wallet." },
              { q: "What do I need to apply?", a: "Just your Ghana phone number and a valid Ghana Card for verification." },
              { q: "How do I repay my loan?", a: "Send the repayment amount to our Mobile Money number. The admin will confirm and clear your loan." },
              { q: "Can I get a second loan?", a: "Only after fully repaying your current loan. This helps you build credit for higher limits." },
            ].map((faq) => (
              <details key={faq.q} className="card group">
                <summary className="font-semibold cursor-pointer list-none flex items-center justify-between">
                  {faq.q}
                  <svg className="size-5 text-secondary-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-3 text-sm text-secondary-500">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-2xl font-bold text-gradient mb-4">BoA Micro Finance</p>
          <p className="text-secondary-400 text-sm mb-6">Fast, trusted mobile loans in Ghana</p>
          <div className="flex justify-center gap-6 text-sm text-secondary-400 mb-6">
            <span>Terms of Service</span>
            <span>Privacy Policy</span>
            <span>Contact Us</span>
          </div>
          <p className="text-xs text-secondary-500">&copy; {new Date().getFullYear()} BoA Micro Finance. All rights reserved.</p>
        </div>
      </footer>

      <AuthPrompt isOpen={promptOpen} onClose={() => setPromptOpen(false)} nextPath="/dashboard" />
    </div>
  );
}
