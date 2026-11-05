"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { Loader } from "@/components/ui/Loader";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { ProfileEditForm } from "@/components/forms/ProfileEditForm";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/auth.service";
import { formatDate } from "@/utils/formatDate";

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const handleSignOut = async () => {
    await authService.logout();
    router.push("/");
  };
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" as "success" | "error" });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      authService.getProfile().then(setUser).catch(() => undefined);
    }
  }, [isAuthenticated, setUser]);

  if (isLoading) return <Loader fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      <DashboardHeader />
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="card text-center py-8">
          <div className="size-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
            {user?.fullName?.charAt(0) || "U"}
          </div>
          <h2 className="text-xl font-bold">{user?.fullName}</h2>
          <p className="text-sm text-secondary-500">{user?.phone}</p>
          {user?.email && <p className="text-sm text-secondary-400">{user.email}</p>}
        </div>

        <div className="card space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Personal Information</h3>
            {!editing && (
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                Edit
              </Button>
            )}
          </div>

          {editing && user ? (
            <ProfileEditForm
              user={user}
              onCancel={() => setEditing(false)}
              onSaved={() => {
                setEditing(false);
                setToast({ show: true, message: "Profile updated successfully!", type: "success" });
              }}
              onError={(msg) => setToast({ show: true, message: msg, type: "error" })}
            />
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-secondary-500">Full Name</span>
                <span className="font-medium text-sm">{user?.fullName}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-secondary-500">Phone</span>
                <span className="font-medium text-sm">{user?.phone}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-secondary-500">Email</span>
                <span className="font-medium text-sm">{user?.email || "—"}</span>
              </div>
            </div>
          )}
        </div>

        <div className="card space-y-4">
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-secondary-500">Loan Level</span>
            <span className="font-semibold">Level {user?.loanLevel}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-secondary-500">Verified</span>
            <button className={`${user?.verified ? "chip chip-paid" : "chip chip-pending"} hover:opacity-80`} onClick={() => router.push("/dashboard/verification")}>
              {user?.verified ? "Verified" : "Unverified"} ›
            </button>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-secondary-500">Member Since</span>
            <span className="font-medium text-sm">{user?.createdAt ? formatDate(user.createdAt) : "-"}</span>
          </div>
        </div>

        <Button variant="danger" fullWidth onClick={handleSignOut}>
          Sign Out
        </Button>
      </main>
      <BottomNav />
      <Toast message={toast.message} type={toast.type} isVisible={toast.show} onClose={() => setToast({ ...toast, show: false })} />
    </div>
  );
}