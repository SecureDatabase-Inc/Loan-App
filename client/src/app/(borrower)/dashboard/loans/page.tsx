"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { LoanCard } from "@/components/dashboard/LoanCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Loader } from "@/components/ui/Loader";
import { LoanForm } from "@/components/forms/LoanForm";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { loanService } from "@/services/loan.service";
import { Loan } from "@/types/auth.types";

export default function LoansPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const user = useAuthStore((s) => s.user);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) loanService.getAll().then(setLoans).finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (isLoading) return <Loader fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      <DashboardHeader />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">My Loans</h2>
          <Button size="sm" onClick={() => setShowForm(true)}>New Loan</Button>
        </div>

        {loading ? (
          <Loader />
        ) : loans.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-secondary-500 mb-4">No loans yet</p>
            <Button onClick={() => setShowForm(true)}>Apply for First Loan</Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {loans.map((loan, i) => (
              <motion.div key={loan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <LoanCard loan={loan} onClick={() => router.push(`/dashboard/loans/detail?id=${loan.id}`)} />
              </motion.div>
            ))}
          </div>
        )}
      </main>
      <BottomNav />

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Apply for Loan">
        <LoanForm userLevel={user?.loanLevel || 1} onSuccess={() => { setShowForm(false); loanService.getAll().then(setLoans); }} />
      </Modal>
    </div>
  );
}
