"use client";

import React, { useState } from "react";
import type { PayrollRow } from "@/actions/payroll/payroll.types";
import { ChevronDown, ChevronRight, CheckCircle } from "lucide-react";
import { useMarkPaidMutation } from "@/actions/payroll/usePayroll";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExpandedEmployeeHistory } from "./ExpandedEmployeeHistory";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

interface PayrollAccordionTableProps {
  data: PayrollRow[];
  isLoading?: boolean;
  emptyMessage?: string;
  startDate?: string;
  endDate?: string;
}

export function PayrollAccordionTable({
  data,
  isLoading = false,
  emptyMessage = "No payroll records found for these filters.",
  startDate,
  endDate,
}: PayrollAccordionTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedEmployeeForPaid, setSelectedEmployeeForPaid] = useState<string | null>(null);

  const markPaidMutation = useMarkPaidMutation();

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const paginated = data.slice((page - 1) * pageSize, page * pageSize);

  const toggleRow = (employeeId: string) => {
    setExpandedRow((prev) => (prev === employeeId ? null : employeeId));
  };

  const handleMarkPaidClick = (employeeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEmployeeForPaid(employeeId);
    setConfirmModalOpen(true);
  };

  const confirmMarkPaid = () => {
    if (!selectedEmployeeForPaid) return;
    
    markPaidMutation.mutate({
      employeeId: selectedEmployeeForPaid,
      startDate,
      endDate
    }, {
      onSuccess: () => {
        toast.success("Successfully marked as paid!");
        setConfirmModalOpen(false);
        setSelectedEmployeeForPaid(null);
      },
      onError: () => toast.error("Failed to mark as paid.")
    });
  };

  return (
    <div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden'>
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark all unpaid earnings for this employee in the selected timeframe as Paid? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <button 
              onClick={() => setConfirmModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={confirmMarkPaid}
              disabled={markPaidMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {markPaidMutation.isPending ? "Processing..." : "Mark as Paid"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="p-4 md:p-6 pb-2 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Payroll</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-600">
              <th className="py-3 px-4 font-medium w-10"></th>
              <th className="py-3 px-4 font-medium">Employee</th>
              <th className="py-3 px-4 font-medium">Total Service</th>
              <th className="py-3 px-4 font-medium">Commission Rate</th>
              <th className="py-3 px-4 font-medium">Service Charge</th>
              <th className="py-3 px-4 font-medium">Commission Earnings</th>
              <th className="py-3 px-4 font-medium">Total Tips</th>
              <th className="py-3 px-4 font-medium">Total Earnings</th>
              <th className="py-3 px-4 font-medium text-green-700">Paid</th>
              <th className="py-3 px-4 font-medium text-red-600">Unpaid</th>
              <th className="py-3 px-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
                    Loading payroll data...
                  </div>
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginated.map((row) => {
                const isExpanded = expandedRow === row.employeeId;
                
                return (
                  <React.Fragment key={row.employeeId}>
                    <tr 
                      onClick={() => toggleRow(row.employeeId)}
                      className={`hover:bg-gray-50/50 cursor-pointer transition-colors ${isExpanded ? 'bg-gray-50/30' : ''}`}
                    >
                      <td className="py-4 px-4 text-gray-400">
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </td>
                      <td className="py-4 px-4 font-medium text-gray-900">{row.employeeName}</td>
                      <td className="py-4 px-4 text-gray-600">{row.totalOccurrences}</td>
                      <td className="py-4 px-4 font-medium text-gray-900">{row.commissionRate}%</td>
                      <td className="py-4 px-4 font-medium text-slate-700">{formatCurrency(row.serviceCharge)}</td>
                      <td className="py-4 px-4 font-medium text-sky-600">{formatCurrency(row.commissionEarnings)}</td>
                      <td className="py-4 px-4 font-medium text-green-600">{formatCurrency(row.totalTips)}</td>
                      <td className="py-4 px-4 font-bold text-gray-900 text-[15px]">{formatCurrency(row.earnings)}</td>
                      <td className="py-4 px-4 font-medium text-green-700">{formatCurrency(row.paidEarnings || 0)}</td>
                      <td className="py-4 px-4 font-medium text-red-600">{formatCurrency(row.unpaidEarnings || 0)}</td>
                      <td className="py-4 px-4 text-right">
                        <button 
                          onClick={(e) => handleMarkPaidClick(row.employeeId, e)}
                          disabled={!row.unpaidEarnings || markPaidMutation.isPending}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-pink-600 rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 ml-auto"
                        >
                          <CheckCircle size={14} /> Mark Paid
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-gray-50/30">
                        <td colSpan={11} className="p-0 border-t border-gray-100">
                          <div className="p-4 md:p-6 pb-8 border-l-2 border-pink-400">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4 px-2">
                              Service History Breakdown for {row.employeeName}
                            </h3>
                            <ExpandedEmployeeHistory
                              employeeId={row.employeeId}
                              startDate={startDate}
                              endDate={endDate}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 16px",
          borderTop: "1px solid #f5f4fa",
          fontSize: 13,
          color: "#9999b5",
        }}>
        <span className='py-4'>
          Showing {data.length === 0 ? 0 : (page - 1) * pageSize + 1} to{" "}
          {Math.min(page * pageSize, data.length)} of {data.length} records
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: "5px 14px",
              borderRadius: 7,
              border: "1px solid #ece9f1",
              background: page === 1 ? "#faf9fd" : "#fff",
              cursor: page === 1 ? "not-allowed" : "pointer",
              fontSize: 13,
              color: page === 1 ? "#ccc" : "#6b6b8a",
            }}>
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
            )
            .reduce<(number | "...")[]>((acc, p, i, arr) => {
              if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === "..." ? (
                <span
                  key={`e-${i}`}
                  style={{ padding: "5px 4px", color: "#ccc" }}>
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  style={{
                    padding: "5px 10px",
                    borderRadius: 7,
                    background: page === p ? "#D13C92" : "#fff",
                    color: page === p ? "#fff" : "#6b6b8a",
                    cursor: "pointer",
                    fontWeight: page === p ? 600 : 400,
                    fontSize: 13,
                  }}>
                  {p}
                </button>
              ),
            )}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: "5px 14px",
              borderRadius: 7,
              border: "1px solid #ece9f1",
              background: page === totalPages ? "#faf9fd" : "#fff",
              cursor: page === totalPages ? "not-allowed" : "pointer",
              fontSize: 13,
              color: page === totalPages ? "#ccc" : "#6b6b8a",
            }}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
