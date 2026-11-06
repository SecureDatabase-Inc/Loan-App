"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/authStore";
import { isValidPhone, getPasswordStrength } from "@/utils/validators";
import { getSafeNextPath } from "@/utils/redirect";

export function RegisterForm() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" as "success" | "error" });

  const pwdStrength = form.password ? getPasswordStrength(form.password) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.fullName.length < 3) return setError("Full name must be at least 3 characters");
    if (!isValidPhone(form.phone)) return setError("Enter a valid Ghana phone number (e.g., 024XXXXXXX)");
    if (form.password.length < 6) return setError("Password must be at least 6 characters");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match");

    setLoading(true);
    try {
      const result = await authService.register({
        fullName: form.fullName,
        phone: form.phone,
        email: form.email || undefined,
        password: form.password,
      });
      setUser(result.user);
      setToast({ show: true, message: "Account created! Welcome.", type: "success" });
      setTimeout(() => router.push(getSafeNextPath()), 500);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Registration failed";
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
          label="Full Name"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          placeholder="John Doe"
        />
        <Input
          label="Phone Number"
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="024 000 0000"
        />
        <Input
          label="Email (optional)"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="john@example.com"
        />
        <div>
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="At least 6 characters"
          />
          {pwdStrength && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex gap-1 flex-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full ${i <= pwdStrength.score ? "bg-primary-500" : "bg-secondary-200"}`} />
                ))}
              </div>
              <span className="text-[10px] font-medium text-secondary-400">{pwdStrength.label}</span>
            </div>
          )}
        </div>
        <Input
          label="Confirm Password"
          type="password"
          value={form.confirmPassword}
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          placeholder="Repeat password"
        />
        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-500 text-center">{error}</motion.p>
        )}
        <Button type="submit" isLoading={loading} fullWidth size="lg">
          Create Account
        </Button>
      </form>
      <Toast message={toast.message} type={toast.type} isVisible={toast.show} onClose={() => setToast({ ...toast, show: false })} />
    </>
  );
}
