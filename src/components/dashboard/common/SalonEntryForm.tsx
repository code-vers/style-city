"use client";

import { useSalonsQuery } from "@/actions/admin/useSalons";
import { useServicesQuery } from "@/actions/admin/useServices";
import { useSizesQuery } from "@/actions/admin/useSizes";
import { useLengthsQuery } from "@/actions/admin/useLengths";
import { useUsersQuery } from "@/actions/admin/useUsers";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Calendar, Clock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export type SalonEntryFormValues = {
  salonId?: string;
  employeeId?: string;
  serviceId?: string;
  sizeId?: string;
  lengthId?: string;
  clientName?: string;
  totalPrice: number;
  actualPrice: number;
  tips?: number;
  addHair?: number;
  notes?: string;
  isSplit: boolean;
  splitPercentage?: number;
  createdAt?: string;
  splits: Array<{
    employeeId: string;
    totalPrice: number;
    tips?: number;
    splitPercentage?: number;
  }>;
};

interface SalonEntryFormProps {
  title: string;
  initialData?: Partial<SalonEntryFormValues>;
  onSubmit: (values: SalonEntryFormValues) => void;
  isPending?: boolean;
  submitButtonText?: string;
  variant?: "page" | "modal";
  onCancel?: () => void;
}

type SplitEntryState = {
  id: string;
  employeeId: string;
  totalPrice: string;
  tips: string;
  percentage: string;
};

const calculatePercentage = (value: number, total: number) => {
  if (total <= 0) return "0.00";
  return ((value / total) * 100).toFixed(2);
};

const distributeAmount = (amount: number, count: number) => {
  if (count <= 0) {
    return [] as string[];
  }

  const totalCents = Math.round(amount * 100);
  const baseCents = Math.floor(totalCents / count);
  const remainder = totalCents % count;

  return Array.from({ length: count }, (_value, index) => {
    const cents = baseCents + (index < remainder ? 1 : 0);
    return (cents / 100).toFixed(2);
  });
};

const redistributeAllSplits = (
  nextSplits: SplitEntryState[],
  nextActualAmount: number,
  nextTipAmount: number,
) => {
  if (nextSplits.length === 0) {
    return nextSplits;
  }

  const nextPrices = distributeAmount(nextActualAmount, nextSplits.length);
  const nextTips = distributeAmount(nextTipAmount, nextSplits.length);

  return nextSplits.map((split, index) => ({
    ...split,
    totalPrice: nextPrices[index],
    tips: nextTips[index],
    percentage: calculatePercentage(
      Number(nextPrices[index]),
      nextActualAmount,
    ),
  }));
};

export default function SalonEntryForm({
  title,
  initialData,
  onSubmit,
  isPending,
  submitButtonText = "Save Entry",
  variant = "page",
  onCancel,
}: SalonEntryFormProps) {
  const { user } = useAuth();
  const isAddMode = !initialData;
  const isAdminOrManager = user?.role === "admin" || user?.role === "manager";

  // State for Late Entry date/time correction
  const [entryDate, setEntryDate] = useState<string>("");
  const [entryTime, setEntryTime] = useState<string>("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (initialData?.createdAt) {
        const dateObj = new Date(initialData.createdAt);
        setEntryDate(formatInTimeZone(dateObj, "America/Chicago", "yyyy-MM-dd"));
        setEntryTime(formatInTimeZone(dateObj, "America/Chicago", "HH:mm"));
      } else {
        const now = new Date();
        setEntryDate(formatInTimeZone(now, "America/Chicago", "yyyy-MM-dd"));
        setEntryTime(formatInTimeZone(now, "America/Chicago", "HH:mm"));
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [initialData?.createdAt]);

  const [employeeValueState, setEmployeeValue] = useState<string>(
    initialData?.employeeId ?? "",
  );
  const [clientName, setClientName] = useState<string>(
    initialData?.clientName ?? "",
  );
  const [serviceNameValue, setServiceNameValue] = useState<string>(
    initialData?.serviceId ?? "",
  );
  const [sizeValue, setSizeValue] = useState<string>(
    initialData?.sizeId ?? "",
  );
  const [lengthValue, setLengthValue] = useState<string>(
    initialData?.lengthId ?? "",
  );
  const [salonValue, setSalonValue] = useState<string>(
    initialData?.salonId ?? "",
  );
  const [totalPrice, setTotalPrice] = useState<string>(
    initialData?.totalPrice ? String(initialData.totalPrice) : "",
  );
  const [tipValue, setTipValue] = useState<string>(
    initialData?.tips ? String(initialData.tips) : "",
  );
  const [notes, setNotes] = useState<string>(initialData?.notes ?? "");
  const [addHair, setAddHair] = useState<string>(
    initialData?.addHair ? String(initialData.addHair) : "",
  );
  const [splitService, setSplitService] = useState<boolean>(
    initialData?.isSplit ?? false,
  );

  const actualServiceAmount = useMemo(() => {
    const total = Number(totalPrice) || 0;
    const hair = Number(addHair) || 0;
    return Math.max(0, total - hair);
  }, [totalPrice, addHair]);

  const [splits, setSplits] = useState<SplitEntryState[]>(
    initialData?.splits?.map((s, idx) => {
      // Calculate total from splits if actualPrice is missing or 0
      const totalFromSplits =
        initialData?.splits?.reduce(
          (acc, split) => acc + (Number(split.totalPrice) || 0),
          0,
        ) || 0;
      const baseTotal =
        initialData.actualPrice || totalFromSplits || actualServiceAmount || 0;

      const percentage =
        s.splitPercentage != null
          ? Number(s.splitPercentage).toFixed(2)
          : calculatePercentage(s.totalPrice, baseTotal);

      return {
        id: `split-${idx}`,
        employeeId: s.employeeId,
        totalPrice: String(s.totalPrice),
        tips: String(s.tips ?? 0),
        percentage,
      };
    }) ?? [],
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEmployee = user?.role === "employee";
  const canEditSplitAmounts =
    user?.role === "admin" || user?.role === "manager";
  const employeeValue = isEmployee ? (user?.id ?? "") : employeeValueState;

  const { data: salonsData, isLoading: isLoadingSalons } = useSalonsQuery({
    page: 1,
    limit: 100,
    searchTerm: "",
  });

  const { data: servicesData, isLoading: isLoadingServices } = useServicesQuery(
    {
      page: 1,
      limit: 100,
      searchTerm: "",
    },
  );

  const { data: sizesData, isLoading: isLoadingSizes } = useSizesQuery(
    {
      page: 1,
      limit: 100,
      searchTerm: "",
    },
  );

  const { data: lengthsData, isLoading: isLoadingLengths } = useLengthsQuery(
    {
      page: 1,
      limit: 100,
      searchTerm: "",
    },
  );

  const {
    data: usersData,
    isLoading: isLoadingUsers,
    isFetching: isFetchingUsers,
  } = useUsersQuery({
    page: 1,
    limit: 500,
    searchTerm: "",
    role: "EMPLOYEE,MANAGER",
    status: "ACTIVE",
    enabled: true,
  });

  useEffect(() => {
    if (usersData?.data) {
      console.log(
        "DEBUG: Fetched users for SalonEntryForm:",
        usersData.data.map((u: any) => ({
          name: u.fullName,
          status: u.status,
          role: u.role,
        })),
      );
    }
  }, [usersData]);

  const loadingEmployees = isLoadingUsers || isFetchingUsers;

  const salons = salonsData?.data || [];
  const services = servicesData?.data || [];
  const sizes = sizesData?.data || [];
  const lengths = lengthsData?.data || [];
  const employees = usersData?.data || [];

  const handleSplitChange = (
    index: number,
    field: "totalPrice" | "tips" | "percentage",
    value: string,
  ) => {
    if (!canEditSplitAmounts) return;

    setSplits((prev) => {
      const next = [...prev];
      const row = { ...next[index] };
      const totalS = actualServiceAmount;
      const totalT = Number(tipValue) || 0;

      if (field === "percentage") {
        row.percentage = value;
        const pNum = Number(value) || 0;
        row.totalPrice = ((pNum / 100) * totalS).toFixed(2);
        row.tips = ((pNum / 100) * totalT).toFixed(2);
      } else if (field === "totalPrice") {
        row.totalPrice = value;
        const vNum = Number(value) || 0;
        const newP = totalS > 0 ? (vNum / totalS) * 100 : 0;
        row.percentage = newP.toFixed(2);
        row.tips = ((newP / 100) * totalT).toFixed(2);
      } else if (field === "tips") {
        row.tips = value;
        const tNum = Number(value) || 0;
        const newP = totalT > 0 ? (tNum / totalT) * 100 : 0;
        row.percentage = newP.toFixed(2);
        row.totalPrice = ((newP / 100) * totalS).toFixed(2);
      }

      next[index] = row;
      return next;
    });

    setErrors((prev) => ({
      ...prev,
      [`splitPrice_${index}`]: "",
      splitsPrice: "",
      splitsTips: "",
      splitsPercentage: "",
    }));
  };

  // Auto-update split dollar amounts when main amounts change, keeping percentages fixed
  useEffect(() => {
    if (splitService && splits.length > 0) {
      const timeoutId = window.setTimeout(() => {
        setSplits((prev) => {
          const totalS = actualServiceAmount;
          const totalT = Number(tipValue) || 0;

          // Check if amounts actually changed
          const totalSplitsPrice = prev.reduce(
            (sum, s) => sum + (Number(s.totalPrice) || 0),
            0,
          );
          const totalSplitsTips = prev.reduce(
            (sum, s) => sum + (Number(s.tips) || 0),
            0,
          );

          if (
            Math.abs(totalSplitsPrice - totalS) > 0.001 ||
            Math.abs(totalSplitsTips - totalT) > 0.001
          ) {
            return prev.map((split) => ({
              ...split,
              totalPrice: ((Number(split.percentage) / 100) * totalS).toFixed(
                2,
              ),
              tips: ((Number(split.percentage) / 100) * totalT).toFixed(2),
            }));
          }
          return prev;
        });
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [actualServiceAmount, tipValue, splitService, splits.length]);

  const handleAddBraider = () => {
    const newSplits = [
      ...splits,
      {
        id: Date.now().toString(),
        employeeId: "",
        totalPrice: "",
        tips: "",
        percentage: "0.00",
      },
    ];

    setSplits(
      redistributeAllSplits(
        newSplits,
        actualServiceAmount,
        Number(tipValue) || 0,
      ),
    );
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!salonValue) newErrors.salon = "Salon is required";
    if (!employeeValue) newErrors.employee = "Employee is required";
    if (!serviceNameValue) newErrors.service = "Service is required";
    if (!clientName || clientName.trim() === "")
      newErrors.clientName = "Client name is required";
    if (!totalPrice) newErrors.totalPrice = "Total price is required";
    if (!notes || notes.trim() === "") newErrors.notes = "Notes are required";

    if (splitService) {
      const totalPercentageSum = splits.reduce(
        (sum, s) => sum + (Number(s.percentage) || 0),
        0,
      );

      // We allow a small margin for floating point errors (e.g., 33.33 * 3 = 99.99)
      if (Math.abs(totalPercentageSum - 100) > 0.05) {
        newErrors.splitsPercentage = `Total split percentage must equal 100%. Current total: ${totalPercentageSum.toFixed(2)}%`;
      }

      const totalSplitsPrice = splits.reduce(
        (sum, s) => sum + (Number(s.totalPrice) || 0),
        0,
      );
      const totalSplitsTips = splits.reduce(
        (sum, s) => sum + (Number(s.tips) || 0),
        0,
      );

      if (Math.abs(totalSplitsPrice - actualServiceAmount) > 0.1) {
        newErrors.splitsPrice = `Sum of splits ($${totalSplitsPrice.toFixed(2)}) does not match actual service amount ($${actualServiceAmount.toFixed(2)})`;
      }

      if (Math.abs(totalSplitsTips - (Number(tipValue) || 0)) > 0.1) {
        newErrors.splitsTips = `Sum of split tips ($${totalSplitsTips.toFixed(2)}) does not match total tip ($${(Number(tipValue) || 0).toFixed(2)})`;
      }

      splits.forEach((s, i) => {
        if (!s.employeeId) newErrors[`splitEmployee_${i}`] = "Required";
        if (!s.totalPrice) newErrors[`splitPrice_${i}`] = "Required";
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      const firstError = Object.values(errors).find(Boolean);
      toast.error(firstError || "Please fix the errors in the form.");
      return;
    }

    const formattedSplits = splits.map((s) => ({
      employeeId: s.employeeId,
      totalPrice: Number(s.totalPrice) || 0,
      tips: s.tips === "" || s.tips === undefined ? 0 : Number(s.tips),
      splitPercentage: Number(s.percentage) || 0,
    }));

    // Calculate main employee split percentage (remaining from others)
    const otherSplitsPercentage = formattedSplits
      .filter((s) => s.employeeId !== employeeValue)
      .reduce((sum, s) => sum + (s.splitPercentage || 0), 0);
    const mainSplitPercentage = Math.max(0, 100 - otherSplitsPercentage);

    // Combine date and time for Admin/Manager correction
    let finalCreatedAt: string | undefined = undefined;
    if (isAdminOrManager && entryDate && entryTime) {
      // Create date object in Chicago time and convert to UTC ISO string
      // NOTE: Using space instead of T to ensure date-fns-tz treats it as a floating time
      const chicagoDateTime = `${entryDate} ${entryTime}:00`;
      finalCreatedAt = fromZonedTime(
        chicagoDateTime,
        "America/Chicago",
      ).toISOString();
    }

    const values: SalonEntryFormValues = {
      salonId: salonValue,
      employeeId: employeeValue,
      serviceId: serviceNameValue,
      sizeId: sizeValue || undefined,
      lengthId: lengthValue || undefined,
      clientName: clientName || undefined,
      totalPrice: Number(totalPrice),
      actualPrice: actualServiceAmount,
      tips: tipValue === "" ? 0 : Number(tipValue),
      addHair: addHair === "" ? 0 : Number(addHair),
      notes: notes || undefined,
      isSplit: splitService,
      splitPercentage: mainSplitPercentage,
      createdAt: finalCreatedAt,
      splits: splitService ? formattedSplits : [],
    };
    onSubmit(values);
  };

  const inputClasses =
    "h-11 rounded-lg border-gray-200 focus:ring-pink-500 focus:border-pink-500 px-3";
  const labelClasses = "text-sm font-semibold text-gray-700 mb-1 block";
  const errorClasses = "text-xs text-red-500 mt-1";

  const isModalVariant = variant === "modal";

  return (
    <div
      className={isModalVariant ? "w-full" : "min-h-screen p-2 md:p-4 bg-gray-50/30"}>
      <Card
        className={
          isModalVariant
            ? "mx-auto w-full max-w-5xl rounded-3xl border-0 shadow-xl shadow-gray-200/50 bg-white"
            : "mx-auto p-3 md:p-8 rounded-3xl border-0 shadow-xl shadow-gray-200/50 bg-white"
        }>
        <CardHeader className='pb-2'>
          <CardTitle className='text-3xl font-bold text-gray-900'>
            {title}
          </CardTitle>
          <p className='text-gray-500 text-sm'>
            Fill in the details for the salon service entry.
          </p>
        </CardHeader>

        <CardContent className='pt-6'>
          <form onSubmit={handleSubmit} className='space-y-10'>
            <div className='space-y-6'>
              {/* Date and Time Fields for Admin/Manager Edit Mode */}
              {!isAddMode && isAdminOrManager && (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-8 bg-pink-50/30 p-6 rounded-2xl border border-pink-100/50'>
                  <div className='w-full'>
                    <label className={labelClasses + " text-pink-700"}>
                      <span className='flex items-center gap-2'>
                        <Calendar size={16} />
                        Entry Date <span className='text-red-500'>*</span>
                      </span>
                    </label>
                    <Input
                      type='date'
                      value={entryDate}
                      onChange={(e) => setEntryDate(e.target.value)}
                      className={inputClasses + " bg-white border-pink-200"}
                      required
                    />
                  </div>
                  <div className='w-full'>
                    <label className={labelClasses + " text-pink-700"}>
                      <span className='flex items-center gap-2'>
                        <Clock size={16} />
                        Entry Time <span className='text-red-500'>*</span>
                      </span>
                    </label>
                    <Input
                      type='time'
                      value={entryTime}
                      onChange={(e) => setEntryTime(e.target.value)}
                      className={inputClasses + " bg-white border-pink-200"}
                      required
                    />
                  </div>
                  <div className='md:col-span-2'>
                    <p className='text-xs text-pink-600 font-medium italic'>
                      * Correcting the date/time will reposition this entry
                      chronologically in all reports and history (using Chicago
                      Time).
                    </p>
                  </div>
                </div>
              )}

              <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                <div className='w-full'>
                  <label className={labelClasses}>
                    Salon Name <span className='text-red-500'>*</span>
                  </label>
                  <Select
                    value={salonValue || ""}
                    onValueChange={(v) => {
                      setSalonValue(v ?? "");
                      setErrors((prev) => ({ ...prev, salon: "" }));
                    }}>
                    <SelectTrigger className={inputClasses + " w-full px-3"}>
                      <SelectValue
                        placeholder={
                          isLoadingSalons
                            ? "Loading salons..."
                            : "Select a salon"
                        }>
                        {salons.find((s: any) => s.id === salonValue)?.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {salons.map((salon: any) => (
                        <SelectItem key={salon.id} value={salon.id}>
                          {salon.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.salon && (
                    <p className={errorClasses}>{errors.salon}</p>
                  )}
                </div>

                <div className='w-full'>
                  <label className={labelClasses}>
                    Employee name <span className='text-red-500'>*</span>
                  </label>
                  <Select
                    value={employeeValue || ""}
                    onValueChange={(v) => {
                      const nextEmployee = v ?? "";
                      setEmployeeValue(nextEmployee);

                      if (isAddMode && splitService && splits.length > 0) {
                        setSplits((prev) => {
                          if (prev.length === 0 || !nextEmployee) {
                            return prev;
                          }

                          if (prev[0].employeeId === nextEmployee) {
                            return prev;
                          }

                          const next = [...prev];
                          next[0] = { ...next[0], employeeId: nextEmployee };
                          return next;
                        });
                      }

                      setErrors((prev) => ({ ...prev, employee: "" }));
                    }}
                    disabled={isEmployee && !!user?.id}>
                    <SelectTrigger className={inputClasses + " w-full px-3"}>
                      <SelectValue
                        placeholder={
                          loadingEmployees
                            ? "Loading employees..."
                            : "Select an employee"
                        }>
                        {employeeValue
                          ? employees.find((e: any) => e.id === employeeValue)
                              ?.fullName || "Loading..."
                          : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee: any) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.fullName} ({employee.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.employee && (
                    <p className={errorClasses}>{errors.employee}</p>
                  )}
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                <div className='w-full'>
                  <label className={labelClasses}>
                    Service name <span className='text-red-500'>*</span>
                  </label>
                  <Select
                    value={serviceNameValue || ""}
                    onValueChange={(v) => {
                      setServiceNameValue(v ?? "");
                      setErrors((prev) => ({ ...prev, service: "" }));
                    }}>
                    <SelectTrigger className={inputClasses + " w-full px-3"}>
                      <SelectValue
                        placeholder={
                          isLoadingServices
                            ? "Loading services..."
                            : "Select a service"
                        }>
                        {
                          services.find((s: any) => s.id === serviceNameValue)
                            ?.name
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service: any) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.service && (
                    <p className={errorClasses}>{errors.service}</p>
                  )}
                </div>

                <div className='w-full grid grid-cols-2 gap-4'>
                  <div className='w-full'>
                    <label className={labelClasses}>Size</label>
                    <Select
                      value={sizeValue || ""}
                      onValueChange={(v) => setSizeValue(v === "none" ? "" : (v || ""))}>
                      <SelectTrigger className={inputClasses + " w-full px-3"}>
                        <SelectValue
                          placeholder={
                            isLoadingSizes ? "Loading..." : "Select size"
                          }>
                          {sizes.find((s: any) => s.id === sizeValue)?.name}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-gray-400 italic">None</SelectItem>
                        {sizes.map((size: any) => (
                          <SelectItem key={size.id} value={size.id}>
                            {size.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='w-full'>
                    <label className={labelClasses}>Length</label>
                    <Select
                      value={lengthValue || ""}
                      onValueChange={(v) => setLengthValue(v === "none" ? "" : (v || ""))}>
                      <SelectTrigger className={inputClasses + " w-full px-3"}>
                        <SelectValue
                          placeholder={
                            isLoadingLengths ? "Loading..." : "Select length"
                          }>
                          {lengths.find((l: any) => l.id === lengthValue)?.name}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-gray-400 italic">None</SelectItem>
                        {lengths.map((length: any) => (
                          <SelectItem key={length.id} value={length.id}>
                            {length.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                <div className='w-full'>
                  <label className={labelClasses}>
                    Client Name <span className='text-red-500'>*</span>
                  </label>
                  <Input
                    value={clientName || ""}
                    onChange={(e) => {
                      setClientName(e.target.value);
                      setErrors((prev) => ({ ...prev, clientName: "" }));
                    }}
                    placeholder='Enter client name'
                    className={inputClasses}
                  />
                  {errors.clientName && (
                    <p className={errorClasses}>{errors.clientName}</p>
                  )}
                </div>
                <div className='space-y-2'>
                  <label className={labelClasses}>
                    Total price (Client Payment){" "}
                    <span className='text-red-500'>*</span>
                  </label>
                  <Input
                    value={totalPrice || ""}
                    onChange={(e) => {
                      setTotalPrice(e.target.value);
                      setErrors((prev) => ({ ...prev, totalPrice: "" }));
                    }}
                    placeholder='$ 0.00'
                    type='number'
                    step='any'
                    min='0'
                    className={inputClasses}
                  />
                  {errors.totalPrice && (
                    <p className={errorClasses}>{errors.totalPrice}</p>
                  )}
                </div>
              </div>
            </div>

            <div className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                <div className='space-y-2'>
                  <label className={labelClasses + " text-pink-600"}>
                    Hair
                  </label>
                  <Input
                    value={addHair || ""}
                    onChange={(e) => {
                      setAddHair(e.target.value);
                    }}
                    placeholder='$ 0.00'
                    type='number'
                    step='any'
                    min='0'
                    className={inputClasses}
                  />
                </div>

                <div className='space-y-2'>
                  <label className={labelClasses}>Tip (Optional)</label>
                  <Input
                    value={tipValue || ""}
                    onChange={(e) => {
                      setTipValue(e.target.value);
                    }}
                    placeholder='$ 0.00'
                    type='number'
                    step='any'
                    min='0'
                    className={inputClasses}
                  />
                </div>

                <div className='flex items-center justify-end md:col-span-2'>
                  <p className='text-sm font-medium text-gray-500'>
                    Actual Service Amount:{" "}
                    <span className='text-gray-900 font-bold'>
                      ${actualServiceAmount.toFixed(2)}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className='space-y-2'>
              <label className={labelClasses}>
                Notes <span className='text-red-500'>*</span>
              </label>
              <Textarea
                value={notes || ""}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setErrors((prev) => ({ ...prev, notes: "" }));
                }}
                placeholder='Add notes here...'
                className='min-h-24 rounded-xl border-gray-200 focus:ring-pink-500 focus:border-pink-500 px-3 py-2'
              />
              {errors.notes && <p className={errorClasses}>{errors.notes}</p>}
            </div>

            <div className='space-y-6 pt-4'>
              <div className='flex items-center justify-between p-1'>
                <div>
                  <h3 className='text-lg font-bold text-gray-900'>
                    Split Service/Tip among Braiders?
                  </h3>
                  <p className='text-sm text-gray-500'>
                    Enable this to distribute earnings across multiple team
                    members.
                  </p>
                </div>
                <Switch
                  checked={splitService}
                  onCheckedChange={(checked) => {
                    setSplitService(checked);

                    if (checked && splits.length === 0) {
                      setSplits([
                        {
                          id: "initial-split",
                          employeeId: employeeValue,
                          totalPrice: String(actualServiceAmount),
                          tips: tipValue || "0",
                          percentage: "100.00",
                        },
                      ]);
                    }

                    if (!checked) {
                      setSplits([]);
                    }
                  }}
                />
              </div>

              {splitService && (
                <div className='space-y-6 animate-in fade-in slide-in-from-top-4 duration-300'>
                  <div className='overflow-x-auto -mx-6 px-6'>
                    <table className='w-full min-w-150'>
                      <thead className='bg-gray-50/50'>
                        <tr>
                          <th className='px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 w-1/2'>
                            Braider Name
                          </th>
                          <th className='px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 w-1/6'>
                            Service $
                          </th>
                          <th className='px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 w-1/6'>
                            Tip $
                          </th>
                          <th className='px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 w-1/6'>
                            Percentage %
                          </th>
                          <th className='px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-500 w-16'>
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-gray-50'>
                        {splits.map((split, index) => (
                          <tr
                            key={split.id}
                            className='hover:bg-gray-50/30 transition-colors'>
                            <td className='px-4 py-3'>
                              <Select
                                value={split.employeeId || ""}
                                disabled={isAddMode && index === 0}
                                onValueChange={(val) => {
                                  if (isAddMode && index === 0) {
                                    return;
                                  }

                                  const nextSplits = [...splits];
                                  nextSplits[index].employeeId = val ?? "";
                                  setSplits(nextSplits);
                                  setErrors((prev) => ({
                                    ...prev,
                                    [`splitEmployee_${index}`]: "",
                                  }));
                                }}>
                                <SelectTrigger
                                  className={
                                    "h-10 w-full rounded-md border-gray-200 bg-white px-2 text-sm"
                                  }>
                                  <SelectValue placeholder='Select'>
                                    {
                                      employees.find(
                                        (e: any) => e.id === split.employeeId,
                                      )?.fullName
                                    }
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {employees.map((employee: any) => (
                                    <SelectItem
                                      key={employee.id}
                                      value={employee.id}>
                                      {employee.fullName} ({employee.role})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {errors[`splitEmployee_${index}`] && (
                                <p className={errorClasses}>
                                  {errors[`splitEmployee_${index}`]}
                                </p>
                              )}
                            </td>
                            <td className='px-4 py-3'>
                              <Input
                                value={split.totalPrice || ""}
                                disabled={!canEditSplitAmounts}
                                onChange={(e) =>
                                  handleSplitChange(
                                    index,
                                    "totalPrice",
                                    e.target.value,
                                  )
                                }
                                placeholder='0.00'
                                type='number'
                                step='any'
                                min='0'
                                className='h-10 w-full rounded-md border-gray-200 bg-white px-2 text-sm'
                              />
                            </td>
                            <td className='px-4 py-3'>
                              <Input
                                value={split.tips || ""}
                                disabled={!canEditSplitAmounts}
                                onChange={(e) =>
                                  handleSplitChange(
                                    index,
                                    "tips",
                                    e.target.value,
                                  )
                                }
                                placeholder='0.00'
                                type='number'
                                step='any'
                                min='0'
                                className='h-10 w-full rounded-md border-gray-200 bg-white px-2 text-sm'
                              />
                            </td>
                            <td className='px-4 py-3'>
                              {canEditSplitAmounts ? (
                                <div className='relative'>
                                  <Input
                                    value={split.percentage || ""}
                                    onChange={(e) =>
                                      handleSplitChange(
                                        index,
                                        "percentage",
                                        e.target.value,
                                      )
                                    }
                                    placeholder='0.00'
                                    type='number'
                                    step='any'
                                    min='0'
                                    max='100'
                                    className='h-10 w-full rounded-md border-gray-200 bg-white px-2 text-sm pr-6'
                                  />
                                  <span className='absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs'>
                                    %
                                  </span>
                                </div>
                              ) : (
                                <div
                                  className={
                                    "h-10 w-full rounded-md border-gray-200 bg-gray-50 flex items-center px-2 text-gray-500 text-sm"
                                  }>
                                  {split.percentage || "0.00"}%
                                </div>
                              )}
                            </td>
                            <td className='px-4 py-3 text-right'>
                              <Button
                                type='button'
                                variant='ghost'
                                size='icon'
                                onClick={() => {
                                  const nextSplits = splits.filter(
                                    (_split, i) => i !== index,
                                  );

                                  setSplits(
                                    redistributeAllSplits(
                                      nextSplits,
                                      actualServiceAmount,
                                      Number(tipValue) || 0,
                                    ),
                                  );
                                  setErrors((prev) => {
                                    const nextErrors = { ...prev };
                                    delete nextErrors[`splitEmployee_${index}`];
                                    delete nextErrors[`splitPrice_${index}`];
                                    delete nextErrors.splitsPrice;
                                    delete nextErrors.splitsTips;
                                    delete nextErrors.splitsPercentage;
                                    return nextErrors;
                                  });
                                }}
                                className='h-8 w-8 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors'>
                                <Trash2 className='h-4 w-4' />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {splits.length === 0 && (
                    <div className='py-12 text-center text-gray-400 bg-white'>
                      No braiders added. Use the button below to start
                      splitting.
                    </div>
                  )}

                  <div className='flex flex-col gap-2'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={handleAddBraider}
                      className='w-fit h-11 px-6 rounded-xl border-dashed border-2 border-gray-200 text-pink-600 hover:border-pink-500 hover:bg-pink-50/30 transition-all'>
                      <span className='text-xl mr-2'>+</span>
                      Add Braider to Split
                    </Button>
                    {errors.splitsPercentage && (
                      <p className={errorClasses}>{errors.splitsPercentage}</p>
                    )}
                    {errors.splitsPrice && (
                      <p className={errorClasses}>{errors.splitsPrice}</p>
                    )}
                    {errors.splitsTips && (
                      <p className={errorClasses}>{errors.splitsTips}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className='flex items-center justify-end gap-4 pt-8 border-t border-gray-100'>
              <Button
                type='button'
                variant='ghost'
                className='h-12 px-8 rounded-xl text-gray-500 hover:bg-gray-100'
                onClick={() => {
                  if (onCancel) {
                    onCancel();
                    return;
                  }

                  window.history.back();
                }}>
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={isPending}
                className='h-12 px-10 rounded-xl bg-pink-600 text-white font-bold shadow-lg shadow-pink-200 hover:bg-pink-700 active:scale-95 transition-all'>
                {isPending ? "Saving..." : submitButtonText}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
