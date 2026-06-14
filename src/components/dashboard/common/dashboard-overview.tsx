"use client";

import { useState } from "react";
import { BriefcaseBusiness, DollarSign, Loader2, Tags, TrendingUp, Landmark } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent } from "@/components/ui/card";
import {
  DashboardPeriod,
  DashboardOverviewMetrics,
} from "@/actions/dashboard/dashboard.types";
import { useDashboardOverviewQuery } from "@/actions/dashboard/useDashboardOverview";

const PERIODS: Array<{ key: DashboardPeriod; label: string }> = [
  { key: "WEEK", label: "This Week" },
  { key: "MONTH", label: "This Month" },
  { key: "OVERALL", label: "Overall" },
];

const EMPLOYEE_CARDS: Array<{
  key: keyof DashboardOverviewMetrics;
  title: string;
  icon: any;
  tone: string;
  formatter: (value: number) => string;
}> = [
  {
    key: "weeklyEarnings",
    title: "Earnings",
    icon: DollarSign,
    tone: "bg-pink-100 text-pink-600",
    formatter: (value) =>
      `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  },
  {
    key: "weeklyServicesDone",
    title: "Services Done",
    icon: BriefcaseBusiness,
    tone: "bg-amber-100 text-amber-700",
    formatter: (value) => value.toLocaleString(),
  },
  {
    key: "weeklyTips",
    title: "Tips",
    icon: Tags,
    tone: "bg-emerald-100 text-emerald-600",
    formatter: (value) =>
      `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  },
];

const ADMIN_CARDS: Array<{
  key: keyof DashboardOverviewMetrics;
  title: string;
  icon: any;
  tone: string;
  formatter: (value: number) => string;
}> = [
  {
    key: "grossRevenue",
    title: "Gross Revenue",
    icon: Landmark,
    tone: "bg-blue-100 text-blue-600",
    formatter: (value) =>
      `$${(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  },
  {
    key: "weeklyServicesDone",
    title: "Total Services Done",
    icon: BriefcaseBusiness,
    tone: "bg-amber-100 text-amber-700",
    formatter: (value) => value.toLocaleString(),
  },
  {
    key: "netSalonProfit",
    title: "Net Salon Profit",
    icon: TrendingUp,
    tone: "bg-emerald-100 text-emerald-600",
    formatter: (value) =>
      `$${(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  },
];

export default function DashboardOverview() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<DashboardPeriod>("WEEK");

  const { data, isLoading, isFetching } = useDashboardOverviewQuery({
    period,
    enabled: Boolean(user),
  });

  if (!user) {
    return null;
  }

  const isAdminOrManager = user.role === "admin" || user.role === "manager" || user.role?.toUpperCase() === "ADMIN" || user.role?.toUpperCase() === "MANAGER";
  const CARD_CONFIG = isAdminOrManager ? ADMIN_CARDS : EMPLOYEE_CARDS;

  const metrics = data?.metrics ?? {
    weeklyEarnings: 0,
    weeklyServicesDone: 0,
    weeklyTips: 0,
    grossRevenue: 0,
    netSalonProfit: 0,
  };

  const scopeLabel =
    data?.scope.type === "system"
      ? "System-wide approved entries"
      : "Personal approved entries";

  return (
    <div className='min-h-screen p-4 md:p-8'>
      <div className='mx-auto space-y-6'>
        <div className='flex flex-col gap-4 rounded-[16px] border border-gray-100 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.24em] text-pink-500'>
              Dashboard Overview
            </p>
            <h1 className='mt-1 text-3xl font-bold tracking-tight text-gray-800'>
              Weekly performance at a glance
            </h1>
            <p className='mt-1 text-sm text-gray-500'>
              {scopeLabel} · approved entries only
            </p>
          </div>

          <div className='flex flex-wrap gap-2'>
            {PERIODS.map((item) => {
              const active = period === item.key;

              return (
                <button
                  key={item.key}
                  type='button'
                  onClick={() => setPeriod(item.key)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                    active
                      ? "border-pink-600 bg-pink-600 text-white shadow-sm"
                      : "border-gray-200 bg-white text-gray-600 hover:border-pink-200 hover:bg-pink-50 hover:text-pink-700"
                  }`}>
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div
          className={`fixed top-20 right-8 z-60 transition-opacity duration-300 ${isFetching ? "opacity-100" : "pointer-events-none opacity-0"}`}>
          <div className='rounded-full border border-pink-100 bg-white/80 p-2 shadow-lg backdrop-blur-sm'>
            <Loader2 className='h-5 w-5 animate-spin text-[#D13C92]' />
          </div>
        </div>

        <section className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          {CARD_CONFIG.map((card) => {
            const Icon = card.icon;
            const value = metrics[card.key] ?? 0;

            return (
              <Card key={card.key} className='border-gray-100 shadow-sm'>
                <CardContent className='flex items-center gap-5 p-6'>
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-2xl ${card.tone}`}>
                    <Icon className='h-8 w-8' />
                  </div>

                  <div>
                    <p className='text-sm font-medium text-gray-500'>
                      {card.title}
                    </p>
                    <h3 className='mt-1 text-3xl font-bold text-gray-800 transition-all'>
                      {isLoading && !data ? "..." : card.formatter(value)}
                    </h3>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>
      </div>
    </div>
  );
}
