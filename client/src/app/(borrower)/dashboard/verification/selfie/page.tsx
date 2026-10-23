"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { CameraCapture } from "@/components/camera/CameraCapture";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import api from "@/services/api";
import { userService } from "@/services/user.service";
import { Verification } from "@/types/user.types";
import { describeUploadError } from "@/utils/uploadErrors";
import { verificationChipClass } from "@/utils/verificationStatus";

export default function SelfiePage() {
  const router = useRouter();
  const [imageData, setImageData] = useState<string | null>(null);
  const [current, setCurrent] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" as "success" | "error" });

  const loadStatus = () =>
    userService
      .getVerifications()
      .then((list) => setCurrent(list.find((v) => v.type === "selfie") ?? null))
      .catch(() => undefined);

  useEffect(() => {
    loadStatus();
  }, []);

  const handleUpload = async () => {
    if (!imageData) return;
    setLoading(true);
    try {
      const blob = await (await fetch(imageData)).blob();
      const formData = new FormData();
      formData.append("image", blob, "selfie.jpg");
      formData.append("type", "selfie");

      const res = await api.post("/uploads/verify", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setToast({ show: true, message: "Selfie submitted for verification!", type: "success" });
      await loadStatus();
      if (res.status === 201) {
        setTimeout(() => router.push("/dashboard/verification"), 1000);
      }
    } catch (err) {
      setToast({ show: true, message: describeUploadError(err), type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const isApproved = current?.status === "approved";
  const isPending = current?.status === "pending";

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      <DashboardHeader />
      <main className="max-w-lg mx-auto px-4 py-6">
        <h2 className="text-xl font-bold mb-1">Selfie Verification</h2>
        <p className="text-sm text-secondary-500 mb-6">Take a clear selfie to verify your identity</p>

        {current && (
          <div className="card mb-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-secondary-700">Current status</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${verificationChipClass(current.status)}`}>
                {current.status}
              </span>
            </div>
            {isPending && (
              <p className="text-xs text-secondary-500 mt-2">Your selfie is awaiting review.</p>
            )}
            {isApproved && (
              <p className="text-xs text-green-700 mt-2">
                Your selfie has been approved. You do not need to submit it again.
              </p>
            )}
            {current.status === "rejected" && (
              <p className="text-xs text-red-600 mt-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {current.adminNote ? `Reason: ${current.adminNote}` : "Your selfie was rejected. Please retake it."}
              </p>
            )}
          </div>
        )}

        {isApproved || isPending ? (
          <Button variant="secondary" fullWidth onClick={() => router.push("/dashboard/verification")}>
            Back to verification
          </Button>
        ) : (
          <>
            <CameraCapture facingMode="user" onCapture={setImageData} />

            {imageData && (
              <div className="mt-4">
                <Button onClick={handleUpload} isLoading={loading} fullWidth>
                  Submit for Verification
                </Button>
              </div>
            )}
          </>
        )}
      </main>
      <BottomNav />
      <Toast message={toast.message} type={toast.type} isVisible={toast.show} onClose={() => setToast({ ...toast, show: false })} />
    </div>
  );
}
