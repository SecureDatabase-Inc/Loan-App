"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/authStore";
import { getSafeNextPath } from "@/utils/redirect";

export function LoginForm() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [form, setForm] = useState({ phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "error" as "success" | "error" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.phone) return setError("Phone number is required");
    if (!form.password) return setError("Password is required");

    setLoading(true);
    try {
      const result = await authService.login(form);
      setUser(result.user);
      setToast({ show: true, message: "Welcome back!", type: "success" });
      setTimeout(() => router.push(getSafeNextPath()), 500);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Login failed";
      setError(msg);
      setToast({ show: true, message: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Phone Number"
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="024 000 0000"
          error={error && !form.phone ? error : undefined}
        />
        <Input
          label="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Enter your password"
          error={error && !form.password ? error : undefined}
        />
        {error && form.phone && form.password && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-500 text-center">{error}</motion.p>
        )}
        <Button type="submit" isLoading={loading} fullWidth size="lg">
          Sign In
        </Button>
      </form>
      <Toast message={toast.message} type={toast.type} isVisible={toast.show} onClose={() => setToast({ ...toast, show: false })} />
    </>
  );
}
