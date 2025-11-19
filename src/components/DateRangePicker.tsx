import React from 'react';
import ReactDatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { CalendarDays } from 'lucide-react';

interface Props {
  startDate: Date;
  endDate: Date;
  onChange: (range: { startDate: Date; endDate: Date }) => void;
}

export default function DateRangePicker({ startDate, endDate, onChange }: Props) {
  return (
    <div className="relative inline-block">
      <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-darkbg-lighter rounded-xl border border-gray-200 dark:border-darkbg shadow-sm hover:border-primary/20 dark:hover:border-secondary/20 focus-within:border-primary/20 dark:focus-within:border-secondary/20 transition-colors">
        <CalendarDays className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        <ReactDatePicker
          selectsRange
          startDate={startDate}
          endDate={endDate}
          onChange={(dates) => {
            const [start, end] = dates;
            if (start && end) {
              onChange({ startDate: start, endDate: end });
            }
          }}
          dateFormat="dd/MM/yyyy"
          className="border-none focus:ring-0 p-0 text-sm bg-transparent dark:text-white"
          wrapperClassName="!block"
        />
      </div>
    </div>
  );
}