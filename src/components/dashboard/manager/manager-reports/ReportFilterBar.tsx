"use client";

import React from "react";
import { HistoryWeekSelector } from "../../common/HistoryWeekSelector";
import { useUsersQuery } from "@/actions/admin/useUsers";
import { useSalonsQuery } from "@/actions/admin/useSalons";
import { Loader2 } from "lucide-react";

interface ReportFilterBarProps {
  startDate: string;
  endDate: string;
  employeeId?: string;
  salonId?: string;
  onFilterChange: (filters: { startDate: string; endDate: string; employeeId: string; salonId: string }) => void;
  showOverall?: boolean;
  hideEmployeeFilter?: boolean;
  hideSalonFilter?: boolean;
}

export function ReportFilterBar({
  startDate,
  endDate,
  employeeId = "",
  salonId = "",
  onFilterChange,
  showOverall = false,
  hideEmployeeFilter = false,
  hideSalonFilter = false,
}: ReportFilterBarProps) {
  const { data: usersData, isLoading: isLoadingUsers } = useUsersQuery({
    page: 1,
    limit: 1000,
    searchTerm: "",
    role: "EMPLOYEE,MANAGER", // Assuming we want both in reports
  });

  const { data: salonsData, isLoading: isLoadingSalons } = useSalonsQuery({
    page: 1,
    limit: 1000,
    searchTerm: "",
  });

  const employees = usersData?.data || [];
  const salons = salonsData?.data || [];

  return (
    <div className="flex flex-col md:flex-row flex-wrap items-center justify-end gap-3 w-full">
      {/* Salon Filter */}
      {!hideSalonFilter && (
        <div className="relative w-full md:w-48">
          <select
            value={salonId}
            onChange={(e) => onFilterChange({ startDate, endDate, employeeId, salonId: e.target.value })}
            className="w-full bg-white border border-gray-200 rounded-lg py-2 pl-3 pr-8 text-sm text-gray-700 appearance-none focus:ring-2 focus:ring-pink-500 focus:outline-none transition-all cursor-pointer shadow-sm"
          >
            <option value="">All Salons</option>
            {salons.map((salon: any) => (
              <option key={salon.id} value={salon.id}>{salon.name}</option>
            ))}
          </select>
          <div className='absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none'>
            {isLoadingSalons ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
            ) : (
              <svg className='h-4 w-4 text-gray-400' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
                <path d='M19 9l-7 7-7-7' strokeLinecap='round' strokeLinejoin='round' />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Employee Filter */}
      {!hideEmployeeFilter && (
        <div className="relative w-full md:w-48">
          <select
            value={employeeId}
            onChange={(e) => onFilterChange({ startDate, endDate, employeeId: e.target.value, salonId })}
            className="w-full bg-white border border-gray-200 rounded-lg py-2 pl-3 pr-8 text-sm text-gray-700 appearance-none focus:ring-2 focus:ring-pink-500 focus:outline-none transition-all cursor-pointer shadow-sm"
          >
            <option value="">All Employees</option>
            {employees.map((emp: any) => (
              <option key={emp.id} value={emp.id}>{emp.fullName}</option>
            ))}
          </select>
          <div className='absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none'>
            {isLoadingUsers ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
            ) : (
              <svg className='h-4 w-4 text-gray-400' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
                <path d='M19 9l-7 7-7-7' strokeLinecap='round' strokeLinejoin='round' />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Date Filter */}
      <HistoryWeekSelector
        startDate={startDate}
        endDate={endDate}
        onWeekChange={(start, end) => {
          onFilterChange({ startDate: start, endDate: end, employeeId, salonId });
        }}
        showOverall={showOverall}
        className="w-full md:w-auto min-w-50"
      />
    </div>
  );
}
