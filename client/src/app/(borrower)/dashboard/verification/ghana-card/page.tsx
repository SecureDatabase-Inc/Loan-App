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

export default function GhanaCardPage() {
  const router = useRouter();
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [frontStatus, setFrontStatus] = useState<Verification | null>(null);
  const [backStatus, setBackStatus] = useState<Verification | null>(null);
  const [step, setStep] = useState<"front" | "back">("front");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" as "success" | "error" });

  const loadStatuses = () =>
    userService
      .getVerifications()
      .then((list) => {
        const front = list.find((v) => v.type === "ghana_card_front") ?? null;
        const back = list.find((v) => v.type === "ghana_card_back") ?? null;
        setFrontStatus(front);
        setBackStatus(back);
        if (front?.status === "approved") setStep("back");
      })
      .catch(() => undefined);

  useEffect(() => {
    loadStatuses();
  }, []);

  const frontApproved = frontStatus?.status === "approved";
  const backApproved = backStatus?.status === "approved";
  const anyPending = frontStatus?.status === "pending" || backStatus?.status === "pending";
  const nothingToDo = frontApproved && backApproved;
  const readyToSubmit = (frontApproved || Boolean(frontImage)) && (backApproved || Boolean(backImage));

  const captureFront = (data: string) => {
    setFrontImage(data);
    if (!backApproved) setStep("back");
  };

  const captureBack = (data: string) => {
    setBackImage(data);
  };

  const uploadOne = async (data: string, type: "ghana_card_front" | "ghana_card_back", filename: string) => {
    const blob = await (await fetch(data)).blob();
    const formData = new FormData();
    formData.append("image", blob, filename);
    formData.append("type", type);
    await api.post("/uploads/verify", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  };

  const handleUpload = async () => {
    setLoading(true);
    try {
      if (!frontApproved && frontImage) await uploadOne(frontImage, "ghana_card_front", "card-front.jpg");
      if (!backApproved && backImage) await uploadOne(backImage, "ghana_card_back", "card-back.jpg");

      setToast({ show: true, message: "Ghana Card submitted for verification!", type: "success" });
      await loadStatuses();
      setTimeout(() => router.push("/dashboard/verification"), 1000);
    } catch (err) {
      setToast({ show: true, message: describeUploadError(err), type: "error" });
      await loadStatuses();
    } finally {
      setLoading(false);
    }
  };

  const renderStatus = (label: string, status: Verification | null) => (
    <div className="flex items-center justify-between">
      <span className="text-sm text-secondary-700">{label}</span>
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${verificationChipClass(status?.status ?? "")}`}>
        {status?.status ?? "Not submitted"}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      <DashboardHeader />
      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-1">
          <span className={`size-8 rounded-full flex items-center justify-center text-sm font-bold ${frontApproved || frontImage ? "bg-primary-500 text-white" : "bg-secondary-200 text-secondary-500"}`}>1</span>
          <span className="h-px flex-1 bg-secondary-200" />
          <span className={`size-8 rounded-full flex items-center justify-center text-sm font-bold ${backApproved || backImage ? "bg-primary-500 text-white" : "bg-secondary-200 text-secondary-500"}`}>2</span>
        </div>
        <h2 className="text-xl font-bold mb-1">Ghana Card Verification</h2>
        <p className="text-sm text-secondary-500 mb-6">
          {nothingToDo
            ? "Your Ghana Card has been approved."
            : anyPending
              ? "Your Ghana Card is awaiting review."
              : step === "front" && !frontApproved
                ? "Capture the FRONT of your Ghana Card"
                : "Capture the BACK of your Ghana Card"}
        </p>

        <div className="card mb-5 space-y-2">
          {renderStatus("Ghana Card — Front", frontStatus)}
          {renderStatus("Ghana Card — Back", backStatus)}
          {frontStatus?.status === "rejected" && frontStatus.adminNote && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              Front: {frontStatus.adminNote}
            </p>
          )}
          {backStatus?.status === "rejected" && backStatus.adminNote && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              Back: {backStatus.adminNote}
            </p>
          )}
        </div>

        {nothingToDo || anyPending ? (
          <Button variant="secondary" fullWidth onClick={() => router.push("/dashboard/verification")}>
            Back to verification
          </Button>
        ) : (
          <>
            {step === "front" && !frontApproved && !frontImage && (
              <CameraCapture facingMode="environment" onCapture={captureFront} />
            )}
            {step === "back" && !backApproved && !backImage && (
              <CameraCapture facingMode="environment" onCapture={captureBack} />
            )}

            {(frontImage || backImage) && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-secondary-400 mb-1">Front</p>
                    {frontApproved ? (
                      <div className="rounded-xl w-full h-24 bg-green-50 border border-green-200 flex items-center justify-center text-xs text-green-700">
                        Approved
                      </div>
                    ) : frontImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={frontImage} alt="Front" className="rounded-xl w-full" />
                    ) : (
                      <div className="rounded-xl w-full h-24 bg-secondary-100 flex items-center justify-center text-xs text-secondary-400">
                        Not captured
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-secondary-400 mb-1">Back</p>
                    {backApproved ? (
                      <div className="rounded-xl w-full h-24 bg-green-50 border border-green-200 flex items-center justify-center text-xs text-green-700">
                        Approved
                      </div>
                    ) : backImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={backImage} alt="Back" className="rounded-xl w-full" />
                    ) : (
                      <div className="rounded-xl w-full h-24 bg-secondary-100 flex items-center justify-center text-xs text-secondary-400">
                        Not captured
                      </div>
                    )}
                  </div>
                </div>
                <Button onClick={handleUpload} isLoading={loading} disabled={!readyToSubmit} fullWidth>
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
