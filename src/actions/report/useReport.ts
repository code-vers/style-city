"use client";

import { useQuery } from "@tanstack/react-query";
import { reportService, ReportFilters } from "@/lib/api/services/report.service";

export const useWeeklyEmployeeEarningsQuery = (filters: ReportFilters) => {
  return useQuery({
    queryKey: ["report", "weekly-employee-earnings", filters],
    queryFn: () => reportService.getWeeklyEmployeeEarnings(filters),
  });
};

export const useSalonRevenueQuery = (filters: ReportFilters) => {
  return useQuery({
    queryKey: ["report", "salon-revenue", filters],
    queryFn: () => reportService.getSalonRevenue(filters),
  });
};

export const useTopServicesQuery = (filters: ReportFilters) => {
  return useQuery({
    queryKey: ["report", "top-services", filters],
    queryFn: () => reportService.getTopServices(filters),
  });
};
