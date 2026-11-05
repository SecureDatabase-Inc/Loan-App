"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Loader } from "@/components/ui/Loader";
import { RepaymentForm } from "@/components/forms/RepaymentForm";
import { loanService } from "@/services/loan.service";
import { LoanDetail, Repayment } from "@/types/auth.types";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate, formatDateTime } from "@/utils/formatDate";
import { STATUS_CONFIG } from "@/utils/constants";

interface TimelineStep {
  label: string;
  date?: string;
  done: boolean;
  current?: boolean;
}

const IN_LOAN = new Set(["active", "overdue", "approved", "pending"]);

/**
 * Static-export compatible loan detail route. The loan id is passed as
 * `/dashboard/loans/detail?id=...` instead of a dynamic path segment, because
 * `output: "export"` cannot emit a page for an unbounded `[id]` param.
 */
export default function LoanDetailPage() {
  const router = useRouter();
  const [loan, setLoan] = useState<LoanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRepayment, setShowRepayment] = useState(false);
  const [loanId, setLoanId] = useState<string | null>(null);
  const [queryReady, setQueryReady] = useState(false);

  // Read from window.location instead of useSearchParams() so the page does not
  // require a Suspense boundary in the static export.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    setLoanId(id);
    setQueryReady(true);
  }, []);

  useEffect(() => {
    if (!queryReady) return;
    if (!loanId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    loanService
      .getById(loanId)
      .then(setLoan)
      .catch(() => setLoan(null))
      .finally(() => setLoading(false));
  }, [loanId, queryReady]);

  if (loading) return <Loader fullScreen />;

  if (!loan) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <main className="max-w-2xl mx-auto px-4 py-10 text-center">
          <p className="text-lg font-semibold mb-2">Loan not found</p>
          <p className="text-sm text-secondary-500 mb-4">It may have been removed or you don&apos;t have access.</p>
          <Button onClick={() => router.push("/dashboard/loans")}>Back to Loans</Button>
        </main>
      </div>
    );
  }

  const config = STATUS_CONFIG[loan.status] || STATUS_CONFIG.pending;
  const canRepay = (loan.status === "active" || loan.status === "overdue") && loan.repayments.some((r) => r.status === "pending");

  const steps: TimelineStep[] = [
    { label: "Application submitted", date: loan.createdAt, done: true },
  ];
  if (loan.status === "rejected") {
    steps.push({ label: "Application rejected", done: true, current: true });
  } else {
    if (loan.approvedAt) {
      steps.push({ label: "Approved", date: loan.approvedAt, done: true });
    }
    if (loan.status === "active" || loan.status === "overdue") {
      steps.push({
        label: loan.status === "overdue" ? "Payment overdue" : "Loan disbursed",
        date: loan.dueDate || undefined,
        done: loan.status === "overdue",
        current: loan.status === "active",
      });
    }
    if (loan.status === "repaid") {
      steps.push({ label: "Fully repaid", date: loan.repaidAt || undefined, done: true, current: true });
    }
    if (loan.status === "pending" || loan.status === "approved") {
      steps[steps.length - 1] = { label: "Under review", date: loan.createdAt, done: false, current: true };
    }
  }

  const pendingRepay: Repayment | undefined = loan.repayments.find((r) => r.status === "pending");

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      <DashboardHeader />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/dashboard/loans")} className="text-sm text-secondary-500 hover:text-primary-600 flex items-center gap-1">
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Loans
          </button>
          <span className={config.color}>{config.label}</span>
        </div>

        {/* Summary */}
        <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-5 text-white">
          <p className="text-sm text-white/70 mb-1">Loan Amount</p>
          <p className="text-3xl font-bold mb-4">{formatCurrency(loan.amount)}</p>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-white/70 mb-1">Total to repay</p>
              <p className="text-lg font-semibold">{formatCurrency(loan.totalDue)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/70 mb-1">Interest</p>
              <p className="text-lg font-semibold">{loan.interestRate}%</p>
            </div>
          </div>
          {loan.daysRemaining !== null && (loan.status === "active" || loan.status === "overdue") && (
            <div className={`mt-4 bg-white/10 rounded-xl p-3 text-sm ${loan.status === "overdue" ? "text-yellow-200" : ""}`}>
              {loan.status === "overdue"
                ? `Payment overdue — settle to clear the loan`
                : `Due in ${loan.daysRemaining} day${loan.daysRemaining === 1 ? "" : "s"}`}
            </div>
          )}
        </div>

        {/* Key facts */}
        <div className="card">
          <h3 className="font-semibold mb-3">Loan Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-secondary-500">Purpose</span>
              <span className="font-medium text-secondary-800">{loan.purpose || "General purpose"}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-secondary-500">Applied</span>
              <span className="font-medium text-secondary-800">{formatDateTime(loan.createdAt)}</span>
            </div>
            {loan.approvedAt && (
              <div className="flex justify-between py-1">
                <span className="text-secondary-500">Approved</span>
                <span className="font-medium text-secondary-800">{formatDateTime(loan.approvedAt)}</span>
              </div>
            )}
            {loan.dueDate && (
              <div className="flex justify-between py-1">
                <span className="text-secondary-500">Due date</span>
                <span className="font-medium text-secondary-800">{formatDate(loan.dueDate)}</span>
              </div>
            )}
            {loan.repaidAt && (
              <div className="flex justify-between py-1">
                <span className="text-secondary-500">Repaid</span>
                <span className="font-medium text-secondary-800">{formatDateTime(loan.repaidAt)}</span>
              </div>
            )}
            <div className="flex justify-between py-1">
              <span className="text-secondary-500">Level</span>
              <span className="font-medium text-secondary-800">
                {loan.level.name} · up to {formatCurrency(loan.level.maxAmount)}
                {loan.nextLevel && ` → ${loan.nextLevel.name} ${formatCurrency(loan.nextLevel.maxAmount)}`}
              </span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="card">
          <h3 className="font-semibold mb-4">Timeline</h3>
          <div className="space-y-0">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`size-3 rounded-full mt-1.5 ${step.current ? "bg-primary-500 ring-4 ring-primary-100" : step.done ? "bg-green-500" : "bg-secondary-200"}`} />
                  {i < steps.length - 1 && <div className="w-px flex-1 bg-secondary-100 my-1" />}
                </div>
                <div className="pb-5">
                  <p className={`text-sm font-medium ${step.current ? "text-primary-700" : "text-secondary-700"}`}>{step.label}</p>
                  {step.date && <p className="text-xs text-secondary-400">{formatDateTime(step.date)}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Repayment schedule */}
        <div className="card">
          <h3 className="font-semibold mb-3">Repayment Schedule</h3>
          {loan.repayments.length === 0 ? (
            <p className="text-sm text-secondary-400">No repayments scheduled yet.</p>
          ) : (
            <div className="space-y-2">
              {loan.repayments.map((repayment) => {
                const status = STATUS_CONFIG[repayment.status] || STATUS_CONFIG.pending;
                return (
                  <div key={repayment.id} className="rounded-xl border border-secondary-100 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm">{formatCurrency(repayment.amount)}</span>
                      <span className={status.color}>{status.label}</span>
                    </div>
                    <p className="text-xs text-secondary-400">Due {formatDate(repayment.dueDate)}</p>
                    {repayment.status === "paid" && (
                      <p className="text-xs text-secondary-400 mt-1">
                        Paid {repayment.paidAt ? formatDateTime(repayment.paidAt) : ""}
                        {repayment.reference ? ` · Ref ${repayment.reference.slice(0, 20)}` : ""}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action */}
        {canRepay && pendingRepay && (
          <Button fullWidth size="lg" onClick={() => setShowRepayment(true)}>Repay Now</Button>
        )}
        {(loan.status === "pending" || loan.status === "approved") && (
          <div className="card text-center py-6">
            <p className="text-sm font-medium text-secondary-700">Under review</p>
            <p className="text-xs text-secondary-400 mt-1">We&apos;ll notify you as soon as there&apos;s an update.</p>
          </div>
        )}
        {loan.status === "repaid" && (
          <div className="card text-center py-6">
            <p className="text-sm font-medium text-green-700">Fully repaid — loan closed</p>
            <p className="text-xs text-secondary-400 mt-1">You&apos;re eligible for a new loan at your current level.</p>
          </div>
        )}
        {loan.status === "rejected" && (
          <div className="card text-center py-6">
            <p className="text-sm font-medium text-red-600 mb-2">This application was rejected</p>
            <Button size="sm" onClick={() => router.push("/dashboard/loans")}>Apply again</Button>
          </div>
        )}
      </main>
      <BottomNav />

      <Modal isOpen={showRepayment} onClose={() => setShowRepayment(false)} title="Repay Loan">
        <RepaymentForm
          loanId={loan.id}
          amount={pendingRepay?.amount ?? loan.totalDue}
          onSuccess={() => {
            setShowRepayment(false);
            if (loanId) loanService.getById(loanId).then(setLoan);
          }}
        />
      </Modal>
    </div>
  );
}
