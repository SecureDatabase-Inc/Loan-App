"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Loader } from "@/components/ui/Loader";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { adminService } from "@/services/admin.service";
import { VerificationDocument } from "@/components/admin/VerificationDocument";
import { Verification, VerificationEvent } from "@/types/user.types";
import { formatDate, formatDateTime } from "@/utils/formatDate";

const TYPE_LABEL: Record<Verification["type"], string> = {
  selfie: "Selfie",
  ghana_card_front: "Ghana Card (Front)",
  ghana_card_back: "Ghana Card (Back)",
};

export default function AdminVerificationsPage() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState<Verification | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [historyTarget, setHistoryTarget] = useState<Verification | null>(null);
  const [history, setHistory] = useState<VerificationEvent[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" as "success" | "error" });

  const loadData = () => adminService.getVerifications().then(setVerifications).finally(() => setLoading(false));

  useEffect(() => { loadData(); }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, Verification[]>();
    for (const v of verifications) {
      const key = v.userId;
      map.set(key, [...(map.get(key) || []), v]);
    }
    return Array.from(map.entries())
      .filter(([, list]) => list.some((v) => v.status === "pending"))
      .map(([userId, list]) => {
        const { user } = list[0];
        return { userId, user, list: list.sort((a, b) => a.submittedAt.localeCompare(b.submittedAt)) };
      });
  }, [verifications]);

  const handleApproveAll = async (userId: string) => {
    try {
      const pending = verifications.filter((v) => v.userId === userId && v.status === "pending");
      for (const v of pending) {
        await adminService.approveVerification(v.id);
      }
      setToast({ show: true, message: "Verification approved! User is now verified.", type: "success" });
      loadData();
    } catch {
      setToast({ show: true, message: "Failed to approve verification", type: "error" });
    }
  };

  const handleReject = async (target: Verification[], note?: string) => {
    try {
      for (const v of target) {
        await adminService.rejectVerification(v.id, note);
      }
      setToast({ show: true, message: "Verification rejected", type: "success" });
      setRejectTarget(null);
      setRejectNote("");
      loadData();
    } catch {
      setToast({ show: true, message: "Failed to reject verification", type: "error" });
    }
  };

  const openHistory = async (verification: Verification) => {
    setHistoryTarget(verification);
    setHistoryLoading(true);
    setHistory([]);
    try {
      setHistory(await adminService.getVerificationHistory(verification.id));
    } catch {
      setToast({ show: true, message: "Failed to load review history", type: "error" });
    } finally {
      setHistoryLoading(false);
    }
  };

  const allReviewed = verifications.length > 0 && verifications.every((v) => v.status !== "pending");

  return (
    <div className="min-h-screen bg-secondary-50">
      <AdminSidebar />
      <main className="lg:ml-64 p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6">Verifications</h1>

        {loading ? <Loader /> : (
          <div className="space-y-6">
            {/* Pending verifications */}
            {grouped.length > 0 ? (
              grouped.map(({ userId, user, list }) => (
                <div key={userId} className="card border-l-4 border-l-primary-500">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="font-bold text-lg">{user?.fullName || "Unknown"}</p>
                      <p className="text-sm text-secondary-500">{user?.phone || ""}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleApproveAll(userId)}>Approve All</Button>
                      <Button size="sm" variant="danger" onClick={() => setRejectTarget(list[0])}>
                        Reject
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {list.map((v) => (
                      <div key={v.id} className="border border-secondary-100 rounded-xl overflow-hidden">
                        <VerificationDocument verificationId={v.id} alt={TYPE_LABEL[v.type]} />
                        <div className="p-3 flex items-center justify-between">
                          <span className="text-xs font-medium text-secondary-700">{TYPE_LABEL[v.type]}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              v.status === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : v.status === "approved"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {v.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {list.some((v) => v.status === "rejected") && (
                    <p className="mt-3 text-xs text-secondary-500">
                      Some items were rejected: {list.filter((v) => v.status === "rejected").map((v) => TYPE_LABEL[v.type]).join(", ")}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="card text-center py-12 text-secondary-500">
                {allReviewed ? "All verifications have been reviewed." : "No pending verifications."}
              </div>
            )}

            {/* All verifications */}
            <div>
              <h3 className="text-sm font-medium text-secondary-500 mb-3">All Submissions</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-secondary-200">
                      <th className="text-left py-3 px-4 font-medium text-secondary-500">User</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-500">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-500">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-500">Submitted</th>
                      <th className="text-left py-3 px-4 font-medium text-secondary-500">History</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verifications.map((v) => (
                      <tr key={v.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                        <td className="py-3 px-4">{v.user?.fullName || "—"}</td>
                        <td className="py-3 px-4">{TYPE_LABEL[v.type]}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              v.status === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : v.status === "approved"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {v.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-secondary-500">{formatDate(v.submittedAt)}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => openHistory(v)}
                            className="text-xs font-medium text-primary-600 hover:text-primary-700"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      <Modal isOpen={!!rejectTarget} onClose={() => { setRejectTarget(null); setRejectNote(""); }} title="Reject Verification">
        <p className="text-sm text-secondary-500 mb-4">
          Reject all pending verification items for {rejectTarget?.user?.fullName}? You can add a note for the user.
        </p>
        <textarea
          value={rejectNote}
          onChange={(e) => setRejectNote(e.target.value)}
          placeholder="Reason for rejection (optional)"
          className="w-full border border-secondary-200 rounded-xl p-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500"
          rows={3}
        />
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setRejectTarget(null)}>Cancel</Button>
          <Button
            variant="danger"
            onClick={() => rejectTarget && handleReject(
              verifications.filter((v) => v.userId === rejectTarget.userId && v.status === "pending"),
              rejectNote
            )}
          >
            Reject
          </Button>
        </div>
      </Modal>

      <Modal isOpen={!!historyTarget} onClose={() => setHistoryTarget(null)} title="Review History">
        {historyLoading ? (
          <Loader />
        ) : history.length === 0 ? (
          <p className="text-sm text-secondary-500">No history recorded for this submission.</p>
        ) : (
          <ul className="space-y-3">
            {history.map((event) => (
              <li key={event.id} className="text-sm border-b border-secondary-100 pb-2 last:border-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize">{event.action}</span>
                  <span className="text-xs text-secondary-400">{formatDateTime(event.createdAt)}</span>
                </div>
                <p className="text-xs text-secondary-500">
                  {event.fromStatus ? `${event.fromStatus} → ` : ""}
                  {event.toStatus || ""} · {event.actorType}
                </p>
                {event.note && <p className="text-xs text-secondary-600 mt-1">Note: {event.note}</p>}
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <Toast message={toast.message} type={toast.type} isVisible={toast.show} onClose={() => setToast({ ...toast, show: false })} />
    </div>
  );
}