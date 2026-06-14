"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ArrowDown, ArrowUp, Loader2 } from "lucide-react";
import { startOfWeek, endOfWeek } from "date-fns";
import { toZonedTime, format } from "date-fns-tz";
import { useWeeklyEmployeeEarningsQuery } from "@/actions/report/useReport";
import { ReportFilterBar } from "./ReportFilterBar";

const TIMEZONE = 'America/Chicago';

export default function EmployeeEarningsPage() {
  const nowInTexas = toZonedTime(new Date(), TIMEZONE);
  const defaultStartDate = format(startOfWeek(nowInTexas, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const defaultEndDate = format(endOfWeek(nowInTexas, { weekStartsOn: 1 }), "yyyy-MM-dd");

  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [employeeId, setEmployeeId] = useState("");
  const [salonId, setSalonId] = useState("");
  
  const { data: response, isLoading, isError, isFetching } = useWeeklyEmployeeEarningsQuery({ 
    startDate, 
    endDate,
    employeeId,
    salonId
  });

  const reportData = Array.isArray(response?.data) ? response.data : [];
  const totalEarnings = response?.totalEarnings || 0;
  const comparison = response?.comparisonPercentage || 0;
  const isPositive = comparison >= 0;

  const exportToCSV = useCallback(() => {
    if (!reportData.length) return;
    
    const headers = ["Day", "Earnings"];
    const csvRows = reportData.map(row => `${row.day},${row.earnings}`);
    const csvContent = [headers.join(","), ...csvRows].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `employee-earnings-${startDate || 'current'}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [reportData, startDate]);

  useEffect(() => {
    window.addEventListener('trigger-export', exportToCSV);
    return () => window.removeEventListener('trigger-export', exportToCSV);
  }, [exportToCSV]);

  return (
    <div className='mx-auto w-full max-w-480 overflow-hidden rounded-[12px] border border-[#F1EAE3] bg-[#F9F9FB] p-4 sm:p-6 lg:p-8 relative'>
      {/* Floating loader */}
      <div className={`fixed top-20 right-8 z-60 transition-opacity duration-300 ${isFetching ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="bg-white/80 backdrop-blur-sm shadow-lg rounded-full p-2 border border-pink-100">
           <Loader2 className="h-5 w-5 animate-spin text-[#D13C92]" />
        </div>
      </div>

      <div className='mb-6 sm:mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4'>
        <div className="shrink-0">
          <h2 className='text-xl font-semibold sm:text-2xl'>
            Weekly Earnings Overview
          </h2>
          <p className='text-sm text-gray-600 sm:text-base'>
            Total earnings: ${totalEarnings}
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
              showOverall={false}
          />
        </div>
      </div>

      {isLoading ? (
        <div className='h-72 sm:h-80 lg:h-96 flex items-center justify-center'>
          <Loader2 className="w-10 h-10 animate-spin text-[#D13C92]" />
        </div>
      ) : isError ? (
        <p className="text-red-600 text-center py-10">Failed to load report data.</p>
      ) : (
        <div style={{ width: '100%', height: 300 }} className={`transition-opacity duration-300 ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
          <ResponsiveContainer>
            <BarChart data={reportData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
              <XAxis dataKey='day' />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`$${value}`, 'Earnings']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #F1EAE3' }}
              />
              <Bar dataKey='earnings' fill='#D13C92' radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className={`mt-5 flex items-center gap-2 text-sm font-medium sm:mt-6 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUp className='w-4 h-4' /> : <ArrowDown className='w-4 h-4' />}
        <span>{Math.abs(comparison)}% {isPositive ? 'higher' : 'lower'} than previous period</span>
      </div>
    </div>
  );
}
