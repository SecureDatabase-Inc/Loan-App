"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { Loader } from "@/components/ui/Loader";
import { ChangePasswordForm } from "@/components/forms/ChangePasswordForm";
import { DeleteAccountModal } from "@/components/forms/DeleteAccountModal";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/auth.service";

export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const logout = useAuthStore((s) => s.logout);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" as "success" | "error" });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) return <Loader fullScreen />;

  const handleDeleted = () => {
    setShowDeleteModal(false);
    logout();
    router.push("/");
  };

  const handleSignOut = async () => {
    await authService.logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      <DashboardHeader />
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <h2 className="text-xl font-bold">Settings</h2>

        <div className="card space-y-6">
          <div>
            <h3 className="font-semibold mb-3">Change Password</h3>
            <ChangePasswordForm
              onSuccess={(msg) => setToast({ show: true, message: msg, type: "success" })}
              onError={(msg) => setToast({ show: true, message: msg, type: "error" })}
            />
          </div>
        </div>

        <div className="card space-y-4">
          <div>
            <h3 className="font-semibold mb-1">Account</h3>
            <p className="text-sm text-secondary-500 mb-4">
              Deleting your account permanently disables logging in. Outstanding loans must be cleared first.
            </p>
            <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
              Delete Account
            </Button>
          </div>
        </div>

        <Button variant="ghost" fullWidth onClick={handleSignOut}>
          Sign Out
        </Button>
      </main>

      <BottomNav />

      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDeleted={handleDeleted}
        onError={(msg) => setToast({ show: true, message: msg, type: "error" })}
      />

      <Toast message={toast.message} type={toast.type} isVisible={toast.show} onClose={() => setToast({ ...toast, show: false })} />
    </div>
  );
}