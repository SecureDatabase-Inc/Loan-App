"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { ActiveLoanCard } from "@/components/dashboard/ActiveLoanCard";
import { LoanLevelCard } from "@/components/dashboard/LoanLevelCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Loader } from "@/components/ui/Loader";
import { LoanForm } from "@/components/forms/LoanForm";
import { RepaymentForm } from "@/components/forms/RepaymentForm";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { loanService } from "@/services/loan.service";
import { userService } from "@/services/user.service";
import { Loan } from "@/types/auth.types";
import { Verification } from "@/types/user.types";
import { formatCurrency } from "@/utils/formatCurrency";
import { LOAN_LEVELS } from "@/utils/constants";
import { verificationProgress } from "@/utils/verificationStatus";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const user = useAuthStore((s) => s.user);
  const [activeLoan, setActiveLoan] = useState<Loan | null>(null);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [showRepayment, setShowRepayment] = useState(false);
  const [loadingLoan, setLoadingLoan] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loanService.getCurrent().then(setActiveLoan).finally(() => setLoadingLoan(false));
      userService.getVerifications().then(setVerifications).catch(() => {});
    }
  }, [isAuthenticated]);

  if (isLoading) return <Loader fullScreen />;

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const vProgress = verificationProgress(verifications);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      <DashboardHeader />
      <motion.main variants={container} initial="hidden" animate="show" className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Level & Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div variants={item}>
            <LoanLevelCard currentLevel={user?.loanLevel || 1} />
          </motion.div>
          <motion.div variants={item} className="card flex flex-col justify-between">
            <p className="text-sm text-secondary-500">Status</p>
            {user?.verified ? (
              <div>
                <span className="chip chip-paid mt-1">Verified</span>
                <button className="block text-xs text-primary-500 mt-1" onClick={() => router.push("/dashboard/verification")}>
                  View verification →
                </button>
              </div>
            ) : (
              <div>
                <span className="chip chip-pending mt-1">Unverified</span>
                <p className="text-xs text-secondary-400 mt-1">
                  {vProgress.done}/{vProgress.total} documents approved
                </p>
                <Button size="sm" variant="ghost" className="mt-1 !p-0 !text-primary-500" onClick={() => router.push("/dashboard/verification")}>
                  Verify now →
                </Button>
              </div>
            )}
          </motion.div>
        </div>

        {/* Active Loan or Apply */}
        <motion.div variants={item}>
          {loadingLoan ? (
            <Loader size="sm" />
          ) : activeLoan && activeLoan.status === "active" ? (
            <div className="space-y-3">
              <ActiveLoanCard loan={activeLoan} onClick={() => router.push(`/dashboard/loans/detail?id=${activeLoan.id}`)} />
              <Button fullWidth onClick={() => setShowRepayment(true)}>
                Repay Now
              </Button>
            </div>
          ) : activeLoan && activeLoan.status === "approved" ? (
            <div className="card text-center py-8">
              <p className="text-lg font-semibold mb-1">Loan Approved</p>
              <p className="text-sm text-secondary-500 mb-4">
                Your loan of {formatCurrency(activeLoan.amount)} is approved. Repay{" "}
                {formatCurrency(activeLoan.amount + (activeLoan.amount * activeLoan.interestRate) / 100)} when ready.
              </p>
              <div className="flex flex-col gap-2">
                <Button fullWidth onClick={() => setShowRepayment(true)}>Repay Now</Button>
                <Button fullWidth variant="ghost" onClick={() => router.push(`/dashboard/loans/detail?id=${activeLoan.id}`)}>
                  View Loan Details
                </Button>
              </div>
            </div>
          ) : activeLoan && activeLoan.status === "overdue" ? (
            <div className="card text-center py-8">
              <p className="text-lg font-semibold mb-1">Loan Overdue</p>
              <p className="text-sm text-secondary-500 mb-4">
                Your loan of {formatCurrency(activeLoan.amount)} is overdue. Repay it to unlock your next loan.
              </p>
              <div className="flex flex-col gap-2">
                <Button fullWidth onClick={() => setShowRepayment(true)}>Repay Now</Button>
                <Button fullWidth variant="ghost" onClick={() => router.push(`/dashboard/loans/detail?id=${activeLoan.id}`)}>
                  View Loan Details
                </Button>
              </div>
            </div>
          ) : activeLoan && activeLoan.status === "pending" ? (
            <div className="card text-center py-8">
              <p className="text-lg font-semibold mb-1">Loan Pending</p>
              <p className="text-sm text-secondary-500">Your application is being reviewed. We&apos;ll notify you once approved.</p>
            </div>
          ) : (
            <div className="card text-center py-8">
              <p className="text-lg font-semibold mb-1">No Active Loan</p>
              <p className="text-sm text-secondary-500 mb-4">
                Your limit: {formatCurrency(LOAN_LEVELS[Math.min((user?.loanLevel || 1) - 1, LOAN_LEVELS.length - 1)].maxAmount)}
              </p>
              <Button onClick={() => setShowLoanForm(true)}>Apply for Loan</Button>
            </div>
          )}
        </motion.div>
      </motion.main>

      <BottomNav />

      <Modal isOpen={showLoanForm} onClose={() => setShowLoanForm(false)} title="Apply for Loan">
        <LoanForm
          userLevel={user?.loanLevel || 1}
          onSuccess={() => { setShowLoanForm(false); loanService.getCurrent().then(setActiveLoan); }}
        />
      </Modal>

      {activeLoan && (
        <Modal isOpen={showRepayment} onClose={() => setShowRepayment(false)} title="Repay Loan">
          <RepaymentForm
            loanId={activeLoan.id}
            amount={activeLoan.amount + (activeLoan.amount * activeLoan.interestRate) / 100}
            onSuccess={() => { setShowRepayment(false); loanService.getCurrent().then(setActiveLoan); }}
          />
        </Modal>
      )}
    </div>
  );
}
