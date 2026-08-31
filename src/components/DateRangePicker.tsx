import React, { useEffect, useState } from 'react';
import ReactDatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { CalendarDays } from 'lucide-react';

interface Props {
  startDate: Date;
  endDate: Date;
  onChange: (range: { startDate: Date; endDate: Date }) => void;
}

export default function DateRangePicker({ startDate, endDate, onChange }: Props) {
  const [draftStart, setDraftStart] = useState<Date | null>(startDate);
  const [draftEnd, setDraftEnd] = useState<Date | null>(endDate);

  useEffect(() => {
    setDraftStart(startDate);
  }, [startDate]);
  useEffect(() => {
    setDraftEnd(endDate);
  }, [endDate]);

  const handleChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    setDraftStart(start);
    setDraftEnd(end);
    if (start && end) {
      const sFixed = new Date(start);
      sFixed.setHours(0, 0, 0, 0);
      const eFixed = new Date(end);
      eFixed.setHours(23, 59, 59, 999);
      onChange({ startDate: sFixed, endDate: eFixed });
    }
  };

  return (
    <div className="relative inline-block">
      <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-darkbg-lighter rounded-xl border border-gray-200 dark:border-darkbg shadow-sm hover:border-primary/20 dark:hover:border-secondary/20 focus-within:border-primary/20 dark:focus-within:border-secondary/20 transition-colors">
        <CalendarDays className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        <ReactDatePicker
          selectsRange
          startDate={draftStart}
          endDate={draftEnd}
          onChange={handleChange}
          shouldCloseOnSelect={false}
          placeholderText="Selecciona rango"
          dateFormat="dd/MM/yyyy"
          className="border-none focus:ring-0 p-0 text-sm bg-transparent dark:text-white"
          wrapperClassName="!block"
        />
      </div>
    </div>
  );
}