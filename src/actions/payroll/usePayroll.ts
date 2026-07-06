import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { payrollService } from "@/lib/api/services/payroll.service";
import type { PayrollQueryParams, MarkPaidPayload } from "./payroll.types";

export const payrollKeys = {
  all: ["payroll"] as const,
  list: (params: PayrollQueryParams) => ["payroll", params] as const,
  employeeEntries: (employeeId: string, params: { startDate?: string; endDate?: string }) => 
    ["payroll", "employee", employeeId, params] as const,
};

export const usePayrollQuery = (params: PayrollQueryParams) => {
  return useQuery({
    queryKey: payrollKeys.list(params),
    queryFn: () => payrollService.getPayroll(params),
    placeholderData: (previousData) => previousData,
  });
};

export const useEmployeePayrollEntriesQuery = (employeeId: string, params: { startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: payrollKeys.employeeEntries(employeeId, params),
    queryFn: () => payrollService.getEmployeeEntries(employeeId, params),
    enabled: !!employeeId,
  });
};

export const useMarkPaidMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: MarkPaidPayload) => payrollService.markPaid(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.all });
    },
  });
};
