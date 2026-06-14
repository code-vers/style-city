"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Loader2 } from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useSalonRevenueQuery } from "@/actions/report/useReport";
import { ReportFilterBar } from "./ReportFilterBar";

const TIMEZONE = "America/Chicago";

export default function SalonRevenuePage() {
  const nowInTexas = toZonedTime(new Date(), TIMEZONE);
  const defaultStartDate = format(
    startOfWeek(nowInTexas, { weekStartsOn: 1 }),
    "yyyy-MM-dd",
  );
  const defaultEndDate = format(
    endOfWeek(nowInTexas, { weekStartsOn: 1 }),
    "yyyy-MM-dd",
  );

  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [employeeId, setEmployeeId] = useState("");
  const [salonId, setSalonId] = useState("");

  const {
    data: salonRevenueData,
    isLoading,
    isError,
    isFetching,
  } = useSalonRevenueQuery({
    startDate,
    endDate,
    employeeId,
    salonId,
  });

  const chartData = useMemo(() => 
    Array.isArray(salonRevenueData) 
      ? salonRevenueData.map((item) => ({
          day: item.day,
          revenue: item.revenue,
          expenses: item.expenses,
        })) 
      : [],
    [salonRevenueData]
  );

  const exportToCSV = useCallback(() => {
    if (!chartData.length) return;

    const headers = ["Day", "Revenue", "Expenses"];
    const csvRows = chartData.map(row => `${row.day},${row.revenue},${row.expenses}`);
    const csvContent = [headers.join(","), ...csvRows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `salon-revenue-${startDate || 'current'}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [chartData, startDate]);

  useEffect(() => {
    window.addEventListener('trigger-export', exportToCSV);
    return () => window.removeEventListener('trigger-export', exportToCSV);
  }, [exportToCSV]);

  return (
    <div className='mx-auto w-full max-w-480 overflow-hidden rounded-[12px] border border-[#F1EAE3] bg-[#F9F9FB] p-4 sm:p-6 lg:p-8 relative'>
      {/* Floating loader */}
      <div
        className={`fixed top-20 right-8 z-60 transition-opacity duration-300 ${isFetching ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <div className='bg-white/80 backdrop-blur-sm shadow-lg rounded-full p-2 border border-pink-100'>
          <Loader2 className='h-5 w-5 animate-spin text-[#D13C92]' />
        </div>
      </div>

      <div className='mb-6 sm:mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4'>
        <div className="shrink-0">
          <h2 className='text-xl font-semibold sm:text-2xl'>
            Revenue vs Expenses
          </h2>
          <p className='text-sm text-gray-600 sm:text-base'>
            Track salon performance
          </p>
        </div>
        <div className="w-full lg:w-auto overflow-visible">
          <ReportFilterBar
            startDate={startDate}
            endDate={endDate}
            employeeId={employeeId}
            salonId={salonId}
            onFilterChange={(filters) => {
              setStartDate(filters.startDate);
              setEndDate(filters.endDate);
              setEmployeeId(filters.employeeId);
              setSalonId(filters.salonId);
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className='h-72 sm:h-80 lg:h-96 flex items-center justify-center'>
          <Loader2 className='h-10 w-10 animate-spin text-[#D13C92]' />
        </div>
      ) : isError ? (
        <p className='text-red-600 text-center py-10'>
          Failed to load revenue data.
        </p>
      ) : (
        <div
          style={{ width: "100%", height: 400 }}
          className={`transition-opacity duration-300 ${isFetching ? "opacity-60" : "opacity-100"}`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
              <XAxis dataKey='day' />
              <YAxis />
              <Tooltip
                formatter={(value) => [`$${value}`, "Amount"]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #F1EAE3",
                }}
              />
              <Legend />
              <Line
                type='natural'
                dataKey='revenue'
                stroke='#4ECDC4'
                strokeWidth={3}
                dot={{ fill: "#4ECDC4", r: 5 }}
                name='Revenue'
              />
              <Line
                type='natural'
                dataKey='expenses'
                stroke='#FFB74D'
                strokeWidth={3}
                dot={{ fill: "#FFB74D", r: 5 }}
                name='Expenses'
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
