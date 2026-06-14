"use client";

import { useState, useCallback, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useTopServicesQuery } from "@/actions/report/useReport";
import { ReportFilterBar } from "./ReportFilterBar";

const TIMEZONE = "America/Chicago";

export default function ServiceAnalysisPage() {
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
    data: topServices,
    isLoading,
    isError,
    isFetching,
  } = useTopServicesQuery({ startDate, endDate, employeeId, salonId });

  const exportToCSV = useCallback(() => {
    if (!topServices?.length) return;

    const headers = ["Service Name", "Count", "Revenue"];
    const csvRows = topServices.map(
      (row) => `${row.name},${row.count},${row.revenue}`,
    );
    const csvContent = [headers.join(","), ...csvRows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `top-services-${startDate || "current"}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [topServices, startDate]);

  useEffect(() => {
    window.addEventListener("trigger-export", exportToCSV);
    return () => window.removeEventListener("trigger-export", exportToCSV);
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
          <h2 className='text-xl font-semibold sm:text-2xl'>Top Services</h2>
          <p className='text-sm text-gray-600 sm:text-base'>
            Most popular services this week
          </p>
        </div>
        <div className="w-full lg:w-auto overflow-visible">
          <ReportFilterBar
            startDate={startDate}
            endDate={endDate}
            employeeId={employeeId}
            salonId={salonId}
            hideEmployeeFilter={true}
            hideSalonFilter={true}
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
        <p className='text-red-600 text-center py-10'>Failed to load data.</p>
      ) : (
        <div className='space-y-4'>
          {topServices?.map((service, i) => (
            <div
              key={i}
              className='flex flex-col gap-3 rounded-2xl bg-gray-50 p-4 transition hover:bg-gray-100 sm:flex-row sm:items-center sm:justify-between sm:p-5'>
              <div>
                <div className='font-medium text-gray-900'>{service.name}</div>
                <div className='text-sm text-gray-500'>
                  {service.count} services
                </div>
              </div>
              <div className='text-left sm:text-right'>
                <div className='text-lg font-semibold text-pink-600 sm:text-xl'>
                  +${service.revenue.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
