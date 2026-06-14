export type DashboardPeriod = "WEEK" | "MONTH" | "OVERALL";

export interface DashboardOverviewMetrics {
  weeklyEarnings: number;
  weeklyServicesDone: number;
  weeklyTips: number;
  grossRevenue?: number;
  netSalonProfit?: number;
}

export type DashboardOverviewResponse = {
  period: DashboardPeriod;
  range: {
    startDate: string | null;
    endDate: string | null;
  };
  scope: {
    role: "EMPLOYEE" | "MANAGER" | "ADMIN";
    type: "individual" | "system";
    userId: string;
  };
  metrics: DashboardOverviewMetrics;
  approvedEntriesCount: number;
  systemCounts?: {
    employees: number;
    managers: number;
    salons: number;
    approvedEntries: number;
  };
};
