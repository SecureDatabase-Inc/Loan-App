"use client";

import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface AuthPromptProps {
  isOpen: boolean;
  onClose: () => void;
  /** Where to send the user after a successful login/registration. */
  nextPath?: string;
  title?: string;
  message?: string;
}

/**
 * Shown when a guest tries to use a protected feature. It never creates a
 * session of any kind — it only routes the user to the existing auth flows.
 */
export function AuthPrompt({
  isOpen,
  onClose,
  nextPath = "/dashboard",
  title = "Account required",
  message = "Create an account or log in to access our loan services.",
}: AuthPromptProps) {
  const next = encodeURIComponent(nextPath);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-5">
        <div className="flex justify-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary-50">
            <svg className="size-7 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
        </div>

        <p className="text-center text-sm leading-relaxed text-secondary-600">{message}</p>

        <div className="space-y-2">
          <Link href={`/register?next=${next}`} className="btn-primary block w-full py-3.5 text-center">
            Create an account
          </Link>
          <Link href={`/login?next=${next}`} className="btn-secondary block w-full py-3.5 text-center">
            Log in
          </Link>
          <Button variant="ghost" fullWidth onClick={onClose}>
            Keep browsing
          </Button>
        </div>
      </div>
    </Modal>
  );
}
