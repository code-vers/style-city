export interface PayrollQueryParams {
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
  employeeId?: string;
}

export interface PayrollRow extends Record<string, unknown> {
  employeeId: string;
  employeeName: string;
  salonName: string;
  totalOccurrences: number;
  commissionRate: number;
  serviceCharge: number;
  commissionEarnings: number;
  totalTips: number;
  earnings: number;
  paidEarnings: number;
  unpaidEarnings: number;
}

export interface MarkPaidPayload {
  employeeId: string;
  startDate?: string;
  endDate?: string;
}

export interface PayrollResponse {
  success: boolean;
  message: string;
  data: PayrollRow[];
}

export interface PayrollEmployeeOption {
  value: string;
  label: string;
}
