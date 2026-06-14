import { apiClient } from "../client";

export type WeeklyEarningsData = {
  day: string;
  earnings: number;
};

export type WeeklyEarningsResponse = {
  data: WeeklyEarningsData[];
  totalEarnings: number;
  comparisonPercentage: number;
};

export type SalonRevenueData = {
  day: string;
  revenue: number;
  expenses: number;
};

export type TopServiceData = {
  name: string;
  count: number;
  revenue: number;
};

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  employeeId?: string;
  salonId?: string;
}

export const reportService = {
  getWeeklyEmployeeEarnings: async (filters: ReportFilters) => {
    const response = await apiClient.get<{ data: WeeklyEarningsResponse }>("/reports/employee-earnings", { params: filters });
    return response.data.data;
  },
  getSalonRevenue: async (filters: ReportFilters) => {
    const response = await apiClient.get<{ data: SalonRevenueData[] }>("/reports/salon-revenue", { params: filters });
    return response.data.data;
  },
  getTopServices: async (filters: ReportFilters) => {
    const response = await apiClient.get<{ data: TopServiceData[] }>("/reports/top-services", { params: filters });
    return response.data.data;
  },
};

