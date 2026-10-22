"use client";

import { useEffect, useState } from "react";
import { adminService } from "@/services/admin.service";

interface VerificationDocumentProps {
  verificationId: string;
  alt: string;
}

export function VerificationDocument({ verificationId, alt }: VerificationDocumentProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    setState("loading");
    setUrl(null);

    adminService
      .getVerificationDocument(verificationId)
      .then((view) => {
        if (!active) return;
        setUrl(view.url);
        setState("ready");
      })
      .catch(() => {
        if (active) setState("error");
      });

    return () => {
      active = false;
    };
  }, [verificationId]);

  if (state === "ready" && url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={alt} className="w-full h-36 object-cover bg-secondary-100" />;
  }

  return (
    <div className="w-full h-36 bg-secondary-100 flex items-center justify-center text-xs text-secondary-400">
      {state === "error" ? "Document unavailable" : "Loading document..."}
    </div>
  );
}
