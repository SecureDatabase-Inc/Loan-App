import api from "./api";
import { User, Loan, Repayment } from "@/types/auth.types";
import { Verification, VerificationEvent } from "@/types/user.types";

export interface VerificationDocumentView {
  url: string;
  expiresInSeconds: number | null;
  legacy: boolean;
}

export interface DashboardStats {
  totalUsers: number;
  totalLoans: number;
  activeLoans: number;
  pendingLoans: number;
  repaidLoans: number;
  totalVerified: number;
  totalLoanAmount: number;
}

export const adminService = {
  async login(email: string, password: string) {
    const res = await api.post("/admin/login", { email, password });
    return res.data;
  },

  async getDashboard(): Promise<DashboardStats> {
    const res = await api.get("/admin/dashboard");
    return res.data;
  },

  async getUsers(): Promise<User[]> {
    const res = await api.get("/admin/users");
    return res.data;
  },

  async updateUserLevel(userId: string, level: number) {
    const res = await api.put(`/admin/users/${userId}/level`, { level });
    return res.data;
  },

  async getLoans(): Promise<Loan[]> {
    const res = await api.get("/admin/loans");
    return res.data;
  },

  async approveLoan(id: string) {
    const res = await api.put(`/admin/loans/${id}/approve`);
    return res.data;
  },

  async rejectLoan(id: string) {
    const res = await api.put(`/admin/loans/${id}/reject`);
    return res.data;
  },

  async getVerifications(): Promise<Verification[]> {
    const res = await api.get("/admin/verifications");
    return res.data;
  },

  async getVerificationDocument(id: string): Promise<VerificationDocumentView> {
    const res = await api.get(`/admin/verifications/${id}/document`);
    return res.data;
  },

  async getVerificationHistory(id: string): Promise<VerificationEvent[]> {
    const res = await api.get(`/admin/verifications/${id}/history`);
    return res.data;
  },

  async approveVerification(id: string) {
    const res = await api.put(`/admin/verifications/${id}/approve`);
    return res.data;
  },

  async rejectVerification(id: string, note?: string) {
    const res = await api.put(`/admin/verifications/${id}/reject`, { adminNote: note });
    return res.data;
  },

  async getRepayments(): Promise<Repayment[]> {
    const res = await api.get("/admin/repayments");
    return res.data;
  },

  async clearRepayment(id: string) {
    const res = await api.put(`/admin/repayments/${id}/clear`);
    return res.data;
  },
};
