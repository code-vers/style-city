import { apiClient } from "../client";
import type {
  PayrollQueryParams,
  PayrollResponse,
} from "@/actions/payroll/payroll.types";

export const payrollService = {
  getPayroll: async (params?: PayrollQueryParams): Promise<PayrollResponse> => {
    const response = await apiClient.get("/payroll", { params });
    return response.data;
  },

  getEmployeeEntries: async (employeeId: string, params?: { startDate?: string; endDate?: string }) => {
    const response = await apiClient.get(`/payroll/employee/${employeeId}/entries`, { params });
    return response.data;
  },

  markPaid: async (payload: { employeeId: string; startDate?: string; endDate?: string }) => {
    const response = await apiClient.post("/payroll/mark-paid", payload);
    return response.data;
  },
};
